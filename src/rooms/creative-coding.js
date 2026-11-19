// Creative coding: the card shop.
// Her sketches are trading cards, sold in booster packs, one pack per
// semester. The packs stand in a cardboard display case on a five-step
// staircase: her first semester on the bottom step, the newest (biggest,
// shiniest, best lit) on the top. Pick one and it comes out of the case onto
// the counter; rip it open and the cards burst out across the mat, the set's
// favourite last and face down, until it turns itself over. Opened cards go
// into the binder on the counter, which remembers them between visits.
//
// The case, the packs and the counter are paper in the scene and move in
// 12 fps steps. The cards are HTML laid over the scene, each one mapped onto
// its four corners on screen, so their clips play smoothly and their words
// stay sharp; they move in steps all the same.
import * as THREE from 'three'
import { sketches, words } from '../data/sketches.js'
import { sets as SET_LIST } from '../data/sets.js'
import { site } from '../data/projects.js'
import { PALETTE as P, makeFlat, texture, paperMaterial, softShadow, boil, rng, unsent } from '../lib/paper.js'
import * as drawn from '../lib/placeholders.js'
import * as shop from '../lib/shop.js'
import { art, has, base, turn, tracingsOf, loadImage, scan } from '../lib/assets.js'
import { sound } from '../lib/sound.js'
import { preview } from '../lib/sketches.js'
import { ASPECT, setSize, makeCard, makeBinder, makeCardView, frameCanvas, frameUrl, backUrl, chaseOf, finishOf, tintOf } from '../lib/trading-cards.js'

const SETS = [...SET_LIST].sort((a, b) => a.order - b.order) // oldest first: the bottom step
const STEP_BASE = 0.16 // the bottom step's height
const STEP_FRONT = -0.36 // where the staircase starts, behind the case front
const PACK_ASPECT = 0.66
const LEAN = -0.12 // a pack leans back on its stand
const CARD_W = 0.44 // a card on the counter, in scene units
const CARD_H = CARD_W / ASPECT
const TRAY_D = 1.6 // how far the counter pulls out
const COUNTER_LIFT = 1.15 // how steeply the camera looks down at the counter
const TILT = 0.14 // a card tips toward the pointer by up to 8 degrees
const BEAM = 0.34 // how strong the light from the strip lights is
const K = 52 // card springs: stiffness
const C = 8.4 // and damping
const DT = 1 / 12
const KEY = 'binder' // the cards a visitor has collected, in localStorage
const V3 = THREE.Vector3

const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2
const lerp = THREE.MathUtils.lerp
const clamp = THREE.MathUtils.clamp
const cardsOf = (set) => sketches.filter((s) => s.set === set.id)
const countText = (k) => `${k} ${k === 1 ? words.card : words.cards}`

function readCollection() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list.filter((slug) => sketches.some((s) => s.slug === slug)) : []
  } catch {
    return []
  }
}
function saveCollection(collected) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...collected]))
  } catch {}
}

// A plane that puffs out in the middle and is pinched flat at its top and
// bottom edges, the way a sealed pack is. Its texture covers v0..v1 of the drawing.
function puffed(w, h, bulge, v0, v1) {
  const geometry = new THREE.PlaneGeometry(w, h, 6, 6)
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k) / (w / 2)
    const y = pos.getY(k) / (h / 2)
    pos.setZ(k, bulge * (1 - x * x) * (1 - y * y))
    uv.setY(k, v0 + uv.getY(k) * (v1 - v0))
  }
  geometry.computeVertexNormals()
  return geometry
}

// a texture for something redrawn while the room is open (it goes up with the
// next frame, not through the queue main.js sends a room's drawings by)
function liveTexture(source) {
  const t = texture(source)
  unsent.splice(unsent.indexOf(t), 1)
  return t
}

