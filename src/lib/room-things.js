// Stand-in drawings for the things in her room (the About box): the travel
// pinboard, her desk and what is on it, the window, the school pennants, the
// violin in its case, the suitcase, the note on the wall, and her cat in all
// its moods. Soft and round, like the plush toys, outlined in navy marker.
// Like everything drawn in code, each one is replaced by her own drawing
// when the file exists (see the README).
import { canvas, rng } from './paper.js'
import { write, HAND, fibres } from './placeholders.js'
import { oval, curve, puff, stitch, eye, blush, mouth, darker, lighter, panel, gloss, heartShape, starShape } from './soft.js'

const NAVY = '#1d2a5b'
const WOOD = '#c99162'
const PERI = '#8b97e8'
const p = (ctx, shape, color, o = {}) => puff(ctx, shape, color, { line: NAVY, width: 4.5, fuzz: 0.5, ...o })
const box = (ctx, x, y, w, h, color, o) => p(ctx, curve([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), color, o)
const round = (ctx, x, y, w, h, r, color, o = {}) =>
  puff(ctx, { path: (c) => (c.beginPath(), c.roundRect(x, y, w, h, r)), box: { x, y, w, h } }, color, { line: NAVY, width: 4.5, fuzz: 0.4, ...o })

// ------------------------------------------------------------------ the pinboard
export function pinboard(seed = 1) {
  const c = canvas(1300, 1000)
  const ctx = c.getContext('2d')
  const r = rng(seed * 11)
  round(ctx, 8, 8, 1284, 984, 22, '#d6a774', { glow: 0.3 })
  round(ctx, 52, 52, 1196, 896, 10, '#c79461', { width: 4, glow: 0.2 })
  ctx.save()
  ctx.beginPath()
  ctx.rect(56, 56, 1188, 888)
  ctx.clip()
  for (let i = 0; i < 4200; i++) {
    ctx.fillStyle = r() < 0.6 ? `rgba(110, 66, 30, ${0.16 + r() * 0.28})` : `rgba(240, 205, 160, ${0.2 + r() * 0.3})`
    ctx.beginPath()
    ctx.arc(56 + r() * 1188, 56 + r() * 888, 1 + r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    const y = 18 + r() * 26
    ctx.moveTo(40 + r() * 300, y)
    ctx.lineTo(500 + r() * 700, y + (r() - 0.5) * 6)
    ctx.stroke()
  }
  fibres(ctx)
  return c
}

// a paper tag for the board: "21 cities and counting"
export function tag(text, seed = 1) {
  const c = canvas(460, 130)
  const ctx = c.getContext('2d')
  p(ctx, curve([[30, 14], [446, 10], [450, 116], [26, 120], [6, 66]]), '#fbf6e8', { width: 4, fuzz: 0 })
  ctx.fillStyle = '#c69b6d'
  ctx.beginPath()
  ctx.arc(46, 66, 10, 0, Math.PI * 2)
  ctx.fill()
  write(ctx, text, 250, 70, { size: 46, max: 360, color: NAVY, font: HAND, weight: 700 })
  return c
}

// a polaroid of a city: the scene, its name, a line about it
export function cityPolaroid(target, photo, city, caption, k = 1) {
  const ctx = target.getContext('2d')
  const W = target.width
  const H = target.height
  const pad = Math.round(W * 0.065)
  const size = W - pad * 2
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(0, 0, W, H)
  if (photo) ctx.drawImage(photo, pad, pad, size, size)
  if (k < 1) {
    ctx.fillStyle = `rgba(251, 248, 241, ${1 - k})`
    ctx.fillRect(pad, pad, size, size)
  }
  ctx.strokeStyle = 'rgba(40, 40, 60, 0.22)'
  ctx.lineWidth = Math.max(1, W / 180)
  ctx.strokeRect(pad, pad, size, size)
  const margin = H - pad - size
  ctx.save()
  ctx.globalAlpha = Math.min(1, Math.max(0, k * 1.6 - 0.4))
  if (caption) {
    write(ctx, city, W / 2, pad + size + margin * 0.36, { size: Math.round(H * 0.075), max: size * 0.94, color: NAVY, font: HAND, weight: 700 })
    write(ctx, caption, W / 2, pad + size + margin * 0.72, { size: Math.round(H * 0.042), max: size * 0.96, color: '#4a4f7a', font: HAND })
  } else write(ctx, city, W / 2, pad + size + margin / 2, { size: Math.round(H * 0.09), max: size * 0.94, color: NAVY, font: HAND, weight: 700 })
  ctx.restore()
  ctx.strokeStyle = 'rgba(120, 110, 90, 0.4)'
  ctx.lineWidth = Math.max(1, W / 120)
  ctx.strokeRect(1, 1, W - 2, H - 2)
}

// ------------------------------------------------------------------ the desk
// its front: drawers on the left, a leg on the right
export function deskFront(seed = 1) {
  const c = canvas(1440, 740)
  const ctx = c.getContext('2d')
  box(ctx, 10, 6, 1420, 60, lighter(WOOD, 0.15))
  box(ctx, 40, 66, 380, 668, WOOD)
  for (const y of [96, 300, 504]) {
    round(ctx, 66, y, 328, 180, 14, lighter(WOOD, 0.2), { width: 4 })
    p(ctx, oval(230, y + 90, 26, 12), '#7a5236', { width: 3, fuzz: 0 })
  }
  box(ctx, 1340, 66, 60, 668, darker(WOOD, 0.1))
  box(ctx, 420, 66, 920, 70, lighter(WOOD, 0.1))
  fibres(ctx)
  return c
}
// the top, seen from above: a texture
export function deskTop(seed = 1) {
  const c = canvas(1024, 384)
  const ctx = c.getContext('2d')
  const r = rng(seed * 5)
  ctx.fillStyle = lighter(WOOD, 0.18)
  ctx.fillRect(0, 0, 1024, 384)
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(110, 70, 30, ${0.1 + r() * 0.15})`
    ctx.lineWidth = 2
    ctx.beginPath()
    const y = r() * 384
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(300, y + (r() - 0.5) * 20, 700, y + (r() - 0.5) * 20, 1024, y)
    ctx.stroke()
  }
  return c
}
export function lamp(seed = 1) {
  const c = canvas(380, 500)
  const ctx = c.getContext('2d')
  p(ctx, oval(150, 470, 90, 22), '#7f8fd8')
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 16
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(150, 460)
  ctx.lineTo(190, 260)
  ctx.lineTo(290, 150)
  ctx.stroke()
  ctx.strokeStyle = '#8b97e8'
  ctx.lineWidth = 10
  ctx.stroke()
  p(ctx, oval(190, 260, 16, 16), '#f2c75c', { width: 3 })
  p(ctx, curve([[230, 70], [360, 120], [330, 220], [200, 168]]), '#f6d470', { glow: 0.6 })
  p(ctx, oval(268, 196, 40, 16, 0.4), '#fff4c4', { width: 3, glow: 0.9 })
  return c
}
// the laptop, seen from behind: its lid covered in stickers, one of them "github"
export function laptop(seed = 1) {
  const c = canvas(440, 340)
  const ctx = c.getContext('2d')
  round(ctx, 30, 20, 380, 270, 20, '#c9d2f2', { glow: 0.5 })
  round(ctx, 10, 284, 420, 40, 14, '#aab6e6')
  round(ctx, 120, 112, 200, 70, 34, '#1d2a5b', { width: 4 })
  write(ctx, 'github', 220, 148, { size: 46, max: 170, color: '#ffffff', font: HAND, weight: 700 })
  p(ctx, starShape(80, 76, 30), '#f2c75c', { width: 3, fuzz: 0 })
  p(ctx, heartShape(360, 80, 26), '#ef7f9a', { width: 3, fuzz: 0 })
  round(ctx, 60, 200, 90, 56, 12, '#9fe0c9', { width: 3 })
  for (const [x, y] of [[84, 228], [126, 228]]) p(ctx, oval(x, y, 8, 8), NAVY, { width: 0, fuzz: 0 })
  p(ctx, oval(330, 230, 34, 34), '#ffd58a', { width: 3 })
  write(ctx, ':)', 330, 232, { size: 34, color: NAVY, weight: 700 })
  return c
}
// the open notebook: her bio, written out on its pages
export function notebook(text, seed = 1) {
  const c = canvas(720, 460)
  const ctx = c.getContext('2d')
  p(ctx, curve([[20, 40], [356, 20], [360, 440], [24, 430]]), '#fbf8ef', { glow: 0.2 })
  p(ctx, curve([[364, 20], [700, 40], [696, 430], [360, 440]]), '#fbf8ef', { glow: 0.2 })
  ctx.strokeStyle = 'rgba(111, 143, 214, 0.45)'
  ctx.lineWidth = 2
  for (let y = 80; y < 420; y += 26) {
    ctx.beginPath()
    ctx.moveTo(44, y)
    ctx.lineTo(340, y - 10)
    ctx.moveTo(380, y - 10)
    ctx.lineTo(680, y)
    ctx.stroke()
  }
  for (let y = 40; y < 430; y += 30) p(ctx, oval(360, y, 9, 9), '#c9ced6', { width: 2.5, fuzz: 0 })
  // the words, as small as handwriting on a page: down the left page, then the right
  ctx.fillStyle = NAVY
  ctx.font = `600 19px ${HAND}`
  const lines = []
  let line = ''
  for (const word of String(text).split(' ')) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > 276 && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  lines.slice(0, 26).forEach((l, i) => {
    const right = i >= 13
    const row = right ? i - 13 : i
    ctx.fillText(l, right ? 390 : 54, 72 + row * 26 - (right ? 4 : 0))
  })
  p(ctx, heartShape(640, 400, 16), '#ef7f9a', { width: 2.5, fuzz: 0 })
  return c
}
export function envelope(seed = 1) {
  const c = canvas(380, 260)
  const ctx = c.getContext('2d')
  round(ctx, 10, 20, 360, 230, 10, '#f6e7c8', { glow: 0.3 })
  ctx.strokeStyle = 'rgba(29, 42, 91, 0.45)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(14, 246)
  ctx.lineTo(190, 130)
  ctx.lineTo(366, 246)
  ctx.stroke()
  write(ctx, 'email', 190, 210, { size: 34, max: 160, color: NAVY, font: HAND, weight: 700 })
  return c
}
export function envelopeFlap(seed = 1) {
  const c = canvas(380, 170)
  const ctx = c.getContext('2d')
  p(ctx, curve([[10, 10], [370, 10], [190, 160]]), '#efdcb6', { glow: 0.3 })
  p(ctx, heartShape(190, 110, 22), '#e2453f', { width: 3, fuzz: 0 })
  return c
}
export function letter(seed = 1) {
  const c = canvas(320, 240)
  const ctx = c.getContext('2d')
  box(ctx, 6, 6, 308, 228, '#ffffff', { fuzz: 0, glow: 0.1 })
  write(ctx, 'hi!', 160, 60, { size: 46, color: NAVY, font: HAND, weight: 700 })
  ctx.strokeStyle = 'rgba(111, 143, 214, 0.6)'
  ctx.lineWidth = 3
  for (let y = 110; y < 220; y += 30) {
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(280 - (y % 60), y)
    ctx.stroke()
  }
  return c
}
export function cardHolder(seed = 1) {
  const c = canvas(240, 230)
  const ctx = c.getContext('2d')
  box(ctx, 30, 30, 180, 120, '#ffffff', { fuzz: 0, glow: 0.2 })
  write(ctx, 'linkedin', 120, 72, { size: 32, max: 160, color: '#2a62b8', font: HAND, weight: 700 })
  ctx.fillStyle = 'rgba(29, 42, 91, 0.35)'
  ctx.fillRect(60, 104, 120, 6)
  ctx.fillRect(60, 120, 90, 6)
  round(ctx, 14, 130, 212, 90, 14, '#a8784f')
  return c
}
// a business card on its own (it pops up out of the holder)
export function businessCard(seed = 1) {
  const c = canvas(300, 180)
  const ctx = c.getContext('2d')
  box(ctx, 6, 6, 288, 168, '#ffffff', { fuzz: 0, glow: 0.2 })
  write(ctx, 'linkedin', 150, 70, { size: 44, max: 240, color: '#2a62b8', font: HAND, weight: 700 })
  write(ctx, 'nahiyan srotosshini', 150, 124, { size: 24, max: 250, color: NAVY, font: HAND })
  return c
}
export function folder(seed = 1) {
  const c = canvas(260, 320)
  const ctx = c.getContext('2d')
  p(ctx, curve([[30, 60], [110, 60], [130, 36], [220, 36], [230, 300], [24, 306]]), '#d9a56a', { glow: 0.35 })
  p(ctx, curve([[14, 92], [244, 82], [248, 310], [10, 316]]), '#e6b77c', { glow: 0.4 })
  round(ctx, 64, 150, 130, 70, 12, '#fbf6e8', { width: 3.5, fuzz: 0 })
  write(ctx, 'cv', 129, 188, { size: 52, color: NAVY, font: HAND, weight: 700 })
  return c
}

// ------------------------------------------------------------------ the wall
// the window's frame, curtains and sill (the view itself shows through the hole)
export function windowFrame(seed = 1) {
  const c = canvas(1000, 840)
  const ctx = c.getContext('2d')
  round(ctx, 90, 40, 820, 700, 16, '#f7f1e6')
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillRect(130, 80, 350, 620)
  ctx.fillRect(520, 80, 350, 620)
  ctx.restore()
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 5
  ctx.strokeRect(130, 80, 350, 620)
  ctx.strokeRect(520, 80, 350, 620)
  // curtains, tied back
  for (const side of [-1, 1]) {
    const x = side < 0 ? 40 : 960
    p(ctx, curve([[x, 20], [x - side * 160, 20], [x - side * 120, 300], [x - side * 40, 420], [x - side * 90, 600], [x, 640]]), '#a9b8f0', { glow: 0.4 })
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 3
    for (let k = 1; k < 4; k++) {
      ctx.beginPath()
      ctx.moveTo(x - side * k * 34, 30)
      ctx.quadraticCurveTo(x - side * (k * 30 + 10), 300, x - side * k * 12, 600)
      ctx.stroke()
    }
    ctx.restore()
    p(ctx, oval(x - side * 70, 420, 22, 14), '#f2c75c', { width: 3 })
  }
  box(ctx, 60, 730, 880, 50, '#e9dcc4')
  p(ctx, curve([[700, 730], [790, 730], [776, 680], [714, 680]]), '#d9825e')
  for (const [x, y, rx, ry] of [[745, 640, 14, 40], [722, 656, 12, 30], [768, 656, 12, 30]]) p(ctx, oval(x, y, rx, ry), '#6fae5f', { width: 3 })
  return c
}
// a felt pennant, hand-lettered
export function pennant(text, felt, ink, seed = 1) {
  const c = canvas(640, 240)
  const ctx = c.getContext('2d')
  p(ctx, curve([[30, 14], [620, 116], [30, 226]]), felt, { glow: 0.3, fuzz: 1.2 })
  stitch(ctx, (k) => {
    k.moveTo(46, 34)
    k.lineTo(580, 116)
    k.lineTo(46, 206)
  }, 'rgba(255, 255, 255, 0.6)')
  box(ctx, 8, 6, 30, 228, '#c99162')
  write(ctx, text, 250, 118, { size: 54, max: 360, color: ink, font: HAND, weight: 700 })
  return c
}
export function note(text, seed = 1) {
  const c = canvas(440, 260)
  const ctx = c.getContext('2d')
  p(ctx, curve([[20, 30], [420, 20], [424, 238], [16, 246]]), '#fff6c8', { width: 3.5, fuzz: 0.3 })
  ctx.fillStyle = 'rgba(232, 220, 182, 0.92)'
  ctx.save()
  ctx.translate(220, 22)
  ctx.rotate(-0.04)
  ctx.fillRect(-60, -16, 120, 32)
  ctx.restore()
  write(ctx, text, 220, 140, { size: 44, max: 360, maxH: 180, lines: 3, color: NAVY, font: HAND, weight: 700 })
  return c
}

// ------------------------------------------------------------------ the violin
export function violinCase(seed = 1) {
  const c = canvas(440, 940)
  const ctx = c.getContext('2d')
  const outline = [[220, 20], [330, 60], [360, 250], [320, 400], [380, 560], [390, 760], [300, 920], [140, 920], [50, 760], [60, 560], [120, 400], [80, 250], [110, 60]]
  p(ctx, curve(outline), '#2f3a6e', { glow: 0.3 })
  p(ctx, curve(outline.map(([x, y]) => [220 + (x - 220) * 0.84, 470 + (y - 470) * 0.9])), PERI, { glow: 0.45, fuzz: 1.4, width: 3 })
  return c
}
export function violin(seed = 1) {
  const c = canvas(300, 820)
  const ctx = c.getContext('2d')
  const body = [[150, 300], [230, 330], [250, 440], [212, 510], [258, 600], [250, 720], [150, 790], [50, 720], [42, 600], [88, 510], [50, 440], [70, 330]]
  p(ctx, curve(body), '#c8743c', { glow: 0.55 })
  p(ctx, curve([[136, 80], [164, 80], [172, 560], [128, 560]]), '#2a2430', { glow: 0.3, width: 3.5 })
  p(ctx, oval(150, 50, 26, 34), '#a75f30', { width: 3.5 })
  for (const side of [-1, 1]) {
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(150 + side * 52, 520)
    ctx.bezierCurveTo(150 + side * 40, 560, 150 + side * 66, 600, 150 + side * 50, 640)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 1.6
  for (const dx of [-9, -3, 3, 9]) {
    ctx.beginPath()
    ctx.moveTo(150 + dx * 0.6, 90)
    ctx.lineTo(150 + dx, 690)
    ctx.stroke()
  }
  p(ctx, curve([[118, 612], [182, 612], [176, 626], [124, 626]]), '#e9d6a8', { width: 2.5, fuzz: 0 })
  p(ctx, oval(190, 730, 34, 22), '#2a2430', { width: 3 })
  return c
}
export function bow(seed = 1) {
  const c = canvas(70, 780)
  const ctx = c.getContext('2d')
  ctx.strokeStyle = '#7a4a2a'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(30, 20)
  ctx.lineTo(34, 730)
  ctx.stroke()
  ctx.strokeStyle = '#f4efe2'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(46, 40)
  ctx.lineTo(48, 700)
  ctx.stroke()
  p(ctx, curve([[22, 690], [56, 690], [58, 760], [20, 760]]), '#2a2430', { width: 3 })
  return c
}
// a paper music note: ♪ or ♫
export function musicNote(kind = 0, seed = 1) {
  const c = canvas(140, 170)
  const ctx = c.getContext('2d')
  const ink = '#f7f2e4'
  if (kind === 0) {
    p(ctx, oval(46, 136, 30, 22, -0.35), ink, { width: 4, fuzz: 0 })
    p(ctx, curve([[66, 126], [78, 126], [80, 20], [68, 20]]), ink, { width: 4, fuzz: 0 })
    p(ctx, curve([[74, 20], [126, 50], [116, 86], [80, 54]]), ink, { width: 4, fuzz: 0 })
  } else {
    p(ctx, oval(34, 140, 24, 18, -0.35), ink, { width: 4, fuzz: 0 })
    p(ctx, oval(106, 120, 24, 18, -0.35), ink, { width: 4, fuzz: 0 })
    p(ctx, curve([[50, 134], [60, 134], [60, 30], [50, 30]]), ink, { width: 4, fuzz: 0 })
    p(ctx, curve([[122, 114], [132, 114], [132, 14], [122, 14]]), ink, { width: 4, fuzz: 0 })
    p(ctx, curve([[50, 30], [132, 10], [132, 34], [50, 54]]), ink, { width: 4, fuzz: 0 })
  }
  return c
}

// ------------------------------------------------------------------ the suitcase
export const FLAGS = {
  Bangladesh: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#1f7a4c'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#e2453f'
    ctx.beginPath()
    ctx.arc(x + w * 0.45, y + h / 2, h * 0.3, 0, Math.PI * 2)
    ctx.fill()
  },
  UAE: (ctx, x, y, w, h) => {
    ;['#1f8a4c', '#ffffff', '#222222'].forEach((col, i) => {
      ctx.fillStyle = col
      ctx.fillRect(x + w * 0.25, y + (h * i) / 3, w * 0.75, h / 3)
    })
    ctx.fillStyle = '#d8333f'
    ctx.fillRect(x, y, w * 0.25, h)
  },
  China: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#d8333f'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#f6d34a'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 ? h * 0.09 : h * 0.22
      ctx.lineTo(x + w * 0.22 + Math.cos(a) * rr, y + h * 0.32 + Math.sin(a) * rr)
    }
    ctx.fill()
  },
  Japan: (ctx, x, y, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#d8333f'
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, h * 0.28, 0, Math.PI * 2)
    ctx.fill()
  },
  Malaysia: (ctx, x, y, w, h) => {
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#d8333f'
      ctx.fillRect(x, y + (h * i) / 7, w, h / 7)
    }
    ctx.fillStyle = '#1f3a8a'
    ctx.fillRect(x, y, w * 0.45, h * 0.57)
    ctx.fillStyle = '#f6d34a'
    ctx.beginPath()
    ctx.arc(x + w * 0.2, y + h * 0.28, h * 0.17, 0, Math.PI * 2)
    ctx.fill()
  },
}
export function suitcase(countries, seed = 1) {
  const c = canvas(600, 330)
  const ctx = c.getContext('2d')
  round(ctx, 14, 30, 572, 286, 26, '#5fa8b8', { glow: 0.4 })
  for (const x of [150, 450]) box(ctx, x - 18, 30, 36, 286, '#7a5236')
  round(ctx, 250, 6, 100, 40, 18, '#4a3a2e', { width: 4 })
  const spots = [[60, 70, -0.15], [210, 160, 0.1], [330, 70, 0.12], [480, 170, -0.1], [70, 200, 0.08]]
  countries.forEach((name, i) => {
    const [x, y, a] = spots[i % spots.length]
    ctx.save()
    ctx.translate(x + 50, y + 34)
    ctx.rotate(a)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-58, -40, 116, 80)
    FLAGS[name]?.(ctx, -50, -32, 100, 64)
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 3
    ctx.strokeRect(-58, -40, 116, 80)
    ctx.restore()
  })
  fibres(ctx)
  return c
}
export function suitcaseLid(seed = 1) {
  const c = canvas(600, 140)
  const ctx = c.getContext('2d')
  round(ctx, 14, 10, 572, 120, 24, '#6bb3c2', { glow: 0.45 })
  for (const x of [150, 450]) box(ctx, x - 18, 10, 36, 120, '#7a5236')
  return c
}
export function suitcaseSlip(text, seed = 1) {
  const c = canvas(520, 200)
  const ctx = c.getContext('2d')
  p(ctx, curve([[16, 20], [506, 12], [510, 184], [12, 190]]), '#fbf6e8', { width: 4, fuzz: 0 })
  write(ctx, text, 260, 102, { size: 54, max: 450, color: NAVY, font: HAND, weight: 700 })
  return c
}

// ------------------------------------------------------------------ her cat
// White, with a little brown patch on top of its head, a blue collar with a bell.
const FUR = '#fbf8f2'
const PATCH = '#a87652'
const PINKISH = '#f2a7b5'
const fur = (ctx, shape, o = {}) => p(ctx, shape, FUR, { glow: 0.55, shade: 0.24, ...o })
function catHead(ctx, x, y, s, { eyes = 'open', ears = 'up', mouthOpen = false } = {}) {
  for (const side of [-1, 1]) {
    const flat = ears === 'flat'
    const tip = flat ? [x + side * 74 * s, y - 34 * s] : [x + side * 50 * s, y - 86 * s]
    fur(ctx, curve([[x + side * 62 * s, y - 20 * s], tip, [x + side * 18 * s, y - 52 * s]]))
    p(ctx, curve([[x + side * 54 * s, y - 26 * s], [tip[0] - side * 8 * s, tip[1] + 14 * s], [x + side * 26 * s, y - 48 * s]]), PINKISH, { width: 3, fuzz: 0 })
  }
  fur(ctx, oval(x, y, 76 * s, 64 * s))
  p(ctx, curve([[x - 36 * s, y - 50 * s], [x, y - 64 * s], [x + 30 * s, y - 52 * s], [x + 12 * s, y - 36 * s], [x - 24 * s, y - 34 * s]]), PATCH, { width: 3 })
  if (eyes === 'open') {
    for (const side of [-1, 1]) p(ctx, oval(x + side * 30 * s, y - 2 * s, 17 * s, 18 * s), '#dff0c4', { width: 3.5, fuzz: 0, glow: 0.7 })
  } else {
    ctx.strokeStyle = '#3a2a2e'
    ctx.lineWidth = 4.5 * s
    ctx.lineCap = 'round'
    for (const side of [-1, 1]) {
      ctx.beginPath()
      if (eyes === 'happy') ctx.arc(x + side * 30 * s, y + 4 * s, 12 * s, 1.15 * Math.PI, 1.85 * Math.PI)
      else ctx.arc(x + side * 30 * s, y - 4 * s, 12 * s, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
    }
  }
  p(ctx, curve([[x - 8 * s, y + 18 * s], [x + 8 * s, y + 18 * s], [x, y + 28 * s]]), PINKISH, { width: 2.5, fuzz: 0 })
  if (mouthOpen) p(ctx, oval(x, y + 44 * s, 16 * s, 18 * s), '#d9576e', { width: 3, fuzz: 0 })
  else mouth(ctx, x, y + 34 * s, 10 * s, '#3a2a2e', 3 * s)
  blush(ctx, x - 50 * s, y + 22 * s, 16 * s, 9 * s)
  blush(ctx, x + 50 * s, y + 22 * s, 16 * s, 9 * s)
  ctx.strokeStyle = 'rgba(120, 110, 100, 0.6)'
  ctx.lineWidth = 2
  for (const side of [-1, 1])
    for (const dy of [-6, 6]) {
      ctx.beginPath()
      ctx.moveTo(x + side * 50 * s, y + (26 + dy) * s)
      ctx.lineTo(x + side * 104 * s, y + (20 + dy * 1.8) * s)
      ctx.stroke()
    }
}
function collar(ctx, x, y, s) {
  p(ctx, curve([[x - 48 * s, y], [x + 48 * s, y], [x + 44 * s, y + 14 * s], [x - 44 * s, y + 14 * s]]), '#4f74d8', { width: 3, fuzz: 0 })
  p(ctx, oval(x, y + 20 * s, 10 * s, 10 * s), '#f2c75c', { width: 3, fuzz: 0, glow: 0.8 })
}

export const CAT = {
  // lying down, looking at you (its pupils are added in the room, to follow the pointer)
  loaf: () => catDrawing(560, 360, (ctx) => {
    fur(ctx, oval(322, 264, 166, 78))
    for (const x of [210, 280]) fur(ctx, oval(x, 320, 40, 24))
    catHead(ctx, 206, 170, 1.18)
    collar(ctx, 206, 236, 1.18)
  }),
  // being stroked: eyes shut happy, ears flat
  happy: () => catDrawing(560, 360, (ctx) => {
    fur(ctx, oval(322, 264, 166, 78))
    for (const x of [210, 280]) fur(ctx, oval(x, 320, 40, 24))
    catHead(ctx, 206, 176, 1.18, { eyes: 'happy', ears: 'flat' })
    collar(ctx, 206, 242, 1.18)
  }),
  // asleep, curled up
  sleep: () => catDrawing(560, 360, (ctx) => {
    fur(ctx, oval(300, 262, 160, 86))
    p(ctx, curve([[120, 300], [200, 336], [360, 340], [470, 290], [440, 330], [300, 356], [150, 340]]), FUR, { glow: 0.5 })
    catHead(ctx, 196, 226, 1.12, { eyes: 'shut' })
  }),
  // rolled over, paws in the air
  belly: () => catDrawing(560, 360, (ctx) => {
    for (const [x, y, a] of [[230, 150, -0.4], [290, 140, 0.3], [380, 170, -0.2], [430, 186, 0.4]]) fur(ctx, oval(x, y, 22, 46, a))
    fur(ctx, oval(320, 250, 196, 88))
    p(ctx, oval(330, 236, 120, 54), '#fff7f6', { width: 2.5 })
    catHead(ctx, 150, 246, 1.12, { eyes: 'happy' })
  }),
  // a big stretch, front paws out
  stretch: () => catDrawing(620, 380, (ctx) => {
    fur(ctx, curve([[150, 300], [300, 240], [470, 160], [540, 200], [480, 280], [300, 320]]))
    fur(ctx, oval(110, 330, 70, 18))
    p(ctx, curve([[530, 190], [580, 90], [600, 110], [560, 210]]), FUR, { glow: 0.5 })
    catHead(ctx, 190, 252, 0.9, { eyes: 'shut' })
  }),
  // a yawn
  yawn: () => catDrawing(560, 360, (ctx) => {
    fur(ctx, oval(322, 264, 166, 78))
    for (const x of [210, 280]) fur(ctx, oval(x, 320, 40, 24))
    catHead(ctx, 206, 170, 1.18, { eyes: 'shut', mouthOpen: true })
    collar(ctx, 206, 236, 1.18)
  }),
  // sitting up (by her leg, or on the notebook)
  sit: () => catDrawing(380, 480, (ctx) => {
    p(ctx, curve([[300, 450], [350, 380], [340, 300], [320, 330], [326, 400], [290, 440]]), FUR, { glow: 0.5 })
    fur(ctx, oval(190, 360, 110, 110))
    for (const x of [150, 230]) fur(ctx, oval(x, 450, 30, 20))
    catHead(ctx, 190, 186, 1.15)
    collar(ctx, 190, 250, 1.15)
  }),
  // walking, side on, facing right: two steps
  walk1: () => catWalk(0),
  walk2: () => catWalk(1),
  // a paw up, swatting
  swat: () => catDrawing(560, 360, (ctx) => {
    fur(ctx, oval(322, 264, 166, 78))
    fur(ctx, oval(280, 320, 40, 24))
    fur(ctx, oval(126, 150, 26, 50, 0.5))
    catHead(ctx, 206, 170, 1.18)
    collar(ctx, 206, 236, 1.18)
  }),
  // its tail, apart, so it can flick
  tail: () => catDrawing(300, 160, (ctx) => {
    p(ctx, curve([[20, 120], [120, 140], [230, 100], [280, 30], [292, 60], [250, 130], [130, 160], [20, 150]]), FUR, { glow: 0.5 })
  }),
}
function catDrawing(w, h, draw) {
  const c = canvas(w, h)
  draw(c.getContext('2d'))
  fibres(c.getContext('2d'))
  return c
}
function catWalk(step) {
  return catDrawing(600, 400, (ctx) => {
    const legs = step ? [[160, 0.25], [230, -0.2], [380, 0.2], [450, -0.25]] : [[160, -0.2], [230, 0.25], [380, -0.25], [450, 0.2]]
    for (const [x, a] of legs) {
      ctx.save()
      ctx.translate(x, 260)
      ctx.rotate(a)
      fur(ctx, curve([[-16, 0], [16, 0], [14, 110], [-14, 110]]))
      ctx.restore()
    }
    p(ctx, curve([[100, 230], [60, 150], [40, 80], [60, 70], [80, 150], [130, 220]]), FUR, { glow: 0.5 })
    fur(ctx, oval(310, 240, 170, 66))
    catHead(ctx, 488, 166, 1.02)
  })
}
// a string toy, dangling from a stick out of sight
export function stringToy(seed = 1) {
  const c = canvas(140, 640)
  const ctx = c.getContext('2d')
  ctx.strokeStyle = '#4a3a2e'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(70, 0)
  ctx.lineTo(70, 540)
  ctx.stroke()
  p(ctx, oval(70, 572, 40, 40), '#ef7f9a', { fuzz: 2, glow: 0.5 })
  p(ctx, curve([[70, 600], [120, 630], [90, 640], [60, 620]]), '#8bc7f0', { width: 3 })
  return c
}
// a letter z, for a sleeping cat
export function zee(seed = 1) {
  const c = canvas(90, 90)
  const ctx = c.getContext('2d')
  write(ctx, 'z', 45, 44, { size: 80, color: '#f7f2e4', font: HAND, weight: 700 })
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 2
  ctx.font = `700 80px ${HAND}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeText('z', 45, 44)
  return c
}
