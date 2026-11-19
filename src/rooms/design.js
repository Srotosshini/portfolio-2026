// Design: the Christmas market.
// A tiny snowy street at night. Each design project is a wooden stall, decked
// out for what it sells; string lights zig-zag between them, snow falls (and
// shies away from the pointer), the tree glows at the far end. Hover a stall
// and it leans out, its lights brighten and its door opens a crack. Click it
// and its door swings open, its front folds down like a dollhouse's, and the
// camera steps inside, where everything is about that one project.
import * as THREE from 'three'
import { stalls, words } from '../data/design.js'
import { site } from '../data/projects.js'
import { PALETTE as P, makeFlat, texture, paperMaterial, prepCutout, softShadow, boil, rng } from '../lib/paper.js'
import * as drawn from '../lib/market.js'
import { cellophane } from '../lib/placeholders.js'
import { art, has, loadImage, turn, base } from '../lib/assets.js'
import { sound } from '../lib/sound.js'
import { isTodo } from '../lib/pages.js'
import { makeMarketUI, urlFor } from '../lib/market-ui.js'

const W = 1.0 // a stall's width
const WALL = 0.58 // its walls, up to the eaves
const GABLE = 0.34 // the gable above them
const DEPTH = 0.82
const T = 0.025 // how thick its boards are
const OVER = 0.07 // how far the roof overhangs
const FRONT = -0.6 // where the stalls' fronts stand
const DOOR = { x: -0.24, w: 0.25, h: 0.42 }
const WIN = { x: 0.2, y: 0.2, w: 0.32, h: 0.22 }
const NIGHT = 0.42 // how far the lights go down in the market
const INSIDE = 0.16 // and inside a stall
const V3 = THREE.Vector3