export async function build({ box, stepped, overlay, redraw, goTo, look, camera }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)
  const rand = rng(31)
  const n = SETS.length
  const stepW = Math.min(0.86, (inner.w - 0.2) / n)
  const rise = n > 1 ? Math.min(0.26, 1.04 / (n - 1)) : 0
  const stepX = (i) => (i - (n - 1) / 2) * stepW
  const stepTop = (i) => STEP_BASE + i * rise
  const packH = (i) => 0.5 + 0.18 * Math.pow(n > 1 ? i / (n - 1) : 1, 1.3)
  const sealed = (set) => !cardsOf(set).length

  // ---- the staircase -----------------------------------------------------------------
  const sideLook = new THREE.MeshLambertMaterial({ color: '#e5dcca' })
  const topLook = new THREE.MeshLambertMaterial({ color: '#f2ebdd' })
  const depth = STEP_FRONT - inner.back
  for (let i = 0; i < n; i++) {
    await turn()
    const h = stepTop(i)
    const front = new THREE.MeshLambertMaterial({ map: texture(shop.stepFront(stepW, h, i + 1)) })
    const step = new THREE.Mesh(new THREE.BoxGeometry(stepW - 0.012, h, depth), [sideLook, sideLook, topLook, sideLook, front, sideLook])
    step.position.set(stepX(i), h / 2, (STEP_FRONT + inner.back) / 2)
    step.castShadow = step.receiveShadow = true
    room.add(step)
    // a little riser at the back of each step, for the cards on show
    const riser = new THREE.Mesh(new THREE.BoxGeometry(stepW * 0.8, 0.11, 0.34), topLook)
    riser.position.set(stepX(i), h + 0.055, STEP_FRONT - 0.76)
    riser.castShadow = riser.receiveShadow = true
    room.add(riser)
  }

  // ---- the packs, their stands, lights, tags and the cards on show ------------------------
  const standLook = new THREE.MeshLambertMaterial({ map: texture(shop.acrylicStand()), transparent: true, depthWrite: false, side: THREE.DoubleSide })
  const lightOn = texture(shop.stripLight(true))
  const lightOff = texture(shop.stripLight(false, 2))
  const shimmerImage = shop.shimmer()
  const backCanvas = shop.cardBack()
  const eras = new Map()
  const eraImage = (era) => {
    if (!eras.has(era)) {
      const file = tracingsOf(`drawings/era-${era}`)[0]
      eras.set(era, file ? loadImage(file).catch(() => null) : Promise.resolve(null))
    }
    return eras.get(era)
  }
  const tear = 1 - shop.TEAR // the tear line, as a fraction of the pack's height from the bottom
  const packs = []
  const lamps = []
  const sheens = []
  const boiling = []

  function makePack(set, i, frontCanvas, backCanvasOfPack) {
    const h = packH(i)
    const w = h * PACK_ASPECT
    const group = new THREE.Group() // where it is: on its stand, in the air, on the counter
    const lift = new THREE.Group() // lifted off its stand by the pointer
    const lean = new THREE.Group() // leaning back on the stand, or facing up from the counter
    group.add(lift)
    lift.add(lean)
    const frontMap = texture(frontCanvas)
    const backMap = texture(backCanvasOfPack)
    backMap.wrapS = THREE.RepeatWrapping
    backMap.repeat.x = -1 // it is seen from behind
    const body = new THREE.Mesh(puffed(w, h * tear, 0.032, 0, tear), paperMaterial(frontMap))
    const rear = new THREE.Mesh(puffed(w, h * tear, -0.032, 0, tear), paperMaterial(backMap, THREE.BackSide))
    body.position.y = rear.position.y = (h * tear) / 2
    body.castShadow = rear.castShadow = body.receiveShadow = true
    lean.add(body, rear)

    // the strip above the tear line, in pieces, so it can tear a bit at a time
    const strip = new THREE.Group()
    strip.position.y = h * tear
    const stripLook = paperMaterial(frontMap, THREE.DoubleSide)
    const sh = h * (1 - tear)
    const segs = []
    const N = 8
    for (let k = 0; k < N; k++) {
      const geometry = new THREE.PlaneGeometry(w / N, sh).translate(0, sh / 2, 0)
      const uv = geometry.attributes.uv
      for (let j = 0; j < uv.count; j++) uv.setXY(j, (k + uv.getX(j)) / N, tear + uv.getY(j) * (1 - tear))
      const seg = new THREE.Mesh(geometry, stripLook)
      seg.castShadow = true
      const pivot = new THREE.Group()
      pivot.position.x = -w / 2 + ((k + 0.5) * w) / N
      pivot.add(seg)
      strip.add(pivot)
      segs.push(pivot)
    }
    lean.add(strip)

    // Foil catches the light: a band of rainbow slides across it with the
    // pointer (over the whole pack for holo, over the badge for foil).
    if (set.wrapper === 'holo' || set.wrapper === 'foil') {
      const map = liveTexture(shimmerImage)
      map.wrapS = THREE.RepeatWrapping
      map.center.set(0.5, 0.5)
      map.rotation = 0.7
      map.repeat.set(0.75, 1)
      const holo = set.wrapper === 'holo'
      const mask = document.createElement('canvas')
      mask.width = mask.height = 64
      const mctx = mask.getContext('2d')
      mctx.fillStyle = '#fff'
      if (holo) mctx.fillRect(2, 2, 60, 60)
      else {
        mctx.beginPath()
        mctx.arc(32, 32, 30, 0, Math.PI * 2)
        mctx.fill()
      }
      const sw = holo ? w * 0.94 : w * 0.49
      const shH = holo ? h * (tear - 0.1) : w * 0.49
      const sheen = new THREE.Mesh(
        new THREE.PlaneGeometry(sw, shH),
        new THREE.MeshBasicMaterial({ map, alphaMap: texture(mask), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: holo ? 0.26 : 0.36 }),
      )
      // the badge is drawn about 58% of the way up a pack (lower if the set has a title)
      sheen.position.set(0, holo ? h * (0.05 + (tear - 0.1) / 2) : h * (set.title ? 0.54 : 0.583), holo ? 0.034 : 0.03)
      lean.add(sheen)
      sheens.push({ map, phase: rand() })
    }

    const pack = {
      set, i, w, h, group, lift, lean, body, rear, strip, segs,
      home: new V3(stepX(i), stepTop(i) + 0.03, STEP_FRONT - 0.24),
      standing: false,
      lifting: 0,
      slabs: [],
      spot: null,
      ball: null,
      // its corners in the world, for the button over it on the counter
      corners: (() => {
        const c = [new V3(), new V3(), new V3(), new V3()]
        return () => {
          c[0].set(-w / 2, 0, 0)
          c[1].set(w / 2, 0, 0)
          c[2].set(-w / 2, h, 0)
          c[3].set(w / 2, h, 0)
          for (const p of c) lean.localToWorld(p)
          return c
        }
      })(),
    }
    group.position.copy(pack.home)
    lean.rotation.x = LEAN
    // it comes in when the case is opened; until then it is there but tiny,
    // so its shaders are compiled with the rest of the room
    group.scale.setScalar(1e-4)
    room.add(group)
    return pack
  }

  for (let i = 0; i < n; i++) {
    const set = SETS[i]
    const cards = cardsOf(set)
    const era = await eraImage(set.era)
    const [{ front }] = await art(`drawings/pack-${set.id}`, () => shop.packFront(set, { count: cards.length ? countText(cards.length) : '', eraImage: era, seed: i + 1 }), { edge: 0, trim: false, tracings: 1 })
    const [{ front: back }] = await art('drawings/pack-back', () => shop.packBack(set, i + 1), { edge: 0, trim: false, tracings: 1 })
    const pack = makePack(set, i, front, back)
    packs.push(pack)
    const top = stepTop(i)

    // its sticker, or the tape that keeps a lost set shut
    if (set.sticker) {
      const round = set.wrapper === 'vintage'
      const [prep] = await art(
        `drawings/sticker-${set.id}`,
        (seed) => shop.sticker(set.sticker, round ? { kind: 'round', color: '#cf3d34', ink: '#fffaf0', seed } : { kind: 'burst', color: P.highlighter.yellow, seed }),
        { tracings: 1 },
      )
      const sticker = makeFlat([prep], { width: pack.w * 0.52 })
      sticker.mesh.position.set(pack.w * 0.3, pack.h * 0.7, 0.045)
      sticker.mesh.rotation.z = round ? 0.2 : -0.24
      sticker.mesh.castShadow = false
      pack.lean.add(sticker.mesh)
    }
    if (set.sealed) {
      const strip = makeFlat([{ front: drawn.tape(set.sealed, i + 4, { width: 680, height: 150 }), aspect: 680 / 150 }], { width: pack.w * 1.3 })
      strip.mesh.position.set(0, pack.h * 0.46, 0.036)
      strip.mesh.rotation.z = -0.32
      strip.mesh.castShadow = false
      pack.lean.add(strip.mesh)
    }

    // the clear stand it leans on
    const stand = new THREE.Mesh(new THREE.PlaneGeometry(pack.w * 1.2, pack.h * 0.92).translate(0, pack.h * 0.46, 0), standLook)
    stand.position.set(stepX(i), top + 0.005, pack.home.z - 0.07)
    stand.rotation.x = LEAN
    room.add(stand)
    const shade = softShadow(pack.w * 1.5, 0.4, 0.22)
    shade.position.set(stepX(i), top + 0.004, pack.home.z - 0.06)
    room.add(shade)

    // A few of its cards in graded slabs behind it, fanned. A lost set shows
    // two cards face down. Their pictures move while the pointer is on the pack.
    const chase = cards.length ? chaseOf(cards) : null
    const shown = cards.length ? [...new Set([cards[0], chase, cards[1]].filter(Boolean))] : [null, null]
    const angles = shown.length === 3 ? [-0.36, 0, 0.36] : shown.length === 2 ? [-0.2, 0.2] : [0]
    for (let k = 0; k < shown.length; k++) {
      await turn()
      const s = shown[k]
      const frame = s ? await frameCanvas(set, finishOf(set, s === chase)) : backCanvas
      const made = shop.slab(frame, s ? s.title : '?', i * 10 + k)
      const display = document.createElement('canvas')
      display.width = made.canvas.width
      display.height = made.canvas.height
      display.getContext('2d').drawImage(made.canvas, 0, 0)
      const tex = texture(display)
      const sw = 0.3
      const shH = (sw * display.height) / display.width
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sw, shH).translate(0, shH / 2, 0), paperMaterial(tex, THREE.DoubleSide))
      mesh.castShadow = mesh.receiveShadow = true
      const holder = new THREE.Group()
      const mid = k === (shown.length - 1) / 2
      holder.position.set(stepX(i) + (k - (shown.length - 1) / 2) * 0.13, top + 0.11, STEP_FRONT - 0.78 + (mid ? 0.03 : 0))
      holder.rotation.z = -angles[k]
      holder.add(mesh)
      holder.scale.setScalar(1e-4)
      room.add(holder)
      const slab = { holder, display, tex, pic: s ? made.pic : null, s, still: null, poster: null, video: null }
      if (s) {
        slab.still = preview(sketches.indexOf(s), tintOf(set), 132, 99)
        for (let f = 0; f < 20; f++) slab.still.step(f / 12)
        drawSlab(slab, 0)
        if (has(s.poster))
          loadImage(s.poster)
            .then((img) => {
              slab.poster = img
              drawSlab(slab, 0)
              redraw()
            })
            .catch(() => {})
      }
      pack.slabs.push(slab)
    }

    // the strip light over it: brighter the higher the step
    const ly = top + pack.h + 0.22
    const tube = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.155), new THREE.MeshBasicMaterial({ map: lightOff, transparent: true, alphaTest: 0.5 }))
    tube.position.set(stepX(i), ly, STEP_FRONT - 0.44)
    tube.rotation.x = 0.22
    room.add(tube)
    const beamH = ly - top - 0.02
    const beamGeometry = new THREE.BufferGeometry()
    beamGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.24, 0, 0, 0.24, 0, 0, 0.42, -beamH, 0, -0.42, -beamH, 0], 3))
    beamGeometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 0.86, 0.6, 1, 0.86, 0.6, 0, 0, 0, 0, 0, 0], 3))
    beamGeometry.setIndex([0, 2, 1, 0, 3, 2])
    const beam = new THREE.Mesh(
      beamGeometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0 }),
    )
    beam.position.set(stepX(i), ly - 0.05, STEP_FRONT - 0.18)
    beam.visible = false
    room.add(beam)
    lamps.push({ tube, beam, level: 0.45 + 0.55 * (n > 1 ? i / (n - 1) : 1) })

    // the handwritten tag on the step's front
    const tagText = sealed(set) ? `${set.name} · ${words.lost}` : [set.name, set.place, countText(cards.length)].filter(Boolean).join(' · ')
    pack.label = tagText
    const tagArt = await art(`drawings/tag-${set.id}`, (seed) => shop.shopTag(tagText, seed + i * 3), { edge: 0 })
    const tag = makeFlat(tagArt, { width: Math.min(0.68, stepW * 0.82) })
    tag.mesh.position.set(stepX(i) - 0.02, top - tag.height / 2 - 0.02, STEP_FRONT + 0.005)
    tag.mesh.rotation.z = (rand() - 0.5) * 0.08
    tag.mesh.castShadow = false
    room.add(tag.mesh)
    boiling.push(tag)
  }

  // the picture in a slab: her poster, her clip while the pointer is on its pack, or a stand-in
  function drawSlab(slab, frame) {
    if (!slab.pic) return
    const ctx = slab.display.getContext('2d')
    const { x, y, w, h } = slab.pic
    if (slab.video && slab.video.readyState >= 2) ctx.drawImage(slab.video, x, y, w, h)
    else if (slab.poster && frame === 0) ctx.drawImage(slab.poster, x, y, w, h)
    else if (slab.still) {
      if (frame) slab.still.step(frame / 12)
      ctx.drawImage(slab.still.node, x, y, w, h)
    }
    slab.tex.needsUpdate = true
  }
  function slabClips(pack, on) {
    for (const slab of pack.slabs) {
      if (!slab.s || !has(slab.s.video)) continue
      if (on && !slab.video) {
        slab.video = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'auto', src: base + slab.s.video })
        slab.video.play().catch(() => {})
      } else if (!on && slab.video) {
        slab.video.pause()
        slab.video.removeAttribute('src')
        slab.video.load()
        slab.video = null
        drawSlab(slab, 0)
      }
    }
  }

  // ---- the sign and the note ---------------------------------------------------------------
  const signArt = await art('drawings/case-sign', (seed) => shop.hangingSign(words.dontTouch, seed), { edge: 0 })
  const sign = makeFlat(signArt, { width: 0.8 })
  sign.mesh.castShadow = false
  const SIGN_DROP = 0.42
  const signHang = new THREE.Group() // hooked to the ceiling of the case
  signHang.position.set(stepX(0) + 0.15, inner.h, STEP_FRONT - 0.72)
  const stringLook = new THREE.MeshBasicMaterial({ color: P.navy })
  const strings = [-1, 1].map((side) => {
    const string = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 1).translate(0, -0.5, 0), stringLook)
    string.position.x = side * sign.width * 0.4
    signHang.add(string)
    return string
  })
  signHang.add(sign.mesh)
  signHang.visible = false
  room.add(signHang)
  boiling.push(sign)
  const hangSign = (k) => {
    for (const string of strings) string.scale.y = SIGN_DROP * k
    sign.mesh.position.y = -SIGN_DROP * k - sign.height / 2 + 0.03
  }

  const noteArt = await art('drawings/case-note', (seed) => shop.tapedNote(words.pick, seed), { edge: 0 })
  const note = makeFlat(noteArt, { width: 1.15 })
  note.mesh.position.set(stepX(Math.floor(n / 2)) + stepW * 0.5, 0.36, STEP_FRONT + 0.006)
  note.mesh.rotation.z = 0.03
  note.mesh.castShadow = false
  room.add(note.mesh)
  boiling.push(note)

  // ---- the counter: a tray that pulls out of the case, with the mat and the binder --------
  await turn()
  const tray = new THREE.Group()
  tray.visible = false
  room.add(tray)
  const cardboard = texture(drawn.lining('cardboard'))
  cardboard.wrapS = cardboard.wrapT = THREE.RepeatWrapping
  cardboard.repeat.set(inner.w / 3, TRAY_D / 3)
  const board = new THREE.Mesh(new THREE.BoxGeometry(inner.w - 0.03, 0.05, TRAY_D), new THREE.MeshLambertMaterial({ map: cardboard, color: '#f0dcc2' }))
  board.position.set(0, 0.025, TRAY_D / 2 - 0.12)
  board.castShadow = board.receiveShadow = true
  tray.add(board)
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.32), new THREE.MeshLambertMaterial({ map: scan('counter-mat', () => shop.counterMat(), { tile: false }) }))
  mat.rotation.x = -Math.PI / 2
  mat.receiveShadow = true
  tray.add(mat)

  const [binderArt] = await art('drawings/binder', (seed) => shop.binder(words.binder, seed), { edge: 4, tracings: 1 })
  const binderH = 0.84
  const binderW = binderH * binderArt.aspect
  const binderGroup = new THREE.Group() // where it stands on the counter
  const binderHinge = new THREE.Group() // stands it up
  const binderLean = new THREE.Group() // leans it back, like a menu on a counter
  binderLean.rotation.x = -0.42
  binderGroup.add(binderHinge)
  binderHinge.add(binderLean)
  const binderFace = new THREE.Mesh(new THREE.PlaneGeometry(binderW, binderH).translate(0, binderH / 2, 0), paperMaterial(texture(binderArt.front)))
  const binderRear = new THREE.Mesh(binderFace.geometry, paperMaterial(texture(binderArt.back), THREE.BackSide))
  binderFace.castShadow = binderFace.receiveShadow = true
  binderLean.add(binderFace, binderRear)
  const countMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(binderW * 0.8, (binderW * 0.8 * 140) / 640),
    new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.5, map: texture(drawn.tape(' ', 3, { width: 640, height: 140 })) }),
  )
  countMesh.position.set(0.03, binderH * 0.42, 0.005)
  countMesh.rotation.z = -0.04
  binderLean.add(countMesh)
  const binderShade = softShadow(binderW * 1.3, 0.5, 0.25)
  binderShade.position.set(0, 0.052, -0.12)
  binderGroup.add(binderShade)
  tray.add(binderGroup)
  const binderCorners = (() => {
    const c = [new V3(), new V3(), new V3(), new V3()]
    return (k = 1) => {
      const w = (binderW * k) / 2
      const lo = binderH * (0.5 - k / 2)
      const hi = binderH * (0.5 + k / 2)
      c[0].set(-w, lo, 0)
      c[1].set(w, lo, 0)
      c[2].set(-w, hi, 0)
      c[3].set(w, hi, 0)
      for (const p of c) binderLean.localToWorld(p)
      return c
    }
  })()

  // the wrappers, once the cards are out: one ball each
  for (const pack of packs) {
    const ball = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.3), paperMaterial(texture(shop.crumpled(pack.set, pack.i + 1)), THREE.DoubleSide))
    ball.castShadow = true
    ball.visible = false
    room.add(ball)
    pack.ball = ball
  }

  // what dims the case while a pack is on the counter
  const dimmer = new THREE.Mesh(new THREE.PlaneGeometry(inner.w, inner.h), new THREE.MeshBasicMaterial({ color: 0x0b0d1c, transparent: true, opacity: 0, depthWrite: false }))
  dimmer.position.set(0, inner.h / 2, -0.02)
  room.add(dimmer) // (shown at first, so it is compiled with the room; hidden when the case opens)
  let dimming = 0
  const dimTo = (k) => {
    const mine = ++dimming
    const from = dimmer.material.opacity
    return stepped.poses([0.25, 0.55, 0.8, 1].map((t) => lerp(from, k, t)), (o) => {
      if (mine !== dimming) return
      dimmer.material.opacity = o
      dimmer.visible = o > 0.001
    })
  }

  // ---- the HTML: cards on the counter, the counter's buttons, the big view, the binder ------
  const layer = document.createElement('div')
  layer.className = 'shop-layer'
  layer.hidden = true
  const ui = document.createElement('div')
  ui.className = 'shop-ui'
  ui.hidden = true
  ui.innerHTML = `<p class="shop-hint hand" aria-live="polite"></p><button type="button" class="paper-button hand shop-another" hidden>${words.openAnother}</button>`
  const hintNode = ui.querySelector('.shop-hint')
  const another = ui.querySelector('.shop-another')
  another.addEventListener('click', () => backToCase())
  const cardView = makeCardView({ onBack: () => goTo(`#/${box.id}`), onFlip: () => flipBig() })
  layer.append(cardView.el)
  const collected = new Set(readCollection())
  const binder = makeBinder({
    sets: SETS,
    sketches,
    onCard: (slug) => goTo(`#/${box.id}/${slug}`),
    onEverything: everything,
    onClose: () => closeBinder(),
  })
  document.body.append(layer, ui, binder.el)

  function hint(text) {
    hintNode.textContent = text || ''
    hintNode.classList.toggle('is-shown', !!text)
  }
  const setBack = (text) => (overlay.el.back.textContent = text)

  // ---- where things go on the counter, for the shape of the screen ------------------------
  let layout = null
  let seen = ''
  function counterLayout() {
    const tall = innerWidth < innerHeight
    const phi = Math.atan(COUNTER_LIFT)
    const matAt = tall ? { x: 0, z: 0.86 } : { x: -0.45, z: 0.8 }
    return {
      tall, phi, mat: matAt,
      up: new V3(0, Math.cos(phi), -Math.sin(phi)), // "up" for a card held facing the camera
      pack: new V3(matAt.x, 0.055, matAt.z + 0.12),
      ball: new V3(tall ? -0.9 : -1.84, 0.15, matAt.z + 0.42),
      binder: new V3(1.6, 0.05, 0.6),
      slots: [],
      focus: new V3(0.02, 0.42, 0.6),
      view: { w: 4.4, h: 2.3 },
    }
  }
  // Where each card of a set lands: on the mat in a fan, the chase card in
  // front (wide screens), or in a grid held up to the camera (tall screens).
  function arrange(set) {
    const L = layout
    const count = cardsOf(set).length
    const slots = []
    if (!L.tall) {
      const normal = count - 1
      const spacing = Math.min(0.58, 2.5 / Math.max(1, normal))
      for (let i = 0; i < normal; i++) {
        const o = i - (normal - 1) / 2
        slots.push({ p: new V3(L.mat.x + o * spacing, 0.056 + i * 0.0008, L.mat.z - 0.27 + o * o * 0.025), rx: -Math.PI / 2, rz: -o * 0.09, lie: true })
      }
      slots.push({ p: new V3(L.mat.x, 0.062, count > 1 ? L.mat.z + 0.34 : L.mat.z), rx: -Math.PI / 2, rz: 0.03, lie: true })
      L.focus = new V3(0.02, 0.42, 0.6)
      L.view = { w: 4.4, h: 2.3 }
    } else {
      const cols = innerWidth / innerHeight < 0.62 ? 2 : 3
      const rows = Math.ceil(count / cols)
      const gap = 0.07
      const gridW = cols * CARD_W + (cols - 1) * gap
      const gridH = rows * CARD_H + (rows - 1) * gap
      const centre = new V3(L.mat.x, 0.1 + (gridH / 2) * Math.cos(L.phi), L.mat.z + 0.1)
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols)
        const inRow = Math.min(cols, count - r * cols)
        const ox = ((i % cols) - (inRow - 1) / 2) * (CARD_W + gap)
        const oy = ((rows - 1) / 2 - r) * (CARD_H + gap)
        slots.push({ p: centre.clone().add(new V3(ox, 0, 0)).addScaledVector(L.up, oy), rx: -L.phi, rz: 0, lie: false })
      }
      L.focus = centre.clone()
      L.view = { w: gridW + 0.36, h: gridH + 1.0 }
    }
    L.slots = slots
    return slots
  }
  function relayout() {
    const key = `${innerWidth}x${innerHeight}`
    if (key === seen) return
    seen = key
    layout = counterLayout()
    mat.position.set(layout.mat.x, 0.052, layout.mat.z)
    binderGroup.position.copy(layout.binder)
    sizeCards()
    if (current && mode === 'counter') {
      current.group.position.copy(layout.pack)
      current.lean.rotation.x = -layout.phi
      const slots = arrange(current.set)
      table.forEach((e, i) => {
        e.slot = slots[i] || e.slot
        if (e.mode === 'rest') restAt(e)
      })
      if (current.ball.visible) current.ball.position.copy(layout.ball)
    } else if (current) arrange(current.set)
  }
  // what the camera frames at the counter
  function counterRect() {
    relayout()
    room.updateWorldMatrix(true, false)
    const c = room.localToWorld(layout.focus.clone())
    return { cx: c.x, cy: c.y, w: layout.view.w, h: layout.view.h, z: c.z }
  }

  // ---- cards: placing them on screen ---------------------------------------------------------
  const table = [] // the cards out on the counter
  let view = null // the card held up big: { entry, from, ry, flipped }
  let lastView = null
  const v = new V3()
  const corner = new V3()
  const q = new THREE.Quaternion()
  const q2 = new THREE.Quaternion()
  const AX = new V3(1, 0, 0)
  const AY = new V3(0, 1, 0)
  const AZ = new V3(0, 0, 1)
  const CORNERS = [[-1, 1], [1, 1], [1, -1], [-1, -1]]
  const toScreen = (p) => {
    v.copy(p)
    room.localToWorld(v)
    v.project(camera)
    return [(v.x + 1) * 0.5 * innerWidth, (1 - v.y) * 0.5 * innerHeight]
  }
  // a card somewhere in the room, as four points on screen
  function cardQuad(pose) {
    q.setFromAxisAngle(AX, pose.rx)
    q.multiply(q2.setFromAxisAngle(AY, pose.ry + pose.ty))
    q.multiply(q2.setFromAxisAngle(AX, pose.tx))
    q.multiply(q2.setFromAxisAngle(AZ, pose.rz))
    const hw = (CARD_W * pose.s) / 2
    const hh = (CARD_H * pose.s) / 2
    return CORNERS.map(([sx, sy]) => {
      corner.set(sx * hw, sy * hh, 0).applyQuaternion(q).add(pose.p)
      corner.y += pose.up
      return toScreen(corner)
    })
  }
  // a card flat on the screen in `r`, turned `ry` about its upright middle
  function rectQuad(r, ry = 0) {
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const hw = r.width / 2
    const hh = r.height / 2
    const f = r.height * 2.4
    return CORNERS.map(([sx, sy]) => {
      const x = sx * hw * Math.cos(ry)
      const z = sx * hw * Math.sin(ry)
      const k = f / (f - z)
      return [cx + x * k, cy - sy * hh * k]
    })
  }
  const awayQuad = () => rectQuad({ left: innerWidth / 2 - 45, top: innerHeight + 60, width: 90, height: 90 / ASPECT })
  // a card slipping into the binder
  const binderQuad = () => {
    const c = binderCorners(0.45)
    return [c[2], c[3], c[1], c[0]].map((p) => {
      v.copy(p).project(camera)
      return [(v.x + 1) * 0.5 * innerWidth, (1 - v.y) * 0.5 * innerHeight]
    })
  }
  // the size of a card held up big, and whether its buttons fit beside it
  function bigRect() {
    const W = innerWidth
    const H = innerHeight
    const beside = W > H && (W - H * 0.84 * ASPECT) / 2 > 250
    const w = beside ? H * 0.84 * ASPECT : Math.min(W - 32, (H - 210) * ASPECT, 560)
    const h = w / ASPECT
    return { left: (W - w) / 2, top: beside ? (H - h) / 2 : Math.max(14, (H - h - 170) / 2), width: w, height: h, beside }
  }
  function sizeCards() {
    const r = bigRect()
    setSize(layer, r.width)
    cardView.layout(r, r.beside)
  }

  function quadOf(e) {
    if (e.mode === 'fly') {
      const to = e.to()
      const t = ease(e.t)
      const bump = Math.sin(Math.PI * e.t) * innerHeight * 0.04
      return e.from.map((p, i) => [lerp(p[0], to[i][0], t), lerp(p[1], to[i][1], t) - bump])
    }
    if (e.mode === 'big') return rectQuad(bigRect(), view?.ry || 0)
    return cardQuad(e.pose)
  }
  function placeCards() {
    camera.updateMatrixWorld()
    room.updateWorldMatrix(true, false)
    const all = view && !table.includes(view.entry) ? [...table, view.entry] : table
    for (const e of all) {
      if (e.card.el.hidden) continue
      e.quad = quadOf(e)
      e.card.place(e.quad)
    }
  }
  // move a card to wherever `to()` says over `frames` ticks
  function fly(e, to, frames = 8) {
    e.landed?.() // a newer move takes over from one still going
    e.landed = null
    e.from = e.quad || to()
    e.to = to
    e.t = 0
    e.frames = frames
    e.mode = 'fly'
    if (stepped.reduced) {
      e.t = 1
      return Promise.resolve()
    }
    return new Promise((done) => (e.landed = done))
  }

  // ---- cards: making them and dealing them out -----------------------------------------------
  function makeEntry(s, set, slot, { chase }) {
    const cards = cardsOf(set)
    const card = makeCard(s, set, { number: cards.indexOf(s) + 1, total: cards.length, chase, index: sketches.indexOf(s) })
    card.el.hidden = true
    layer.insertBefore(card.el, cardView.el)
    const e = {
      s, set, card, chase, slot,
      mode: 'wait',
      pose: { p: new V3(), rx: 0, ry: 0, rz: 0, tx: 0, ty: 0, up: 0, s: 1 },
      aim: { tx: 0, ty: 0, up: 0 },
      v: new V3(),
      vrz: 0,
      quad: null,
      wait: 0,
      ticks: 0,
    }
    card.el.addEventListener('click', () => openCard(e))
    card.el.addEventListener('keydown', (ev) => {
      if (ev.target !== card.el || (ev.key !== 'Enter' && ev.key !== ' ')) return
      ev.preventDefault()
      openCard(e)
    })
    card.el.addEventListener('pointermove', (ev) => {
      if (e.mode !== 'rest' || view || ev.pointerType !== 'mouse') return
      const r = card.el.getBoundingClientRect()
      e.aim.ty = ((ev.clientX - r.left) / r.width - 0.5) * 2 * TILT
      e.aim.tx = ((ev.clientY - r.top) / r.height - 0.5) * 2 * TILT
      e.aim.up = 0.03
    })
    card.el.addEventListener('pointerleave', () => (e.aim.tx = e.aim.ty = e.aim.up = 0))
    return e
  }
  function restAt(e) {
    e.pose.p.copy(e.slot.p)
    e.pose.rx = e.slot.rx
    e.pose.rz = e.slot.rz
    e.pose.ry = 0
    e.pose.s = 1
    e.v.set(0, 0, 0)
    e.vrz = 0
    e.mode = 'rest'
  }
  // a card ready on the counter: it can be tabbed to and opened
  function ready(e) {
    e.card.el.tabIndex = 0
    e.card.el.setAttribute('role', 'button')
  }
  function openCard(e) {
    if (e.mode !== 'rest' || view || acting || phase !== 'done') return
    goTo(`#/${box.id}/${e.s.slug}`)
  }

  // the spring that carries a card from the pack to its place
  const acc = new V3()
  function stepBurst(e) {
    if (e.wait > 0) return void e.wait--
    if (!e.launched) {
      e.launched = true
      e.card.load() // its picture starts as it comes out (one card a tick, not all at once)
      e.card.el.hidden = false
      sound.play('flick')
      e.onLaunch?.()
      return
    }
    const { p } = e.pose
    const target = e.slot
    acc.subVectors(target.p, p).multiplyScalar(K).addScaledVector(e.v, -C)
    e.v.addScaledVector(acc, DT)
    p.addScaledVector(e.v, DT)
    if (target.lie && p.y < target.p.y) {
      p.y = target.p.y
      if (e.v.y < 0) e.v.y *= -0.25
    }
    e.vrz += ((target.rz - e.pose.rz) * K - e.vrz * C) * DT
    e.pose.rz += e.vrz * DT
    const k = clamp(1 - p.distanceTo(target.p) / e.dist0, 0, 1)
    const smooth = k * k * (3 - 2 * k)
    e.pose.rx = lerp(e.rx0, target.rx, smooth)
    e.pose.s = lerp(0.82, 1, smooth)
    e.ticks++
    if ((p.distanceTo(target.p) < 0.004 && e.v.length() < 0.05 && Math.abs(target.rz - e.pose.rz) < 0.01) || e.ticks > 48) {
      const ry = e.pose.ry
      restAt(e)
      e.pose.ry = ry // a chase card stays face down until it turns itself over
      e.onRest?.()
    }
  }

  // ---- the stop-motion clock ---------------------------------------------------------------
  // cards: bursting, flying, tipping toward the pointer; their stand-in pictures
  stepped.every(1, (frame) => {
    if (mode === 'closed') return false
    const all = view && !table.includes(view.entry) ? [...table, view.entry] : table
    for (const e of all) {
      if (e.mode === 'burst') stepBurst(e)
      else if (e.mode === 'fly') {
        e.t = Math.min(1, e.t + 1 / e.frames)
        if (e.t >= 1) e.landed?.()
      } else if (e.mode === 'rest' && !e.flipping) {
        e.pose.tx += (e.aim.tx - e.pose.tx) * 0.6
        e.pose.ty += (e.aim.ty - e.pose.ty) * 0.6
        e.pose.up += (e.aim.up - e.pose.up) * 0.6
      }
      if (!e.card.el.hidden) e.card.step(frame)
    }
    return false // the cards are HTML: nothing in the scene to redraw
  })
  // the slabs behind the pack under the pointer come alive
  stepped.every(1, (frame) => {
    if (mode !== 'case' || !hovered) return false
    for (const slab of hovered.slabs) drawSlab(slab, frame)
    return 'looks'
  })
  // foil follows the pointer
  let shine = 0.5
  stepped.every(1, () => {
    if (mode === 'closed') return false
    let changed = false
    for (const sheen of sheens) {
      const to = shine * 1.6 + sheen.phase
      if (Math.abs(sheen.map.offset.x - to) < 0.003) continue
      sheen.map.offset.x += (to - sheen.map.offset.x) * 0.5
      changed = true
    }
    return changed && 'looks'
  })
  // the sign sways a little on its strings
  stepped.every(2, (frame) => {
    if (mode !== 'case' || !signHang.visible) return false
    signHang.rotation.z = Math.sin(frame * 0.17) * 0.025
    return 'looks'
  })
  boil(stepped, boiling, () => mode === 'case' || mode === 'counter')

  // ---- the room's states -------------------------------------------------------------------
  let mode = 'closed' // 'opening' | 'case' | 'picking' | 'counter' | 'returning' | 'closing'
  let phase = 'idle' // at the counter: 'ready' | 'ripping' | 'burst' | 'done' | 'filing'
  let current = null // the pack out on the counter
  let hovered = null // the pack under the pointer
  let binderOpen = false
  let acting = false
  let lastSet = null
  const rip = { progress: 0, shown: 0, done: false, sounded: 0 }

  function setLamp(lamp, k) {
    lamp.tube.material.map = k > 0.2 ? lightOn : lightOff
    lamp.beam.material.opacity = k * lamp.level * BEAM
    lamp.beam.visible = k > 0.001
  }
  const lightsTo = (on) =>
    Promise.all(lamps.map((lamp, i) => stepped.poses(on ? [0.3, 0, 0.8, 0.45, 1] : [0.4, 0], (k) => setLamp(lamp, k), { delay: on ? 2 + i * 2 : 0 })))

  function dropIn(pack, delay = 0) {
    pack.group.scale.setScalar(1)
    for (const slab of pack.slabs) slab.holder.scale.setScalar(1)
    return stepped
      .poses([0.6, 0.32, 0.1, -0.025, 0.012, 0], (dy) => {
        pack.group.position.y = pack.home.y + dy
        for (const slab of pack.slabs) slab.holder.position.y = stepTop(pack.i) + 0.11 + dy * 1.3
      }, { delay })
      .then(() => (pack.standing = true))
  }

  function liftTo(pack, poses) {
    const mine = ++pack.lifting
    return stepped.poses(poses, (y) => mine === pack.lifting && (pack.lift.position.y = y))
  }
  function hover(pack, on) {
    if (mode !== 'case' || acting) return
    if (on) {
      if (hovered && hovered !== pack) hover(hovered, false)
      hovered = pack
      liftTo(pack, [0.05, 0.1, 0.13, 0.12])
      slabClips(pack, true)
    } else if (hovered === pack) {
      hovered = null
      liftTo(pack, [0.06, 0.01, 0])
      slabClips(pack, false)
      for (const slab of pack.slabs) drawSlab(slab, 0)
    }
  }

  // a lost set will not come out: it rocks on its stand
  let hintTimer = 0
  function refuse(pack) {
    sound.play('crinkle')
    stepped.poses([0.06, -0.06, 0.04, -0.03, 0.015, 0], (a) => (pack.lift.rotation.z = a))
    overlay.say(`${pack.set.name}: ${pack.set.sealed}`)
    hint(pack.set.sealed)
    ui.hidden = false
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => mode === 'case' && hint(''), 2600)
  }

  // ---- picking a pack: out of the case and onto the counter ---------------------------------
  async function pick(pack) {
    if (mode !== 'case' || acting) return
    if (sealed(pack.set)) return refuse(pack)
    acting = true
    mode = 'picking'
    clearTimeout(hintTimer)
    hint('')
    if (hovered) slabClips(hovered, false)
    hovered = null
    pack.lifting++
    overlay.update()
    sound.play('crinkle')
    current = pack
    phase = 'ready'
    Object.assign(rip, { progress: 0, shown: 0, done: false, sounded: 0 })
    relayout()
    arrange(pack.set)
    const from = pack.group.position.clone()
    const fromLean = pack.lean.rotation.x
    const fromLift = pack.lift.position.y
    dimTo(0.55)
    setBack(words.toCase)
    const moving = look(counterRect, { lift: COUNTER_LIFT, duration: 1.15 })
    // up off its stand, out through the front of the case, turning over once, down onto the mat
    await stepped.poses([0.06, 0.16, 0.29, 0.43, 0.57, 0.7, 0.82, 0.91, 0.97, 1], (t) => {
      pack.group.position.lerpVectors(from, layout.pack, t)
      pack.group.position.y += Math.sin(Math.PI * t) * 0.55
      pack.group.rotation.y = t * Math.PI * 2
      pack.lift.position.y = fromLift * (1 - t)
      pack.lean.rotation.x = lerp(fromLean, -layout.phi, t)
    })
    pack.group.rotation.y = 0
    await stepped.poses([0.03, -0.008, 0], (dy) => (pack.lift.position.y = dy))
    await moving
    mode = 'counter'
    acting = false
    ui.hidden = false
    hint(words.rip)
    overlay.update()
    ripSpot.node.focus({ preventScroll: true })
  }

  // put an unopened pack back on its stand
  async function putBack(pack) {
    const from = pack.group.position.clone()
    const fromLean = pack.lean.rotation.x
    hint('')
    dimTo(0)
    const moving = look(null, { duration: 1.1 })
    await stepped.poses([0.08, 0.2, 0.36, 0.52, 0.68, 0.82, 0.93, 1], (t) => {
      pack.group.position.lerpVectors(from, pack.home, t)
      pack.group.position.y += Math.sin(Math.PI * t) * 0.45
      pack.lean.rotation.x = lerp(fromLean, LEAN, t)
    })
    resetPack(pack)
    await moving
  }

  // a fresh pack, as it was before it was opened
  function resetPack(pack) {
    pack.group.position.copy(pack.home)
    pack.group.rotation.set(0, 0, 0)
    pack.lift.position.set(0, 0, 0)
    pack.lift.rotation.set(0, 0, 0)
    pack.lean.rotation.set(LEAN, 0, 0)
    pack.lean.scale.set(1, 1, 1)
    pack.lean.visible = true
    pack.strip.visible = true
    pack.strip.position.set(0, pack.h * tear, 0)
    pack.strip.rotation.set(0, 0, 0)
    for (const seg of pack.segs) {
      seg.rotation.set(0, 0, 0)
      seg.userData.peeled = false
    }
    pack.ball.visible = false
  }

  // ---- ripping it open ---------------------------------------------------------------------
  const ripSpot = overlay.addSpot({
    group: box.id,
    label: words.rip,
    corners: () => (current || packs[0]).corners(),
    visible: () => mode === 'counter' && (phase === 'ready' || phase === 'ripping') && !binderOpen && !acting,
    onClick() {
      if (dragged) return
      ripAll()
    },
  })
  ripSpot.node.classList.add('rip-spot')
  let tearing = null
  let dragged = false
  ripSpot.node.addEventListener('pointerdown', (e) => {
    if ((phase !== 'ready' && phase !== 'ripping') || stepped.reduced) return
    tearing = { last: e.clientX, width: ripSpot.node.getBoundingClientRect().width || 1, moved: false }
    ripSpot.node.setPointerCapture?.(e.pointerId)
  })
  ripSpot.node.addEventListener('pointermove', (e) => {
    if (!tearing || rip.done) return
    const d = Math.abs(e.clientX - tearing.last) / tearing.width
    tearing.last = e.clientX
    if (d <= 0) return
    if (!tearing.moved) {
      tearing.moved = true
      sound.play('crinkle')
    }
    rip.progress = Math.min(1, rip.progress + d * 1.2)
    if (Math.floor(rip.progress * 4) > rip.sounded) {
      rip.sounded++
      sound.play('crinkle')
    }
  })
  const stopTearing = () => {
    if (tearing?.moved) {
      dragged = true
      setTimeout(() => (dragged = false))
    }
    tearing = null
  }
  ripSpot.node.addEventListener('pointerup', stopTearing)
  ripSpot.node.addEventListener('pointercancel', stopTearing)

  function ripAll() {
    if (phase !== 'ready' && phase !== 'ripping') return
    rip.progress = 1
    if (stepped.reduced) finishRip()
  }
  // the strip tears along the line, a piece at a time, as far as it has been dragged
  stepped.every(1, () => {
    if (!current || (phase !== 'ready' && phase !== 'ripping') || rip.shown >= rip.progress) return false
    phase = 'ripping'
    rip.shown = Math.min(rip.progress, rip.shown + 0.2)
    current.segs.forEach((seg, k) => {
      if (seg.userData.peeled || (k + 1) / current.segs.length > rip.shown + 1e-6) return
      seg.userData.peeled = true
      stepped.poses([-0.4, -0.9, -1.25 - (k % 2) * 0.12], (a) => (seg.rotation.x = a))
    })
    if (rip.shown >= 1) finishRip()
  })

  async function finishRip() {
    if (rip.done || !current) return
    rip.done = true
    phase = 'burst'
    hint('')
    overlay.update()
    sound.play('tear')
    const pack = current
    if (stepped.reduced) pack.strip.visible = false
    else
      await stepped
        .poses([[0.04, 0.06, -0.25], [0.12, 0.16, -0.7], [0.24, 0.24, -1.2], [0.38, 0.26, -1.8], [0.52, 0.18, -2.4], [0.64, 0.04, -3]], ([x, y, rz]) => {
          pack.strip.position.set(x, pack.h * tear + y, 0.02)
          pack.strip.rotation.z = rz
        })
        .then(() => (pack.strip.visible = false))
    await burst(pack)
  }

  // ---- the burst ---------------------------------------------------------------------------
  async function burst(pack) {
    const set = pack.set
    const cards = cardsOf(set)
    const chase = chaseOf(cards)
    const order = [...cards.filter((s) => s !== chase), chase]
    const slots = arrange(set)
    collect(order.map((s) => s.slug))
    lastSet = set
    pack.lean.updateWorldMatrix(true, false)
    // the mouth of the pack, in the room
    const mouth = room.worldToLocal(pack.lean.localToWorld(new V3(0, pack.h * tear, 0.02)))
    const entries = order.map((s, i) => makeEntry(s, set, slots[i], { chase: s === chase }))
    table.push(...entries)
    entries.forEach((e, i) => (e.card.el.style.zIndex = String(10 + i)))
    const chaseEntry = entries[entries.length - 1]

    if (stepped.reduced) {
      // no burst: the cards are simply there, laid out, and fade in
      for (const e of entries) {
        e.card.load()
        restAt(e)
        e.card.el.hidden = false
        e.card.el.classList.add('is-arriving')
      }
      placeCards()
      requestAnimationFrame(() => entries.forEach((e) => e.card.el.classList.remove('is-arriving')))
      pack.lean.visible = false
      pack.ball.position.copy(layout.ball)
      pack.ball.rotation.set(-layout.phi, 0, 0)
      pack.ball.visible = true
      return dealt(entries)
    }

    entries.forEach((e, i) => {
      e.pose.p.copy(mouth)
      e.pose.rx = e.rx0 = -layout.phi
      e.pose.ry = e.chase ? Math.PI : 0
      e.pose.rz = 0
      e.pose.s = 0.82
      e.v.subVectors(e.slot.p, mouth).multiplyScalar(1.25).add(new V3(0, 3.1, 0))
      e.vrz = (rand() - 0.5) * 6
      e.dist0 = Math.max(0.05, mouth.distanceTo(e.slot.p))
      e.wait = i * 2 + (e.chase ? 4 : 0)
      e.mode = 'burst'
      if (e.chase) e.card.el.classList.add('is-glow')
    })
    // the wrapper crumples once the last card is out
    await new Promise((done) => (chaseEntry.onLaunch = done))
    const landing = new Promise((done) => (chaseEntry.onRest = done))
    await stepped.wait(1)
    crumple(pack)
    await landing
    await stepped.wait(9)
    await flipChase(chaseEntry)
    dealt(entries)
  }

  // everything is out: the cards can be opened, and another pack picked
  function dealt(entries) {
    phase = 'done'
    for (const e of entries) ready(e)
    another.hidden = false
    hint('')
    overlay.say(`${current.set.name}: ${entries.map((e) => e.s.title).join(', ')}`)
    overlay.update()
    another.focus({ preventScroll: true })
  }

  async function crumple(pack) {
    await stepped.poses([[0.94, 0.9, 0.05], [0.8, 0.72, -0.08], [0.62, 0.52, 0.14], [0.42, 0.36, -0.1]], ([sx, sy, rz]) => {
      pack.lean.scale.set(sx, sy, 1)
      pack.lean.rotation.z = rz
    })
    pack.lean.updateWorldMatrix(true, false)
    const from = room.worldToLocal(pack.lean.localToWorld(new V3(0, pack.h * 0.2, 0)))
    pack.lean.visible = false
    const ball = pack.ball
    ball.rotation.set(-layout.phi, 0, 0)
    ball.visible = true
    await stepped.poses([0.12, 0.28, 0.46, 0.64, 0.8, 0.92, 1], (t) => {
      ball.position.lerpVectors(from, layout.ball, t)
      ball.position.y += Math.sin(Math.PI * t) * 0.32
      ball.rotation.z = -t * 5
    })
  }

  // the chase card turns itself over, with a shimmer across the foil
  async function flipChase(e) {
    e.flipping = true
    e.card.el.classList.remove('is-glow')
    e.card.el.classList.add('is-sweep')
    sparkle(e.card.el)
    sound.play('sparkle')
    const y = e.pose.p.y
    await stepped.poses([[2.7, 0.06], [2.1, 0.14], [1.6, 0.18], [1.05, 0.15], [0.5, 0.08], [0, 0]], ([ry, dy]) => {
      e.pose.ry = ry
      e.pose.p.y = y + dy
    })
    e.flipping = false
    setTimeout(() => e.card.el.classList.remove('is-sweep'), 1000)
  }
  function sparkle(el) {
    for (let i = 0; i < 9; i++) {
      const spark = document.createElement('span')
      spark.className = 'tcard-spark'
      const edge = i % 4
      const along = 8 + rand() * 84
      spark.style.left = `${edge === 0 ? -6 : edge === 1 ? 102 : along}%`
      spark.style.top = `${edge === 2 ? -5 : edge === 3 ? 101 : along}%`
      spark.style.animationDelay = `${Math.floor(rand() * 4) * 0.083}s`
      el.append(spark)
      setTimeout(() => spark.remove(), 1100)
    }
  }

  // ---- back to the case: the cards go into the binder ----------------------------------------
  async function backToCase() {
    if (mode !== 'counter' || acting || view) return
    if (phase === 'burst' || phase === 'filing') return
    acting = true
    const pack = current
    if (phase === 'done') {
      phase = 'filing'
      another.hidden = true
      hint('')
      overlay.update()
      const list = [...table]
      await Promise.all(
        list.map((e, i) =>
          stepped
            .wait(i)
            .then(() => {
              e.card.el.tabIndex = -1
              return fly(e, binderQuad, 7)
            })
            .then(() => {
              e.card.el.hidden = true
              sound.play('snap')
              hopBinder()
            }),
        ),
      )
      for (const e of list) e.card.destroy()
      table.length = 0
      overlay.say(words.filed)
      pack.ball.visible = false
      dimTo(0)
      const moving = look(null, { duration: 1.1 })
      resetPack(pack)
      pack.group.scale.setScalar(1e-4)
      await moving
      await dropIn(pack)
    } else {
      await putBack(pack)
    }
    mode = 'case'
    phase = 'idle'
    current = null
    acting = false
    ui.hidden = true
    setBack(site.ui.toShelf)
    overlay.update()
    pack.spot.node.focus({ preventScroll: true })
  }

  let hopping = 0
  function hopBinder() {
    const mine = ++hopping
    stepped.poses([0.05, 0.02, 0], (y) => mine === hopping && (binderHinge.position.y = y))
  }

  // ---- the binder ----------------------------------------------------------------------------
  function updateCount() {
    const text = words.collected(sketches.filter((s) => collected.has(s.slug)).length, sketches.length)
    const old = countMesh.material.map
    countMesh.material.map = liveTexture(drawn.tape(text, 3, { width: 640, height: 140 }))
    old?.dispose()
    binderSpot.node.setAttribute('aria-label', `${words.binder}: ${text}`)
    redraw()
  }
  function collect(slugs) {
    let added = false
    for (const slug of slugs) {
      if (collected.has(slug)) continue
      collected.add(slug)
      added = true
    }
    if (!added) return
    saveCollection(collected)
    binder.set(collected)
    updateCount()
  }
  function everything() {
    collect(sketches.map((s) => s.slug))
    binder.show(binder.page)
    binder.el.querySelectorAll('.sleeve.is-filled').forEach((sleeve, i) => {
      sleeve.style.animationDelay = `${(i * 0.083).toFixed(3)}s`
      sleeve.classList.add('is-arriving')
    })
    sound.play('snap')
  }
  function openBinder() {
    if (binderOpen || acting || view) return
    binderOpen = true
    binder.set(collected)
    binder.show(lastSet?.id, { turn: false })
    binder.el.hidden = false
    document.body.classList.add('binder-open')
    sound.play('snap')
    hopBinder()
    overlay.update()
    binder.el.querySelector('#binder-title').focus({ preventScroll: true })
  }
  function closeBinder(quiet = false) {
    if (!binderOpen) return
    binderOpen = false
    binder.el.hidden = true
    document.body.classList.remove('binder-open')
    overlay.update()
    if (!quiet) binderSpot.node.focus({ preventScroll: true })
  }
  const binderSpot = overlay.addSpot({
    group: box.id,
    label: words.binder,
    corners: () => binderCorners(1),
    visible: () => tray.visible && !binderOpen && !view && (mode === 'case' || (mode === 'counter' && (phase === 'ready' || phase === 'done'))),
    onClick: openBinder,
  })

  // ---- holding a card up big ---------------------------------------------------------------
  function layoutView() {
    sizeCards()
  }
  async function show(slug) {
    const s = sketches.find((x) => x.slug === slug)
    const set = SETS.find((x) => x.id === s.set)
    relayout()
    let entry = table.find((e) => e.s === s && e.mode === 'rest')
    let from = 'counter'
    if (!entry) {
      const rect = binderOpen ? binder.sleeveRect(slug) : null
      from = rect ? 'binder' : 'away'
      entry = makeEntry(s, set, null, { chase: chaseOf(cardsOf(set)) === s })
      entry.quad = rect ? rectQuad(rect) : awayQuad()
      entry.card.el.hidden = false
    }
    collect([slug])
    view = { entry, from, ry: 0, flipped: false, turning: false }
    lastView = { slug, from, entry }
    entry.aim.tx = entry.aim.ty = entry.aim.up = 0
    entry.pose.tx = entry.pose.ty = entry.pose.up = 0
    layer.classList.add('is-up')
    cardView.set(s, from)
    layoutView()
    cardView.el.hidden = false
    cardView.el.setAttribute('aria-label', s.title)
    const el = entry.card.el
    el.classList.add('is-big')
    el.style.zIndex = '60'
    el.tabIndex = -1
    el.removeAttribute('role')
    entry.card.about()
    entry.card.load()
    entry.card.setPaused(false)
    if (entry.card.video) entry.card.video.muted = !sound.on
    for (const other of table) if (other !== entry) other.card.setPaused(true)
    sound.play('flick')
    await fly(entry, () => rectQuad(bigRect(), view?.ry || 0), 8)
    entry.mode = 'big'
    cardView.focus()
  }
  async function hide() {
    if (!view) return
    const { entry, from } = view
    if (view.flipped || view.turning) {
      view.ry = 0
      view.flipped = false
    }
    cardView.el.hidden = true
    if (entry.card.video) entry.card.video.muted = true
    const sleeve = from === 'binder' && binder.sleeveRect(entry.s.slug)
    const to = from === 'counter' ? () => cardQuad(entry.pose) : sleeve ? () => rectQuad(sleeve) : awayQuad
    await fly(entry, to, 7)
    entry.card.el.classList.remove('is-big')
    entry.card.el.style.zIndex = ''
    layer.classList.remove('is-up')
    if (from === 'counter') {
      entry.mode = 'rest'
      entry.card.el.style.zIndex = String(10 + table.indexOf(entry))
      ready(entry)
    } else entry.card.destroy()
    for (const other of table) other.card.setPaused(false)
    view = null
  }
  async function flipBig(to) {
    if (!view || view.turning || view.entry.mode !== 'big') return
    const flipped = to ?? !view.flipped
    view.turning = true
    const from = view.ry
    const target = flipped ? Math.PI : 0
    sound.play('flick')
    await stepped.poses([0.12, 0.3, 0.5, 0.7, 0.86, 1].map((k) => lerp(from, target, k)), (ry) => view && (view.ry = ry))
    if (!view) return
    view.flipped = flipped
    view.turning = false
    view.entry.card.setPaused(flipped)
    cardView.flipped(flipped)
  }
  sound.listen((on) => {
    const video = view?.entry.card.video
    if (video) video.muted = !on
  })
  // the first press in the room wakes the audio, before the click it belongs to does anything
  const warmSound = () => mode !== 'closed' && sound.warm()
  addEventListener('pointerdown', warmSound, true)
  addEventListener('keydown', warmSound, true)

  // ---- the buttons over the packs in the case --------------------------------------------------
  const zone = (pack) => {
    const c = [new V3(), new V3(), new V3(), new V3()]
    return () => {
      const x0 = stepX(pack.i) - stepW / 2 + 0.02
      const x1 = stepX(pack.i) + stepW / 2 - 0.02
      const y0 = stepTop(pack.i)
      const y1 = y0 + pack.h + 0.2
      const z = pack.home.z
      c[0].set(x0, y0, z)
      c[1].set(x1, y0, z)
      c[2].set(x0, y1, z)
      c[3].set(x1, y1, z)
      for (const p of c) room.localToWorld(p)
      return c
    }
  }
  for (const pack of packs) {
    pack.spot = overlay.addSpot({
      group: box.id,
      label: sealed(pack.set) ? `${pack.set.name}: ${pack.set.sealed}` : pack.label,
      corners: zone(pack),
      visible: () => mode === 'case' && !binderOpen && pack.standing,
      onHover: (on) => hover(pack, on),
      onClick: () => pick(pack),
    })
  }

  relayout()
  updateCount()
  binder.set(collected)
  // draw the cards' faces and their back now, not the moment the first pack is opened
  backUrl()
  for (const set of SETS) {
    if (sealed(set)) continue
    frameUrl(set, set.finish)
    if (set.chaseFinish) frameUrl(set, set.chaseFinish)
  }

  const bySlug = (slug) => sketches.find((s) => s.slug === slug)
  const boxLabel = box.tapes[0]

  return {
    async open() {
      mode = 'opening'
      dimmer.visible = false
      relayout()
      layer.hidden = false
      if (boxLabel) boxLabel.visible = false // the counter pulls out right where it is stuck on
      setBack(site.ui.toShelf)
      // the cellophane slides up
      const front = box.front
      if (front) {
        placeClip(front)
        await stepped.poses([0.06, 0.18, 0.38, 0.62, 0.85, 1.02], (k) => (front.mesh.position.y = front.y + k * front.height))
        front.mesh.visible = false
        front.mesh.position.y = front.y
      }
      // the counter pulls out, the lights come on bottom to top, the packs come in
      tray.visible = true
      binderHinge.rotation.x = -1.2
      signHang.visible = true
      hangSign(0.08)
      await Promise.all([
        stepped
          .poses([-1.3, -0.95, -0.6, -0.3, -0.08, 0.03, 0].map((k) => k * TRAY_D), (z) => (tray.position.z = z))
          .then(() => stepped.poses([-0.9, -0.5, -0.15, 0.08, -0.03, 0], (a) => (binderHinge.rotation.x = a))),
        lightsTo(true),
        ...packs.filter((pack) => !pack.standing).map((pack) => dropIn(pack, 3 + pack.i * 2)),
        stepped.poses([0.3, 0.7, 1.08, 0.96, 1.02, 1], hangSign, { delay: 6 }),
      ])
      mode = 'case'
      overlay.update()
    },
    async close() {
      mode = 'closing'
      clearTimeout(hintTimer)
      closeBinder(true)
      if (view) {
        view.entry.card.el.classList.remove('is-big')
        if (!table.includes(view.entry)) view.entry.card.destroy()
        view = null
        cardView.el.hidden = true
        layer.classList.remove('is-up')
      }
      for (const e of table) e.card.destroy()
      table.length = 0
      if (current) {
        resetPack(current)
        current = null
      }
      if (hovered) {
        slabClips(hovered, false)
        hovered.lift.position.y = 0
        hovered = null
      }
      phase = 'idle'
      acting = false
      ui.hidden = true
      hint('')
      another.hidden = true
      layer.hidden = true
      dimmer.visible = false
      dimmer.material.opacity = 0
      dimming++
      await Promise.all([
        lightsTo(false),
        stepped.poses([-0.08, -0.35, -0.7, -1.05, -1.3].map((k) => k * TRAY_D), (z) => (tray.position.z = z)).then(() => (tray.visible = false)),
        stepped.poses([0.7, 0.3, 0.08], hangSign).then(() => (signHang.visible = false)),
      ])
      const front = box.front
      if (front) {
        placeClip(front)
        front.mesh.visible = true
        await stepped.poses([0.85, 0.62, 0.38, 0.18, 0.06, 0], (k) => (front.mesh.position.y = front.y + k * front.height))
        front.clip.set(new V3(0, -1, 0), 1e5) // clips nothing again
      }
      if (boxLabel) boxLabel.visible = true
      mode = 'closed'
    },

    title: (slug) => bySlug(slug)?.title || '',
    spot: () => null,
    view: () => counterRect(),
    // a card is held up over the scene; the camera stays where it is
    show,
    hide,
    end() {
      const last = lastView
      lastView = null
      if (mode === 'counter') setBack(words.toCase)
      if (!last) return
      if (last.from === 'counter' && table.includes(last.entry)) last.entry.card.el.focus({ preventScroll: true })
      else if (last.from === 'binder') binder.focusSleeve(last.slug)
    },
    // Escape, or the tape button: close the binder, or step back from the counter
    escape() {
      if (binderOpen) {
        closeBinder()
        return true
      }
      if (mode === 'counter' || mode === 'picking') {
        backToCase()
        return true
      }
      return false
    },
    pointer(fx) {
      shine = fx
    },
    // every frame: the cards follow the camera (they are HTML over the scene)
    frame() {
      if (!table.length && !view) return false
      relayout()
      placeCards()
      return false
    },
  }

  // the cellophane is cut off where it slides up into the top of the case
  function placeClip(front) {
    box.body.updateWorldMatrix(true, false)
    const m = box.body.matrixWorld
    front.clip.setFromNormalAndCoplanarPoint(new V3(0, -1, 0).transformDirection(m), new V3(0, front.top, 0).applyMatrix4(m))
  }
}
