// Stand-in drawings for the design room, the snowy Christmas market: the
// night sky, the street, the wooden stalls and what hangs on them, the snow,
// the string lights, and the insides of the stalls. Like everything in
// placeholders.js, each one is replaced by her own drawing when the file
// exists (see the README), and none of it is meant to survive to the
// finished site.
import { PALETTE as P, rng, canvas } from './paper.js'
import { BODY, marker, write, fibres, oval, star } from './placeholders.js'

const HI = P.highlighter
export const WOOD = '#8b5a37'
export const WARM = '#ffd682'
const WOOD_DARK = '#5b3720'
const SNOW = '#f6f8ff'
const SNOW_SHADE = '#ccd6ee'
const PINE = '#2f6b45'

const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
// a colour part of the way to another (both '#rrggbb')
export const mix = (a, b, t) => {
  const A = rgbOf(a)
  const B = rgbOf(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

function trace(ctx, pts) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}
// cut a shape right out of whatever is drawn
function cut(ctx, pts) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  trace(ctx, pts)
  ctx.fill()
  ctx.restore()
}
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]

// wood grain: long wavy strokes, darker knots
function grain(ctx, x, y, w, h, r, { vertical = true, color = 'rgba(40,20,8,0.22)', light = 'rgba(255,220,170,0.12)', n = 40 } = {}) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  for (let i = 0; i < n; i++) {
    ctx.strokeStyle = r() < 0.6 ? color : light
    ctx.lineWidth = 0.8 + r() * 1.6
    ctx.beginPath()
    if (vertical) {
      const gx = x + r() * w
      for (let gy = y; gy <= y + h; gy += 12) ctx.lineTo(gx + Math.sin(gy * 0.04 + i) * 3, gy)
    } else {
      const gy = y + r() * h
      for (let gx = x; gx <= x + w; gx += 12) ctx.lineTo(gx, gy + Math.sin(gx * 0.04 + i) * 3)
    }
    ctx.stroke()
  }
  for (let i = 0; i < n / 10; i++) {
    ctx.fillStyle = 'rgba(50,25,10,0.25)'
    ctx.beginPath()
    ctx.ellipse(x + r() * w, y + r() * h, 2 + r() * 4, 1 + r() * 2, r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ------------------------------------------------------------------ the sky and the street

// The night sky on the back wall: deep navy, a few wisps, faint far-off stars.
export function sky(seed = 1) {
  const c = canvas(1400, 580)
  const ctx = c.getContext('2d')
  const r = rng(seed * 17)
  const g = ctx.createLinearGradient(0, 0, 0, 580)
  g.addColorStop(0, '#131b40')
  g.addColorStop(1, '#2a376d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1400, 580)
  fibres(ctx)
  for (let i = 0; i < 6; i++) {
    const y = 60 + r() * 300
    const x = r() * 1400
    ctx.strokeStyle = `rgba(150,165,225,${0.07 + r() * 0.06})`
    ctx.lineWidth = 10 + r() * 14
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + 120, y - 20, x + 260, y + 18, x + 380 + r() * 200, y - 6)
    ctx.stroke()
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,250,225,${0.25 + r() * 0.5})`
    ctx.beginPath()
    ctx.arc(r() * 1400, r() * 420, 0.8 + r() * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

// a paper moon
export function moon(seed = 1) {
  const c = canvas(280, 280)
  const ctx = c.getContext('2d')
  const r = rng(seed * 5)
  marker(ctx, seed, { width: 5, wobble: 1.4, color: '#b8a86a' }).blob(140, 140, 120, 120, '#f5edc7')
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = `rgba(190,170,110,${0.18 + r() * 0.16})`
    ctx.beginPath()
    ctx.arc(70 + r() * 140, 70 + r() * 140, 8 + r() * 18, 0, Math.PI * 2)
    ctx.fill()
  }
  fibres(ctx)
  return c
}

// a cut-paper star for the sky
export function skyStar(seed = 1) {
  const c = canvas(120, 120)
  const ctx = c.getContext('2d')
  marker(ctx, seed, { width: 4, wobble: 1, color: '#c9a54a' }).shape(star(60, 62, 50, 0.42), '#fbe8a2')
  fibres(ctx)
  return c
}

// The street: cobblestones drawn in pencil on grey card, with a dusting of
// snow and a trail of footprints.
export function cobbles(seed = 1) {
  const W = 1600
  const H = 200
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 29)
  ctx.fillStyle = '#8e919b'
  ctx.fillRect(0, 0, W, H)
  fibres(ctx)
  ctx.strokeStyle = 'rgba(40,42,50,0.55)'
  ctx.lineWidth = 1.6
  for (let row = 0, y = 4; y < H; row++, y += 26) {
    for (let x = (row % 2) * -22; x < W; x += 44 + r() * 8) {
      const w = 36 + r() * 8
      const h = 20 + r() * 4
      ctx.fillStyle = `rgba(${r() < 0.5 ? '60,62,72' : '200,204,214'},${0.08 + r() * 0.1})`
      ctx.beginPath()
      ctx.roundRect(x + r() * 3, y + r() * 2, w, h, 8)
      ctx.fill()
      ctx.stroke()
    }
  }
  // a dusting of snow
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(246,248,255,${0.35 + r() * 0.5})`
    ctx.beginPath()
    ctx.ellipse(r() * W, r() * H, 3 + r() * 14, 2 + r() * 5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // footprints, wandering along
  for (let i = 0; i < 26; i++) {
    const x = 60 + i * 58
    const y = 110 + Math.sin(i * 0.5) * 40 + (i % 2 ? 14 : -14)
    ctx.fillStyle = 'rgba(70,74,88,0.45)'
    ctx.beginPath()
    ctx.ellipse(x, y, 11, 5, 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + 15, y, 5, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

// A drift of snow (white tissue paper), `width` pixels long.
export function snowDrift(width = 900, seed = 1) {
  const c = canvas(width, 130)
  const ctx = c.getContext('2d')
  const r = rng(seed * 41 + width)
  const pts = [[0, 128]]
  for (let x = 0; x <= width; x += 24) pts.push([x, 44 + Math.sin(x * 0.012 + seed) * 18 + r() * 14])
  pts.push([width, 128])
  trace(ctx, pts)
  ctx.fillStyle = SNOW
  ctx.fill()
  ctx.save()
  ctx.clip()
  const g = ctx.createLinearGradient(0, 40, 0, 130)
  g.addColorStop(0, 'rgba(204,214,238,0)')
  g.addColorStop(1, 'rgba(184,196,228,0.75)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, 130)
  ctx.restore()
  marker(ctx, seed, { width: 2.5, wobble: 1, color: '#9aa8cc' }).line(pts.slice(1, -1))
  fibres(ctx)
  return c
}

// Snow lying on the street, for it to settle and melt: white all over, its
// alpha a field of soft blotches. Cut off at a level that falls (alphaTest),
// it leaves patches of snow that spread and join until the street is covered.
export function snowCover(w = 1000, h = 120, seed = 1) {
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  const r = rng(seed * 97 + w)
  const field = new Float32Array(w * h)
  for (const [cell, weight] of [[44, 0.55], [20, 0.3], [9, 0.15]]) {
    const gw = Math.ceil(w / cell) + 2
    const gh = Math.ceil(h / cell) + 2
    const grid = Array.from({ length: gw * gh }, () => r())
    for (let y = 0; y < h; y++) {
      const gy = y / cell
      const y0 = Math.floor(gy)
      const fy = gy - y0
      const sy = fy * fy * (3 - 2 * fy)
      for (let x = 0; x < w; x++) {
        const gx = x / cell
        const x0 = Math.floor(gx)
        const fx = gx - x0
        const sx = fx * fx * (3 - 2 * fx)
        const a = grid[y0 * gw + x0]
        const b = grid[y0 * gw + x0 + 1]
        const cc = grid[(y0 + 1) * gw + x0]
        const d = grid[(y0 + 1) * gw + x0 + 1]
        field[y * w + x] += weight * (a + (b - a) * sx + (cc - a + (a - b + d - cc) * sx) * sy)
      }
    }
  }
  let lo = Infinity
  let hi = -Infinity
  for (const v of field) {
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  const img = ctx.createImageData(w, h)
  for (let i = 0; i < field.length; i++) {
    const v = (field[i] - lo) / (hi - lo || 1)
    const shade = 236 + v * 14 // the thin snow a little bluer than the deep
    img.data[i * 4] = shade - 6
    img.data[i * 4 + 1] = shade - 2
    img.data[i * 4 + 2] = 255
    img.data[i * 4 + 3] = Math.round(40 + v * 215) // (never nearly clear: the colour would lose its precision)
  }
  ctx.putImageData(img, 0, 0)
  return c
}

// A sparkle, for the string lights as they come on: a four-pointed star in a soft glow.
export function sparkle() {
  const c = canvas(96, 96)
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 46)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  g.addColorStop(0.28, 'rgba(255, 244, 205, 0.32)')
  g.addColorStop(1, 'rgba(255, 238, 190, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 96, 96)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const rad = i % 2 ? 6 : 45
    ctx.lineTo(48 + Math.cos(a) * rad, 48 + Math.sin(a) * rad)
  }
  ctx.closePath()
  ctx.fill()
  return c
}

// Cut-paper snowflakes, three kinds.
export function flake(kind = 0) {
  const c = canvas(128, 128)
  const ctx = c.getContext('2d')
  ctx.translate(64, 64)
  ctx.lineCap = 'round'
  const arm = (len, width) => {
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -len)
    ctx.stroke()
  }
  ctx.strokeStyle = '#ffffff'
  for (let i = 0; i < 6; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI) / 3)
    if (kind === 0) arm(54, 12)
    else if (kind === 1) {
      arm(54, 9)
      ctx.lineWidth = 7
      for (const at of [22, 38]) {
        ctx.beginPath()
        ctx.moveTo(0, -at)
        ctx.lineTo(-12, -at - 12)
        ctx.moveTo(0, -at)
        ctx.lineTo(12, -at - 12)
        ctx.stroke()
      }
    } else {
      arm(50, 14)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(0, -50, 9, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(0, 0, kind === 2 ? 18 : 12, 0, Math.PI * 2)
  ctx.fill()
  return c
}

// ------------------------------------------------------------------ the stalls

// Wood, as a texture that repeats: 'wall' (upright planks of brown card),
// 'roof' (rows of shingles), 'planks' (the pale boards inside a stall).
export function wood(kind = 'wall', seed = 1) {
  const c = canvas(512, 512)
  const ctx = c.getContext('2d')
  const r = rng(seed * 13 + kind.length)
  if (kind === 'roof') {
    ctx.fillStyle = '#6e4428'
    ctx.fillRect(0, 0, 512, 512)
    for (let row = 0; row < 512; row += 42) {
      for (let x = (row / 42) % 2 ? -32 : 0; x < 512; x += 64) {
        ctx.fillStyle = mix('#7a4b2c', '#5b3720', r() * 0.6)
        ctx.beginPath()
        ctx.roundRect(x + 2, row + 2, 60, 46, [0, 0, 18, 18])
        ctx.fill()
        ctx.strokeStyle = 'rgba(30,15,5,0.45)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  } else {
    const pale = kind === 'planks'
    ctx.fillStyle = pale ? '#d9b78e' : WOOD
    ctx.fillRect(0, 0, 512, 512)
    for (let x = 0; x < 512; x += 64) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? '60,30,12' : '255,225,180'},${0.05 + r() * 0.08})`
      if (pale) ctx.fillRect(0, x, 512, 64)
      else ctx.fillRect(x, 0, 64, 512)
      ctx.strokeStyle = pale ? 'rgba(110,70,35,0.45)' : 'rgba(35,18,8,0.55)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      if (pale) {
        ctx.moveTo(0, x)
        ctx.lineTo(512, x)
      } else {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 512)
      }
      ctx.stroke()
    }
    grain(ctx, 0, 0, 512, 512, r, { vertical: !pale, n: 70, color: pale ? 'rgba(120,75,35,0.18)' : 'rgba(40,20,8,0.22)' })
  }
  fibres(ctx)
  return c
}

// The front of a stall: upright planks, a gable with scalloped trim in the
// stall's colour, a frame round the door and the window (both cut right out,
// so the door can swing and the window can glow). Sizes in scene units;
// door and window x are their middles, from the middle of the front.
export const FRONT_SCALE = 460 // pixels per scene unit
export function facade({ w, wall, gable, door, win, trim, seed = 1 }) {
  const K = FRONT_SCALE
  const W = Math.round(w * K)
  const H = Math.round((wall + gable) * K)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 61)
  const X = (x) => W / 2 + x * K
  const Y = (y) => H - y * K
  const outline = [[0, H], [0, Y(wall)], [W / 2, 0], [W, Y(wall)], [W, H]]
  trace(ctx, outline)
  ctx.fillStyle = WOOD
  ctx.fill()
  ctx.save()
  trace(ctx, outline)
  ctx.clip()
  for (let x = 0; x < W; x += 34) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '50,25,10' : '255,215,170'},${0.05 + r() * 0.09})`
    ctx.fillRect(x, 0, 34, H)
    ctx.strokeStyle = 'rgba(35,18,8,0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  grain(ctx, 0, 0, W, H, r, { n: 60 })
  // corner posts
  ctx.fillStyle = WOOD_DARK
  ctx.fillRect(0, Y(wall), 16, H)
  ctx.fillRect(W - 16, Y(wall), 16, H)
  ctx.restore()

  const m = marker(ctx, seed, { width: 4, wobble: 1.1, color: '#2a160a' })
  // scalloped bargeboards along the gable, in the trim colour
  const board = (x0, y0, x1, y1) => {
    const n = 9
    const pts = []
    const dx = (x1 - x0) / n
    const dy = (y1 - y0) / n
    for (let i = 0; i <= n; i++) pts.push([x0 + dx * i, y0 + dy * i])
    const len = Math.hypot(x1 - x0, y1 - y0)
    const nx = -(y1 - y0) / len
    const ny = (x1 - x0) / len
    const band = 22
    const scallops = []
    for (let i = 0; i <= n * 2; i++) {
      const t = i / (n * 2)
      const depth = i % 2 ? band * 1.5 : band
      scallops.push([x0 + (x1 - x0) * t + nx * depth, y0 + (y1 - y0) * t + ny * depth])
    }
    m.shape([...pts, ...scallops.reverse()], trim)
  }
  board(2, Y(wall) + 2, W / 2, 4)
  board(W / 2, 4, W - 2, Y(wall) + 2)
  // a little heart cut in the gable
  const hy = Y(wall) - gable * K * 0.25
  m.shape(
    Array.from({ length: 20 }, (_, i) => {
      const t = (i / 20) * Math.PI * 2
      return [W / 2 + 16 * Math.sin(t) ** 3 * 0.9, hy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.9]
    }),
    trim,
    { width: 3 },
  )
  // the door's frame, then the door cut out
  const dx0 = X(door.x - door.w / 2)
  const dx1 = X(door.x + door.w / 2)
  m.shape([[dx0 - 12, H], [dx0 - 12, Y(door.h) - 12], [dx1 + 12, Y(door.h) - 12], [dx1 + 12, H]], trim)
  cut(ctx, rect(dx0, Y(door.h), dx1 - dx0, H - Y(door.h)))
  // the window: frame, sill, and the glass cut out
  const wx0 = X(win.x - win.w / 2)
  const wx1 = X(win.x + win.w / 2)
  const wy0 = Y(win.y + win.h)
  const wy1 = Y(win.y)
  m.shape(rect(wx0 - 12, wy0 - 12, wx1 - wx0 + 24, wy1 - wy0 + 24), trim)
  m.shape(rect(wx0 - 22, wy1 + 6, wx1 - wx0 + 44, 14), mix(trim, '#ffffff', 0.25))
  cut(ctx, rect(wx0, wy0, wx1 - wx0, wy1 - wy0))
  m.shape(outline, null, { width: 3 })
  fibres(ctx)
  return c
}

// A stall's door: planks, a Z brace, a little round window and a knob.
export function door(w, h, trim, seed = 1) {
  const K = FRONT_SCALE
  const W = Math.round(w * K)
  const H = Math.round(h * K)
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 7)
  ctx.fillStyle = '#7a4a2b'
  ctx.fillRect(0, 0, W, H)
  for (let x = 0; x < W; x += W / 4) {
    ctx.strokeStyle = 'rgba(30,15,5,0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  grain(ctx, 0, 0, W, H, r, { n: 24 })
  const m = marker(ctx, seed, { width: 3.5, wobble: 0.8, color: '#2a160a' })
  m.shape(rect(6, H * 0.3, W - 12, 14), WOOD_DARK)
  m.shape(rect(6, H * 0.78, W - 12, 14), WOOD_DARK)
  m.shape([[10, H * 0.78], [W - 22, H * 0.32], [W - 8, H * 0.34], [24, H * 0.8]], WOOD_DARK)
  m.blob(W / 2, H * 0.16, W * 0.16, W * 0.16, WARM)
  m.blob(W * 0.82, H * 0.55, 6, 6, '#e3c46a')
  m.shape(rect(2, 2, W - 4, H - 4), null, { width: 3, color: trim })
  fibres(ctx)
  return c
}

// What shows in a stall's lit window, before you go in.
export function windowScene(type, trim, seed = 1, pictures = []) {
  const W = 320
  const H = 220
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 23)
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H * 0.5, W * 0.7)
  g.addColorStop(0, '#fff1c4')
  g.addColorStop(1, '#f0b860')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const m = marker(ctx, seed, { width: 3, wobble: 0.8 })
  if (pictures.length) {
    pictures.slice(0, 3).forEach((img, i, list) => {
      const box = (W - 30) / list.length
      const k = Math.min((box - 10) / img.width, (H - 50) / img.height)
      ctx.drawImage(img, 15 + i * box + (box - img.width * k) / 2, H - 30 - img.height * k, img.width * k, img.height * k)
    })
  } else if (type === 'jewelry') {
    m.shape([[10, 160], [310, 160], [300, 210], [20, 210]], '#8f2f4e')
    m.blob(80, 132, 26, 26, null, { width: 7, color: '#d9b45a' })
    m.blob(80, 104, 8, 8, '#8fe0ff', { width: 2 })
    m.line([[160, 60], [160, 120]], { width: 2, color: '#c9a64e' })
    m.shape([[160, 120], [174, 140], [160, 162], [146, 140]], '#e84d7a', { width: 2.5 })
    m.blob(240, 134, 10, 18, '#9be3c6', { width: 2.5 })
    m.blob(266, 134, 10, 18, '#9be3c6', { width: 2.5 })
  } else if (type === 'resin') {
    m.rect(14, 150, 292, 14, WOOD)
    const tints = ['#3fc1c9', '#f7a1c4', '#ffcf5c', '#8a7cf0']
    tints.forEach((tint, i) => {
      const x = 52 + i * 72
      ctx.globalAlpha = 0.85
      m.blob(x, 118, 28, 28, tint, { width: 2.5 })
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(x - 6, 110, 14, Math.PI * 1.1, Math.PI * 1.6)
      ctx.stroke()
    })
  } else if (type === 'workshop') {
    m.line([[160, 210], [160, 120]], { width: 5, color: '#555' })
    m.line([[120, 210], [160, 180], [200, 210]], { width: 4, color: '#555' })
    m.blob(110, 110, 36, 36, null, { width: 5 })
    m.blob(210, 110, 36, 36, null, { width: 5 })
    m.line([[110, 110], [150, 70], [210, 110], [170, 110], [150, 70]], { width: 4, color: trim })
  } else if (type === 'classroom') {
    m.rect(30, 30, 260, 150, '#c9a06a')
    for (let i = 0; i < 4; i++) {
      const x = 48 + (i % 2) * 124
      const y = 44 + Math.floor(i / 2) * 68
      m.rect(x, y, 104, 58, '#fffdf6', { width: 2 })
      for (let k = 0; k < 3; k++) m.line([[x + 10, y + 16 + k * 12], [x + 90 - r() * 30, y + 16 + k * 12]], { width: 1.5, color: P.pencil })
      ctx.fillStyle = '#d64545'
      ctx.beginPath()
      ctx.arc(x + 52, y + 4, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    m.rect(40, 150, 240, 16, WOOD)
    for (let i = 0; i < 3; i++) m.rect(70 + i * 70, 110, 40, 40, mix(trim, '#ffffff', 0.4))
  }
  // window bars
  ctx.strokeStyle = mix(trim, '#000000', 0.25)
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(W / 2, 0)
  ctx.lineTo(W / 2, H)
  ctx.moveTo(0, H * 0.45)
  ctx.lineTo(W, H * 0.45)
  ctx.stroke()
  return c
}

// A stall's sign: a painted board in a frame, her lettering, a little doodle.
export function stallSign(text, doodle, trim, seed = 1) {
  const c = canvas(600, 170)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.2 })
  m.shape([[10, 14], [590, 8], [592, 160], [8, 164]], trim)
  m.shape([[26, 28], [574, 24], [575, 146], [25, 149]], '#fbf3e0', { width: 3 })
  fibres(ctx)
  const room = doodle ? 450 : 520
  write(ctx, text, doodle ? 270 : 300, 88, { size: 74, max: room })
  const d = marker(ctx, seed + 3, { width: 4, wobble: 1 })
  const x = 520
  if (doodle === 'ring') {
    d.blob(x, 96, 30, 30, null, { width: 8, color: '#c9a24a' })
    d.shape([[x - 12, 62], [x + 12, 62], [x + 18, 52], [x, 38], [x - 18, 52]], '#8fe0ff', { width: 3 })
  } else if (doodle === 'drop') {
    d.shape([[x, 40], [x + 24, 84], [x + 20, 110], [x, 122], [x - 20, 110], [x - 24, 84]], '#3fc1c9', { width: 3 })
  } else if (doodle === 'wheel') {
    d.blob(x, 86, 36, 36, null, { width: 6 })
    for (let i = 0; i < 6; i++) d.line([[x, 86], [x + Math.cos(i) * 34, 86 + Math.sin(i) * 34]], { width: 2 })
  } else if (doodle === 'star') {
    d.shape(star(x, 88, 36, 0.45), HI.yellow, { width: 3 })
  }
  return c
}

// Velvet bunting: triangle flags on a sagging string.
export function bunting(trim, seed = 1) {
  const c = canvas(600, 120)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3, wobble: 1 })
  const sag = (x) => 10 + Math.sin((x / 600) * Math.PI) * 30
  const flags = 8
  for (let i = 0; i < flags; i++) {
    const x0 = 20 + i * 70
    const x1 = x0 + 58
    const color = i % 2 ? trim : mix(trim, '#5a0f24', 0.45)
    m.shape([[x0, sag(x0)], [x1, sag(x1)], [(x0 + x1) / 2, sag((x0 + x1) / 2) + 70]], color)
  }
  m.line(Array.from({ length: 13 }, (_, i) => [i * 50, sag(i * 50)]), { width: 3 })
  fibres(ctx)
  return c
}

// Resin ornaments hanging on strings of different lengths.
export function ornaments(seed = 1) {
  const c = canvas(600, 250)
  const ctx = c.getContext('2d')
  const r = rng(seed * 19)
  const tints = ['#3fc1c9', '#f7a1c4', '#ffcf5c', '#8a7cf0', '#7fe3a0']
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 120
    const len = 70 + r() * 90
    const m = marker(ctx, seed + i, { width: 2, wobble: 0.6 })
    m.line([[x, 0], [x, len]], { width: 2 })
    const tint = tints[i]
    if (i % 2) m.shape([[x, len], [x + 26, len + 40], [x + 20, len + 66], [x, len + 76], [x - 20, len + 66], [x - 26, len + 40]], tint, { width: 2.5 })
    else m.blob(x, len + 34, 32, 32, tint, { width: 2.5 })
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x - 8, len + 30, 14, Math.PI * 1.1, Math.PI * 1.6)
    ctx.stroke()
  }
  return c
}

// A wreath made from a bike wheel: rim, spokes and hub, wound with pine and a bow.
export function wheelWreath(trim, seed = 1) {
  const c = canvas(320, 320)
  const ctx = c.getContext('2d')
  const r = rng(seed * 31)
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.blob(160, 160, 128, 128, null, { width: 14, color: '#2b2b30' })
  m.blob(160, 160, 112, 112, null, { width: 5, color: '#9aa0aa' })
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    m.line([[160, 160], [160 + Math.cos(a) * 110, 160 + Math.sin(a) * 110]], { width: 1.5, color: '#8a9099' })
  }
  m.blob(160, 160, 14, 14, '#9aa0aa', { width: 3 })
  // pine sprigs round the rim
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2
    const rad = 120 + (r() - 0.5) * 14
    const x = 160 + Math.cos(a) * rad
    const y = 160 + Math.sin(a) * rad
    ctx.strokeStyle = r() < 0.5 ? PINE : '#3f8a5a'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a + 1.2) * 18, y + Math.sin(a + 1.2) * 18)
    ctx.stroke()
  }
  for (let i = 0; i < 8; i++) {
    const a = r() * Math.PI * 2
    ctx.fillStyle = '#d33a3a'
    ctx.beginPath()
    ctx.arc(160 + Math.cos(a) * 122, 160 + Math.sin(a) * 122, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  const b = marker(ctx, seed + 5, { width: 3.5, wobble: 1 })
  b.shape([[160, 280], [116, 258], [118, 300]], '#d33a3a')
  b.shape([[160, 280], [204, 258], [202, 300]], '#d33a3a')
  b.blob(160, 280, 12, 12, '#b02a2a')
  return c
}

// Little paper lanterns on strings.
export function lanterns(trim, seed = 1) {
  const c = canvas(600, 250)
  const ctx = c.getContext('2d')
  const r = rng(seed * 47)
  for (let i = 0; i < 3; i++) {
    const x = 100 + i * 200
    const len = 40 + r() * 50
    const m = marker(ctx, seed + i, { width: 3, wobble: 1 })
    m.line([[x, 0], [x, len]], { width: 2 })
    m.rect(x - 22, len, 44, 12, '#e0b44a')
    m.blob(x, len + 64, 52, 54, i === 1 ? trim : '#d23a33')
    for (const k of [-24, 0, 24]) m.line([[x + k, len + 14], [x + k * 1.2, len + 64], [x + k, len + 114]], { width: 2, color: 'rgba(80,10,10,0.6)' })
    m.rect(x - 22, len + 112, 44, 12, '#e0b44a')
    m.line([[x, len + 124], [x, len + 160]], { width: 4, color: '#e0b44a' })
  }
  return c
}

// The snow along a roof's edge, with icicles under it. `width` in pixels.
export function roofSnow(width = 600, seed = 1) {
  const c = canvas(width, 100)
  const ctx = c.getContext('2d')
  const r = rng(seed * 53 + width)
  const pts = [[0, 60]]
  for (let x = 0; x <= width; x += 20) pts.push([x, 12 + Math.sin(x * 0.03 + seed) * 6 + r() * 8])
  pts.push([width, 60])
  // icicles hang from the bottom edge
  const icicles = []
  for (let x = width; x >= 0; x -= 28 + r() * 30) icicles.push([x, 56], [x - 6, 56 + 10 + r() * 32], [x - 12, 56])
  trace(ctx, [...pts, ...icicles])
  ctx.fillStyle = SNOW
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.fillStyle = 'rgba(190,202,232,0.6)'
  ctx.fillRect(0, 46, width, 60)
  ctx.restore()
  marker(ctx, seed, { width: 2.5, wobble: 1, color: '#9aa8cc' }).line(pts.slice(1, -1))
  return c
}

// One string-light bulb: white, so each one can be tinted, with a dark socket.
export function bulb() {
  const c = canvas(64, 96)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(32, 92)
  ctx.bezierCurveTo(4, 70, 8, 30, 32, 26)
  ctx.bezierCurveTo(56, 30, 60, 70, 32, 92)
  ctx.fill()
  ctx.fillStyle = '#26323a'
  ctx.fillRect(20, 4, 24, 26)
  return c
}

// A pine garland, for along the top of the street.
export function garland(seed = 1) {
  const W = 2000
  const H = 150
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 71)
  const sag = (x) => 30 + Math.sin(((x % 500) / 500) * Math.PI) * 40
  for (let i = 0; i < 1800; i++) {
    const x = r() * W
    const y = sag(x) + (r() - 0.5) * 50
    const a = r() * Math.PI
    ctx.strokeStyle = r() < 0.5 ? PINE : r() < 0.5 ? '#3f8a5a' : '#24553a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16)
    ctx.stroke()
  }
  for (let x = 250; x < W; x += 500) {
    const m = marker(ctx, seed + x, { width: 3, wobble: 1 })
    const y = sag(x) + 4
    m.shape([[x, y], [x - 34, y - 18], [x - 32, y + 20]], '#c8323a')
    m.shape([[x, y], [x + 34, y - 18], [x + 32, y + 20]], '#c8323a')
    m.line([[x, y], [x - 16, y + 46]], { width: 6, color: '#c8323a' })
    m.line([[x, y], [x + 16, y + 46]], { width: 6, color: '#c8323a' })
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * W
    ctx.fillStyle = '#d63b3b'
    ctx.beginPath()
    ctx.arc(x, sag(x) + (r() - 0.5) * 30, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

// The Christmas tree at the far end of the street (its star is separate, so it can glow).
export function tree(seed = 1) {
  const c = canvas(420, 640)
  const ctx = c.getContext('2d')
  const r = rng(seed * 83)
  const m = marker(ctx, seed, { width: 4, wobble: 1.4, color: '#1d3d28' })
  m.rect(186, 560, 48, 76, '#6b4226')
  const tiers = [[210, 60, 90, 230], [210, 170, 140, 380], [210, 300, 190, 560]]
  for (const [cx, top, half, bottom] of tiers) m.shape([[cx, top], [cx + half, bottom], [cx - half, bottom]], PINE)
  for (let i = 0; i < 30; i++) {
    const y = 120 + r() * 430
    const spread = ((y - 60) / 500) * 170
    ctx.fillStyle = [HI.pink, HI.yellow, '#d63b3b', '#7fd0ff', '#ffffff'][i % 5]
    ctx.beginPath()
    ctx.arc(210 + (r() - 0.5) * spread * 1.6, y, 7 + r() * 4, 0, Math.PI * 2)
    ctx.fill()
  }
  // tinsel swags
  for (let k = 0; k < 4; k++) {
    const y = 180 + k * 95
    const half = 50 + k * 40
    ctx.strokeStyle = 'rgba(255,230,140,0.85)'
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let x = -half; x <= half; x += 8) ctx.lineTo(210 + x, y + Math.cos((x / half) * Math.PI * 0.5) * 22)
    ctx.stroke()
  }
  return c
}

// a star for the top of the tree
export function treeStar(seed = 1) {
  const c = canvas(140, 140)
  const ctx = c.getContext('2d')
  marker(ctx, seed, { width: 4, wobble: 1, color: '#b8902e' }).shape(star(70, 72, 62, 0.45), '#ffe27a')
  return c
}

// A street lamp: iron post, a lantern head (its glass is drawn warm).
export function lampPost(seed = 1) {
  const c = canvas(170, 640)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1, color: '#15151a' })
  m.shape([[60, 636], [110, 636], [100, 600], [70, 600]], '#2b2b33')
  m.rect(78, 150, 14, 452, '#2b2b33')
  m.shape([[40, 52], [130, 52], [116, 150], [54, 150]], '#2b2b33')
  m.shape([[54, 62], [116, 62], [106, 140], [64, 140]], WARM, { width: 2.5 })
  m.shape([[30, 54], [85, 6], [140, 54]], '#2b2b33')
  m.line([[85, 62], [85, 140]], { width: 3, color: '#2b2b33' })
  return c
}

