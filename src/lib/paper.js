// Paper helpers: turn a drawing into a cutout that stands on a tab, casts a
// soft contact shadow, folds flat, pops up, and boils between its tracings.
import * as THREE from 'three'

export const PALETTE = {
  paper: '#f4f0e6',
  paperBack: '#e9e3d3',
  cut: '#fffdf8', // the white core you see along a cut edge
  cardboard: '#b88c5e',
  navy: '#1d2a5b',
  periwinkle: '#8b97e8',
  pencil: '#66635b',
  blackCard: '#1c1c21',
  tape: '#e8dcb6',
  maroon: '#6d2231',
  mat: '#2f7b5c',
  manila: '#e2c88e',
  highlighter: { yellow: '#e6ff3d', pink: '#ff5aa8', green: '#62f28a', orange: '#ffa23d', blue: '#58c8ff' },
}

// Small seeded random, so hand-placed wobble is the same on every visit.
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function texture(source) {
  const t = new THREE.Texture(source)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

// Make a picture fill an area of a different shape, cropping whichever way it
// overflows (a still on a cabinet screen, a photo in a film frame).
export function fillArea(map, imageAspect, areaAspect) {
  if (imageAspect > areaAspect) map.repeat.set(areaAspect / imageAspect, 1)
  else map.repeat.set(1, imageAspect / areaAspect)
  map.offset.set((1 - map.repeat.x) / 2, (1 - map.repeat.y) / 2)
  return map
}

// ---------------------------------------------------------------- cutouts

// Prepare a drawing (any image or canvas with a transparent background) as a
// paper cutout: trim the empty margin, add the thin white cut edge all the way
// round, and make a blank back with a little marker bleed-through.
// Also reports a cut-out window (a transparent hole enclosed by paper), which
// the arcade uses to find each cabinet's screen.
export function prepCutout(source, { edge = 5, maxSize = 1024 } = {}) {
  const sw = source.naturalWidth || source.width
  const sh = source.naturalHeight || source.height
  const scale = Math.min(1, maxSize / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const work = canvas(w, h)
  const wctx = work.getContext('2d', { willReadFrequently: true })
  wctx.drawImage(source, 0, 0, w, h)
  const px = wctx.getImageData(0, 0, w, h).data

  // bounding box of everything that is not transparent
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) [x0, y0, x1, y1] = [0, 0, w - 1, h - 1]

  const W = x1 - x0 + 1 + edge * 2
  const H = y1 - y0 + 1 + edge * 2
  const ox = edge - x0
  const oy = edge - y0

  const front = canvas(W, H)
  let ctx = front.getContext('2d')
  if (edge > 0) {
    // the silhouette, grown by `edge` pixels and filled paper-white
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      ctx.drawImage(work, ox + Math.cos(a) * edge, oy + Math.sin(a) * edge)
    }
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = PALETTE.cut
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.drawImage(work, ox, oy)

  const back = canvas(W, H)
  ctx = back.getContext('2d')
  ctx.drawImage(front, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = PALETTE.paperBack
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-atop'
  ctx.globalAlpha = 0.07
  ctx.drawImage(work, ox, oy)

  const hole = findWindow(px, w, h)
  const window = hole && { x: (hole.x + ox) / W, y: (hole.y + oy) / H, w: hole.w / W, h: hole.h / H }
  return { front, back, aspect: W / H, window }
}

// The largest transparent region that is closed in by paper on all sides.
function findWindow(px, w, h) {
  const s = Math.max(1, Math.ceil(Math.max(w, h) / 220)) // work on a coarse grid
  const gw = Math.ceil(w / s)
  const gh = Math.ceil(h / s)
  const cell = new Uint8Array(gw * gh) // 0 paper, 1 clear, 2 clear and outside, 3 counted
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const x = Math.min(w - 1, gx * s + (s >> 1))
      const y = Math.min(h - 1, gy * s + (s >> 1))
      if (px[(y * w + x) * 4 + 3] < 128) cell[gy * gw + gx] = 1
    }
  }
  const flood = (start, mark) => {
    const region = { count: 0, x0: gw, y0: gh, x1: -1, y1: -1 }
    const stack = [start]
    cell[start] = mark
    while (stack.length) {
      const i = stack.pop()
      const x = i % gw
      const y = (i - x) / gw
      region.count++
      if (x < region.x0) region.x0 = x
      if (x > region.x1) region.x1 = x
      if (y < region.y0) region.y0 = y
      if (y > region.y1) region.y1 = y
      for (const n of [x > 0 ? i - 1 : -1, x < gw - 1 ? i + 1 : -1, y > 0 ? i - gw : -1, y < gh - 1 ? i + gw : -1]) {
        if (n >= 0 && cell[n] === 1) {
          cell[n] = mark
          stack.push(n)
        }
      }
    }
    return region
  }
  for (let x = 0; x < gw; x++) {
    if (cell[x] === 1) flood(x, 2)
    const bottom = (gh - 1) * gw + x
    if (cell[bottom] === 1) flood(bottom, 2)
  }
  for (let y = 0; y < gh; y++) {
    if (cell[y * gw] === 1) flood(y * gw, 2)
    const right = y * gw + gw - 1
    if (cell[right] === 1) flood(right, 2)
  }
  let best = null
  for (let i = 0; i < cell.length; i++) {
    if (cell[i] !== 1) continue
    const region = flood(i, 3)
    if (!best || region.count > best.count) best = region
  }
  if (!best || best.count < 16) return null
  return { x: best.x0 * s, y: best.y0 * s, w: (best.x1 - best.x0 + 1) * s, h: (best.y1 - best.y0 + 1) * s }
}

