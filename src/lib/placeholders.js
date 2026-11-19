// Stand-in drawings and materials, so the site works (and looks like a paper
// diorama) before any real artwork exists.
// Every one of these is replaced by dropping a real file into /public (see the
// README). Nothing
// in this file is meant to survive to the finished site. They carry no
// writing except the names that tell them apart.
import { PALETTE as P, rng, canvas } from './paper.js'

export const HAND = '"Shelf Hand", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive'
export const BODY = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const HI = P.highlighter

// ------------------------------------------------------------------ tools

// A wobbly marker. Each seed gives a slightly different tracing of the same
// shapes, which is what makes the placeholder lines boil.
export function marker(ctx, seed, { color = P.navy, width = 7, wobble = 2.2 } = {}) {
  const rnd = rng(seed * 7919 + 13)
  const j = (amp = wobble) => (rnd() - 0.5) * 2 * amp
  // a polyline broken into short, slightly wandering segments
  const wander = (pts, closed) => {
    const out = []
    const last = closed ? pts.length : pts.length - 1
    for (let i = 0; i < last; i++) {
      const [x, y] = pts[i]
      const [nx, ny] = pts[(i + 1) % pts.length]
      const steps = Math.max(1, Math.round(Math.hypot(nx - x, ny - y) / 34))
      for (let s = 0; s < steps; s++) out.push([x + ((nx - x) * s) / steps + j(), y + ((ny - y) * s) / steps + j()])
    }
    if (!closed) out.push([pts[pts.length - 1][0] + j(), pts[pts.length - 1][1] + j()])
    return out
  }
  const trace = (points, closed) => {
    ctx.beginPath()
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    if (closed) ctx.closePath()
  }
  // marker ink: one full pass, then a thinner pass a hair off it, so the line is never perfectly even
  const ink = (points, closed, o = {}) => {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = o.color || color
    ctx.globalAlpha = 0.92
    ctx.lineWidth = o.width || width
    trace(points, closed)
    ctx.stroke()
    ctx.globalAlpha = 0.5
    ctx.lineWidth = (o.width || width) * 0.55
    trace(points.map(([x, y]) => [x + j(1.1), y + j(1.1)]), closed)
    ctx.stroke()
    ctx.restore()
  }
  const m = {
    rnd,
    line(pts, o) {
      ink(wander(pts, false), false, o)
    },
    // filled with `fill` (if given) and outlined along exactly the same edge
    shape(pts, fill, o = {}) {
      const points = wander(pts, true)
      if (fill) {
        trace(points, true)
        ctx.fillStyle = fill
        ctx.fill()
      }
      if (o.stroke !== false) ink(points, true, o)
    },
    rect(x, y, w, h, fill, o) {
      m.shape([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, o)
    },
    blob(cx, cy, rx, ry, fill, o) {
      m.shape(oval(cx, cy, rx, ry), fill, o)
    },
    // cut a window right through the paper, then ink its edge
    hole(pts) {
      const points = wander(pts, true)
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = '#000'
      trace(points, true)
      ctx.fill()
      ctx.restore()
      ink(points, true)
    },
    // highlighter: streaky bands laid side by side, darker where they overlap
    highlight(pts, tint, band = 26) {
      const points = wander(pts, true)
      const ys = points.map((p) => p[1])
      const xs = points.map((p) => p[0])
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
      ctx.save()
      trace(points, true)
      ctx.clip()
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = tint
      ctx.lineCap = 'butt'
      ctx.lineWidth = band
      for (let y = y0 + band * 0.3; y < y1 + band * 0.5; y += band * 0.76) {
        ctx.globalAlpha = 0.7 + rnd() * 0.25
        ctx.beginPath()
        ctx.moveTo(x0 - 6 + rnd() * 16, y + j(3))
        ctx.lineTo(x1 + 6 - rnd() * 16, y + j(3))
        ctx.stroke()
      }
      ctx.restore()
    },
  }
  return m
}

export const oval = (cx, cy, rx, ry, n = 16) =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry])

export const star = (cx, cy, R, inner = 0.45) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? R * inner : R
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })

// One tile of paper fibres, laid over anything cut from paper so no fill is
// perfectly flat. It holds still between tracings: lines boil, paper does not.
let fibreTile
export function fibres(ctx) {
  if (!fibreTile) {
    fibreTile = canvas(512, 512)
    const f = fibreTile.getContext('2d')
    const r = rng(404)
    for (let i = 0; i < 2400; i++) {
      const x = r() * 512
      const y = r() * 512
      const len = 3 + r() * 18
      const a = r() * Math.PI
      f.strokeStyle = r() < 0.55 ? `rgba(110,95,70,${0.05 + r() * 0.1})` : `rgba(255,255,255,${0.12 + r() * 0.2})`
      f.lineWidth = 0.6 + r() * 0.9
      f.beginPath()
      f.moveTo(x, y)
      f.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      f.stroke()
    }
  }
  const { width, height } = ctx.canvas
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop' // only where something is already drawn
  for (let y = 0; y < height; y += 512) for (let x = 0; x < width; x += 512) ctx.drawImage(fibreTile, x, y)
  ctx.restore()
}

function wrap(ctx, str, max) {
  const lines = ['']
  for (const word of str.split(' ')) {
    const test = (lines.at(-1) + ' ' + word).trim()
    if (ctx.measureText(test).width > max && lines.at(-1)) lines.push(word)
    else lines[lines.length - 1] = test
  }
  return lines
}

// Text centred on (x, y), shrunk until it fits `max` wide (and `maxH` tall) on at most `lines` lines.
export function write(ctx, str, x, y, { size = 48, max = 1e4, maxH = 1e4, lines = 1, color = P.navy, font = HAND, weight = 600, tilt = 0 } = {}) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  let rows
  for (; ; size -= 2) {
    ctx.font = `${weight} ${size}px ${font}`
    rows = lines > 1 ? wrap(ctx, str, max) : [str]
    const fits = rows.length <= lines && rows.every((r) => ctx.measureText(r).width <= max) && rows.length * size * 1.14 <= maxH
    if (size <= 12 || fits) break
  }
  rows.forEach((row, i) => ctx.fillText(row, 0, (i - (rows.length - 1) / 2) * size * 1.14))
  ctx.restore()
}

// ------------------------------------------------------------------ arcade
// A handmade cardboard arcade. Everything is brown card, kraft, masking tape,
// marker and paper in quiet colours: the only bright things in the room are
// the game screens.

