// Photography: the velvet reel room.
// A strip of film runs between two reels, each photo held in its frame by
// paper photo corners. Drag the film along (or scroll, use the arrow keys, or
// click a reel). Click a photo and it goes into the projector as a slide: the
// lights go down and it is thrown big onto the paper screen on the back wall.
// Red velvet curtains hang across the front. On the shelf they draw closed,
// the slide changes behind them, and they sweep open on a different photo
// each time; clicking the box swings them right open as the camera comes in.
import * as THREE from 'three'
import { site } from '../data/projects.js'
import { PALETTE as P, makePiece, makeHinged, makeFlat, texture, paperMaterial, canvas, lightDot, boil, rng } from '../lib/paper.js'
import { loopClock, passed, smooth } from '../lib/loop.js'
import * as sketch from '../lib/placeholders.js'
import { art, scan, files, base, loadImage, turn } from '../lib/assets.js'
import { photoList, renderPhoto } from '../lib/pages.js'

// ---- the film
const FRAME = 0.58 // how far the film moves from one photo to the next
const FILM_H = 0.5
const PRINT = { w: 0.46, h: 0.31 } // the most room a print has; it keeps its own shape inside this
const FILM_Y = 0.72 // height of the middle of the film above the floor
const RIG_Z = -1.3 // where the reels stand (nothing taller than this distance may stand here)
const REEL_X = 1.9 // reel centres, either side of the middle
const REEL_R = 0.44
const ROLL = { min: 0.12, max: 0.38 } // radius of the film wound on a reel, empty to full
const SPIN = 0.3 // film moved per radian a reel turns

// ---- the projector, and where its lens and slide slot are on its drawing, as
// fractions of the drawing's width (from the left) and height (from the
// bottom). Change these if your projector drawing puts them somewhere else.
const PROJECTOR = { width: 0.7, fromLeft: 0.55, z: -0.58, turn: 0.22 }
const LENS = { x: 0.93, y: 0.68 }
const SLOT = { x: 0.35, y: 0.98 }

// ---- the paper screen on the back wall
const SCREEN_W = 2.3
const MOTES = 36 // dust in the beam

// ---- the curtains, and their loop on the shelf (seconds into it)
const PLEATS = 12
const CURTAIN_Z = -0.12 // how far in from the opening they hang
const GATHERED = 0.3 // how wide each one is, drawn back to its side
const LOOP = 9.5
const SHUT = 1.3 // drawn across by now,
const SWAP = 1.45 // the slide changes behind them,
const PART = 2.5 // they start to sweep open,
const OPENED = 4 // and are open again (until the loop comes round)

// light, not artwork: the darkening toward the edges of a projected picture
function lightFalloff() {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 50, 128, 128, 182)
  g.addColorStop(0, 'rgba(0, 0, 0, 0)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return c
}

