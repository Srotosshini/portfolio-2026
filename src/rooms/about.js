// About: her room, in miniature, with a little photo studio in it.
// A painted backdrop hangs on a roller behind her (a doodle of her, drawn in
// marker); her camera stands on its tripod facing her; on the wall, a
// corkboard with a hand-drawn map of the places she has been, fairy lights
// strung over it. Over and over, on the shelf and inside: the backdrop rolls
// up and down again on the next place, she strikes her pose, the camera
// counts down 3, 2, 1 and flashes (she hops), and a polaroid slides out. It
// floats to the front, big, and develops out of the white as it shakes: her,
// in front of that place. Then it is pinned up on the board and a red thread
// runs from it to the place on the map, where a heart pops up. When the board
// is full, the pins come out and the photos slide into the memories box.
// Clicking the box: one big flash, and the camera flies in; her About card
// (bio, CV, contact) opens beside the room.
import * as THREE from 'three'
import { about } from '../data/projects.js'
import { makePiece, makeFlat, texture, canvas, boil, rng } from '../lib/paper.js'
import * as sketch from '../lib/placeholders.js'
import * as drawn from '../lib/polaroids.js'
import { art, files, base } from '../lib/assets.js'
import { renderAbout } from '../lib/pages.js'
import { loopClock, passed, smooth } from '../lib/loop.js'

// Where things are on the camera's drawing, as fractions of its width (from
// the left) and height (from the bottom): the countdown light, the flash, and
// the slot the photos come out of. Change these to fit your own drawing.
const LIGHT = { x: 0.545, y: 0.91 }
const FLASH = { x: 0.145, y: 0.91 }
const SLOT = { x: 0.548, y: 0.968 }

const PW = 0.3 // a polaroid on the board, in scene units
const PH = PW * 1.2
const BIG = 1.85 // how much bigger it is held up at the front while it develops
const PINS = ['#e0483e', '#f2c544', '#4f86d9'] // pushpin colours (her own: pushpin-1.png, -2, -3)
const COUNT_COLOURS = ['#f2c75c', '#8fb1e3', '#e2a0a6']

// The loop, in seconds. Each photo's times are counted from the start of the
// loop, or from when the board has cleared, if it was full.
const LOOP = 9.6
const CLEAR = 1.3 // the pins come out and the photos slide into the memories box
const ROLL = [0, 0.42, 0.52, 1.0] // the backdrop rolls up, changes, and rolls down again
const COUNT = [1.05, 1.6, 2.15] // 3, 2, 1 (each up for 0.45 s; the red light blinks with it)
const SNAP = 2.7 // the flash
const OUT = [2.9, 3.4] // the polaroid slides out of the top of the camera,
const RISE = [3.4, 3.95] // floats up to the front, growing,
const DEVELOP = [3.95, 6.0] // shakes and develops,
const FLY = [6.0, 6.7] // flies to the board,
const PIN = 6.7 // is pinned up,
const THREAD = [6.9, 7.4] // a red thread runs to its place on the map,
const HEART = 7.4 // and a heart pops up there

