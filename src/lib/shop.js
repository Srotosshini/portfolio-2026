// Stand-in drawings for the creative coding card shop: booster pack wrappers,
// trading cards and their back, graded slabs, and the bits of a card-shop
// display case (acrylic stands, strip lights, tags, stickers, the sign, the
// binder, the counter mat). Like everything in placeholders.js, each one is
// replaced by her own drawing when the file exists (see the README), and none
// of it is meant to survive to the finished site.
import { PALETTE as P, rng, canvas } from './paper.js'
import { BODY, marker, write, fibres, star } from './placeholders.js'

const HI = P.highlighter
// holographic foil, as a run of pale rainbow colours
const RAINBOW = ['#ff92d2', '#ffd27e', '#fff39c', '#a2f5c8', '#90d8ff', '#bba4ff', '#ff92d2']

const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
// a colour part of the way to another (both '#rrggbb')
export const mix = (a, b, t) => {
  const A = rgbOf(a)
  const B = rgbOf(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

// the corners of a rounded rectangle, for the marker to trace
function roundedPoints(x, y, w, h, r, n = 4) {
  const pts = []
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
  }
  corner(x + w - r, y + r, -Math.PI / 2)
  corner(x + w - r, y + h - r, 0)
  corner(x + r, y + h - r, Math.PI / 2)
  corner(x + r, y + r, Math.PI)
  return pts
}
function trace(ctx, pts) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

// Holographic foil across a rectangle: two runs of the rainbow on a diagonal.
function foil(ctx, x, y, w, h, { flip = false } = {}) {
  const g = flip ? ctx.createLinearGradient(x + w, y, x, y + h) : ctx.createLinearGradient(x, y, x + w, y + h)
  const stops = [...RAINBOW, ...RAINBOW.slice(1)]
  stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color))
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

// little four-point glints scattered over foil
function glints(ctx, x, y, w, h, count, r, color = '#ffffff') {
  ctx.save()
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    const gx = x + r() * w
    const gy = y + r() * h
    const s = 3 + r() * 9
    ctx.globalAlpha = 0.45 + r() * 0.5
    ctx.beginPath()
    ctx.moveTo(gx, gy - s)
    ctx.lineTo(gx + s * 0.28, gy - s * 0.28)
    ctx.lineTo(gx + s, gy)
    ctx.lineTo(gx + s * 0.28, gy + s * 0.28)
    ctx.lineTo(gx, gy + s)
    ctx.lineTo(gx - s * 0.28, gy + s * 0.28)
    ctx.lineTo(gx - s, gy)
    ctx.lineTo(gx - s * 0.28, gy - s * 0.28)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

// a shiny streak across something glossy
function gloss(ctx, w, h, alpha = 0.3) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(w * 0.08, h)
  ctx.lineTo(w * 0.36, h)
  ctx.lineTo(w * 0.98, h * 0.1)
  ctx.lineTo(w * 0.86, 0)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = alpha * 1.5
  ctx.beginPath()
  ctx.moveTo(w * 0.42, h)
  ctx.lineTo(w * 0.47, h)
  ctx.lineTo(w, h * 0.32)
  ctx.lineTo(w, h * 0.25)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// Old paper and old card: a yellow wash, fold creases, scuffed corners.
function aged(ctx, w, h, r, { creases = 2, specks = 160 } = {}) {
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = 'rgba(243, 222, 168, 0.35)'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < creases; i++) {
    const y0 = h * (0.25 + r() * 0.6)
    const y1 = y0 + (r() - 0.5) * h * 0.3
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255, 252, 240, 0.55)'
    ctx.beginPath()
    ctx.moveTo(-4, y0)
    ctx.lineTo(w + 4, y1)
    ctx.stroke()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(90, 65, 30, 0.28)'
    ctx.beginPath()
    ctx.moveTo(-4, y0 + 3)
    ctx.lineTo(w + 4, y1 + 3)
    ctx.stroke()
  }
  for (let i = 0; i < specks; i++) {
    const edge = r() < 0.5
    const x = edge ? (r() < 0.5 ? r() * 18 : w - r() * 18) : r() * w
    const y = edge ? r() * h : r() < 0.5 ? r() * 18 : h - r() * 18
    ctx.fillStyle = `rgba(255, 252, 240, ${0.3 + r() * 0.5})`
    ctx.fillRect(x, y, 1 + r() * 3, 1 + r() * 3)
  }
  ctx.restore()
}

