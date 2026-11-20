// Stand-in drawings for the claw machine on the games box: the characters
// from her games as stuffed toys (soft and round, shaded like something puffy,
// felt-fuzzy, stitched, with shiny button eyes), and the machine they are in:
// painted cardboard in sweet-shop colours, its cut edges showing the
// corrugation. Like everything in placeholders.js, each one is replaced by her
// own drawing when the file exists (see the README).
import { rng, canvas } from './paper.js'
import { write, HAND, fibres } from './placeholders.js'
import { darker, lighter, oval, curve, puff, stitch, eye, blush, mouth, tail, panel, cutEdge, gloss, heartShape, starShape, LINE, KRAFT } from './soft.js'

// The heist crew's outfit: a dark felt tunic, a scarf, a satchel on a strap, a belt.
const FELT = '#4b4556'
function outfit(ctx, skin, paw, seed) {
  // arms first, so the tunic sits over their tops
  for (const side of [-1, 1]) {
    puff(ctx, oval(260 + side * 132, 432, 40, 64, side * 0.55), skin, { seed })
    puff(ctx, oval(260 + side * 156, 476, 26, 22), paw, { seed, glow: 0.3 })
  }
  for (const side of [-1, 1]) {
    puff(ctx, oval(260 + side * 58, 560, 54, 30), paw, { seed, glow: 0.35 })
    puff(ctx, oval(260 + side * 58, 566, 26, 13), lighter(paw, 0.35), { seed, width: 2.5, fuzz: 0 })
  }
  puff(ctx, oval(260, 450, 138, 118), FELT, { seed, glow: 0.35, shade: 0.35 })
  stitch(ctx, (c) => c.ellipse(260, 450, 116, 98, 0, 0.25 * Math.PI, 0.75 * Math.PI), 'rgba(255, 255, 255, 0.35)')
  // belt
  ctx.save()
  oval(260, 450, 138, 118).path(ctx)
  ctx.clip()
  ctx.fillStyle = '#6d4a33'
  ctx.fillRect(110, 486, 300, 26)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.fillRect(110, 486, 300, 6)
  ctx.restore()
  puff(ctx, curve([[236, 484], [284, 484], [284, 514], [236, 514]]), '#e9d6a8', { seed, width: 3, fuzz: 0 })
  // the strap, across, and the satchel on the hip
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = darker('#8a5a3b', 0.4)
  ctx.lineWidth = 22
  ctx.beginPath()
  ctx.moveTo(176, 360)
  ctx.lineTo(352, 492)
  ctx.stroke()
  ctx.strokeStyle = '#8a5a3b'
  ctx.lineWidth = 15
  ctx.stroke()
  ctx.restore()
  puff(ctx, curve([[322, 470], [408, 466], [414, 540], [326, 546]]), '#94603f', { seed })
  puff(ctx, curve([[318, 468], [412, 462], [406, 500], [324, 506]]), '#a8714b', { seed, width: 3.5 })
  puff(ctx, oval(366, 500, 9, 9), '#e9d6a8', { seed, width: 2.5, fuzz: 0 })
  // the scarf, wrapped round the neck, its end hanging
  puff(ctx, curve([[130, 342], [260, 372], [390, 342], [392, 382], [260, 404], [128, 382]]), '#63597a', { seed })
  puff(ctx, curve([[152, 380], [192, 386], [184, 448], [146, 440]]), '#63597a', { seed })
  stitch(ctx, (c) => {
    c.moveTo(150, 372)
    c.quadraticCurveTo(260, 398, 370, 372)
  })
}