// A steaming mug, and the curls of its steam (draw a few tracings: they rise).
export function mug(seed = 1) {
  const c = canvas(150, 130)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.blob(118, 66, 22, 26, null, { width: 9, color: '#c8323a' })
  m.shape([[20, 20], [110, 20], [104, 124], [26, 124]], '#c8323a')
  ctx.fillStyle = '#ffffff'
  for (const [x, y] of [[44, 50], [76, 70], [52, 100], [90, 106], [84, 40]]) {
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  m.blob(65, 22, 44, 7, '#5a3420', { width: 3 })
  return c
}
export function steam(seed = 1) {
  const c = canvas(110, 180)
  const ctx = c.getContext('2d')
  const r = rng(seed * 101)
  for (let k = 0; k < 3; k++) {
    const x0 = 30 + k * 26
    const pts = []
    for (let y = 172; y > 20; y -= 12) pts.push([x0 + Math.sin(y * 0.06 + seed * 1.7 + k) * (8 + r() * 4), y])
    marker(ctx, seed * 3 + k, { width: 6, wobble: 1.2, color: 'rgba(255,255,255,0.88)' }).line(pts)
  }
  return c
}

// a wooden sled with red runners, to lean against a stall
export function sled(seed = 1) {
  const c = canvas(330, 210)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.line([[20, 170], [280, 170], [300, 150], [306, 124]], { width: 10, color: '#c8323a' })
  for (const x of [70, 150, 230]) m.line([[x, 170], [x, 128]], { width: 8, color: '#c8323a' })
  m.shape([[30, 110], [290, 110], [296, 132], [26, 132]], '#b07a46')
  for (const x of [100, 180]) m.line([[x, 112], [x, 130]], { width: 2.5 })
  m.line([[296, 112], [318, 60], [300, 40]], { width: 4, color: '#a0a0a0' })
  fibres(ctx)
  return c
}

// a tiny robin: 'stand' or 'hop'
export function robin(pose = 'stand', seed = 1) {
  const c = canvas(150, 130)
  const ctx = c.getContext('2d')
  const up = pose === 'hop' ? -14 : 0
  const m = marker(ctx, seed, { width: 3.5, wobble: 0.8 })
  if (pose === 'hop') {
    m.line([[66, 104 + up], [60, 116 + up]], { width: 3 })
    m.line([[80, 104 + up], [88, 116 + up]], { width: 3 })
  } else {
    m.line([[66, 104], [64, 124]], { width: 3 })
    m.line([[80, 104], [82, 124]], { width: 3 })
  }
  m.shape(oval(74, 76 + up, 40, 30), '#7a5233')
  m.shape(oval(64, 84 + up, 22, 20), '#e8622f', { width: 2.5 })
  m.blob(48, 52 + up, 20, 18, '#7a5233')
  m.shape([[30, 50 + up], [16, 54 + up], [30, 58 + up]], '#e0a020', { width: 2 })
  m.shape([[110, 70 + up], [140, 60 + up], [132, 84 + up]], '#5e3e26', { width: 2.5 })
  ctx.fillStyle = '#15151a'
  ctx.beginPath()
  ctx.arc(44, 48 + up, 3.5, 0, Math.PI * 2)
  ctx.fill()
  return c
}

// A note on a string: the one hanging from the lights.
export function hangingNote(text, seed = 1) {
  const c = canvas(660, 250)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.3 })
  m.shape([[18, 30], [642, 22], [646, 236], [14, 242]], '#fffdf6')
  for (const x of [70, 590]) m.blob(x, 52, 9, 9, P.navy, { width: 2 })
  fibres(ctx)
  write(ctx, text, 330, 146, { size: 58, max: 560, maxH: 150, lines: 2 })
  return c
}

