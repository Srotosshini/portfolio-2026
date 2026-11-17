// Stand-in drawings and materials, so the site works (and looks like a paper
// diorama) before any real artwork exists.
// Every one of these is replaced by dropping a real file into /public (see the
// README), and most of them print the file name they are waiting for. Nothing
// in this file is meant to survive to the finished site.
import { PALETTE as P, rng, canvas } from './paper.js'

export const HAND = '"Shelf Hand", "Segoe Print", "Bradley Hand", "Chalkboard SE", "Comic Sans MS", cursive'
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace'
const HI = P.highlighter

// ------------------------------------------------------------------ tools

// A wobbly marker. Each seed gives a slightly different tracing of the same
// shapes, which is what makes the placeholder lines boil.
function marker(ctx, seed, { color = P.navy, width = 7, wobble = 2.2 } = {}) {
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

const oval = (cx, cy, rx, ry, n = 16) =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry])

const star = (cx, cy, R, inner = 0.45) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? R * inner : R
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })

// One tile of paper fibres, laid over anything cut from paper so no fill is
// perfectly flat. It holds still between tracings: lines boil, paper does not.
let fibreTile
function fibres(ctx) {
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
function write(ctx, str, x, y, { size = 48, max = 1e4, maxH = 1e4, lines = 1, color = P.navy, font = HAND, weight = 600, tilt = 0 } = {}) {
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

// the pencil note that names the file a placeholder is waiting for
function note(ctx, file, x, y, max, color = P.pencil) {
  write(ctx, 'placeholder', x, y, { size: 19, max, color, font: MONO, weight: 500 })
  write(ctx, file, x, y + 26, { size: 19, max, color, font: MONO, weight: 500 })
}

// ------------------------------------------------------------------ arcade

// Three cereal-box silhouettes, so the row of cabinets is not five of the same.
const BODIES = [
  [[46, 104], [150, 96], [172, 26], [292, 36], [318, 98], [346, 30], [468, 24], [490, 100], [598, 108], [606, 978], [38, 986]], // top flaps standing up
  [[78, 160], [34, 46], [610, 36], [570, 162], [604, 978], [40, 986]], // a hood that overhangs the screen
  [[50, 134], [92, 60], [196, 30], [444, 26], [544, 58], [592, 136], [606, 978], [38, 986]], // rounded shoulders
]
const MARQUEES = [
  { band: [[84, 128], [560, 122], [566, 236], [80, 242]], y: 182, h: 104 },
  { band: [[72, 62], [572, 54], [548, 146], [98, 150]], y: 102, h: 84 },
  { band: [[92, 96], [552, 90], [560, 226], [86, 232]], y: 161, h: 122 },
]

// A cereal-box cabinet with a cut-out screen.
export function cabinet({ title, accent, file, style = 0 }, seed = 1) {
  const c = canvas(640, 1000)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  const kind = style % 3
  m.shape(BODIES[kind], P.paper)
  m.highlight(MARQUEES[kind].band, accent)
  write(ctx, title, 322, MARQUEES[kind].y, { size: 58, max: 430, maxH: MARQUEES[kind].h, lines: 2 })

  m.shape([[88, 246], [554, 242], [558, 520], [84, 524]], null, { width: 4 }) // bezel
  m.hole([[108, 262], [534, 258], [538, 500], [104, 504]]) // the screen, 16:9

  m.line([[70, 584], [574, 576]])
  m.line([[70, 696], [574, 702]])
  m.line([[192, 666], [178, 612]], { width: 10 }) // joystick
  m.blob(176, 604, 22, 22, P.paper)
  m.highlight(oval(176, 604, 20, 20), accent, 14)
  for (const [x, tint] of [[380, accent], [452, HI.pink], [520, null]].slice(0, 2 + (style % 2))) {
    m.blob(x, 640, 26, 24, P.paper)
    if (tint) m.highlight(oval(x, 640, 24, 22), tint, 14)
  }

  m.rect(296, 770, 54, 98, P.paper) // coin slot
  m.line([[323, 792], [323, 846]], { width: 10 })
  if (kind === 0) {
    // every cereal box has one of these on the side
    m.rect(72, 762, 150, 122, null, { width: 4 })
    for (let i = 0; i < 5; i++) m.line([[84, 784 + i * 20], [150 + ((i * 37) % 60), 784 + i * 20]], { width: 3.5 })
    m.shape(star(470, 806, 34), P.paper, { width: 5 })
    m.highlight(star(470, 806, 32), accent, 12)
    m.shape(star(540, 868, 22), null, { width: 5 })
  } else if (kind === 1) {
    for (const y of [786, 836]) {
      const zig = []
      for (let x = 78, up = true; x <= 236; x += 26, up = !up) zig.push([x, up ? y : y + 28])
      m.line(zig, { width: 5 })
    }
    m.line([[410, 786], [574, 782]], { width: 5 })
    m.line([[410, 826], [574, 822]], { width: 5 })
    m.line([[410, 866], [540, 864]], { width: 5 })
  } else {
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 3; k++) {
        const pts = [[410 + i * 50, 770 + k * 38], [452 + i * 50, 770 + k * 38], [452 + i * 50, 802 + k * 38], [410 + i * 50, 802 + k * 38]]
        m.shape(pts, null, { width: 4 })
        if ((i + k) % 2 === 0) m.highlight(pts, accent, 12)
      }
    m.blob(150, 824, 58, 54, null, { width: 5 })
    m.blob(150, 824, 30, 28, null, { width: 4 })
  }
  fibres(ctx)
  note(ctx, file, 322, 916, 540)
  return c
}

export function coin(seed = 1) {
  const c = canvas(200, 200)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 9 })
  m.blob(100, 100, 84, 84, P.paper)
  m.highlight(oval(100, 100, 80, 80), HI.yellow, 20)
  m.blob(100, 100, 58, 58, null, { width: 5 })
  write(ctx, '1', 100, 104, { size: 76 })
  fibres(ctx)
  return c
}