const KRAFT = '#c69b6d'
const KRAFT_DARK = '#8d6440'
// What each cabinet's box was before it was a cabinet (they go round in turn).
const BOXES = [
  { fill: KRAFT, kind: 'shipping' },
  { fill: '#b8624b', kind: 'cereal' }, // a faded tomato-red cereal box
  { fill: '#6c88a8', kind: 'cereal' }, // faded blue
  { fill: '#c9a24f', kind: 'cereal' }, // mustard
  { fill: '#8ea37c', kind: 'cereal' }, // sage
  { fill: '#d8cdb4', kind: 'shipping' }, // a white box gone cream
]
const CAPS = ['#b5523b', '#4f8c8a', '#efe3c4', '#8a8c4a', '#6b5a8a'] // bottle caps, a little faded

// Three box silhouettes, so the row of cabinets is not five of the same
// (drawn for a 640 × 1000 sheet; a taller or shorter box stretches below the screen).
const BODIES = [
  [[46, 104], [150, 96], [172, 26], [292, 36], [318, 98], [346, 30], [468, 24], [490, 100], [598, 108]], // top flaps standing up
  [[78, 160], [34, 46], [610, 36], [570, 162]], // a hood that overhangs the screen
  [[50, 134], [92, 60], [196, 30], [444, 26], [544, 58], [592, 136]], // rounded shoulders
]
const MARQUEES = [
  { band: [[84, 128], [560, 122], [566, 236], [80, 242]], y: 182, h: 104 },
  { band: [[72, 62], [572, 54], [548, 146], [98, 150]], y: 102, h: 84 },
  { band: [[92, 96], [552, 90], [560, 226], [86, 232]], y: 161, h: 122 },
]

// a bottle cap, crimped round its edge, for a button
function bottleCap(m, x, y, r, color) {
  const pts = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2
    const rad = i % 2 ? r : r * 0.88
    return [x + Math.cos(a) * rad, y + Math.sin(a) * rad]
  })
  m.shape(pts, color, { width: 3 })
  m.blob(x, y, r * 0.62, r * 0.62, null, { width: 2 })
}

// a joystick, its stick and ball wrapped in masking tape
function tapedJoystick(ctx, m, x, y, h) {
  m.blob(x, y + 6, 34, 10, '#4a3d33', { width: 3 })
  const stick = [[x - 10, y], [x + 10, y], [x + 8, y - h], [x - 8, y - h]]
  m.shape(stick, P.tape, { width: 3 })
  ctx.save()
  ctx.beginPath()
  stick.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
  ctx.closePath()
  ctx.clip()
  ctx.strokeStyle = 'rgba(140, 112, 55, 0.55)'
  ctx.lineWidth = 2
  for (let k = -h; k < 30; k += 12) {
    ctx.beginPath()
    ctx.moveTo(x - 14, y + k)
    ctx.lineTo(x + 14, y + k - 10)
    ctx.stroke()
  }
  ctx.restore()
  m.blob(x, y - h - 18, 26, 24, P.tape, { width: 3.5 })
  m.line([[x - 22, y - h - 26], [x + 20, y - h - 10]], { width: 2, color: 'rgba(140, 112, 55, 0.7)' })
  m.line([[x - 18, y - h - 8], [x + 22, y - h - 24]], { width: 2, color: 'rgba(140, 112, 55, 0.7)' })
}

// The cut edge of corrugated card: the wavy core between two liners, along
// a line across (x0..x1 at y) or, with down set, a line down (y0..y1 at x).
function corrugatedEdge(ctx, a0, a1, at, depth = 14, down = false) {
  ctx.save()
  ctx.fillStyle = '#e2c69c'
  if (down) ctx.fillRect(at, a0, depth, a1 - a0)
  else ctx.fillRect(a0, at, a1 - a0, depth)
  ctx.strokeStyle = 'rgba(110, 75, 40, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let s = a0; s <= a1; s += 4) {
    const wave = at + depth / 2 + Math.sin(s / 6) * (depth / 2 - 2)
    if (down) ctx.lineTo(wave, s)
    else ctx.lineTo(s, wave)
  }
  ctx.stroke()
  ctx.restore()
}
const mix = (a, b, t) => {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

// A cabinet made from a cardboard box: the game's name lettered in marker, a
// cut-out screen, bottle-cap buttons, a tape-wrapped joystick, a slot for a
// paper token. `style` picks the box (and its height, colour and decoration).
export function cabinet({ title, style = 0 }, seed = 1) {
  const H = [1000, 950, 1050, 980, 1030, 960][style % 6]
  const W = 640
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  const r = rng(seed * 17 + style)
  const kind = style % 3
  const box = BOXES[style % BOXES.length]
  const below = H - 1000 // how much taller (or shorter) than the drawing it was planned on
  const body = [...BODIES[kind], [606, H - 22], [38, H - 14]]
  m.shape(body, box.fill)
  ctx.save()
  ctx.beginPath()
  body.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.clip()
  // the card's own texture: faint ribs showing through, scuffs
  for (let y = 0; y < H; y += 18) {
    ctx.fillStyle = `rgba(80, 50, 20, ${0.03 + r() * 0.04})`
    ctx.fillRect(0, y, W, 8)
  }
  if (box.kind === 'shipping') {
    // packing tape down the middle of the flaps, and arrows that say which way up
    ctx.fillStyle = 'rgba(222, 196, 140, 0.75)'
    ctx.fillRect(W / 2 - 46, 0, 92, 250)
    m.line([[512, 790 + below], [512, 700 + below]], { width: 5 })
    m.line([[490, 726 + below], [512, 700 + below], [534, 726 + below]], { width: 5 })
    m.line([[560, 790 + below], [560, 700 + below]], { width: 5 })
    m.line([[538, 726 + below], [560, 700 + below], [582, 726 + below]], { width: 5 })
  } else {
    // a cereal box: a bowl, flakes, and a sticker gone pale
    m.blob(150, 880 + below, 70, 30, '#efe3c4', { width: 4 })
    m.shape([[80, 880 + below], [220, 880 + below], [196, 930 + below], [104, 930 + below]], '#efe3c4', { width: 4 })
    for (let i = 0; i < 6; i++) m.blob(110 + i * 16, 866 + below - (i % 2) * 8, 9, 6, mix(box.fill, '#f2d79a', 0.6), { width: 2 })
    m.shape(star(500, 860 + below, 46, 0.6), mix(box.fill, '#ffffff', 0.55), { width: 4 })
  }
  ctx.restore()
  corrugatedEdge(ctx, 170, H - 40, 44, 12, true)
  corrugatedEdge(ctx, 170, H - 40, 584, 12, true)

  // the marquee: the game's name on a strip of paper, in marker
  m.shape(MARQUEES[kind].band, '#f6efdc')
  write(ctx, title, 322, MARQUEES[kind].y, { size: 58, max: 430, maxH: MARQUEES[kind].h, lines: 2 })

  m.shape([[88, 246], [554, 242], [558, 520], [84, 524]], '#3a2c22', { width: 4 }) // the screen's bezel
  m.hole([[108, 262], [534, 258], [538, 500], [104, 504]]) // the screen, 16:9

  // the control panel: a shelf of card, a joystick, bottle caps
  const panel = 590 + below * 0.3
  m.shape([[62, panel - 30], [578, panel - 38], [586, panel + 70], [56, panel + 78]], mix(box.fill, '#000000', 0.12))
  tapedJoystick(ctx, m, 178, panel + 44, 46)
  const caps = 2 + (style % 2)
  for (let i = 0; i < caps; i++) bottleCap(m, 360 + i * 74, panel + 20, 27, CAPS[(style + i) % CAPS.length])

  // the slot a paper token goes into, and a little token drawn beside it
  const slot = H * 0.82
  m.rect(296, slot - 50, 54, 100, '#3a2c22')
  m.line([[323, slot - 28], [323, slot + 28]], { width: 9, color: '#120c08' })
  m.blob(400, slot, 22, 22, '#efe3c4', { width: 3 })
  m.line([[364, slot], [384, slot]], { width: 3 })

  // tape over a corner or two
  ctx.fillStyle = 'rgba(232, 220, 182, 0.92)'
  for (const [x, y, a] of [[60, H - 120, -0.7], [584, 300, 0.6]].slice(0, 1 + (style % 2))) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.fillRect(-46, -14, 92, 28)
    ctx.restore()
  }
  fibres(ctx)
  return c
}