// (a flat sheet must cast its shadow from both faces, or the lamp in front of
// it sees only the side that is culled and it casts nothing)
export const paperMaterial = (map, side = THREE.FrontSide) =>
  new THREE.MeshLambertMaterial({ map, side, shadowSide: THREE.DoubleSide, alphaTest: 0.5, alphaToCoverage: true })

const CONTACT = 0.3 // how dark the contact shadow under a standing piece is

// A cutout that stands on the floor and hinges at its base.
// `preps` is one prepCutout() result per tracing of the drawing.
//   piece.group     put this where the piece stands (origin = middle of its base)
//   piece.setFold() 0 is upright, piece.flat is folded forward, face down
//   piece.next()    swap to the next tracing (line boil)
export function makePiece(preps, { height, width, tab = true, shadow = true } = {}) {
  const aspect = preps[0].aspect
  if (width == null) width = height * aspect
  if (height == null) height = width / aspect

  const group = new THREE.Group()
  const hinge = new THREE.Group()
  group.add(hinge)

  const geometry = new THREE.PlaneGeometry(width, height).translate(0, height / 2, 0)
  const fronts = preps.map((p) => texture(p.front))
  const face = new THREE.Mesh(geometry, paperMaterial(fronts[0]))
  const rear = new THREE.Mesh(geometry, paperMaterial(texture(preps[0].back), THREE.BackSide))
  face.castShadow = face.receiveShadow = rear.receiveShadow = true // the lamp throws a cut-out shaped shadow
  hinge.add(face, rear)

  // The lamp gives the real shadow; this is the soft dark where paper meets the floor.
  let shade = null
  if (shadow) {
    shade = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.2, 0.42),
      new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false, opacity: CONTACT }),
    )
    shade.rotation.x = -Math.PI / 2
    shade.position.set(0, 0.002, 0.03)
    group.add(shade)
  }
  if (tab) {
    // the little folded tab, glued to the floor in front of the base
    const tw = Math.min(width * 0.42, 0.46)
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(tw, 0.1), new THREE.MeshLambertMaterial({ color: PALETTE.cut }))
    flap.rotation.x = -Math.PI / 2
    flap.position.set(0, 0.004, 0.05)
    flap.receiveShadow = true
    group.add(flap)
  }

  const piece = {
    group, hinge, face, width, height,
    window: preps[0].window,
    flat: Math.PI / 2,
    fold: 0,
    tracings: fronts.length,
    tracing: 0,
    setFold(angle) {
      piece.fold = angle
      hinge.rotation.x = angle
      if (shade) shade.material.opacity = CONTACT * Math.max(0, Math.cos(angle))
    },
    next() {
      piece.tracing = (piece.tracing + 1) % fronts.length
      face.material.map = fronts[piece.tracing]
    },
  }
  return piece
}

// An empty piece that hinges like a cutout, for things built from several
// parts (a film strip with its photos, a reel on its stand). Add meshes to
// `.hinge`; `height` is how tall it stands, for the hotspot and the fold.
export function makeHinged(width, height) {
  const group = new THREE.Group()
  const hinge = new THREE.Group()
  group.add(hinge)
  const piece = {
    group, hinge, width, height,
    flat: Math.PI / 2,
    fold: 0,
    tracings: 0,
    setFold(angle) {
      piece.fold = angle
      hinge.rotation.x = angle
    },
    next() {},
  }
  return piece
}