export function clawMachine({ file }, seed = 1) {
  const c = canvas(520, 1000)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[36, 100], [72, 30], [450, 24], [486, 96], [492, 978], [30, 986]], P.paper)
  m.highlight([[72, 46], [450, 40], [460, 112], [62, 118]], HI.pink)
  m.shape(star(150, 80, 22), null, { width: 4 })
  m.shape(star(262, 76, 28), null, { width: 4 })
  m.shape(star(374, 80, 22), null, { width: 4 })
  m.hole([[78, 152], [444, 148], [448, 590], [74, 594]]) // the glass
  m.line([[52, 634], [470, 628]])
  m.rect(84, 706, 150, 150, P.blackCard) // prize chute
  m.line([[270, 760], [250, 790], [270, 820]], { width: 5 }) // an arrow to it
  m.line([[250, 790], [330, 790]], { width: 5 })
  m.line([[392, 772], [404, 714]], { width: 10 })
  m.blob(406, 706, 22, 22, P.paper)
  m.highlight(oval(406, 706, 20, 20), HI.pink, 14)
  fibres(ctx)
  note(ctx, file, 262, 908, 440)
  return c
}

export function claw(seed = 1) {
  const c = canvas(200, 300)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 8 })
  m.rect(86, 8, 28, 150, P.paper)
  m.shape([[56, 152], [144, 152], [154, 186], [46, 186]], P.paper)
  m.line([[60, 186], [30, 244], [58, 286]])
  m.line([[100, 186], [100, 278]])
  m.line([[140, 186], [170, 244], [142, 286]])
  fibres(ctx)
  return c
}

// Three stand-in characters for the claw machine.
export function character(index, seed = 1) {
  const c = canvas(220, 270)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 8 })
  const tint = [HI.yellow, HI.green, HI.orange][index % 3]
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
  for (const part of parts) {
    m.shape(part, P.paper)
    m.highlight(part, tint, 22)
  }
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
export function placard({ title, file }, seed = 1) {
  const c = canvas(520, 600)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[150, 410], [192, 410], [150, 586], [116, 586]], P.paper)
  m.shape([[330, 410], [372, 410], [404, 586], [370, 586]], P.paper)
  m.shape([[30, 40], [492, 30], [498, 424], [24, 432]], P.paper)
  write(ctx, title, 260, 190, { size: 50, max: 400, lines: 3 })
  fibres(ctx)
  note(ctx, file, 260, 352, 430)
  return c
}

