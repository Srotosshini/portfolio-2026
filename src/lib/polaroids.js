// Stand-in drawings for the About room, her room in miniature: her camera on
// its tripod, the corkboard and its map, the studio's backdrop roller and
// countdown badges, the pushpins, and the places in her polaroids. Like everything in placeholders.js, each one is replaced by her
// own drawing when the file exists (see the README); none of it is meant to
// survive to the finished site. Her doodle itself is in placeholders.js.
import { PALETTE as P, rng, canvas } from './paper.js'
import { marker, write, fibres, oval } from './placeholders.js'

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

// A corkboard in a light wooden frame.
export function corkboard(seed = 1) {
  const c = canvas(900, 700)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 7 })
  const r = rng(seed * 13)
  m.rect(10, 10, 880, 680, '#d2a873')
  m.rect(48, 48, 804, 604, '#c38d58', { width: 5 })
  // cork: specks dark and light
  ctx.save()
  ctx.beginPath()
  ctx.rect(52, 52, 796, 596)
  ctx.clip()
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = r() < 0.6 ? `rgba(110, 66, 30, ${0.18 + r() * 0.3})` : `rgba(240, 200, 150, ${0.2 + r() * 0.3})`
    ctx.beginPath()
    ctx.arc(52 + r() * 796, 52 + r() * 596, 1 + r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // the grain of the frame
  for (let i = 0; i < 14; i++) {
    const y = 16 + r() * 26
    m.line([[30 + r() * 300, y], [400 + r() * 460, y + (r() - 0.5) * 6]], { width: 2, color: 'rgba(120, 80, 40, 0.5)' })
  }
  fibres(ctx)
  return c
}

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

// The painted backdrop's roller: a wooden rod with round knobs.
export function roller(seed = 1) {
  const c = canvas(900, 70)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5 })
  m.rect(30, 20, 840, 30, '#b07a4a')
  m.line([[40, 30], [860, 30]], { width: 3, color: 'rgba(255, 230, 190, 0.6)' })
  m.blob(30, 35, 26, 28, '#8a5a34')
  m.blob(870, 35, 26, 28, '#8a5a34')
  return c
}

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

// the shoebox the old polaroids go into when the board is full
export function memoryBox(seed = 1) {
  const c = canvas(520, 330)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 6 })
  m.shape([[30, 70], [490, 70], [470, 30], [50, 30]], '#9a6b42')
  m.rect(20, 70, 480, 250, '#d3a779')
  m.rect(110, 130, 300, 110, '#f3e9d2', { width: 4 })
  write(ctx, 'memories', 260, 186, { size: 64, max: 270 })
  m.shape(
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rad = i % 2 ? 9 : 20
      return [440 + Math.cos(a) * rad, 112 + Math.sin(a) * rad]
    }),
    '#f2c75c',
    { width: 3 },
  )
  fibres(ctx)
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
// the map's window onto the world: round all the places, with room to spare
export function mapArea(places) {
  const at = places.filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
  if (!at.length) return { lon0: -170, lon1: 190, lat0: -55, lat1: 80 }
  let lon0 = Math.min(...at.map((p) => p.lon)) - 28
  let lon1 = Math.max(...at.map((p) => p.lon)) + 28
  let lat0 = Math.min(...at.map((p) => p.lat)) - 20
  let lat1 = Math.max(...at.map((p) => p.lat)) + 20
  // never narrower than this, and the shape of the paper (3 : 2)
  const span = Math.max(lon1 - lon0, 110, (lat1 - lat0) * 1.5)
  const midLon = (lon0 + lon1) / 2
  const midLat = (lat0 + lat1) / 2
  return { lon0: midLon - span / 2, lon1: midLon + span / 2, lat0: midLat - span / 3, lat1: midLat + span / 3 }
}
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

// ------------------------------------------------------------------ the polaroids