export const PLUSH = {
  // grey, a dark mask, cream face and brows, a big ringed tail
  raccoon(seed = 1) {
    const c = canvas(520, 600)
    const ctx = c.getContext('2d')
    const grey = '#9e9893'
    const dark = '#504543'
    const cream = '#f1e7da'
    const tailShape = curve([[300, 500], [380, 522], [456, 474], [498, 380], [492, 282], [458, 230], [426, 258], [440, 330], [420, 410], [362, 452]])
    puff(ctx, tailShape, grey, { seed })
    ctx.save()
    tailShape.path(ctx)
    ctx.clip()
    ctx.fillStyle = dark
    for (const [x, y, a] of [[392, 492, 0.75], [452, 418, 0.3], [470, 336, 0.05]]) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a)
      ctx.fillRect(-90, -16, 180, 32)
      ctx.restore()
    }
    ctx.beginPath()
    ctx.ellipse(462, 238, 46, 36, 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    tailShape.path(ctx)
    ctx.lineWidth = 4.5
    ctx.strokeStyle = darker(grey, 0.5)
    ctx.stroke()
    outfit(ctx, grey, dark, seed)
    for (const side of [-1, 1]) {
      puff(ctx, curve([[260 + side * 140, 150], [260 + side * 118, 36], [260 + side * 50, 92]]), grey, { seed })
      puff(ctx, curve([[260 + side * 128, 136], [260 + side * 116, 66], [260 + side * 74, 104]]), cream, { seed, width: 3 })
    }
    puff(ctx, oval(260, 218, 184, 156), grey, { seed })
    puff(ctx, oval(260, 292, 98, 62), cream, { seed, width: 3.5 })
    for (const side of [-1, 1]) puff(ctx, oval(260 + side * 76, 168, 54, 22, side * 0.2), cream, { seed, width: 3 })
    puff(ctx, curve([[108, 232], [150, 192], [214, 198], [260, 226], [306, 198], [370, 192], [412, 232], [372, 270], [306, 262], [260, 246], [214, 262], [148, 270]]), dark, { seed, glow: 0.25 })
    eye(ctx, 196, 230, 25)
    eye(ctx, 324, 230, 25)
    puff(ctx, curve([[236, 264], [284, 264], [260, 290]]), '#2a2026', { seed, width: 2.5, fuzz: 0 })
    mouth(ctx, 260, 300, 18)
    blush(ctx, 168, 296)
    blush(ctx, 352, 296)
    stitch(ctx, (k) => {
      k.moveTo(260, 64)
      k.lineTo(260, 120)
    })
    fibres(ctx)
    return c
  },

  // green, in a dark hood with its crest poking out, big ringed eyes, a curled tail
  chameleon(seed = 1) {
    const c = canvas(520, 600)
    const ctx = c.getContext('2d')
    const green = '#86b38b'
    const pale = '#b9d8a6'
    tail(ctx, [[330, 500], [400, 512], [458, 486], [486, 440], [480, 392], [448, 368], [418, 380], [412, 410], [432, 426], [452, 414]], green, 44)
    outfit(ctx, green, pale, seed)
    puff(ctx, curve([[232, 66], [246, 18], [262, 54], [280, 12], [294, 56], [314, 28], [318, 84]]), green, { seed, width: 3.5 })
    puff(ctx, curve([[88, 262], [98, 150], [160, 76], [260, 50], [360, 76], [422, 150], [432, 262], [402, 340], [260, 370], [118, 340]]), '#433d50', { seed, glow: 0.3 })
    puff(ctx, oval(260, 240, 128, 110), green, { seed })
    puff(ctx, oval(260, 300, 86, 38), pale, { seed, width: 3 })
    for (const x of [204, 316]) {
      puff(ctx, oval(x, 220, 48, 46), '#f2e3c3', { seed, width: 4 })
      eye(ctx, x, 222, 27)
    }
    ctx.save()
    ctx.strokeStyle = darker(green, 0.55)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(212, 296)
    ctx.quadraticCurveTo(260, 320, 308, 296)
    ctx.stroke()
    ctx.restore()
    blush(ctx, 168, 290, 20, 12)
    blush(ctx, 352, 290, 20, 12)
    stitch(ctx, (k) => k.ellipse(260, 236, 140, 122, 0, 1.1 * Math.PI, 1.9 * Math.PI), 'rgba(255, 255, 255, 0.4)')
    fibres(ctx)
    return c
  },

  // orange and cream, round ears, flying goggles pushed up on its head, puffy cheeks
  hamster(seed = 1) {
    const c = canvas(520, 600)
    const ctx = c.getContext('2d')
    const orange = '#dd9b64'
    const cream = '#f7e5cd'
    outfit(ctx, orange, cream, seed)
    for (const side of [-1, 1]) {
      puff(ctx, oval(260 + side * 104, 92, 50, 48), orange, { seed })
      puff(ctx, oval(260 + side * 104, 96, 28, 26), '#f2b3a8', { seed, width: 3 })
    }
    puff(ctx, oval(260, 222, 180, 156), orange, { seed })
    puff(ctx, curve([[150, 236], [196, 196], [260, 186], [324, 196], [370, 236], [380, 300], [320, 350], [260, 360], [200, 350], [140, 300]]), cream, { seed, width: 3.5 })
    // the goggles' strap, round the head
    ctx.save()
    oval(260, 222, 180, 156).path(ctx)
    ctx.clip()
    puff(ctx, curve([[60, 140], [460, 140], [460, 180], [60, 180]]), '#3e3a47', { seed, width: 3.5, glow: 0.2 })
    ctx.restore()
    for (const x of [192, 328]) {
      puff(ctx, oval(x, 150, 48, 46), '#3e3a47', { seed, glow: 0.25 })
      puff(ctx, oval(x, 150, 31, 30), '#9cc4d8', { seed, width: 3, glow: 0.7 })
    }
    eye(ctx, 204, 252, 21)
    eye(ctx, 316, 252, 21)
    puff(ctx, curve([[246, 282], [274, 282], [260, 298]]), '#ef9a9a', { seed, width: 2.5, fuzz: 0 })
    mouth(ctx, 260, 306, 15)
    blush(ctx, 160, 300, 30, 18)
    blush(ctx, 360, 300, 30, 18)
    fibres(ctx)
    return c
  },

  // a patchwork caterpillar: lilac, pink gingham, blue with a flower; a cream
  // head with a sprout, a button, rosy cheeks
  blob(seed = 1) {
    const c = canvas(660, 460)
    const ctx = c.getContext('2d')
    const segments = [
      [120, 322, 80, 76, '#bba5d6'],
      [226, 306, 94, 90, '#f1b2ae'],
      [348, 290, 104, 100, '#abc8e8'],
    ]
    for (const [x] of segments) puff(ctx, oval(x + 8, 404, 28, 18), '#f6ead8', { seed, glow: 0.3 })
    segments.forEach(([x, y, rx, ry, col], i) => {
      const shape = oval(x, y, rx, ry)
      puff(ctx, shape, col, { seed })
      if (i === 1) {
        // gingham
        ctx.save()
        shape.path(ctx)
        ctx.clip()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        for (let gx = x - rx; gx < x + rx; gx += 26) ctx.fillRect(gx, y - ry, 12, ry * 2)
        for (let gy = y - ry; gy < y + ry; gy += 26) ctx.fillRect(x - rx, gy, rx * 2, 12)
        ctx.restore()
        shape.path(ctx)
        ctx.lineWidth = 4.5
        ctx.strokeStyle = darker(col, 0.5)
        ctx.stroke()
      }
      if (i === 2) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 - Math.PI / 2
          puff(ctx, oval(x + 4 + Math.cos(a) * 18, y - 20 + Math.sin(a) * 18, 15, 12, a), '#fffaf0', { seed, width: 2.5, fuzz: 0 })
        }
        puff(ctx, oval(x + 4, y - 20, 9, 9), '#f2c75c', { seed, width: 2, fuzz: 0 })
      }
      stitch(ctx, (k) => k.ellipse(x, y, rx - 12, ry - 12, 0, -0.35 * Math.PI, 0.35 * Math.PI))
    })
    // the head
    ctx.save()
    ctx.strokeStyle = '#6f8f55'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(500, 118)
    ctx.quadraticCurveTo(504, 96, 498, 78)
    ctx.stroke()
    ctx.restore()
    puff(ctx, curve([[498, 84], [456, 44], [420, 56], [440, 92]]), '#94b973', { seed, width: 3.5 })
    puff(ctx, curve([[502, 84], [548, 36], [586, 54], [552, 96]]), '#a6c886', { seed, width: 3.5 })
    puff(ctx, oval(500, 244, 132, 124), '#f4e9d6', { seed })
    puff(ctx, oval(392, 196, 32, 32), '#a5805f', { seed, width: 3.5 })
    ctx.save()
    ctx.strokeStyle = '#3d2a20'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(380, 184)
    ctx.lineTo(404, 208)
    ctx.moveTo(404, 184)
    ctx.lineTo(380, 208)
    ctx.stroke()
    ctx.restore()
    eye(ctx, 476, 246, 21)
    eye(ctx, 562, 246, 21)
    blush(ctx, 436, 290, 26, 15)
    blush(ctx, 600, 290, 22, 14)
    mouth(ctx, 520, 290, 16)
    stitch(ctx, (k) => k.ellipse(500, 244, 114, 106, 0, 1.15 * Math.PI, 1.85 * Math.PI), 'rgba(160, 120, 90, 0.55)')
    fibres(ctx)
    return c
  },

  // a round yellow duck, sitting in its little wooden boat
  duck(seed = 1) {
    const c = canvas(560, 540)
    const ctx = c.getContext('2d')
    const yellow = '#f8d05a'
    puff(ctx, oval(280, 342, 176, 122), yellow, { seed })
    puff(ctx, oval(184, 344, 64, 46, -0.35), '#f1c04a', { seed })
    puff(ctx, curve([[264, 66], [282, 40], [300, 66], [318, 50], [312, 86]]), yellow, { seed, width: 3.5 })
    puff(ctx, oval(286, 190, 124, 114), yellow, { seed })
    eye(ctx, 246, 178, 19)
    eye(ctx, 326, 178, 19)
    puff(ctx, curve([[236, 214], [336, 214], [344, 240], [286, 266], [228, 240]]), '#f59a47', { seed, width: 4 })
    ctx.save()
    ctx.strokeStyle = darker('#f59a47', 0.45)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(244, 234)
    ctx.quadraticCurveTo(286, 246, 328, 234)
    ctx.stroke()
    ctx.restore()
    blush(ctx, 206, 222, 24, 14)
    blush(ctx, 366, 222, 24, 14)
    // the boat
    puff(ctx, curve([[52, 398], [508, 398], [470, 498], [94, 498]]), '#8a5a3c', { seed, glow: 0.3 })
    puff(ctx, curve([[44, 392], [516, 392], [510, 424], [50, 424]]), '#b07a52', { seed, width: 4 })
    ctx.save()
    ctx.strokeStyle = 'rgba(60, 35, 20, 0.45)'
    ctx.lineWidth = 3
    for (const y of [452, 476]) {
      ctx.beginPath()
      ctx.moveTo(84 + (y - 440) * 0.4, y)
      ctx.lineTo(476 - (y - 440) * 0.4, y)
      ctx.stroke()
    }
    ctx.strokeStyle = '#7fb0e6'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    for (let x = 60; x < 520; x += 70) {
      ctx.beginPath()
      ctx.arc(x + 18, 528, 18, 1.15 * Math.PI, 1.85 * Math.PI)
      ctx.stroke()
    }
    ctx.restore()
    fibres(ctx)
    return c
  },

  // a black kitten: white chest, muzzle and paws, yellow eyes with lightning in them
  kitten(seed = 1) {
    const c = canvas(520, 600)
    const ctx = c.getContext('2d')
    const black = '#3a3942'
    const white = '#f8f4ed'
    tail(ctx, [[330, 510], [404, 500], [452, 452], [462, 380], [446, 326], [426, 300]], black, 40)
    for (const side of [-1, 1]) {
      puff(ctx, oval(260 + side * 132, 432, 40, 64, side * 0.55), black, { seed, glow: 0.3 })
      puff(ctx, oval(260 + side * 156, 476, 26, 22), white, { seed })
    }
    for (const side of [-1, 1]) puff(ctx, oval(260 + side * 58, 560, 54, 30), white, { seed })
    puff(ctx, oval(260, 452, 136, 118), black, { seed, glow: 0.3 })
    puff(ctx, curve([[206, 346], [314, 346], [336, 434], [260, 512], [184, 434]]), white, { seed, width: 3.5 })
    for (const side of [-1, 1]) {
      puff(ctx, curve([[260 + side * 150, 160], [260 + side * 136, 30], [260 + side * 48, 96]]), black, { seed, glow: 0.3 })
      puff(ctx, curve([[260 + side * 136, 142], [260 + side * 128, 62], [260 + side * 74, 106]]), '#efa6b2', { seed, width: 3 })
    }
    puff(ctx, oval(260, 222, 182, 156), black, { seed, glow: 0.32 })
    puff(ctx, curve([[198, 276], [228, 252], [260, 262], [292, 252], [322, 276], [314, 320], [260, 338], [206, 320]]), white, { seed, width: 3.5 })
    for (const x of [188, 332]) {
      puff(ctx, oval(x, 214, 42, 42), '#f7d33f', { seed, width: 4, glow: 0.55 })
      puff(ctx, curve([[x + 8, 182], [x - 14, 218], [x + 2, 218], [x - 10, 248], [x + 16, 208], [x, 208]]), '#1c1820', { seed, width: 0, fuzz: 0 })
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x - 16, 198, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    puff(ctx, curve([[248, 276], [272, 276], [260, 290]]), '#ef9aa8', { seed, width: 2.5, fuzz: 0 })
    mouth(ctx, 260, 298, 14)
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    for (const side of [-1, 1])
      for (const dy of [-8, 6]) {
        ctx.beginPath()
        ctx.moveTo(260 + side * 70, 292 + dy)
        ctx.lineTo(260 + side * 132, 284 + dy * 1.8)
        ctx.stroke()
      }
    ctx.restore()
    blush(ctx, 198, 300, 18, 10)
    blush(ctx, 322, 300, 18, 10)
    fibres(ctx)
    return c
  },
}