export async function build({ box, stepped, overlay, redraw, goTo, lights, camera }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)
  const rand = rng(1225)
  const lerp = THREE.MathUtils.lerp
  const n = stalls.length
  const spacing = Math.min(1.16, (inner.w - 0.2) / n)
  const stallX = (i) => (i - (n - 1) / 2) * spacing
  const boiling = []
  const ui = makeMarketUI({ reduced: () => stepped.reduced })

  // a flat that glows (the moon, a lit window): not dimmed by the room's lights
  const glowing = (preps, size) => {
    const flat = makeFlat(preps, size)
    flat.mesh.material = new THREE.MeshBasicMaterial({ map: flat.mesh.material.map, alphaTest: 0.5, side: THREE.DoubleSide })
    flat.mesh.castShadow = false
    return flat
  }
  const once = (source, opts) => [prepCutout(source, opts)]
  // a flat standing on the floor (its bottom edge at y)
  const stand = (flat, x, y, z) => {
    flat.mesh.position.set(x, y + flat.height / 2, z)
    return flat
  }
  const cornersOf = (mesh, w, h) => {
    const c = [new V3(), new V3(), new V3(), new V3()]
    return () => {
      c[0].set(-w / 2, -h / 2, 0)
      c[1].set(w / 2, -h / 2, 0)
      c[2].set(-w / 2, h / 2, 0)
      c[3].set(w / 2, h / 2, 0)
      for (const p of c) mesh.localToWorld(p)
      return c
    }
  }
  const v = new V3()
  const toScreen = (object, local) => {
    v.copy(local)
    object.localToWorld(v)
    v.project(camera)
    return { x: (v.x + 1) * 0.5 * innerWidth, y: (1 - v.y) * 0.5 * innerHeight }
  }
  const words2 = (s) => (!s ? null : !isTodo(s) ? { text: s, todo: false } : site.placeholders ? { text: s.replace(/^TODO:\s*/, ''), todo: true } : null)

  // ---- the sky, the street, the snow piled along it ------------------------------------
  // (the sky is not lit by the lamp: it is night, evenly, all the way across)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(inner.w, inner.h), new THREE.MeshBasicMaterial({ map: texture(drawn.sky()), color: '#c9cde0' }))
  sky.position.set(0, inner.h / 2, inner.back + 0.004)
  room.add(sky)
  const [moonArt, starArt] = await Promise.all([
    art('drawings/market-moon', (seed) => drawn.moon(seed), { tracings: 1 }),
    art('drawings/market-star', (seed) => drawn.skyStar(seed), { tracings: 1 }),
  ])
  const moon = glowing(moonArt, { width: 0.34 })
  moon.mesh.position.set(inner.w / 2 - 0.62, inner.h - 0.42, inner.back + 0.03)
  room.add(moon.mesh)
  const stars = []
  for (let i = 0; i < 12; i++) {
    const s = glowing(starArt, { width: 0.05 + rand() * 0.05 })
    s.mesh.position.set(-inner.w / 2 + 0.2 + rand() * (inner.w - 0.4), WALL + GABLE + 0.25 + rand() * (inner.h - WALL - GABLE - 0.4), inner.back + 0.02)
    s.mesh.rotation.z = rand() * 1.2
    room.add(s.mesh)
    stars.push(s)
  }

  await turn()
  const street = new THREE.Mesh(new THREE.PlaneGeometry(inner.w, -FRONT), new THREE.MeshLambertMaterial({ map: texture(drawn.cobbles()) }))
  street.rotation.x = -Math.PI / 2
  street.position.set(0, 0.003, FRONT / 2)
  street.receiveShadow = true
  room.add(street)
  const drift = (width, height, x, z, seed) => {
    const d = makeFlat(once(drawn.snowDrift(Math.round(width * 360), seed), { edge: 0 }), { width })
    d.mesh.scale.y = height / d.height
    d.mesh.position.set(x, height / 2, z)
    d.mesh.castShadow = false
    room.add(d.mesh)
    return d
  }
  drift(inner.w, 0.1, 0, -0.03, 1) // along the front of the street
  for (let i = 0; i < n; i++) {
    drift(0.34, 0.05, stallX(i) - 0.3, FRONT + 0.03, 10 + i)
    drift(0.3, 0.045, stallX(i) + 0.32, FRONT + 0.03, 20 + i)
  }

  // ---- the stalls -----------------------------------------------------------------------
  const wallMap = texture(drawn.wood('wall'))
  wallMap.wrapS = wallMap.wrapT = THREE.RepeatWrapping
  wallMap.repeat.set(2, 1.2)
  const roofMap = texture(drawn.wood('roof'))
  roofMap.wrapS = roofMap.wrapT = THREE.RepeatWrapping
  roofMap.repeat.set(1.4, 1.6)
  const plankMap = texture(drawn.wood('planks'))
  plankMap.wrapS = plankMap.wrapT = THREE.RepeatWrapping
  plankMap.repeat.set(1.6, 1.2)
  const outside = new THREE.MeshLambertMaterial({ map: wallMap })
  const insideWall = new THREE.MeshLambertMaterial({ map: plankMap })
  const shingles = new THREE.MeshLambertMaterial({ map: roofMap })
  const snowLook = new THREE.MeshLambertMaterial({ color: '#f4f7ff' })
  const glowLook = new THREE.MeshBasicMaterial({ color: '#ffcf73' })
  const doorBack = new THREE.MeshLambertMaterial({ color: '#6b4226' })

  const slab = (parent, sx, sy, sz, x, y, z, faces) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), faces)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  async function makeStall(s, i) {
    await turn()
    const group = new THREE.Group() // where it stands
    group.position.set(stallX(i), 0, FRONT)
    room.add(group)
    const lean = new THREE.Group() // it leans out toward you
    group.add(lean)

    // walls (wood outside, pale boards inside), the floor, the back gable
    const sideIn = (face) => {
      const faces = Array(6).fill(outside)
      faces[face] = insideWall
      return faces
    }
    slab(lean, T, WALL, DEPTH, -W / 2 + T / 2, WALL / 2, -DEPTH / 2, sideIn(0))
    slab(lean, T, WALL, DEPTH, W / 2 - T / 2, WALL / 2, -DEPTH / 2, sideIn(1))
    slab(lean, W, WALL, T, 0, WALL / 2, -DEPTH + T / 2, sideIn(4))
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - T * 2, DEPTH - T), insideWall)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0.004, -DEPTH / 2)
    floor.receiveShadow = true
    lean.add(floor)
    const gable = new THREE.BufferGeometry()
    gable.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, GABLE, 0], 3))
    gable.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
    gable.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 0.6], 2))
    const backGable = new THREE.Mesh(gable, new THREE.MeshLambertMaterial({ map: plankMap, side: THREE.DoubleSide }))
    backGable.position.set(0, WALL, -DEPTH + T)
    lean.add(backGable)

    // the roof: two slopes of shingles (boards underneath), snow on top, icicles at the front
    const run = W / 2 + OVER
    const rise = GABLE + 0.04
    const len = Math.hypot(run, rise)
    const angle = Math.atan2(rise, run)
    const roofFaces = [outside, outside, shingles, insideWall, outside, outside]
    for (const side of [-1, 1]) {
      const pitch = new THREE.Group()
      pitch.position.set((side * run) / 2, WALL - 0.04 + rise / 2, -DEPTH / 2 + 0.035)
      pitch.rotation.z = -side * angle
      lean.add(pitch)
      const roof = slab(pitch, len, 0.03, DEPTH + 0.13, 0, 0, 0, roofFaces)
      roof.castShadow = false // (so the inside stays lit when the front is folded down)
      const snow = new THREE.Mesh(new THREE.BoxGeometry(len * 0.98, 0.035, DEPTH + 0.12), snowLook)
      snow.position.y = 0.03
      snow.receiveShadow = true
      pitch.add(snow)
      const cap = makeFlat(once(drawn.roofSnow(Math.round(len * 520), i * 2 + side + 5), { edge: 0 }), { width: len * 1.02 })
      cap.mesh.position.set(0, 0.025, (DEPTH + 0.13) / 2 + 0.004)
      cap.mesh.castShadow = false
      pitch.add(cap.mesh)
    }

    // the front: a hinged piece with the door, the lit window, the sign and the decorations
    const front = new THREE.Group()
    lean.add(front)
    const [frontPrep] = await art(
      `drawings/stall-${s.slug}`,
      (seed) => drawn.facade({ w: W, wall: WALL, gable: GABLE, door: DOOR, win: WIN, trim: s.trimColour, seed: seed + i }),
      { edge: 0, trim: false, tracings: 1 },
    )
    const faceGeometry = new THREE.PlaneGeometry(W, WALL + GABLE).translate(0, (WALL + GABLE) / 2, 0)
    const face = new THREE.Mesh(faceGeometry, paperMaterial(texture(frontPrep.front)))
    const faceBack = new THREE.Mesh(faceGeometry, paperMaterial(texture(frontPrep.back), THREE.BackSide))
    face.castShadow = face.receiveShadow = true
    face.position.z = faceBack.position.z = 0.002
    front.add(face, faceBack)

    const doorHinge = new THREE.Group()
    doorHinge.position.set(DOOR.x - DOOR.w / 2, 0, -0.004)
    front.add(doorHinge)
    const doorGeometry = new THREE.PlaneGeometry(DOOR.w, DOOR.h).translate(DOOR.w / 2, DOOR.h / 2, 0)
    const doorFace = new THREE.Mesh(doorGeometry, new THREE.MeshLambertMaterial({ map: texture(drawn.door(DOOR.w, DOOR.h, s.trimColour, i + 1)) }))
    const doorRear = new THREE.Mesh(doorGeometry, doorBack)
    doorRear.rotation.y = Math.PI
    doorRear.position.x = DOOR.w
    doorFace.castShadow = true
    doorHinge.add(doorFace, doorRear)
    // warm light behind the door, seen when it opens
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.w, DOOR.h), glowLook)
    warm.position.set(DOOR.x, DOOR.h / 2, -0.06)
    front.add(warm)

    // what is in the window (her pieces, if she has them, else a stand-in)
    const previews = (s.windowPreview.length ? s.windowPreview : s.items.map((item) => item.image)).filter(has).slice(0, 3)
    const pictures = (await Promise.all(previews.map((src) => loadImage(src).catch(() => null)))).filter(Boolean)
    const windowLook = new THREE.MeshBasicMaterial({ map: texture(drawn.windowScene(s.interiorType, s.trimColour, i + 1, pictures)) })
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), windowLook)
    pane.position.set(WIN.x, WIN.y + WIN.h / 2, -0.006)
    front.add(pane)

    const signArt = await art(`drawings/sign-${s.slug}`, (seed) => drawn.stallSign(s.stallSign, s.signDoodle, s.trimColour, seed + i), { edge: 4 })
    const sign = makeFlat(signArt, { width: 0.62 })
    sign.mesh.position.set(0, WALL + 0.02, 0.014)
    sign.mesh.rotation.z = (rand() - 0.5) * 0.04
    front.add(sign.mesh)
    boiling.push(sign)

    const decor = {
      bunting: () => art(`drawings/decor-${s.slug}`, (seed) => drawn.bunting(s.trimColour, seed + i), { tracings: 1 }),
      ornaments: () => art(`drawings/decor-${s.slug}`, (seed) => drawn.ornaments(seed + i), { tracings: 1 }),
      lanterns: () => art(`drawings/decor-${s.slug}`, (seed) => drawn.lanterns(s.trimColour, seed + i), { tracings: 1 }),
      wheel: () => art(`drawings/decor-${s.slug}`, (seed) => drawn.wheelWreath(s.trimColour, seed + i), { tracings: 1 }),
    }[s.decoration]
    if (decor) {
      const preps = await decor()
      if (s.decoration === 'wheel') {
        // a wreath on the door: it swings with it
        const wreath = makeFlat(preps, { width: 0.17 })
        wreath.mesh.position.set(DOOR.w / 2, DOOR.h * 0.66, 0.012)
        wreath.mesh.castShadow = false
        doorHinge.add(wreath.mesh)
      } else {
        const strip = makeFlat(preps, { width: s.decoration === 'bunting' ? 0.9 : 0.84 })
        strip.mesh.scale.y = s.decoration === 'bunting' ? 1 : 0.62 // hung on shorter strings than drawn
        strip.mesh.position.set(0, WALL - 0.075 - (strip.height * strip.mesh.scale.y) / 2, 0.022)
        strip.mesh.castShadow = false
        front.add(strip.mesh)
      }
    }

    // the tag that pops up over the roof: its name and one line
    const line = words2(s.oneLiner)
    const tagArt = await art(`drawings/tag-${s.slug}`, (seed) => drawn.stallTag(s.title, line, seed + i), { edge: 0, tracings: 1 })
    const tag = makeFlat(tagArt, { width: 0.6 })
    tag.mesh.castShadow = false
    const tagHolder = new THREE.Group()
    tagHolder.position.set(0, WALL + GABLE + 0.06, -0.06)
    tag.mesh.position.y = tag.height / 2
    tagHolder.add(tag.mesh)
    tagHolder.visible = false
    lean.add(tagHolder)

    const shade = softShadow(W + 0.4, 0.5, 0.25)
    shade.position.set(0, 0.006, 0.12)
    group.add(shade)

    return {
      s, i, group, lean, front, doorHinge, warm, windowLook, tagHolder,
      spot: null,
      interior: null, // built the first time it is wanted
      hovering: 0,
      // the middle of its front, in the room (for the camera)
      faceCorners: (() => {
        const c = [new V3(), new V3(), new V3(), new V3()]
        return () => {
          c[0].set(-W / 2, 0, 0)
          c[1].set(W / 2, 0, 0)
          c[2].set(-W / 2, WALL + GABLE, 0)
          c[3].set(W / 2, WALL + GABLE, 0)
          for (const p of c) lean.localToWorld(p)
          return c
        }
      })(),
    }
  }
  const market = []
  for (let i = 0; i < n; i++) market.push(await makeStall(stalls[i], i))

  // ---- the far end: the tree, its star; the lamp posts; little things on the street ------
  await turn()
  const [treeArt, treeStarArt, lampArt, mugArt, steamArt, sledArt, robinStand, robinHop, garlandArt, noteArt] = await Promise.all([
    art('drawings/market-tree', (seed) => drawn.tree(seed), { tracings: 1 }),
    art('drawings/market-tree-star', (seed) => drawn.treeStar(seed), { tracings: 1 }),
    art('drawings/market-lamp', (seed) => drawn.lampPost(seed), { tracings: 1 }),
    art('drawings/market-mug', (seed) => drawn.mug(seed), { tracings: 1 }),
    art('drawings/market-steam', (seed) => drawn.steam(seed), { edge: 0, tracings: 3 }),
    art('drawings/market-sled', (seed) => drawn.sled(seed), { tracings: 1 }),
    art('drawings/market-robin', (seed) => drawn.robin('stand', seed), { tracings: 1, trim: false }),
    art('drawings/market-robin-hop', (seed) => drawn.robin('hop', seed), { tracings: 1, trim: false }),
    art('drawings/market-garland', (seed) => drawn.garland(seed), { edge: 0, tracings: 1 }),
    art('drawings/market-note', (seed) => drawn.hangingNote(words.inside, seed), { edge: 0 }),
  ])
  const tree = stand(makeFlat(treeArt, { height: 1.36 }), 0, 0, inner.back + 0.1)
  room.add(tree.mesh)
  const treeStar = glowing(treeStarArt, { width: 0.16 })
  treeStar.mesh.position.set(0, 1.36 + 0.02, inner.back + 0.11)
  room.add(treeStar.mesh)

  const lamps = []
  for (let i = 0; i < n - 1; i++) {
    if (n > 2 && i === Math.floor((n - 1) / 2) && n % 2 === 0) continue // the middle gap is the tree's
    const x = (stallX(i) + stallX(i + 1)) / 2
    const post = stand(makeFlat(lampArt, { height: 0.96 }), x, 0, -0.28)
    room.add(post.mesh)
    // the lantern's glass glows
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.12), new THREE.MeshBasicMaterial({ color: '#ffe08c' }))
    glass.position.set(x, 0.96 - 0.15, -0.274)
    room.add(glass)
    lamps.push({ x, head: new V3(x, 0.98, -0.27) })
  }

  const garland = makeFlat(garlandArt, { width: inner.w + 0.04 })
  garland.mesh.position.set(0, inner.h - garland.height / 2 + 0.02, -0.03)
  garland.mesh.castShadow = false
  room.add(garland.mesh)

  // a steaming mug on a window sill, a sled leaning on a stall, a robin
  const sill = market[Math.min(2, n - 1)]
  const mugFlat = stand(makeFlat(mugArt, { height: 0.06 }), WIN.x + 0.1, WIN.y - 0.004, 0.03)
  sill.front.add(mugFlat.mesh)
  const steam = makeFlat(steamArt, { height: 0.1 })
  steam.mesh.position.set(WIN.x + 0.095, WIN.y + 0.11, 0.031)
  steam.mesh.castShadow = false
  sill.front.add(steam.mesh)
  boiling.push(steam)
  // (street things stay in the gaps between stalls, out of the way of the view inside one)
  const post = lamps.at(-1) || { x: (stallX(n - 2) + stallX(n - 1)) / 2 }
  const sledFlat = makeFlat(sledArt, { width: 0.28 })
  sledFlat.mesh.position.set(post.x + 0.07, 0.13, -0.22)
  sledFlat.mesh.rotation.set(-0.12, 0, -1.32) // stood on its end against the lamp post
  room.add(sledFlat.mesh)
  const robinMaps = [texture(robinStand[0].front), texture(robinHop[0].front)]
  const robin = makeFlat(robinStand, { height: 0.08 })
  const robinHome = new V3((lamps[0]?.x ?? stallX(0) + 0.58) + 0.1, robin.height / 2 + 0.003, -0.14)
  robin.mesh.position.copy(robinHome)
  room.add(robin.mesh)

  // ---- string lights, zig-zagging between the stalls' peaks and the lamps ---------------
  const peaks = market.map((m) => new V3(m.group.position.x, WALL + GABLE + 0.04, FRONT + 0.14)) // (in front of the roofs' overhang)
  const anchors = [new V3(-inner.w / 2 + 0.02, WALL + GABLE + 0.25, -0.32)]
  market.forEach((m, i) => {
    anchors.push(peaks[i])
    const lamp = lamps.find((l) => l.x > m.group.position.x && l.x < m.group.position.x + spacing)
    if (lamp) anchors.push(lamp.head)
  })
  anchors.push(new V3(inner.w / 2 - 0.02, WALL + GABLE + 0.25, -0.32))
  const wirePoints = []
  for (let k = 0; k < anchors.length - 1; k++) {
    const a = anchors[k]
    const b = anchors[k + 1]
    const sag = 0.05 + a.distanceTo(b) * 0.08
    for (let t = 0; t < 1; t += 0.05) wirePoints.push(new V3().lerpVectors(a, b, t).setY(lerp(a.y, b.y, t) - Math.sin(Math.PI * t) * sag))
  }
  wirePoints.push(anchors.at(-1).clone())
  // the wire: thin quads, all in one mesh
  const wire = []
  for (let k = 0; k < wirePoints.length - 1; k++) {
    const a = wirePoints[k]
    const b = wirePoints[k + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l = Math.hypot(dx, dy) || 1
    const nx = (-dy / l) * 0.004
    const ny = (dx / l) * 0.004
    wire.push(a.x + nx, a.y + ny, a.z, a.x - nx, a.y - ny, a.z, b.x + nx, b.y + ny, b.z, a.x - nx, a.y - ny, a.z, b.x - nx, b.y - ny, b.z, b.x + nx, b.y + ny, b.z)
  }
  const wireGeometry = new THREE.BufferGeometry()
  wireGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3))
  room.add(new THREE.Mesh(wireGeometry, new THREE.MeshBasicMaterial({ color: '#1a1f2e', side: THREE.DoubleSide })))
  // the bulbs hang along it, every so often
  const bulbAt = []
  let walked = 0
  for (let k = 1; k < wirePoints.length; k++) {
    walked += wirePoints[k].distanceTo(wirePoints[k - 1])
    if (walked < 0.11) continue
    walked = 0
    bulbAt.push(wirePoints[k].clone().add(new V3(0, -0.036, 0.004)))
  }
  const BULB_ON = [new THREE.Color('#ffd35c'), new THREE.Color('#ffae47')]
  const BULB_OFF = new THREE.Color('#5c4a30')
  const BULB_BRIGHT = new THREE.Color('#fff4c2')
  const bulbs = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.044, 0.066),
    new THREE.MeshBasicMaterial({ map: texture(drawn.bulb()), alphaTest: 0.5, side: THREE.DoubleSide }),
    bulbAt.length,
  )
  bulbs.frustumCulled = false
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  bulbAt.forEach((p, k) => {
    q.setFromAxisAngle(new V3(0, 0, 1), (k % 2 ? 1 : -1) * 0.25)
    bulbs.setMatrixAt(k, m4.compose(p, q, new V3(1, 1, 1)))
    bulbs.setColorAt(k, BULB_ON[k % 2])
  })
  room.add(bulbs)
  const bulbState = bulbAt.map(() => 0) // ticks left dimmed
  const bulbOwner = bulbAt.map((p) => market.findIndex((m) => Math.abs(p.x - m.group.position.x) < spacing / 2))
  function paintBulbs() {
    bulbAt.forEach((_, k) => {
      const hot = hovered && bulbOwner[k] === hovered.i
      bulbs.setColorAt(k, hot ? BULB_BRIGHT : bulbState[k] > 0 ? BULB_OFF : BULB_ON[k % 2])
    })
    bulbs.instanceColor.needsUpdate = true
  }

  // the note hanging from the lights over the middle of the street
  const noteHang = new THREE.Group()
  const middle = wirePoints.reduce((best, p) => (Math.abs(p.x) < Math.abs(best.x) ? p : best), wirePoints[0])
  noteHang.position.copy(middle).add(new V3(0, -0.01, 0.03))
  const note = makeFlat(noteArt, { width: 0.5 })
  note.mesh.position.y = -0.06 - note.height / 2
  note.mesh.castShadow = false
  noteHang.add(note.mesh)
  for (const side of [-1, 1]) {
    const string = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 0.07).translate(0, -0.035, 0), new THREE.MeshBasicMaterial({ color: '#1a1f2e' }))
    string.position.x = side * note.width * 0.4
    noteHang.add(string)
  }
  room.add(noteHang)
  boiling.push(note)

  // ---- snow ---------------------------------------------------------------------------------
  const FLAKES = innerWidth < 700 ? 60 : 150
  const flakeSizes = [0.022, 0.036, 0.056]
  const flakeShare = [0.5, 0.33, 0.17]
  const snowfall = flakeSizes.map((size, kind) => {
    const count = Math.round(FLAKES * flakeShare[kind])
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: texture(drawn.flake(kind)), color: '#eef3ff', alphaTest: 0.4, side: THREE.DoubleSide }),
      count,
    )
    mesh.frustumCulled = false
    room.add(mesh)
    const flakes = Array.from({ length: count }, () => ({
      x: (rand() - 0.5) * (inner.w - 0.06),
      y: rand() * inner.h,
      z: -0.05 - rand() * (inner.back * -1 - 0.12),
      fall: 0.012 + rand() * 0.016 + kind * 0.004,
      phase: rand() * 6,
      spin: (rand() - 0.5) * 0.2,
      turn: rand() * 6,
    }))
    return { mesh, flakes }
  })
  const flakeMatrix = new THREE.Matrix4()
  const flakeQ = new THREE.Quaternion()
  const Z = new V3(0, 0, 1)
  const one = new V3(1, 1, 1)
  const flakePos = new V3()
  function placeFlakes() {
    for (const { mesh, flakes } of snowfall) {
      flakes.forEach((f, k) => {
        flakeQ.setFromAxisAngle(Z, f.turn)
        mesh.setMatrixAt(k, flakeMatrix.compose(flakePos.set(f.x, f.y, f.z), flakeQ, one))
      })
      mesh.instanceMatrix.needsUpdate = true
    }
  }
  placeFlakes()
  const showSnow = (on) => snowfall.forEach(({ mesh }) => (mesh.visible = on))
  // the pointer, as a ray through the room, so falling snow can shy away from it
  const ray = { on: false, origin: new V3(), dir: new V3(), at: 0 }
  const farPoint = new V3()
  const roomInverse = new THREE.Matrix4()

  // ---- the stalls' insides (made the first time each is wanted) ------------------------------
  // what the camera is up to: 'closed' | 'street' | 'entering' | 'inside' | 'leaving'
  let mode = 'closed'
  let current = null // the stall you are in
  let hovered = null // the stall the pointer is on
  const inside = (stall) => () => mode === 'inside' && current === stall && !ui.modal

  async function cutout(src, fallback, opts) {
    let image = null
    if (has(src)) image = await loadImage(src).catch(() => null)
    const source = image || fallback()
    return { preps: [prepCutout(source, opts)], source: image ? src : source }
  }
  async function print(picture, fallback, seed) {
    let image = null
    if (has(picture.image)) image = await loadImage(picture.image).catch(() => null)
    const source = image || fallback()
    return { canvas: drawn.pinnedPrint(source, seed), source: image ? picture.image : source, alt: picture.alt }
  }
  // the main colour of a picture, for the light that shines through it
  function tintOf(source) {
    const c = document.createElement('canvas')
    c.width = c.height = 8
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(source, 0, 0, 8, 8)
    const px = ctx.getImageData(0, 0, 8, 8).data
    let r = 0
    let g = 0
    let b = 0
    let k = 0
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue
      r += px[i]
      g += px[i + 1]
      b += px[i + 2]
      k++
    }
    return k ? new THREE.Color(`rgb(${Math.round(r / k)}, ${Math.round(g / k)}, ${Math.round(b / k)})`) : new THREE.Color('#ffcf73')
  }

  function ensureInterior(stall) {
    stall.interior ||= buildInterior(stall).catch((error) => {
      console.error(error)
      stall.interior = null
      throw error
    })
    return stall.interior
  }

  async function buildInterior(stall) {
    const { s } = stall
    const g = new THREE.Group()
    g.visible = false
    const spots = []
    const spot = (label, corners, onClick, extra = {}) => {
      const made = overlay.addSpot({ group: box.id, label, corners, onClick, visible: inside(stall), ...extra })
      spots.push(made)
      return made
    }
    const add = (flat, x, y, z, { tilt = 0, shadow = true } = {}) => {
      flat.mesh.position.set(x, y, z)
      flat.mesh.rotation.z = tilt
      flat.mesh.castShadow = shadow
      g.add(flat.mesh)
      return flat
    }
    const standing = (flat, x, y, z) => add(flat, x, y + flat.height / 2, z)
    const onWall = (flat, x, y, tilt = 0) => add(flat, x, y, -DEPTH + T + 0.006, { tilt, shadow: false })

    // in every stall: the way back out, and the case study pinned up
    const [signArt, caseArt] = await Promise.all([
      art('drawings/market-back', (seed) => drawn.doorSign(words.back, seed), { edge: 0 }),
      art('drawings/market-case', (seed) => drawn.caseNote(words.caseStudy, seed), { edge: 0 }),
    ])
    const backSign = standing(makeFlat(signArt, { height: 0.13 }), -0.37, 0, -0.2)
    boiling.push(backSign)
    spot(words.back, cornersOf(backSign.mesh, backSign.width, backSign.height), () => goTo(`#/${box.id}`))
    const caseSpot = (x, y) => {
      const note = onWall(makeFlat(caseArt, { width: 0.15 }), x, y, 0.05)
      boiling.push(note)
      return spot(`${words.caseStudy}: ${s.title}`, cornersOf(note.mesh, note.width, note.height), () => ui.caseStudy(s))
    }
    // a picture pinned to the wall: click it to see it big
    const pinUp = async (picture, fallback, x, y, width, seed) => {
      const made = await print(picture, fallback, seed)
      const flat = onWall(makeFlat(once(made.canvas, { edge: 0 }), { width }), x, y, (rand() - 0.5) * 0.12)
      spot(isTodo(picture.alt) ? `${s.title}, ${seed + 1}` : picture.alt, cornersOf(flat.mesh, flat.width, flat.height), () =>
        ui.viewer({ title: s.title, note: '', pictures: [{ source: made.source, alt: picture.alt }] }),
      )
      return flat
    }

    const state = { g, spots, type: s.interiorType }
    const type = s.interiorType

    if (type === 'jewelry') {
      // the jeweller's bench: sketches pinned to a cork board, a glass counter of velvet trays
      const cork = onWall(makeFlat(once(drawn.corkBoard(), { edge: 0 }), { width: 0.56 }), -0.07, 0.4)
      cork.mesh.position.z -= 0.002
      await Promise.all(s.wall.slice(0, 3).map((pic, k) => pinUp(pic, () => drawn.sheet('sketch', k + 1), -0.25 + k * 0.18, 0.4 + (k % 2) * 0.02, 0.13, k)))
      caseSpot(0.37, 0.42)
      const woodLook = new THREE.MeshLambertMaterial({ map: wallMap })
      slab(g, 0.82, 0.15, 0.2, 0, 0.075, -0.44, woodLook)
      const glass = new THREE.MeshBasicMaterial({ map: texture(cellophane(3)), transparent: true, depthWrite: false, side: THREE.DoubleSide })
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.13), glass)
      pane.position.set(0, 0.215, -0.34)
      pane.renderOrder = 2
      const lid = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.2), glass)
      lid.rotation.x = -Math.PI / 2
      lid.position.set(0, 0.28, -0.44)
      lid.renderOrder = 2
      g.add(pane, lid)
      const turntableFlat = standing(makeFlat(once(drawn.turntable(s.trimColour), { edge: 0 }), { width: 0.18 }), 0, 0, -0.22)
      const pieces = await Promise.all(
        s.items.slice(0, 3).map(async (item, k) => {
          const x = (k - (Math.min(3, s.items.length) - 1) / 2) * 0.26
          const tray = standing(makeFlat(once(drawn.velvetTray(s.trimColour, k + 1), { edge: 0 }), { width: 0.23 }), x, 0.148, -0.38)
          tray.mesh.castShadow = false
          const made = await cutout(item.image, () => drawn.jewel(['ring', 'pendant', 'earrings'][k % 3], k + 1))
          const flat = makeFlat(made.preps, { height: 0.1 })
          const home = new V3(x, 0.165 + flat.height / 2, -0.42)
          flat.mesh.position.copy(home)
          g.add(flat.mesh)
          const pieceState = { item, flat, home, source: made.source, video: null, videoMap: null, still: flat.mesh.material.map }
          spot(isTodo(item.title) ? `${s.title} ${k + 1}` : item.title, cornersOf(flat.mesh, flat.width, flat.height), () => lift(state, pieceState))
          return pieceState
        }),
      )
      Object.assign(state, { pieces, lifted: null, turning: false, turntable: turntableFlat, stand: new V3(0, 0.09 + 0.115, -0.22) })
      // the piece up on the stand: drag to turn it, hover to look closer
      const liftedCorners = (() => {
        const c = [new V3(), new V3(), new V3(), new V3()]
        return () => {
          const p = state.lifted
          if (!p) return c
          const k = p.flat.mesh.scale.x
          const w = p.flat.width * k * 0.55
          const h = p.flat.height * k * 0.55
          const at = p.flat.mesh.position
          c[0].set(at.x - w, at.y - h, at.z)
          c[1].set(at.x + w, at.y - h, at.z)
          c[2].set(at.x - w, at.y + h, at.z)
          c[3].set(at.x + w, at.y + h, at.z)
          for (const pt of c) g.localToWorld(pt)
          return c
        }
      })()
      state.standSpot = overlay.addSpot({ group: box.id, label: words.turn, corners: liftedCorners, visible: () => inside(stall)() && !!state.lifted, onClick() {} })
      spots.push(state.standSpot)
      const node = state.standSpot.node
      node.classList.add('turn-spot')
      let grab = null
      node.addEventListener('pointerdown', (e) => {
        e.stopPropagation() // (the room's own pan must not take this drag)
        grab = { x: e.clientX }
        state.turning = true
        node.setPointerCapture?.(e.pointerId)
      })
      node.addEventListener('pointermove', (e) => {
        const p = state.lifted
        if (!p) return
        if (grab) {
          const dx = e.clientX - grab.x
          grab.x = e.clientX
          if (p.video) {
            const d = p.video.duration || 1
            p.video.currentTime = (((p.video.currentTime + dx * 0.01) % d) + d) % d
          } else p.flat.mesh.rotation.y += dx * 0.014
          redraw()
          ui.loupe(0, 0, null, '')
          return
        }
        // the magnifier, while the piece faces you
        const facing = p.video || Math.cos(p.flat.mesh.rotation.y) > 0.88
        if (facing && !stepped.reduced) p.url?.then((url) => state.lifted === p && ui.loupe(e.clientX, e.clientY, pieceRect(p), url))
        else ui.loupe(0, 0, null, '')
      })
      const letGo = () => {
        grab = null
        state.turning = false
      }
      node.addEventListener('pointerup', letGo)
      node.addEventListener('pointercancel', letGo)
      node.addEventListener('pointerleave', () => {
        ui.loupe(0, 0, null, '')
        if (!grab) state.turning = false
      })
      node.addEventListener('pointerenter', () => (state.turning = true))
      node.addEventListener('keydown', (e) => {
        const p = state.lifted
        if (!p || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
        p.flat.mesh.rotation.y += e.key === 'ArrowLeft' ? -0.3 : 0.3
        redraw()
      })
    } else if (type === 'resin') {
      // shelves and a drying rack of pieces, a lamp that swings to whichever you look at
      caseSpot(-0.35, 0.41)
      const shelf = onWall(makeFlat(once(drawn.shelfPlank(), { edge: 0 }), { width: 0.5 }), -0.03, 0.34)
      shelf.mesh.position.z += 0.03
      const rack = standing(makeFlat(once(drawn.dryingRack(), { edge: 0 }), { height: 0.4 }), 0.29, 0, -0.66)
      const table = standing(makeFlat(once(drawn.worktable(), { edge: 0 }), { width: 0.5 }), -0.13, 0, -0.27)
      const tableTop = table.height * (1 - 40 / 300) // the top of the drawn table
      standing(makeFlat(once(drawn.cups(), { edge: 4 }), { width: 0.15 }), -0.25, tableTop - 0.01, -0.262)
      const tints = ['#3fc1c9', '#f7a1c4', '#ffcf5c', '#8a7cf0', '#7fe3a0']
      add(makeFlat(once(drawn.drip(tints[1]), { edge: 0 }), { width: 0.1 }), -0.04, tableTop - 0.012, -0.255, { shadow: false })
      const foot = standing(makeFlat(once(drawn.lampFoot(), { edge: 4 }), { width: 0.075 }), 0.06, tableTop - 0.01, -0.28)
      const armArt = once(drawn.lampArm(), { edge: 4 })
      const arm = makeFlat(armArt, { width: 0.19 })
      const pivot = new THREE.Group()
      pivot.position.set(0.06, tableTop - 0.01 + foot.height * 0.9, -0.275)
      arm.mesh.geometry.translate(arm.width / 2 - 0.008, 0, 0) // swing about its elbow
      pivot.add(arm.mesh)
      pivot.rotation.z = 0.9
      g.add(pivot)
      const backTint = new THREE.Mesh(
        new THREE.PlaneGeometry(W - T * 2, WALL),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      )
      backTint.position.set(0, WALL / 2, -DEPTH + T + 0.003)
      g.add(backTint)
      const glowMap = texture(radialGlow())
      const places = [
        [-0.15, 0.34 + 0.035, -0.71], // on the shelf
        [0.09, 0.34 + 0.035, -0.71],
        [0.22, 0.27, -0.64], // pegged on the rack
        [0.36, 0.27, -0.64],
      ]
      const pieces = await Promise.all(
        s.items.slice(0, 4).map(async (item, k) => {
          const made = await cutout(item.image, () => drawn.resin(['coaster', 'drop', 'tray', 'dish'][k % 4], tints[k % tints.length], k + 1))
          const flat = makeFlat(made.preps, { height: k < 2 ? 0.12 : 0.1 })
          const [x, y, z] = places[k]
          flat.mesh.position.set(x, k < 2 ? y + flat.height / 2 : y, z)
          g.add(flat.mesh)
          const tint = item.tint ? new THREE.Color(item.tint) : tintOf(typeof made.source === 'string' ? await loadImage(made.source) : made.source)
          const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(flat.width * 2.2, flat.height * 2.2),
            new THREE.MeshBasicMaterial({ map: glowMap, color: tint, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
          )
          glow.position.copy(flat.mesh.position).add(new V3(0, 0, -0.012))
          g.add(glow)
          const lit = new THREE.MeshBasicMaterial({ map: flat.mesh.material.map, alphaTest: 0.5, side: THREE.DoubleSide })
          const pieceState = { item, flat, tint, glow, lit, paper: flat.mesh.material, source: made.source }
          spot(isTodo(item.title) ? `${s.title} ${k + 1}` : item.title, cornersOf(flat.mesh, flat.width, flat.height), () => openResin(pieceState), {
            onHover: (on) => shine(state, on ? pieceState : null),
          })
          return pieceState
        }),
      )
      Object.assign(state, { pieces, pivot, backTint, lit: null, rack })
    } else if (type === 'workshop') {
      // the bike workshop: the product on its repair stand, numbered tags on the decisions
      onWall(makeFlat(once(drawn.pegboard(), { edge: 0 }), { width: 0.27 }), -0.33, 0.43)
      const pages = s.wall.slice(0, 3)
      const kinds = ['research', 'notes', 'sketch']
      const spotsAt = [[0.24, 0.46], [0.25, 0.27], [0.39, 0.23]]
      await Promise.all(pages.map((pic, k) => pinUp(pic, () => drawn.sheet(kinds[k % 3], k + 3), spotsAt[k][0], spotsAt[k][1], 0.11, k + 3)))
      caseSpot(0.39, 0.43)
      standing(makeFlat(once(drawn.repairStand(), { edge: 4 }), { height: 0.5 }), 0, 0, -0.5)
      const item = s.items[0] || { image: '', title: s.title, note: '' }
      const made = await cutout(item.image, () => drawn.bike(s.trimColour))
      const product = add(makeFlat(made.preps, { width: 0.4 }), -0.02, 0.32, -0.47)
      spot(isTodo(item.title) ? s.title : item.title, cornersOf(product.mesh, product.width, product.height), () =>
        ui.viewer({ title: item.title, note: item.note, pictures: [{ source: made.source, alt: '' }] }),
      )
      const tags = await Promise.all(
        s.hotspots.map(async (h, k) => {
          const anchor = new V3((h.x - 0.5) * product.width, (0.5 - h.y) * product.height, 0)
          const tagFlat = makeFlat(once(drawn.numberTag(k + 1, s.trimColour, k + 1)), { width: 0.055 })
          const offset = new V3((k % 2 ? 1 : -1) * 0.03, 0.05, 0.03)
          tagFlat.mesh.position.copy(anchor).add(offset)
          tagFlat.mesh.castShadow = false
          product.mesh.add(tagFlat.mesh)
          // the string from the tag to its spot on the product
          const len = offset.length()
          const string = new THREE.Mesh(new THREE.PlaneGeometry(0.004, len), new THREE.MeshBasicMaterial({ color: P.navy }))
          string.position.copy(anchor).addScaledVector(offset, 0.5)
          string.rotation.z = Math.atan2(-offset.x, offset.y)
          product.mesh.add(string)
          spot(`${k + 1}: ${isTodo(h.title) ? s.title : h.title}`, cornersOf(tagFlat.mesh, tagFlat.width * 1.4, tagFlat.height * 1.4), () =>
            ui.note(toScreen(tagFlat.mesh, new V3(tagFlat.width / 2, 0, 0)), k + 1, h.title, h.note),
          )
          return tagFlat
        }),
      )
      Object.assign(state, { product, tags })
    } else if (type === 'classroom') {
      // a tiny classroom: the module on the blackboard, a workbook in every desk
      const module = s.module || { title: s.title, goal: '' }
      const board = onWall(makeFlat(once(drawn.blackboard(words2(module.title) || { text: s.title }, words2(module.goal) || { text: '' }), { edge: 0 }), { width: 0.62 }), -0.03, 0.38)
      board.mesh.position.z -= 0.002
      const kinds = ['panda', 'monkey', 'crane']
      const walls = [[-0.41, 0.45, 0.11], [-0.41, 0.27, 0.1], [0.39, 0.24, 0.11]]
      kinds.forEach((kind, k) => onWall(makeFlat(once(drawn.animal(kind, k + 1), { edge: 4 }), { width: walls[k][2] }), walls[k][0], walls[k][1], (rand() - 0.5) * 0.2))
      caseSpot(0.39, 0.43)
      standing(makeFlat(once(drawn.globe()), { height: 0.16 }), -0.39, 0, -0.62)
      const pages = (s.pages.length ? s.pages : [1, 2, 3, 4, 5, 6].map((k) => ({ image: '', alt: '' }))).map((page, k, list) => ({
        source: has(page.image) ? page.image : drawn.workbookPage(k + 1, list.length),
        alt: page.alt,
      }))
      const desks = [-0.23, 0.04, 0.31]
      desks.forEach((x, k) => {
        const desk = standing(makeFlat(once(drawn.schoolDesk(k + 1)), { width: 0.2 }), x, 0, -0.34)
        const start = Math.min(pages.length - 1, k * Math.max(1, Math.floor(pages.length / desks.length)))
        spot(`${words.workbook}, ${words.page(start + 1, pages.length)}`, cornersOf(desk.mesh, desk.width, desk.height), () => ui.workbook(pages, start))
      })
    } else {
      // a plain shop: a display table of pieces
      caseSpot(0.37, 0.43)
      const table = standing(makeFlat(once(drawn.worktable(3), { edge: 0 }), { width: 0.6 }), 0, 0, -0.42)
      const top = table.height * (1 - 40 / 300)
      await Promise.all(
        s.items.slice(0, 4).map(async (item, k, list) => {
          const made = await cutout(item.image, () => drawn.resin('coaster', s.trimColour, k + 1))
          const flat = standing(makeFlat(made.preps, { height: 0.1 }), (k - (list.length - 1) / 2) * 0.14, top, -0.44)
          spot(isTodo(item.title) ? `${s.title} ${k + 1}` : item.title, cornersOf(flat.mesh, flat.width, flat.height), () =>
            ui.viewer({ title: item.title, note: item.note, pictures: [{ source: made.source, alt: '' }, ...(item.process || []).map((p) => ({ source: has(p.image) ? p.image : null, alt: p.alt })).filter((p) => p.source)], label: words.process }),
          )
        }),
      )
    }

    stall.lean.add(g)
    return state
  }

  // a soft round glow, for the light coming through a resin piece
  function radialGlow() {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
    grad.addColorStop(0, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.35)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
    return c
  }

  // ---- jewellery: up onto the stand, and back --------------------------------------------------
  async function lift(state, p) {
    if (state.busy || state.lifted === p) return
    state.busy = true
    if (state.lifted) await putBack(state, true)
    const from = p.flat.mesh.position.clone()
    const scale = 2.3
    const to = state.stand.clone().setY(0.09 + (p.flat.height * scale) / 2)
    sound.play('step')
    await stepped.poses([0.1, 0.25, 0.45, 0.65, 0.82, 0.94, 1], (t) => {
      p.flat.mesh.position.lerpVectors(from, to, t)
      p.flat.mesh.position.y += Math.sin(Math.PI * t) * 0.12
      p.flat.mesh.scale.setScalar(lerp(1, scale, t))
    })
    state.lifted = p
    p.url = urlFor(p.source)
    if (has(p.item.turntable)) {
      // her turntable video plays on the stand; dragging turns it back and forth
      p.video = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'auto', src: base + p.item.turntable })
      p.video.play().catch(() => {})
      p.videoMap = new THREE.Texture(p.video) // (sent again on each tick it plays)
      p.videoMap.colorSpace = THREE.SRGBColorSpace
      p.flat.mesh.material.map = p.videoMap
      p.flat.mesh.material.needsUpdate = true
    }
    ui.piece(p.item, { hint: words.turn + (stepped.reduced ? '' : ` · ${words.closer}`), putBack: () => putBack(state) })
    state.busy = false
    overlay.update()
    state.standSpot.node.focus({ preventScroll: true })
  }
  // where a lifted piece's picture is on screen
  function pieceRect(p) {
    const k = p.flat.mesh.scale.x
    const a = toScreen(p.flat.mesh.parent, p.flat.mesh.position.clone().add(new V3((-p.flat.width * k) / 2, (p.flat.height * k) / 2, 0)))
    const b = toScreen(p.flat.mesh.parent, p.flat.mesh.position.clone().add(new V3((p.flat.width * k) / 2, (-p.flat.height * k) / 2, 0)))
    return { left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y }
  }
  async function putBack(state, quick = false) {
    const p = state.lifted
    if (!p) return
    state.lifted = null
    ui.piece(null)
    ui.loupe(0, 0, null, '')
    if (p.video) {
      p.video.pause()
      p.video.removeAttribute('src')
      p.video.load()
      p.videoMap.dispose()
      p.video = p.videoMap = null
      p.flat.mesh.material.map = p.still
      p.flat.mesh.material.needsUpdate = true
    }
    const from = p.flat.mesh.position.clone()
    const fromScale = p.flat.mesh.scale.x
    const fromTurn = p.flat.mesh.rotation.y
    await stepped.poses(quick ? [0.5, 1] : [0.15, 0.35, 0.6, 0.82, 1], (t) => {
      p.flat.mesh.position.lerpVectors(from, p.home, t)
      p.flat.mesh.position.y += Math.sin(Math.PI * t) * 0.08
      p.flat.mesh.scale.setScalar(lerp(fromScale, 1, t))
      p.flat.mesh.rotation.y = lerp(fromTurn, Math.round(fromTurn / (Math.PI * 2)) * Math.PI * 2, t)
    })
    p.flat.mesh.rotation.y = 0
    overlay.update()
  }

  // ---- resin: the lamp swings over, the light comes through ---------------------------------
  function shine(state, p) {
    if (state.lit === p) return
    const before = state.lit
    state.lit = p
    if (before) {
      before.flat.mesh.material = before.paper
      before.glow.material.opacity = 0
    }
    const mine = (state.shining = (state.shining || 0) + 1)
    const fromAngle = state.pivot.rotation.z
    let toAngle = 0.9
    if (p) {
      const target = p.flat.mesh.position
      toAngle = Math.atan2(target.y - state.pivot.position.y, target.x - state.pivot.position.x)
      p.flat.mesh.material = p.lit
      state.backTint.material.color.copy(p.tint)
    }
    const fromTint = state.backTint.material.opacity
    stepped.poses([0.3, 0.65, 1], (t) => {
      if (mine !== state.shining) return
      state.pivot.rotation.z = lerp(fromAngle, toAngle, t)
      state.backTint.material.opacity = lerp(fromTint, p ? 0.16 : 0, t)
      if (p) p.glow.material.opacity = 0.75 * t
    })
  }
  function openResin(p) {
    ui.viewer({
      title: p.item.title,
      note: p.item.note,
      pictures: [{ source: p.source, alt: '' }, ...(p.item.process || []).filter((pic) => has(pic.image)).map((pic) => ({ source: pic.image, alt: pic.alt }))],
      label: words.process,
      tint: `#${p.tint.getHexString()}`,
    })
  }

  // ---- hovering a stall in the street ----------------------------------------------------------
  function hover(stall, on) {
    if (mode !== 'street') return
    const mine = ++stall.hovering
    if (on) {
      if (hovered && hovered !== stall) hover(hovered, false)
      hovered = stall
      sound.play('jingle')
      ensureInterior(stall).catch(() => {}) // (make the inside while they make up their mind)
      stepped.poses([0.012, 0.024, 0.03, 0.028], (a) => mine === stall.hovering && (stall.lean.rotation.x = a))
      stepped.poses([0.15, 0.32, 0.42], (a) => mine === stall.hovering && (stall.doorHinge.rotation.y = a))
      stall.tagHolder.visible = true
      stepped.poses([-0.3, -0.12, 0.02, -0.01, 0], (y) => mine === stall.hovering && (stall.tagHolder.position.y = WALL + GABLE + 0.06 + y))
      stall.windowLook.color.setScalar(1.25)
    } else {
      if (hovered === stall) hovered = null
      stepped.poses([0.015, 0], (a) => mine === stall.hovering && (stall.lean.rotation.x = a))
      stepped.poses([0.2, 0], (a) => mine === stall.hovering && (stall.doorHinge.rotation.y = a))
      stepped
        .poses([-0.1, -0.3], (y) => mine === stall.hovering && (stall.tagHolder.position.y = WALL + GABLE + 0.06 + y))
        .then(() => mine === stall.hovering && (stall.tagHolder.visible = false))
      stall.windowLook.color.setScalar(1)
    }
    paintBulbs()
    redraw()
  }
  function rest(stall) {
    stall.hovering++
    stall.lean.rotation.x = 0
    stall.doorHinge.rotation.y = 0
    stall.tagHolder.visible = false
    stall.windowLook.color.setScalar(1)
    if (hovered === stall) hovered = null
  }

  for (const stall of market) {
    stall.spot = overlay.addSpot({
      group: box.id,
      label: stall.s.title,
      corners: stall.faceCorners,
      visible: () => mode === 'street',
      onHover: (on) => hover(stall, on),
      onClick: () => goTo(`#/${box.id}/${stall.s.slug}`),
    })
  }

  // ---- the stop-motion clock -----------------------------------------------------------------
  const onShelf = () => document.body.dataset.place === 'shelf'
  const live = () => (mode === 'street' || mode === 'entering' || (mode === 'closed' && onShelf()))
  // snow falls, sways, and shies away from the pointer
  stepped.every(1, (frame) => {
    if (!live() || !snowfall[0].mesh.visible) return false
    const pointing = ray.on && performance.now() - ray.at < 1500
    for (const { flakes } of snowfall) {
      for (const f of flakes) {
        f.y -= f.fall
        f.x += Math.sin(frame * 0.16 + f.phase) * 0.004
        f.turn += f.spin
        if (pointing) {
          const t = (f.z - ray.origin.z) / ray.dir.z
          const dx = f.x - (ray.origin.x + ray.dir.x * t)
          const dy = f.y - (ray.origin.y + ray.dir.y * t)
          const d = Math.hypot(dx, dy)
          if (d < 0.3 && d > 1e-4) {
            f.x += (dx / d) * (0.3 - d) * 0.45
            f.y += (dy / d) * (0.3 - d) * 0.45
          }
        }
        if (f.y < 0.01) {
          f.y = inner.h + rand() * 0.1
          f.x = (rand() - 0.5) * (inner.w - 0.06)
        }
        f.x = THREE.MathUtils.clamp(f.x, -inner.w / 2 + 0.02, inner.w / 2 - 0.02)
      }
    }
    placeFlakes()
    return 'looks'
  })
  // the string lights blink, a bulb or two at a time
  stepped.every(1, () => {
    if (!live()) return false
    let changed = false
    bulbState.forEach((left, k) => {
      if (left > 0) {
        bulbState[k] = left - 1
        if (left === 1) changed = true
      } else if (rand() < 0.008) {
        bulbState[k] = 2 + Math.floor(rand() * 4)
        changed = true
      }
    })
    if (!changed) return false
    paintBulbs()
    return 'looks'
  })
  // stars twinkle; the robin hops now and then
  let robinTimer = 40
  stepped.every(2, (frame) => {
    if (!live()) return false
    const star = stars[frame % stars.length]
    star.mesh.scale.setScalar(rand() < 0.5 ? 0.82 : 1)
    if (--robinTimer <= 0 && mode === 'street') {
      robinTimer = 30 + Math.floor(rand() * 50)
      const dir = robin.mesh.position.x > robinHome.x ? -1 : 1
      robin.mesh.material.map = robinMaps[1]
      robin.mesh.scale.x = -dir // (drawn facing left)
      stepped
        .poses([0.02, 0.05, 0.07, 0.08], (dx, k) => {
          robin.mesh.position.x = robin.mesh.position.x + dir * 0.02
          robin.mesh.position.y = robinHome.y + [0.02, 0.03, 0.015, 0][k]
        })
        .then(() => (robin.mesh.material.map = robinMaps[0]))
    }
    return 'looks'
  })
  // jewellery on its stand turns slowly, unless someone has hold of it; a turntable video ticks on
  stepped.every(1, () => {
    if (mode !== 'inside' || !current?.interior) return false
    let changed = false
    for (const state of [current.state].filter(Boolean)) {
      const p = state.lifted
      if (!p) continue
      if (p.video) {
        if (p.video.readyState >= 2) p.videoMap.needsUpdate = true
        changed = true
      } else if (!state.turning) {
        p.flat.mesh.rotation.y += 0.05
        changed = true
      }
    }
    return changed && 'looks'
  })
  boil(stepped, boiling, () => mode !== 'closed' || onShelf())

  const bySlug = (slug) => market.find((m) => m.s.slug === slug)
  const dim = (to) => {
    const from = dim.level ?? 0
    dim.level = to
    return stepped.poses([0.35, 0.7, 1].map((t) => lerp(from, to, t)), (k) => lights.dim(k))
  }
  const footsteps = (count) => {
    for (let k = 0; k < count; k++) setTimeout(() => sound.play('step'), k * 260)
  }
  showSnow(!stepped.reduced)

  return {
    async open() {
      mode = 'street'
      sound.ambient('wind', true)
      showSnow(!stepped.reduced)
      await dim(NIGHT)
      overlay.update()
    },
    async close() {
      mode = 'closed'
      ui.closeAll()
      sound.ambient('wind', false)
      for (const stall of market) rest(stall)
      paintBulbs()
      await dim(0)
    },

    title: (slug) => bySlug(slug)?.s.title || '',
    spot: (slug) => bySlug(slug)?.spot,
    // inside a stall: its walls fill the screen (on a narrow screen, as high
    // as they go, and the rest is a swipe away)
    view(slug) {
      const stall = bySlug(slug)
      const tall = innerWidth < innerHeight
      stall.lean.updateWorldMatrix(true, false)
      // (framed a little forward and low, so the floor in front is in the picture too)
      const c = stall.lean.localToWorld(new V3(0, tall ? 0.28 : 0.255, -DEPTH * 0.42))
      return { cx: c.x, cy: c.y, w: W - 0.05, h: tall ? 0.66 : 0.62, z: c.z }
    },
    // the door swings open, snow swirls, the front folds down as the camera comes in
    async start(slug) {
      const stall = bySlug(slug)
      mode = 'entering'
      for (const m of market) rest(m)
      paintBulbs()
      current = stall
      const making = ensureInterior(stall)
      sound.play('creak')
      setTimeout(() => sound.play('bell'), 260)
      footsteps(3)
      ui.swirl()
      await stepped.poses([0.5, 1.0, 1.35, 1.5], (a) => (stall.doorHinge.rotation.y = a))
      stall.state = await making
      stall.state.g.visible = true
      stepped
        .poses([0.2, 0.5, 0.85, 1.2, 1.45, Math.PI / 2], (a, k) => {
          stall.front.rotation.x = a
          stall.doorHinge.rotation.y = lerp(1.5, 0, (k + 1) / 6)
        }, { delay: 3 })
        .then(() => mode === 'entering' && showSnow(false))
      dim(INSIDE)
    },
    show() {
      mode = 'inside'
      showSnow(false)
      overlay.showSpots(box.id)
      const first = current.state.spots.find((s) => !s.node.hidden && s.node !== current.state.standSpot?.node && s.node.getAttribute('aria-label') !== words.back)
      first?.node.focus({ preventScroll: true })
    },
    async hide() {
      ui.closeAll()
      const state = current?.state
      if (state?.lifted) await putBack(state, true)
      if (state?.lit) shine(state, null)
      mode = 'leaving'
      overlay.update()
    },
    end() {
      const stall = current
      current = null
      mode = 'street'
      showSnow(!stepped.reduced)
      footsteps(2)
      dim(NIGHT)
      if (!stall) return
      stepped
        .poses([1.3, 0.95, 0.6, 0.28, 0.06, 0], (a) => (stall.front.rotation.x = a))
        .then(() => {
          if (current !== stall) stall.state.g.visible = false
        })
    },
    // Escape inside a stall puts away whatever is out first
    escape(item) {
      if (!item) return false
      if (ui.escape()) return true
      if (current?.state?.lifted) {
        putBack(current.state)
        return true
      }
      return false
    },
    backLabel: (place) => (place === 'item' ? words.backTape : null),
    // the pointer, for the snow to shy away from
    pointer(fx, fy) {
      // a ray from the camera through the pointer, in the room's own space
      camera.updateMatrixWorld()
      farPoint.set(fx * 2 - 1, 1 - fy * 2, 0.5).unproject(camera)
      room.updateWorldMatrix(true, false)
      roomInverse.copy(room.matrixWorld).invert()
      ray.origin.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(roomInverse)
      ray.dir.copy(farPoint).applyMatrix4(roomInverse).sub(ray.origin).normalize()
      ray.on = Math.abs(ray.dir.z) > 1e-3
      ray.at = performance.now()
    },
    // motion switched off: no falling snow (it lies on the roofs), no blinking
    motion(off) {
      showSnow(!off && mode !== 'inside' && mode !== 'leaving')
      if (off) {
        bulbState.fill(0)
        paintBulbs()
      }
    },
  }
}
