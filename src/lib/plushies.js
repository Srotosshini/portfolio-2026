// Stand-in drawings for the claw machine on the games box: the characters
// from her games as plush toys, drawn in marker on paper, soft and round, their
// seams stitched; and the machine's own parts (the marquee, the control panel,
// the inside, the claw). Like everything in placeholders.js, each one is
// replaced by her own drawing when the file exists (see the README).
import { PALETTE as P, rng, canvas } from './paper.js'
import { marker, write, fibres, oval, star } from './placeholders.js'

const INK = '#2d2a3a'
const OUTFIT = '#3d3944' // the heist crew's dark clothes
const STRAP = '#7a5236' // and their satchels

// a row of stitches along a seam
function stitches(ctx, pts, color = 'rgba(255, 250, 238, 0.8)', width = 2.6) {
  ctx.save()
  ctx.setLineDash([7, 6])
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.stroke()
  ctx.restore()
}
const arc = (cx, cy, rx, ry, a0, a1, n = 12) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]
  })
// big shiny button eyes
function eyes(m, ctx, xs, y, r = 15, ring = null) {
  for (const x of xs) {
    if (ring) m.blob(x, y, r + 8, r + 9, ring, { width: 3 })
    m.blob(x, y, r, r * 1.1, '#1d1a22', { width: 3 })
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x - r * 0.32, y - r * 0.38, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
}
function cheeks(ctx, xs, y, color = 'rgba(236, 130, 140, 0.45)') {
  ctx.fillStyle = color
  for (const x of xs) {
    ctx.beginPath()
    ctx.ellipse(x, y, 15, 9, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}
// the heist crew's outfit: a round dark body, a scarf, a satchel across it
function crewBody(m, ctx, skin, { tail } = {}) {
  tail?.()
  m.blob(100, 318, 30, 24, skin) // arms
  m.blob(260, 318, 30, 24, skin)
  m.blob(144, 392, 30, 18, OUTFIT) // feet
  m.blob(216, 392, 30, 18, OUTFIT)
  m.blob(180, 322, 86, 76, OUTFIT)
  stitches(ctx, arc(180, 322, 70, 60, 0.3, 2.84))
  m.line([[116, 270], [238, 362]], { width: 10, color: STRAP })
  m.rect(222, 338, 54, 42, STRAP, { width: 4 })
  m.line([[226, 352], [272, 352]], { width: 3, color: '#4e3322' })
  m.shape([[104, 246], [256, 246], [240, 280], [120, 280]], '#2c2a33') // the scarf
}

export const PLUSH = {
  // grey with a dark mask, a cream face, pointed ears, a striped tail
  raccoon(seed = 1) {
    const c = canvas(360, 420)
    const ctx = c.getContext('2d')
    const m = marker(ctx, seed, { width: 5, wobble: 1.3, color: INK })
    const grey = '#928c88'
    const dark = '#4d4240'
    const cream = '#eee4d6'
    crewBody(m, ctx, grey, {
      tail() {
        // a fat, fluffy tail, ringed dark
        const tail = [[228, 352], [276, 356], [320, 330], [348, 282], [354, 226], [334, 206], [306, 216], [300, 264], [278, 300], [240, 318]]
        m.shape(tail, grey)
        ctx.save()
        ctx.beginPath()
        tail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = dark
        for (const [x, y, a] of [[300, 330, 0.9], [328, 288, 0.4], [336, 238, 0.05]]) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(a)
          ctx.fillRect(-60, -9, 120, 18)
          ctx.restore()
        }
        ctx.restore()
        m.shape(tail, null)
      },
    })
    m.shape([[96, 124], [104, 44], [164, 96]], grey) // ears
    m.shape([[264, 124], [256, 44], [196, 96]], grey)
    m.shape([[112, 104], [114, 66], [146, 96]], cream, { width: 3 })
    m.shape([[248, 104], [246, 66], [214, 96]], cream, { width: 3 })
    m.blob(180, 156, 104, 94, grey) // head
    m.shape([[96, 176], [130, 210], [180, 236], [230, 210], [264, 176], [236, 196], [180, 206], [124, 196]], cream, { width: 3 }) // muzzle
    m.shape([[110, 120], [180, 132], [250, 120], [230, 104], [180, 112], [130, 104]], cream, { width: 3 }) // brows
    m.blob(136, 160, 36, 26, dark, { width: 3 }) // the mask
    m.blob(224, 160, 36, 26, dark, { width: 3 })
    eyes(m, ctx, [138, 222], 160, 14)
    m.blob(180, 196, 13, 9, '#1d1a22', { width: 3 })
    m.line([[170, 214], [180, 220], [190, 214]], { width: 3 })
    stitches(ctx, [[180, 64], [180, 104]])
    fibres(ctx)
    return c
  },

  // green, in a dark hood with a crest poking up, big eyes, a curled tail
  chameleon(seed = 1) {
    const c = canvas(360, 420)
    const ctx = c.getContext('2d')
    const m = marker(ctx, seed, { width: 5, wobble: 1.3, color: INK })
    const green = '#7fa483'
    const light = '#a8c79a'
    crewBody(m, ctx, green, {
      tail() {
        m.shape([[240, 360], [300, 350], [334, 312], [330, 276], [300, 268], [284, 292], [300, 312], [276, 330]], green)
        m.blob(304, 292, 14, 13, light, { width: 3 })
      },
    })
    m.shape([[166, 70], [180, 30], [196, 56], [204, 40], [210, 74]], green, { width: 4 }) // the crest
    m.blob(180, 156, 106, 98, OUTFIT) // the hood
    m.blob(180, 170, 78, 70, green) // the face inside it
    m.shape([[118, 196], [180, 214], [242, 196], [224, 226], [180, 236], [136, 226]], light, { width: 3 })
    eyes(m, ctx, [146, 214], 160, 17, '#e9d6b4')
    m.line([[150, 210], [180, 218], [210, 210]], { width: 3 })
    stitches(ctx, arc(180, 156, 92, 84, Math.PI * 1.08, Math.PI * 1.92), 'rgba(255, 250, 238, 0.55)')
    fibres(ctx)
    return c
  },

  // orange and cream, round ears, flying goggles pushed up on its head
  hamster(seed = 1) {
    const c = canvas(360, 420)
    const ctx = c.getContext('2d')
    const m = marker(ctx, seed, { width: 5, wobble: 1.3, color: INK })
    const orange = '#d48b55'
    const cream = '#f3dfc6'
    crewBody(m, ctx, orange)
    for (const x of [96, 264]) {
      m.blob(x, 92, 34, 32, orange)
      m.blob(x, 94, 20, 18, '#eab097', { width: 3 })
    }
    m.blob(180, 160, 104, 92, orange)
    m.shape([[110, 170], [140, 136], [180, 128], [220, 136], [250, 170], [244, 220], [180, 246], [116, 220]], cream, { width: 3 })
    m.shape([[86, 108], [274, 108], [268, 132], [92, 132]], '#3a3640', { width: 4 }) // goggle strap
    for (const x of [136, 224]) {
      m.blob(x, 106, 34, 28, '#3a3640', { width: 4 })
      m.blob(x, 106, 22, 17, '#8ea3b4', { width: 3 })
    }
    eyes(m, ctx, [146, 214], 176, 14)
    m.blob(180, 204, 9, 7, '#e88e8e', { width: 3 })
    m.line([[168, 216], [180, 222], [192, 216]], { width: 3 })
    cheeks(ctx, [122, 238], 206)
    fibres(ctx)
    return c
  },

  // a patchwork caterpillar: a cream head with a sprout, a button, blushing;
  // segments of blue with a flower, pink gingham, lilac
  blob(seed = 1) {
    const c = canvas(460, 300)
    const ctx = c.getContext('2d')
    const m = marker(ctx, seed, { width: 5, wobble: 1.3, color: INK })
    m.blob(76, 206, 54, 52, '#b49cc9')
    stitches(ctx, arc(76, 206, 40, 38, -1.2, 1.4))
    m.blob(150, 192, 66, 64, '#eeb1ad')
    ctx.save()
    ctx.beginPath()
    oval(150, 192, 62, 60).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    for (let x = 84; x < 220; x += 24) ctx.fillRect(x, 120, 11, 150)
    for (let y = 126; y < 260; y += 24) ctx.fillRect(80, y, 150, 11)
    ctx.restore()
    m.blob(236, 182, 74, 72, '#a9c3df')
    const petals = [0, 1, 2, 3, 4].map((k) => [236 + Math.cos(k * 1.257) * 15, 170 + Math.sin(k * 1.257) * 15])
    for (const [x, y] of petals) m.blob(x, y, 11, 11, '#fbf7ee', { width: 2 })
    m.blob(236, 170, 7, 7, '#f0c55a', { width: 2 })
    stitches(ctx, arc(236, 182, 60, 58, 0.4, 2.6))
    m.blob(342, 150, 92, 88, '#f1e4cd') // the head
    m.shape([[334, 66], [312, 30], [286, 40], [326, 70]], '#8fae6e', { width: 4 }) // the sprout
    m.shape([[346, 66], [374, 28], [398, 44], [352, 72]], '#9cbb79', { width: 4 })
    m.line([[340, 72], [342, 60]], { width: 4, color: '#6f8f55' })
    m.blob(270, 128, 22, 22, '#9b7a5e', { width: 3 }) // the button
    m.line([[262, 120], [278, 136]], { width: 3 })
    m.line([[278, 120], [262, 136]], { width: 3 })
    eyes(m, ctx, [330, 392], 150, 13)
    cheeks(ctx, [306, 410], 182)
    m.line([[350, 178], [362, 184], [374, 178]], { width: 3 })
    stitches(ctx, arc(342, 150, 76, 72, 3.6, 5.6), 'rgba(160, 120, 90, 0.6)')
    fibres(ctx)
    return c
  },

  // a round yellow duck in its little brown boat
  duck(seed = 1) {
    const c = canvas(380, 380)
    const ctx = c.getContext('2d')
    const m = marker(ctx, seed, { width: 5, wobble: 1.3, color: INK })
    m.blob(190, 196, 120, 112, '#f1c84c')
    m.blob(186, 108, 76, 72, '#f1c84c') // the head
    m.blob(116, 228, 30, 46, '#e6b43b', { width: 4 }) // a wing
    m.shape([[150, 128], [222, 128], [212, 158], [160, 158]], '#ee8a3a') // the beak
    m.line([[160, 142], [212, 142]], { width: 3 })
    eyes(m, ctx, [154, 218], 96, 11)
    m.shape([[50, 262], [330, 262], [306, 336], [74, 336]], '#5c3b2a') // the boat
    m.line([[70, 292], [310, 292]], { width: 3, color: '#8a5a3e' })
    stitches(ctx, arc(190, 196, 104, 96, 0.4, 2.7), 'rgba(160, 110, 30, 0.55)')
    for (let x = 40; x < 340; x += 52) m.line([[x, 352], [x + 18, 344], [x + 36, 352]], { width: 4, color: '#4f7fc4' })
    fibres(ctx)
    return c
  },

  // a black kitten with a white chest and paws, yellow eyes with lightning in them
  kitten(seed = 1) {
    const c = canvas(360, 420)
    const ctx = c.getContext('2d')
    const m = marker(ctx, seed, { width: 5, wobble: 1.3, color: '#141218' })
    const black = '#2b2a31'
    m.shape([[250, 360], [306, 330], [330, 270], [318, 236], [300, 250], [304, 296], [262, 330]], black) // the tail
    m.blob(180, 316, 84, 82, black)
    m.shape([[150, 262], [210, 262], [226, 330], [180, 372], [134, 330]], '#f4f1ea', { width: 4 }) // white chest
    m.blob(140, 392, 28, 16, '#f4f1ea')
    m.blob(220, 392, 28, 16, '#f4f1ea')
    m.shape([[94, 128], [100, 40], [160, 94]], black) // ears
    m.shape([[266, 128], [260, 40], [200, 94]], black)
    m.shape([[110, 106], [112, 66], [144, 98]], '#e8a4b0', { width: 3 })
    m.shape([[250, 106], [248, 66], [216, 98]], '#e8a4b0', { width: 3 })
    m.blob(180, 160, 102, 92, black)
    m.shape([[140, 196], [180, 182], [220, 196], [208, 228], [180, 238], [152, 228]], '#f4f1ea', { width: 3 }) // muzzle
    for (const x of [136, 224]) {
      m.blob(x, 154, 24, 24, '#f4cf3a', { width: 3 })
      m.shape([[x + 4, 136], [x - 8, 156], [x + 2, 156], [x - 4, 174], [x + 10, 150], [x, 150]], '#141218', { width: 2 }) // the lightning
    }
    m.blob(180, 196, 9, 7, '#e88e9a', { width: 3 })
    m.line([[168, 210], [180, 216], [192, 210]], { width: 3, color: '#f4f1ea' })
    stitches(ctx, [[180, 76], [180, 108]], 'rgba(255, 255, 255, 0.45)')
    fibres(ctx)
    return c
  },
}

// ------------------------------------------------------------------ the machine

const KRAFT = '#c69b6d'
const KRAFT_DARK = '#8d6440'

// The marquee across the top: card, hand-lettered, with a hole cut for the screen.
export function marquee(title, seed = 1) {
  const c = canvas(2048, 200)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 7 })
  m.rect(6, 6, 2036, 188, KRAFT)
  for (let y = 20; y < 200; y += 15) {
    ctx.fillStyle = 'rgba(80, 50, 20, 0.05)'
    ctx.fillRect(0, y, 2048, 6)
  }
  m.rect(60, 40, 700, 120, '#f3e9d2', { width: 5 })
  write(ctx, title, 410, 101, { size: 92, max: 640 })
  m.rect(1290, 40, 700, 120, '#f3e9d2', { width: 5 })
  write(ctx, '★ win a friend ★', 1640, 101, { size: 70, max: 640, color: '#b5523b' })
  m.hole([[858, 26], [1190, 26], [1190, 174], [858, 174]]) // the screen shows through here
  fibres(ctx)
  return c
}

