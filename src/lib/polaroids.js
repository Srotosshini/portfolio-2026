// Stand-in drawings for the About room: her camera on its tripod, pushpins,
// the countdown badges and the flash, a heart, the rug, and the map behind the
// polaroids. Like everything in placeholders.js, each one is replaced by her
// own drawing when the file exists (see the README). Her doodle is doodle.js;
// the rest of her room is room-things.js; the city scenes are scenes.js.
import { PALETTE as P, rng, canvas } from './paper.js'
import { marker, write, fibres } from './placeholders.js'

// ------------------------------------------------------------------ her camera

// Her little instant camera on its tripod, turned three-quarters, its lens to
// the left (toward her). The room puts the blinking light, the flash and the
// slot the photos come out of at fixed places on the drawing (see about.js).
export function selfieCamera(seed = 1) {
  const c = canvas(400, 780)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed)
  const leg = '#4b4a55'
  // the tripod: the back leg first, then the head, the column and the two front legs
  m.line([[196, 384], [212, 760]], { width: 9, color: '#36353e' })
  m.shape([[170, 270], [222, 270], [214, 296], [178, 296]], leg, { width: 5 })
  m.shape([[184, 294], [208, 294], [206, 392], [186, 392]], '#6b6a76', { width: 5 })
  m.shape([[186, 382], [196, 392], [44, 772], [24, 766]], leg, { width: 5 })
  m.shape([[196, 392], [206, 382], [372, 766], [352, 772]], leg, { width: 5 })
  for (const [x, y] of [[112, 590], [286, 590]]) m.rect(x - 13, y - 9, 26, 18, '#2c2b33', { width: 3 })
  // the camera: front face (lens, flash, light), side face, top (with the slot)
  const body = '#a9cde8'
  m.shape([[150, 40], [372, 40], [372, 236], [240, 272]], '#86b3d6', { width: 6 }) // side
  m.shape([[14, 64], [240, 64], [372, 40], [150, 40]], '#c4def0', { width: 6 }) // top
  m.shape([[14, 64], [240, 64], [240, 272], [14, 272]], body, { width: 6 }) // front
  m.line([[118, 57], [306, 46]], { width: 7, color: '#28303c' }) // the slot the photos come out of
  m.blob(118, 172, 64, 70, '#e9eef4', { width: 6 }) // the lens: its barrel,
  m.blob(118, 172, 44, 49, '#27324a', { width: 5 }) // the glass,
  m.blob(104, 154, 12, 14, '#7f93b8', { width: 2 }) // and the light in it
  m.rect(30, 82, 56, 30, '#f7f3e6', { width: 4 }) // the flash
  for (const x of [42, 56, 70]) m.line([[x, 88], [x, 106]], { width: 2, color: '#c9c3b0' })
  m.blob(207, 97, 15, 15, '#2d2226', { width: 4 }) // where the countdown light shines
  m.rect(172, 220, 54, 30, '#c4def0', { width: 3 }) // the shutter button
  // a sticker on its side, and the strap
  m.shape(
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rad = i % 2 ? 11 : 26
      return [306 + Math.cos(a) * rad, 136 + Math.sin(a) * rad]
    }),
    '#f5d36a',
    { width: 3 },
  )
  m.line([[372, 90], [388, 140], [380, 210], [366, 230]], { width: 5, color: '#e58fa0' })
  fibres(ctx)
  return c
}

// ------------------------------------------------------------------ the wall

// A pushpin, seen from the front: a round head, a glint.
export function pushpin(color = '#e0483e') {
  const c = canvas(72, 72)
  const ctx = c.getContext('2d')
  const m = marker(ctx, 3, { width: 4, wobble: 0.6 })
  m.blob(36, 36, 27, 27, color)
  m.blob(36, 36, 15, 15, null, { width: 2, color: 'rgba(0, 0, 0, 0.35)' })
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.beginPath()
  ctx.ellipse(27, 26, 7, 5, -0.6, 0, Math.PI * 2)
  ctx.fill()
  return c
}

// ------------------------------------------------------------------ the studio

// a round paper badge with a big number on it, for the countdown
export function badge(text, color, seed = 1) {
  const c = canvas(220, 220)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 7 })
  m.blob(110, 110, 96, 96, color)
  m.blob(110, 110, 78, 78, null, { width: 3, color: 'rgba(255, 255, 255, 0.7)' })
  write(ctx, text, 110, 116, { size: 120, max: 150, color: P.navy, weight: 700 })
  fibres(ctx)
  return c
}

// the flash going off: a paper starburst
export function starburst(seed = 1) {
  const c = canvas(300, 300)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5, color: '#e0a23a' })
  const r = rng(seed * 5)
  const pts = []
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const rad = i % 2 ? 62 + r() * 10 : 132 + r() * 14
    pts.push([150 + Math.cos(a) * rad, 150 + Math.sin(a) * rad])
  }
  m.shape(pts, '#fff3b0')
  m.blob(150, 150, 56, 56, '#ffffff', { width: 3 })
  return c
}