// One polaroid, drawn onto `target`: the white frame, the photo coming up out
// of the white as it develops (`k`, 0 to 1), the place written in the margin.
export function polaroidFace(target, photo, caption, k = 1) {
  const ctx = target.getContext('2d')
  const W = target.width
  const H = target.height
  const pad = Math.round(W * 0.07)
  const size = W - pad * 2
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(0, 0, W, H)
  if (photo) ctx.drawImage(photo, pad, pad, size, size)
  if (k < 1) {
    ctx.fillStyle = `rgba(251, 248, 241, ${1 - k})`
    ctx.fillRect(pad, pad, size, size)
  }
  ctx.strokeStyle = 'rgba(40, 40, 60, 0.22)'
  ctx.lineWidth = 2
  ctx.strokeRect(pad, pad, size, size)
  ctx.save()
  ctx.globalAlpha = Math.min(1, Math.max(0, k * 1.6 - 0.4)) // written once there is something to see
  write(ctx, caption, W / 2, pad + size + (H - pad - size) / 2, { size: Math.round(H * 0.095), max: size * 0.94, color: P.navy })
  ctx.restore()
  ctx.strokeStyle = 'rgba(120, 110, 90, 0.4)'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
}

// Her, in front of a place: the photo in a polaroid.
export function selfie(target, place, her, index = 0) {
  const ctx = target.getContext('2d')
  const S = target.width
  ctx.drawImage(place, 0, 0, S, S)
  const h = S * 0.92
  const w = (h * her.width) / her.height
  ctx.drawImage(her, S / 2 - w / 2 + (index % 2 ? 0.17 : -0.17) * S, S * 0.22, w, h)
}

// ---- the places. Each is a little marker drawing of somewhere, square, for
// her doodle to stand in front of. A place with no drawing here gets hills and
// a sun (or her own drawing: drawings/place-<name>.png, see the README).
const SIZE = 440
export function place(name, seed = 1) {
  const c = canvas(SIZE, SIZE)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed * 17 + 3, { width: 5, wobble: 1.6 })
  const r = rng(seed * 31 + name.length)
  const key = name.toLowerCase().replace(/[^a-z]/g, '')
  ;(PLACES[key] || hills)(ctx, m, r)
  fibres(ctx)
  return c
}

function sky(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, SIZE)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)
}

