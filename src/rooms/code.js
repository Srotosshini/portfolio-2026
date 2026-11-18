// Creative coding: the dark box.
// Black card, lit only by light coming through pinholes. A folded-paper toy
// piano stands in the middle. Each sketch has a key, and a window cut in the
// back wall: press the key and it plays a note (when sound is on), the
// pinholes flare, and its window swings open with the sketch running live
// behind it, throwing coloured light into the box. Click the open window to
// read about the sketch, and to play with it.
import * as THREE from 'three'
import { projects } from '../data/projects.js'
import { PALETTE as P, makePiece, makeFlat, texture, canvas, lightDot, stack, popUp, foldFlat, boil, rng } from '../lib/paper.js'
import { createScraps } from '../lib/scraps.js'
import * as sketch from '../lib/placeholders.js'
import { art, files, base } from '../lib/assets.js'
import { renderProject, isTodo } from '../lib/pages.js'
import { standIn } from '../lib/sketches.js'
import { sound } from '../lib/sound.js'

const KEY = { w: 0.34, gap: 0.02 } // a white key (its height comes from the drawing)
const BLACK_W = 0.2
const PIANO_Z = -0.72 // where the white keys stand (nothing taller than this distance)
const WINDOW = { w: 0.66, h: 0.48 } // a window's opening in the back wall
const ROOM_DIM = 0.78 // how far the lights go down in here
const LOOK_DIM = 0.92 // and while a sketch is open
// white keys C5 to C6, and the sharps: [after which white key, frequency]
const WHITE_NOTES = [['C', 523.25], ['D', 587.33], ['E', 659.25], ['F', 698.46], ['G', 783.99], ['A', 880], ['B', 987.77], ['C', 1046.5]]
const SHARPS = [[0, 'C sharp', 554.37], [1, 'D sharp', 622.25], [3, 'F sharp', 739.99], [4, 'G sharp', 830.61], [5, 'A sharp', 932.33]]
// play from a computer keyboard too: the home row for white keys, the row above for sharps
const TYPED_WHITE = 'asdfghjk'
const TYPED_SHARP = 'wetyu'