// a tiny red heart, for a place on the map once she has been
export function heart(seed = 1) {
  const c = canvas(80, 72)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, color: '#7a1420' })
  const pts = []
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 2
    pts.push([40 + 16 * Math.sin(t) ** 3 * 2, 32 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2])
  }
  m.shape(pts, '#d8333f')
  return c
}

// a round braided rug
export function rug(seed = 1) {
  const c = canvas(700, 380)
  const ctx = c.getContext('2d')
  const rings = ['#e2a0a6', '#f3e2c0', '#8fb1e3', '#f3e2c0', '#e2a0a6', '#f2c75c', '#8fb1e3']
  rings.forEach((col, i) => {
    const k = 1 - i / rings.length
    marker(ctx, seed + i, { width: 4, wobble: 1.2, color: 'rgba(80, 60, 50, 0.55)' }).blob(350, 190, 340 * k, 180 * k, col)
  })
  fibres(ctx)
  return c
}

// ---- the map on the corkboard: the part of the world her places are in,
// drawn as a doodle. Rough outlines of the land, in degrees (longitude, latitude).
const LAND = [
  [[-168, 65], [-140, 70], [-95, 72], [-80, 63], [-60, 55], [-52, 47], [-70, 43], [-76, 35], [-81, 25], [-97, 26], [-97, 19], [-87, 15], [-80, 8], [-92, 15], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 55]],
  [[-55, 60], [-45, 60], [-20, 70], [-22, 82], [-60, 82], [-70, 77]],
  [[-80, 8], [-62, 10], [-50, 2], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-72, -50], [-74, -40], [-71, -18], [-81, -5]],
  [[-10, 36], [-9, 43], [-1, 46], [-4, 48], [5, 51], [8, 54], [12, 56], [5, 58], [5, 62], [15, 69], [28, 71], [40, 67], [40, 48], [30, 46], [28, 41], [20, 40], [16, 38], [12, 44], [8, 44], [3, 43], [-5, 36]],
  [[-17, 21], [-10, 30], [-5, 35], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [42, -2], [40, -15], [35, -25], [20, -35], [17, -29], [12, -17], [9, -1], [8, 4], [-8, 5], [-17, 14]],
  [[28, 41], [36, 36], [35, 32], [44, 15], [58, 22], [57, 26], [52, 25], [50, 30], [56, 27], [66, 25], [72, 21], [77, 8], [80, 15], [88, 22], [92, 21], [98, 16], [100, 4], [104, 1], [106, 10], [109, 19], [117, 23], [122, 31], [121, 39], [126, 39], [129, 35], [130, 43], [142, 47], [141, 53], [156, 58], [162, 63], [180, 66], [180, 72], [140, 73], [110, 77], [80, 73], [60, 70], [40, 67], [40, 48], [30, 46]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [131, -31], [115, -34]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [139, 40], [133, 34]],
  [[-5, 50], [1, 51], [0, 53], [-3, 56], [-5, 58], [-6, 55]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[95, 5], [105, -6], [115, -8], [120, -9], [110, -3], [100, 1]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -2]],
  [[120, 18], [122, 18], [126, 7], [124, 6], [121, 12]],
  [[80, 9], [82, 7], [81, 6], [80, 7]],
  [[172, -34], [178, -38], [174, -42], [167, -46], [172, -40]],
]
// where a place falls on the map, as fractions of the sheet (from the left, from the top)
export const mapSpot = (area) => (p) => [(30 + ((p.lon - area.lon0) / (area.lon1 - area.lon0)) * 840) / 900, (30 + ((area.lat1 - p.lat) / (area.lat1 - area.lat0)) * 540) / 600]
// the map itself: where each place is comes back from `spot(place)` as fractions of the sheet
export function worldMap(area, seed = 1) {
  const W = 900
  const H = 600
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5 })
  const x = (lon) => 30 + ((lon - area.lon0) / (area.lon1 - area.lon0)) * (W - 60)
  const y = (lat) => 30 + ((area.lat1 - lat) / (area.lat1 - area.lat0)) * (H - 60)
  m.rect(10, 10, W - 20, H - 20, '#cfe3f2')
  ctx.save()
  ctx.beginPath()
  ctx.rect(14, 14, W - 28, H - 28)
  ctx.clip()
  for (let i = 0; i < 6; i++) marker(ctx, 50 + i, { width: 2, color: 'rgba(80, 120, 170, 0.35)' }).line([[40, 80 + i * 90], [W - 40, 70 + i * 90]])
  const land = marker(ctx, seed + 3, { width: 4, wobble: 1.4, color: '#4f6b3c' })
  for (const outline of LAND) land.shape(outline.map(([lon, lat]) => [x(lon), y(lat)]), '#cbdca8')
  ctx.restore()
  m.rect(10, 10, W - 20, H - 20, null, { width: 6 })
  // a compass rose in a corner
  const cr = marker(ctx, seed + 8, { width: 3 })
  cr.line([[W - 70, 90], [W - 70, 30]])
  cr.line([[W - 100, 60], [W - 40, 60]])
  write(ctx, 'N', W - 70, 22, { size: 26 })
  fibres(ctx)
  return { canvas: c, spot: (p) => [x(p.lon) / W, y(p.lat) / H] }
}