// The token you drop in a cabinet: a hand-drawn paper token.
export function coin(seed = 1) {
  const c = canvas(200, 200)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 7 })
  m.blob(100, 100, 84, 84, '#ead9b4')
  m.blob(100, 100, 62, 62, null, { width: 3.5 })
  m.shape(star(100, 102, 40, 0.45), '#c9a24f', { width: 4 })
  fibres(ctx)
  return c
}

// The claw machine: a tall cardboard box with its glass cut right out.
export function clawMachine(seed = 1, title = 'claw machine') {
  const c = canvas(520, 1000)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  const body = [[36, 100], [72, 30], [450, 24], [486, 96], [492, 978], [30, 986]]
  m.shape(body, KRAFT)
  ctx.save()
  ctx.beginPath()
  body.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.clip()
  for (let y = 0; y < 1000; y += 18) {
    ctx.fillStyle = 'rgba(80, 50, 20, 0.05)'
    ctx.fillRect(0, y, 520, 8)
  }
  ctx.restore()
  corrugatedEdge(ctx, 80, 440, 30, 12)
  m.shape([[70, 50], [452, 44], [460, 120], [62, 126]], '#f6efdc')
  write(ctx, title, 262, 86, { size: 50, max: 360 })
  m.hole([[78, 152], [444, 148], [448, 590], [74, 594]]) // the glass
  m.line([[52, 634], [470, 628]])
  m.rect(84, 706, 150, 150, '#2a1e16') // the prize chute
  m.line([[270, 760], [250, 790], [270, 820]], { width: 5 })
  m.line([[250, 790], [330, 790]], { width: 5 })
  tapedJoystick(ctx, m, 400, 760, 50)
  bottleCap(m, 330, 690, 24, CAPS[0])
  ctx.fillStyle = 'rgba(232, 220, 182, 0.92)'
  for (const [x, y, a] of [[60, 160, -0.6], [460, 160, 0.6], [470, 900, -0.5]]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.fillRect(-44, -13, 88, 26)
    ctx.restore()
  }
  fibres(ctx)
  return c
}

// the claw, cut from grey card
export function claw(seed = 1) {
  const c = canvas(200, 300)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 8 })
  m.rect(86, 8, 28, 150, '#cfcbc2')
  m.shape([[56, 152], [144, 152], [154, 186], [46, 186]], '#cfcbc2')
  m.line([[60, 186], [30, 244], [58, 286]])
  m.line([[100, 186], [100, 278]])
  m.line([[140, 186], [170, 244], [142, 286]])
  fibres(ctx)
  return c
}

// Three stand-in characters for the claw machine, cut from coloured paper.
export function character(index, seed = 1) {
  const c = canvas(220, 270)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 8 })
  const tint = ['#e2c27a', '#9db58a', '#d99a8f'][index % 3]
  const parts =
    index % 3 === 0
      ? [oval(64, 62, 24, 34), oval(156, 62, 24, 34), oval(110, 156, 84, 96)]
      : index % 3 === 1
        ? [[[36, 66], [184, 66], [184, 250], [36, 250]]]
        : [[[110, 28], [198, 246], [22, 246]]]
  if (index % 3 === 1) {
    m.line([[110, 66], [110, 26]])
    m.blob(110, 20, 11, 11, P.paper)
  }
  for (const part of parts) m.shape(part, tint)
  ctx.fillStyle = P.navy
  for (const x of [84, 136]) {
    ctx.beginPath()
    ctx.arc(x, 156, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  m.line([[92, 192], [110, 202], [128, 192]], { width: 6 })
  fibres(ctx)
  return c
}

// The quiet cutout for a project that is not a cabinet: a placard on legs.
export function placard({ title }, seed = 1) {
  const c = canvas(520, 600)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[150, 410], [192, 410], [150, 586], [116, 586]], P.paper)
  m.shape([[330, 410], [372, 410], [404, 586], [370, 586]], P.paper)
  m.shape([[30, 40], [492, 30], [498, 424], [24, 432]], P.paper)
  write(ctx, title, 260, 228, { size: 50, max: 400, lines: 3 })
  fibres(ctx)
  return c
}