// ------------------------------------------------------------------ the machine
// Painted card in sweet-shop colours, its cut edges showing the corrugation.
const MINT = '#93d8ca'
const PINK = '#f6a9bd'
const CREAM = '#fff4de'

// The marquee across the top: the sign, the screen's bezel (cut through), a banner.
export function marquee(title, seed = 1) {
  const c = canvas(2048, 212)
  const ctx = c.getContext('2d')
  panel(ctx, 4, 4, 2040, 190, 26, MINT)
  cutEdge(ctx, 10, 194, 2028, 14)
  ctx.fillStyle = PINK
  ctx.fillRect(30, 20, 1988, 8)
  ctx.fillRect(30, 168, 1988, 8)
  // the sign
  panel(ctx, 640, 26, 768, 150, 75, CREAM, { width: 6 })
  panel(ctx, 656, 40, 736, 122, 61, lighter(PINK, 0.55), { width: 3, line: PINK })
  write(ctx, title, 1027, 106, { size: 96, max: 660, color: '#b04870', font: HAND, weight: 700 })
  write(ctx, title, 1024, 102, { size: 96, max: 660, color: '#e2557f', font: HAND, weight: 700 })
  for (const x of [604, 1444]) puff(ctx, heartShape(x, 100, 30), '#ef6f8f', { line: LINE, width: 4, fuzz: 0 })
  // the screen's bezel, a rounded TV, with the screen cut right out
  panel(ctx, 150, 22, 400, 160, 34, PINK, { width: 6 })
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.roundRect(182, 40, 336, 124, 18)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.roundRect(182, 40, 336, 124, 18)
  ctx.stroke()
  // a banner on the right
  panel(ctx, 1540, 52, 380, 98, 49, '#ffe08a', { width: 5 })
  write(ctx, '★ win a friend ★', 1730, 101, { size: 50, max: 330, color: '#c0542f', font: HAND, weight: 700 })
  fibres(ctx)
  return c
}