export async function build({ box, stepped, overlay, redraw, goTo, lights }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)

  const rand = rng(41)
  const lerp = THREE.MathUtils.lerp
  const sketches = projects.filter((p) => p.box === box.id).slice(0, WHITE_NOTES.length)
  const tints = Object.values(P.highlighter)
  const tintOf = (i) => tints[i % tints.length]
  const nameOf = (p, i) => (!p.title || isTodo(p.title) ? `Sketch ${i + 1}` : p.title)

  const [whiteArt, blackArt, bodyArt, frameArt, flapArts] = await Promise.all([
    art('drawings/key-white', (seed) => sketch.pianoKey(true, seed)),
    art('drawings/key-black', (seed) => sketch.pianoKey(false, seed)),
    art('drawings/piano', (seed) => sketch.pianoBody(seed)),
    art('drawings/window-frame', (seed) => sketch.windowFrame(seed), { edge: 0 }),
    Promise.all(sketches.map((p, i) => art(`drawings/window-flap-${p.id}`, (seed) => sketch.windowFlap(tintOf(i), seed), { edge: 0 }))),
  ])

  const scraps = createScraps(stepped, room, {
    count: 24,
    colors: [P.paper, P.paper, ...tints],
    bounds: { x: inner.w / 2 - 0.15, back: inner.back + 0.15, front: -0.25 },
  })
  const four = () => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  // corners of a rectangle on something, in world space, for a hotspot or a pinned sketch
  const rectOn = (object, x0, y0, x1, y1, z = 0) => {
    const c = four()
    return () => {
      c[0].set(x0, y0, z)
      c[1].set(x1, y0, z)
      c[2].set(x0, y1, z)
      c[3].set(x1, y1, z)
      for (const p of c) object.localToWorld(p)
      return c
    }
  }
  const additive = (options) =>
    new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...options })

  // ---- the toy piano --------------------------------------------------------------
  const pitch = KEY.w + KEY.gap
  const keyX = (i) => (i - (WHITE_NOTES.length - 1) / 2) * pitch
  const body = makePiece(bodyArt, { width: WHITE_NOTES.length * pitch + 0.34, tab: false })
  body.group.position.set(0, 0, PIANO_Z - 0.16)
  room.add(body.group)

  const whites = WHITE_NOTES.map(([note, freq], i) => {
    const piece = makePiece(whiteArt, { width: KEY.w, tab: false })
    piece.group.position.set(keyX(i), 0, PIANO_Z)
    piece.group.rotation.y = (rand() - 0.5) * 0.05
    room.add(piece.group)
    return { piece, note, freq, sketch: i < sketches.length ? i : -1 }
  })
  const whiteTop = whites[0].piece.height
  const blacks = SHARPS.map(([after, note, freq]) => {
    // black keys stand just behind the white ones, their tops showing above
    const piece = makePiece(blackArt, { width: BLACK_W, tab: false, shadow: false })
    piece.group.position.set(keyX(after) + pitch / 2, 0, PIANO_Z - 0.07)
    room.add(piece.group)
    return { piece, note, freq, sketch: -1 }
  })

  // ---- pinholes: light through the card, in faint rays (only while you are inside) ----
  const RAY = 0.2 // how bright the rays are at rest
  const rayLook = additive({ vertexColors: true, opacity: RAY })
  const sparkLook = new THREE.SpriteMaterial({ map: texture(lightDot()), color: 0xfff0cf, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 })
  const rays = new THREE.Group()
  rays.visible = false
  room.add(rays)
  const down = new THREE.Vector3(0, -1, 0)
  for (let i = 0; i < 9; i++) {
    const x = (rand() - 0.5) * (inner.w - 0.4)
    const y = 0.35 + rand() * (inner.h - 0.6)
    const length = 1 + rand() * 0.5
    const shape = new THREE.CylinderGeometry(0.004, 0.05, length, 8, 1, true).translate(0, -length / 2, 0)
    // bright where it comes through the card, fading as it spreads
    const pos = shape.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let k = 0; k < pos.count; k++) {
      const near = 1 - -pos.getY(k) / length
      colors.set([near * 0.32, near * 0.3, near * 0.25], k * 3)
    }
    shape.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const ray = new THREE.Mesh(shape, rayLook)
    ray.position.set(x, y, inner.back + 0.01)
    ray.quaternion.setFromUnitVectors(down, new THREE.Vector3((rand() - 0.5) * 0.3, -0.45 - rand() * 0.2, 1).normalize())
    const spark = new THREE.Sprite(sparkLook)
    spark.position.set(x, y, inner.back + 0.012)
    spark.scale.setScalar(0.07)
    rays.add(ray, spark)
  }

  let flareToken = 0
  // every key sends a pulse of light through the pinholes
  function flare() {
    const mine = ++flareToken
    stepped.poses([2.4, 1.9, 1.5, 1.2, 1], (k) => {
      if (mine !== flareToken) return
      box.glow?.set(k)
      rayLook.opacity = RAY * k
      sparkLook.opacity = Math.min(1, 0.6 * k)
    })
  }

  // ---- the windows in the back wall -------------------------------------------------
  // A hole: where the sketch shows through from behind the scene. It is drawn
  // after the light spilling out of the window, so the light never covers it.
  const holeLook = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending })
  const unit = new THREE.PlaneGeometry(1, 1)
  const haloMap = (() => {
    const c = canvas(128, 128)
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 18, 64, 64, 64)
    g.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return texture(c)
  })()

  const count = sketches.length
  const step = count > 1 ? Math.min(WINDOW.w + 0.16, (inner.w - 0.3) / count) : 0
  const size = Math.min(1, step ? step / (WINDOW.w + 0.16) : 1) // squeeze them if there are many
  const ww = WINDOW.w * size
  const wh = WINDOW.h * size

  const windows = sketches.map((p, i) => {
    const tint = new THREE.Color(tintOf(i))
    const g = new THREE.Group() // origin: the middle of the opening, on the face of the wall
    g.position.set((i - (count - 1) / 2) * step, inner.h * 0.68 + (rand() - 0.5) * 0.14, inner.back + 0.004)
    g.rotation.z = (rand() - 0.5) * 0.05 // cut by hand
    room.add(g)

    const hole = new THREE.Mesh(unit, holeLook)
    hole.scale.set(ww * 1.03, wh * 1.03, 1)
    hole.renderOrder = 2
    hole.visible = false
    const frame = makeFlat(frameArt, { width: ww * (400 / 334) })
    frame.mesh.position.z = 0.004
    const hinge = new THREE.Group() // the flap swings up from the top of the opening
    hinge.position.set(0, wh / 2 + 0.01, 0.012)
    const flap = makeFlat(flapArts[i], { width: ww * 1.06 })
    flap.mesh.position.y = -flap.height / 2
    hinge.add(flap.mesh)

    // the sketch's light: a glow round the opening and a soft shaft falling into the box
    const halo = new THREE.Mesh(unit, additive({ map: haloMap, color: tint, opacity: 0 }))
    halo.scale.set(ww * 2.1, wh * 2.3, 1)
    halo.position.z = 0.002
    halo.renderOrder = 1
    const near = [[-ww / 2, wh / 2], [ww / 2, wh / 2], [ww / 2, -wh / 2], [-ww / 2, -wh / 2]]
    const far = near.map(([x, y]) => [x * 1.25, y * 1.25 - 0.42, 0.62])
    const spillShape = new THREE.BufferGeometry()
    const spillPos = []
    const spillCol = []
    const bright = tint.clone().multiplyScalar(0.07)
    for (let f = 0; f < 4; f++) {
      const a = near[f]
      const b = near[(f + 1) % 4]
      const fa = far[f]
      const fb = far[(f + 1) % 4]
      spillPos.push(a[0], a[1], 0, b[0], b[1], 0, fb[0], fb[1], fb[2], a[0], a[1], 0, fb[0], fb[1], fb[2], fa[0], fa[1], fa[2])
      for (const lit of [1, 1, 0, 1, 0, 0]) spillCol.push(bright.r * lit, bright.g * lit, bright.b * lit)
    }
    spillShape.setAttribute('position', new THREE.Float32BufferAttribute(spillPos, 3))
    spillShape.setAttribute('color', new THREE.Float32BufferAttribute(spillCol, 3))
    const spill = new THREE.Mesh(spillShape, additive({ vertexColors: true, opacity: 0 }))
    spill.renderOrder = 1
    halo.visible = spill.visible = false
    g.add(hole, frame.mesh, hinge, halo, spill)

    return {
      p, i, g, hole, frame, flap, hinge, halo, spill,
      open: false, // the flap is all the way up
      media: null,
      corners: rectOn(g, -ww / 2, -wh / 2, ww / 2, wh / 2),
      spot: null,
    }
  })
  whites.forEach((key) => (key.window = key.sketch >= 0 ? windows[key.sketch] : null))

  // A sketch runs behind its window: hers, from its address, or a stand-in.
  function mount(win) {
    if (win.media) return
    let node
    let stop = () => {}
    if (win.p.build) {
      node = document.createElement('iframe')
      node.src = /^https?:/.test(win.p.build) ? win.p.build : base + win.p.build
      node.title = nameOf(win.p, win.i)
      node.allow = 'autoplay; fullscreen'
    } else {
      const running = standIn(win.i, tintOf(win.i))
      node = running.node
      stop = running.stop
    }
    win.media = { node, stop }
    overlay.pin(node, win.corners)
  }
  function unmount(win) {
    if (!win.media) return
    win.media.stop()
    overlay.unpin(win.media.node)
    win.media = null
  }

  const lightUp = (win, level) => {
    win.halo.visible = win.spill.visible = level > 0.001
    win.halo.material.opacity = 0.3 * level
    win.spill.material.opacity = level
  }

  let opened = null // the window that is open, or opening
  async function openWindow(win) {
    if (opened === win) return
    if (opened) closeWindow(opened)
    opened = win
    mount(win)
    win.hole.visible = true
    await stepped.poses([-0.3, -0.8, -1.3, -1.66, -1.5, -1.57], (a, k) => {
      if (opened !== win) return
      win.hinge.rotation.x = a
      lightUp(win, [0.15, 0.4, 0.7, 1, 0.8, 1][k])
    })
    if (opened === win) win.open = true
  }
  function closeWindow(win) {
    win.open = false
    if (opened === win) opened = null
    return stepped
      .poses([-1.2, -0.7, -0.25, 0], (a, k) => {
        if (opened === win) return // opened again meanwhile
        win.hinge.rotation.x = a
        lightUp(win, [0.6, 0.3, 0.1, 0][k])
      })
      .then(() => {
        if (opened === win) return
        win.hole.visible = false
        unmount(win)
      })
  }

  // ---- playing it --------------------------------------------------------------------
  let standing = false
  let hinted = 0
  function press(key) {
    if (!standing) return
    stepped.poses([-0.16, -0.28, -0.22, -0.08, 0], (a) => (key.piece.hinge.rotation.x = a))
    if (!sound.note(key.freq) && performance.now() - hinted > 4000) {
      hinted = performance.now()
      sound.hint() // show where the sound switch is (not every time: once in a while)
    }
    flare()
    if (key.window) openWindow(key.window)
  }

  // ---- buttons -----------------------------------------------------------------------
  for (const key of whites) {
    key.spot = overlay.addSpot({
      group: box.id,
      label: key.window ? `${nameOf(key.window.p, key.window.i)} (${key.note})` : key.note,
      corners: rectOn(key.piece.hinge, -KEY.w / 2, 0, KEY.w / 2, whiteTop, 0.01),
      onClick: () => press(key),
    })
  }
  for (const key of blacks) {
    // only the part that shows above the white keys can be pressed
    key.spot = overlay.addSpot({
      group: box.id,
      label: key.note,
      corners: rectOn(key.piece.hinge, -BLACK_W / 2, whiteTop + 0.02, BLACK_W / 2, key.piece.height, 0.01),
      onClick: () => press(key),
    })
  }
  for (const win of windows) {
    win.spot = overlay.addSpot({
      group: box.id,
      label: nameOf(win.p, win.i),
      corners: win.corners,
      visible: () => standing && win.open,
      onClick: () => goTo(`#/${box.id}/${win.p.id}`),
    })
  }

  // ---- stand up, fold flat, boil ----------------------------------------------------------
  const ordered = stack([body, ...whites.map((k) => k.piece), ...blacks.map((k) => k.piece)])
  boil(stepped, [...ordered, ...windows.flatMap((w) => [w.frame, w.flap])], () => standing)
  const byId = (id) => windows.find((w) => w.p.id === id)

  return {
    async open() {
      // the lights go down as the piano stands up, and the pinholes start to shine through
      rays.visible = true
      stepped.poses([0.2, 0.45, 0.65, ROOM_DIM], (k) => lights?.dim(k))
      await popUp(stepped, ordered, { onUp: (piece) => scraps.burst(piece.group.position, 2) })
      standing = true
      // and it plays its first key by itself, so you can see what the keys do
      await stepped.wait(3)
      if (standing && !opened) press(whites[0])
    },
    async close() {
      standing = false
      if (opened) await closeWindow(opened)
      for (const win of windows) unmount(win)
      rays.visible = false
      stepped.poses([0.5, 0.25, 0], (k) => lights?.dim(k))
      await foldFlat(stepped, ordered)
    },

    title: (id) => nameOf(byId(id).p, byId(id).i),
    card: (id) => renderProject(byId(id).p, { files, base, media: false }),
    spot: (id) => byId(id)?.spot,

    // while a sketch is open, the camera frames its window
    view(id) {
      const c = byId(id).corners()
      const w = Math.hypot(c[1].x - c[0].x, c[1].y - c[0].y)
      const h = Math.hypot(c[2].x - c[0].x, c[2].y - c[0].y)
      return { cx: (c[0].x + c[3].x) / 2, cy: (c[0].y + c[3].y) / 2, w: w * 1.18, h: h * 1.24, z: c[0].z }
    },

    async start(id) {
      const win = byId(id)
      if (!win.open) {
        press(whites[win.i])
        await stepped.wait(7) // the flap swings up
      }
      await stepped.poses([lerp(ROOM_DIM, LOOK_DIM, 0.5), LOOK_DIM], (k) => lights?.dim(k))
    },
    end() {
      stepped.poses([lerp(ROOM_DIM, LOOK_DIM, 0.5), ROOM_DIM], (k) => lights?.dim(k))
    },

    // play it from a computer keyboard: A S D F G H J K and W E T Y U
    key(typed, item) {
      if (item || !standing || typed.length !== 1) return
      const t = typed.toLowerCase()
      if (TYPED_WHITE.includes(t)) press(whites[TYPED_WHITE.indexOf(t)])
      else if (TYPED_SHARP.includes(t)) press(blacks[TYPED_SHARP.indexOf(t)])
    },
  }
}