// What a cabinet screen plays until it has a clip or a still: a little
// looping doodle, redrawn a few times a second. `index` picks the doodle,
// `frame` counts up.
export function attract(ctx, index, frame, { title }) {
  const tints = Object.values(HI)
  ctx.fillStyle = '#1b1b22'
  ctx.fillRect(0, 0, 240, 135)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const t = frame
  switch (index % 5) {
    case 0: {
      // a ball rattling between two bats
      const x = 30 + Math.abs(((t * 17) % 360) - 180)
      const y = 22 + Math.abs(((t * 11) % 120) - 60)
      ctx.fillStyle = tints[0]
      ctx.fillRect(12, y - 12, 6, 30)
      ctx.fillRect(222, 70 - y * 0.6, 6, 30)
      ctx.beginPath()
      ctx.arc(x, y + 4, 6, 0, 7)
      ctx.fill()
      break
    }
    case 1:
      // patches that keep swapping colour
      for (let i = 0; i < 5; i++)
        for (let k = 0; k < 2; k++) {
          ctx.fillStyle = tints[(i + k * 2 + Math.floor(t / 2)) % 5]
          ctx.fillRect(22 + i * 40 + (k ? 3 : 0), 14 + k * 38, 33, 31)
        }
      break
    case 2: {
      // a wave swimming past
      ctx.strokeStyle = tints[2]
      ctx.lineWidth = 6
      ctx.beginPath()
      for (let x = 10; x <= 230; x += 10) {
        const y = 48 + Math.sin(x / 22 + t * 0.9) * 22
        if (x === 10) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      break
    }
    case 3: {
      // a sun going over a hill
      const a = ((t % 24) / 24) * Math.PI
      ctx.fillStyle = tints[3]
      ctx.beginPath()
      ctx.arc(120 - Math.cos(a) * 92, 86 - Math.sin(a) * 62, 13, 0, 7)
      ctx.fill()
      ctx.strokeStyle = tints[2]
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(8, 90)
      ctx.quadraticCurveTo(120, 56, 232, 90)
      ctx.stroke()
      break
    }
    default: {
      // stars blinking on and off
      const r = rng(9)
      for (let i = 0; i < 10; i++) {
        const x = 16 + r() * 208
        const y = 12 + r() * 70
        if ((i * 3 + t) % 5 > 2) continue
        ctx.fillStyle = tints[i % 5]
        ctx.fillRect(x - 6, y - 1.5, 12, 3)
        ctx.fillRect(x - 1.5, y - 6, 3, 12)
      }
    }
  }
  if (t % 8 < 6) write(ctx, title, 120, 112, { size: 20, max: 222, color: P.paper })
}

// A poster for one of her games, drawn in marker on paper, taped to the wall.
export function arcadePoster(title, index, seed = 1) {
  const c = canvas(420, 560)
  const ctx = c.getContext('2d')
  const r = rng(seed * 29 + index)
  const m = marker(ctx, seed + index, { width: 5, wobble: 1.4 })
  const paper = ['#f3e9d2', '#e9d8b4', '#efe0c9'][index % 3]
  const accent = ['#b5523b', '#4f8c8a', '#c9a24f'][index % 3]
  m.shape([[20, 26], [400, 18], [404, 540], [16, 548]], paper)
  fibres(ctx)
  write(ctx, title, 210, 100, { size: 64, max: 340, maxH: 130, lines: 2 })
  // a doodle of the game: a character, or a little scene
  const d = marker(ctx, seed + index + 7, { width: 6, wobble: 1.6 })
  if (index % 3 === 0) {
    d.blob(210, 320, 92, 86, accent)
    for (const x of [176, 244]) d.blob(x, 302, 12, 14, '#ffffff', { width: 3 })
    d.line([[180, 360], [210, 376], [240, 360]], { width: 5 })
  } else if (index % 3 === 1) {
    d.line([[60, 420], [150, 300], [220, 380], [300, 260], [370, 420]], { width: 7 })
    d.blob(320, 210, 30, 30, accent)
  } else {
    d.shape(star(210, 320, 100, 0.48), accent)
    d.blob(210, 326, 30, 30, null, { width: 4 })
  }
  for (let i = 0; i < 3; i++) d.line([[80, 460 + i * 22], [220 + r() * 120, 460 + i * 22]], { width: 3, color: P.pencil })
  // two strips of tape across the top corners
  ctx.fillStyle = 'rgba(232, 220, 182, 0.92)'
  for (const [x, a] of [[40, -0.6], [380, 0.6]]) {
    ctx.save()
    ctx.translate(x, 30)
    ctx.rotate(a)
    ctx.fillRect(-44, -14, 88, 28)
    ctx.restore()
  }
  return c
}

// A paper bulb for the string of lights overhead: white, so each one can be tinted.
export function paperBulb() {
  const c = canvas(80, 120)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(40, 116)
  ctx.bezierCurveTo(6, 96, 6, 44, 40, 34)
  ctx.bezierCurveTo(74, 44, 74, 96, 40, 116)
  ctx.fill()
  ctx.strokeStyle = 'rgba(120, 90, 50, 0.5)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(40, 40)
  ctx.lineTo(40, 110)
  ctx.stroke()
  ctx.fillStyle = '#4a3d33'
  ctx.fillRect(28, 6, 24, 30)
  return c
}

// The ticket counter: a cardboard counter with a roll of tickets on it.
export function ticketCounter(title, seed = 1) {
  const c = canvas(760, 600)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  // the ticket machine on top: a little box with the roll showing, and a slot
  m.shape([[430, 70], [640, 64], [646, 250], [426, 256]], '#8ea37c')
  m.blob(536, 120, 48, 40, '#efd2b8')
  m.blob(536, 120, 16, 13, '#8d6440', { width: 3 })
  m.rect(470, 210, 140, 18, '#2a1e16')
  // the counter itself
  m.shape([[30, 240], [730, 232], [736, 300], [24, 306]], KRAFT_DARK)
  m.shape([[44, 300], [716, 294], [722, 590], [38, 596]], KRAFT)
  corrugatedEdge(ctx, 40, 720, 300, 12)
  m.shape([[150, 360], [610, 352], [614, 470], [146, 476]], '#f6efdc')
  write(ctx, title, 380, 414, { size: 70, max: 400 })
  // a jar of tickets on the counter
  m.shape([[120, 120], [250, 116], [258, 240], [114, 244]], 'rgba(235, 240, 245, 0.9)')
  for (let i = 0; i < 9; i++) m.rect(130 + (i % 4) * 30, 150 + Math.floor(i / 4) * 30, 26, 16, '#e7b08f', { width: 2 })
  fibres(ctx)
  return c
}

// A strip of paper tickets (they feed out of the ticket machine).
export function ticketStrip(count = 4, seed = 1) {
  const c = canvas(150, 92 * count + 10)
  const ctx = c.getContext('2d')
  for (let i = 0; i < count; i++) {
    const y = 5 + i * 92
    const m = marker(ctx, seed + i, { width: 3, wobble: 0.8 })
    m.shape([[8, y], [142, y], [142, y + 88], [8, y + 88]], '#e7b08f')
    m.rect(22, y + 14, 106, 60, null, { width: 2, color: 'rgba(90, 40, 20, 0.6)' })
    m.shape(star(75, y + 44, 18, 0.45), null, { width: 2.5, color: '#8d3f2a' })
    ctx.strokeStyle = 'rgba(90, 40, 20, 0.6)'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(8, y + 90)
    ctx.lineTo(142, y + 90)
    ctx.stroke()
    ctx.setLineDash([])
  }
  return c
}

// a "fun pass", propped up on the counter
export function funPass(title, seed = 1) {
  const c = canvas(330, 230)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4 })
  m.shape([[14, 22], [316, 14], [320, 214], [12, 220]], '#f3e9d2')
  m.rect(28, 36, 274, 54, '#4f8c8a', { width: 3 })
  write(ctx, title, 165, 64, { size: 40, max: 250, color: '#f3e9d2' })
  m.shape(star(80, 150, 34, 0.45), '#c9a24f', { width: 3 })
  for (let i = 0; i < 3; i++) m.line([[140, 128 + i * 22], [290 - i * 30, 128 + i * 22]], { width: 2.5, color: P.pencil })
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(290, 190, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  fibres(ctx)
  return c
}