// The tag that pops up over a stall: its name, and one line.
export function stallTag(title, line, seed = 1) {
  const c = canvas(640, 280)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.2 })
  m.shape([[56, 16], [626, 10], [630, 268], [56, 272], [12, 142]], '#fffaf0')
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(54, 142, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  m.blob(54, 142, 15, 15, null, { width: 2.5 })
  fibres(ctx)
  write(ctx, title, 344, line ? 92 : 142, { size: 66, max: 500 })
  if (line) write(ctx, line.text, 344, 190, { size: 34, max: 510, maxH: 110, lines: 2, font: BODY, weight: 400, color: line.todo ? P.pencil : '#3b3f57' })
  return c
}

// ------------------------------------------------------------------ inside the stalls

// the little sign by the door inside: "← back to the market", on a stick
export function doorSign(text, seed = 1) {
  const c = canvas(440, 330)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1.2 })
  m.rect(206, 150, 26, 178, WOOD)
  m.shape([[14, 30], [426, 20], [430, 168], [10, 176]], '#fffdf6')
  fibres(ctx)
  write(ctx, text, 220, 98, { size: 54, max: 380, maxH: 130, lines: 2 })
  return c
}

// the case study, pinned to the wall
export function caseNote(title, seed = 1) {
  const c = canvas(320, 260)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3.5, wobble: 1.1 })
  m.shape([[14, 26], [306, 18], [310, 248], [10, 254]], '#fffdf6')
  for (let y = 120; y < 240; y += 26) m.line([[30, y], [290, y - 2]], { width: 1.5, color: 'rgba(70,110,170,0.4)' })
  fibres(ctx)
  write(ctx, title, 160, 80, { size: 52, max: 260, tilt: -0.03 })
  m.blob(160, 26, 14, 14, '#d23a33', { width: 2.5 })
  return c
}