export async function build({ box, stepped, overlay, redraw, goTo, lights, onShelf }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)

  const L = site.labels
  const rand = rng(9)
  const lerp = THREE.MathUtils.lerp
  const clamp = THREE.MathUtils.clamp
  const list = photoList(files)
  const count = list.length
  const scrollMax = Math.max(0, (count - 1) * FRAME)

  // her drawings where they exist, labelled stand-ins where they do not
  const [reelArt, standArt, projectorArt, screenArt, cornerArt, crankArt] = await Promise.all([
    art('drawings/reel', (seed) => sketch.reel(seed)),
    art('drawings/reel-stand', (seed) => sketch.reelStand(seed)),
    art('drawings/projector', (seed) => sketch.projector(seed)),
    art('drawings/screen', (seed) => sketch.screenSheet(seed), { tracings: 1 }),
    art('drawings/photo-corners', (seed) => sketch.photoCorners(seed), { edge: 0 }),
    art('drawings/crank', (seed) => sketch.crank(seed)),
  ])

  // where a point on something in the room is, in the room's own coordinates
  const inRoom = (object, x, y, z) => {
    object.updateWorldMatrix(true, false)
    return room.worldToLocal(object.localToWorld(new THREE.Vector3(x, y, z)))
  }
  const solid = (mesh) => {
    mesh.castShadow = mesh.receiveShadow = true
    return mesh
  }

  // ---- the reels and the film between them (one piece, so it folds as one) ---
  const rig = makeHinged(2 * (REEL_X + REEL_R), FILM_Y + REEL_R)
  rig.group.position.z = RIG_Z
  room.add(rig.group)

  // the film: black card with sprocket holes, slid along under the prints
  const bandMap = scan('film-strip', () => sketch.filmBand(), { tile: false })
  bandMap.wrapS = THREE.RepeatWrapping
  bandMap.repeat.x = (2 * REEL_X) / FRAME
  const band = solid(new THREE.Mesh(new THREE.PlaneGeometry(2 * REEL_X, FILM_H), paperMaterial(bandMap, THREE.DoubleSide)))
  band.position.y = FILM_Y
  rig.hinge.add(band)

  const rollMap = texture(sketch.filmRoll())
  const rollShape = new THREE.CircleGeometry(1, 40)
  const sides = [-1, 1].map((side) => {
    const x = side * REEL_X
    const stand = makeFlat(standArt, { height: FILM_Y + 0.08 })
    stand.mesh.position.set(x, stand.height / 2, -0.03)
    const roll = solid(new THREE.Mesh(rollShape, new THREE.MeshLambertMaterial({ map: rollMap })))
    roll.position.set(x, FILM_Y, 0.01)
    const reel = makeFlat(reelArt, { height: 2 * REEL_R })
    reel.mesh.position.set(x, FILM_Y, 0.016)
    rig.hinge.add(stand.mesh, roll, reel.mesh)
    return { x, stand, roll, reel }
  })
  const crank = makeFlat(crankArt, { height: 0.13 })
  crank.mesh.position.x = crank.width / 2 - 0.05 // it turns about its left end
  const crankPivot = new THREE.Group()
  crankPivot.position.set(REEL_X, FILM_Y, 0.024)
  crankPivot.add(crank.mesh)
  rig.hinge.add(crankPivot)

  // ---- the prints on the film ---------------------------------------------------
  const unit = new THREE.PlaneGeometry(1, 1)
  const cornerMaps = cornerArt.map((prep) => texture(prep.front))
  const cornerMaterial = paperMaterial(cornerMaps[0])
  const corners = {
    tracings: cornerMaps.length,
    tracing: 0,
    next() {
      corners.tracing = (corners.tracing + 1) % cornerMaps.length
      cornerMaterial.map = cornerMaps[corners.tracing]
    },
  }
  const whiteBorder = new THREE.MeshLambertMaterial({ color: P.cut })

  const prints = list.map((photo, i) => {
    const slot = new THREE.Group()
    slot.position.y = FILM_Y
    const border = solid(new THREE.Mesh(unit, whiteBorder))
    border.position.z = 0.003
    const picture = new THREE.Mesh(unit, new THREE.MeshLambertMaterial({ color: '#3a3a42' }))
    picture.position.z = 0.005
    picture.receiveShadow = true
    const tabs = new THREE.Mesh(unit, cornerMaterial)
    tabs.position.z = 0.007
    slot.add(border, picture, tabs)
    rig.hinge.add(slot)
    const print = { photo, i, slot, border, picture, tabs, w: PRINT.w, h: PRINT.h, aspect: 1.5, map: null, loading: false, x: 0, lifted: false, token: 0, spot: null }
    shape(print, 1.5)
    return print
  })

  // fit a print to its photo's shape, inside the room it has on the film
  function shape(print, aspect) {
    print.aspect = aspect
    print.w = Math.min(PRINT.w, PRINT.h * aspect)
    print.h = print.w / aspect
    print.border.scale.set(print.w + 0.03, print.h + 0.03, 1)
    print.picture.scale.set(print.w, print.h, 1)
    print.tabs.scale.set(print.w + 0.026, print.h + 0.026, 1)
  }

  // photos load as they come near the reels, not all at once
  function ensure(print) {
    if (print.map || print.loading) return
    print.loading = true
    const { photo } = print
    // stand-ins are drawn one per frame, so the film never stalls a camera glide
    if (!photo.real) return void turn().then(() => dress(print, texture(sketch.photoCard(print.i)), 1.5))
    loadImage(photo.thumb)
      .then((img) => dress(print, texture(img), img.width / img.height))
      .catch(() => {})
  }
  function dress(print, map, aspect) {
    print.map = map
    print.picture.material.map = map
    print.picture.material.color.set(0xffffff)
    print.picture.material.needsUpdate = true
    shape(print, aspect)
    if (onScreen === print) throwPicture(print, { big: !!projected })
    redraw()
  }

  // ---- winding the film -------------------------------------------------------
  let scroll = 0 // how far the film has moved; photo i is in the middle when scroll = i × FRAME
  let goal = 0 // the photo it is settling on
  let vel = 0
  let pending = 0 // drag distance not yet applied (the film only moves on a tick)
  let dragging = false
  let held = false // a scripted wind is moving the film
  let standing = false // inside the room, and it can be played with
  let mode = 'shelf' // 'shelf': playing its loop on the shelf; 'room': the camera is inside
  let projected = null // the print whose photo is in the projector, opened as a page
  let onScreen = null // the print whose photo is up on the screen (on the shelf too)

  const wound = REEL_X - REEL_R + PRINT.w / 2 - 0.04 // past this a print has gone onto a reel
  const reach = REEL_X - REEL_R - PRINT.w * 0.3 // inside this a print can be clicked
  const growth = scrollMax ? (ROLL.max ** 2 - ROLL.min ** 2) / scrollMax : 0
  const nearest = () => Math.round(scroll / FRAME)

  function layout() {
    for (const print of prints) {
      print.x = print.i * FRAME - scroll
      print.slot.position.x = print.x
      print.slot.visible = Math.abs(print.x) < wound
      if (Math.abs(print.x) < REEL_X + 3 * FRAME) ensure(print)
    }
    bandMap.offset.x = scroll / FRAME
    const turn = scroll / SPIN
    for (const side of sides) side.reel.mesh.rotation.z = turn
    crankPivot.rotation.z = turn
    // film comes off the right-hand reel and winds onto the left one
    const full = (ROLL.min + ROLL.max) / 2
    sides[0].roll.scale.setScalar(growth ? Math.sqrt(ROLL.min ** 2 + growth * Math.max(0, scroll)) : full)
    sides[1].roll.scale.setScalar(growth ? Math.sqrt(ROLL.min ** 2 + growth * Math.max(0, scrollMax - scroll)) : full)
    redraw()
  }

  // On each tick the film follows the hand, coasts, or settles a photo into the middle.
  stepped.every(1, () => {
    if (!standing || held) return false
    const before = scroll
    if (dragging) {
      scroll = clamp(scroll + pending, 0, scrollMax)
      pending = 0
      vel = scroll - before
    } else if (Math.abs(vel) > 0.012) {
      scroll = clamp(scroll + vel, 0, scrollMax)
      vel = scroll === before ? 0 : vel * 0.8
      goal = nearest()
    } else {
      vel = 0
      const gap = goal * FRAME - scroll
      if (Math.abs(gap) < 0.003) scroll = goal * FRAME
      else scroll += Math.sign(gap) * Math.max(Math.abs(gap) * 0.45, Math.min(Math.abs(gap), 0.015))
    }
    if (scroll === before) return false
    layout()
  })

  // With motion switched off the film still follows a hand, but nothing
  // coasts or settles by itself: it goes straight to where it is put.
  function jump(to) {
    scroll = clamp(to, 0, scrollMax)
    goal = nearest()
    vel = pending = 0
    layout()
  }

  function nudge(dir) {
    if (!standing || !count) return
    goal = clamp(goal + dir, 0, count - 1)
    vel = 0
    if (stepped.reduced) jump(goal * FRAME)
  }

  async function windTo(index) {
    const to = clamp(index * FRAME, 0, scrollMax)
    goal = index
    vel = pending = 0
    if (Math.abs(to - scroll) < 0.001) return
    held = true
    const from = scroll
    const frames = clamp(Math.round(Math.abs(to - from) / FRAME) + 2, 2, 9)
    await stepped.play(frames, (t) => {
      scroll = lerp(from, to, t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2)
      layout()
    })
    held = false
  }

  // a print under the pointer lifts off the film a little
  function lift(print, on) {
    if (print.lifted === on) return
    print.lifted = on
    const mine = ++print.token
    stepped.poses(on ? [0.5, 1.15, 1] : [0.4, 0], (k) => {
      if (mine !== print.token) return
      print.slot.position.z = 0.05 * k
      print.slot.scale.setScalar(1 + 0.16 * k)
    })
  }

  // ---- the projector ------------------------------------------------------------
  const projector = makePiece(projectorArt, { width: PROJECTOR.width })
  projector.group.position.set(-inner.w / 2 + PROJECTOR.fromLeft, 0, PROJECTOR.z)
  projector.group.rotation.y = PROJECTOR.turn // turned toward the screen
  room.add(projector.group)
  const lensAt = () => inRoom(projector.hinge, (LENS.x - 0.5) * projector.width, LENS.y * projector.height, 0.03)
  const slotAt = () => inRoom(projector.hinge, (SLOT.x - 0.5) * projector.width, SLOT.y * projector.height, 0.01)
  const rattle = () => stepped.poses([0.04, -0.03, 0.015, 0], (a) => (projector.hinge.rotation.z = a))

  // ---- the screen on the back wall, which unrolls from its top edge ---------------
  const sheet = screenArt[0]
  const screenH = SCREEN_W / sheet.aspect
  const screenTop = inner.h - 0.1
  const screenZ = inner.back + 0.012
  const screenMap = texture(sheet.front)
  // (it takes no shadow: the box lid's shadow would cut it in half with a hard line)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, screenH).translate(0, -screenH / 2, 0), paperMaterial(screenMap))
  screen.position.set(0, screenTop, screenZ)
  room.add(screen)
  // 0 rolled up, 1 all the way down (a little past 1 stretches it, for the bounce)
  function unroll(k) {
    const s = Math.max(0.001, k)
    screen.visible = k > 0.01
    screen.scale.y = s
    screenMap.repeat.y = Math.min(1, s)
    screenMap.offset.y = 1 - Math.min(1, s)
  }
  unroll(1)

  // ---- the projected picture, the beam, and the dust in it ------------------------
  const pictureArea = { w: SCREEN_W * 0.84, h: screenH * 0.78, y: screenTop - screenH * 0.53 }
  const glow = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const thrown = new THREE.Mesh(unit, glow)
  thrown.position.set(0, pictureArea.y, screenZ + 0.006)
  const falloff = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ map: texture(lightFalloff()), transparent: true, depthWrite: false }))
  falloff.position.set(0, pictureArea.y, screenZ + 0.008)
  room.add(thrown, falloff)

  // four long triangles from the lens to the corners of the picture, bright at the lens
  const beamShape = new THREE.BufferGeometry()
  beamShape.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3))
  const beamColors = new Float32Array(12 * 3)
  // (it is seen through twice, front and back, and it lies over the picture
  // itself, so it stays faint or it washes everything out)
  for (let f = 0; f < 4; f++) {
    beamColors.set([0.11, 0.1, 0.075], f * 9) // at the lens
    beamColors.set([0.008, 0.007, 0.005, 0.008, 0.007, 0.005], f * 9 + 3) // at the screen
  }
  beamShape.setAttribute('color', new THREE.BufferAttribute(beamColors, 3))
  const beam = new THREE.Mesh(
    beamShape,
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  )
  beam.frustumCulled = false
  const dot = texture(lightDot())
  const lensGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: dot, color: 0xfff0d0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
  )
  lensGlow.scale.setScalar(0.42)
  const moteSpots = new Float32Array(MOTES * 3)
  const moteShape = new THREE.BufferGeometry()
  moteShape.setAttribute('position', new THREE.BufferAttribute(moteSpots, 3))
  const motes = new THREE.Points(
    moteShape,
    new THREE.PointsMaterial({ map: dot, size: 0.12, color: 0xfff1d6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  motes.frustumCulled = false
  room.add(beam, lensGlow, motes)
  // each mote: how far along the beam, and where across it
  const drift = Array.from({ length: MOTES }, () => ({ t: 0.12 + rand() * 0.84, a: rand() - 0.5, b: rand() - 0.5 }))

  let apex = new THREE.Vector3()
  function aimBeam() {
    apex = lensAt()
    const { x: cx, y: cy, z } = thrown.position
    const w = thrown.scale.x / 2
    const h = thrown.scale.y / 2
    const ends = [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h]]
    const pos = beamShape.attributes.position
    ends.forEach(([ax, ay], f) => {
      const [bx, by] = ends[(f + 1) % 4]
      pos.setXYZ(f * 3, apex.x, apex.y, apex.z)
      pos.setXYZ(f * 3 + 1, ax, ay, z - 0.002)
      pos.setXYZ(f * 3 + 2, bx, by, z - 0.002)
    })
    pos.needsUpdate = true
    lensGlow.position.copy(apex)
    placeMotes()
  }
  function placeMotes() {
    const { x: cx, y: cy, z } = thrown.position
    drift.forEach((d, i) => {
      moteSpots[i * 3] = lerp(apex.x, cx + d.a * thrown.scale.x * 0.92, d.t)
      moteSpots[i * 3 + 1] = lerp(apex.y, cy + d.b * thrown.scale.y * 0.92, d.t)
      moteSpots[i * 3 + 2] = lerp(apex.z, z, d.t)
    })
    moteShape.attributes.position.needsUpdate = true
  }

  let lampLevel = 0
  function setLamp(level) {
    lampLevel = level
    const on = level > 0.001
    thrown.visible = falloff.visible = beam.visible = lensGlow.visible = motes.visible = on
    glow.color.setRGB(level, level * 0.96, level * 0.88)
    beam.material.opacity = lensGlow.material.opacity = motes.material.opacity = level
    redraw()
  }
  setLamp(0)

  // An old projector is never quite steady: the picture flickers, the dust drifts up through the beam.
  stepped.every(2, () => {
    if (!onScreen || lampLevel < 1 || !(mode === 'room' || onShelf())) return false
    for (const d of drift) {
      d.a = clamp(d.a + (rand() - 0.5) * 0.05, -0.5, 0.5)
      d.b += (rand() - 0.5) * 0.04 + 0.008
      d.t = clamp(d.t + (rand() - 0.5) * 0.03, 0.08, 0.97)
      if (d.b > 0.5) {
        d.b = -0.5
        d.t = 0.12 + rand() * 0.84
      }
    }
    placeMotes()
    const flicker = 0.93 + rand() * 0.07
    glow.color.setRGB(flicker, flicker * 0.96, flicker * 0.88)
    beam.material.opacity = flicker
    return 'looks' // light and dust cast no shadows
  })

  // Put a print's photo up on the screen: the small copy straight away, the
  // full-size one as soon as it arrives (not for the shelf: too small to tell).
  const fullSize = new Map()
  function throwPicture(print, { big = true } = {}) {
    glow.map = print.map
    glow.needsUpdate = true
    const w = Math.min(pictureArea.w, pictureArea.h * print.aspect)
    thrown.scale.set(w, w / print.aspect, 1)
    falloff.scale.copy(thrown.scale)
    aimBeam()
    const { photo } = print
    if (!big || !photo.real || photo.thumb === photo.src) return
    let full = fullSize.get(photo.src)
    if (!full) {
      full = loadImage(photo.src).then(texture)
      fullSize.set(photo.src, full)
      if (fullSize.size > 6) {
        const [oldest] = fullSize.keys()
        fullSize.get(oldest).then((map) => map.dispose(), () => {})
        fullSize.delete(oldest)
      }
    }
    full
      .then((map) => {
        if (onScreen !== print) return
        glow.map = map
        glow.needsUpdate = true
        redraw()
      })
      .catch(() => {})
  }

  // ---- the slide: a photo's flight from the film into the projector ---------------
  const slide = new THREE.Group()
  const slideBorder = new THREE.Mesh(unit, whiteBorder)
  const slidePicture = new THREE.Mesh(unit, new THREE.MeshLambertMaterial())
  slidePicture.position.z = 0.002
  slide.add(slideBorder, slidePicture)
  slide.visible = false
  room.add(slide)

  async function flySlide(print) {
    const from = inRoom(print.slot, 0, 0, 0.01)
    const to = slotAt()
    slidePicture.material.map = print.map
    slidePicture.material.needsUpdate = true
    slideBorder.scale.set(print.w + 0.03, print.h + 0.03, 1)
    slidePicture.scale.set(print.w, print.h, 1)
    print.picture.visible = print.border.visible = false // its photo corners are left holding nothing
    slide.visible = true
    await stepped.poses([0.08, 0.2, 0.34, 0.5, 0.66, 0.8, 0.91, 1], (t) => {
      slide.position.lerpVectors(from, to, t)
      slide.position.y += Math.sin(t * Math.PI) * 0.75
      slide.rotation.set(-0.5 * t, Math.sin(t * Math.PI) * 0.8, 0.4 * (1 - t) - 0.2 * t)
      slide.scale.setScalar(1 - 0.45 * t)
    })
    await stepped.poses([0.06, 0.13], (dy) => (slide.position.y = to.y - dy)) // down into the slot
    slide.visible = false
  }

  // ---- buttons ----------------------------------------------------------------------
  const four = () => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const reelCorners = (side) => {
    const c = four()
    return () => {
      c[0].set(side.x - REEL_R, FILM_Y - REEL_R, 0.02)
      c[1].set(side.x + REEL_R, FILM_Y - REEL_R, 0.02)
      c[2].set(side.x - REEL_R, FILM_Y + REEL_R, 0.02)
      c[3].set(side.x + REEL_R, FILM_Y + REEL_R, 0.02)
      for (const p of c) rig.hinge.localToWorld(p)
      return c
    }
  }
  const printCorners = (print) => {
    const c = four()
    return () => {
      c[0].set(-print.w / 2, -print.h / 2, 0)
      c[1].set(print.w / 2, -print.h / 2, 0)
      c[2].set(-print.w / 2, print.h / 2, 0)
      c[3].set(print.w / 2, print.h / 2, 0)
      for (const p of c) print.slot.localToWorld(p)
      return c
    }
  }
  const nameOf = (print) => print.photo.caption || `${L.photo} ${print.i + 1}`
  const addressOf = (photo) => `#/${box.id}/${encodeURIComponent(photo.id)}`

  overlay.addSpot({ group: box.id, label: site.ui.windBack, corners: reelCorners(sides[0]), onClick: () => nudge(-1) })
  for (const print of prints) {
    print.spot = overlay.addSpot({
      group: box.id,
      label: nameOf(print),
      corners: printCorners(print),
      visible: () => standing && !projected && Math.abs(print.x) < reach,
      onClick: () => goTo(addressOf(print.photo)),
      onHover: (on) => standing && lift(print, on),
    })
  }
  overlay.addSpot({ group: box.id, label: site.ui.windOn, corners: reelCorners(sides[1]), onClick: () => nudge(1) })

  boil(stepped, [...sides.flatMap((side) => [side.reel, side.stand]), crank, corners, projector], () => (mode === 'room' || onShelf()) && !projected)
  const byId = (id) => prints.find((print) => print.photo.id === id)

  // ---- the curtains: red velvet, pleated like a paper fan, across the front -------------
  const [curtainArt, valanceArt] = await Promise.all([
    art('drawings/curtain', (seed) => sketch.curtain(seed, PLEATS), { edge: 0, trim: false, tracings: 1 }),
    art('drawings/curtain-valance', (seed) => sketch.valance(seed), { edge: 0, tracings: 1 }),
  ])
  const half = inner.w / 2
  const across = half + 0.05 // drawn across, each reaches just past the middle
  const laid = across / Math.cos(0.36) // a curtain laid out flat (drawn across it still hangs in folds)
  const pleatW = laid / PLEATS
  const curtainH = inner.h - 0.02
  // One zig-zag of flat strips, shared by both curtains (the right one is its mirror image).
  const folds = new THREE.BufferGeometry()
  const foldAt = new Float32Array(PLEATS * 12)
  const foldNormal = new Float32Array(PLEATS * 12)
  const foldUv = new Float32Array(PLEATS * 8)
  const foldIndex = []
  for (let j = 0; j < PLEATS; j++) {
    foldUv.set([j / PLEATS, 0, (j + 1) / PLEATS, 0, j / PLEATS, 1, (j + 1) / PLEATS, 1], j * 8)
    foldIndex.push(j * 4, j * 4 + 1, j * 4 + 2, j * 4 + 2, j * 4 + 1, j * 4 + 3)
  }
  folds.setAttribute('position', new THREE.BufferAttribute(foldAt, 3))
  folds.setAttribute('normal', new THREE.BufferAttribute(foldNormal, 3))
  folds.setAttribute('uv', new THREE.BufferAttribute(foldUv, 2))
  folds.setIndex(foldIndex)
  const velvet = paperMaterial(texture(curtainArt[0].front), THREE.DoubleSide)
  const curtains = [-1, 1].map((side) => {
    const mesh = new THREE.Mesh(folds, velvet)
    mesh.position.x = side * half // hung from the side wall
    mesh.scale.x = -side
    mesh.castShadow = mesh.receiveShadow = true
    mesh.frustumCulled = false
    room.add(mesh)
    return mesh
  })
  const valance = makeFlat(valanceArt, { width: inner.w + 0.02 })
  valance.mesh.position.set(0, inner.h - valance.height / 2 + 0.01, CURTAIN_Z + 0.04)
  room.add(valance.mesh)

  // 0: drawn back to the sides; 1: drawn right across. (Just below 0 is drawn
  // back tighter still: the swing as they are pulled open.)
  let curtain = null
  function drawCurtains(k) {
    if (k === curtain) return false
    curtain = k
    const width = GATHERED + (across - GATHERED) * k
    const angle = Math.acos(clamp(width / laid, 0, 1))
    const dx = pleatW * Math.cos(angle)
    const dz = pleatW * Math.sin(angle)
    for (let j = 0; j < PLEATS; j++) {
      const za = CURTAIN_Z - (j % 2 ? dz : 0)
      const zb = CURTAIN_Z - (j % 2 ? 0 : dz)
      const xa = j * dx
      const xb = xa + dx
      foldAt.set([xa, 0.01, za, xb, 0.01, zb, xa, curtainH, za, xb, curtainH, zb], j * 12)
      // alternate strips face left and right, so the lamp picks out every fold
      const nx = (j % 2 ? -dz : dz) / pleatW
      const nz = dx / pleatW
      for (let v = 0; v < 4; v++) foldNormal.set([nx, 0, nz], j * 12 + v * 3)
    }
    folds.attributes.position.needsUpdate = true
    folds.attributes.normal.needsUpdate = true
    return true
  }
  drawCurtains(0)

  // ---- on the shelf: the curtains draw closed, the slide changes, they sweep open --------
  const nextOf = (print) => prints[((print?.i ?? -1) + 1) % count]
  const clock = loopClock(stepped, {
    box,
    group: room,
    period: LOOP,
    active: () => mode === 'shelf' && onShelf(),
    tick(t, prev) {
      let changed = false
      if (count && passed(prev, t, SWAP)) {
        onScreen = nextOf(onScreen)
        ensure(onScreen)
        throwPicture(onScreen, { big: false })
        changed = 'looks'
      }
      if (count && passed(prev, t, OPENED)) ensure(nextOf(onScreen)) // ready for next time round
      const k = t < SHUT ? smooth(t / SHUT) : t < PART ? 1 : t < OPENED ? 1 - smooth((t - PART) / (OPENED - PART)) : 0
      return drawCurtains(k) || changed
    },
  })

  // The whole scene, as the shelf first shows it: the film wound to the middle
  // of the photos, the screen down, the projector showing one of them.
  goal = Math.max(0, Math.min(2, count - 1))
  scroll = goal * FRAME
  layout()
  if (count) {
    onScreen = prints[goal]
    ensure(onScreen)
    throwPicture(onScreen, { big: false })
    setLamp(1)
  }

  return {
    // the curtains swing right open (from wherever they had got to) as the camera comes in
    async open() {
      mode = 'room'
      const from = Math.max(0, curtain)
      await stepped.poses([from * 0.62, from * 0.28, from * 0.06 - 0.03, -0.07, -0.025, 0], drawCurtains)
      standing = true
    },
    // back on the shelf, it starts its loop again
    async close() {
      standing = false
      dragging = false
      for (const print of prints) lift(print, false)
      mode = 'shelf'
      clock.restart()
    },

    title: (id) => nameOf(byId(id)),
    card: (id) => renderPhoto(byId(id).photo, { list, base }),
    spot: (id) => byId(id)?.spot,

    // while a photo is up, the camera frames the picture on the screen
    view() {
      const at = thrown.getWorldPosition(new THREE.Vector3())
      return { cx: at.x, cy: at.y, w: thrown.scale.x * 1.1, h: thrown.scale.y * 1.14, z: at.z }
    },

    async start(id) {
      const print = byId(id)
      lift(print, false)
      // the shutter closes on the picture that is up while the film winds to this one
      await Promise.all([windTo(print.i), lampLevel > 0 ? stepped.poses([0.35, 0], setLamp) : null])
      ensure(print)
      await flySlide(print)
      projected = onScreen = print
      rattle()
      throwPicture(print)
      // the room goes dark while the lamp catches
      await Promise.all([
        stepped.poses([0.25, 0.5, 0.72, 0.88, 1], (k) => lights?.dim(k)),
        stepped.poses([0.5, 0, 0.9, 0.3, 1], setLamp),
      ])
    },

    // the next photo, without putting the lights back up
    async swap(id) {
      const next = byId(id)
      const before = projected
      await stepped.poses([0.35, 0], setLamp) // the shutter closes
      projected = null
      if (before) before.picture.visible = before.border.visible = true
      await windTo(next.i)
      ensure(next)
      next.picture.visible = next.border.visible = false
      projected = onScreen = next
      throwPicture(next)
      rattle()
      await stepped.poses([0.6, 1], setLamp)
    },

    // the room lights come back up; the projector stays on, still showing it
    end() {
      const print = projected
      projected = null
      stepped.poses([0.75, 0.5, 0.25, 0], (k) => lights?.dim(k))
      if (!print) return
      print.picture.visible = print.border.visible = true
      stepped.poses([1.25, 0.95, 1], (s) => print.slot.scale.setScalar(s)) // back into its corners
    },

    // arrow keys wind the film, or step through the photos while one is up
    key(key, item) {
      const dir = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0
      if (!dir) return
      if (!item) return nudge(dir)
      const next = list[list.findIndex((photo) => photo.id === item) + dir]
      if (next) goTo(addressOf(next))
    },

    // dragging anywhere in the room cranks the film along with the hand
    drag(dx) {
      if (!standing) return
      if (stepped.reduced) return jump(scroll - dx)
      dragging = true
      pending -= dx
    },
    dragEnd() {
      if (stepped.reduced) return jump(nearest() * FRAME)
      dragging = false
      // a quick flick can start and end between two ticks: apply what is left, and let it coast
      if (pending) {
        scroll = clamp(scroll + pending, 0, scrollMax)
        vel = clamp(pending * 0.3, -0.3, 0.3)
        pending = 0
        layout()
      }
      goal = nearest()
    },
    wheel(delta) {
      if (!standing || !count) return
      if (stepped.reduced) return jump((nearest() + Math.sign(delta)) * FRAME)
      vel = clamp(vel + delta * 0.0011, -0.3, 0.3)
    },
    // motion off: the curtains stay open, the picture stays up
    motion(off) {
      if (!off) return clock.restart()
      drawCurtains(0)
      redraw()
    },
  }
}