// The control panel along the bottom: the prize door, a ball-top joystick,
// two big buttons, a coin slot, stickers.
export function controlPanel(seed = 1) {
  const c = canvas(2048, 236)
  const ctx = c.getContext('2d')
  cutEdge(ctx, 10, 0, 2028, 14)
  panel(ctx, 4, 12, 2040, 220, 22, MINT)
  panel(ctx, 20, 18, 2008, 34, 17, PINK, { width: 4 })
  // the prize door
  panel(ctx, 64, 70, 280, 150, 24, '#5d9e93', { width: 5 })
  panel(ctx, 84, 86, 240, 64, 20, darker('#5d9e93', 0.45), { width: 4 })
  panel(ctx, 120, 160, 168, 44, 22, CREAM, { width: 3.5 })
  write(ctx, 'prize', 204, 183, { size: 34, max: 140, color: '#e2557f', font: HAND, weight: 700 })
  // joystick
  puff(ctx, oval(1000, 196, 72, 20), '#3f4a52', { line: LINE, width: 4, fuzz: 0 })
  puff(ctx, curve([[990, 196], [1010, 196], [1008, 120], [992, 120]]), '#cfd6dc', { line: LINE, width: 4, fuzz: 0, glow: 0.6 })
  gloss(ctx, 1000, 104, 38, '#ef4f5b')
  // buttons
  gloss(ctx, 1170, 152, 44, '#f48aa8')
  gloss(ctx, 1290, 152, 44, '#ffd15e')
  // coin slot
  panel(ctx, 1430, 82, 150, 110, 18, '#d7dde2', { width: 4.5, glow: 0.6 })
  panel(ctx, 1494, 96, 22, 62, 8, '#2a3036', { width: 3 })
  write(ctx, 'insert coin', 1505, 176, { size: 24, max: 136, color: LINE, font: HAND, weight: 700 })
  puff(ctx, oval(1640, 136, 34, 34), '#f2c75c', { line: '#8a6a1c', width: 4, fuzz: 0, glow: 0.6 })
  write(ctx, '1', 1640, 138, { size: 34, color: '#8a6a1c', weight: 700 })
  // stickers
  puff(ctx, starShape(1790, 134, 46), '#ffe08a', { line: LINE, width: 4, fuzz: 0 })
  puff(ctx, heartShape(1910, 130, 36), '#ef6f8f', { line: LINE, width: 4, fuzz: 0 })
  fibres(ctx)
  return c
}