// ------------------------------------------------------------------ era symbols

// The little symbol for a semester, on its wrapper and on its cards:
// 'skyline' (Shanghai), 'dune' (dunes and a palm), 'leaf', 'moon', 'stamp'
// (the Base Set's "1st ed."). Drawn into any canvas at (cx, cy), `size` across.
export function eraSymbol(ctx, era, cx, cy, size, seed = 1, { color = P.navy } = {}) {
  const s = size / 100
  const m = marker(ctx, seed, { color, width: Math.max(2, 4.6 * s), wobble: 1 * s })
  const p = (pts) => pts.map(([x, y]) => [cx + (x - 50) * s, cy + (y - 50) * s])
  const at = (x, y) => [cx + (x - 50) * s, cy + (y - 50) * s]
  const thin = { width: Math.max(1.5, 3 * s) }
  switch (era) {
    case 'skyline': {
      // the Pearl Tower's two balls on its spire, with towers either side
      m.shape(p([[8, 86], [8, 60], [18, 60], [18, 86]]), P.paper)
      m.shape(p([[20, 86], [20, 46], [27, 40], [33, 46], [33, 86]]), P.paper)
      m.line(p([[44, 86], [49, 64]]))
      m.line(p([[56, 86], [51, 64]]))
      m.blob(...at(50, 58), 8 * s, 8 * s, HI.pink)
      m.line(p([[50, 50], [50, 37]]))
      m.blob(...at(50, 32), 5 * s, 5 * s, HI.pink)
      m.line(p([[50, 27], [50, 8]]), thin)
      m.shape(p([[63, 86], [65, 32], [71, 16], [77, 32], [79, 86]]), P.paper)
      m.line(p([[66, 44], [77, 70]]), thin)
      m.shape(p([[83, 86], [84, 34], [93, 34], [94, 86]]), P.paper)
      m.line(p([[4, 86], [96, 86]]))
      break
    }
    case 'dune': {
      m.blob(...at(76, 24), 11 * s, 11 * s, HI.yellow)
      m.shape(p([[4, 88], [4, 72], [22, 64], [42, 62], [60, 72], [78, 64], [96, 70], [96, 88]]), '#f2d79f')
      m.line(p([[12, 88], [34, 76], [58, 82]]), thin)
      m.line(p([[30, 66], [32, 48], [37, 30]]), { width: Math.max(2, 6 * s) })
      for (const leaf of [[[37, 30], [24, 25], [14, 33]], [[37, 30], [29, 15], [18, 12]], [[37, 30], [46, 16], [57, 16]], [[37, 30], [52, 28], [60, 37]]]) m.line(p(leaf))
      break
    }
    case 'leaf': {
      m.shape(p([[50, 90], [26, 66], [22, 40], [38, 18], [56, 10], [72, 26], [78, 50], [68, 72]]), HI.green)
      m.line(p([[50, 90], [48, 62], [52, 36], [58, 18]]))
      m.line(p([[48, 66], [34, 54]]), thin)
      m.line(p([[50, 50], [66, 40]]), thin)
      m.line(p([[52, 36], [40, 28]]), thin)
      break
    }
    case 'moon': {
      const outer = []
      const inner = []
      for (let a = 60; a <= 300; a += 20) outer.push([50 + 34 * Math.cos((a * Math.PI) / 180), 52 + 34 * Math.sin((a * Math.PI) / 180)])
      for (let a = 300; a >= 60; a -= 20) inner.push([62 + 27 * Math.cos((a * Math.PI) / 180), 47 + 27 * Math.sin((a * Math.PI) / 180)])
      m.shape(p([...outer, ...inner]), HI.yellow)
      m.shape(p(star(80, 22, 9)), P.paper, thin)
      m.shape(p(star(86, 58, 6)), P.paper, thin)
      m.shape(p(star(66, 84, 5)), P.paper, thin)
      break
    }
    case 'stamp':
    default: {
      m.blob(cx, cy, 44 * s, 44 * s, null)
      m.blob(cx, cy, 36 * s, 36 * s, null, thin)
      write(ctx, '1st ed.', cx, cy, { size: 34 * s, max: 62 * s, color, tilt: -0.22 })
      m.shape(p(star(50, 20, 5)), color, thin)
      m.shape(p(star(50, 80, 5)), color, thin)
      break
    }
  }
}