// a cork board in a wooden frame
export function corkBoard(seed = 1) {
  const c = canvas(640, 340)
  const ctx = c.getContext('2d')
  const r = rng(seed * 37)
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.rect(6, 6, 628, 328, '#9c6a3c')
  m.rect(26, 26, 588, 288, '#c8945c', { width: 2.5 })
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '120,75,35' : '235,195,140'},${0.25 + r() * 0.4})`
    ctx.fillRect(28 + r() * 584, 28 + r() * 284, 1 + r() * 3, 1 + r() * 3)
  }
  return c
}

// a velvet tray, as seen across the counter
export function velvetTray(trim, seed = 1) {
  const c = canvas(400, 120)
  const ctx = c.getContext('2d')
  const r = rng(seed * 59)
  const m = marker(ctx, seed, { width: 3.5, wobble: 0.8 })
  m.shape([[8, 30], [392, 30], [384, 112], [16, 112]], '#6b4226')
  m.shape([[24, 36], [376, 36], [368, 96], [32, 96]], mix(trim, '#4a0f22', 0.5), { width: 2.5 })
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255,190,210,${r() * 0.08})`
    ctx.fillRect(28 + r() * 344, 38 + r() * 56, 2, 6)
  }
  return c
}

// the little round stand a piece is lifted onto
export function turntable(trim, seed = 1) {
  const c = canvas(340, 170)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.shape([[30, 60], [310, 60], [310, 132], [30, 132]], '#a8784a')
  m.blob(170, 132, 140, 28, '#a8784a')
  m.blob(170, 60, 140, 36, mix(trim, '#4a0f22', 0.45))
  return c
}