// ------------------------------------------------------------------ shelf

// A strip of masking tape with writing on it. The strip itself holds still;
// only the writing shifts between tracings.
export function tape(text, seed = 1, { width = 560, height = 150 } = {}) {
  const c = canvas(width, height)
  const ctx = c.getContext('2d')
  const tear = rng(text.length * 31 + width)
  const top = 12
  const bottom = height - 12
  ctx.beginPath()
  ctx.moveTo(10, top + tear() * 4)
  ctx.lineTo(width - 12, top + tear() * 4)
  for (let y = top + 10; y < bottom; y += 12) ctx.lineTo(width - 4 - tear() * 12, y)
  ctx.lineTo(width - 10, bottom)
  ctx.lineTo(12, bottom - tear() * 4)
  for (let y = bottom - 10; y > top; y -= 12) ctx.lineTo(4 + tear() * 12, y)
  ctx.closePath()
  ctx.fillStyle = P.tape
  ctx.fill()
  ctx.clip()
  // the crepe of masking tape, and the slightly darker edges
  ctx.lineWidth = 1
  for (let x = 6; x < width; x += 4 + tear() * 6) {
    ctx.strokeStyle = `rgba(140, 112, 55, ${0.08 + tear() * 0.16})`
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x + tear() * 3, bottom)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(150, 120, 60, 0.16)'
  ctx.fillRect(0, top, width, 7)
  ctx.fillRect(0, bottom - 7, width, 7)
  const j = rng(seed * 97)
  write(ctx, text, width / 2 + (j() - 0.5) * 4, height / 2 + (j() - 0.5) * 4, {
    size: 64,
    max: width - 70,
    tilt: (j() - 0.5) * 0.014,
  })
  return c
}

// loose things on the shelf: a jar of markers and a roll of tape
export function jar(seed = 1) {
  const c = canvas(360, 520)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  const pens = [P.navy, HI.pink, P.periwinkle, HI.yellow, HI.green]
  pens.forEach((tint, i) => {
    const x = 78 + i * 44
    const lean = (i - 2) * 16
    const pen = [[x + lean, 30 + (i % 2) * 34], [x + 30 + lean, 34 + (i % 2) * 34], [x + 30, 250], [x, 250]]
    m.shape(pen, P.paper)
    m.highlight(pen, tint, 16)
  })
  m.shape([[52, 226], [308, 220], [300, 500], [60, 506]], P.paper)
  m.line([[52, 262], [308, 256]])
  fibres(ctx)
  return c
}

export function tapeRoll(seed = 1) {
  const c = canvas(360, 340)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.blob(180, 170, 160, 156, P.tape)
  m.hole(oval(180, 170, 74, 72))
  m.blob(180, 170, 118, 114, null, { width: 3 })
  fibres(ctx)
  return c
}

// Pencil construction lines on the wall around the shelf: level lines carried
// past each board, the two uprights, a few ticks. `boards` are heights, `half`
// is half the shelf's width, all in scene units; `scale` is pixels per unit.
export function guides({ w, h, boards, half, bottom }, scale = 64) {
  const c = canvas(Math.round(w * scale), Math.round(h * scale))
  const ctx = c.getContext('2d')
  const r = rng(77)
  const X = (x) => (x + w / 2) * scale
  const Y = (y) => (bottom + h - y) * scale // scene y up, canvas y down
  ctx.lineCap = 'round'
  const pencil = (x0, y0, x1, y1) => {
    // a ruled pencil line is not one stroke: it skips and doubles
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 60))
    for (let i = 0; i < n; i++) {
      if (r() < 0.12) continue
      ctx.strokeStyle = `rgba(90, 88, 80, ${0.16 + r() * 0.2})`
      ctx.lineWidth = 1 + r() * 1.2
      ctx.beginPath()
      ctx.moveTo(x0 + ((x1 - x0) * i) / n + r() * 2, y0 + ((y1 - y0) * i) / n + r() * 2)
      ctx.lineTo(x0 + ((x1 - x0) * (i + 1)) / n + r() * 2, y0 + ((y1 - y0) * (i + 1)) / n + r() * 2)
      ctx.stroke()
    }
  }
  const reach = Math.min(1.5, w / 2 - half - 0.15)
  for (const y of boards) {
    pencil(X(-half - reach), Y(y), X(-half - 0.25), Y(y))
    pencil(X(half + 0.25), Y(y), X(half + reach), Y(y))
    for (const x of [-half - reach, half + reach]) pencil(X(x), Y(y) - 9, X(x), Y(y) + 9)
  }
  const top = Math.max(...boards)
  for (const x of [-half, half]) {
    pencil(X(x), Y(top + 0.25), X(x), Y(top + 0.95))
    pencil(X(x) - 9, Y(top + 0.95), X(x) + 9, Y(top + 0.95))
  }
  pencil(X(-half), Y(top + 0.7), X(half), Y(top + 0.7)) // the width, marked off above
  return c
}