// a post either side of the window: mint, with a pink stripe and dots
export function post(seed = 1) {
  const c = canvas(96, 640)
  const ctx = c.getContext('2d')
  cutEdge(ctx, 0, 0, 8, 640)
  cutEdge(ctx, 88, 0, 8, 640)
  ctx.fillStyle = MINT
  ctx.fillRect(8, 0, 80, 640)
  ctx.fillStyle = PINK
  ctx.fillRect(34, 0, 28, 640)
  ctx.fillStyle = CREAM
  for (let y = 24; y < 640; y += 48) {
    ctx.beginPath()
    ctx.arc(48, y, 7, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = LINE
  ctx.lineWidth = 4
  ctx.strokeRect(8, -4, 80, 648)
  fibres(ctx)
  return c
}

// The inside of the machine, behind the toys: a soft sky, clouds, sparkles.
export function machineInside(seed = 1) {
  const c = canvas(1024, 512)
  const ctx = c.getContext('2d')
  const r = rng(seed * 7)
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#cfc4f1')
  g.addColorStop(0.55, '#f6cfe0')
  g.addColorStop(1, '#ffe2cf')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 512)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  for (let i = 0; i < 6; i++) {
    const x = r() * 1024
    const y = 60 + r() * 200
    for (let k = 0; k < 4; k++) {
      ctx.beginPath()
      ctx.ellipse(x + k * 34 - 50, y + Math.sin(k * 1.7) * 8, 40, 26, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = r() * 1024
    const y = r() * 512
    const s = 4 + r() * 8
    ctx.fillStyle = r() < 0.5 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 224, 140, 0.85)'
    ctx.beginPath()
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      const rr = k % 2 ? s * 0.25 : s
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
    }
    ctx.closePath()
    ctx.fill()
  }
  return c
}

// the window's sheen: soft streaks of light across clear cellophane
export function glassSheen() {
  const c = canvas(1024, 256)
  const ctx = c.getContext('2d')
  for (const [x, w, a] of [[180, 90, 0.22], [300, 30, 0.16], [760, 60, 0.14]]) {
    ctx.save()
    ctx.translate(x, 128)
    ctx.rotate(0.5)
    const g = ctx.createLinearGradient(-w, 0, w, 0)
    g.addColorStop(0, 'rgba(255, 255, 255, 0)')
    g.addColorStop(0.5, `rgba(255, 255, 255, ${a})`)
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = g
    ctx.fillRect(-w, -300, w * 2, 600)
    ctx.restore()
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, 1016, 248)
  return c
}

// the prize chute: a clear box with a pink rim and a label
export function chute(seed = 1) {
  const c = canvas(420, 220)
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(235, 248, 255, 0.45)'
  ctx.beginPath()
  ctx.roundRect(8, 34, 404, 180, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 4
  ctx.stroke()
  panel(ctx, 4, 8, 412, 40, 20, PINK, { width: 4.5 })
  panel(ctx, 120, 110, 180, 56, 28, CREAM, { width: 3.5 })
  write(ctx, 'prize ↓', 210, 139, { size: 36, max: 160, color: '#e2557f', font: HAND, weight: 700 })
  return c
}

// The claw: its hub, and one of its prongs (the room makes three).
export function clawHub(seed = 1) {
  const c = canvas(200, 170)
  const ctx = c.getContext('2d')
  panel(ctx, 76, 6, 48, 46, 10, '#c9ced6', { width: 4, glow: 0.7 })
  puff(ctx, curve([[26, 54], [174, 54], [158, 150], [100, 164], [42, 150]]), '#e2c35a', { line: '#6b5420', width: 5, glow: 0.75, fuzz: 0 })
  ctx.strokeStyle = 'rgba(107, 84, 32, 0.6)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(46, 98)
  ctx.quadraticCurveTo(100, 112, 154, 98)
  ctx.stroke()
  return c
}
export function clawProng(seed = 1) {
  const c = canvas(110, 260)
  const ctx = c.getContext('2d')
  puff(ctx, curve([[36, 8], [70, 8], [74, 150], [96, 204], [78, 248], [56, 236], [66, 202], [44, 156]]), '#e2c35a', { line: '#6b5420', width: 5, glow: 0.7, fuzz: 0 })
  return c
}