// What a cabinet screen plays until it has a clip or a still: a little
// looping doodle, redrawn a few times a second. `index` picks the doodle,
// `frame` counts up, `lines` are the "which file goes here" notes.
export function attract(ctx, index, frame, { title, lines = [] }) {
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
  if (t % 8 < 6) write(ctx, title, 120, lines.length ? 103 : 112, { size: 20, max: 222, color: P.paper })
  lines.forEach((line, i) => write(ctx, line, 120, 119 + i * 9, { size: 7.5, max: 232, color: '#a9a69c', font: MONO, weight: 500 }))
}

// Stand-in neon for the arcade's back wall: bright tubes on one canvas and
// their soft halo on another, so the sign can flicker.
export function neon() {
  const tubes = canvas(1024, 512)
  const glow = canvas(1024, 512)
  const t = tubes.getContext('2d')
  const g = glow.getContext('2d')
  const tube = (pts, tint, seed, closed = false) => {
    const draw = (ctx, o) => {
      const m = marker(ctx, seed, o)
      if (closed) m.shape(pts, null)
      else m.line(pts)
    }
    draw(t, { color: tint, width: 12, wobble: 1.6 })
    draw(t, { color: '#ffffff', width: 3, wobble: 1.6 }) // the hot core of the tube
    // the same stroke again, drawn off-canvas so only its blurred shadow lands
    g.save()
    g.shadowColor = tint
    g.shadowBlur = 36
    g.shadowOffsetX = 3000
    g.translate(-3000, 0)
    draw(g, { color: tint, width: 18, wobble: 1.6 })
    g.restore()
  }
  const zig = []
  for (let x = 60, up = true; x <= 966; x += 50, up = !up) zig.push([x, up ? 52 : 104])
  tube(zig, HI.yellow, 11)
  tube(star(170, 232, 62), HI.pink, 12, true)
  tube(star(512, 206, 40), HI.orange, 13, true)
  tube(star(866, 226, 54), HI.green, 14, true)
  const wave = []
  for (let x = 250; x <= 780; x += 36) wave.push([x, 300 + Math.sin(x / 44) * 16])
  tube(wave, HI.blue, 15)
  return { tubes, glow }
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
export function jar({ file }, seed = 1) {
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
  note(ctx, file, 180, 372, 220)
  return c
}

export function tapeRoll({ file }, seed = 1) {
  const c = canvas(360, 340)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.blob(180, 170, 160, 156, P.tape)
  m.hole(oval(180, 170, 74, 72))
  m.blob(180, 170, 118, 114, null, { width: 3 })
  fibres(ctx)
  write(ctx, file, 180, 296, { size: 15, max: 200, color: P.pencil, font: MONO, weight: 500 })
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

export function portrait({ file }, seed = 1) {
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
  note(ctx, file, 240, 548, 340)
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
export function reelStand({ file }, seed = 1) {
  const c = canvas(360, 420)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  m.shape([[150, 30], [210, 30], [336, 404], [24, 404]], P.paper)
  m.hole([[152, 196], [208, 196], [258, 340], [102, 340]])
  fibres(ctx)
  write(ctx, file, 180, 384, { size: 14, max: 280, color: P.pencil, font: MONO, weight: 500 })
  return c
}

export function projector({ file }, seed = 1) {
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
  note(ctx, file, 244, 348, 330)
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

// a stand-in photograph: a card in a muted tone that says where the photo goes
export function photoCard(index, file) {
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
  ctx.fillRect(110, 132, 380, 136)
  write(ctx, String(index + 1).padStart(2, '0'), 300, 176, { size: 64 })
  write(ctx, `photo goes here: public/${file}`, 300, 236, { size: 18, max: 360, color: P.pencil, font: MONO, weight: 500 })
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
    case 'black':
      return sheet(P.blackCard, 3, { n: 2600, long: 30, dark: '0,0,0', light: '120,120,140', strength: 0.7 }).c
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
    case 'mat': {
      const { c, ctx } = sheet(P.mat, 7, { n: 1400, long: 20, dark: '10,50,30', light: '150,220,190', strength: 0.6 })
      const rule = (step, alpha, lw) => {
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`
        ctx.lineWidth = lw
        ctx.beginPath()
        for (let p = 0; p <= 1024; p += step) {
          ctx.moveTo(0, p)
          ctx.lineTo(1024, p)
          ctx.moveTo(p, 0)
          ctx.lineTo(p, 1024)
        }
        ctx.stroke()
      }
      rule(32, 0.16, 1)
      rule(256, 0.4, 2.5)
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