// ------------------------------------------------------------------ booster packs

// where the tear line is, as a fraction of the pack's height from the top
export const TEAR = 0.14
const PACK_W = 480
const PACK_H = 700

// The pack's outline: crimped (zigzag) top and bottom, straight sides.
function packOutline(w, h) {
  const pts = []
  const n = Math.round((w - 16) / 16)
  const step = (w - 16) / n
  for (let i = 0; i <= n; i++) pts.push([8 + i * step, i % 2 ? 4 : 18])
  for (let i = n; i >= 0; i--) pts.push([8 + i * step, i % 2 ? h - 4 : h - 18])
  return pts
}

// what a wrapper is printed on: foil, gloss, matte or old paper
function wrapperFill(ctx, set, w, h, r) {
  const color = set.color
  switch (set.wrapper) {
    case 'holo':
      foil(ctx, 0, 0, w, h)
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.42
      ctx.fillStyle = mix(color, '#ffffff', 0.25)
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
      glints(ctx, 0, 0, w, h, 46, r)
      break
    case 'foil': {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      // brushed metal: pale and dark bands on a slant
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(-0.5)
      for (let i = -9; i <= 9; i++) {
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.22)' : i % 3 === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,30,0.1)'
        ctx.fillRect(-w, i * 52, w * 2, 26 + r() * 14)
      }
      ctx.restore()
      glints(ctx, 0, 0, w, h, 14, r)
      break
    }
    case 'glossy':
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      gloss(ctx, w, h, 0.22)
      break
    case 'matte':
      ctx.fillStyle = mix(color, '#efe6d2', 0.32)
      ctx.fillRect(0, 0, w, h)
      break
    case 'vintage':
    default:
      ctx.fillStyle = mix(color, '#e7d8b5', 0.46)
      ctx.fillRect(0, 0, w, h)
      aged(ctx, w, h, r, { creases: 3, specks: 260 })
      break
  }
}

// the crimped seals at the top and bottom of a pack
function crimps(ctx, w, h) {
  for (const [y0, y1] of [[0, 46], [h - 46, h]]) {
    ctx.fillStyle = 'rgba(20, 20, 40, 0.12)'
    ctx.fillRect(0, y0, w, y1 - y0)
    for (let x = 4; x < w; x += 7) {
      ctx.fillStyle = (x / 7) % 2 < 1 ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,20,0.14)'
      ctx.fillRect(x, y0, 3, y1 - y0)
    }
  }
}

// The serrated line to tear along, with a notch at the left to start it.
function tearLine(ctx, w, h) {
  const y = h * TEAR
  ctx.save()
  ctx.lineJoin = 'miter'
  const teeth = (dy, color, width) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    for (let x = 6, i = 0; x <= w - 6; x += 7, i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, x, y + dy + (i % 2 ? -4 : 4))
    ctx.stroke()
  }
  teeth(3, 'rgba(0, 0, 30, 0.3)', 3)
  teeth(0, '#ffffff', 3.5)
  // the notch
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.moveTo(0, y - 13)
  ctx.lineTo(22, y)
  ctx.lineTo(0, y + 13)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// A booster pack, front. `count` is written on it ("6 cards"); `eraImage` is
