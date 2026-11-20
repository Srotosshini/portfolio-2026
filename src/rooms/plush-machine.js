// The games box as it stands on the shelf: one big handmade claw machine, a
// cardboard cabinet with a cellophane window, full of plush toys of the
// characters from her games. Over and over the claw drifts to one of them,
// drops, wobbles, grabs it and lifts it, and while it is up the little screen
// in the marquee plays that character's game and shows its title; then the
// claw carries it back and drops it into the pile, and picks another.
// Clicked: the claw drops the toy into the prize chute, the machine's lights
// flare, and in the flare the machine gives way to the arcade inside, as the
// camera comes in. Back on the shelf it flares again and is a machine again.
import * as THREE from 'three'
import { projects, plushies, site } from '../data/projects.js'
import { makeFlat, texture, canvas, rng } from '../lib/paper.js'
import * as drawn from '../lib/plushies.js'
import * as sketch from '../lib/placeholders.js'
import { art, has, base } from '../lib/assets.js'
import { loopClock, passed, smooth } from '../lib/loop.js'

const POST = 0.2 // the posts either side of the window
const PIT = 0.56 // the floor the toys lie on (a little below the panel's top edge)
const DEEP = 1.45 // how deep the machine is
const CABLE = 0.12 // the shortest the claw's cable gets
const PLUSH_H = 0.8 // how tall a toy is
// the loop, in seconds
const LOOP = 10
const DRIFT = [0, 1.5] // over to a toy,
const DROP = [1.5, 2.4] // down,
const GRAB = [2.4, 2.9] // a wobble, and it grabs,
const LIFT = [2.9, 4.1] // up (the screen plays its game from here),
const TEASE = [4.1, 5.0] // off toward the chute,
const BACK = [5.8, 7.0] // and, after a moment, back over the pile,
const LET_GO = 7.0 // where it lets go,
const HOME = [7.7, 9.3] // and goes home to wait over the chute