// The cut edge of corrugated card: two liners with a wave between them.
export function corrugated(vertical = false) {
  const c = canvas(256, 32)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#d6b285'
  ctx.fillRect(0, 0, 256, 32)
  ctx.fillStyle = '#a57d50'
  ctx.fillRect(0, 0, 256, 4)
  ctx.fillRect(0, 28, 256, 4)
  ctx.strokeStyle = 'rgba(150, 112, 70, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x <= 256; x += 2) {
    const y = 16 + Math.sin((x / 32) * Math.PI * 2) * 9
    if (x) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
  }
  ctx.stroke()
  if (!vertical) return c
  const turned = canvas(32, 256)
  const t = turned.getContext('2d')
  t.translate(32, 0)
  t.rotate(Math.PI / 2)
  t.drawImage(c, 0, 0)
  return turned
}

// ------------------------------------------------------------------ about

export function portrait(seed = 1) {
  const c = canvas(480, 660)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[36, 646], [58, 474], [150, 404], [330, 404], [422, 474], [444, 646]], P.paper)
  m.blob(240, 236, 132, 164, P.paper)
  m.highlight([[70, 500], [410, 500], [430, 640], [50, 640]], P.periwinkle, 30)
  ctx.setLineDash([10, 14]) // pencil guidelines, left in
  m.line([[240, 84], [240, 388]], { color: P.pencil, width: 3 })
  m.line([[116, 250], [364, 250]], { color: P.pencil, width: 3 })
  ctx.setLineDash([])
  fibres(ctx)
  return c
}

// ------------------------------------------------------------------ photography

// One tile of film: black card with sprocket holes punched along both edges.
export function filmBand() {
  const c = canvas(256, 192)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#1d1d22'
  ctx.fillRect(0, 0, 256, 192)
  const holes = (paint) => {
    for (let i = 0; i < 4; i++)
      for (const y of [9, 161]) {
        ctx.beginPath()
        ctx.roundRect(18 + i * 64, y, 28, 22, 5)
        paint()
      }
  }
  ctx.globalCompositeOperation = 'destination-out'
  holes(() => ctx.fill())
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = 'rgba(245, 240, 228, 0.4)' // the pale rim a punch leaves
  ctx.lineWidth = 2
  holes(() => ctx.stroke())
  return c
}

// four paper photo corners, to lay over a photo
export function photoCorners(seed = 1) {
  const c = canvas(300, 210)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.2 })
  const s = 50
  for (const [x, y, dx, dy] of [[4, 4, 1, 1], [296, 4, -1, 1], [296, 206, -1, -1], [4, 206, 1, -1]])
    m.shape([[x, y], [x + dx * s, y], [x, y + dy * s]], '#efe7d2')
  fibres(ctx)
  return c
}

export function reel(seed = 1) {
  const c = canvas(420, 420)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.blob(210, 210, 198, 196, P.paper)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    m.hole(oval(210 + Math.cos(a) * 116, 210 + Math.sin(a) * 116, 42, 42, 12))
  }
  m.blob(210, 210, 44, 42, P.paper)
  m.highlight(oval(210, 210, 40, 38), HI.pink, 16)
  ctx.fillStyle = P.navy
  ctx.beginPath()
  ctx.arc(210, 210, 9, 0, 7)
  ctx.fill()
  fibres(ctx)
  return c
}

// film wound onto a reel: a dark roll with faint rings (scaled to how much is on it)
export function filmRoll() {
  const c = canvas(256, 256)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#26262c'
  ctx.beginPath()
  ctx.arc(128, 128, 126, 0, Math.PI * 2)
  ctx.fill()
  for (let r = 24; r < 124; r += 5 + (r % 7)) {
    ctx.strokeStyle = `rgba(170, 160, 150, ${0.08 + (r % 5) * 0.025})`
    ctx.lineWidth = 1 + (r % 3) * 0.5
    ctx.beginPath()
    ctx.arc(128, 128, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  return c
}

// the handle on the right-hand reel
export function crank(seed = 1) {
  const c = canvas(330, 96)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 6 })
  m.shape([[18, 34], [256, 28], [258, 64], [18, 66]], P.paper)
  m.blob(276, 48, 38, 38, P.paper)
  m.highlight(oval(276, 48, 34, 34), HI.yellow, 14)
  fibres(ctx)
  return c
}

// the little trestle a reel stands on
export function reelStand(seed = 1) {
  const c = canvas(360, 420)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[150, 30], [210, 30], [336, 404], [24, 404]], P.paper)
  m.hole([[152, 196], [208, 196], [258, 340], [102, 340]])
  fibres(ctx)
  return c
}

export function projector(seed = 1) {
  const c = canvas(600, 460)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[120, 414], [160, 414], [166, 446], [112, 446]], P.paper) // feet
  m.shape([[340, 414], [380, 414], [388, 446], [332, 446]], P.paper)
  m.shape([[150, 118], [312, 114], [316, 178], [146, 182]], P.paper) // the slide tray on top
  for (let i = 0; i < 5; i++) m.line([[176 + i * 26, 124], [176 + i * 26, 172]], { width: 4 })
  m.shape([[416, 214], [544, 176], [562, 256], [420, 306]], P.paper) // lens barrel
  m.shape([[60, 176], [424, 168], [430, 414], [54, 420]], P.paper) // body
  m.blob(552, 216, 26, 44, P.paper)
  m.highlight(oval(552, 216, 22, 40), HI.yellow, 14)
  for (let i = 0; i < 4; i++) m.line([[92, 222 + i * 26], [190, 220 + i * 26]], { width: 4 }) // vents
  m.blob(330, 250, 36, 34, null, { width: 5 })
  m.line([[330, 250], [352, 228]], { width: 5 })
  fibres(ctx)
  return c
}

// the sheet of paper the projector throws its picture onto, taped up by two corners
export function screenSheet(seed = 1) {
  const c = canvas(680, 480)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5 })
  m.shape([[24, 34], [654, 26], [660, 456], [18, 462]], '#fbf8ef')
  fibres(ctx)
  ctx.fillStyle = P.tape
  for (const [x, y, a] of [[24, 30, -0.5], [654, 26, 0.45]]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.fillRect(-46, -17, 92, 34)
    ctx.restore()
  }
  return c
}