// The control panel along the bottom: a joystick, bottle-cap buttons, a coin
// slot, and the prize door down on the left.
export function controlPanel(seed = 1) {
  const c = canvas(2048, 230)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 7 })
  m.rect(6, 6, 2036, 218, KRAFT)
  m.line([[6, 40], [2042, 40]], { width: 4, color: KRAFT_DARK })
  m.rect(40, 62, 260, 150, '#2a1e16') // the prize door
  m.rect(54, 76, 232, 40, '#f3e9d2', { width: 4 })
  write(ctx, 'prizes', 170, 97, { size: 34, max: 200 })
  m.blob(1020, 150, 46, 14, '#4a3d33', { width: 4 }) // joystick
  m.shape([[1012, 150], [1028, 150], [1026, 92], [1014, 92]], P.tape, { width: 3 })
  m.blob(1020, 80, 26, 24, '#d6553f', { width: 4 })
  for (const [x, col] of [[1180, '#4f8c8a'], [1270, '#e2b53e']]) {
    m.blob(x, 132, 34, 34, col, { width: 4 })
    m.blob(x, 132, 21, 21, null, { width: 2 })
  }
  m.rect(1460, 92, 120, 80, '#a17c55', { width: 4 }) // the coin slot
  m.rect(1508, 104, 24, 56, '#1b1510', { width: 3 })
  write(ctx, 'insert coin', 1520, 196, { size: 26, max: 200 })
  m.shape(star(1800, 128, 50, 0.45), '#e9d27a', { width: 4 })
  fibres(ctx)
  return c
}