// Stand-in jewellery: 'ring', 'pendant' or 'earrings'.
export function jewel(kind, seed = 1) {
  const c = canvas(300, 300)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  const gold = '#d4ac4f'
  const gems = ['#8fe0ff', '#e84d7a', '#9be3c6']
  if (kind === 'ring') {
    m.blob(150, 190, 90, 80, null, { width: 22, color: gold })
    m.shape([[110, 110], [190, 110], [206, 86], [150, 40], [94, 86]], gems[seed % 3], { width: 4 })
  } else if (kind === 'pendant') {
    m.line([[60, 20], [150, 150], [240, 20]], { width: 4, color: gold })
    m.shape([[150, 140], [196, 200], [150, 284], [104, 200]], gems[(seed + 1) % 3], { width: 4 })
  } else {
    for (const x of [96, 204]) {
      m.line([[x, 30], [x, 90]], { width: 4, color: gold })
      m.blob(x, 160, 40, 70, gems[(seed + 2) % 3], { width: 4 })
    }
  }
  // a glint
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(220, 60)
  ctx.lineTo(226, 78)
  ctx.lineTo(244, 84)
  ctx.lineTo(226, 90)
  ctx.lineTo(220, 108)
  ctx.lineTo(214, 90)
  ctx.lineTo(196, 84)
  ctx.lineTo(214, 78)
  ctx.closePath()
  ctx.fill()
  return c
}