// a stand-in photograph: a card in a muted tone with its frame number
export function photoCard(index) {
  const c = canvas(600, 400)
  const ctx = c.getContext('2d')
  const tones = ['#c9cdea', '#e6d3a8', '#cdb5b5', '#bbcfbb', '#efe4cc', '#aab3d6', '#d9c4a0', '#c4cbc2']
  ctx.fillStyle = tones[index % tones.length]
  ctx.fillRect(0, 0, 600, 400)
  fibres(ctx)
  ctx.strokeStyle = 'rgba(70, 68, 62, 0.4)'
  ctx.lineWidth = 2
  ctx.strokeRect(18, 18, 564, 364)
  ctx.beginPath()
  ctx.moveTo(18, 18)
  ctx.lineTo(582, 382)
  ctx.moveTo(582, 18)
  ctx.lineTo(18, 382)
  ctx.stroke()
  ctx.fillStyle = tones[index % tones.length]
  ctx.fillRect(196, 152, 208, 96)
  write(ctx, String(index + 1).padStart(2, '0'), 300, 202, { size: 64 })
  return c
}

// ------------------------------------------------------------------ creative coding: the card shop

// Doodled icons for what a sketch uses: mouse, mic, camera, hand, ai (and llm,
// arduino). Drawn into any 2D canvas at (cx, cy), `size` pixels across.
export function useIcon(ctx, kind, cx, cy, size, seed = 1) {
  const s = size / 100
  const m = marker(ctx, seed, { width: Math.max(2, 7 * s), wobble: 1.4 * s })
  const p = (pts) => pts.map(([x, y]) => [cx + (x - 50) * s, cy + (y - 50) * s])
  switch (kind) {
    case 'mouse':
      m.shape(p([[32, 30], [68, 30], [72, 64], [62, 86], [38, 86], [28, 64]]), P.paper)
      m.line(p([[50, 30], [50, 50]]))
      m.line(p([[50, 30], [52, 18], [60, 10]]))
      break
    case 'mic':
      m.shape(p([[38, 14], [62, 14], [62, 52], [38, 52]]), P.paper)
      m.line(p([[28, 44], [30, 60], [50, 68], [70, 60], [72, 44]]))
      m.line(p([[50, 68], [50, 86]]))
      m.line(p([[36, 86], [64, 86]]))
      break
    case 'camera':
      m.shape(p([[16, 32], [36, 32], [42, 22], [60, 22], [66, 32], [84, 32], [84, 78], [16, 78]]), P.paper)
      m.blob(cx, cy + 5 * s, 15 * s, 15 * s, null)
      break
    case 'hand':
      m.shape(p([[30, 88], [26, 54], [32, 50], [38, 58], [38, 22], [45, 20], [48, 50], [50, 14], [57, 14], [58, 50], [62, 20], [69, 22], [67, 54], [74, 34], [80, 38], [72, 70], [62, 88]]), P.paper)
      break
    case 'ai':
      // a speech bubble with a spark in it
      m.shape(p([[12, 16], [88, 16], [88, 68], [44, 68], [26, 86], [30, 68], [12, 68]]), P.paper)
      m.shape(p([[50, 24], [55, 37], [68, 42], [55, 47], [50, 60], [45, 47], [32, 42], [45, 37]]), P.highlighter.yellow, { width: Math.max(1.5, 4 * s) })
      break
    case 'llm':
      m.shape(p([[12, 18], [70, 18], [70, 54], [36, 54], [24, 66], [26, 54], [12, 54]]), P.paper)
      m.shape(p([[42, 46], [88, 46], [88, 78], [78, 78], [80, 90], [66, 78], [42, 78]]), P.paper)
      break
    case 'arduino':
      m.shape(p([[14, 26], [86, 26], [86, 74], [14, 74]]), P.paper)
      m.rect(cx - 20 * s, cy - 12 * s, 26 * s, 24 * s, null, { width: Math.max(1.5, 4 * s) })
      for (let i = 0; i < 6; i++) m.line(p([[20 + i * 11, 18], [20 + i * 11, 26]]), { width: Math.max(1.5, 4 * s) })
      break
  }
}

// The display case's front: clear cellophane, with the shine drawn on in
// white marker. Mostly see-through, so it has to be drawn as a texture with
// its own transparency rather than cut out.
export function cellophane(seed = 1) {
  const c = canvas(1024, 600)
  const ctx = c.getContext('2d')
  const r = rng(seed * 41 + 3)
  ctx.fillStyle = 'rgba(226, 238, 255, 0.07)'
  ctx.fillRect(0, 0, 1024, 600)
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#ffffff'
  const stroke = (pts, width, alpha) => {
    ctx.globalAlpha = alpha
    ctx.lineWidth = width
    ctx.beginPath()
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + (r() - 0.5) * 3, y + (r() - 0.5) * 3) : ctx.moveTo(x, y)))
    ctx.stroke()
  }
  // the shine: two strokes across the top left corner, one short one low down
  stroke([[70, 260], [150, 170], [240, 80], [300, 22]], 16, 0.55)
  stroke([[120, 300], [200, 215], [290, 120], [350, 58]], 6, 0.45)
  stroke([[820, 560], [880, 500], [930, 450]], 8, 0.35)
  // and the faint crinkles cellophane always has
  for (let i = 0; i < 14; i++) {
    const x = r() * 1024
    const y = r() * 600
    stroke([[x, y], [x + 30 + r() * 60, y + (r() - 0.5) * 40], [x + 60 + r() * 90, y + (r() - 0.5) * 50]], 2, 0.1 + r() * 0.08)
  }
  ctx.globalAlpha = 1
  return c
}


// ------------------------------------------------------------------ materials