// her drawing of the era symbol, if she has made it.
export function packFront(set, { count = '', eraImage = null, seed = 1 } = {}) {
  const w = PACK_W
  const h = PACK_H
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  const r = rng(seed * 61 + set.order * 7)
  const outline = packOutline(w, h)
  // the white cut edge all the way round
  trace(ctx, outline)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 10
  ctx.strokeStyle = P.cut
  ctx.stroke()
  ctx.save()
  trace(ctx, outline)
  ctx.clip()
  wrapperFill(ctx, set, w, h, r)
  crimps(ctx, w, h)
  tearLine(ctx, w, h)

  let y = h * TEAR + 44
  if (set.title) {
    // the Base Set's name on a ribbon
    const m = marker(ctx, seed + 3, { width: 4, wobble: 1.2 })
    m.shape([[56, y - 34], [w - 56, y - 38], [w - 40, y - 2], [w - 56, y + 34], [56, y + 36], [40, y]], '#fbf3df')
    write(ctx, set.title, w / 2, y, { size: 50, max: w - 150 })
    y += 30
  }

  // the era badge: a paper disc (foil on a foil wrapper) with the symbol on it
  const badge = { x: w / 2, y: y + 150, r: 118 }
  const m = marker(ctx, seed, { width: 5, wobble: 1.3 })
  if (set.wrapper === 'foil') {
    ctx.save()
    ctx.beginPath()
    ctx.arc(badge.x, badge.y, badge.r, 0, Math.PI * 2)
    ctx.clip()
    foil(ctx, badge.x - badge.r, badge.y - badge.r, badge.r * 2, badge.r * 2, { flip: true })
    glints(ctx, badge.x - badge.r, badge.y - badge.r, badge.r * 2, badge.r * 2, 10, r)
    ctx.restore()
    m.blob(badge.x, badge.y, badge.r, badge.r, null)
  } else {
    m.blob(badge.x, badge.y, badge.r, badge.r, set.wrapper === 'vintage' ? '#f3e8cc' : '#fffcf3')
  }
  if (eraImage) {
    const k = Math.min((badge.r * 1.5) / eraImage.width, (badge.r * 1.5) / eraImage.height)
    ctx.drawImage(eraImage, badge.x - (eraImage.width * k) / 2, badge.y - (eraImage.height * k) / 2, eraImage.width * k, eraImage.height * k)
  } else eraSymbol(ctx, set.era, badge.x, badge.y, badge.r * 1.6, seed)

  // the semester, in her handwriting, on a strip of paper (and the place under it)
  const ly = badge.y + badge.r + 70
  const lh = set.place ? 120 : 88
  const label = marker(ctx, seed + 5, { width: 4, wobble: 1.2 })
  ctx.save()
  ctx.translate(w / 2, ly)
  ctx.rotate(-0.035)
  label.shape([[-175, -lh / 2], [175, -lh / 2 - 4], [178, lh / 2], [-178, lh / 2 + 3]], '#fffdf6')
  write(ctx, set.name, 0, set.place ? -20 : 0, { size: 64, max: 320 })
  if (set.place) write(ctx, set.place, 0, 34, { size: 38, max: 300, color: P.pencil })
  ctx.restore()

  // how many cards are in it, on a round sticker at the bottom right
  if (count) {
    const cx = w - 92
    const cy = h - 112
    marker(ctx, seed + 7, { width: 4, wobble: 1 }).blob(cx, cy, 52, 52, HI.yellow)
    write(ctx, count, cx, cy, { size: 34, max: 84, maxH: 80, lines: 2, tilt: -0.12 })
  }

  // the Base Set's stamp
  if (set.stamp) {
    const [top, bottom] = set.stamp.split('·').map((part) => part.trim())
    ctx.save()
    ctx.translate(112, h - 122)
    ctx.rotate(-0.28)
    ctx.globalAlpha = 0.82
    const ink = '#b2382f'
    const stamp = marker(ctx, seed + 9, { color: ink, width: 4, wobble: 1.4 })
    stamp.blob(0, 0, 76, 76, null)
    stamp.blob(0, 0, 64, 64, null, { width: 2.5 })
    write(ctx, top || '', 0, -16, { size: 30, max: 104, color: ink })
    write(ctx, bottom || '', 0, 20, { size: 24, max: 104, color: ink })
    ctx.restore()
  }
  ctx.restore()

  marker(ctx, seed + 11, { width: 3, wobble: 0.8 }).shape(outline, null)
  fibres(ctx)
  return c
}

// The back of a pack, as it looks from behind (the room mirrors it onto the
// back of the wrapper).
export function packBack(set, seed = 1) {
  const w = PACK_W
  const h = PACK_H
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  const r = rng(seed * 67 + set.order)
  const outline = packOutline(w, h)
  trace(ctx, outline)
  ctx.lineWidth = 10
  ctx.strokeStyle = P.cut
  ctx.stroke()
  ctx.save()
  trace(ctx, outline)
  ctx.clip()
  wrapperFill(ctx, set, w, h, r)
  crimps(ctx, w, h)
  // a paper panel of small print (squiggles) and a strip of barcode
  const m = marker(ctx, seed, { width: 4, wobble: 1.2 })
  m.shape([[80, 170], [400, 166], [404, 560], [76, 564]], '#fffcf3')
  eraSymbol(ctx, set.era, w / 2, 250, 110, seed)
  for (let i = 0; i < 6; i++) {
    const y = 340 + i * 26
    const pts = []
    for (let x = 110; x < 370 - r() * 60; x += 14) pts.push([x, y + Math.sin(x * 0.3 + i) * 3])
    marker(ctx, seed + i, { width: 2.2, wobble: 0.6, color: P.pencil }).line(pts)
  }
  for (let x = 150; x < 330; x += 4 + Math.floor(r() * 5)) {
    ctx.fillStyle = P.navy
    ctx.fillRect(x, 506, 1 + Math.floor(r() * 3), 36)
  }
  ctx.restore()
  marker(ctx, seed + 11, { width: 3, wobble: 0.8 }).shape(outline, null)
  fibres(ctx)
  return c
}

