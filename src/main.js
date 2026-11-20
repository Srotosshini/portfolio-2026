// Scene setup, the render loop, and getting from the shelf into a box and back.
import * as THREE from 'three'
import { site } from './data/projects.js'
import { createStepped } from './lib/stepped.js'
import { createRig, FULL } from './lib/camera.js'
import { createOverlay } from './lib/overlay.js'
import { boil, PALETTE, unsent, later } from './lib/paper.js'
import { files, onAssetLoaded, turn, setBudget, work } from './lib/assets.js'
import { itemExists } from './lib/pages.js'
import { sound } from './lib/sound.js'
import { buildShelf } from './shelf.js'
import { buildDelivery, LIFT } from './lib/delivery.js'

// One file per room. A room's code and drawings are fetched once the shelf
// is up (or the first time its box is opened or hovered).
//   card: the room always has its paper card open beside it (About)
//   whole: always frame the whole room; it uses sideways drags itself
//   slim: its pages are caption slips, not full project cards
//   focus, fit: how the camera frames the room (see box.view in shelf.js)
//   narrow: on a tall screen, how much of a whole room's width stays in view
//   inPlace: an opened item is held up over the room by the room itself (a
//            trading card); the camera stays where it is
//   bare:    an opened item has no paper card: the camera goes to it and the
//            room shows its own buttons (inside a market stall). On a narrow
//            screen it can be swiped sideways, like a room.
//   perUnit: on a narrow screen, at most this many pixels across per scene unit
//            (how close the camera comes before the room has to be swiped)
//   early:   made as soon as the shelf is up, so its box shows its whole
//            scene on the shelf and then plays its loop there (see lib/loop.js)
const ROOMS = {
  games: { load: () => import('./rooms/arcade.js'), early: true },
  photography: { load: () => import('./rooms/photography.js'), whole: true, slim: true, early: true, focus: 0.3, fit: 1.05 },
  'creative-coding': { load: () => import('./rooms/creative-coding.js'), whole: true, inPlace: true, early: true, focus: 0.32, fit: 1.1, narrow: 0.96 },
  design: { load: () => import('./rooms/design.js'), bare: true, early: true, focus: 0.42, fit: 1.04, perUnit: 150 },
  about: { load: () => import('./rooms/about.js'), early: true, focus: 0.42, fit: 1.12, perUnit: 150 },
}

// Inside a box the camera sits a little above centre and looks down, the way
// you peer into a shoebox on a shelf.
const ROOM_LIFT = 0.12

// The lamp: upper left, in front of the shelf. Shadows fall back and to the right.
const LAMP_FROM = new THREE.Vector3(-0.3, 0.5, 1).normalize()
const SHADOW_SOFTNESS = 0.034 // how wide a shadow's soft edge is, in scene units

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

start().catch((error) => {
  // No WebGL (or something broke): the list view has everything.
  console.error(error)
  document.querySelector('#loader')?.remove()
  document.body.classList.remove('is-unpacking')
  if (!import.meta.env.DEV) location.replace('list.html')
})