// A pinned sheet: design sketches ('sketch'), research ('research') or user notes ('notes').
export function sheet(kind = 'sketch', seed = 1) {
  const c = canvas(300, 400)
  const ctx = c.getContext('2d')
  const r = rng(seed * 89)
  const m = marker(ctx, seed, { width: 2.5, wobble: 1, color: P.pencil })
  ctx.fillStyle = kind === 'notes' ? '#fff3a6' : '#fdfbf4'
  ctx.fillRect(0, 0, 300, 400)
  fibres(ctx)
  if (kind === 'sketch') {
    m.blob(110, 120, 60, 54, null)
    m.blob(110, 120, 44, 40, null, { width: 1.5 })
    m.line([[40, 220], [260, 220]], { width: 1.5 })
    m.blob(200, 300, 40, 64, null)
    for (let i = 0; i < 4; i++) m.line([[30, 340 + i * 12], [120 + r() * 120, 340 + i * 12]], { width: 1.2 })
  } else if (kind === 'research') {
    m.rect(30, 40, 240, 120, null)
    for (let i = 0; i < 5; i++) {
      const h = 20 + r() * 90
      m.rect(50 + i * 44, 160 - h, 26, h, i % 2 ? HI.yellow : null, { width: 2 })
    }
    for (let i = 0; i < 9; i++) m.line([[30, 200 + i * 20], [150 + r() * 120, 200 + i * 20]], { width: 1.2 })
  } else {
    for (let i = 0; i < 12; i++) m.line([[24, 40 + i * 28], [120 + r() * 150, 40 + i * 28]], { width: 1.6, color: P.navy })
  }
  return c
}

// a wooden shelf, with its brackets
export function shelfPlank(seed = 1) {
  const c = canvas(600, 90)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3.5, wobble: 0.8 })
  m.rect(4, 4, 592, 26, '#a8784a')
  for (const x of [70, 530]) m.shape([[x - 8, 30], [x + 8, 30], [x + 8, 86], [x - 30, 32]], '#7a4e2c')
  return c
}

// a wire drying rack, with clips
export function dryingRack(seed = 1) {
  const c = canvas(420, 520)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3.5, wobble: 0.8, color: '#55565e' })
  m.line([[40, 510], [70, 30]])
  m.line([[380, 510], [350, 30]])
  for (let y = 60; y < 440; y += 95) {
    m.line([[60, y], [360, y]], { width: 3 })
    for (let x = 100; x < 340; x += 80) m.rect(x, y - 4, 12, 22, '#d9b45a', { width: 2 })
  }
  return c
}