// A flat cutout with no hinge, tab or shadow: tape labels, coins, things on strings.
export function makeFlat(preps, { height, width } = {}) {
  const aspect = preps[0].aspect
  if (width == null) width = height * aspect
  if (height == null) height = width / aspect
  const fronts = preps.map((p) => texture(p.front))
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), paperMaterial(fronts[0], THREE.DoubleSide))
  mesh.castShadow = mesh.receiveShadow = true
  const flat = {
    mesh, width, height,
    tracings: fronts.length,
    tracing: 0,
    next() {
      flat.tracing = (flat.tracing + 1) % fronts.length
      mesh.material.map = fronts[flat.tracing]
    },
  }
  return flat
}

// ---------------------------------------------------------------- shadows

let blobTexture, patchTexture

// soft ellipse for under a standing piece
function blobShadow() {
  if (!blobTexture) {
    const c = canvas(128, 64)
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 32, 2, 64, 32, 62)
    g.addColorStop(0, 'rgba(0,0,0,0.9)')
    g.addColorStop(0.55, 'rgba(0,0,0,0.3)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.setTransform(1, 0, 0, 0.5, 0, 16)
    ctx.fillRect(0, -32, 128, 128)
    blobTexture = texture(c)
  }
  return blobTexture
}

// Soft dark patch that lies flat under a box (or anything with a footprint).
export function softShadow(w, d, opacity = 0.3) {
  if (!patchTexture) {
    const c = canvas(128, 128)
    const ctx = c.getContext('2d')
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 22
    ctx.shadowOffsetX = 300 // draw the square off-canvas, keep only its blurred shadow
    ctx.fillRect(34 - 300, 34, 60, 60)
    patchTexture = texture(c)
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: patchTexture, transparent: true, depthWrite: false, opacity }),
  )
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

// ---------------------------------------------------------------- motion

// Pieces in a box all fold forward, so they stack back-on-top. Give each a
// slightly different resting angle so the flat stack does not flicker.
export function stack(pieces) {
  const ordered = [...pieces].sort((a, b) => a.group.position.z - b.group.position.z) // back row first
  ordered.forEach((p, i) => {
    p.flat = Math.PI / 2 - 0.012 * (ordered.length - i)
    p.setFold(p.flat)
  })
  return ordered
}

// Stand the pieces up like a pop-up book: back row first, a few 12 fps steps
// each. A piece swings past upright, comes back, and rocks side to side as it
// settles. `ordered` comes from stack(); `onUp(piece)` fires as each one lands.
const RISE = [0.74, 0.42, 0.14, -0.08, -0.03, 0, 0, 0]
const ROCK = [0, 0, 0, 0.04, -0.03, 0.016, -0.006, 0]

export function popUp(stepped, ordered, { gap = 2, onUp } = {}) {
  return Promise.all(
    ordered.map((p, i) => {
      let landed = false
      return stepped.play(
        RISE.length,
        (t) => {
          const k = Math.max(0, Math.round(t * RISE.length) - 1)
          p.setFold(RISE[k] * p.flat)
          p.hinge.rotation.z = ROCK[k]
          if (k >= 3 && !landed) {
            landed = true
            onUp?.(p)
          }
        },
        { delay: i * gap },
      )
    }),
  )
}

// Fold them flat again, front row first.
export function foldFlat(stepped, ordered, gap = 1) {
  const poses = [-0.05, 0.12, 0.4, 0.76, 1]
  return Promise.all(
    [...ordered].reverse().map((p, i) => stepped.poses(poses, (k) => p.setFold(k * p.flat), { delay: i * gap })),
  )
}

// Line boil: each drawing swaps to its next tracing every `hold` ticks, with
// the swaps spread out so the whole scene never changes on the same frame.
// `active()` says whether these drawings are on screen right now.
export function boil(stepped, things, active = () => true, hold = 3) {
  const list = things.filter((t) => t.tracings > 1)
  if (!list.length) return () => {}
  return stepped.every(1, (frame) => {
    if (!active()) return false
    let changed = false
    list.forEach((t, i) => {
      if ((frame + i) % hold === 0) {
        t.next()
        changed = true
      }
    })
    return changed
  })
}