// The wrapper once the cards are out: scrunched into a ball.
export function crumpled(set, seed = 1) {
  const c = canvas(300, 280)
  const ctx = c.getContext('2d')
  const r = rng(seed * 89 + set.order)
  const pts = []
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    const rad = (i % 2 ? 96 : 118) + (r() - 0.5) * 30
    pts.push([150 + Math.cos(a) * rad, 140 + Math.sin(a) * rad * 0.9])
  }
  trace(ctx, pts)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 10
  ctx.strokeStyle = P.cut
  ctx.stroke()
  ctx.save()
  trace(ctx, pts)
  ctx.clip()
  wrapperFill(ctx, set, 300, 280, r)
  // the creases: a light edge and a dark edge each
  for (let i = 0; i < 14; i++) {
    const x = 40 + r() * 220
    const y = 30 + r() * 220
    const crease = [[x, y], [x + (r() - 0.5) * 90, y + (r() - 0.5) * 90], [x + (r() - 0.5) * 140, y + (r() - 0.5) * 140]]
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
    trace(ctx, crease)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(10, 10, 40, 0.3)'
    ctx.beginPath()
    crease.forEach(([px, py], k) => (k ? ctx.lineTo(px + 3, py + 3) : ctx.moveTo(px + 3, py + 3)))
    ctx.stroke()
  }
  ctx.restore()
  marker(ctx, seed, { width: 4, wobble: 1.4 }).shape(pts, null)
  fibres(ctx)
  return c
}

// ------------------------------------------------------------------ the cards

// Where things sit on a card, as fractions of its width and height:
// [x, y, w, h] (the era badge is [cx, cy, r], r a fraction of the width).
// The HTML card lays its words and picture over these same places.
export const CARD = {
  w: 630,
  h: 880,
  radius: 34,
  title: [0.075, 0.034, 0.69, 0.088],
  era: [0.865, 0.078, 0.075],
  pic: [0.07, 0.143, 0.86, 0.452],
  uses: [0.07, 0.612, 0.86, 0.088],
  stats: [0.07, 0.708, 0.86, 0.152],
  foot: [0.07, 0.876, 0.86, 0.074],
}