export async function build({ box, stepped, onShelf }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)
  const rand = rng(14)
  const lerp = THREE.MathUtils.lerp
  const places = (about.places || [])
    .map((p) => (typeof p === 'string' ? { name: p } : p))
    .filter((p) => p && p.name)
    .map((p) => ({ ...p, name: String(p.name).trim() }))
  const count = places.length
  const capacity = Math.min(6, Math.max(3, count))

  // her drawings where they exist, labelled stand-ins where they do not
  const area = drawn.mapArea(places)
  const [peaceArt, idleArt, cameraArt, corkArt, pinArt, rollerArt, mapArt, heartArt, boxArt, rugArt, burstArt, ...badgeArts] = await Promise.all([
    art('drawings/doodle', (seed) => sketch.doodle(seed, 'peace')),
    art('drawings/doodle-idle', (seed) => sketch.doodle(seed, 'idle')),
    art('drawings/selfie-camera', (seed) => drawn.selfieCamera(seed)),
    art('drawings/corkboard', (seed) => drawn.corkboard(seed), { tracings: 1 }),
    art('drawings/pushpin', (n) => drawn.pushpin(PINS[(n - 1) % PINS.length]), { edge: 2, tracings: PINS.length }),
    art('drawings/backdrop-roller', (seed) => drawn.roller(seed), { tracings: 1 }),
    art('drawings/map', (seed) => drawn.worldMap(area, seed).canvas, { edge: 0, trim: false, tracings: 1 }),
    art('drawings/map-heart', (seed) => drawn.heart(seed), { edge: 3, tracings: 1 }),
    art('drawings/memories-box', (seed) => drawn.memoryBox(seed)),
    art('drawings/rug', (seed) => drawn.rug(seed), { edge: 0, tracings: 1 }),
    art('drawings/flash-burst', (seed) => drawn.starburst(seed), { edge: 3, tracings: 1 }),
    ...['3', '2', '1'].map((n, i) => art(`drawings/countdown-${n}`, (seed) => drawn.badge(n, COUNT_COLOURS[i], seed), { tracings: 1 })),
  ])
  const mapSpot = drawn.mapSpot(area) // (where each place falls on the map, as fractions of the sheet)

  // ---- the room: a rug, the backdrop on its roller, her, her camera ----------------------------
  const rug = makeFlat(rugArt, { width: 1.5 })
  rug.mesh.rotation.x = -Math.PI / 2
  rug.mesh.position.set(-0.55, 0.004, -0.72)
  rug.mesh.castShadow = false
  room.add(rug.mesh)

  const BACKDROP = { x: -0.74, top: 2.04, w: 1.42, z: -1.32 }
  const roller = makeFlat(rollerArt, { width: BACKDROP.w + 0.16 })
  roller.mesh.position.set(BACKDROP.x, BACKDROP.top + 0.03, BACKDROP.z + 0.02)
  room.add(roller.mesh)
  const bottomRod = makeFlat(rollerArt, { width: BACKDROP.w + 0.06 })
  bottomRod.mesh.scale.y = 0.7
  room.add(bottomRod.mesh)
  const scenery = new THREE.Mesh(new THREE.PlaneGeometry(BACKDROP.w, BACKDROP.w).translate(0, -BACKDROP.w / 2, 0), new THREE.MeshLambertMaterial())
  scenery.position.set(BACKDROP.x, BACKDROP.top, BACKDROP.z)
  scenery.castShadow = scenery.receiveShadow = true
  room.add(scenery)

  const her = { idle: makePiece(idleArt, { height: 1.28 }), peace: makePiece(peaceArt, { height: 1.28 }) }
  for (const piece of Object.values(her)) {
    piece.group.position.set(BACKDROP.x, 0, -0.88)
    piece.group.rotation.y = 0.1
    room.add(piece.group)
  }
  let pose = null
  function strike(name) {
    if (pose === name) return false
    pose = name
    her.idle.group.visible = name === 'idle'
    her.peace.group.visible = name === 'peace'
    return true
  }
  strike('idle')

  const camera = makePiece(cameraArt, { height: 1.08 })
  camera.group.position.set(0.5, 0, -0.32)
  camera.group.rotation.y = -0.2 // turned toward her
  room.add(camera.group)
  const onCamera = (f, z = 0) => new THREE.Vector3((f.x - 0.5) * camera.width, f.y * camera.height, z)

  // ---- the wall: corkboard, map, fairy lights; the memories box below ----------------------------
  const board = makeFlat(corkArt, { width: 1.34 })
  const BOARD = { x: inner.w / 2 - 0.74, y: 1.47, z: inner.back + 0.012 }
  board.mesh.position.set(BOARD.x, BOARD.y, BOARD.z)
  board.mesh.castShadow = false
  room.add(board.mesh)
  const map = makeFlat(mapArt, { width: 0.66 })
  map.mesh.position.set(BOARD.x, BOARD.y - 0.01, BOARD.z + 0.005)
  map.mesh.rotation.z = 0.02
  map.mesh.castShadow = false
  room.add(map.mesh)
  for (const sx of [-1, 1]) {
    const pin = makeFlat([pinArt[sx > 0 ? 1 : 2]], { width: 0.045 })
    pin.mesh.position.set(BOARD.x + sx * (map.width / 2 - 0.03), BOARD.y + map.height / 2 - 0.04, BOARD.z + 0.012)
    room.add(pin.mesh)
  }
  const placeAt = places.map((p) => {
    if (!Number.isFinite(p.lon) || !Number.isFinite(p.lat)) return null
    const [fx, fy] = mapSpot(p)
    return new THREE.Vector3(BOARD.x + (fx - 0.5) * map.width, BOARD.y - 0.01 + (0.5 - fy) * map.height, BOARD.z + 0.014)
  })
  const hearts = placeAt.map((at) => {
    if (!at) return null
    const h = makeFlat(heartArt, { width: 0.06 })
    h.mesh.position.copy(at)
    h.mesh.position.z += 0.004
    h.mesh.visible = false
    h.mesh.castShadow = false
    room.add(h.mesh)
    return h.mesh
  })
  // the photos go up round the map, each a little crooked
  const around = [
    [-0.47, 0.25],
    [0.47, 0.25],
    [-0.47, -0.25],
    [0.47, -0.25],
    [0, 0.36],
    [0, -0.36],
  ]
  const spots = Array.from({ length: capacity }, (_, k) => ({
    x: BOARD.x + around[k][0] + (rand() - 0.5) * 0.03,
    y: BOARD.y + around[k][1] + (rand() - 0.5) * 0.03,
    z: BOARD.z + 0.02 + k * 0.002,
    tilt: (rand() - 0.5) * 0.3,
  }))

  // fairy lights along the top of the board
  const bulbAt = []
  {
    const a = new THREE.Vector3(BOARD.x - board.width / 2 - 0.04, BOARD.y + board.height / 2 + 0.03, BOARD.z + 0.03)
    const b = new THREE.Vector3(BOARD.x + board.width / 2 + 0.04, BOARD.y + board.height / 2 + 0.03, BOARD.z + 0.03)
    const points = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      points.push(new THREE.Vector3().lerpVectors(a, b, t).setY(lerp(a.y, b.y, t) - Math.sin(Math.PI * t) * 0.17 - Math.sin(Math.PI * t * 2) ** 2 * 0.03))
    }
    const wire = []
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i]
      const q = points[i + 1]
      wire.push(p.x, p.y + 0.004, p.z, p.x, p.y - 0.004, p.z, q.x, q.y + 0.004, q.z, p.x, p.y - 0.004, p.z, q.x, q.y - 0.004, q.z, q.x, q.y + 0.004, q.z)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3))
    room.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#3a3328', side: THREE.DoubleSide })))
    for (let i = 2; i < points.length - 1; i += 3) bulbAt.push(points[i].clone().add(new THREE.Vector3(0, -0.03, 0.004)))
  }
  const bulbs = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.045, 0.065),
    new THREE.MeshBasicMaterial({ map: texture(sketch.paperBulb()), alphaTest: 0.5, side: THREE.DoubleSide }),
    bulbAt.length,
  )
  const m4 = new THREE.Matrix4()
  bulbAt.forEach((p, k) => bulbs.setMatrixAt(k, m4.makeTranslation(p.x, p.y, p.z)))
  bulbs.frustumCulled = false
  room.add(bulbs)
  const BULBS = [new THREE.Color('#ffd36b'), new THREE.Color('#ffe9a8'), new THREE.Color('#ffc0a0')]
  const DIM = new THREE.Color('#a8844a')
  const twinkle = bulbAt.map(() => 0)
  function paintBulbs() {
    bulbAt.forEach((_, k) => bulbs.setColorAt(k, twinkle[k] > 0 ? DIM : BULBS[k % 3]))
    bulbs.instanceColor.needsUpdate = true
  }
  paintBulbs()

  const memories = makePiece(boxArt, { width: 0.56 })
  memories.group.position.set(BOARD.x + 0.36, 0, inner.back + 0.36)
  memories.group.rotation.y = -0.08
  room.add(memories.group)
  const memoriesTop = memories.height * 0.78

  // ---- the backdrop: one painted place after another ----------------------------------------
  const scenes = []
  for (let i = 0; i < count; i++) {
    const slug = places[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const [prep] = await art(`drawings/place-${slug}`, () => drawn.place(places[i].name, i + 1), { edge: 0, trim: false, tracings: 1 })
    scenes.push(prep.front)
  }
  const sceneMaps = scenes.map((s) => texture(s))
  let showingScene = -1
  let rolled = -1
  function hangScene(i) {
    if (i === showingScene || !sceneMaps[i]) return
    showingScene = i
    scenery.material.map = sceneMaps[i]
    scenery.material.needsUpdate = true
    rolled = -1
  }
  // 0: rolled right up into the roller; 1: all the way down
  function unroll(k) {
    if (k === rolled) return false
    rolled = k
    const s = Math.max(0.04, k)
    scenery.scale.y = s
    const map = scenery.material.map
    if (map) {
      map.repeat.y = s
      map.offset.y = 1 - s
    }
    bottomRod.mesh.position.set(BACKDROP.x, BACKDROP.top - BACKDROP.w * s - 0.005, BACKDROP.z + 0.03)
    return true
  }

  // ---- her photos: her (in her peace-sign pose), in front of each place ------------------------
  const photos = scenes.map((scene, i) => {
    const photo = canvas(440, 440)
    drawn.selfie(photo, scene, peaceArt[0].front, i)
    return photo
  })

  // ---- polaroids: one for each spot on the board, and one more in the camera ------------------
  const back = new THREE.MeshLambertMaterial({ color: '#34343c', side: THREE.BackSide })
  const sheet = new THREE.PlaneGeometry(PW, PH)
  const threadShape = new THREE.PlaneGeometry(0.008, 1).translate(0, 0.5, 0)
  const threadLook = new THREE.MeshBasicMaterial({ color: '#b82e36' })
  const polaroids = Array.from({ length: capacity + 1 }, (_, k) => {
    const face = canvas(360, 432)
    const map = texture(face)
    const front = new THREE.Mesh(sheet, new THREE.MeshLambertMaterial({ map }))
    const rear = new THREE.Mesh(sheet, back)
    front.castShadow = front.receiveShadow = true
    const group = new THREE.Group()
    group.add(front, rear)
    group.visible = false
    room.add(group)
    const pin = makeFlat([pinArt[k % pinArt.length]], { width: 0.05 })
    pin.mesh.visible = false
    room.add(pin.mesh)
    const thread = new THREE.Mesh(threadShape, threadLook)
    thread.visible = false
    room.add(thread)
    return { group, face, map, pin: pin.mesh, thread, place: -1, spot: -1, k: -1, pinAt: new THREE.Vector3() }
  })
  function develop(p, k) {
    if (p.k === k) return false
    p.k = k
    drawn.polaroidFace(p.face, photos[p.place], places[p.place].name, k)
    p.map.needsUpdate = true
    return true
  }
  // up on the board, pinned
  function pinUp(p, spot, scale = 1, pinScale = 1) {
    const s = spots[spot]
    p.spot = spot
    p.group.visible = true
    p.group.position.set(s.x, s.y, s.z)
    p.group.rotation.set(0, 0, s.tilt)
    p.group.scale.setScalar(scale)
    p.pinAt.set(s.x - Math.sin(s.tilt) * (PH / 2 - 0.035), s.y + Math.cos(s.tilt) * (PH / 2 - 0.035), s.z + 0.014)
    p.pin.visible = pinScale > 0.01
    p.pin.position.copy(p.pinAt)
    p.pin.scale.setScalar(pinScale)
  }
  // the red thread from its pin to its place on the map, drawn out as far as k
  function stretch(p, k) {
    const to = placeAt[p.place]
    if (!to || k <= 0.01) {
      p.thread.visible = false
      return
    }
    const dx = to.x - p.pinAt.x
    const dy = to.y - p.pinAt.y
    p.thread.visible = true
    p.thread.position.set(p.pinAt.x, p.pinAt.y, BOARD.z + 0.012)
    p.thread.rotation.z = Math.atan2(dy, dx) - Math.PI / 2
    p.thread.scale.y = Math.hypot(dx, dy) * k
  }
  function popHeart(p, scale) {
    const h = hearts[p.place]
    if (!h) return
    h.visible = scale > 0.01
    h.scale.setScalar(Math.max(0.01, scale))
  }

  // ---- the countdown, the flash ----------------------------------------------------------------
  const badges = badgeArts.map((preps, i) => {
    const b = makeFlat(preps, { width: 0.3 })
    b.mesh.position.set(camera.group.position.x - 0.08 + (i - 1) * 0.05, 1.46, camera.group.position.z + 0.06)
    b.mesh.rotation.z = (i - 1) * -0.12
    b.mesh.visible = false
    b.mesh.castShadow = false
    room.add(b.mesh)
    return b.mesh
  })
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16), new THREE.MeshBasicMaterial({ color: '#4a1712' }))
  lamp.position.copy(onCamera(LIGHT, 0.006))
  camera.hinge.add(lamp)
  room.updateWorldMatrix(true, true)
  const inRoom = (v) => room.worldToLocal(camera.hinge.localToWorld(v))
  const burst = makeFlat(burstArt, { width: 0.42 })
  burst.mesh.position.copy(inRoom(onCamera(FLASH, 0.03)))
  burst.mesh.visible = false
  burst.mesh.castShadow = false
  room.add(burst.mesh)
  const whiteout = new THREE.Mesh(
    new THREE.PlaneGeometry(inner.w, inner.h),
    new THREE.MeshBasicMaterial({ color: '#ffffff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }),
  )
  whiteout.position.set(0, inner.h / 2, -0.02)
  whiteout.visible = false
  room.add(whiteout)
  let lit = false
  function setLight(on) {
    if (on === lit) return false
    lit = on
    lamp.material.color.set(on ? '#ff4636' : '#4a1712')
    return true
  }
  let flashLevel = 0
  function setFlash(k) {
    if (k === flashLevel) return false
    flashLevel = k
    whiteout.visible = k > 0.01
    whiteout.material.opacity = 0.8 * k
    return true
  }
  // one big flash over everything as the box is clicked (a fade, not a movement: motion off skips it)
  const bigFlash = document.createElement('div')
  bigFlash.className = 'camera-flash'
  bigFlash.setAttribute('aria-hidden', 'true')
  document.body.append(bigFlash)

  // ---- the loop -------------------------------------------------------------------------------
  const slotAt = (rise) => inRoom(onCamera(SLOT, -0.012).add(new THREE.Vector3(0, rise, 0)))
  const inside = slotAt(-PH / 2 - 0.02) // all the way into the camera
  const out = slotAt(PH * 0.34) // most of the way out
  const turned = camera.group.rotation.y
  const front = new THREE.Vector3(-0.04, 1.36, -0.1) // where it is held up to develop

  const pinned = [] // up on the board, in the order they went up
  let next = 0 // the place the next photo is of
  let shot = null // the polaroid being taken
  let clearing = [] // what is coming off a full board
  let offset = 0 // this time round, the photo waits for the board to clear first
  let inRoomNow = false // the camera is inside: the loop carries on there
  let tick = 0

  // The whole scene, as the shelf first shows it: a few photos already up, threads and all.
  const first = Math.min(2, capacity - 1, count)
  for (let i = 0; i < first; i++) {
    const p = polaroids[i]
    p.place = i
    develop(p, 1)
    pinUp(p, i)
    stretch(p, 1)
    popHeart(p, 1)
    pinned.push(p)
  }
  next = count ? first % count : 0
  hangScene(count ? (first + count - 1) % count : 0)
  unroll(1)

  function takeNext() {
    const p = polaroids.find((q) => !pinned.includes(q) && !clearing.includes(q))
    p.place = next
    next = (next + 1) % count
    p.k = -1
    develop(p, 0)
    p.group.visible = p.pin.visible = p.thread.visible = false
    p.group.scale.setScalar(1)
    return p
  }

  // everything on the board comes down: pins out, threads in, the photos into the memories box
  function stepClear(t) {
    clearing.forEach((p, i) => {
      const s = spots[p.spot]
      const tp = t - i * 0.1
      if (tp <= 0) return
      // the thread pulls back to the map as the pin pops out
      stretch(p, Math.max(0, 1 - tp / 0.3))
      popHeart(p, Math.max(0, 1 - tp / 0.3))
      const py = p.pinAt.y + 0.05 * Math.min(1, tp / 0.08) - 5 * Math.max(0, tp - 0.08) ** 2
      p.pin.position.set(p.pinAt.x + tp * 0.12, py, p.pinAt.z + Math.min(0.06, tp * 0.4))
      p.pin.rotation.z = tp * 7
      p.pin.visible = py > 0.05 && tp < 0.9
      // the photo: a swing, then down into the box
      const tf = tp - 0.12
      if (tf <= 0) return
      const k = Math.min(1, tf / 0.75)
      const to = new THREE.Vector3(memories.group.position.x - 0.12 + (i % 3) * 0.12, memoriesTop - 0.06, memories.group.position.z - 0.07)
      p.group.position.set(lerp(s.x, to.x, smooth(k)), lerp(s.y, to.y, k * k), lerp(s.z, to.z, k))
      p.group.rotation.z = s.tilt * (1 - k) + Math.sin(tf * 10) * 0.2 * (1 - k)
      p.group.visible = k < 1
    })
  }

  function placeShot(u) {
    const p = shot
    if (u < OUT[0]) {
      if (!p.group.visible) return false
      p.group.visible = false
      return true
    }
    if (u < RISE[0]) {
      // up out of the slot (the camera's body hides what is still inside)
      p.group.visible = true
      p.group.position.lerpVectors(inside, out, smooth((u - OUT[0]) / (OUT[1] - OUT[0])))
      p.group.rotation.set(0, turned, 0)
      p.group.scale.setScalar(1)
      return true
    }
    if (u < DEVELOP[0]) {
      // off the camera, up to the front, growing and turning to face you
      const k = smooth((u - RISE[0]) / (RISE[1] - RISE[0]))
      p.group.visible = true
      p.group.position.lerpVectors(out, front, k)
      p.group.position.y += Math.sin(Math.PI * k) * 0.12
      p.group.rotation.set(0, turned * (1 - k), Math.sin(Math.PI * k) * 0.25)
      p.group.scale.setScalar(lerp(1, BIG, k))
      return true
    }
    if (u < FLY[0]) {
      // shaken while it develops, out of the white
      const k = Math.min(1, (u - DEVELOP[0]) / (DEVELOP[1] - DEVELOP[0]))
      const shake = (tick % 2 ? 1 : -1) * 0.06 * (1 - k * 0.6)
      p.group.visible = true
      p.group.position.set(front.x + shake * 0.15, front.y + Math.abs(shake) * 0.1, front.z)
      p.group.rotation.set(0, 0, shake)
      p.group.scale.setScalar(BIG)
      develop(p, Math.round(k * 16) / 16)
      return true
    }
    const spot = pinned.length
    const s = spots[spot]
    develop(p, 1)
    if (u < PIN) {
      // off to the corkboard, in an arc, shrinking to fit
      const k = smooth((u - FLY[0]) / (FLY[1] - FLY[0]))
      const a = 1 - k
      p.group.visible = true
      p.group.position.set(
        a * a * front.x + 2 * a * k * (front.x + s.x) * 0.5 + k * k * s.x,
        a * a * front.y + 2 * a * k * (Math.max(front.y, s.y) + 0.35) + k * k * s.y,
        a * a * front.z + 2 * a * k * (front.z - 0.4) + k * k * s.z,
      )
      p.group.rotation.set(0, 0, s.tilt * k + Math.sin(Math.PI * k) * 0.5)
      p.group.scale.setScalar(lerp(BIG, 1, k))
      return true
    }
    const k = (u - PIN) / 0.25
    if (k < 1) {
      pinUp(p, spot, 1 + 0.07 * (1 - k), 1 + 0.7 * (1 - k)) // the pin goes in; the photo gives a little bump
      return true
    }
    pinUp(p, spot)
    pinned.push(p)
    shot = null
    return true
  }

  const BADGE_POP = [0.5, 1.25, 1.05, 1]
  const HOP = [0.07, 0.11, 0.07, 0.03, 0]
  const RECOIL = [-0.04, 0.025, -0.01, 0]
  const BURST = [0.6, 1.3, 1.1, 0.75, 0.35]
  const clock = loopClock(stepped, {
    box,
    group: room,
    period: LOOP,
    active: () => count > 0 && (inRoomNow || onShelf()),
    tick(t, prev) {
      tick++
      if (passed(prev, t, 0)) {
        // a new photo; if the board is full, it comes down first
        if (shot) {
          shot.group.visible = shot.pin.visible = false
          shot = null
        }
        offset = 0
        if (pinned.length >= capacity) {
          clearing = pinned.splice(0)
          offset = CLEAR
        }
        shot = takeNext()
      }
      if (clearing.length) {
        stepClear(t)
        if (t >= CLEAR) {
          for (const p of clearing) {
            p.group.visible = p.pin.visible = p.thread.visible = false
            p.pin.rotation.z = 0
            popHeart(p, 0)
          }
          clearing = []
        }
      }
      const u = t - offset
      // the backdrop rolls up and comes down on the next place
      if (u >= ROLL[0] && u < ROLL[3]) {
        if (u < ROLL[1]) unroll(1 - smooth((u - ROLL[0]) / (ROLL[1] - ROLL[0])))
        else if (u < ROLL[2]) {
          unroll(0)
          hangScene(shot.place)
        } else unroll(smooth((u - ROLL[2]) / (ROLL[3] - ROLL[2])))
      } else if (u >= ROLL[3]) {
        hangScene(shot ? shot.place : showingScene)
        unroll(1)
      }
      // her pose: the peace sign from the countdown until the photo is out
      strike(u >= COUNT[0] && u < RISE[1] + 0.3 ? 'peace' : 'idle')
      // 3, 2, 1, the red light blinking with each
      let blink = false
      badges.forEach((b, i) => {
        const k = (u - COUNT[i]) / 0.45
        b.visible = k >= 0 && k < 1
        if (!b.visible) return
        b.scale.setScalar(BADGE_POP[Math.min(BADGE_POP.length - 1, Math.floor(k * 8))] * (k > 0.85 ? 0.6 : 1))
        if (k < 0.55) blink = true
      })
      setLight(blink)
      // the flash: a starburst, the box goes white, she hops, the camera kicks
      const f = (u - SNAP) / 0.45
      const flashing = f >= 0 && f < 1
      const frame = flashing ? Math.min(4, Math.floor(f * 5)) : -1
      burst.mesh.visible = flashing
      if (flashing) burst.mesh.scale.setScalar(BURST[frame])
      setFlash(flashing ? Math.round((1 - f) * 6) / 6 : 0)
      const hop = flashing ? HOP[frame] : 0
      for (const piece of Object.values(her)) piece.group.position.y = hop
      camera.hinge.rotation.z = flashing ? RECOIL[Math.min(3, frame)] : 0
      if (shot) placeShot(u)
      // the thread and the heart for the photo just pinned
      const last = pinned.at(-1)
      if (last && !shot) {
        const k = (u - THREAD[0]) / (THREAD[1] - THREAD[0])
        if (k >= 0 && k <= 1.2) stretch(last, Math.min(1, smooth(k)))
        const h = (u - HEART) / 0.25
        if (h >= 0 && h < 1) popHeart(last, [0.5, 1.35, 1.1, 1][Math.floor(h * 4)])
        else if (h >= 1) popHeart(last, 1)
      }
      return clearing.length > 0 || !!shot || (u >= 0 && u < HEART + 0.3)
    },
  })
  // the fairy lights twinkle; she breathes a little while she waits
  stepped.every(2, (frame) => {
    if (!(inRoomNow || onShelf()) || !room.visible) return false
    let changed = false
    twinkle.forEach((left, k) => {
      if (left > 0) {
        twinkle[k] = left - 1
        if (left === 1) changed = true
      } else if (rand() < 0.04) {
        twinkle[k] = 1 + Math.floor(rand() * 3)
        changed = true
      }
    })
    if (changed) paintBulbs()
    if (pose === 'idle' && !stepped.reduced) her.idle.hinge.rotation.z = Math.sin(frame * 0.12) * 0.012
    return 'looks'
  })

  boil(stepped, [her.idle, her.peace, camera, memories], () => inRoomNow || onShelf())

  return {
    card: () => renderAbout({ files, base }),
    // one big flash as the camera flies in; the loop carries on inside
    async open() {
      inRoomNow = true
      if (stepped.reduced) return
      setFlash(1)
      burst.mesh.visible = true
      bigFlash.classList.remove('is-on')
      void bigFlash.offsetWidth // (so the fade plays again)
      bigFlash.classList.add('is-on')
      await stepped.poses([0.8, 0.55, 0.3, 0.12, 0], (k) => {
        setFlash(k)
        burst.mesh.scale.setScalar(0.4 + k)
        burst.mesh.visible = k > 0.05
      })
    },
    async close() {
      inRoomNow = false
    },
    // motion off: the board as it is, nothing moving
    motion(off) {
      if (!off) return
      setLight(false)
      setFlash(0)
      burst.mesh.visible = false
      for (const b of badges) b.visible = false
      if (shot) shot.group.visible = shot.pin.visible = shot.thread.visible = false
      shot = null
      for (const p of clearing) {
        p.group.visible = p.pin.visible = p.thread.visible = false
        popHeart(p, 0)
      }
      clearing = []
      for (const p of pinned) {
        pinUp(p, p.spot)
        stretch(p, 1)
        popHeart(p, 1)
      }
      strike('idle')
      unroll(1)
    },
  }
}
