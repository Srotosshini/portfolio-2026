// Scene setup, the render loop, and getting from the shelf into a box and back.
import * as THREE from 'three'
import { site } from './data/projects.js'
import { createStepped } from './lib/stepped.js'
import { createRig, FULL } from './lib/camera.js'
import { createOverlay } from './lib/overlay.js'
import { boil, PALETTE } from './lib/paper.js'
import { files, onAssetLoaded } from './lib/assets.js'
import { itemExists } from './lib/pages.js'
import { buildShelf } from './shelf.js'

// One file per room. A room's code and drawings are only fetched the first
// time its box is opened (or hovered).
//   card: the room always has its paper card open beside it (About)
//   whole: always frame the whole room; it uses sideways drags itself
//   slim: its pages are caption slips, not full project cards
//   focus, fit: how the camera frames the room (see box.view in shelf.js)
const ROOMS = {
  games: { load: () => import('./rooms/arcade.js') },
  photography: { load: () => import('./rooms/photography.js'), whole: true, slim: true, focus: 0.3, fit: 1.05 },
  about: { load: () => import('./rooms/about.js'), card: true },
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
  if (!import.meta.env.DEV) location.replace('list.html')
})

async function start() {
  const canvas = document.querySelector('#scene')
  // `alpha` so a clip placed behind the canvas can show through a cut-out screen
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

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
  lamp.shadow.mapSize.setScalar(Math.min(innerWidth, innerHeight) < 600 ? 1536 : 2048)
  lamp.shadow.bias = -0.0004
  lamp.shadow.normalBias = 0.02
  scene.add(fill, lamp, lamp.target)

  const stepped = createStepped()
  const rig = createRig()
  const overlay = createOverlay(rig.camera)
  const ui = site.ui

  let draw = true
  const redraw = () => (draw = true)
  onAssetLoaded(redraw)

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
  scene.add(shelf.group)

  // ---- where we are -----------------------------------------------------
  const here = { box: null, item: null } // item: a project, or a photograph
  const rooms = new Map()
  let busy = false
  let pan = 0 // sideways offset inside a room, on screens too narrow to show it all
  let slack = 0 // how far it can pan either way

  // The part of a room the camera frames. On a narrow screen that is a
  // window onto the room, which can be dragged sideways.
  function roomRect(box) {
    const full = box.view(ROOMS[box.id].focus, ROOMS[box.id].fit)
    // a room that cannot pan is still allowed to crop its own side walls on a tall screen
    const w = ROOMS[box.id].whole
      ? full.w * (innerWidth < innerHeight ? 0.8 : 1)
      : Math.min(full.w, Math.max(innerWidth / 108, full.h * rig.camera.aspect))
    slack = ROOMS[box.id].whole ? 0 : (full.w - w) / 2
    pan = THREE.MathUtils.clamp(pan, -slack, slack)
    return { ...full, w, cx: full.cx + pan }
  }

  function viewNow() {
    if (!here.box) return { rect: shelf.frame(), region: FULL }
    const room = rooms.get(here.box)
    if (here.item && room) return { rect: room.view(here.item), region: overlay.stageRegion() }
    return { rect: roomRect(shelf.boxes.get(here.box)), region: ROOMS[here.box].card ? overlay.stageRegion() : FULL }
  }

  const refit = () => {
    const view = viewNow()
    rig.go(view.rect, { region: view.region, instant: true })
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
    }
  }

  function setPlace(place) {
    document.body.dataset.place = place
    document.body.dataset.room = here.box || ''
    const back = overlay.el.back
    back.hidden = place === 'shelf'
    back.textContent = place === 'item' ? ui.toRoom : ui.toShelf
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
    const loading = rooms.has(id)
      ? Promise.resolve(rooms.get(id))
      : ROOMS[id].load().then((room) => room.build({ box, stepped, overlay, redraw, goTo, lights }))
    here.box = id
    pan = -Infinity // start at the left end of the room
    rig.lift = ROOM_LIFT
    setPlace('room')
    overlay.say(box.data.label)
    // push in while the room loads; the pieces start standing up just before the camera arrives
    const moving = rig.go(roomRect(box), { region: ROOMS[id].card ? overlay.stageRegion() : FULL, duration: 1.4 })
    let room
    try {
      ;[room] = await Promise.all([loading, stepped.reduced ? null : sleep(850)])
    } catch (error) {
      // the room would not load (offline, say): back out to the shelf rather than strand the camera
      here.box = null
      rig.lift = 0
      setPlace('shelf')
      history.replaceState(null, '', '#/')
      await rig.go(shelf.frame(), { duration: 0.8 })
      overlay.showSpots('shelf')
      throw error
    }
    rooms.set(id, room)
    await Promise.all([moving.then(() => aimLamp(box.view())), room.open()])
    if (room.card && ROOMS[id].card) await overlay.showCard(room.card())
    else overlay.el.back.focus({ preventScroll: true })
    overlay.showSpots(id)
  }

  async function leaveBox() {
    const id = here.box
    const room = rooms.get(id)
    overlay.showSpots(null)
    if (ROOMS[id].card) await overlay.hideCard()
    await room.close()
    here.box = null
    rig.lift = 0
    setPlace('shelf')
    aimLamp(shelf.frame())
    await rig.go(shelf.frame(), { duration: 1.2 })
    overlay.showSpots('shelf')
    shelf.boxes.get(id).spot.node.focus({ preventScroll: true })
  }

  async function openItem(id) {
    const room = rooms.get(here.box)
    overlay.showSpots(null)
    await room.start(id) // the coin drops, or the slide goes into the projector
    rig.parallax = rig.lift = 0 // square on and still, so a clip lines up with its screen
    here.item = id
    setPlace('item')
    overlay.cardSize(ROOMS[here.box].slim ? 'slim' : '')
    await rig.go(room.view(id), { region: overlay.stageRegion(), duration: 1.1 })
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
    await overlay.hideCard()
    here.item = null
    rig.parallax = 1
    rig.lift = ROOM_LIFT
    setPlace('room')
    await rig.go(roomRect(shelf.boxes.get(here.box)), { duration: 1 })
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
        box.hover(on)
        if (on && open) ROOMS[box.id].load().catch(() => {}) // fetch the room while they make up their mind
      },
      onClick() {
        if (open) return goTo(`#/${box.id}`)
        box.refuse()
        overlay.say(closedLabel)
      },
    })
  }

  const stepBack = () => goTo(here.item ? `#/${here.box}` : '#/')
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
    if (!here.box || here.item || busy) return
    const room = rooms.get(here.box)
    if (!room?.drag && !slack) return
    drag = { x: e.clientX, last: e.clientX, pan, moved: false, scale: rig.unitsPerPixel(innerHeight), room: room?.drag ? room : null }
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
    if (!slack || !here.box || here.item || !e.target.classList?.contains('hotspot')) return
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

  // ---- size ---------------------------------------------------------------
  function resize() {
    const w = innerWidth
    const h = innerHeight
    renderer.setSize(w, h, false)
    rig.resize(w, h)
    overlay.resize(w, h)
    shelf.setLayout(w / h < 0.62 ? 'tall' : 'wide')
    refit()
    aimLamp(here.box ? shelf.boxes.get(here.box).view() : shelf.frame())
  }
  addEventListener('resize', resize)
  resize()

  // ---- go -----------------------------------------------------------------
  boil(stepped, shelf.boiling, () => !here.item)
  setPlace('shelf')
  overlay.showSpots('shelf')

  let last = performance.now()
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.25, (now - last) / 1000)
    last = now
    stepped.update(dt)
    if (rig.update(dt)) draw = true
    if (stepped.dirty) draw = true
    stepped.dirty = false
    if (!draw) return // nothing moved: leave the last frame on screen
    draw = false
    scene.updateMatrixWorld()
    rig.camera.updateMatrixWorld()
    overlay.update()
    renderer.render(scene, rig.camera)
  })

  // Arriving on the plain address plays the opening; a link straight to a box
  // or a project goes straight there.
  if (wanted().box) settle()
  else shelf.playIntro()
}