// A card's face, without its words or picture: the border in the set's
// colour and finish, the panel, the picture window and the era badge.
// finish: 'holo', 'glossy', 'matte' or 'worn'.
export function cardFrame(set, finish, { eraImage = null, seed = 1 } = {}) {
  const W = CARD.w
  const H = CARD.h
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 43 + set.order * 5 + finish.length)
  const edge = roundedPoints(4, 4, W - 8, H - 8, CARD.radius)
  ctx.save()
  trace(ctx, edge)
  ctx.clip()

  // the border
  if (finish === 'holo') {
    foil(ctx, 0, 0, W, H)
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.35
    ctx.fillStyle = mix(set.color, '#ffffff', 0.2)
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
    glints(ctx, 0, 0, W, H, 40, r)
  } else if (finish === 'glossy') {
    ctx.fillStyle = set.color
    ctx.fillRect(0, 0, W, H)
  } else if (finish === 'matte') {
    ctx.fillStyle = mix(set.color, '#efe6d2', 0.3)
    ctx.fillRect(0, 0, W, H)
  } else {
    ctx.fillStyle = mix(set.color, '#e2d2a8', 0.5)
    ctx.fillRect(0, 0, W, H)
  }

  // the panel the words and picture sit on
  const inset = 24
  const panel = finish === 'worn' ? '#efe2c2' : finish === 'matte' ? '#f7f0e0' : '#fcf8ee'
  const pm = marker(ctx, seed + 1, { width: 3, wobble: 1 })
  pm.shape(roundedPoints(inset, inset, W - inset * 2, H - inset * 2, CARD.radius - 12), panel)
  const box = ([x, y, w, h]) => [x * W, y * H, w * W, h * H]

  // the title band, in a pale tint of the set's colour
  const [tx, ty, tw, th] = box(CARD.title)
  ctx.fillStyle = mix(set.color, finish === 'worn' ? '#f1e5c6' : '#ffffff', 0.74)
  ctx.fillRect(inset + 8, ty - 4, W - (inset + 8) * 2, th + 8)
  pm.line([[inset + 8, ty + th + 4], [W - inset - 8, ty + th + 3]], { width: 2.5 })

  // the picture window
  const [px, py, pw, ph] = box(CARD.pic)
  marker(ctx, seed + 2, { width: 5, wobble: 1 }).rect(px - 3, py - 3, pw + 6, ph + 6, '#16161c')

  // rules under the uses and the stats, and over the foot
  const [, uy, , uh] = box(CARD.uses)
  const [, sy, , sh] = box(CARD.stats)
  const rule = marker(ctx, seed + 3, { width: 2, wobble: 0.8, color: P.pencil })
  rule.line([[px, uy + uh + 3], [px + pw, uy + uh + 2]])
  rule.line([[px, sy + sh + 3], [px + pw, sy + sh + 4]])

  // the era badge
  const [ex, ey, er] = CARD.era
  marker(ctx, seed + 4, { width: 4, wobble: 1 }).blob(ex * W, ey * H, er * W, er * W, '#fffcf3')
  if (eraImage) {
    const size = er * W * 1.5
    const k = Math.min(size / eraImage.width, size / eraImage.height)
    ctx.drawImage(eraImage, ex * W - (eraImage.width * k) / 2, ey * H - (eraImage.height * k) / 2, eraImage.width * k, eraImage.height * k)
  } else eraSymbol(ctx, set.era, ex * W, ey * H, er * W * 1.55, seed)

  // the finish
  if (finish === 'glossy') gloss(ctx, W, H, 0.16)
  if (finish === 'worn' || finish === 'matte') aged(ctx, W, H, r, finish === 'worn' ? { creases: 1, specks: 220 } : { creases: 0, specks: 60 })
  if (finish === 'worn') {
    // corners rubbed white with handling
    ctx.fillStyle = 'rgba(255, 251, 238, 0.7)'
    for (const [cx, cy] of [[10, 10], [W - 10, 10], [W - 10, H - 10], [10, H - 10]]) {
      ctx.beginPath()
      ctx.arc(cx, cy, 22 + r() * 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  marker(ctx, seed + 5, { width: 5, wobble: 1.1 }).shape(edge, null)
  fibres(ctx)
  return c
}

// The shared card back: her doodle on navy. (Her own: drawings/card-back.png.)
export function cardBack(seed = 1) {
  const W = CARD.w
  const H = CARD.h
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const edge = roundedPoints(4, 4, W - 8, H - 8, CARD.radius)
  trace(ctx, edge)
  ctx.fillStyle = P.navy
  ctx.fill()
  const m = marker(ctx, seed, { color: P.periwinkle, width: 5, wobble: 1.4 })
  m.shape(roundedPoints(30, 30, W - 60, H - 60, CARD.radius - 10), null)
  m.shape(roundedPoints(46, 46, W - 92, H - 92, CARD.radius - 14), null, { width: 2.5 })
  const w = marker(ctx, seed + 1, { color: P.paper, width: 7, wobble: 2 })
  w.blob(W / 2, H / 2, 190, 250, null)
  w.shape(star(W / 2, H / 2, 128, 0.42), HI.yellow)
  for (const [x, y] of [[110, 120], [W - 110, 120], [W - 110, H - 120], [110, H - 120]]) w.shape(star(x, y, 30, 0.45), null, { width: 4 })
  // a spiral, for the loops of a sketch
  const spiral = []
  for (let a = 0; a < Math.PI * 5; a += 0.3) spiral.push([W / 2 + Math.cos(a) * (8 + a * 5.5), H / 2 + 8 + Math.sin(a) * (8 + a * 5.5)])
  marker(ctx, seed + 2, { color: P.navy, width: 5, wobble: 0.8 }).line(spiral)
  fibres(ctx)
  return c
}

// A card in a graded slab, for the showcase: the clear plastic case, a label
// with the card's name, and the card inside it. `frame` is the set's
// cardFrame(); `pic` comes back as where the picture goes, in pixels, so the
// room can draw its moving picture into it.
export function slab(frame, title, seed = 1) {
  const W = 220
  const H = 310
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3, wobble: 0.8 })
  m.shape(roundedPoints(4, 4, W - 8, H - 8, 16), '#dfe6ef')
  m.rect(16, 14, W - 32, 52, '#fffdf8', { width: 2.5 })
  ctx.fillStyle = '#d0453c'
  ctx.fillRect(19, 17, 7, 46)
  write(ctx, title, W / 2 + 6, 40, { size: 17, max: W - 62, maxH: 44, lines: 2, font: BODY, weight: 700 })
  ctx.fillStyle = '#c9d2df'
  ctx.fillRect(22, 76, W - 44, H - 92)
  const card = { x: 30, y: 82, w: 160, h: 223 }
  ctx.drawImage(frame, card.x, card.y, card.w, card.h)
  // the plastic's shine
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = '#ffffff'
  ctx.lineCap = 'round'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(30, 150)
  ctx.lineTo(96, 84)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(40, 172)
  ctx.lineTo(112, 100)
  ctx.stroke()
  ctx.restore()
  const [px, py, pw, ph] = CARD.pic
  return { canvas: c, pic: { x: card.x + px * card.w, y: card.y + py * card.h, w: pw * card.w, h: ph * card.h } }
}

