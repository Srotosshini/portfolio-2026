// About: her room, a cosy diorama where everything does something.
//   back wall, left:  the travel pinboard, a polaroid for every city she has
//                     been to, a map behind them and a red string from Dhaka
//   middle:           her camera on its tripod, taking her photo, over and over
//   back wall, right: her school pennants, and the window (a city outside)
//   right:            her desk: lamp, laptop (GitHub), notebook (her bio),
//                     envelope (email), card holder (LinkedIn), folder (CV)
//   front left:       her violin in its case; front right: a suitcase
//   on the rug:       her cat
// Click a polaroid and it comes off the board, big, with her photos from that
// trip; the camera takes a photo when clicked; the violin plays and turns into
// her two performances; the pennants pull down a report card; the lamp turns
// the room from night to day; the window shows another city; the suitcase
// counts the countries; the cat purrs when stroked and does what cats do.
import * as THREE from 'three'
import { about } from '../data/projects.js'
import { places, windowViews } from '../data/places.js'
import { makePiece, makeFlat, texture, canvas, cardCanvas, boil, rng, lightDot } from '../lib/paper.js'
import { art, files, turn, loadImage } from '../lib/assets.js'
import { sound } from '../lib/sound.js'
import { loopClock, passed, smooth } from '../lib/loop.js'
import * as drawn from '../lib/polaroids.js'
import * as things from '../lib/room-things.js'
import { scene, herFor, view } from '../lib/scenes.js'
import { doodle } from '../lib/doodle.js'
import { makeAboutUI } from '../lib/about-ui.js'

// Where things are on the camera's drawing, as fractions of its width (from
// the left) and height (from the bottom): the countdown light, the flash, and
// the slot the photos come out of. Change these to fit your own drawing.
const LIGHT = { x: 0.545, y: 0.91 }
const FLASH = { x: 0.145, y: 0.91 }
const SLOT = { x: 0.548, y: 0.968 }

const PW = 0.15 // a polaroid on the board
const PH = PW * 1.2
const NIGHT = 0.42 // how dark the room is at night, inside (the lamp and the window glow)
const PINS = ['#e0483e', '#f2c544', '#4f86d9']
const COUNT_COLOURS = ['#f2c75c', '#8fb1e3', '#e2a0a6']
// the camera's loop, in seconds
const LOOP = 9
const COUNT = [0.5, 1.05, 1.6] // 3, 2, 1 (and the red light)
const SNAP = 2.15 // the flash
const OUT = [2.35, 2.85] // the polaroid slides out of the top,
const RISE = [2.85, 3.4] // floats up to the front, growing,
const DEVELOP = [3.4, 5.4] // develops as it is shaken,
const FLY = [5.4, 6.1] // and flies to its city's place on the board
const PIN = 6.1