// A sheet of something: a base colour covered in fibres. Returns the canvas
// and its context so a kind can add its own marks on top.
function sheet(base, seed, { n = 3200, long = 46, dark = '70,50,25', light = '255,246,228', strength = 1 } = {}) {
  const c = canvas(1024, 1024)
  const ctx = c.getContext('2d')
  const r = rng(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < n; i++) {
    const x = r() * 1024
    const y = r() * 1024
    const len = 4 + r() * long
    const a = (r() - 0.5) * 0.5
    ctx.strokeStyle = `rgba(${r() < 0.5 ? dark : light},${(0.04 + r() * 0.1) * strength})`
    ctx.lineWidth = 0.7 + r() * 1.3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  return { c, ctx, r }
}

// Flat stand-ins for the scanned papers and the room linings.
export function lining(kind) {
  switch (kind) {
    case 'cardboard': {
      const { c, ctx, r } = sheet(P.cardboard, 1, { n: 4200, long: 90, dark: '90,60,25', light: '240,205,160' })
      // the ribs of the corrugation showing faintly through the liner
      for (let y = 0; y < 1024; y += 16) {
        ctx.fillStyle = `rgba(80, 50, 20, ${0.02 + r() * 0.03})`
        ctx.fillRect(0, y, 1024, 7)
      }
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(70, 45, 20, ${0.15 + r() * 0.2})`
        ctx.fillRect(r() * 1024, r() * 1024, 1 + r() * 3, 1 + r() * 2)
      }
      return c
    }
    case 'paper':
      return sheet(P.paper, 2, { n: 2600, long: 26, dark: '120,105,80', strength: 0.8 }).c
    case 'arcade': {
      // the arcade's walls: warm brown card, with patches where the top
      // layer has torn away and the corrugation underneath shows
      const { c, ctx, r } = sheet('#b4875a', 21, { n: 3600, long: 80, dark: '90,60,25', light: '240,205,160' })
      for (let y = 0; y < 1024; y += 16) {
        ctx.fillStyle = `rgba(80, 50, 20, ${0.02 + r() * 0.03})`
        ctx.fillRect(0, y, 1024, 7)
      }
      for (let k = 0; k < 5; k++) {
        const x = 40 + r() * 860
        const y = 40 + r() * 860
        const w = 70 + r() * 120
        const h = 50 + r() * 90
        const torn = []
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2
          torn.push([x + w / 2 + Math.cos(a) * (w / 2) * (0.75 + r() * 0.35), y + h / 2 + Math.sin(a) * (h / 2) * (0.75 + r() * 0.35)])
        }
        const outline = () => {
          ctx.beginPath()
          torn.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
          ctx.closePath()
        }
        ctx.save()
        outline()
        ctx.clip()
        ctx.fillStyle = '#d4ab7a'
        ctx.fillRect(x - 10, y - 10, w + 20, h + 20)
        for (let rx = x - 10; rx < x + w + 10; rx += 9) {
          ctx.fillStyle = 'rgba(110, 72, 35, 0.35)'
          ctx.fillRect(rx, y - 10, 3, h + 20)
        }
        ctx.restore()
        outline()
        ctx.strokeStyle = '#efd9b5'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      return c
    }
    case 'carpet': {
      // a patterned paper "carpet": arcade-carpet shapes, in quiet colours
      const { c, ctx, r } = sheet('#5a3046', 22, { n: 2000, long: 14, dark: '30,10,20', light: '210,160,180', strength: 0.6 })
      const inks = ['#c9a24f', '#4f8c8a', '#e8dcc0', '#c97a5e']
      for (let y = 0; y < 1024; y += 128) {
        for (let x = 0; x < 1024; x += 128) {
          const cx = x + 64 + (r() - 0.5) * 34
          const cy = y + 64 + (r() - 0.5) * 34
          const m = marker(ctx, x * 7 + y + 3, { color: inks[Math.floor(r() * inks.length)], width: 6, wobble: 1.4 })
          const kind = Math.floor(r() * 4)
          if (kind === 0) m.shape([[cx, cy - 26], [cx + 24, cy + 18], [cx - 24, cy + 18]], null)
          else if (kind === 1) m.line(Array.from({ length: 7 }, (_, i) => [cx - 36 + i * 12, cy + (i % 2 ? -12 : 12)]))
          else if (kind === 2) m.blob(cx, cy, 18, 18, null)
          else m.line(Array.from({ length: 9 }, (_, i) => [cx - 40 + i * 10, cy + Math.sin(i) * 12]))
        }
      }
      return c
    }
    case 'night': {
      // the market's walls: a night sky, with a scatter of tiny stars
      const { c, ctx, r } = sheet('#1d2752', 12, { n: 2400, long: 20, dark: '5,8,25', light: '120,135,210', strength: 0.7 })
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(255,248,220,${0.3 + r() * 0.5})`
        ctx.beginPath()
        ctx.arc(r() * 1024, r() * 1024, 0.8 + r() * 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      return c
    }
    case 'snow':
      return sheet('#eef2fb', 13, { n: 2600, long: 24, dark: '120,135,170', light: '255,255,255', strength: 0.8 }).c
    case 'display':
      // the inside of the display case: dark blue card, a little like felt
      return sheet('#26305a', 10, { n: 4200, long: 18, dark: '8,12,36', light: '150,165,235', strength: 0.75 }).c
    case 'periwinkle':
      return sheet(P.periwinkle, 4, { n: 2600, long: 26, dark: '60,70,150', light: '215,220,255' }).c
    case 'velvet': {
      const { c, ctx, r } = sheet(P.maroon, 5, { n: 0 })
      // the nap of the cloth: fine upright strokes, and soft folds where it hangs
      for (let x = 0; x < 1024; x += 2) {
        const fold = Math.sin(x / 61) * 0.5 + Math.sin(x / 23 + 1.3) * 0.25 + Math.sin(x / 141) * 0.4
        ctx.fillStyle = fold > 0 ? `rgba(190, 80, 100, ${fold * 0.16})` : `rgba(30, 5, 12, ${-fold * 0.3})`
        ctx.fillRect(x, 0, 2, 1024)
      }
      for (let i = 0; i < 5200; i++) {
        ctx.fillStyle = `rgba(${r() < 0.5 ? '40,8,16' : '200,95,115'},${0.05 + r() * 0.1})`
        ctx.fillRect(r() * 1024, r() * 1024, 1, 6 + r() * 26)
      }
      return c
    }
    case 'pinholes': {
      const { c, ctx, r } = sheet(P.blackCard, 6, { n: 2000, long: 30, dark: '0,0,0', light: '120,120,140', strength: 0.7 })
      ctx.fillStyle = '#fff6cf'
      ctx.shadowColor = '#ffe8a3'
      ctx.shadowBlur = 22
      for (let i = 0; i < 150; i++) {
        ctx.beginPath()
        ctx.arc(r() * 1024, r() * 1024, 2.5 + r() * 6, 0, Math.PI * 2)
        ctx.fill()
      }
      return c
    }
    case 'manila': {
      const { c, ctx } = sheet(P.manila, 8, { n: 2600, long: 30, dark: '120,90,40', light: '250,235,195' })
      ctx.strokeStyle = 'rgba(70,110,170,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let y = 64; y < 1024; y += 64) {
        ctx.moveTo(0, y)
        ctx.lineTo(1024, y)
      }
      ctx.stroke()
      return c
    }
  }
  return sheet(P.paper, 9).c
}