// ------------------------------------------------------------------ the display case

// A clear acrylic stand a pack leans on: a plate and a lip at the front.
export function acrylicStand() {
  const c = canvas(300, 380)
  const ctx = c.getContext('2d')
  ctx.lineJoin = 'round'
  const plate = roundedPoints(24, 16, 252, 330, 26)
  trace(ctx, plate)
  ctx.fillStyle = 'rgba(205, 228, 255, 0.16)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.fillStyle = 'rgba(205, 228, 255, 0.32)'
  ctx.fillRect(4, 334, 292, 42)
  ctx.strokeRect(4, 334, 292, 42)
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(48, 60)
  ctx.lineTo(48, 300)
  ctx.stroke()
  return c
}

// A little paper strip light, hung over a pack. `on`: its underside glows.
export function stripLight(on, seed = 1) {
  const c = canvas(440, 110)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.line([[60, 30], [60, 4]], { width: 3 })
  m.line([[380, 30], [380, 4]], { width: 3 })
  m.shape(roundedPoints(10, 22, 420, 54, 18), '#f3eee2')
  m.shape(roundedPoints(18, 62, 404, 34, 12), on ? '#ffeeb0' : '#d6d1c4', { width: 3 })
  if (on) {
    ctx.fillStyle = '#fffbe6'
    ctx.fillRect(40, 72, 360, 10)
  }
  fibres(ctx)
  return c
}

// A paper tag, the kind tied to things in a shop, with its words on it.
export function shopTag(text, seed = 1) {
  const c = canvas(600, 150)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3, wobble: 1 })
  m.shape([[48, 10], [588, 8], [592, 140], [48, 142], [10, 76]], '#fffaf0')
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(44, 76, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  m.blob(44, 76, 12, 12, null, { width: 2.5 })
  fibres(ctx)
  write(ctx, text, 324, 77, { size: 50, max: 500 })
  return c
}

// A sticker: a starburst ('burst') or a round one ('round').
export function sticker(text, { kind = 'burst', color = HI.yellow, ink = P.navy, seed = 1 } = {}) {
  const c = canvas(320, 320)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.2 })
  if (kind === 'burst') {
    const pts = Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2
      const rad = i % 2 ? 128 : 152
      return [160 + Math.cos(a) * rad, 160 + Math.sin(a) * rad]
    })
    m.shape(pts, color)
  } else {
    m.blob(160, 160, 148, 148, color)
    m.blob(160, 160, 124, 124, null, { width: 2.5, color: ink })
  }
  write(ctx, text, 160, 160, { size: 62, max: kind === 'burst' ? 220 : 200, maxH: 190, lines: 3, color: ink, tilt: -0.18 })
  return c
}