export async function build({ box, stepped, overlay, redraw, lights, camera: lens, onShelf }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)
  const rand = rng(14)
  const lerp = THREE.MathUtils.lerp
  const V = (x, y, z) => new THREE.Vector3(x, y, z)
  const back = inner.back
  const ui = makeAboutUI({ reduced: () => stepped.reduced })
  const countries = [...new Set(places.map((p) => p.country))]
  const photosOf = (p) => files.filter((f) => f.startsWith(`about/places/${p.slug}/`) && /\.(jpe?g|png|webp|avif)$/i.test(f)).sort()

  // ---- her drawings where they exist, stand-ins where they do not ---------------------------------
  const one = { tracings: 1 }
  const flat = { edge: 0, trim: false, tracings: 1 }
  const [
    peaceArt, idleArt, waveArt, cameraArt, boardArt, pinArt, mapArt, tagArt, deskArt, lampArt, laptopArt, noteArt, envelopeArt, flapArt, letterArt,
    holderArt, cardArt, folderArt, windowArt, noteWallArt, caseArt, violinArt, bowArt, noteA, noteB, suitcaseArt, lidArt, slipArt, rugArt,
    heartArt, zeeArt, toyArt, burstArt, ...badgeArts
  ] = await Promise.all([
    art('drawings/doodle', (s) => doodle(s, { pose: 'peace' })),
    art('drawings/doodle-idle', (s) => doodle(s, { pose: 'stand' })),
    art('drawings/doodle-wave', (s) => doodle(s, { pose: 'wave' })),
    art('drawings/selfie-camera', (s) => drawn.selfieCamera(s)),
    art('drawings/pinboard', (s) => things.pinboard(s), one),
    art('drawings/pushpin', (n) => drawn.pushpin(PINS[(n - 1) % PINS.length]), { edge: 2, tracings: PINS.length }),
    art('drawings/pinboard-map', (s) => drawn.worldMap(MAP_AREA, s).canvas, flat),
    art('drawings/pinboard-tag', (s) => things.tag(`${places.length} cities and counting`, s), one),
    art('drawings/desk', (s) => things.deskFront(s), one),
    art('drawings/desk-lamp', (s) => things.lamp(s), one),
    art('drawings/laptop', (s) => things.laptop(s), one),
    art('drawings/notebook', (s) => things.notebook(about.bio.join(' '), s), { edge: 3, tracings: 1 }),
    art('drawings/envelope', (s) => things.envelope(s), one),
    art('drawings/envelope-flap', (s) => things.envelopeFlap(s), { edge: 2, tracings: 1 }),
    art('drawings/letter', (s) => things.letter(s), { edge: 2, tracings: 1 }),
    art('drawings/card-holder', (s) => things.cardHolder(s), one),
    art('drawings/business-card', (s) => things.businessCard(s), { edge: 2, tracings: 1 }),
    art('drawings/cv-folder', (s) => things.folder(s), one),
    art('drawings/window', (s) => things.windowFrame(s), { edge: 3, tracings: 1, trim: false }),
    art('drawings/wall-note', (s) => things.note(about.hello, s), one),
    art('drawings/violin-case', (s) => things.violinCase(s), one),
    art('drawings/violin', (s) => things.violin(s), one),
    art('drawings/violin-bow', (s) => things.bow(s), one),
    art('drawings/music-note-1', (s) => things.musicNote(0, s), { edge: 2, tracings: 1 }),
    art('drawings/music-note-2', (s) => things.musicNote(1, s), { edge: 2, tracings: 1 }),
    art('drawings/suitcase', (s) => things.suitcase(countries, s), one),
    art('drawings/suitcase-lid', (s) => things.suitcaseLid(s), one),
    art('drawings/suitcase-slip', (s) => things.suitcaseSlip(`${countries.length} countries · ${places.length} cities`, s), { edge: 2, tracings: 1 }),
    art('drawings/rug', (s) => drawn.rug(s), flat),
    art('drawings/heart', (s) => drawn.heart(s), { edge: 2, tracings: 1 }),
    art('drawings/zzz', (s) => things.zee(s), { edge: 2, tracings: 1 }),
    art('drawings/string-toy', (s) => things.stringToy(s), { edge: 2, tracings: 1 }),
    art('drawings/flash-burst', (s) => drawn.starburst(s), { edge: 3, tracings: 1 }),
    ...['3', '2', '1'].map((n, i) => art(`drawings/countdown-${n}`, (s) => drawn.badge(n, COUNT_COLOURS[i], s), one)),
  ])
  const pennantArts = []
  for (const school of about.education) {
    const slug = school.short.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    pennantArts.push(await art(`drawings/pennant-${slug}`, (s) => things.pennant(school.short, school.colours[0], school.colours[1], s), one))
  }
  const catArts = {}
  for (const pose of Object.keys(things.CAT)) catArts[pose] = await art(`drawings/cat-${pose}`, () => things.CAT[pose](), { edge: 4, trim: false, tracings: 1 })

  // ---- the room: rug, her, her camera ------------------------------------------------------------------
  const rug = makeFlat(rugArt, { width: 1.6 })
  rug.mesh.rotation.x = -Math.PI / 2
  rug.mesh.position.set(-0.05, 0.004, -0.62)
  rug.mesh.castShadow = false
  room.add(rug.mesh)

  const HER = V(-0.46, 0, -1.04)
  const her = { idle: makePiece(idleArt, { height: 1.12 }), peace: makePiece(peaceArt, { height: 1.12 }), wave: makePiece(waveArt, { height: 1.12 }) }
  for (const piece of Object.values(her)) {
    piece.group.position.copy(HER)
    piece.group.rotation.y = 0.18
    room.add(piece.group)
  }
  let pose = null
  function strike(name) {
    if (pose === name) return false
    pose = name
    for (const [k, piece] of Object.entries(her)) piece.group.visible = k === name
    return true
  }
  strike('idle')

  const camera = makePiece(cameraArt, { height: 0.98 })
  camera.group.position.set(0.1, 0, -0.46)
  camera.group.rotation.y = -0.28 // turned toward her
  room.add(camera.group)
  const onCamera = (f, z = 0) => V((f.x - 0.5) * camera.width, f.y * camera.height, z)

  // ---- the travel pinboard -----------------------------------------------------------------------------
  const board = makeFlat(boardArt, { width: 1.7 })
  const BOARD = { x: -0.97, y: 1.74, z: back + 0.012 }
  board.mesh.position.set(BOARD.x, BOARD.y, BOARD.z)
  board.mesh.castShadow = false
  room.add(board.mesh)
  const map = makeFlat(mapArt, { width: 1.46 })
  map.mesh.position.set(BOARD.x, BOARD.y - 0.01, BOARD.z + 0.004)
  map.mesh.rotation.z = 0.012
  map.mesh.castShadow = false
  room.add(map.mesh)
  const countTag = makeFlat(tagArt, { width: 0.4 })
  countTag.mesh.position.set(BOARD.x + board.width / 2 - 0.3, BOARD.y - board.height / 2 + 0.07, BOARD.z + 0.02)
  countTag.mesh.rotation.z = 0.04
  countTag.mesh.castShadow = false
  room.add(countTag.mesh)
  const spotOnMap = drawn.mapSpot(MAP_AREA)
  // each polaroid starts where its city is on the map, then they shuffle apart so they overlap a little at most
  const anchors = places.map((p) => {
    const [fx, fy] = spotOnMap(p)
    return V(BOARD.x + (fx - 0.5) * map.width, BOARD.y - 0.01 + (0.5 - fy) * map.height, 0)
  })
  const slots = anchors.map((a) => a.clone())
  const xLim = board.width / 2 - PW / 2 - 0.06
  const yLim = board.height / 2 - PH / 2 - 0.06
  for (let it = 0; it < 400; it++) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const dx = slots[j].x - slots[i].x
        const dy = slots[j].y - slots[i].y
        const ox = PW * 0.98 - Math.abs(dx)
        const oy = PH * 0.95 - Math.abs(dy)
        if (ox > 0 && oy > 0) {
          if (ox < oy) {
            const s = (dx >= 0 ? 1 : -1) * ox * 0.5
            slots[i].x -= s
            slots[j].x += s
          } else {
            const s = (dy >= 0 ? 1 : -1) * oy * 0.5
            slots[i].y -= s
            slots[j].y += s
          }
        }
      }
      slots[i].x += (anchors[i].x - slots[i].x) * 0.01
      slots[i].y += (anchors[i].y - slots[i].y) * 0.01
      slots[i].x = THREE.MathUtils.clamp(slots[i].x, BOARD.x - xLim, BOARD.x + xLim)
      slots[i].y = THREE.MathUtils.clamp(slots[i].y, BOARD.y - yLim, BOARD.y + yLim)
    }
  }
  // the city's own dot on the map
  const dotLook = new THREE.MeshBasicMaterial({ color: '#d8333f' })
  const dotShape = new THREE.CircleGeometry(0.011, 10)
  for (const a of anchors) {
    const dot = new THREE.Mesh(dotShape, dotLook)
    dot.position.set(a.x, a.y, BOARD.z + 0.008)
    room.add(dot)
  }

  // the polaroids themselves: her, in each city
  const herCache = new Map()
  const herIn = (p) => {
    const s = p.scene || {}
    const key = [s.pose, s.outfit, s.prop, s.makeup].join('|')
    if (!herCache.has(key)) herCache.set(key, herFor(p))
    return herCache.get(key)
  }
  const sheet = new THREE.PlaneGeometry(PW, PH)
  const backLook = new THREE.MeshLambertMaterial({ color: '#34343c', side: THREE.BackSide })
  // her own drawing of a scene (drawings/scene-<slug>.png), or the stand-in: the place, and her in it
  const ownScene = async (p) => {
    const file = files.find((f) => f.startsWith(`drawings/scene-${p.slug}.`) && /\.(png|jpe?g|webp)$/i.test(f))
    return file ? loadImage(file).catch(() => null) : null
  }
  function paintScene(target, pol) {
    if (!pol.own) return scene(target, pol.p.scene?.place, herIn(pol.p), pol.i + 1)
    const ctx = target.getContext('2d')
    const s = Math.min(pol.own.width, pol.own.height)
    ctx.drawImage(pol.own, (pol.own.width - s) / 2, (pol.own.height - s) / 2, s, s, 0, 0, target.width, target.height)
  }
  const polaroids = []
  for (let i = 0; i < places.length; i++) {
    await turn()
    const p = places[i]
    const own = await ownScene(p)
    const photo = canvas(220, 220)
    paintScene(photo, { p, i, own })
    const face = canvas(256, 307)
    things.cityPolaroid(face, photo, p.city, null, 1)
    const small = texture(face)
    const front = new THREE.Mesh(sheet, new THREE.MeshLambertMaterial({ map: small }))
    const rear = new THREE.Mesh(sheet, backLook)
    front.castShadow = front.receiveShadow = true
    const group = new THREE.Group()
    group.add(front, rear)
    const s = slots[i]
    const tilt = (rand() - 0.5) * 0.32
    group.position.set(s.x, s.y, BOARD.z + 0.02 + i * 0.0012)
    group.rotation.z = tilt
    room.add(group)
    const pin = makeFlat([pinArt[i % pinArt.length]], { width: 0.035 })
    const pinAt = V(s.x - Math.sin(tilt) * (PH / 2 - 0.02), s.y + Math.cos(tilt) * (PH / 2 - 0.02), BOARD.z + 0.035 + i * 0.0012)
    pin.mesh.position.copy(pinAt)
    room.add(pin.mesh)
    polaroids.push({ p, i, own, group, front, small, photo, pin: pin.mesh, pinAt, home: group.position.clone(), tilt, lifted: false, run: 0, spot: null })
  }
  // the red string, from pin to pin, starting at home
  {
    const quads = []
    for (let k = 0; k < polaroids.length - 1; k++) {
      const a = polaroids[k].pinAt
      const b = polaroids[k + 1].pinAt
      for (let s = 0; s < 6; s++) {
        const t0 = s / 6
        const t1 = (s + 1) / 6
        const at = (t) => V(lerp(a.x, b.x, t), lerp(a.y, b.y, t) - Math.sin(Math.PI * t) * 0.02, BOARD.z + 0.03)
        const p0 = at(t0)
        const p1 = at(t1)
        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const l = Math.hypot(dx, dy) || 1
        const nx = (-dy / l) * 0.0032
        const ny = (dx / l) * 0.0032
        quads.push(p0.x + nx, p0.y + ny, p0.z, p0.x - nx, p0.y - ny, p0.z, p1.x + nx, p1.y + ny, p1.z, p0.x - nx, p0.y - ny, p0.z, p1.x - nx, p1.y - ny, p1.z, p1.x + nx, p1.y + ny, p1.z)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(quads, 3))
    room.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#c8333a', side: THREE.DoubleSide })))
  }

  // ---- the back wall, right: pennants, the window; the note ---------------------------------------------
  const PEN_W = 0.56
  const pennants = about.education.map((school, k) => {
    const map = texture(pennantArts[k][0].front)
    const geometry = new THREE.PlaneGeometry(PEN_W, PEN_W / pennantArts[k][0].aspect, 10, 1)
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }))
    mesh.castShadow = true
    mesh.position.set(0.66 + k * 0.62, 2.36 - k * 0.02, back + 0.03)
    mesh.rotation.z = -0.1 + k * 0.04
    room.add(mesh)
    const rest = Float32Array.from(geometry.attributes.position.array)
    return { school, mesh, geometry, rest, flutter: 0 }
  })
  const WIN = { x: 1.0, y: 1.52, w: 1.04 }
  const frame = makeFlat(windowArt, { width: WIN.w })
  frame.mesh.position.set(WIN.x, WIN.y, back + 0.03)
  frame.mesh.castShadow = false
  room.add(frame.mesh)
  const viewCanvas = cardCanvas(512, 512) // (only ever a texture: drawn on the graphics card)
  const viewMap = texture(viewCanvas)
  viewMap.repeat.set(1, 0.84)
  viewMap.offset.set(0, 0.08)
  const viewPlane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w * 0.74, frame.height * 0.74), new THREE.MeshBasicMaterial({ map: viewMap }))
  viewPlane.position.set(WIN.x, WIN.y + frame.height * 0.036, back + 0.012)
  room.add(viewPlane)
  let viewing = 0
  let night = true
  function paintView() {
    const city = places.find((p) => p.slug === windowViews[viewing % windowViews.length]) || places[0]
    view(viewCanvas, city.scene?.place, night, 3)
    viewMap.needsUpdate = true
    redraw()
  }
  paintView()
  const wallNote = makeFlat(noteWallArt, { width: 0.36 })
  wallNote.mesh.position.set(0.16, 1.98, back + 0.018)
  wallNote.mesh.rotation.z = -0.05
  wallNote.mesh.castShadow = false
  room.add(wallNote.mesh)

  // ---- her desk and what is on it ------------------------------------------------------------------------
  const DESK = { x: 1.1, top: 0.74, z: -1.66, w: 1.44, d: 0.52 }
  const topMap = texture(things.deskTop())
  const wood = new THREE.MeshLambertMaterial({ color: '#b98258' })
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(DESK.w, 0.05, DESK.d), [wood, wood, new THREE.MeshLambertMaterial({ map: topMap }), wood, wood, wood])
  deskTop.position.set(DESK.x, DESK.top - 0.025, DESK.z)
  deskTop.castShadow = deskTop.receiveShadow = true
  room.add(deskTop)
  const deskFront = makeFlat(deskArt, { width: DESK.w })
  deskFront.mesh.position.set(DESK.x, deskFront.height / 2, DESK.z + DESK.d / 2 + 0.005)
  room.add(deskFront.mesh)
  const onDesk = (preps, size, x, z, o = {}) => {
    const piece = makePiece(preps, { ...size, tab: false, shadow: o.shadow ?? true })
    piece.group.position.set(x, DESK.top, z)
    if (o.turn) piece.group.rotation.y = o.turn
    room.add(piece.group)
    return piece
  }
  const lampPiece = onDesk(lampArt, { height: 0.5 }, 0.52, DESK.z - 0.06)
  const laptop = onDesk(laptopArt, { width: 0.38 }, 0.87, DESK.z, { turn: 0.08 })
  const holder = onDesk(holderArt, { width: 0.15 }, 1.66, DESK.z - 0.02)
  const folder = onDesk(folderArt, { height: 0.24 }, 1.8, DESK.z - 0.08)
  folder.hinge.rotation.z = -0.12
  // the notebook and the envelope lie on the desk, tipped up toward you
  const notebook = makeFlat(noteArt, { width: 0.44 })
  notebook.mesh.position.set(1.2, DESK.top + 0.07, DESK.z + 0.1)
  notebook.mesh.rotation.x = -1.1
  room.add(notebook.mesh)
  const envelope = new THREE.Group()
  envelope.position.set(1.46, DESK.top + 0.05, DESK.z + 0.12)
  envelope.rotation.x = -0.95
  room.add(envelope)
  const envBody = makeFlat(envelopeArt, { width: 0.2 })
  envelope.add(envBody.mesh)
  const letter = makeFlat(letterArt, { width: 0.17, later: true })
  letter.mesh.position.set(0, 0, -0.004)
  envelope.add(letter.mesh)
  const flapHinge = new THREE.Group()
  flapHinge.position.set(0, envBody.height / 2 - 0.01, 0.003)
  envelope.add(flapHinge)
  const flap = makeFlat(flapArt, { width: 0.2 })
  flap.mesh.position.y = -flap.height / 2
  flapHinge.add(flap.mesh)
  const bizCard = makeFlat(cardArt, { width: 0.13, later: true })
  bizCard.mesh.visible = false
  room.add(bizCard.mesh)
  // the lamp's light: a glow at the shade and a pool on the desk (light, not paper: it shows at night)
  const dot = texture(lightDot())
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#ffd58a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  glow.position.set(0.52 + 0.1, DESK.top + 0.36, DESK.z - 0.02)
  glow.scale.setScalar(0.5)
  room.add(glow)
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ map: dot, color: '#ffcf7a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.32 }))
  pool.rotation.x = -Math.PI / 2
  pool.position.set(0.72, DESK.top + 0.002, DESK.z + 0.04)
  room.add(pool)
  function lampOn(on) {
    glow.visible = pool.visible = on
  }

  // ---- the violin, in its open case, leaning in the front corner ------------------------------------------
  const violinCase = makePiece(caseArt, { height: 0.92 })
  violinCase.group.position.set(-1.62, 0, -0.52)
  violinCase.group.rotation.y = 0.62
  violinCase.setFold(-0.16)
  room.add(violinCase.group)
  const violin = makeFlat(violinArt, { height: 0.7 })
  const violinHome = { position: V(0, 0.47, 0.02), rotation: new THREE.Euler(0, 0, 0) }
  violin.mesh.position.copy(violinHome.position)
  violinCase.hinge.add(violin.mesh)
  const bowFlat = makeFlat(bowArt, { height: 0.68 })
  const bowHome = { position: V(0.13, 0.46, 0.015), rotation: new THREE.Euler(0, 0, 0.07) }
  bowFlat.mesh.position.copy(bowHome.position)
  bowFlat.mesh.rotation.copy(bowHome.rotation)
  violinCase.hinge.add(bowFlat.mesh)

  // ---- the suitcase by the door ------------------------------------------------------------------------------
  const suitcase = makePiece(suitcaseArt, { width: 0.6 })
  suitcase.group.position.set(1.52, 0, -0.44)
  suitcase.group.rotation.y = -0.18
  room.add(suitcase.group)
  const slip = makeFlat(slipArt, { width: 0.4, later: true })
  slip.mesh.position.set(0, suitcase.height - 0.08, -0.04)
  slip.mesh.visible = false
  suitcase.hinge.add(slip.mesh)
  const lidHinge = new THREE.Group()
  lidHinge.position.set(0, suitcase.height - 0.01, -0.01)
  suitcase.hinge.add(lidHinge)
  const lid = makeFlat(lidArt, { width: 0.6 })
  lid.mesh.position.y = lid.height / 2 - 0.02
  lidHinge.add(lid.mesh)
  let lidOpen = false

  // ---- her cat --------------------------------------------------------------------------------------------
  // one paper cut out, its drawing swapped for each mood; pupils that follow the pointer; eyelids to blink
  const catPose = {}
  // (only its resting moods go to the graphics card straight away; the others once it is quiet)
  const resting = ['loaf', 'sleep', 'tail']
  for (const [k, preps] of Object.entries(catArts)) catPose[k] = { map: texture(preps[0].front, { later: !resting.includes(k) }), aspect: preps[0].aspect }
  const CAT_H = { loaf: 0.37, happy: 0.37, sleep: 0.35, belly: 0.37, stretch: 0.37, yawn: 0.37, sit: 0.5, walk1: 0.37, walk2: 0.37, swat: 0.37 }
  const CAT_HOME = V(-0.02, 0, -0.32)
  const cat = new THREE.Group()
  cat.position.copy(CAT_HOME)
  room.add(cat)
  const catBody = new THREE.Group() // breathes
  cat.add(catBody)
  const catSheet = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
  const catMesh = new THREE.Mesh(catSheet, new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }))
  catMesh.castShadow = true
  catBody.add(catMesh)
  const catShade = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.22), new THREE.MeshBasicMaterial({ map: dot, color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }))
  catShade.rotation.x = -Math.PI / 2
  catShade.position.y = 0.003
  cat.add(catShade)
  const tailMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(-0.45, 0, 0), new THREE.MeshLambertMaterial({ map: catPose.tail.map, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }))
  const tailPivot = new THREE.Group()
  tailPivot.add(tailMesh)
  catBody.add(tailPivot)
  // where the eyes are on the drawings (canvas pixels: see room-things.js), for the pupils and lids
  const EYES = { loaf: { w: 560, h: 360, at: [[170.6, 167.6], [241.4, 167.6]], r: 20 }, swat: { w: 560, h: 360, at: [[170.6, 167.6], [241.4, 167.6]], r: 20 }, sit: { w: 380, h: 480, at: [[155.5, 183.7], [224.5, 183.7]], r: 19 } }
  const pupils = [0, 1].map(() => new THREE.Mesh(new THREE.CircleGeometry(1, 14), new THREE.MeshBasicMaterial({ color: '#1c1820' })))
  const lids = [0, 1].map(() => new THREE.Mesh(new THREE.CircleGeometry(1, 14), new THREE.MeshLambertMaterial({ color: '#fbf8f2' })))
  for (const m of [...pupils, ...lids]) catBody.add(m)
  let catNow = null
  let catW = 0
  let catHt = 0
  let catLook = { x: 0, y: 0 }
  let blinking = 0
  function catAs(name, facing = 1) {
    const pose = catPose[name]
    catNow = name
    catHt = CAT_H[name]
    catW = catHt * pose.aspect
    catMesh.material.map = pose.map
    catMesh.material.needsUpdate = true
    catMesh.scale.set(catW * facing, catHt, 1)
    const eyes = EYES[name]
    tailMesh.visible = name === 'loaf' || name === 'swat'
    if (tailMesh.visible) {
      tailMesh.scale.set(catHt * 0.95, catHt * 0.5, 1)
      tailPivot.position.set(catW * 0.33 * facing, catHt * 0.16, -0.004)
      tailMesh.scale.x *= facing
    }
    for (const m of [...pupils, ...lids]) m.visible = !!eyes
    if (eyes) placeEyes()
  }
  // the eyes on the drawing, in the cat's own space; the pupils looking toward the pointer
  function placeEyes() {
    const eyes = EYES[catNow]
    if (!eyes) return
    const edge = 4
    eyes.at.forEach(([px, py], k) => {
      const x = ((px + edge) / (eyes.w + edge * 2) - 0.5) * catW
      const y = (1 - (py + edge) / (eyes.h + edge * 2)) * catHt
      const r = (eyes.r / (eyes.h + edge * 2)) * catHt
      pupils[k].scale.set(r * 0.42, r * 0.62, 1)
      pupils[k].position.set(x + catLook.x * r * 0.42, y + catLook.y * r * 0.3, 0.002)
      lids[k].scale.set(r * 1.08, r * 1.12, 1)
      lids[k].position.set(x, y, 0.003)
      lids[k].visible = blinking > 0
    })
  }
  catAs('loaf')

  // ---- little things that float up: hearts, notes, z's ----------------------------------------------------------
  const sparkPreps = { heart: heartArt[0], z: zeeArt[0], noteA: noteA[0], noteB: noteB[0] }
  const sparkMaps = Object.fromEntries(Object.entries(sparkPreps).map(([k, prep]) => [k, { map: texture(prep.front, { later: true }), aspect: prep.aspect }]))
  const sparks = Array.from({ length: 40 }, () => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }))
    mesh.visible = false
    room.add(mesh)
    return { mesh, on: false, age: 0, life: 0, v: V(0, 0, 0), spin: 0, size: 0, path: null }
  })
  function spark(kind, at, { size = 0.06, life = 14, v = V(0, 0.02, 0), spin = 0, path = null } = {}) {
    const s = sparks.find((q) => !q.on)
    if (!s) return
    const look = sparkMaps[kind]
    s.mesh.material.map = look.map
    s.mesh.material.needsUpdate = true
    Object.assign(s, { on: true, age: 0, life, v: v.clone(), spin, size, path, aspect: look.aspect })
    s.mesh.position.copy(at)
    s.mesh.rotation.set(0, 0, (rand() - 0.5) * 0.6)
    s.mesh.visible = true
    s.mesh.scale.set(size * look.aspect, size, 1)
  }
  stepped.every(1, () => {
    let any = false
    for (const s of sparks) {
      if (!s.on) continue
      any = true
      s.age++
      const k = s.age / s.life
      if (s.path) s.path(s, k)
      else {
        s.mesh.position.add(s.v)
        s.mesh.position.x += Math.sin(s.age * 0.6) * 0.003
      }
      s.mesh.rotation.z += s.spin
      const grow = k < 0.2 ? k / 0.2 : k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1
      s.mesh.scale.set(s.size * s.aspect * grow, s.size * grow, 1)
      if (s.age >= s.life) {
        s.on = false
        s.mesh.visible = false
      }
    }
    return any && 'looks'
  })

  // ---- the countdown and the flash ---------------------------------------------------------------------------
  const badges = badgeArts.map((preps, i) => {
    const b = makeFlat(preps, { width: 0.2 })
    b.mesh.position.set(camera.group.position.x - 0.06 + (i - 1) * 0.04, 1.3, camera.group.position.z + 0.06)
    b.mesh.rotation.z = (i - 1) * -0.12
    b.mesh.visible = false
    b.mesh.castShadow = false
    room.add(b.mesh)
    return b.mesh
  })
  const redLight = new THREE.Mesh(new THREE.CircleGeometry(0.014, 16), new THREE.MeshBasicMaterial({ color: '#4a1712' }))
  redLight.position.copy(onCamera(LIGHT, 0.006))
  camera.hinge.add(redLight)
  room.updateWorldMatrix(true, true)
  const fromCamera = (v) => room.worldToLocal(camera.hinge.localToWorld(v))
  const burst = makeFlat(burstArt, { width: 0.38 })
  burst.mesh.position.copy(fromCamera(onCamera(FLASH, 0.03)))
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
  let flashLevel = 0
  function setFlash(k) {
    if (k === flashLevel) return
    flashLevel = k
    whiteout.visible = k > 0.01
    whiteout.material.opacity = (inside ? 0.45 : 0.8) * k // (softer up close, every nine seconds)
  }
  const bigFlash = document.createElement('div')
  bigFlash.className = 'camera-flash'
  bigFlash.setAttribute('aria-hidden', 'true')
  document.body.append(bigFlash)
  // what the room behind a polaroid held up goes to
  const dimmer = new THREE.Mesh(new THREE.PlaneGeometry(inner.w + 0.2, inner.h + 0.2), new THREE.MeshBasicMaterial({ color: '#141630', transparent: true, opacity: 0, depthWrite: false }))
  dimmer.position.set(0, inner.h / 2, -0.14)
  dimmer.visible = false
  room.add(dimmer)
  const dimTo = (to) => {
    const from = dimmer.material.opacity
    return stepped.poses([0.35, 0.7, 1].map((t) => lerp(from, to, t)), (o) => {
      dimmer.material.opacity = o
      dimmer.visible = o > 0.01
    })
  }

  // ---- where a point on the screen falls, in the room (for things held up in front of you) -------------------------
  const ndc = new THREE.Vector3()
  const inv = new THREE.Matrix4()
  function screenSpot(nx, ny, z) {
    lens.updateMatrixWorld()
    room.updateWorldMatrix(true, false)
    inv.copy(room.matrixWorld).invert()
    const origin = new THREE.Vector3().setFromMatrixPosition(lens.matrixWorld).applyMatrix4(inv)
    const far = ndc.set(nx, ny, 0.5).unproject(lens).applyMatrix4(inv)
    const dir = far.sub(origin).normalize()
    return origin.clone().add(dir.multiplyScalar((z - origin.z) / dir.z))
  }
  // how tall something has to be to fill `share` of the screen's height, at that point
  const tallFor = (at, share) => {
    const d = new THREE.Vector3().setFromMatrixPosition(lens.matrixWorld).distanceTo(room.localToWorld(at.clone()))
    return 2 * d * Math.tan(THREE.MathUtils.degToRad(lens.fov / 2)) * share
  }

  // ---- the state of the room ---------------------------------------------------------------------------------------
  let inside = false // the camera is in the room
  let busy = false // something is playing out (a polaroid flying, the violin)
  const idle = () => inside && !busy && !ui.open
  const hover = (object, on, lift = 0.03) => {
    const mine = (object.userData.hover = (object.userData.hover || 0) + 1)
    const from = object.userData.lift || 0
    const to = on ? lift : 0
    stepped.poses([0.5, 1].map((t) => lerp(from, to, t)), (y) => {
      if (mine !== object.userData.hover) return
      object.position.y += y - (object.userData.lift || 0)
      object.userData.lift = y
    })
  }

  // ---- the loop: her camera takes her photo, in one city after another ------------------------------------------------
  const loopFace = canvas(256, 307)
  const loopMap = texture(loopFace)
  const loopShot = new THREE.Group()
  const loopFront = new THREE.Mesh(sheet, new THREE.MeshLambertMaterial({ map: loopMap }))
  loopFront.castShadow = true
  loopShot.add(loopFront, new THREE.Mesh(sheet, backLook))
  loopShot.visible = false
  room.add(loopShot)
  const inSlot = fromCamera(onCamera(SLOT, -0.012).add(V(0, -PH / 2 - 0.02, 0)))
  const outSlot = fromCamera(onCamera(SLOT, -0.012).add(V(0, PH * 0.34, 0)))
  const turned = camera.group.rotation.y
  const FRONT = V(0.05, 1.3, -0.12)
  const LOOP_BIG = 3.1
  let nextCity = 0
  let taking = null // the polaroid this round is of
  let develop = -1
  let tickCount = 0
  function developTo(k) {
    if (develop === k || !taking) return
    develop = k
    things.cityPolaroid(loopFace, taking.photo, taking.p.city, null, k)
    loopMap.needsUpdate = true
  }
  const BADGE_POP = [0.5, 1.25, 1.05, 1]
  const HOP = [0.06, 0.1, 0.06, 0.02, 0]
  const RECOIL = [-0.04, 0.025, -0.01, 0]
  const BURST = [0.6, 1.3, 1.1, 0.75, 0.35]
  let rushing = false // clicked: straight to the flash
  const clock = loopClock(stepped, {
    box,
    group: room,
    period: LOOP,
    active: () => (onShelf() || (inside && !ui.open && !viewing3d)) && !violinOut,
    tick(t, prev) {
      tickCount++
      if (passed(prev, t, 0)) {
        // a new photo: the next city; its polaroid comes off the board meanwhile
        if (taking) finishShot()
        taking = polaroids[nextCity]
        nextCity = (nextCity + 1) % polaroids.length
        taking.group.visible = taking.pin.visible = false
        develop = -1
        developTo(0)
      }
      const u = t
      if (!taking) return false
      strike(u >= COUNT[0] && u < RISE[1] + 0.3 ? 'peace' : pose === 'wave' ? 'wave' : 'idle')
      let blink = false
      badges.forEach((b, i) => {
        const k = (u - COUNT[i]) / 0.45
        b.visible = !rushing && k >= 0 && k < 1
        if (!b.visible) return
        b.scale.setScalar(BADGE_POP[Math.min(3, Math.floor(k * 8))] * (k > 0.85 ? 0.6 : 1))
        if (k < 0.55) blink = true
      })
      redLight.material.color.set(blink ? '#ff4636' : '#4a1712')
      const f = (u - SNAP) / 0.45
      const flashing = f >= 0 && f < 1
      const frame = flashing ? Math.min(4, Math.floor(f * 5)) : -1
      if (passed(prev, t, SNAP)) sound.play('shutter')
      burst.mesh.visible = flashing
      if (flashing) burst.mesh.scale.setScalar(BURST[frame])
      setFlash(flashing ? Math.round((1 - f) * 6) / 6 : 0)
      for (const piece of Object.values(her)) piece.group.position.y = flashing ? HOP[frame] : 0
      camera.hinge.rotation.z = flashing ? RECOIL[Math.min(3, frame)] : 0
      // the polaroid
      if (u < OUT[0]) loopShot.visible = false
      else if (u < RISE[0]) {
        loopShot.visible = true
        loopShot.position.lerpVectors(inSlot, outSlot, smooth((u - OUT[0]) / (OUT[1] - OUT[0])))
        loopShot.rotation.set(0, turned, 0)
        loopShot.scale.setScalar(1)
      } else if (u < DEVELOP[0]) {
        const k = smooth((u - RISE[0]) / (RISE[1] - RISE[0]))
        loopShot.position.lerpVectors(outSlot, FRONT, k)
        loopShot.position.y += Math.sin(Math.PI * k) * 0.1
        loopShot.rotation.set(0, turned * (1 - k), Math.sin(Math.PI * k) * 0.25)
        loopShot.scale.setScalar(lerp(1, LOOP_BIG, k))
      } else if (u < FLY[0]) {
        const k = Math.min(1, (u - DEVELOP[0]) / (DEVELOP[1] - DEVELOP[0]))
        const shake = (tickCount % 2 ? 1 : -1) * 0.06 * (1 - k * 0.6)
        loopShot.position.set(FRONT.x + shake * 0.12, FRONT.y + Math.abs(shake) * 0.08, FRONT.z)
        loopShot.rotation.set(0, 0, shake)
        loopShot.scale.setScalar(LOOP_BIG)
        developTo(Math.round(k * 16) / 16)
      } else if (u < PIN) {
        developTo(1)
        const k = smooth((u - FLY[0]) / (FLY[1] - FLY[0]))
        const a = 1 - k
        const to = taking.home
        loopShot.position.set(a * a * FRONT.x + 2 * a * k * (FRONT.x + to.x) * 0.5 + k * k * to.x, a * a * FRONT.y + 2 * a * k * (Math.max(FRONT.y, to.y) + 0.3) + k * k * to.y, a * a * FRONT.z + 2 * a * k * (FRONT.z - 0.3) + k * k * to.z)
        loopShot.rotation.set(0, 0, taking.tilt * k + Math.sin(Math.PI * k) * 0.5)
        loopShot.scale.setScalar(lerp(LOOP_BIG, 1, k))
      } else if (loopShot.visible) finishShot()
      return true
    },
  })
  // the photo lands in its place on the board, and is pinned
  function finishShot() {
    loopShot.visible = false
    rushing = false
    if (!taking) return
    const t = taking
    t.group.visible = t.pin.visible = true
    sound.play('pop')
    stepped.poses([1.5, 1.15, 1], (s) => t.pin.scale.setScalar(s))
    stepped.poses([1.08, 1], (s) => t.group.scale.setScalar(s))
    taking = null
  }
  // clicked: a photo straight away (if one is not already on its way)
  function snapNow() {
    if (!idle()) return
    const t = clock.time % LOOP
    if (clock.time >= 0 && t >= SNAP - 0.05) return
    rushing = true
    clock.time = (clock.time < 0 ? 0 : clock.time - t) + SNAP - 0.04
  }

  // ---- a polaroid off the board, held up big --------------------------------------------------------------------------
  const bigFace = canvas(860, 1032)
  const bigMap = texture(bigFace)
  const bigPhoto = canvas(760, 760)
  let viewing3d = null
  async function showPolaroid(pol) {
    if (!idle() || pol === taking) return
    busy = true
    viewing3d = pol
    sound.play('pop')
    pol.pin.visible = false
    paintScene(bigPhoto, pol)
    things.cityPolaroid(bigFace, bigPhoto, pol.p.city, pol.p.caption, 1)
    bigMap.needsUpdate = true
    pol.front.material.map = bigMap
    pol.front.material.needsUpdate = true
    const at = screenSpot(0, 0.12, 0.18) // (in front of the box's opening, so its frame never cuts across it)
    // as big as fits: most of the screen's height, but never wider than most of its width
    const scale = Math.min(tallFor(at, 0.56) / PH, (tallFor(at, 0.82) * lens.aspect) / PW)
    const from = pol.group.position.clone()
    const fromTilt = pol.group.rotation.z
    dimTo(0.5)
    sound.play('paper')
    await stepped.poses([0.1, 0.25, 0.45, 0.65, 0.82, 0.94, 1], (k) => {
      pol.group.position.lerpVectors(from, at, k)
      pol.group.position.z += Math.sin(Math.PI * k) * 0.25
      pol.group.rotation.set(0, Math.sin(Math.PI * k) * 0.4, lerp(fromTilt, -0.02, k))
      pol.group.scale.setScalar(lerp(1, scale, k))
    })
    busy = false
    const photos = photosOf(pol.p)
    const controls = () =>
      ui.polaroid({
        city: pol.p.city,
        hasPhotos: photos.length > 0,
        onPhotos: () => ui.gallery({ city: pol.p.city, photos, onClose: controls }),
        onPinBack: () => putBack(pol),
      })
    controls()
  }
  async function putBack(pol) {
    if (viewing3d !== pol) return
    busy = true
    const from = pol.group.position.clone()
    const fromScale = pol.group.scale.x
    dimTo(0)
    await stepped.poses([0.1, 0.3, 0.55, 0.78, 0.94, 1], (k) => {
      pol.group.position.lerpVectors(from, pol.home, k)
      pol.group.position.z += Math.sin(Math.PI * k) * 0.2
      pol.group.rotation.set(0, Math.sin(Math.PI * k) * -0.3, lerp(-0.02, pol.tilt, k))
      pol.group.scale.setScalar(lerp(fromScale, 1, k))
    })
    pol.front.material.map = pol.small
    pol.front.material.needsUpdate = true
    pol.pin.visible = true
    sound.play('pop')
    stepped.poses([1.5, 1.15, 1], (s) => pol.pin.scale.setScalar(s))
    viewing3d = null
    busy = false
    pol.spot?.node.focus({ preventScroll: true })
  }

  // ---- the violin: out of its case, a few bars, and the notes become her performances ---------------------------------
  let violinOut = false
  const toRoom = (object) => {
    object.updateWorldMatrix(true, false)
    const m = new THREE.Matrix4().copy(inv.copy(room.matrixWorld).invert()).multiply(object.matrixWorld)
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    m.decompose(p, q, s)
    return { p, q }
  }
  const caseMouth = () => room.worldToLocal(violinCase.hinge.localToWorld(V(0, 0.5, 0.05)))
  async function playViolin() {
    if (!idle() || violinOut) return
    if (stepped.reduced) return openMusic()
    busy = violinOut = true
    // out of the case, to a playing position in front of you
    const v0 = toRoom(violin.mesh)
    const b0 = toRoom(bowFlat.mesh)
    room.attach(violin.mesh)
    room.attach(bowFlat.mesh)
    const vAt = screenSpot(-0.18, 0.05, -0.2)
    const bAt = vAt.clone().add(V(0.12, 0.05, 0.03))
    const vq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.85))
    const bq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.75))
    const vs = tallFor(vAt, 0.42) / violin.height
    await stepped.poses([0.1, 0.3, 0.55, 0.8, 0.95, 1], (k) => {
      violin.mesh.position.lerpVectors(v0.p, vAt, k)
      violin.mesh.quaternion.slerpQuaternions(v0.q, vq, k)
      violin.mesh.scale.setScalar(lerp(1, vs, k))
      bowFlat.mesh.position.lerpVectors(b0.p, bAt, k)
      bowFlat.mesh.quaternion.slerpQuaternions(b0.q, bq, k)
      bowFlat.mesh.scale.setScalar(lerp(1, vs, k))
    })
    sound.play('violin')
    // the bow draws across, back and forth; notes stream out and swirl toward you
    const across = V(Math.cos(0.75 + Math.PI / 2), Math.sin(0.75 + Math.PI / 2), 0).multiplyScalar(0.18 * vs * 0.4)
    const swirl = (s, k) => {
      const a = s.a0 + k * 5
      const r = s.r0 + k * 0.5
      s.mesh.position.set(s.c.x + Math.cos(a) * r, s.c.y + Math.sin(a) * r * 0.7 + k * 0.3, s.c.z + k * 0.15)
    }
    for (let n = 0; n < 4; n++) {
      await stepped.poses([0.5, 1, 0.5, 0, -0.5, -1, -0.5, 0], (k) => bowFlat.mesh.position.copy(bAt).addScaledVector(across, k))
      for (let q = 0; q < 4; q++) {
        const s = sparks.find((x) => !x.on)
        spark(rand() < 0.5 ? 'noteA' : 'noteB', vAt, { size: 0.07, life: 18, path: swirl })
        if (s) Object.assign(s, { c: vAt.clone(), a0: rand() * Math.PI * 2, r0: 0.05 + rand() * 0.08 })
      }
    }
    busy = false
    openMusic()
  }
  function openMusic() {
    violinOut = true
    sound.play('paper')
    ui.music({ pieces: about.music, files, onClose: putViolinAway })
  }
  async function putViolinAway() {
    if (!violin.mesh.parent || violin.mesh.parent === violinCase.hinge) {
      violinOut = false
      return
    }
    busy = true
    // the notes swirl back into the case, and the violin settles into it
    const mouthAt = caseMouth()
    for (let q = 0; q < 10; q++) {
      const s = sparks.find((x) => !x.on)
      const start = screenSpot((rand() - 0.5) * 0.8, (rand() - 0.5) * 0.6, -0.25)
      spark(rand() < 0.5 ? 'noteA' : 'noteB', start, { size: 0.07, life: 14, path: (sp, k) => sp.mesh.position.lerpVectors(sp.from, sp.to, smooth(k)) })
      if (s) Object.assign(s, { from: start, to: mouthAt })
    }
    violinCase.hinge.attach(violin.mesh)
    violinCase.hinge.attach(bowFlat.mesh)
    const vFrom = violin.mesh.position.clone()
    const vqFrom = violin.mesh.quaternion.clone()
    const bFrom = bowFlat.mesh.position.clone()
    const bqFrom = bowFlat.mesh.quaternion.clone()
    const vqTo = new THREE.Quaternion().setFromEuler(violinHome.rotation)
    const bqTo = new THREE.Quaternion().setFromEuler(bowHome.rotation)
    const vsFrom = violin.mesh.scale.x
    await stepped.poses([0.15, 0.35, 0.6, 0.82, 0.95, 1], (k) => {
      violin.mesh.position.lerpVectors(vFrom, violinHome.position, k)
      violin.mesh.quaternion.slerpQuaternions(vqFrom, vqTo, k)
      violin.mesh.scale.setScalar(lerp(vsFrom, 1, k))
      bowFlat.mesh.position.lerpVectors(bFrom, bowHome.position, k)
      bowFlat.mesh.quaternion.slerpQuaternions(bqFrom, bqTo, k)
      bowFlat.mesh.scale.setScalar(lerp(vsFrom, 1, k))
    })
    busy = violinOut = false
  }

  // ---- the cat ------------------------------------------------------------------------------------------------------
  let catMood = 'loaf' // 'loaf' | 'sleep' | 'happy' | 'act' (a reaction, a walk) | 'notebook'
  let quiet = 0 // ticks since anyone paid it attention
  let unnoticed = 0 // ticks in the room since anyone paid it attention
  let happyLeft = 0
  let catRun = 0
  let toy = null
  function settleCat() {
    catMood = 'loaf'
    cat.position.copy(CAT_HOME)
    cat.rotation.set(0, 0, 0)
    catAs('loaf')
  }
  const catHead = () => room.localToWorld(cat.position.clone().add(V(-catW * 0.14, catHt * 0.62, 0)))
  async function walkCat(to, ticksPerStep = 3) {
    const from = cat.position.clone()
    const d = from.distanceTo(to)
    const steps = Math.max(2, Math.round(d / 0.05))
    const facing = to.x >= from.x ? 1 : -1
    for (let k = 1; k <= steps; k++) {
      catAs(k % 2 ? 'walk1' : 'walk2', facing)
      cat.position.lerpVectors(from, to, k / steps)
      await stepped.wait(ticksPerStep)
    }
  }
  async function hop(to) {
    const from = cat.position.clone()
    await stepped.poses([0.15, 0.35, 0.55, 0.75, 0.92, 1], (k) => {
      cat.position.lerpVectors(from, to, k)
      cat.position.y += Math.sin(Math.PI * k) * 0.25
    })
  }
  async function catReaction() {
    const mine = ++catRun
    catMood = 'act'
    quiet = unnoticed = 0
    const pick = ['belly', 'stretch', 'yawn', 'swat', 'visit'][Math.floor(rand() * 5)]
    if (pick === 'visit' && !stepped.reduced) {
      // over to her, a rub against her leg, and back to the rug
      await walkCat(V(HER.x + 0.2, 0, HER.z + 0.16))
      catAs('sit')
      for (let k = 0; k < 3; k++) {
        await stepped.poses([0.05, -0.05, 0], (a) => (cat.rotation.z = a))
        spark('heart', room.worldToLocal(catHead()), { size: 0.06, life: 14, v: V(0, 0.018, 0) })
      }
      await stepped.wait(10)
      await walkCat(CAT_HOME)
    } else if (pick === 'swat' && !stepped.reduced) {
      // a toy on a string dangles down; the cat swats at it
      toy = toy || makeFlat(toyArt, { height: 0.5, later: true })
      toy.mesh.castShadow = false
      room.add(toy.mesh)
      const top = V(cat.position.x - 0.12, 0.75, cat.position.z + 0.03)
      await stepped.poses([1.05, 0.85, 0.66, 0.58, 0.6], (y) => toy.mesh.position.set(top.x, y, top.z))
      for (let k = 0; k < 4; k++) {
        catAs('swat')
        await stepped.poses([0.08, 0.14, 0.06], (a) => (toy.mesh.rotation.z = a))
        catAs('loaf')
        await stepped.poses([-0.05, 0], (a) => (toy.mesh.rotation.z = a))
      }
      await stepped.poses([0.7, 0.9, 1.1], (y) => (toy.mesh.position.y = y))
      room.remove(toy.mesh)
    } else {
      catAs(pick === 'visit' || pick === 'swat' ? 'yawn' : pick)
      if (pick === 'belly') spark('heart', room.worldToLocal(catHead()), { size: 0.07, life: 16 })
      await stepped.wait(pick === 'belly' ? 36 : 22)
    }
    if (mine === catRun) settleCat()
  }
  // left alone long enough, it goes and sits on her notebook
  async function sitOnNotebook() {
    const mine = ++catRun
    catMood = 'act'
    await walkCat(V(DESK.x + 0.1, 0, -1.15))
    if (mine !== catRun) return
    await hop(V(1.2, DESK.top, DESK.z + 0.06))
    catAs('sit')
    catMood = 'notebook'
  }
  async function offNotebook() {
    const mine = ++catRun
    catMood = 'act'
    await hop(V(DESK.x + 0.1, 0, -1.15))
    await walkCat(CAT_HOME)
    if (mine === catRun) settleCat()
  }
  function stroke() {
    quiet = unnoticed = 0
    if (catMood === 'act' || catMood === 'notebook') return
    if (catMood !== 'happy') {
      catMood = 'happy'
      catAs('happy')
      sound.play('purr')
    }
    happyLeft = 14
  }
  // breathing, blinking, a flick of the tail, falling asleep and waking; hearts while it is stroked
  stepped.every(1, (frame) => {
    if (!(onShelf() || inside) || stepped.reduced) return false
    let changed = false
    quiet++
    if (inside && catMood === 'loaf') unnoticed++
    if (catMood === 'happy') {
      if (frame % 6 === 0) spark('heart', room.worldToLocal(catHead()).add(V((rand() - 0.5) * 0.1, 0.05, 0.02)), { size: 0.05, life: 14 })
      if (frame % 14 === 0) sound.play('purr')
      if (--happyLeft <= 0) settleCat()
      changed = true
    }
    if (catMood === 'loaf' && quiet > 260) {
      catMood = 'sleep'
      catAs('sleep')
      changed = true
    }
    if (catMood === 'sleep') {
      if (frame % 16 === 0) spark('z', room.worldToLocal(catHead()).add(V(0.04, 0.06, 0)), { size: 0.05, life: 22, v: V(0.004, 0.012, 0) })
      if (quiet > 420) {
        quiet = 0
        settleCat()
        changed = true
      }
    }
    if (catMood === 'loaf' && inside && unnoticed > 540) {
      unnoticed = 0
      sitOnNotebook()
    }
    // breathing
    if (catMood === 'loaf' || catMood === 'sleep' || catMood === 'happy') {
      const s = Math.floor(frame / 14) % 2 ? 1.025 : 1
      if (catBody.scale.y !== s) {
        catBody.scale.y = s
        changed = true
      }
    }
    // blinking
    if (blinking > 0) {
      blinking--
      placeEyes()
      changed = true
    } else if (EYES[catNow] && rand() < 0.012) {
      blinking = 2
      placeEyes()
      changed = true
    }
    // the tail
    if (tailMesh.visible) {
      const a = frame % 40 < 6 ? [0.18, 0.3, 0.18, 0.05, -0.06, 0][frame % 40] : 0
      if (tailPivot.rotation.z !== a) {
        tailPivot.rotation.z = a
        changed = true
      }
    }
    return changed && 'looks'
  })

  // ---- the pennants flutter --------------------------------------------------------------------------------------------
  stepped.every(1, (frame) => {
    let any = false
    for (const pen of pennants) {
      if (pen.flutter <= 0) continue
      any = true
      pen.flutter--
      const pos = pen.geometry.attributes.position
      const w = PEN_W
      for (let k = 0; k < pos.count; k++) {
        const x = pen.rest[k * 3]
        const along = (x + w / 2) / w
        pos.setZ(k, Math.sin(along * 7 - frame * 0.9) * 0.022 * along * Math.min(1, pen.flutter / 6))
      }
      pos.needsUpdate = true
    }
    return any && 'looks'
  })

  // ---- the buttons ------------------------------------------------------------------------------------------------------
  const four = () => [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)]
  const cornersOf = (object, w, h, cx = 0, cy = 0) => {
    const c = four()
    return () => {
      const W = typeof w === 'function' ? w() : w
      const H = typeof h === 'function' ? h() : h
      c[0].set(cx - W / 2, cy - H / 2, 0)
      c[1].set(cx + W / 2, cy - H / 2, 0)
      c[2].set(cx - W / 2, cy + H / 2, 0)
      c[3].set(cx + W / 2, cy + H / 2, 0)
      for (const p of c) object.localToWorld(p)
      return c
    }
  }
  const pieceCorners = (piece) => cornersOf(piece.hinge, piece.width, piece.height, 0, piece.height / 2)
  const narrow = () => innerWidth < 700
  // (the camera's loop waits while something is open: whatever it had in the air comes down first)
  function calm() {
    for (const b of badges) b.visible = false
    burst.mesh.visible = false
    setFlash(0)
    redLight.material.color.set('#4a1712')
    camera.hinge.rotation.z = 0
    for (const piece of Object.values(her)) piece.group.position.y = 0
    redraw()
  }
  const spot = (label, corners, onClick, { onHover, onMove, visible = () => true } = {}) => {
    const s = overlay.addSpot({
      group: box.id,
      label,
      corners,
      onClick: () => {
        calm()
        onClick()
      },
      onHover,
      onMove,
      visible: () => idle() && visible(),
    })
    s.node.dataset.tag = label
    return s
  }
  for (const pol of polaroids) {
    pol.spot = spot(`${pol.p.city}: ${pol.p.caption}`, cornersOf(pol.group, PW, PH), () => showPolaroid(pol), {
      visible: () => !narrow() && pol !== taking,
      onHover(on) {
        if (pol.lifted === on || viewing3d === pol) return
        pol.lifted = on
        const mine = ++pol.run
        stepped.poses(on ? [0.5, 1] : [0.5, 0], (k) => {
          if (mine !== pol.run || viewing3d === pol) return
          pol.group.position.z = pol.home.z + 0.04 * k
          pol.group.scale.setScalar(1 + 0.3 * k)
          pol.group.rotation.z = lerp(pol.tilt, pol.tilt * 0.3 + 0.08, k)
        })
      },
    })
  }
  // on a phone the polaroids are too small to aim at: the whole board opens as a grid
  const thumbs = []
  spot(`${places.length} cities and counting`, cornersOf(board.mesh, board.width, board.height), () => {
    if (!thumbs.length) for (const pol of polaroids) thumbs.push(pol.small.image.toDataURL('image/jpeg', 0.85))
    ui.grid({
      places,
      thumbs,
      onPick: (i) => {
        ui.close(true)
        showPolaroid(polaroids[i])
      },
    })
  }, { visible: narrow })
  spot('her camera: take a photo', pieceCorners(camera), () => snapNow(), { onHover: (on) => hover(camera.group, on) })
  spot('laptop: github', pieceCorners(laptop), () => {
    hover(laptop.group, false)
    window.open(contact('GitHub'), '_blank', 'noopener')
  }, { onHover: (on) => hover(laptop.group, on) })
  spot('card holder: linkedin', pieceCorners(holder), async () => {
    bizCard.mesh.visible = true
    const at = room.worldToLocal(holder.hinge.localToWorld(V(0, holder.height * 0.6, 0.02)))
    await stepped.poses([0.04, 0.09, 0.13, 0.12], (y) => bizCard.mesh.position.set(at.x, at.y + y, at.z))
    sound.play('flick')
    ui.card({ name: 'nahiyan srotosshini', url: contact('LinkedIn'), onClose: () => (bizCard.mesh.visible = false) })
  }, { onHover: (on) => hover(holder.group, on) })
  spot('envelope: email', cornersOf(envBody.mesh, envBody.width, envBody.height), async () => {
    sound.play('paper')
    await stepped.poses([-0.6, -1.4, -2.2, -2.6], (a) => (flapHinge.rotation.x = a))
    await stepped.poses([0.03, 0.07, 0.1], (y) => (letter.mesh.position.y = y))
    ui.letter({
      email: contactValue('Email'),
      onClose: async () => {
        await stepped.poses([0.05, 0], (y) => (letter.mesh.position.y = y))
        await stepped.poses([-1.6, -0.6, 0], (a) => (flapHinge.rotation.x = a))
      },
    })
  }, { onHover: (on) => hover(envelope, on, 0.02) })
  spot('folder: cv', pieceCorners(folder), () => {
    if (!files.includes(about.cv)) return ui.toast('her cv is on its way')
    const a = document.createElement('a')
    a.href = `${import.meta.env.BASE_URL}${about.cv}`
    a.download = 'Srotosshini-CV.pdf'
    a.click()
  }, { onHover: (on) => hover(folder.group, on) })
  spot('notebook: about me', cornersOf(notebook.mesh, notebook.width, notebook.height), () => {
    sound.play('paper')
    if (catMood === 'notebook') offNotebook()
    ui.notebook({ bio: about.bio })
  }, { onHover: (on) => hover(notebook.mesh, on, 0.015) })
  spot('desk lamp: night or day', pieceCorners(lampPiece), () => setNight(!night), { onHover: (on) => hover(lampPiece.group, on) })
  spot('violin: play', pieceCorners(violinCase), () => playViolin(), {
    onHover(on) {
      hover(violinCase.group, on, 0.02)
      if (!on || stepped.reduced) return
      sound.play('hum')
      const at = caseMouth()
      for (let k = 0; k < 3; k++) spark(k % 2 ? 'noteA' : 'noteB', at.clone().add(V((rand() - 0.5) * 0.1, k * 0.05, 0.05)), { size: 0.05, life: 16 + k * 3, v: V(0.002, 0.014, 0), spin: 0.03 })
    },
  })
  pennants.forEach((pen) => {
    spot(`pennant: ${pen.school.short}`, cornersOf(pen.mesh, PEN_W, () => PEN_W / pennantArts[0][0].aspect), () => {
      sound.play('paper')
      ui.report({ education: about.education })
    }, { onHover: (on) => on && !stepped.reduced && (pen.flutter = 20) })
  })
  const catSpot = spot('her cat', cornersOf(catBody, () => Math.abs(catW), () => catHt, 0, catHt / 2), () => {
    if (catMood === 'notebook') return offNotebook()
    if (catMood === 'act') return
    catReaction()
  }, { onMove: () => stroke(), onHover: (on) => on && (quiet = unnoticed = 0) })
  catSpot.node.dataset.tag = 'her cat (stroke it)'
  spot('her', pieceCorners(her.idle), async () => {
    strike('wave')
    for (let k = 0; k < 3; k++) spark('heart', room.worldToLocal(her.idle.hinge.localToWorld(V(0.08, 0.95, 0.05))), { size: 0.06, life: 14 + k * 4 })
    await stepped.wait(24)
    if (pose === 'wave') strike('idle')
  }, { onHover: (on) => Object.values(her).forEach((h) => hover(h.group, on, 0.02)) })
  spot('window: another city', cornersOf(frame.mesh, frame.width, frame.height), () => {
    viewing = (viewing + 1) % windowViews.length
    sound.play('paper')
    paintView()
  })
  spot(`suitcase: ${countries.length} countries`, pieceCorners(suitcase), async () => {
    lidOpen = !lidOpen
    sound.play(lidOpen ? 'creak' : 'snap')
    if (lidOpen) slip.mesh.visible = true
    await stepped.poses(lidOpen ? [-0.6, -1.3, -1.9, -2.05, -1.95] : [-1.4, -0.7, 0], (a) => (lidHinge.rotation.x = a))
    if (lidOpen) await stepped.poses([0.03, 0.08, 0.12], (y) => (slip.mesh.position.y = suitcase.height - 0.08 + y))
    else {
      slip.mesh.visible = false
      slip.mesh.position.y = suitcase.height - 0.08
    }
  }, { onHover: (on) => hover(suitcase.group, on, 0.02) })
  function contact(label) {
    return about.contact.find((c) => c.label === label)?.href || '#'
  }
  function contactValue(label) {
    return about.contact.find((c) => c.label === label)?.value || ''
  }

  // ---- night and day ---------------------------------------------------------------------------------------------------
  let dimmed = 0
  function setNight(on) {
    night = on
    lampOn(on)
    paintView()
    const to = inside && on ? NIGHT : 0
    const from = dimmed
    dimmed = to
    stepped.poses([0.35, 0.7, 1].map((t) => lerp(from, to, t)), (k) => lights?.dim(k))
  }
  lampOn(true)

  boil(stepped, [her.idle, her.peace, her.wave, camera], () => onShelf() || inside)

  return {
    // one big flash as the camera flies in; then the lamp-lit room, its links along the bottom
    async open() {
      inside = true
      quiet = unnoticed = 0
      ui.links(true, about.contact, files.includes(about.cv) ? about.cv : null)
      setNight(true)
      if (stepped.reduced) return
      setFlash(1)
      burst.mesh.visible = true
      bigFlash.classList.remove('is-on')
      void bigFlash.offsetWidth
      bigFlash.classList.add('is-on')
      await stepped.poses([0.8, 0.55, 0.3, 0.12, 0], (k) => {
        setFlash(k)
        burst.mesh.scale.setScalar(0.4 + k)
        burst.mesh.visible = k > 0.05
      })
    },
    async close() {
      ui.close(true)
      ui.links(false)
      if (viewing3d) {
        const pol = viewing3d
        viewing3d = null
        pol.group.position.copy(pol.home)
        pol.group.rotation.set(0, 0, pol.tilt)
        pol.group.scale.setScalar(1)
        pol.front.material.map = pol.small
        pol.front.material.needsUpdate = true
        pol.pin.visible = true
        dimmer.visible = false
        dimmer.material.opacity = 0
      }
      if (violinOut) await putViolinAway()
      if (catMood === 'notebook' || catMood === 'act') {
        catRun++
        settleCat()
      }
      inside = false
      busy = false
      setNight(true)
    },
    // Escape (or the back button): put away whatever is out first
    escape() {
      if (ui.open) {
        ui.close()
        return true
      }
      return false
    },
    // the pointer: the cat's eyes follow it
    pointer(fx, fy) {
      if (!EYES[catNow]) return
      const head = catHead().project(lens)
      const dx = fx * 2 - 1 - head.x
      const dy = 1 - fy * 2 - head.y
      const l = Math.hypot(dx, dy) || 1
      catLook = { x: (dx / l) * Math.min(1, l * 3), y: (dy / l) * Math.min(1, l * 3) }
      placeEyes()
      redraw()
    },
    // motion off: everything where it rests
    motion(off) {
      if (!off) return
      for (const b of badges) b.visible = false
      burst.mesh.visible = false
      setFlash(0)
      redLight.material.color.set('#4a1712')
      if (taking) finishShot()
      strike('idle')
      catRun++
      settleCat()
    },
  }
}

// the part of the world on the pinboard's map: the Middle East to Japan, down to Malaysia
const MAP_AREA = { lon0: 38, lon1: 150, lat0: -8, lat1: 54 }