// The inside of the machine, behind the toys: dark card scattered with marker stars.
export function machineInside(seed = 1) {
  const c = canvas(1024, 256)
  const ctx = c.getContext('2d')
  const r = rng(seed * 7)
  ctx.fillStyle = '#3b3358'
  ctx.fillRect(0, 0, 1024, 256)
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '20,15,40' : '150,140,200'},${0.06 + r() * 0.1})`
    ctx.fillRect(r() * 1024, r() * 256, 1 + r() * 2, 4 + r() * 10)
  }
  for (let i = 0; i < 26; i++) marker(ctx, i, { width: 3, color: '#f3e3a8' }).shape(star(r() * 1024, r() * 256, 7 + r() * 9, 0.45), null)
  return c
}

// The claw: its hub, and one of its prongs (the room makes three of these).
export function clawHub(seed = 1) {
  const c = canvas(160, 140)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5 })
  m.rect(60, 6, 40, 40, '#9aa0aa')
  m.shape([[20, 44], [140, 44], [124, 130], [36, 130]], '#c3c8d0')
  m.line([[40, 88], [120, 88]], { width: 3, color: '#7d838e' })
  return c
}
export function clawProng(seed = 1) {
  const c = canvas(90, 230)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5 })
  m.shape([[30, 6], [58, 6], [62, 150], [80, 196], [60, 226], [46, 214], [56, 196], [38, 156]], '#c3c8d0')
  return c
}