// A small card on two strings: the sign hung in the case.
export function hangingSign(text, seed = 1) {
  const c = canvas(640, 270)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.3 })
  m.shape([[18, 22], [622, 16], [624, 252], [16, 256]], '#fffdf6')
  m.shape([[32, 36], [608, 31], [609, 238], [31, 242]], null, { width: 2, color: P.pencil })
  for (const x of [64, 576]) m.blob(x, 52, 9, 9, P.navy, { width: 2 })
  fibres(ctx)
  write(ctx, text, 320, 150, { size: 54, max: 540, maxH: 160, lines: 2 })
  return c
}

// A note on paper, taped on at two corners.
export function tapedNote(text, seed = 1) {
  const c = canvas(760, 230)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.4 })
  m.shape([[24, 30], [736, 22], [740, 204], [20, 210]], '#fffdf6')
  fibres(ctx)
  write(ctx, text, 380, 118, { size: 54, max: 660, maxH: 160, lines: 2 })
  ctx.fillStyle = P.tape
  for (const [x, y, a] of [[44, 34, -0.6], [716, 28, 0.5]]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.globalAlpha = 0.92
    ctx.fillRect(-46, -15, 92, 30)
    ctx.restore()
  }
  return c
}

// The ring binder that stands on the counter, cover on, with its name on a label.
export function binder(title, seed = 1) {
  const c = canvas(560, 700)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5, wobble: 1.4 })
  m.shape([[44, 18], [540, 14], [544, 684], [40, 688]], '#3d55b4')
  m.shape([[18, 18], [80, 18], [80, 688], [18, 688]], '#2b3d86')
  for (const y of [150, 352, 554]) m.blob(48, y, 18, 26, '#cfd4de', { width: 3 })
  m.shape([[150, 110], [470, 106], [472, 214], [148, 218]], '#fffdf6')
  fibres(ctx)
  write(ctx, title, 310, 162, { size: 60, max: 290 })
  const r = rng(seed)
  for (let i = 0; i < 3; i++)
    marker(ctx, seed + i, { width: 3, wobble: 1 }).shape(star(160 + r() * 280, 300 + r() * 120, 18 + r() * 10, 0.45), [HI.yellow, HI.pink, HI.green][i])
  return c
}

// The counter mat the packs are opened on: green felt, a drawn border.
export function counterMat(seed = 1) {
  const W = 1024
  const H = 448
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 13)
  ctx.fillStyle = '#245a4b'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 5200; i++) {
    const x = r() * W
    const y = r() * H
    const len = 3 + r() * 10
    const a = r() * Math.PI
    ctx.strokeStyle = `rgba(${r() < 0.5 ? '10,40,30' : '150,215,190'},${0.06 + r() * 0.1})`
    ctx.lineWidth = 0.8 + r()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  const m = marker(ctx, seed, { color: '#e9e2c9', width: 4, wobble: 1.2 })
  m.shape([[22, 22], [W - 22, 20], [W - 20, H - 22], [20, H - 20]], null)
  m.shape([[36, 36], [W - 36, 34], [W - 34, H - 36], [34, H - 34]], null, { width: 2 })
  for (const [x, y] of [[70, 70], [W - 70, 70], [W - 70, H - 70], [70, H - 70]]) m.shape(star(x, y, 18, 0.45), HI.yellow, { width: 3 })
  ctx.globalAlpha = 0.18
  marker(ctx, seed + 1, { color: '#e9e2c9', width: 6, wobble: 2 }).blob(W / 2, H / 2, 150, 110, null)
  ctx.globalAlpha = 1
  return c
}

// The front of a step in the staircase: white card, inked round the edge.
// `w` and `h` in scene units.
export function stepFront(w, h, seed = 1) {
  const k = 220
  const c = canvas(Math.round(w * k), Math.max(24, Math.round(h * k)))
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#f4ede0'
  ctx.fillRect(0, 0, c.width, c.height)
  fibres(ctx)
  marker(ctx, seed, { width: 4, wobble: 1 }).shape([[3, 3], [c.width - 3, 3], [c.width - 3, c.height - 3], [3, c.height - 3]], null)
  return c
}

// A soft band of rainbow, for the moving shine on a holographic wrapper.
export function shimmer() {
  const c = canvas(512, 4)
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 512, 0)
  const stops = ['#000000', '#000000', '#ff6fc8', '#ffd36a', '#7ff2b6', '#6ac8ff', '#a98bff', '#000000', '#000000']
  stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 4)
  return c
}