const PLACES = {
  // a crowded street of painted buildings, and a cycle rickshaw
  dhaka(ctx, m, r) {
    sky(ctx, '#bfe3f2', '#f6e6c6')
    m.blob(370, 66, 32, 32, '#ffd34f')
    const tones = ['#e9b8a0', '#f0d48a', '#b8d4b0', '#d9a7c7', '#a9c4e0', '#f2c2a2']
    for (let x = -12; x < SIZE; ) {
      const w = 54 + r() * 40
      const h = 100 + r() * 120
      const top = 316 - h
      m.rect(x, top, w, h + 14, tones[Math.floor(r() * tones.length)], { width: 4 })
      for (let wy = top + 16; wy < 296; wy += 28) for (let wx = x + 11; wx < x + w - 16; wx += 19) m.rect(wx, wy, 9, 12, '#5a6f8f', { width: 2 })
      if (r() < 0.5) m.rect(x + 9, top - 18, 24, 18, '#9aa3ad', { width: 3 }) // a water tank on the roof
      x += w - 4
    }
    m.rect(-12, 318, SIZE + 24, 140, '#bdb5a6', { width: 4 })
    for (let x = 10; x < SIZE; x += 70) m.line([[x, 380], [x + 34, 380]], { width: 4, color: '#f6f1e2' })
    // the rickshaw: big wheels, a red hood painted in stripes, a little front wheel
    const rx = 286
    const ry = 392
    for (const [wx, wr] of [[rx + 74, 36], [rx - 52, 26]]) {
      m.blob(wx, ry + 4 + 36 - wr, wr, wr, null, { width: 5 })
      for (let a = 0; a < Math.PI; a += Math.PI / 4) m.line([[wx - Math.cos(a) * wr, ry + 40 - wr - Math.sin(a) * wr], [wx + Math.cos(a) * wr, ry + 40 - wr + Math.sin(a) * wr]], { width: 2 })
    }
    m.line([[rx - 52, ry + 14], [rx - 40, ry - 46], [rx - 64, ry - 52]], { width: 5 }) // handlebar
    m.line([[rx - 44, ry - 6], [rx + 74, ry + 4]], { width: 5 })
    m.rect(rx + 30, ry - 44, 84, 30, '#2f8f5b', { width: 4 }) // the seat
    m.shape([[rx + 28, ry - 44], [rx + 36, ry - 104], [rx + 76, ry - 124], [rx + 122, ry - 98], [rx + 118, ry - 44]], '#d8343b', { width: 4 })
    for (const [k, col] of [[0.3, '#f5d36a'], [0.55, '#2f8f5b'], [0.78, '#f5d36a']]) m.line([[rx + 30 + k * 10, ry - 46 - k * 70], [rx + 116 - k * 6, ry - 46 - k * 58]], { width: 4, color: col })
  },

  // the Grand Mosque: white domes and minarets, gold tips, the pool in front, palms
  abudhabi(ctx, m, r) {
    sky(ctx, '#f6b3a0', '#fce6b9')
    const white = '#fbfaf5'
    const gold = '#d9a93c'
    for (const mx of [44, 396]) {
      m.rect(mx - 12, 92, 24, 248, white, { width: 4 })
      for (const y of [150, 232]) m.rect(mx - 18, y, 36, 10, white, { width: 3 })
      m.blob(mx, 88, 13, 16, white, { width: 3 })
      m.line([[mx, 72], [mx, 50]], { width: 4, color: gold })
    }
    m.rect(78, 256, 284, 78, white, { width: 4 })
    for (let ax = 92; ax < 352; ax += 37) m.shape([[ax, 330], [ax, 296], [ax + 12, 280], [ax + 24, 296], [ax + 24, 330]], '#e9dcb6', { width: 2.5 })
    const dome = (cx, base, rad) => {
      m.rect(cx - rad * 0.9, base - 2, rad * 1.8, rad * 0.32, white, { width: 3 })
      const pts = []
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI
        pts.push([cx + Math.cos(a) * rad, base + Math.sin(a) * rad * 1.05])
      }
      pts.splice(7, 0, [cx, base - rad * 1.32])
      m.shape(pts, white, { width: 4 })
      m.line([[cx, base - rad * 1.3], [cx, base - rad * 1.3 - 18]], { width: 4, color: gold })
    }
    for (const [dx, dr] of [[118, 32], [322, 32], [168, 24], [272, 24]]) dome(dx, 258, dr)
    dome(220, 240, 60)
    m.rect(-12, 334, SIZE + 24, 58, '#7fb6d9', { width: 4 })
    for (let i = 0; i < 8; i++) m.line([[30 + r() * 380, 348 + r() * 34], [60 + r() * 380, 348 + r() * 34]], { width: 3, color: '#eef6fb' })
    m.rect(-12, 392, SIZE + 24, 60, '#ead09d', { width: 4 })
    for (const [px, h] of [[26, 150], [414, 136]]) {
      m.line([[px, 440], [px + 6, 440 - h]], { width: 8, color: '#8d6440' })
      const g = marker(ctx, px, { width: 4, color: '#2f6b45' })
      for (let a = -2.6; a < 0; a += 0.52) g.line([[px + 6, 440 - h], [px + 6 + Math.cos(a) * 58, 440 - h + Math.sin(a) * 34 + 26]], { width: 9, color: '#4f8f55' })
    }
  },

  // the skyline across the river at dusk: the Pearl Tower, the twisting tower, the bottle opener
  shanghai(ctx, m, r) {
    sky(ctx, '#6a78c4', '#f4aabb')
    ctx.fillStyle = 'rgba(255, 250, 220, 0.9)'
    for (let i = 0; i < 18; i++) ctx.fillRect(r() * SIZE, r() * 150, 3, 3)
    m.shape([[352, 340], [358, 72], [392, 64], [406, 340]], '#9fb1cc', { width: 4 }) // the bottle opener
    m.shape([[366, 92], [390, 90], [387, 114], [369, 114]], '#e9a3bf', { width: 3 })
    m.shape([[266, 340], [262, 124], [276, 42], [298, 34], [318, 112], [328, 340]], '#a9c0da', { width: 4 }) // the twisting tower
    m.line([[274, 320], [288, 220], [306, 110], [298, 40]], { width: 2.5 })
    for (let s = 0; s < 6; s++) {
      const w = 34 - s * 5
      m.rect(214 - w, 340 - (s + 1) * 38, w * 2, 40, '#8f9ab8', { width: 3 }) // Jin Mao, in tiers
    }
    m.line([[214, 112], [214, 70]], { width: 3 })
    // the Pearl Tower
    m.line([[118, 340], [142, 262]], { width: 6 })
    m.line([[178, 340], [158, 262]], { width: 6 })
    m.rect(144, 120, 12, 140, '#d3d9e8', { width: 3 })
    m.blob(150, 252, 36, 36, '#e8669a', { width: 4 })
    m.blob(150, 150, 20, 20, '#e8669a', { width: 4 })
    m.blob(150, 104, 9, 9, '#e8669a', { width: 3 })
    m.line([[150, 94], [150, 32]], { width: 4 })
    for (let x = -10; x < SIZE; x += 46) {
      const h = 26 + r() * 30
      m.rect(x, 340 - h, 44, h + 4, '#4c5680', { width: 3 })
      ctx.fillStyle = '#ffd77a'
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 6 + r() * 30, 344 - h + r() * (h - 10), 5, 6)
    }
    m.rect(-12, 342, SIZE + 24, 110, '#3f5f9e', { width: 4 })
    for (let i = 0; i < 14; i++) {
      const x = 20 + r() * 400
      m.line([[x, 360 + r() * 70], [x + 20 + r() * 20, 360 + r() * 70]], { width: 3, color: i % 3 ? '#f2c9d6' : '#ffd77a' })
    }
  },

  // tall sandstone pillars with trees on top, mist between them
  zhangjiajie(ctx, m, r) {
    sky(ctx, '#d4eaf1', '#eef5ee')
    const pillar = (x, bottom, w, h, color) => {
      const pts = [[x - w / 2, bottom]]
      for (let y = bottom; y > bottom - h; y -= 30) pts.push([x - w / 2 + (r() - 0.5) * 8, y])
      pts.push([x - w * 0.36, bottom - h - 8], [x, bottom - h - 16], [x + w * 0.36, bottom - h - 8])
      for (let y = bottom - h; y < bottom; y += 30) pts.push([x + w / 2 + (r() - 0.5) * 8, y])
      pts.push([x + w / 2, bottom])
      m.shape(pts, color, { width: 4 })
      for (let i = 0; i < 3; i++) {
        const cx = x - w / 3 + r() * (w * 0.66)
        m.line([[cx, bottom - h + 30 + r() * 40], [cx + (r() - 0.5) * 8, bottom - 20 - r() * 60]], { width: 2, color: 'rgba(80, 60, 40, 0.45)' })
      }
      for (let i = 0; i < 4; i++) m.blob(x - w / 2 + 6 + (i * w) / 3.4, bottom - h - 12 - r() * 8, 14 + r() * 6, 12 + r() * 5, i % 2 ? '#4f8a4a' : '#3f7a45', { width: 3 })
    }
    pillar(70, 380, 46, 236, '#cfc6b2')
    pillar(372, 380, 52, 270, '#cdc3ad')
    pillar(250, 380, 42, 200, '#d1c9b6')
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.ellipse(r() * SIZE, 270 + r() * 60, 60 + r() * 50, 14 + r() * 8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    pillar(150, 450, 66, 330, '#b6a283')
    pillar(318, 450, 58, 280, '#ad9a7c')
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.ellipse(r() * SIZE, 360 + r() * 50, 70 + r() * 50, 16 + r() * 8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    const g = marker(ctx, 9, { width: 4, color: '#2f5a37' })
    for (let x = -20; x < SIZE + 20; x += 40) g.blob(x + r() * 20, 420 + r() * 20, 34, 30, r() < 0.5 ? '#4f8a4a' : '#5d9a5a')
  },
}

// anywhere else: hills, a sun, a path
function hills(ctx, m, r) {
  sky(ctx, '#bfe0f0', '#f4ecd4')
  m.blob(330, 90, 36, 36, '#ffd34f')
  m.shape([[-20, 330], [80, 230], [190, 300], [300, 210], [460, 320], [460, 460], [-20, 460]], '#8fbf7f')
  m.shape([[-20, 380], [140, 320], [300, 360], [460, 330], [460, 460], [-20, 460]], '#6fa765')
  m.shape([[190, 460], [214, 360], [232, 360], [270, 460]], '#e9d7a8', { width: 3 })
  for (let i = 0; i < 4; i++) m.shape(oval(60 + r() * 320, 140 + r() * 50, 30, 12), '#ffffff', { width: 3 })
}