async function start() {
  const canvas = document.querySelector('#scene')
  // `alpha` so a clip placed behind the canvas can show through a cut-out screen
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  // Checking every new shader for errors makes the page wait for each one to
  // finish compiling. Useful while working on the site, a stall on the live one.
  renderer.debug.checkShaderErrors = import.meta.env.DEV
  renderer.localClippingEnabled = true // the display case's cellophane slides up into its frame
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  // Shadows only change when something in the scene moves, never when only
  // the camera does, so they are redrawn on demand (see `shadowsStale`).
  renderer.shadowMap.autoUpdate = false

  // How sharp the picture is: the screen's own pixel density (up to 2). A
  // slow graphics chip lowers it a step at a time when camera glides start
  // dropping frames, so the glide stays a glide, and raises it again once
  // they run smoothly. Frames drawn while a room is being made do not count:
  // that slowness is the room being made, not the chip.
  let building = 0 // rooms being made right now
  let compiling = 0 // rooms whose shaders are compiling right now
  const compiled = [] // what is waiting for them to finish
  let loading = true // the load screen is up
  let unpacking = true // the delivery box is still on screen (see lib/delivery.js)
  const quality = {
    best: Math.min(devicePixelRatio || 1, 2),
    floor: Math.min(devicePixelRatio || 1, 1) * 0.8,
    ratio: 1,
    slow: 0,
    fast: 0,
    set(ratio) {
      quality.ratio = ratio
      renderer.setPixelRatio(ratio)
      renderer.setSize(innerWidth, innerHeight, false)
    },
    remember() {
      try {
        localStorage.setItem('sharpness', String(quality.ratio))
      } catch {}
    },
    // judged only on frames drawn back to back while the camera moves; a
    // frame over 400 ms is a paused or hidden tab, not a slow chip
    sample(frameMs) {
      if (frameMs > 400 || building > 0 || loading) return
      if (frameMs > 45) {
        quality.slow++
        quality.fast = 0
      } else {
        quality.slow = Math.max(0, quality.slow - 1)
        if (frameMs < 22) quality.fast++
      }
      if (quality.slow >= 8 && quality.ratio > quality.floor) {
        quality.slow = 0
        quality.set(Math.max(quality.floor, quality.ratio * 0.8))
        quality.remember()
      } else if (quality.fast >= 120 && quality.ratio < quality.best) {
        quality.fast = 0
        quality.set(Math.min(quality.best, quality.ratio / 0.8))
        quality.remember()
      }
    },
  }
  try {
    localStorage.removeItem('detail') // (the old setting, which only ever went down)
  } catch {}
  const remembered = (() => {
    try {
      return parseFloat(localStorage.getItem('sharpness'))
    } catch {
      return NaN
    }
  })()
  quality.set(remembered > 0 ? Math.min(quality.best, Math.max(quality.floor, remembered)) : quality.best)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(PALETTE.paper)

  // One warm lamp and a cool fill, like a desk lamp in a room with a window:
  // lit paper stays paper-white, and what the lamp cannot reach goes
  // periwinkle rather than grey. (Colours here are linear light, not hex.)
  const FILL = 0.64 * Math.PI
  const LAMP = 0.5 * Math.PI
  const fill = new THREE.HemisphereLight(new THREE.Color(1, 0.97, 0.92), new THREE.Color(0.72, 0.76, 1), FILL)
  const lamp = new THREE.DirectionalLight(new THREE.Color(1, 0.95, 0.86), LAMP)
  lamp.castShadow = true
  lamp.shadow.mapSize.setScalar(1536)
  lamp.shadow.bias = -0.0004
  lamp.shadow.normalBias = 0.02
  scene.add(fill, lamp, lamp.target)

  const stepped = createStepped()
  const rig = createRig()
  const overlay = createOverlay(rig.camera)
  const ui = site.ui

  let draw = true
  let shadowsStale = true
  // something in the scene changed: draw it, shadows included
  const redraw = () => {
    draw = true
    shadowsStale = true
  }

  // With motion off the camera cuts instead of gliding. A quick fade through
  // paper makes the cut feel deliberate rather than broken (a fade is not motion).
  const veilNode = document.querySelector('#veil')
  const veil = (on) => {
    if (on && !stepped.reduced) return Promise.resolve()
    veilNode.classList.toggle('is-on', on) // (lifting it always works, whatever the motion setting)
    return sleep(on ? 170 : 0)
  }
  onAssetLoaded(redraw)

  // A crossfade (with motion off, the load screen ends in one): the picture as
  // it is now is held over the canvas while `change` rearranges the scene
  // behind it, then fades away.
  async function crossfade(change) {
    const snap = document.createElement('canvas')
    snap.className = 'snapshot'
    snap.width = canvas.width
    snap.height = canvas.height
    scene.updateMatrixWorld()
    rig.camera.updateMatrixWorld()
    renderer.render(scene, rig.camera)
    snap.getContext('2d').drawImage(canvas, 0, 0) // (in the same task as the render, while it is still there)
    document.body.append(snap)
    change()
    redraw()
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    snap.classList.add('is-gone')
    await sleep(650)
    snap.remove()
  }

  // A room can bring the lights down (a coin going in, a slide going into the
  // projector): 0 is the room as normal, 1 is as dark as it gets. Screens and
  // projected pictures do not dim, so they glow.
  const lights = {
    dim(k) {
      fill.intensity = FILL * (1 - 0.62 * k)
      lamp.intensity = LAMP * (1 - 0.8 * k)
      redraw()
    },
  }

  // Point the lamp's shadow at what is on screen. A tighter aim gives crisper
  // shadows, so it is re-aimed when the camera settles somewhere new; the
  // softness is kept the same size in the scene either way.
  function aimLamp(rect) {
    const half = Math.max(rect.w, rect.h) / 2 + 1.6
    lamp.target.position.set(rect.cx, rect.cy, -1.4)
    lamp.position.copy(lamp.target.position).addScaledVector(LAMP_FROM, 30)
    const view = lamp.shadow.camera
    view.left = view.bottom = -half
    view.right = view.top = half
    view.near = 12
    view.far = 46
    view.updateProjectionMatrix()
    lamp.shadow.radius = Math.min(5, (SHADOW_SOFTNESS * lamp.shadow.mapSize.x) / (half * 2))
    redraw()
  }

  const shelf = await buildShelf({ stepped })
  // the load screen: a delivery box, with the shelf waiting inside it
  const delivery = await buildDelivery({ stepped, shelf, redraw, quiet: () => compiling === 0 })
  unsent.length = 0 // the shelf's and the box's own drawings go up with the very first frame
  scene.add(shelf.group, shelf.backdrop, delivery.group)

  // ---- where we are -----------------------------------------------------
  const here = { box: null, item: null, look: null } // item: a project, a photograph, a card; look: see look()
  const rooms = new Map() // the rooms made so far, each ready to be shown
  // Is the shelf on screen? Also while the camera is on its way from it into a
  // box: the other boxes keep playing their loops as they slide out of view.
  let flying = false
  const onShelf = () => (!here.box || flying) && !unpacking
  // A room is made as soon as the shelf is up (or the first time it is
  // wanted, if that comes sooner). Its shaders are compiled and its drawings
  // sent to the graphics card before it is shown, so it never stalls a frame.
  const making = new Map()
  // The lamp draws its shadows with a depth-only version of each material, and
  // three.js compiles those on the spot the first time something casts a
  // shadow, freezing the page for as long as that takes. So a room also gets a
  // twin of each kind of depth material its pieces will need (made the way
  // three.js makes them, so they share its compiled shaders), compiled in the
  // background alongside the room's own. The twins are kept, so their shaders are.
  const SHADOW_SIDE = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide }
  const twinKinds = new Set()
  const twins = new THREE.Group()
  function shadowTwins(root) {
    const fresh = new THREE.Group()
    root.traverse((o) => {
      if (!o.isMesh || !o.castShadow) return
      for (const m of [o.material].flat()) {
        if (!m) continue
        const side = m.shadowSide ?? SHADOW_SIDE[m.side]
        const alphaTest = m.alphaToCoverage ? 0.5 : m.alphaTest
        const clips = m.clipShadows && m.clippingPlanes?.length ? m.clippingPlanes.length : 0
        const kind = [o.isInstancedMesh, !!o.instanceColor, side, alphaTest > 0, !!m.map, !!m.alphaMap, clips].join()
        if (twinKinds.has(kind)) continue
        twinKinds.add(kind)
        const depth = new THREE.MeshDepthMaterial({ side, alphaTest, map: m.map, alphaMap: m.alphaMap })
        if (clips) Object.assign(depth, { clipShadows: true, clippingPlanes: m.clippingPlanes, clipIntersection: m.clipIntersection })
        const twin = o.isInstancedMesh ? new THREE.InstancedMesh(o.geometry, depth, 1) : new THREE.Mesh(o.geometry, depth)
        if (o.isInstancedMesh && o.instanceColor) twin.instanceColor = o.instanceColor
        fresh.add(twin)
      }
    })
    twins.add(fresh)
    return fresh
  }
  function prepare(id) {
    if (!making.has(id)) {
      building++
      const box = shelf.boxes.get(id)
      const before = new Set(box.body.children)
      // Keep the new room out of sight until it is whole and can be drawn
      // without a stall: what it puts in its box is hidden as it goes in,
      // then shown once its shaders are compiled (in the background) and its
      // drawings are on the graphics card.
      const add = box.body.add
      box.body.add = (...objects) => {
        for (const object of objects) object.visible = false
        return add.apply(box.body, objects)
      }
      const made = ROOMS[id]
        .load()
        .then((room) => room.build({ box, stepped, overlay, redraw, goTo, lights, look, camera: rig.camera, onShelf }))
        .finally(() => delete box.body.add) // (back to the usual add)
        .then(async (room) => {
          const added = box.body.children.filter((child) => !before.has(child))
          compiling++
          // (the twins as the lamp's shadow pass draws them: into its shadow map)
          const into = renderer.getRenderTarget()
          if (lamp.shadow.map) renderer.setRenderTarget(lamp.shadow.map)
          const shadowsCompiled = renderer.compileAsync(shadowTwins(box.body), rig.camera, scene)
          renderer.setRenderTarget(into)
          await Promise.all([renderer.compileAsync(box.body, rig.camera, scene), shadowsCompiled]).catch(() => {})
          compiling--
          if (!compiling) for (const done of compiled.splice(0)) done()
          while (unsent.length) {
            // A texture sent while another room's shaders compile has to wait for
            // them, and the page freezes meanwhile: send it once they are done.
            if (compiling) await new Promise((done) => compiled.push(done))
            await turn()
            const next = unsent.shift() // (two rooms made at once share the queue: it may be empty by now)
            if (next) renderer.initTexture(next)
          }
          for (const child of added) child.visible = true
          building--
          rooms.set(id, room)
          redraw()
          return room
        })
      made.catch((error) => {
        console.error(error)
        building = Math.max(0, building - 1)
        making.delete(id) // could not load (offline?): try again next time
      })
      making.set(id, made)
    }
    return making.get(id)
  }
  let busy = false
  let roomPan = 0 // where the room was panned to, while an item is open
  let pan = 0 // sideways offset inside a room, on screens too narrow to show it all
  let slack = 0 // how far it can pan either way

  // The part of a room the camera frames. On a narrow screen that is a
  // window onto the room, which can be dragged sideways.
  function roomRect(box) {
    const full = box.view(ROOMS[box.id].focus, ROOMS[box.id].fit)
    // a room that cannot pan is still allowed to crop its own side walls on a tall screen
    const w = ROOMS[box.id].whole
      ? full.w * (innerWidth < innerHeight ? (ROOMS[box.id].narrow ?? 0.8) : 1)
      : Math.min(full.w, Math.max(innerWidth / (ROOMS[box.id].perUnit ?? 108), full.h * rig.camera.aspect))
    slack = ROOMS[box.id].whole ? 0 : (full.w - w) / 2
    pan = THREE.MathUtils.clamp(pan, -slack, slack)
    return { ...full, w, cx: full.cx + pan }
  }

  // The part of an opened item the camera frames. In a bare room, an item too
  // wide for a narrow screen is framed by its height and can be swiped across.
  function itemRect(room, id) {
    const full = room.view(id)
    if (!ROOMS[here.box].bare) return full
    const w = Math.min(full.w, full.h * rig.camera.aspect)
    slack = (full.w - w) / 2
    pan = THREE.MathUtils.clamp(pan, -slack, slack)
    return { ...full, w, cx: full.cx + pan }
  }

  function viewNow() {
    if (unpacking && (delivery.state === 'waiting' || delivery.state === 'opening'))
      return { rect: delivery.view(rig.camera.aspect), region: FULL, lift: LIFT }
    if (!here.box) return { rect: shelf.frame(), region: FULL, lift: 0 }
    const room = rooms.get(here.box)
    const conf = ROOMS[here.box]
    if (here.item && room && conf.bare) return { rect: itemRect(room, here.item), region: FULL, lift: ROOM_LIFT }
    if (here.item && room && !conf.inPlace) return { rect: room.view(here.item), region: overlay.stageRegion(), lift: 0 }
    if (here.look) return { rect: here.look.rect(), region: FULL, lift: here.look.lift }
    return { rect: roomRect(shelf.boxes.get(here.box)), region: conf.card ? overlay.stageRegion() : FULL, lift: ROOM_LIFT }
  }

  const refit = () => {
    const view = viewNow()
    rig.go(view.rect, { region: view.region, instant: true, lift: view.lift })
  }

  // A room can point the camera at part of itself, from its own angle: the
  // card shop looks down onto its counter. `rect` is a function, so a resize
  // asks again; null goes back to the room's usual view.
  async function look(rect, { lift = ROOM_LIFT, duration = 1.1 } = {}) {
    here.look = rect ? { rect, lift } : null
    const view = viewNow()
    await veil(true)
    await rig.go(view.rect, { region: view.region, duration, lift: view.lift })
    aimLamp(view.rect)
    veil(false)
  }

  // ---- routes: #/games, #/games/snikisnak, #/photography/03, #/about ---------
  function wanted() {
    const [b, i] = decodeURIComponent(location.hash).replace(/^#\/?/, '').split('/')
    const box = shelf.boxes.get(b)
    if (!box || !box.data.built || !ROOMS[b]) return { box: null, item: null }
    return { box: b, item: itemExists(b, i, files) ? i : null }
  }

  const goTo = (hash) => {
    if (location.hash === hash) settle()
    else location.hash = hash
  }

  // Walk one step at a time from where we are to where the address says.
  async function settle() {
    if (busy) return
    busy = true
    try {
      for (;;) {
        const want = wanted()
        if (here.box === want.box && here.item === want.item) break
        if (here.item && want.item && here.box === want.box && rooms.get(here.box).swap) await swapItem(want.item)
        else if (here.item) await closeItem()
        else if (here.box && here.box !== want.box) await leaveBox()
        else if (!here.box) await enterBox(want.box)
        else await openItem(want.item)
      }
    } catch (error) {
      console.error(error)
    } finally {
      busy = false
      veil(false) // never leave the page covered, even if a step failed
    }
  }

  // The boxes' tape labels belong on the shelf. Inside a room they would hang
  // in view (the box above's, over the masthead), so they come down meanwhile.
  function labels(on) {
    for (const box of shelf.boxes.values()) for (const tape of box.tapes) tape.visible = on
  }

  function setPlace(place) {
    document.body.dataset.place = place
    document.body.dataset.room = here.box || ''
    const back = overlay.el.back
    back.hidden = place === 'shelf'
    // a room may name its own way back ("back to the market")
    back.textContent = (here.box && rooms.get(here.box)?.backLabel?.(place)) || (place === 'item' ? ui.toRoom : ui.toShelf)
    // name the tab after where we are, so history and bookmarks make sense
    const where = here.item ? rooms.get(here.box).title(here.item) : here.box && shelf.boxes.get(here.box).data.label
    document.title = where ? `${where} · ${site.name}` : site.name
  }

  async function enterBox(id) {
    const box = shelf.boxes.get(id)
    overlay.showSpots(null)
    shelf.settle() // if the opening is still playing, skip to the end of it
    box.hover(false) // put it down: it was picked up when the pointer arrived
    overlay.cardSize('')
    const loading = prepare(id)
    const made = rooms.get(id) // already made: its box has been playing its loop on the shelf
    here.box = id
    here.look = null
    labels(false)
    pan = -Infinity // start at the left end of the room
    setPlace('room')
    overlay.say(box.data.label)
    // The camera pushes in. A room that is already made goes straight to its
    // whole, open scene as the glide starts and carries on from there; one
    // still being made stands up just before the camera arrives.
    await veil(true)
    flying = true
    const moving = rig
      .go(roomRect(box), { region: ROOMS[id].card ? overlay.stageRegion() : FULL, duration: 1.4, lift: ROOM_LIFT })
      .then(() => (flying = false))
    let room = made
    if (!room) {
      try {
        ;[room] = await Promise.all([loading, stepped.reduced ? null : sleep(850)])
      } catch (error) {
        // the room would not load (offline, say): back out to the shelf rather than strand the camera
        here.box = null
        labels(true)
        setPlace('shelf')
        history.replaceState(null, '', '#/')
        await rig.go(shelf.frame(), { duration: 0.8, lift: 0 })
        veil(false)
        overlay.showSpots('shelf')
        throw error
      }
    }
    await Promise.all([moving.then(() => aimLamp(box.view())), room.open()])
    veil(false)
    if (room.card && ROOMS[id].card) await overlay.showCard(room.card())
    else overlay.el.back.focus({ preventScroll: true })
    overlay.showSpots(id)
  }

  async function leaveBox() {
    const id = here.box
    const room = rooms.get(id)
    overlay.showSpots(null)
    if (ROOMS[id].card) await overlay.hideCard()
    await veil(true)
    await room.close()
    here.box = null
    here.look = null
    labels(true)
    rig.parallax = 1
    setPlace('shelf')
    aimLamp(shelf.frame())
    await rig.go(shelf.frame(), { duration: 1.2, lift: 0 })
    veil(false)
    overlay.showSpots('shelf')
    shelf.boxes.get(id).spot.node.focus({ preventScroll: true })
  }

  async function openItem(id) {
    const room = rooms.get(here.box)
    overlay.showSpots(null)
    if (ROOMS[here.box].inPlace) {
      // held up over the room (a card from the counter or the binder)
      here.item = id
      setPlace('item')
      await room.show(id)
      return
    }
    if (ROOMS[here.box].bare) {
      // the room opens its own door; the camera goes in after it
      roomPan = pan
      pan = 0
      await room.start(id)
      rig.parallax = 0
      here.item = id
      setPlace('item')
      await veil(true)
      await rig.go(itemRect(room, id), { duration: 1.1, lift: ROOM_LIFT })
      veil(false)
      room.show(id)
      return
    }
    await room.start(id) // the coin drops, or the slide goes into the projector
    rig.parallax = 0 // square on and still, so a clip lines up with its screen
    here.item = id
    setPlace('item')
    overlay.cardSize(ROOMS[here.box].slim ? 'slim' : '')
    await veil(true)
    await rig.go(room.view(id), { region: overlay.stageRegion(), duration: 1.1, lift: 0 })
    veil(false)
    await overlay.showCard(room.card(id))
  }

  // straight from one item to the next without backing out (photo to photo)
  async function swapItem(id) {
    const room = rooms.get(here.box)
    await room.swap(id)
    here.item = id
    setPlace('item')
    overlay.setCard(room.card(id))
    await rig.go(room.view(id), { region: overlay.stageRegion(), duration: 0.5 })
  }

  async function closeItem() {
    const id = here.item
    const room = rooms.get(here.box)
    if (ROOMS[here.box].inPlace) {
      await room.hide()
      here.item = null
      setPlace('room')
      room.end()
      overlay.showSpots(here.box)
      return
    }
    const bare = ROOMS[here.box].bare
    if (bare) await room.hide()
    else await overlay.hideCard()
    here.item = null
    rig.parallax = 1
    if (bare) pan = roomPan
    setPlace('room')
    await veil(true)
    await rig.go(roomRect(shelf.boxes.get(here.box)), { duration: 1, lift: ROOM_LIFT })
    veil(false)
    room.end()
    overlay.showSpots(here.box)
    room.spot(id)?.node.focus({ preventScroll: true })
  }

  // ---- controls -----------------------------------------------------------
  for (const box of shelf.boxes.values()) {
    const open = box.data.built && !!ROOMS[box.id]
    const closedLabel = `${box.data.label}: ${ui.unbuilt}`
    box.spot = overlay.addSpot({
      group: 'shelf',
      label: open ? box.data.label : closedLabel,
      off: !open,
      corners: box.corners,
      onHover(on) {
        if (busy) return
        box.hover(on) // (it brightens, and its loop runs a little faster)
        if (on && open) prepare(box.id).catch(() => {}) // (made already, unless it is still on its way)
      },
      onClick() {
        if (open) return goTo(`#/${box.id}`)
        box.refuse()
        overlay.say(closedLabel)
      },
    })
  }

  // Back one step. A room can take the step itself first (the card shop: out
  // of its binder, or from the counter back to the case).
  const stepBack = () => {
    if (here.box && rooms.get(here.box)?.escape?.(here.item)) return
    goTo(here.item ? `#/${here.box}` : '#/')
  }
  overlay.el.back.addEventListener('click', stepBack)
  addEventListener('keydown', (e) => {
    if (!here.box || busy) return
    if (e.key === 'Escape') stepBack()
    else rooms.get(here.box)?.key?.(e.key, here.item)
  })
  addEventListener('hashchange', settle)

  // Pointer: parallax (mouse only), and sideways drags inside a room. A room
  // that has something to drag (the film) takes them; otherwise, on a screen
  // too narrow for the whole room, they pan the camera.
  let drag = null
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') rig.point((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2)
    if (here.box && !here.item) rooms.get(here.box)?.pointer?.(e.clientX / innerWidth, e.clientY / innerHeight) // foil catches the light; snow shies away
    if (!drag) return
    if (!drag.moved && Math.abs(e.clientX - drag.x) < 8) return
    if (!drag.moved) document.body.classList.add('is-dragging')
    drag.moved = true
    if (drag.room) drag.room.drag((e.clientX - drag.last) * drag.scale)
    else {
      pan = drag.pan - (e.clientX - drag.x) * drag.scale
      refit()
    }
    drag.last = e.clientX
  })
  addEventListener('pointerdown', (e) => {
    if (!here.box || busy || (here.item && !ROOMS[here.box].bare)) return
    const room = rooms.get(here.box)
    const roomDrags = !here.item && room?.drag
    if (!roomDrags && !slack) return
    drag = { x: e.clientX, last: e.clientX, pan, moved: false, scale: rig.unitsPerPixel(innerHeight), room: roomDrags ? room : null }
  })
  const endDrag = () => {
    document.body.classList.remove('is-dragging')
    if (drag?.moved) {
      drag.room?.dragEnd?.()
      overlay.dragged = true // swallow the click that follows a drag
      setTimeout(() => (overlay.dragged = false))
    }
    drag = null
  }
  addEventListener('pointerup', endDrag)
  addEventListener('pointercancel', endDrag)
  addEventListener(
    'wheel',
    (e) => {
      if (here.box && !here.item && !busy) rooms.get(here.box)?.wheel?.(e.deltaY + e.deltaX)
    },
    { passive: true },
  )
  // keyboard: bring a focused cabinet into view if the room is panned away from it
  addEventListener('focusin', (e) => {
    if (!slack || !here.box || (here.item && !ROOMS[here.box].bare) || !e.target.classList?.contains('hotspot')) return
    const r = e.target.getBoundingClientRect()
    if (r.left >= 0 && r.right <= innerWidth) return
    pan += ((r.left + r.right) / 2 - innerWidth / 2) * rig.unitsPerPixel(innerHeight)
    refit()
  })

  // ---- motion preference --------------------------------------------------
  const motion = document.querySelector('#motion')
  const stored = (() => {
    try {
      return localStorage.getItem('motion')
    } catch {
      return null
    }
  })()
  function setMotion(off) {
    stepped.reduced = rig.reduced = overlay.reduced = off
    for (const room of rooms.values()) room.motion?.(off) // (each shows its whole scene, still)
    document.documentElement.dataset.motion = off ? 'off' : 'on'
    motion.textContent = off ? ui.startMotion : ui.stopMotion
    if (off) shelf.settle()
    redraw()
  }
  setMotion(stored ? stored === 'off' : matchMedia('(prefers-reduced-motion: reduce)').matches)
  motion.addEventListener('click', () => {
    const off = !stepped.reduced
    setMotion(off)
    try {
      localStorage.setItem('motion', off ? 'off' : 'on')
    } catch {}
  })

  // ---- sound (off unless the visitor turns it on) ---------------------------
  const soundSwitch = document.querySelector('#sound')
  function setSound(on) {
    sound.set(on)
    soundSwitch.textContent = on ? ui.soundIsOn : ui.soundIsOff
    soundSwitch.setAttribute('aria-pressed', String(on))
  }
  setSound(
    (() => {
      try {
        return localStorage.getItem('sound') === 'on'
      } catch {
        return false
      }
    })(),
  )
  // the audio takes a moment to wake: let it, on a press, before what the press starts
  addEventListener('pointerdown', () => sound.warm(), true)
  addEventListener('keydown', () => sound.warm(), true)
  soundSwitch.addEventListener('click', () => {
    setSound(!sound.on)
    sound.warm()
    try {
      localStorage.setItem('sound', sound.on ? 'on' : 'off')
    } catch {}
  })

  // ---- size ---------------------------------------------------------------
  function resize() {
    const w = innerWidth
    const h = innerHeight
    renderer.setSize(w, h, false)
    rig.resize(w, h)
    overlay.resize(w, h)
    shelf.setLayout(w / h < 0.62 ? 'tall' : 'wide')
    if (unpacking) {
      delivery.place(shelf.frame(), rig.camera.aspect)
      shelf.guides.material.opacity = 0 // (its pencil lines go up once the shelf is in its place)
    }
    refit()
    aimLamp(viewNow().rect)
  }
  addEventListener('resize', resize)
  resize()

  // ---- go -----------------------------------------------------------------
  boil(stepped, shelf.boiling, () => !here.item && !unpacking)
  setPlace('shelf')
  overlay.showSpots(null) // (once it is unpacked)

  let firstDrawn = null
  const drawnOnce = new Promise((done) => (firstDrawn = done))
  let last = performance.now()
  renderer.setAnimationLoop((now) => {
    const frameMs = now - last
    const dt = Math.min(0.25, frameMs / 1000)
    last = now
    stepped.update(dt)
    const cameraMoved = rig.update(dt)
    if (cameraMoved) draw = true
    if (delivery.frame(rig.camera)) draw = true // (the shelf coming up out of its box rides with the camera between ticks)
    // a room with things that follow the camera every frame (the card shop's cards, which are HTML)
    if (here.box && rooms.get(here.box)?.frame?.(dt)) draw = true
    if (stepped.dirty) redraw() // paper moved: its shadows move too
    if (stepped.looks) draw = true
    stepped.dirty = stepped.looks = false
    if (cameraMoved && rig.moving) quality.sample(frameMs)
    if (!draw) return // nothing moved: leave the last frame on screen
    draw = false
    scene.updateMatrixWorld()
    rig.camera.updateMatrixWorld()
    overlay.update()
    if (shadowsStale) renderer.shadowMap.needsUpdate = true
    shadowsStale = false
    renderer.render(scene, rig.camera)
    firstDrawn?.()
    firstDrawn = null
  })

  // ---- the load screen: a delivery -----------------------------------------
  // The first frame is drawn behind the paper with everything in it (the box
  // at rest, the shelf shrunk inside it), so all their shaders compile and
  // their drawings reach the graphics card before anything moves. Then the
  // paper lifts, the box drops in, and it waits while the rooms are made (side
  // by side: one's drawings are cut out while another's shaders compile). When
  // they are ready it opens and the shelf comes up out of it. (It waits 20
  // seconds at most: a room still not ready by then appears when it is.)
  const loader = document.querySelector('#loader')
  const status = document.querySelector('#status')
  const main = document.querySelector('main')
  const early = Object.keys(ROOMS).filter((id) => ROOMS[id].early && shelf.boxes.get(id)?.data.built)
  main.inert = true
  status.textContent = 'unpacking the shelf'
  setBudget(55) // (the rooms get most of each frame, with enough left for the box to move on every tick)
  // Progress is the slow work actually done, against how much there was last
  // time (the same every visit, unless the site has changed since).
  const before = work.done
  const expected =
    (() => {
      try {
        return parseInt(localStorage.getItem('unpacking'), 10)
      } catch {
        return 0
      }
    })() || 760
  let ready = false
  const allMade = Promise.all(early.map((id) => prepare(id).catch(() => {}))).then(() => (ready = true))
  const report = () => {
    const k = (work.done - before) / expected
    // (more work than last time: it slows down near the end rather than sitting at 100)
    delivery.setProgress(ready ? 1 : k < 0.9 ? k : 0.9 + 0.09 * (1 - Math.exp(-(k - 0.9) * 8)))
  }
  const reporting = setInterval(report, 100)

  await drawnOnce
  await new Promise(requestAnimationFrame) // (and on screen)
  await sleep(Math.max(0, 900 - performance.now())) // (a visit that is ready within a second never sees the box)
  const quick = ready
  if (quick) delivery.finish()
  else {
    delivery.hold() // up out of sight, to drop in
    redraw()
  }
  loader?.classList.add('is-done')
  setTimeout(() => loader?.remove(), 600)
  if (!quick) {
    await sleep(stepped.reduced ? 0 : 160)
    await delivery.dropIn()
    delivery.idle()
    await Promise.race([allMade, sleep(20000)])
  }
  clearInterval(reporting)
  try {
    if (ready) localStorage.setItem('unpacking', String(work.done - before))
  } catch {}
  delivery.setProgress(1)
  setBudget(11)

  if (quick) {
    unpacking = false
    refit()
    aimLamp(shelf.frame())
  } else if (stepped.reduced) {
    // with motion off: the box, still, then a crossfade to the shelf
    await crossfade(() => {
      delivery.finish()
      unpacking = false
      refit()
      aimLamp(shelf.frame())
    })
  } else {
    // The graphics card can still be busy with the rooms it was just handed
    // (their first time on screen, inside the box). It opens once frames are
    // coming smoothly again, so the opening never stutters.
    const giveUp = performance.now() + 2500
    for (let calm = 0, last = performance.now(); calm < 3 && last < giveUp; ) {
      await new Promise(requestAnimationFrame)
      const now = performance.now()
      calm = now - last < 120 ? calm + 1 : 0
      last = now
    }
    await delivery.open()
    // the lamp's shadows cover the box and the whole shelf on the way up
    const a = delivery.view(rig.camera.aspect)
    const b = shelf.frame()
    const x0 = Math.min(a.cx - a.w / 2, b.cx - b.w / 2)
    const x1 = Math.max(a.cx + a.w / 2, b.cx + b.w / 2)
    const y0 = Math.min(a.cy - a.h / 2, b.cy - b.h / 2)
    const y1 = Math.max(a.cy + a.h / 2, b.cy + b.h / 2)
    aimLamp({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 })
    await delivery.rise(rig, shelf.frame())
    delivery.finish()
    unpacking = false
    aimLamp(shelf.frame())
  }
  loading = false
  // The shelf is in its place: its pencil lines go up, her name and the
  // switches come back, and the boxes start their loops.
  stepped.poses([0.3, 0.65, 1], (k) => (shelf.guides.material.opacity = k))
  document.body.classList.remove('is-unpacking')
  main.inert = false
  status.textContent = 'the shelf is unpacked'
  overlay.showSpots('shelf')
  setTimeout(() => delivery.dispose(), 1000)
  // then, a frame at a time, what only shows once someone does something
  ;(async () => {
    await sleep(1500)
    while (later.length) {
      await turn()
      const next = later.shift()
      if (next) renderer.initTexture(next)
    }
  })()

  // A link straight to a box or a project goes on in there. (A visit ready at
  // once, with no box to come out of, has the boxes set down on the shelf.)
  const arrived = wanted().box ? settle() : quick ? shelf.playIntro() : null

  // Once the shelf has settled, in a still moment, compile the kinds of shader
  // the rooms use (light beams, dust, glows, paper scraps), so the first box
  // opened does not stop to compile them. No room's drawings are loaded for this.
  Promise.resolve(arrived).then(() =>
    setTimeout(() => {
      const tiny = new THREE.BufferGeometry()
      tiny.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0.01, 0, 0.01, 0, 0], 3))
      tiny.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3))
      const blank = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 2, height: 2 }))
      const glow = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }
      const scraps = new THREE.InstancedMesh(tiny, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), 1)
      scraps.setColorAt(0, new THREE.Color())
      scraps.castShadow = scraps.receiveShadow = true
      const kinds = new THREE.Group()
      kinds.add(
        scraps,
        new THREE.Mesh(tiny, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, ...glow })),
        new THREE.Mesh(tiny, new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending })),
        new THREE.Points(tiny, new THREE.PointsMaterial({ map: blank, size: 0.1, ...glow })),
        new THREE.Sprite(new THREE.SpriteMaterial({ map: blank, ...glow })),
      )
      kinds.position.y = -100 // well out of sight
      scene.add(kinds)
      renderer
        .compileAsync(kinds, rig.camera, scene)
        .catch(() => {})
        .finally(() => {
          scene.remove(kinds)
          kinds.traverse((o) => {
            if (o.isInstancedMesh) o.dispose()
            if (!o.isSprite) o.geometry?.dispose() // (sprites share one geometry: leave it)
            o.material?.dispose()
          })
          blank.dispose()
        })
    }, 400),
  )
}