// Stand-in resin pieces: 'coaster', 'drop', 'tray', 'dish', in see-through colours.
export function resin(kind, tint, seed = 1) {
  const c = canvas(300, 300)
  const ctx = c.getContext('2d')
  const r = rng(seed * 97)
  const m = marker(ctx, seed, { width: 3.5, wobble: 1, color: mix(tint, '#000000', 0.5) })
  const shapes = {
    coaster: oval(150, 150, 130, 130, 24),
    drop: [[150, 20], [236, 160], [222, 236], [150, 284], [78, 236], [64, 160]],
    tray: [[24, 70], [276, 70], [282, 230], [18, 230]],
    dish: oval(150, 170, 130, 90, 22),
  }
  const pts = shapes[kind] || shapes.coaster
  ctx.globalAlpha = 0.86
  m.shape(pts, tint)
  ctx.globalAlpha = 1
  ctx.save()
  trace(ctx, pts)
  ctx.clip()
  // swirls of a second colour, and gold flecks
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + r() * 0.3})`
    ctx.lineWidth = 6 + r() * 10
    ctx.beginPath()
    ctx.arc(80 + r() * 140, 80 + r() * 140, 30 + r() * 60, r() * 6, r() * 6 + 2)
    ctx.stroke()
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(230,190,90,${0.6 + r() * 0.4})`
    ctx.fillRect(40 + r() * 220, 40 + r() * 220, 2 + r() * 4, 2 + r() * 3)
  }
  ctx.restore()
  // the shine
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(130, 130, 80, Math.PI * 1.05, Math.PI * 1.45)
  ctx.stroke()
  return c
}

// The desk lamp, in two parts: its foot, and its arm with the shade (the arm swings).
export function lampFoot(seed = 1) {
  const c = canvas(200, 160)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1, color: '#1d1d24' })
  m.blob(100, 140, 80, 16, '#3a3a46')
  m.rect(92, 20, 16, 120, '#3a3a46')
  return c
}
export function lampArm(seed = 1) {
  const c = canvas(420, 160)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1, color: '#1d1d24' })
  m.rect(10, 70, 290, 16, '#3a3a46')
  m.blob(20, 78, 18, 18, '#3a3a46')
  m.shape([[290, 40], [360, 20], [410, 140], [300, 120]], '#3a3a46')
  m.shape([[304, 112], [404, 132], [396, 150], [312, 126]], WARM, { width: 2.5 })
  return c
}

// the worktable: a table, and the mess on it
export function worktable(seed = 1) {
  const c = canvas(640, 300)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.rect(10, 40, 620, 34, '#b8875a')
  for (const x of [40, 580]) m.rect(x, 74, 22, 222, '#8a5d38')
  fibres(ctx)
  return c
}
export function cups(seed = 1) {
  const c = canvas(330, 210)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 3.5, wobble: 1 })
  const cup = (x, tint) => {
    m.line([[x + 20, 20], [x + 44, 150]], { width: 6, color: '#d9b48a' })
    m.shape([[x, 90], [x + 80, 90], [x + 70, 204], [x + 10, 204]], 'rgba(235,240,250,0.9)')
    m.shape([[x + 6, 140], [x + 74, 140], [x + 70, 202], [x + 10, 202]], tint, { width: 2 })
  }
  cup(20, '#f7a1c4')
  cup(130, '#3fc1c9')
  cup(236, '#ffcf5c')
  return c
}
export function drip(tint, seed = 1) {
  const c = canvas(240, 120)
  const ctx = c.getContext('2d')
  ctx.globalAlpha = 0.85
  marker(ctx, seed, { width: 3, wobble: 1.4, color: mix(tint, '#000000', 0.45) }).shape(
    [[20, 30], [120, 18], [220, 36], [200, 70], [150, 64], [140, 110], [118, 66], [40, 70]],
    tint,
  )
  return c
}

// the bike workshop's repair stand: a tripod, a post and a clamp
export function repairStand(seed = 1) {
  const c = canvas(380, 660)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 5, wobble: 1, color: '#1d1d24' })
  m.line([[190, 640], [40, 650]])
  m.line([[190, 640], [340, 650]])
  m.line([[190, 640], [190, 120]], { width: 9, color: '#c8323a' })
  m.line([[190, 130], [290, 90]], { width: 7, color: '#3a3a46' })
  m.shape([[280, 70], [330, 70], [330, 120], [280, 120]], '#3a3a46')
  return c
}

// Stand-in for her product: a little bicycle on its side.
export function bike(trim, seed = 1) {
  const c = canvas(640, 420)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 6, wobble: 1.2 })
  for (const x of [150, 490]) {
    m.blob(x, 290, 110, 110, null, { width: 12, color: '#2b2b30' })
    m.blob(x, 290, 12, 12, '#9aa0aa', { width: 3 })
    for (let i = 0; i < 12; i++) m.line([[x, 290], [x + Math.cos(i * 0.52) * 100, 290 + Math.sin(i * 0.52) * 100]], { width: 1.5, color: '#8a9099' })
  }
  const frame = { width: 10, color: trim }
  m.line([[150, 290], [300, 290], [250, 150], [150, 290]], frame)
  m.line([[250, 150], [440, 160], [300, 290]], frame)
  m.line([[440, 160], [490, 290]], frame)
  m.line([[250, 150], [236, 110]], { width: 8 })
  m.shape([[200, 100], [270, 96], [262, 116], [206, 118]], '#2b2b30')
  m.line([[440, 160], [430, 100], [470, 86]], { width: 8 })
  m.shape([[470, 160], [580, 150], [570, 214], [480, 220]], '#d9b48a', { width: 4 })
  return c
}

// a numbered tag for a design decision
export function numberTag(n, trim, seed = 1) {
  const c = canvas(140, 140)
  const ctx = c.getContext('2d')
  marker(ctx, seed, { width: 4, wobble: 1 }).blob(70, 70, 58, 58, '#fffaf0')
  marker(ctx, seed + 1, { width: 3, wobble: 1, color: trim }).blob(70, 70, 48, 48, null)
  write(ctx, String(n), 70, 74, { size: 70, max: 80 })
  return c
}

// a pegboard of tools
export function pegboard(seed = 1) {
  const c = canvas(620, 340)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.rect(6, 6, 608, 328, '#c9a77c')
  ctx.fillStyle = 'rgba(60,40,20,0.45)'
  for (let y = 30; y < 330; y += 26) for (let x = 30; x < 610; x += 26) ctx.fillRect(x, y, 4, 4)
  const tool = marker(ctx, seed + 2, { width: 4, wobble: 1, color: '#1d1d24' })
  tool.shape([[80, 60], [110, 60], [104, 270], [86, 270]], '#9aa0aa')
  tool.blob(95, 60, 28, 22, '#9aa0aa')
  tool.shape([[200, 70], [222, 70], [222, 180], [200, 180]], '#c8323a')
  tool.line([[211, 180], [211, 280]], { width: 6 })
  tool.line([[330, 60], [360, 270]], { width: 8, color: '#3a3a46' })
  tool.line([[380, 60], [350, 270]], { width: 8, color: '#3a3a46' })
  tool.blob(500, 160, 70, 70, null, { width: 10, color: '#2b2b30' })
  return c
}