export async function buildPlushMachine({ box, stepped, onShelf }) {
  const { inner } = box
  const W = inner.w
  const H = inner.h
  const group = new THREE.Group()
  group.position.y = inner.floor
  const rand = rng(404)
  const lerp = THREE.MathUtils.lerp
  const crew = plushies.filter((p) => drawn.PLUSH[p.id] || true)
  const gameOf = (p) => projects.find((g) => g.id === p.game)

  const [marqueeArt, panelArt, hubArt, prongArt, ...plushArt] = await Promise.all([
    art('drawings/claw-marquee', (seed) => drawn.marquee(site.ui.claw, seed), { edge: 0, trim: false, tracings: 1 }),
    art('drawings/claw-panel', (seed) => drawn.controlPanel(seed), { edge: 0, trim: false, tracings: 1 }),
    art('drawings/claw-hub', (seed) => drawn.clawHub(seed), { tracings: 1 }),
    art('drawings/claw-prong', (seed) => drawn.clawProng(seed), { tracings: 1 }),
    ...crew.map((p) => art(`drawings/plush-${p.id}`, (seed) => (drawn.PLUSH[p.id] || drawn.PLUSH.blob)(seed), { tracings: 1 })),
  ])

  // ---- the cabinet: marquee, posts, control panel, the cellophane window -------------------
  const marquee = makeFlat(marqueeArt, { width: W + 0.02 })
  marquee.mesh.position.set(0, H - marquee.height / 2, -0.02)
  group.add(marquee.mesh)
  const top = H - marquee.height // the top of the window
  const panel = makeFlat(panelArt, { width: W + 0.02 })
  panel.mesh.position.set(0, panel.height / 2, -0.02)
  group.add(panel.mesh)
  const kraft = canvas(64, 512)
  {
    const ctx = kraft.getContext('2d')
    ctx.fillStyle = '#c69b6d'
    ctx.fillRect(0, 0, 64, 512)
    sketch.marker(ctx, 5, { width: 6 }).rect(4, 4, 56, 504, null)
    sketch.fibres(ctx)
  }
  const postLook = new THREE.MeshLambertMaterial({ map: texture(kraft) })
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.PlaneGeometry(POST, top - panel.height + 0.04), postLook)
    post.position.set(side * (W / 2 - POST / 2), (top + panel.height) / 2, -0.015)
    post.castShadow = true
    group.add(post)
  }
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 2 * POST, top - panel.height),
    new THREE.MeshBasicMaterial({ map: texture(sketch.cellophane()), transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  )
  glass.position.set(0, (top + panel.height) / 2, -0.07)
  glass.renderOrder = 2
  group.add(glass)

  // the inside: dark card all round, a floor for the toys
  const insideMap = texture(drawn.machineInside())
  const insideLook = new THREE.MeshLambertMaterial({ map: insideMap })
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H - PIT), insideLook)
  back.position.set(0, (H + PIT) / 2, -DEEP)
  back.receiveShadow = true
  group.add(back)
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(DEEP, H - PIT), insideLook)
    wall.position.set(side * (W / 2 - 0.004), (H + PIT) / 2, -DEEP / 2)
    wall.rotation.y = -side * (Math.PI / 2)
    wall.receiveShadow = true
    group.add(wall)
  }
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(W, DEEP), new THREE.MeshLambertMaterial({ color: '#2f2945' }))
  pit.rotation.x = -Math.PI / 2
  pit.position.set(0, PIT, -DEEP / 2)
  pit.receiveShadow = true
  group.add(pit)

  // the prize chute, down in the left-hand corner: a card box the toys drop into
  const chuteW = 1.0
  const chuteX = -W / 2 + POST + chuteW / 2
  const chute = canvas(400, 200)
  {
    const ctx = chute.getContext('2d')
    const m = sketch.marker(ctx, 9, { width: 6 })
    m.rect(6, 30, 388, 164, '#b98c5c')
    m.shape([[0, 6], [400, 6], [392, 40], [8, 40]], '#8d6440')
    sketch.write(ctx, 'prize chute ↓', 200, 112, { size: 44, max: 340 })
    sketch.fibres(ctx)
  }
  const chuteFront = new THREE.Mesh(new THREE.PlaneGeometry(chuteW, 0.5), new THREE.MeshLambertMaterial({ map: texture(chute), transparent: true, alphaTest: 0.5 }))
  chuteFront.position.set(chuteX, PIT + 0.25, -0.3)
  chuteFront.castShadow = chuteFront.receiveShadow = true
  group.add(chuteFront)
  const chuteTop = PIT + 0.5

  // ---- the toys, in a heap, three of each -----------------------------------------------------
  const order = []
  for (let k = 0; k < 3; k++) for (let i = 0; i < crew.length; i++) order.push(i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const left = -W / 2 + POST + chuteW + 0.35
  const right = W / 2 - POST - 0.35
  const rows = [
    { z: -1.14, lift: 0.5 },
    { z: -0.82, lift: 0.26 },
    { z: -0.5, lift: 0.02 },
  ]
  const perRow = Math.ceil(order.length / rows.length)
  const toys = order.map((i, n) => {
    const row = rows[Math.floor(n / perRow)]
    const col = n % perRow
    const prep = plushArt[i][0]
    const flat = prep.aspect > 1.2 ? makeFlat([prep], { width: PLUSH_H * 1.35 }) : makeFlat([prep], { height: PLUSH_H * (0.92 + rand() * 0.16) })
    const x = lerp(left, right, (col + 0.5 + (Math.floor(n / perRow) % 2 ? 0.45 : 0)) / (perRow + 0.45)) + (rand() - 0.5) * 0.2
    const home = new THREE.Vector3(x, PIT + row.lift + flat.height / 2, row.z + (rand() - 0.5) * 0.06)
    const tilt = (rand() - 0.5) * 0.6
    flat.mesh.position.copy(home)
    flat.mesh.rotation.z = tilt
    group.add(flat.mesh)
    return { mesh: flat.mesh, h: flat.height, home, tilt, who: crew[i], game: gameOf(crew[i]) }
  })

  // ---- the claw: a rail under the marquee, a carriage, a cable, the claw -----------------------
  const railY = top - 0.07
  const metal = new THREE.MeshLambertMaterial({ color: '#6f737c' })
  const rail = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * POST, 0.05, 0.05), metal)
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), metal)
  const cable = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 1).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({ color: '#2a2a30' }))
  const claw = new THREE.Group()
  const hub = makeFlat(hubArt, { width: 0.27 })
  hub.mesh.position.y = -hub.height / 2
  claw.add(hub.mesh)
  const prongs = [-1, 1, 0].map((side) => {
    const prong = makeFlat(prongArt, { height: 0.4 })
    prong.mesh.position.y = -prong.height / 2 + 0.01
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.075, -hub.height + 0.03, side ? 0.004 : -0.012)
    pivot.add(prong.mesh)
    if (side > 0) prong.mesh.scale.x = -1 // (drawn as the left one)
    if (!side) prong.mesh.material = prong.mesh.material.clone()
    if (!side) prong.mesh.material.color.setScalar(0.72) // the one at the back, in shadow
    claw.add(pivot)
    return { pivot, side }
  })
  for (const part of [rail, carriage, cable, claw]) group.add(part)
  for (const mesh of [rail, carriage]) mesh.castShadow = true
  const reachOf = (toy) => railY - 0.05 - hub.height - toy.h / 2 + 0.08 - toy.home.y // cable length that meets it

  const home = { x: chuteX, z: -0.62 }
  const state = { x: home.x, z: home.z, cable: CABLE, open: 0.3, wobble: 0 }
  let last = null
  function placeClaw() {
    const { x, z, cable: length, open, wobble } = state
    rail.position.set(0, railY, z)
    carriage.position.set(x, railY, z)
    cable.position.set(x, railY - 0.05, z + 0.01)
    cable.scale.y = length
    claw.position.set(x, railY - 0.05 - length, z + 0.012)
    claw.rotation.z = wobble
    for (const { pivot, side } of prongs) pivot.rotation.z = side * lerp(-0.12, 0.6, open) // open: the tips swing out
    const key = `${x}|${z}|${length}|${open}|${wobble}`
    const moved = key !== last
    last = key
    return moved
  }
  placeClaw()
  // a toy in the claw hangs from it
  const hang = (toy, sway = 0) => {
    toy.mesh.position.set(state.x, railY - 0.05 - state.cable - hub.height - toy.h / 2 + 0.08, state.z)
    toy.mesh.rotation.z = toy.tilt * 0.3 + sway
  }

  // ---- the screen in the marquee: her game while a toy is up, "insert coin" the rest of the time ----
  const cut = marqueeArt[0].window ?? { x: 0.419, y: 0.13, w: 0.162, h: 0.74 }
  const screenCanvas = canvas(240, 135)
  const sctx = screenCanvas.getContext('2d')
  const screenMap = texture(screenCanvas)
  screenMap.magFilter = THREE.NearestFilter
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(cut.w * marquee.width * 1.06, cut.h * marquee.height * 1.06), new THREE.MeshBasicMaterial({ map: screenMap }))
  screen.position.set((cut.x + cut.w / 2 - 0.5) * marquee.width, H - marquee.height * (cut.y + cut.h / 2), -0.04)
  group.add(screen)
  const games = projects.filter((g) => g.box === box.id)
  let showing = null // the game on the screen
  let clip = null
  function setShowing(game) {
    if (game === showing) return
    showing = game
    if (clip) {
      clip.pause()
      clip.removeAttribute('src')
      clip.load()
      clip = null
    }
    if (game && has(game.clip) && !stepped.reduced) {
      clip = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'auto', src: base + game.clip })
      clip.play().catch(() => {})
    }
  }
  function drawScreen(frame) {
    if (showing) {
      if (clip && clip.readyState >= 2) sctx.drawImage(clip, 0, 0, 240, 135)
      else sketch.attract(sctx, Math.max(0, games.indexOf(showing)), frame, { title: showing.title })
      sctx.fillStyle = 'rgba(14, 12, 20, 0.82)'
      sctx.fillRect(0, 104, 240, 31)
      sketch.write(sctx, showing.title, 120, 120, { size: 20, max: 220, color: '#fff3c4', font: sketch.BODY, weight: 700 })
    } else {
      sctx.fillStyle = '#1b1b22'
      sctx.fillRect(0, 0, 240, 135)
      const on = Math.floor(frame / 6) % 2 === 0
      sketch.write(sctx, site.ui.claw, 120, 48, { size: 30, max: 220, color: '#ffd36b', font: sketch.BODY, weight: 700 })
      if (on) sketch.write(sctx, 'insert coin', 120, 92, { size: 22, max: 200, color: '#f3e9d2', font: sketch.BODY, weight: 600 })
    }
    screenMap.needsUpdate = true
  }
  drawScreen(0)

  // ---- the marquee's bulbs, and the flare --------------------------------------------------------
  const bulbAt = []
  for (const y of [top + 0.05, H - 0.06]) for (let x = -W / 2 + 0.3; x <= W / 2 - 0.3; x += 0.33) bulbAt.push(new THREE.Vector3(x, y, 0.012))
  const bulbs = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.07, 0.1),
    new THREE.MeshBasicMaterial({ map: texture(sketch.paperBulb()), alphaTest: 0.5, side: THREE.DoubleSide }),
    bulbAt.length,
  )
  const m4 = new THREE.Matrix4()
  bulbAt.forEach((p, k) => bulbs.setMatrixAt(k, m4.makeTranslation(p.x, p.y, p.z)))
  bulbs.frustumCulled = false
  group.add(bulbs)
  const WARM = new THREE.Color('#ffcf6b')
  const DIM = new THREE.Color('#8f6d3e')
  const HOT = new THREE.Color('#fff6d8')
  let lightsUp = false // all on and bright, as it is won
  function paintBulbs(frame) {
    bulbAt.forEach((_, k) => bulbs.setColorAt(k, lightsUp ? HOT : (k + Math.floor(frame / 3)) % 3 ? WARM : DIM))
    bulbs.instanceColor.needsUpdate = true
  }
  paintBulbs(0)
  const flare = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 0.12, H + 0.12),
    new THREE.MeshBasicMaterial({ color: '#fff2d6', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  flare.position.set(0, H / 2, 0.03)
  flare.visible = false
  group.add(flare)
  const setFlare = (k) => {
    flare.visible = k > 0.01
    flare.material.opacity = 0.92 * k
  }

  // ---- the loop ------------------------------------------------------------------------------
  let mode = 'shelf' // 'shelf': playing on the shelf; 'won': the camera has gone in
  let target = toys[0]
  let held = null
  let dropped = null // a toy falling back into the heap: { toy, from, t0 }
  function pick() {
    const choices = toys.filter((t) => t !== target)
    target = choices[Math.floor(rand() * choices.length)]
  }
  const clock = loopClock(stepped, {
    box,
    group,
    period: LOOP,
    active: () => mode === 'shelf' && onShelf(),
    tick(t, prev, c) {
      if (passed(prev, t, 0)) pick()
      const toy = target
      const reach = reachOf(toy)
      const s = state
      s.wobble = 0
      if (t < DRIFT[1]) {
        const k = smooth(t / DRIFT[1])
        s.x = lerp(home.x, toy.home.x, k)
        s.z = lerp(home.z, toy.home.z + 0.01, k)
        s.cable = CABLE
        s.open = Math.min(1, 0.3 + k)
      } else if (t < DROP[1]) {
        s.cable = lerp(CABLE, reach, smooth((t - DROP[0]) / (DROP[1] - DROP[0])))
        s.open = 1
      } else if (t < GRAB[1]) {
        const k = (t - GRAB[0]) / (GRAB[1] - GRAB[0])
        s.cable = reach
        s.wobble = Math.sin(k * 14) * 0.07 * (1 - k)
        s.open = 1 - smooth(k * 1.4)
      } else if (t < LIFT[1]) {
        held = toy
        s.open = 0
        s.cable = lerp(reach, CABLE, smooth((t - LIFT[0]) / (LIFT[1] - LIFT[0])))
      } else if (t < TEASE[1]) {
        const k = smooth((t - TEASE[0]) / (TEASE[1] - TEASE[0]))
        s.x = lerp(toy.home.x, lerp(toy.home.x, home.x, 0.5), k)
        s.cable = CABLE
      } else if (t < BACK[0]) {
        s.wobble = Math.sin(t * 9) * 0.02
      } else if (t < LET_GO) {
        const k = smooth((t - BACK[0]) / (BACK[1] - BACK[0]))
        s.x = lerp(lerp(toy.home.x, home.x, 0.5), toy.home.x, k)
        s.z = toy.home.z + 0.01
      } else if (t < HOME[0]) {
        if (held) {
          dropped = { toy: held, from: held.mesh.position.y, t0: t }
          held = null
        }
        s.open = Math.min(1, (t - LET_GO) * 4)
      } else if (t < HOME[1]) {
        const k = smooth((t - HOME[0]) / (HOME[1] - HOME[0]))
        s.x = lerp(toy.home.x, home.x, k)
        s.z = lerp(toy.home.z + 0.01, home.z, k)
        s.open = lerp(1, 0.3, k)
      }
      const moved = placeClaw()
      if (held) hang(held, Math.sin(t * 5) * 0.06)
      if (dropped) {
        // falling back into the heap, with a little bounce
        const { toy: d, from, t0 } = dropped
        const k = Math.min(1, (t - t0) / 0.5)
        d.mesh.position.set(d.home.x, lerp(from, d.home.y, k * k), d.home.z)
        d.mesh.rotation.z = lerp(d.tilt * 0.3, d.tilt, k)
        if (k >= 1) dropped = null
      }
      // her game on the screen while a toy is up
      setShowing(t >= LIFT[0] && t < LET_GO + 0.6 ? toy.game : null)
      return moved || held || dropped ? true : false
    },
  })
  // the screen and the bulbs keep going (no shadows in them)
  stepped.every(2, (frame) => {
    if (!(mode === 'shelf' && onShelf()) || !group.visible) return false
    drawScreen(frame / 2)
    paintBulbs(frame / 2)
    return 'looks'
  })

  // put every toy back in the heap and the claw home over the chute
  function tidy() {
    held = dropped = null
    for (const toy of toys) {
      toy.mesh.visible = true
      toy.mesh.position.copy(toy.home)
      toy.mesh.rotation.z = toy.tilt
    }
    Object.assign(state, { x: home.x, z: home.z, cable: CABLE, open: 0.3, wobble: 0 })
    placeClaw()
    setShowing(null)
    drawScreen(0)
  }

  return {
    group,
    // Clicked: the toy in the claw (or the one under it, grabbed in a hurry)
    // goes down the prize chute, the lights flare, and at the brightest the
    // machine gives way to the room (\`swap\`).
    async win(swap) {
      mode = 'won'
      const s = state
      if (!held) {
        const toy = target
        const reach = reachOf(toy)
        const x0 = s.x
        const z0 = s.z
        const c0 = s.cable
        await stepped.poses([0.5, 1], (k) => {
          s.x = lerp(x0, toy.home.x, k)
          s.z = lerp(z0, toy.home.z + 0.01, k)
          s.cable = lerp(c0, reach, k)
          s.open = 1
          placeClaw()
        })
        s.open = 0
        held = toy
        hang(toy)
        placeClaw()
      }
      const toy = held
      const x0 = s.x
      const z0 = s.z
      const c0 = s.cable
      setShowing(toy.game)
      await stepped.poses([0.2, 0.45, 0.7, 0.9, 1], (k) => {
        s.x = lerp(x0, home.x, k)
        s.z = lerp(z0, -0.3, k)
        s.cable = lerp(c0, CABLE + 0.05, Math.min(1, k * 1.6))
        placeClaw()
        hang(toy, (1 - k) * 0.1)
      })
      held = null
      s.open = 1
      placeClaw()
      lightsUp = true
      paintBulbs(0)
      const from = toy.mesh.position.y
      await Promise.all([
        stepped.poses([0.2, 0.5, 1], (k) => {
          toy.mesh.position.y = lerp(from, chuteTop - toy.h * 0.8, k)
          toy.mesh.visible = k < 1
        }),
        stepped.poses([0.3, 0.65, 1], setFlare, { delay: 1 }),
      ])
      swap()
      await stepped.poses([0.7, 0.4, 0.15, 0], setFlare)
      lightsUp = false
    },
    // back from the room: the lights flare again and it is a machine, ready to play
    async restore(swap) {
      lightsUp = true
      paintBulbs(0)
      await stepped.poses([0.4, 0.8, 1], setFlare)
      tidy()
      swap()
      await stepped.poses([0.7, 0.35, 0], setFlare)
      lightsUp = false
      paintBulbs(0)
      mode = 'shelf'
      clock.restart()
    },
    // motion off: all the toys in the heap, the claw home, nothing moving
    motion(off) {
      if (!off) return clock.restart()
      if (mode === 'shelf') tidy()
    },
  }
}