// The blackboard, with the module's title and goal in chalk.
export function blackboard(title, goal, seed = 1) {
  const W = 900
  const H = 440
  const c = canvas(W, H)
  const ctx = c.getContext('2d')
  const r = rng(seed * 43)
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.rect(6, 6, W - 12, H - 40, '#9c6a3c')
  m.rect(30, 30, W - 60, H - 88, '#2f4a3c', { width: 2.5 })
  // old chalk rubbed into the board
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(230,240,230,${0.03 + r() * 0.05})`
    ctx.lineWidth = 20 + r() * 30
    ctx.beginPath()
    const x = 40 + r() * (W - 80)
    const y = 50 + r() * (H - 130)
    ctx.moveTo(x, y)
    ctx.lineTo(x + 80 + r() * 120, y + (r() - 0.5) * 30)
    ctx.stroke()
  }
  const chalk = 'rgba(244,246,238,0.94)'
  write(ctx, title.text, W / 2, 130, { size: 64, max: W - 140, maxH: 140, lines: 2, color: title.todo ? 'rgba(244,246,238,0.6)' : chalk })
  write(ctx, goal.text, W / 2, 280, { size: 40, max: W - 160, maxH: 120, lines: 2, color: goal.todo ? 'rgba(244,246,238,0.5)' : chalk })
  // chalk is never solid: speckle the board colour back over the words
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = 'rgba(47,74,60,0.5)'
    ctx.fillRect(40 + r() * (W - 80), 50 + r() * (H - 130), 2, 2)
  }
  // the tray, with a stick of chalk
  m.rect(30, H - 44, W - 60, 22, '#9c6a3c')
  m.rect(W - 220, H - 54, 60, 12, '#f4f6ee', { width: 2 })
  return c
}

// a school desk and its chair, from the front
export function schoolDesk(seed = 1) {
  const c = canvas(330, 290)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.rect(40, 230, 70, 14, '#6a8fc9')
  m.line([[52, 244], [52, 286]], { width: 5 })
  m.line([[98, 244], [98, 286]], { width: 5 })
  m.rect(48, 170, 54, 60, '#6a8fc9')
  m.rect(110, 120, 210, 26, '#c9a06a')
  m.rect(126, 146, 178, 60, '#b8875a')
  m.line([[130, 206], [130, 286]], { width: 5 })
  m.line([[300, 206], [300, 286]], { width: 5 })
  m.rect(170, 100, 90, 20, '#fffdf6', { width: 2.5 })
  return c
}

// a globe on its stand
export function globe(seed = 1) {
  const c = canvas(270, 360)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 4, wobble: 1 })
  m.shape([[90, 350], [180, 350], [160, 320], [110, 320]], '#9c6a3c')
  m.line([[135, 320], [135, 270]], { width: 6 })
  m.line([[40, 140], [60, 240], [135, 280]], { width: 5, color: '#c9a24a' })
  m.blob(135, 150, 110, 110, '#7fb8e8')
  const land = marker(ctx, seed + 4, { width: 3, wobble: 2.4 })
  land.shape([[70, 110], [130, 80], [170, 110], [150, 150], [100, 160]], '#8bd18f')
  land.shape([[150, 190], [200, 170], [220, 210], [180, 240], [150, 225]], '#8bd18f')
  land.shape([[60, 190], [90, 180], [100, 220], [74, 230]], '#8bd18f')
  return c
}

// Children's-drawing animals for the classroom wall: 'panda', 'crane', 'monkey', 'tiger'.
export function animal(kind, seed = 1) {
  const c = canvas(300, 260)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fffdf6'
  ctx.fillRect(0, 0, 300, 260)
  const crayon = (color, width = 9) => marker(ctx, seed + color.length, { color, width, wobble: 3.4 })
  if (kind === 'panda') {
    crayon('#1d1d24').blob(150, 150, 92, 78, '#f4f4f0')
    crayon('#1d1d24').blob(150, 90, 62, 52, '#f4f4f0')
    for (const x of [108, 192]) crayon('#1d1d24').blob(x, 44, 18, 18, '#1d1d24')
    for (const x of [128, 172]) crayon('#1d1d24').blob(x, 86, 13, 16, '#1d1d24')
  } else if (kind === 'crane') {
    crayon('#1d1d24', 7).line([[140, 250], [150, 170]])
    crayon('#1d1d24', 7).line([[170, 250], [160, 170]])
    crayon('#1d1d24').blob(155, 140, 70, 40, '#f4f4f0')
    crayon('#1d1d24', 8).line([[110, 130], [80, 60], [96, 40]])
    crayon('#d23a33', 8).blob(98, 40, 12, 10, '#d23a33')
  } else if (kind === 'monkey') {
    crayon('#d9902e').blob(150, 160, 70, 72, '#f2b24a')
    crayon('#d9902e').blob(150, 80, 50, 46, '#f2b24a')
    crayon('#5a8fd6', 7).blob(150, 90, 26, 22, '#9fc4f0')
    crayon('#d9902e', 8).line([[220, 180], [270, 140], [256, 100]])
  } else {
    crayon('#d9902e').blob(150, 150, 110, 64, '#f6a23c')
    crayon('#1d1d24', 7).line([[110, 100], [100, 140]])
    crayon('#1d1d24', 7).line([[150, 92], [150, 140]])
    crayon('#1d1d24', 7).line([[190, 100], [200, 140]])
    crayon('#d9902e').blob(64, 116, 40, 36, '#f6a23c')
  }
  return c
}

// a stand-in page of the module's workbook
export function workbookPage(n, total, seed = 1) {
  const c = canvas(600, 800)
  const ctx = c.getContext('2d')
  const r = rng(seed * 113 + n)
  ctx.fillStyle = '#fdfbf4'
  ctx.fillRect(0, 0, 600, 800)
  fibres(ctx)
  const m = marker(ctx, seed + n, { width: 3, wobble: 1 })
  write(ctx, `${n} / ${total}`, 300, 70, { size: 48, max: 300 })
  m.line([[60, 110], [540, 108]], { width: 2.5 })
  for (let i = 0; i < 9; i++) m.line([[60, 160 + i * 34], [300 + r() * 240, 160 + i * 34]], { width: 1.6, color: P.pencil })
  m.rect(70, 500, 220, 220, null)
  m.blob(180, 610, 70, 60, [HI.yellow, HI.pink, HI.green][n % 3])
  for (let i = 0; i < 6; i++) m.line([[330, 520 + i * 34], [520, 520 + i * 34]], { width: 1.6, color: P.pencil })
  return c
}

// A photo or drawing of hers, pinned up: given a white border so it reads as a print.
export function pinnedPrint(source, seed = 1) {
  const sw = source.naturalWidth || source.width
  const sh = source.naturalHeight || source.height
  const k = Math.min(1, 520 / Math.max(sw, sh))
  const w = Math.round(sw * k)
  const h = Math.round(sh * k)
  const c = canvas(w + 28, h + 28)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(source, 14, 14, w, h)
  marker(ctx, seed, { width: 2, wobble: 0.6, color: 'rgba(60,50,40,0.5)' }).rect(1, 1, c.width - 2, c.height - 2, null)
  return c
}
