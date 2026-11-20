// The load screen: a delivery.
// A sealed cardboard box drops in below where the shelf hangs and waits there
// while the rooms are made. Its packing tape rolls back as the work gets done
// (the real work: see `work` in assets.js), and now and then it rattles,
// something peeks out between its flaps, or one of her cities is stamped on
// its side. When everything is ready the last strip of tape rips off, the
// flaps burst open and the shelf comes up out of it, small and growing, while
// the camera pulls back to the usual view. The shelf has been waiting inside
// it all along, shrunk: it is the same shelf, not a copy.
// Like all paper it moves on the stop-motion tick; only the camera glides.
//
// Her own drawings can stand in for any of the drawn ones: drawings/delivery-label,
// drawings/peek-paw, peek-pack, peek-film, peek-snowflake and peek-eyes (PNG).
import * as THREE from 'three'
import { site } from '../data/projects.js'
import { places } from '../data/places.js'
import { PALETTE as P, rng, canvas, cardCanvas, texture, makeFlat, softShadow } from './paper.js'
import { art } from './assets.js'
import { marker, write, fibres, corrugated } from './placeholders.js'
import { puff, oval, curve, darker, blush, eye, heartShape, starShape } from './soft.js'
import { HER } from './doodle.js'

const W = 3.3 // the box: wide, tall and deep, in scene units
const H = 2.1
const D = 2.3
const T = 0.06 // card thickness
const FLAP = D / 2 - 0.006 // the long flaps meet in the middle (a hair apart, so the seam shows)
const TURN = -0.62 // it stands turned, so its front and its right side both show
export const LIFT = 0.36 // the camera looks down onto its top, where the tape is
const TILE = 3 // as on the shelf: a scanned sheet covers this much before it repeats
const TAPE_W = 0.44
const TAPE_TILE = 1.6 // the tape's print repeats every this much
const FOLD = 0.4 // how far the tape runs down the right side
const Z = -1 // how far back it stands (the wall is at -3.1)
const CALM = 0.8 // past this much of the work the last shaders compile and the page can stall: the box keeps still
const UP = new THREE.Vector3(0, 1, 0)

const INKS = ['#24356f', '#c3423a', '#2f7b5c', '#6b4fa0', '#1f7a8c', '#8a3247']
const STAMP = 'Impact, "Arial Narrow", "Arial Black", "Helvetica Neue", sans-serif'
const TYPE = '"Courier New", Courier, monospace'

const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2 // the camera's own easing (camera.js)
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// ---------------------------------------------------------------- drawings

// A rubber stamp never inks evenly: knock out specks and a few dry streaks.
function distress(ctx, w, h, seed, amount = 1) {
  const r = rng(seed * 31 + 7)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = ctx.strokeStyle = '#000'
  for (let i = 0; i < ((w * h) / 520) * amount; i++) {
    ctx.globalAlpha = 0.2 + r() * 0.7
    const s = 0.8 + r() * 3.2
    ctx.beginPath()
    ctx.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.6), r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.lineCap = 'round'
  for (let i = 0; i < 7 * amount; i++) {
    ctx.globalAlpha = 0.12 + r() * 0.22
    ctx.lineWidth = 3 + r() * 9
    const x = r() * w
    const y = r() * h
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (r() - 0.3) * w * 0.6, y + (r() - 0.5) * 14)
    ctx.stroke()
  }
  ctx.restore()
}

// the biggest size (down from `size`) at which `text` fits `max` wide
function fit(ctx, text, max, size, family, weight = 700) {
  for (; size > 10; size -= 2) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= max) break
  }
  return size
}

function spaced(ctx, text, x, y, spacing) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`
  ctx.fillText(text, x, y)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

// letters round a circle: along its top, or along its bottom (both read left to right)
function arcText(ctx, text, cx, cy, r, where, size, family) {
  const span = where === 'top' ? Math.PI * 0.9 : Math.PI * 0.6
  size = fit(ctx, text, span * r * 0.86, size, family, 400)
  ctx.font = `400 ${size}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const chars = [...text]
  const gap = size * 0.14
  const widths = chars.map((ch) => ctx.measureText(ch).width + gap)
  const total = widths.reduce((a, b) => a + b, 0) - gap
  let along = -total / 2
  chars.forEach((ch, i) => {
    const mid = along + (widths[i] - gap) / 2
    const a = where === 'top' ? -Math.PI / 2 + mid / r : Math.PI / 2 - mid / r
    ctx.save()
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    ctx.rotate(where === 'top' ? a + Math.PI / 2 : a - Math.PI / 2)
    ctx.fillText(ch, 0, 0)
    ctx.restore()
    along += widths[i]
  })
}

function plane(ctx, x, y, k) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  ctx.rotate(-0.45)
  ctx.beginPath()
  ctx.moveTo(-34, -3)
  ctx.lineTo(24, -4)
  ctx.quadraticCurveTo(38, 0, 24, 4)
  ctx.lineTo(-34, 3)
  ctx.closePath()
  for (const s of [-1, 1]) {
    ctx.moveTo(-2, 3 * s)
    ctx.lineTo(-16, 30 * s)
    ctx.lineTo(-6, 30 * s)
    ctx.lineTo(14, 3 * s)
    ctx.closePath()
    ctx.moveTo(-30, 2 * s)
    ctx.lineTo(-38, 14 * s)
    ctx.lineTo(-32, 14 * s)
    ctx.lineTo(-22, 2 * s)
    ctx.closePath()
  }
  ctx.fill()
  ctx.restore()
}

function waves(ctx, x0, x1, y0, rows, gap, amp = 7) {
  for (let k = 0; k < rows; k++) {
    ctx.beginPath()
    for (let x = x0; x <= x1; x += 4) {
      const y = y0 + k * gap + Math.sin((x - x0) / 15) * amp
      if (x === x0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.3)
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3)
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.78, x, y + s)
  ctx.bezierCurveTo(x, y + s * 0.78, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3)
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3)
}

// The shipping label: white paper, who it is for and who from, a stamp, a barcode.
function shippingLabel(seed = 1) {
  const c = canvas(740, 480)
  const ctx = c.getContext('2d')
  const m = marker(ctx, seed, { width: 6, wobble: 1.3 })
  m.shape([[16, 18], [722, 12], [726, 462], [14, 468]], '#fffdf6')
  fibres(ctx)
  // a postage stamp, perforated, with a heart on it
  const st = canvas(132, 156)
  const s = st.getContext('2d')
  s.fillStyle = '#f6c3cf'
  s.fillRect(6, 6, 120, 144)
  s.fillStyle = '#fff6f0'
  s.fillRect(16, 16, 100, 108)
  puff(s, heartShape(66, 68, 32), '#e2557f', { line: darker('#e2557f', 0.4), width: 3, fuzz: 0, glow: 0.6 })
  s.fillStyle = '#b8455f'
  s.font = `700 20px ${TYPE}`
  s.textAlign = 'center'
  s.fillText('1st', 66, 142)
  s.globalCompositeOperation = 'destination-out'
  for (let x = 6; x <= 126; x += 12) for (const y of [6, 150]) s.beginPath(), s.arc(x, y, 5, 0, Math.PI * 2), s.fill()
  for (let y = 6; y <= 150; y += 12) for (const x of [6, 126]) s.beginPath(), s.arc(x, y, 5, 0, Math.PI * 2), s.fill()
  ctx.save()
  ctx.translate(574, 34)
  ctx.rotate(0.06)
  ctx.drawImage(st, 0, 0)
  ctx.restore()
  // franked: a postmark over its corner
  ctx.strokeStyle = 'rgba(36, 53, 111, 0.6)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(580, 168, 44, 0, Math.PI * 2)
  ctx.stroke()
  waves(ctx, 632, 712, 150, 3, 16, 5)
  // who it is for, and who from
  write(ctx, 'to:', 78, 112, { size: 46, color: P.pencil })
  write(ctx, 'you', 256, 102, { size: 134, color: P.navy, tilt: -0.04 })
  puff(ctx, heartShape(408, 86, 22), '#ff7fa6', { line: darker('#ff7fa6', 0.45), width: 3, fuzz: 0, glow: 0.6 })
  ctx.fillStyle = P.pencil
  for (let x = 58; x < 540; x += 16) ctx.fillRect(x, 182, 8, 3)
  write(ctx, 'from:', 98, 258, { size: 42, color: P.pencil })
  write(ctx, site.name.toLowerCase(), 368, 254, { size: 74, max: 400, color: P.navy })
  // the barcode, and the small print under it
  const r = rng(seed * 5 + 3)
  ctx.fillStyle = '#1d1d26'
  for (let x = 62; x < 470; ) {
    const w = 2 + Math.floor(r() * 4) * 2
    if (r() < 0.62) ctx.fillRect(x, 328, w, 76)
    x += w + 2 + Math.floor(r() * 3) * 2
  }
  ctx.font = `700 24px ${TYPE}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('1 OF 1 · HANDLE WITH LOVE', 62, 434)
  return c
}

// FRAGILE: HANDMADE, in red, with a cracked glass
function fragileStamp(seed = 3) {
  const c = cardCanvas(640, 260)
  const ctx = c.getContext('2d')
  ctx.strokeStyle = ctx.fillStyle = INKS[1]
  ctx.lineJoin = ctx.lineCap = 'round'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.roundRect(14, 14, 612, 232, 20)
  ctx.stroke()
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.roundRect(32, 32, 576, 196, 10)
  ctx.stroke()
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(76, 60)
  ctx.lineTo(144, 60)
  ctx.quadraticCurveTo(148, 130, 110, 142)
  ctx.quadraticCurveTo(72, 130, 76, 60)
  ctx.moveTo(110, 142)
  ctx.lineTo(110, 196)
  ctx.moveTo(84, 200)
  ctx.lineTo(136, 200)
  ctx.stroke()
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(98, 66)
  ctx.lineTo(112, 88)
  ctx.lineTo(101, 102)
  ctx.lineTo(118, 122)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fit(ctx, 'FRAGILE:', 410, 126, STAMP, 400)
  ctx.fillText('FRAGILE:', 392, 110)
  ctx.font = `700 50px ${TYPE}`
  spaced(ctx, 'HANDMADE', 392, 192, 8)
  distress(ctx, 640, 260, seed, 0.8)
  return c
}

// the two arrows: this side up
function upStamp(seed = 4) {
  const c = cardCanvas(340, 380)
  const ctx = c.getContext('2d')
  ctx.fillStyle = INKS[0]
  for (const x of [112, 228]) {
    ctx.beginPath()
    ctx.moveTo(x, 30)
    ctx.lineTo(x + 52, 102)
    ctx.lineTo(x + 20, 102)
    ctx.lineTo(x + 20, 212)
    ctx.lineTo(x - 20, 212)
    ctx.lineTo(x - 20, 102)
    ctx.lineTo(x - 52, 102)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillRect(50, 234, 240, 18)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 40px ${TYPE}`
  spaced(ctx, 'THIS SIDE', 170, 294, 2)
  spaced(ctx, 'UP', 170, 340, 6)
  distress(ctx, 340, 380, seed, 0.8)
  return c
}

// A travel stamp for one of her cities: a round postmark, an arrival stamp or an oval.
function cityStamp(place, n) {
  const ink = INKS[(n * 5 + 2) % INKS.length]
  const city = place.city.toUpperCase()
  const country = place.country.toUpperCase()
  const year = place.date?.match(/\d{4}/)?.[0]
  const kind = n % 3
  const c = cardCanvas(kind === 0 ? 560 : 500, kind === 1 ? 330 : 360)
  const ctx = c.getContext('2d')
  ctx.strokeStyle = ctx.fillStyle = ink
  ctx.lineJoin = ctx.lineCap = 'round'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (kind === 0) {
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.arc(180, 180, 156, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(180, 180, 100, 0, Math.PI * 2)
    ctx.stroke()
    arcText(ctx, city, 180, 180, 128, 'top', 48, STAMP)
    arcText(ctx, country, 180, 180, 128, 'bottom', 32, STAMP)
    plane(ctx, 180, year ? 160 : 180, year ? 1.05 : 1.4)
    if (year) {
      ctx.font = `700 34px ${TYPE}`
      ctx.fillText(year, 180, 226)
    }
    ctx.lineWidth = 7
    waves(ctx, 334, 548, 108, 5, 36)
  } else if (kind === 1) {
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.roundRect(14, 14, 472, 302, 26)
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(30, 30, 440, 270, 16)
    ctx.stroke()
    ctx.font = `700 32px ${TYPE}`
    spaced(ctx, 'ARRIVED', 250, 74, 10)
    fit(ctx, city, 390, 104, STAMP, 400)
    ctx.fillText(city, 250, 160)
    ctx.beginPath()
    ctx.moveTo(70, 216)
    ctx.lineTo(430, 216)
    ctx.stroke()
    fit(ctx, country, 300, 30, TYPE)
    ctx.fillText(country, 222, 256)
    plane(ctx, 404, 254, 0.7)
  } else {
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.ellipse(250, 180, 228, 160, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.setLineDash([14, 9])
    ctx.beginPath()
    ctx.ellipse(250, 180, 200, 134, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 ? 9 : 22
      ctx.lineTo(250 + Math.cos(a) * r, 96 + Math.sin(a) * r)
    }
    ctx.fill()
    fit(ctx, city, 330, 92, STAMP, 400)
    ctx.fillText(city, 250, 182)
    fit(ctx, `· ${country} ·`, 300, 28, TYPE)
    ctx.fillText(`· ${country} ·`, 250, 254)
  }
  distress(ctx, c.width, c.height, n + 11)
  return c
}

// The sticky note on the front that says how far along it is.
function drawNote(c, pct) {
  const ctx = c.getContext('2d')
  const w = c.width
  const h = c.height
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2 + 10)
  ctx.rotate(-0.02)
  ctx.fillStyle = 'rgba(60, 40, 10, 0.2)'
  ctx.beginPath()
  ctx.moveTo(-166, 128)
  ctx.quadraticCurveTo(0, 182, 174, 136)
  ctx.lineTo(172, 112)
  ctx.lineTo(-166, 120)
  ctx.fill()
  const g = ctx.createLinearGradient(0, -170, 0, 160)
  g.addColorStop(0, '#fff4b0')
  g.addColorStop(1, '#f6e283')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(-172, -166)
  ctx.lineTo(172, -170)
  ctx.lineTo(170, 126)
  ctx.quadraticCurveTo(10, 160, -168, 140)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(150, 118, 40, 0.45)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()
  ctx.save()
  ctx.translate(w / 2, 44)
  ctx.rotate(0.05)
  ctx.fillStyle = 'rgba(232, 220, 182, 0.94)'
  ctx.fillRect(-92, -24, 184, 48)
  ctx.restore()
  write(ctx, 'unpacking…', w / 2, 142, { size: 66, max: 330, color: P.navy })
  write(ctx, `${pct}%`, w / 2, 266, { size: 142, max: 320, color: P.navy, tilt: -0.03 })
}

// brown packing tape, a little see-through, with its print; it repeats along its length
function packingTape() {
  const c = cardCanvas(512, 128)
  const ctx = c.getContext('2d')
  const r = rng(11)
  ctx.fillStyle = 'rgba(196, 146, 84, 0.95)'
  ctx.fillRect(0, 4, 512, 120)
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '255, 236, 200' : '110, 70, 35'}, ${0.05 + r() * 0.08})`
    ctx.fillRect(0, 6 + r() * 116, 512, 1 + r() * 2)
  }
  const g = ctx.createLinearGradient(0, 4, 0, 124)
  g.addColorStop(0.12, 'rgba(255, 255, 255, 0)')
  g.addColorStop(0.3, 'rgba(255, 248, 230, 0.34)')
  g.addColorStop(0.46, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 4, 512, 120)
  ctx.fillStyle = 'rgba(150, 50, 40, 0.5)'
  ctx.font = `700 30px ${TYPE}`
  ctx.textBaseline = 'middle'
  for (const x of [28, 284]) {
    ctx.fillText('HANDMADE', x, 66)
    heartPath(ctx, x + 196, 50, 30)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(100, 62, 30, 0.4)'
  ctx.fillRect(0, 4, 512, 3)
  ctx.fillRect(0, 121, 512, 3)
  return c
}

// where the tape ends, down the side: cut with the dispenser's teeth
function tapeEnd() {
  const c = cardCanvas(128, 128)
  const ctx = c.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(4, 0)
  ctx.lineTo(124, 0)
  for (let x = 124, k = 0; x >= 4; x -= 8, k++) ctx.lineTo(x, k % 2 ? 108 : 122)
  ctx.closePath()
  ctx.fillStyle = 'rgba(196, 146, 84, 0.95)'
  ctx.fill()
  ctx.save()
  ctx.clip()
  const r = rng(12)
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '255, 236, 200' : '110, 70, 35'}, ${0.05 + r() * 0.08})`
    ctx.fillRect(4 + r() * 120, 0, 1 + r() * 2, 128)
  }
  ctx.fillStyle = 'rgba(100, 62, 30, 0.4)'
  ctx.fillRect(4, 0, 3, 128)
  ctx.fillRect(121, 0, 3, 128)
  ctx.restore()
  return c
}

// the rolled-up end of the tape, seen end on
function curlCap() {
  const c = cardCanvas(256, 256)
  const ctx = c.getContext('2d')
  ctx.beginPath()
  ctx.arc(128, 128, 118, 0, Math.PI * 2)
  const g = ctx.createRadialGradient(100, 96, 10, 128, 128, 120)
  g.addColorStop(0, '#dcae6e')
  g.addColorStop(1, '#a8773f')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(92, 56, 24, 0.75)'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let t = 0; t <= 1; t += 0.004) {
    const a = t * Math.PI * 2 * 3.4
    const r = 14 + t * 98
    const x = 128 + Math.cos(a) * r
    const y = 128 + Math.sin(a) * r
    if (t === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.strokeStyle = P.navy
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(128, 128, 116, 0, Math.PI * 2)
  ctx.stroke()
  return c
}

// What peeks out between the flaps: one thing from each box.
const FUR = '#fbf8f2'
const BEAN = '#f2a7b5'
function paw(seed = 1) {
  const c = canvas(320, 440)
  const ctx = c.getContext('2d')
  const line = { line: P.navy, width: 4.5, seed }
  puff(ctx, curve([[104, 440], [98, 300], [104, 226], [216, 226], [222, 300], [216, 440]]), FUR, { ...line, glow: 0.4 })
  for (const [x, y, r] of [[90, 104, 30], [134, 72, 32], [186, 72, 32], [230, 104, 30]]) puff(ctx, oval(x, y, r, r * 1.08), FUR, line)
  puff(ctx, oval(160, 174, 98, 82), FUR, line)
  const pink = { ...line, width: 3, fuzz: 0, glow: 0.65 }
  puff(ctx, curve([[160, 150], [214, 170], [212, 220], [160, 234], [108, 220], [106, 170]]), BEAN, pink)
  for (const [x, y] of [[92, 98], [136, 68], [184, 68], [228, 98]]) puff(ctx, oval(x, y, 15, 17), BEAN, pink)
  fibres(ctx)
  return c
}
function packCorner(seed = 1) {
  const c = canvas(300, 420)
  const ctx = c.getContext('2d')
  const top = []
  for (let x = 30, k = 0; x <= 270; x += 12, k++) top.push([x, k % 2 ? 26 : 40])
  const body = [...top, [270, 420], [30, 420]]
  ctx.beginPath()
  body.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  const g = ctx.createLinearGradient(0, 0, 300, 420)
  ;['#f8c8dc', '#c8e2fa', '#d4f6c8', '#faf0bc', '#e0c8fa'].forEach((col, i) => g.addColorStop(i / 4, col))
  ctx.fillStyle = g
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#d9dde6'
  ctx.fillRect(0, 0, 300, 64)
  ctx.fillStyle = 'rgba(120, 128, 150, 0.45)'
  for (let x = 34; x < 270; x += 9) ctx.fillRect(x, 30, 3, 32)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  for (const [x, y, s] of [[70, 120, 14], [228, 170, 10], [96, 330, 12], [206, 380, 9]]) {
    ctx.beginPath()
    ctx.moveTo(x, y - s)
    ctx.lineTo(x + s * 0.25, y - s * 0.25)
    ctx.lineTo(x + s, y)
    ctx.lineTo(x + s * 0.25, y + s * 0.25)
    ctx.lineTo(x, y + s)
    ctx.lineTo(x - s * 0.25, y + s * 0.25)
    ctx.lineTo(x - s, y)
    ctx.lineTo(x - s * 0.25, y - s * 0.25)
    ctx.fill()
  }
  ctx.restore()
  puff(ctx, oval(150, 210, 66, 66), '#fffaf0', { line: P.navy, width: 4, fuzz: 0, glow: 0.5 })
  puff(ctx, starShape(150, 212, 46), '#f2c75c', { line: darker('#f2c75c', 0.45), width: 3.5, fuzz: 0, glow: 0.6 })
  write(ctx, 'booster', 150, 330, { size: 52, color: P.navy, tilt: -0.04 })
  marker(ctx, seed, { width: 6, wobble: 1.2 }).shape(body, null)
  return c
}
function filmTip(seed = 1) {
  const c = canvas(240, 470)
  const ctx = c.getContext('2d')
  const strip = [[48, 470], [46, 120], [56, 60], [92, 28], [150, 22], [188, 44], [194, 120], [192, 470]]
  ctx.beginPath()
  strip.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fillStyle = '#2b2622'
  ctx.fill()
  ctx.fillStyle = '#efe6d2'
  for (let y = 84; y < 460; y += 30) for (const x of [56, 172]) ctx.beginPath(), ctx.roundRect(x, y, 13, 17, 3), ctx.fill()
  const frames = [['#bfe3f7', (x, y) => (puff(ctx, oval(x + 20, y + 24, 14, 14), '#f7d36d', { width: 0, fuzz: 0 }), puff(ctx, oval(x + 44, y + 92, 60, 30), '#9fd39a', { width: 0, fuzz: 0 }))],
    ['#f8cbd8', (x, y) => puff(ctx, heartShape(x + 44, y + 48, 26), '#ff7fa6', { width: 0, fuzz: 0, glow: 0.5 })],
    ['#d8cdf6', (x, y) => puff(ctx, starShape(x + 44, y + 50, 26), '#f2c75c', { width: 0, fuzz: 0, glow: 0.5 })]]
  frames.forEach(([sky, draw], i) => {
    const x = 76
    const y = 90 + i * 124
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, 88, 104)
    ctx.clip()
    ctx.fillStyle = sky
    ctx.fillRect(x, y, 88, 104)
    draw(x, y)
    ctx.restore()
  })
  marker(ctx, seed, { width: 6, wobble: 1.2 }).shape(strip, null)
  return c
}
function snowflake(seed = 1) {
  const c = canvas(380, 380)
  const ctx = c.getContext('2d')
  const arms = (width, color) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = ctx.lineJoin = 'round'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      const at = (r, da = 0) => [190 + Math.cos(a + da) * r, 190 + Math.sin(a + da) * r]
      ctx.beginPath()
      ctx.moveTo(190, 190)
      ctx.lineTo(...at(158))
      for (const [r, len] of [[92, 46], [130, 30]]) {
        const [bx, by] = at(r)
        for (const s of [-1, 1]) {
          ctx.moveTo(bx, by)
          ctx.lineTo(bx + Math.cos(a + s * 0.75) * len, by + Math.sin(a + s * 0.75) * len)
        }
      }
      ctx.stroke()
    }
  }
  arms(30, '#5b6fa8')
  arms(20, '#ffffff')
  puff(ctx, oval(190, 190, 26, 26), '#ffffff', { line: '#5b6fa8', width: 5, fuzz: 0, glow: 0.4 })
  fibres(ctx)
  return c
}
// the top of her head, eyes just over the edge (her doodle's face: see doodle.js)
function herEyes(seed = 1) {
  const c = canvas(420, 300)
  const ctx = c.getContext('2d')
  const line = { line: P.navy, width: 4.5, seed }
  const hair = { ...line, glow: 0.22 }
  puff(ctx, curve([[112, 300], [120, 128], [160, 80], [210, 66], [260, 80], [300, 128], [308, 300]]), HER.hair, hair)
  puff(ctx, oval(210, 194, 84, 90), HER.skin, line)
  puff(ctx, curve([[124, 206], [126, 144], [158, 102], [210, 88], [262, 102], [294, 144], [296, 206], [278, 154], [244, 128], [214, 120], [206, 120], [176, 128], [142, 154]]), HER.hair, hair)
  eye(ctx, 182, 204, 11)
  eye(ctx, 238, 204, 11)
  blush(ctx, 160, 236)
  blush(ctx, 260, 236)
  return c
}

// marker strokes either side of a rattling box
function shakeLines(seed) {
  const c = cardCanvas(180, 240)
  const m = marker(c.getContext('2d'), seed, { width: 8, wobble: 2.4 })
  m.line([[70, 34], [44, 120], [70, 206]])
  m.line([[128, 70], [110, 120], [128, 170]])
  return c
}

// ---------------------------------------------------------------- the box

// A box's faces, with the scan laid at its real size on every one (as on the shelf).
function worldUV(g, sx, sy, sz, ws = 1, hs = 1, ds = 1) {
  const uv = g.attributes.uv
  const faces = [
    [sz, sy, (ds + 1) * (hs + 1)], [sz, sy, (ds + 1) * (hs + 1)],
    [sx, sz, (ws + 1) * (ds + 1)], [sx, sz, (ws + 1) * (ds + 1)],
    [sx, sy, (ws + 1) * (hs + 1)], [sx, sy, (ws + 1) * (hs + 1)],
  ]
  let k = 0
  for (const [a, b, n] of faces) for (let j = 0; j < n; j++, k++) uv.setXY(k, (uv.getX(k) * a) / TILE, (uv.getY(k) * b) / TILE)
}

// A flap of card hinged along the rim. It can open evenly, or flex: open more
// at one point along its hinge than another, the way a flap bends up when
// something pushes at it from inside. `along` x `up` x `toward` is kept a
// right-handed frame so its faces never turn inside out.
function makeFlap({ len, reach, hinge, along, toward, materials, segs = 20 }) {
  const g = new THREE.BoxGeometry(len, T, reach, segs, 1, 1)
  worldUV(g, len, T, reach, segs, 1, 1)
  const base = Float32Array.from(g.attributes.position.array)
  const pos = g.attributes.position
  const mesh = new THREE.Mesh(g, materials)
  mesh.castShadow = mesh.receiveShadow = true
  const flap = {
    mesh,
    // `angle`: radians open (0 shut, π/2 upright), or a function of where along the hinge
    set(angle) {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3]
        const v = base[i * 3 + 2] + reach / 2 // from the hinge to the free edge
        const h = base[i * 3 + 1] + T / 2 // up through the card
        const a = typeof angle === 'number' ? angle : angle(hinge.x + along.x * x, hinge.z + along.z * x)
        const c = Math.cos(a)
        const s = Math.sin(a)
        pos.setXYZ(
          i,
          hinge.x + along.x * x + toward.x * (c * v - s * h),
          hinge.y + s * v + c * h,
          hinge.z + along.z * x + toward.z * (c * v - s * h),
        )
      }
      pos.needsUpdate = true
      g.computeVertexNormals()
      g.computeBoundingSphere()
    },
  }
  flap.set(0)
  return flap
}

export async function buildDelivery({ stepped, shelf, redraw, quiet = () => true }) {
  const rand = rng((Date.now() % 100000) + 17) // (what it does while it waits differs from visit to visit)
  const own = [] // textures made here, to send ahead and to let go of afterwards
  const tex = (source) => {
    const t = texture(source)
    own.push(t)
    return t
  }

  const group = new THREE.Group() // where it stands
  const turned = new THREE.Group() // turned to show its front and right side
  turned.rotation.y = TURN
  group.add(turned)
  const box = new THREE.Group() // the box itself: it drops, rattles and hops
  turned.add(box)

  // ---- card
  const outside = new THREE.MeshLambertMaterial({ map: shelf.cardboard })
  const inside = new THREE.MeshLambertMaterial({ map: shelf.cardboard, color: '#f7e6c9' })
  const cutEdge = (upright) => {
    const map = tex(corrugated(upright))
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    const along = TILE / (T * 9)
    const across = TILE / T
    map.repeat.set(upright ? across : along, upright ? along : across)
    return new THREE.MeshLambertMaterial({ map })
  }
  const rim = cutEdge(false)
  const rimUp = cutEdge(true)

  const slab = (sx, sy, sz, x, y, z, faces) => {
    const g = new THREE.BoxGeometry(sx, sy, sz)
    worldUV(g, sx, sy, sz)
    const mesh = new THREE.Mesh(g, faces) // +x, -x, +y, -y, +z, -z
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    box.add(mesh)
  }
  const wall = H - T
  slab(W, T, D, 0, T / 2, 0, [outside, outside, inside, outside, outside, outside]) // floor
  slab(W, wall, T, 0, T + wall / 2, D / 2 - T / 2, [rimUp, rimUp, rim, outside, outside, inside]) // front
  slab(W, wall, T, 0, T + wall / 2, -D / 2 + T / 2, [rimUp, rimUp, rim, outside, inside, outside]) // back
  slab(T, wall, D - 2 * T, -W / 2 + T / 2, T + wall / 2, 0, [inside, outside, rimUp, outside, rimUp, rimUp]) // left
  slab(T, wall, D - 2 * T, W / 2 - T / 2, T + wall / 2, 0, [outside, inside, rimUp, outside, rimUp, rimUp]) // right

  const flapLook = [rim, rim, outside, inside, rim, rim]
  const V = (x, y, z) => new THREE.Vector3(x, y, z)
  const long = [
    makeFlap({ len: W, reach: FLAP, hinge: V(0, H, D / 2), along: V(-1, 0, 0), toward: V(0, 0, -1), materials: flapLook }),
    makeFlap({ len: W, reach: FLAP, hinge: V(0, H, -D / 2), along: V(1, 0, 0), toward: V(0, 0, 1), materials: flapLook }),
  ]
  // the short flaps lie folded in under the long ones: out of sight until it opens
  const short = [
    makeFlap({ len: D - 2 * T, reach: D / 2 - 0.03, hinge: V(-W / 2, H - 0.002, 0), along: V(0, 0, -1), toward: V(1, 0, 0), materials: flapLook, segs: 1 }),
    makeFlap({ len: D - 2 * T, reach: D / 2 - 0.03, hinge: V(W / 2, H - 0.002, 0), along: V(0, 0, 1), toward: V(-1, 0, 0), materials: flapLook, segs: 1 }),
  ]
  for (const f of [...long, ...short]) box.add(f.mesh)
  for (const f of short) f.mesh.visible = false

  const ground = softShadow(W + 1.7, D + 1.7, 0.6)
  ground.position.y = 0.004
  turned.add(ground)

  // ---- what is stuck and stamped on it
  const decal = (map, w, h, { paper = false } = {}) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshLambertMaterial({ map, transparent: true, depthWrite: false, alphaTest: paper ? 0.02 : 0 }),
    )
    mesh.receiveShadow = true
    box.add(mesh)
    return mesh
  }
  let layer = 0 // each new thing sits a hair further out, so overlaps never flicker
  const onFront = (mesh, x, y, tilt = 0) => {
    mesh.position.set(x, y, D / 2 + 0.006 + 0.0015 * layer++)
    mesh.rotation.set(0, 0, tilt)
  }
  // on the right side: `u` runs from its front edge (−) to its back edge (+)
  const onSide = (mesh, u, y, tilt = 0) => {
    mesh.position.set(W / 2 + 0.006 + 0.0015 * layer++, y, -u)
    mesh.rotation.set(0, Math.PI / 2, tilt)
  }

  const art1 = { tracings: 1 }
  const [labelArt, pawArt, packArt, filmArt, snowArt, eyesArt] = await Promise.all([
    art('drawings/delivery-label', shippingLabel, art1),
    art('drawings/peek-paw', paw, art1),
    art('drawings/peek-pack', packCorner, art1),
    art('drawings/peek-film', filmTip, art1),
    art('drawings/peek-snowflake', snowflake, art1),
    art('drawings/peek-eyes', herEyes, art1),
  ])
  const label = makeFlat(labelArt, { width: 1.46 })
  own.push(label.mesh.material.map)
  label.mesh.castShadow = false
  box.add(label.mesh)
  onFront(label.mesh, -0.48, 0.92, -0.025)

  onFront(decal(tex(fragileStamp()), 1.12, 0.455), -0.62, 1.7, -0.07)
  onSide(decal(tex(upStamp()), 0.5, 0.56), -0.66, 1.5, 0.05)

  const noteCanvas = cardCanvas(440, 400)
  drawNote(noteCanvas, 0)
  const noteMap = tex(noteCanvas)
  const note = decal(noteMap, 0.8, 0.727, { paper: true })
  onFront(note, 1.02, 1.32, 0.07)

  // ---- the tape: along the seam, over the right-hand edge and down the side
  const tape = new THREE.Group() // everything that rips off at the end; it pivots at the right edge
  tape.position.set(W / 2, H + T, 0)
  box.add(tape)
  const tapeMap = tex(packingTape())
  tapeMap.wrapS = THREE.RepeatWrapping
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1, TAPE_W), new THREE.MeshLambertMaterial({ map: tapeMap, transparent: true }))
  strip.rotation.x = -Math.PI / 2
  strip.position.y = 0.004
  strip.receiveShadow = true
  const foldPivot = new THREE.Group()
  foldPivot.position.set(0.006, 0, 0)
  const fold = new THREE.Mesh(new THREE.PlaneGeometry(TAPE_W, FOLD + T), new THREE.MeshLambertMaterial({ map: tex(tapeEnd()), transparent: true, side: THREE.DoubleSide }))
  fold.rotation.y = Math.PI / 2
  fold.position.y = -(FOLD + T) / 2
  fold.receiveShadow = true
  foldPivot.add(fold)
  const curl = new THREE.Group()
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, TAPE_W, 24, 1, true), new THREE.MeshLambertMaterial({ color: '#b48650', side: THREE.DoubleSide }))
  roll.rotation.x = Math.PI / 2
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshLambertMaterial({ map: tex(curlCap()), alphaTest: 0.5 }))
  cap.position.z = TAPE_W / 2 + 0.003
  roll.castShadow = cap.castShadow = true
  curl.add(roll, cap)
  tape.add(strip, foldPivot, curl)

  const x0 = -W / 2 // the tape starts at the left-hand edge and rolls back from there
  // `q`: how much of the top has come unstuck (0 to 1)
  function layTape(q) {
    const xp = x0 + q * W
    const len = W / 2 - xp
    strip.visible = len > 0.005
    strip.scale.x = Math.max(0.001, len)
    strip.position.x = xp + len / 2 - W / 2
    tapeMap.repeat.x = len / TAPE_TILE
    tapeMap.offset.x = (xp - x0) / TAPE_TILE
    const r = 0.035 + 0.12 * Math.sqrt(q)
    curl.visible = q > 0.004
    curl.scale.set(r, r, 1)
    curl.position.set(xp - W / 2, r, 0)
    cap.rotation.z = -(q * W) / 0.09 // it rolls as it goes
  }
  layTape(0)

  // The long flaps, pushed up from inside: `amount` radians at `at` along the
  // seam (or all along it, if `at` is null), never where the tape still holds.
  const pushUp = (amount, at, peel) => {
    if (!amount) return 0
    const held = x0 + peel * W
    return (x) => amount * (at == null ? 1 : Math.exp(-(((x - at) / 0.5) ** 2))) * (1 - smoothstep(held - 0.5, held - 0.06, x))
  }
  const layFlaps = (angle) => {
    for (const f of long) f.set(angle)
  }

  // ---- the things that peek out
  const peekers = [
    // show: how much of it comes up over the lifted flaps
    { art: pawArt, height: 0.82, show: 0.52, tilt: 0.1 },
    { art: packArt, height: 0.8, show: 0.6, tilt: -0.28 },
    { art: filmArt, height: 0.9, show: 0.58, tilt: 0.16 },
    { art: snowArt, height: 0.62, show: 0.48, tilt: 0, spin: true },
    { art: eyesArt, height: 0.66, show: 0.5, tilt: 0 }, // (down to just under her eyes)
  ].map((p) => {
    const flat = makeFlat(p.art, { height: p.height })
    own.push(flat.mesh.material.map)
    flat.mesh.visible = false
    flat.mesh.rotation.y = -TURN // facing the camera
    box.add(flat.mesh)
    return { ...p, mesh: flat.mesh }
  })
  const peekOrder = peekers.map((_, i) => i).sort(() => rand() - 0.5)
  let peeked = 0

  const shakeMaps = [tex(shakeLines(1)), tex(shakeLines(2))]
  const halfWide = (W / 2) * Math.cos(TURN) + (D / 2) * Math.abs(Math.sin(TURN))
  const shakes = [-1, 1].map((side) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: shakeMaps[0], transparent: true, depthWrite: false, side: THREE.DoubleSide }))
    mesh.scale.x = -side
    mesh.position.set(side * (halfWide + 0.32), H * 0.62, 0.6)
    mesh.visible = false
    group.add(mesh)
    return mesh
  })

  // the travel stamps that pile up on its side (and then its front) on a long wait
  const SLOTS = [
    [true, 0.56, 1.36], [true, -0.48, 0.82], [true, 0.38, 0.62], [true, 0.84, 1.0], [true, -0.06, 1.2],
    [true, -0.78, 0.3], [true, 0.72, 0.28], [true, 0.06, 0.34], [false, 0.98, 0.44], [false, 0.38, 1.82],
    [false, -1.28, 0.32], [false, 1.4, 1.88],
  ]
  const stamps = []

  // ---- where it stands, and where the shelf waits inside it
  const waiting = { pos: new THREE.Vector3(), s: 0.1 }
  let state = 'waiting' // then 'opening', 'rising', 'done'
  let dropped = 0 // how high the box is off the ground (its drop and its hops): the shelf inside goes with it
  function putShelfAway() {
    shelf.group.position.set(waiting.pos.x, waiting.pos.y + dropped, waiting.pos.z)
    shelf.group.rotation.set(0, TURN, 0)
    shelf.group.scale.setScalar(waiting.s)
  }
  const lift = (y) => {
    dropped = y
    box.position.y = y
    if (state === 'waiting' || state === 'opening') shelf.group.position.y = waiting.pos.y + y
  }

  // ---- what it does while it waits
  // n ticks of the stop-motion clock, without asking for the scene to be drawn again meanwhile
  const ticks = (n) =>
    new Promise((done) => {
      let i = 0
      const stop = stepped.every(1, () => {
        if (++i >= n) {
          stop()
          done()
        }
        return false
      })
    })
  let progress = 0 // how much of the work is done (0 to 1)
  let peel = 0 // how far the tape has rolled back: it catches up with the work a step at a time
  let shown = -1 // the percentage on the note
  let idling = false
  let lastKind = ''

  stepped.every(1, () => {
    if (state !== 'waiting') return false
    const target = Math.min(progress, 0.97)
    if (peel >= target - 1e-4) return false
    peel = Math.min(target, peel + 0.022)
    layTape(peel)
  })

  const RATTLE = [[0.035, 0.05, 0.04, 0.012], [-0.04, 0, -0.035, -0.01], [0.032, 0.06, 0.03, 0.01], [-0.026, 0, -0.024, 0], [0.016, 0.025, 0.014, 0], [0, 0, 0, 0]]
  async function rattle() {
    await stepped.poses(RATTLE, ([x, y, rz, rx], i) => {
      if (state !== 'waiting') return // (it is being opened: whatever it was doing stops)
      box.position.x = x
      lift(y)
      box.rotation.set(rx, 0, rz)
      for (const s of shakes) {
        s.visible = i < RATTLE.length - 1
        s.material.map = shakeMaps[i % 2]
      }
      layFlaps(pushUp([0.07, 0, 0.09, 0.02, 0.04, 0][i], null, peel))
    })
  }

  async function peek() {
    const held = x0 + peel * W
    if (held - x0 < 1.15) return rattle() // not enough of it is untaped yet
    const who = peekers[peekOrder[peeked++ % peekers.length]]
    const at = lerp(x0 + 0.5, held - 0.62, 0.3 + rand() * 0.4)
    const m = who.mesh
    const hidden = H - 0.03 // its top, just under the flaps
    const open = 0.3
    const out = H + FLAP * Math.sin(open) + who.show
    const wiggle = Array.from({ length: 7 }, (_, i) => [open, out + (i % 2 ? 0.015 : 0), who.tilt + (i % 2 ? 0.07 : -0.06)])
    const seq = [[0.1, hidden, 0], [0.24, hidden + 0.1, 0], [open, out - 0.14, who.tilt * 0.5], [open, out, who.tilt], ...wiggle,
      [open, out - 0.22, who.tilt * 0.4], [0.22, hidden + 0.04, 0], [0.08, hidden, 0], [0.02, hidden, 0], [0, hidden, 0]]
    m.position.set(at, hidden - who.height / 2, 0)
    m.visible = true
    await stepped.poses(seq, ([a, top, rz], i) => {
      if (state !== 'waiting') return
      layFlaps(pushUp(a, at, peel))
      m.position.y = top - who.height / 2
      m.rotation.set(0, -TURN, rz + (who.spin ? i * 0.4 : 0))
    })
    if (state !== 'waiting') return
    m.visible = false
    layFlaps(0)
  }

  async function stamp() {
    const n = stamps.length
    const [side, a, b] = SLOTS[n % SLOTS.length]
    const again = n >= SLOTS.length // (all the spots are taken: stamp over the old ones)
    const c = cityStamp(places[n % places.length], n)
    const w = c.width > 520 ? 0.78 : 0.64
    const mesh = decal(tex(c), w, (w * c.height) / c.width)
    const tilt = (rand() - 0.5) * 0.7
    const j = again ? (rand() - 0.5) * 0.3 : 0
    if (side) onSide(mesh, a + j, b + j, tilt)
    else onFront(mesh, a + j, b + j, tilt)
    stamps.push(mesh)
    // it comes down hard, and the box gives a little
    await stepped.poses([[1.5, 0.3, 0], [1.16, 0.75, -0.012], [0.95, 1, -0.022], [1.01, 1, 0.006], [1, 1, 0]], ([k, o, squash]) => {
      if (state !== 'waiting') return
      mesh.scale.setScalar(k)
      mesh.material.opacity = o
      box.scale.set(1 - squash * 0.4, 1 + squash, 1 - squash * 0.4)
    })
  }

  function act() {
    const kinds = ['rattle', 'stamp', 'stamp']
    if (peel > 0.32) kinds.push('peek', 'peek', 'peek')
    // (a new stamp is a new drawing for the graphics card: not while it is busy compiling)
    const options = kinds.filter((k) => k !== lastKind && (k !== 'stamp' || quiet()))
    const kind = options[Math.floor(rand() * options.length)] || 'rattle'
    lastKind = kind
    return kind === 'peek' ? peek() : kind === 'stamp' ? stamp() : rattle()
  }

  async function idle() {
    if (idling || stepped.reduced) return
    idling = true
    await ticks(14)
    while (idling && state === 'waiting') {
      // (while shaders compile, and near the end, the page can stall for a
      // moment: the box keeps still then, so it never freezes mid-move)
      if (progress < CALM && quiet()) await act()
      if (!idling) break
      await ticks(24 + Math.floor(rand() * 25)) // two to four seconds
    }
  }

  // ---- the end: tape off, flaps open, the shelf comes out
  function burst() {
    for (const f of short) f.mesh.visible = true
    const LONG = [0.2, 0.5, 1.35, 2.25, 2.5, 2.3, 2.16]
    const SHORT = [0, 0, 0.12, 0.75, 1.65, 2.38, 2.5, 2.32, 2.2]
    const HOP = [0, 0.03, 0.08, 0.1, 0.04, 0, -0.01, 0, 0]
    return stepped.poses(
      SHORT.map((s, i) => [LONG[Math.min(i, LONG.length - 1)], s, HOP[i]]),
      ([a, b, hop]) => {
        layFlaps(a)
        for (const f of short) f.set(b)
        lift(hop)
      },
    )
  }

  async function open() {
    idling = false
    state = 'opening'
    if (stepped.reduced) return
    // whatever it was doing, it stops where it is
    for (const s of shakes) s.visible = false
    for (const p of peekers) p.mesh.visible = false
    for (const s of stamps) {
      s.scale.setScalar(1)
      s.material.opacity = 1
    }
    box.position.x = 0
    box.rotation.set(0, 0, 0)
    box.scale.set(1, 1, 1)
    lift(0)
    layFlaps(0)
    const from = peel
    // the tape rolls the rest of the way, the bit down the side lets go…
    await stepped.poses([0.55, 1], (k) => {
      layTape(lerp(from, 1, k))
      foldPivot.rotation.z = k * 1.2
    })
    // …and it all rips off, as the flaps burst open
    const flaps = burst()
    await stepped.poses([[0.15, 0.3, 0.3], [0.5, 0.9, 0.8], [1, 1.8, 1.6], [1.6, 2.9, 2.5], [2.3, 4.1, 3.4]], ([x, y, r]) => {
      tape.position.set(W / 2 + x, H + T + y, 0.1 * x)
      tape.rotation.set(0.25 * r, 0, -r)
    })
    tape.visible = false
    await flaps
  }

  // The shelf comes up out of the box and grows to its full size while the
  // camera pulls back. It moves a pose per tick like any paper, but the
  // camera glides every frame, so between its ticks the shelf is carried
  // along with the camera: on screen it holds perfectly still and then steps,
  // rather than shrinking smoothly and jumping back.
  const Ck = new THREE.Matrix4()
  const CkInv = new THREE.Matrix4()
  const Wk = new THREE.Matrix4()
  const M = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pv = new THREE.Vector3()
  const sv = new THREE.Vector3()
  let rising = false
  let pose = null
  let fresh = false

  async function rise(rig, frame) {
    state = 'rising'
    const s0 = waiting.s
    const p0 = waiting.pos.clone()
    p0.y += dropped
    const pop = [0.4, 0.82, 1.1, 1.03].map((k) => ({ x: p0.x, y: p0.y + (H + 0.08) * k, z: p0.z, s: s0, yaw: TURN, sx: 1, sy: 1 }))
    const from = pop[pop.length - 1]
    const G = 16 // ticks of growing: 1.33 s, as long as the camera's glide
    const grow = Array.from({ length: G }, (_, i) => {
      const e = ease((i + 1) / G)
      return { x: lerp(from.x, 0, e), y: lerp(from.y, 0, e), z: lerp(from.z, 0, e), s: s0 * Math.pow(1 / s0, e), yaw: TURN * (1 - e), sx: 1, sy: 1 }
    })
    const land = [[1.014, 0.976], [0.996, 1.012], [1, 1]].map(([sx, sy]) => ({ x: 0, y: 0, z: 0, s: 1, yaw: 0, sx, sy }))
    let glide = null
    rising = true
    await stepped.poses([...pop, ...grow, ...land], (p, i) => {
      if (i >= pop.length && !glide) glide = rig.go(frame, { duration: G / 12, lift: 0 })
      pose = p
      fresh = true
    })
    await glide
    rising = false
    shelf.group.position.set(0, 0, 0)
    shelf.group.rotation.set(0, 0, 0)
    shelf.group.scale.set(1, 1, 1)
    state = 'done'
  }

  return {
    group,
    textures: own,
    get state() {
      return state
    },
    LIFT,

    // Stand it below the bottom of what the shelf view will show (open flaps
    // and all), so the camera leaves it behind as it pulls back.
    place(frame, aspect) {
      const visible = Math.max(frame.h, frame.w / aspect)
      group.position.set(frame.cx, frame.cy - visible / 2 - 0.45 - H - FLAP * 1.05, Z)
      const size = shelf.size()
      waiting.s = Math.min((W - 0.5) / size.w, (H - 0.4) / size.h, (D - 0.5) / size.d)
      // the shelf's middle (half its depth behind its front) over the middle of the box's floor
      const back = new THREE.Vector3(0, 0, -size.d / 2).multiplyScalar(waiting.s).applyAxisAngle(UP, TURN)
      waiting.pos.set(group.position.x - back.x, group.position.y + T + 0.01 + size.bottom * waiting.s, group.position.z - back.z)
      if (state === 'waiting' || state === 'opening') putShelfAway()
    },

    // what the camera frames while it waits
    view(aspect) {
      const tall = aspect < 1
      // (on a tall screen it is framed by its width, with room for its flaps to open)
      return { cx: group.position.x + 0.15, cy: group.position.y + H * 0.66, w: W * (tall ? 2.05 : 2.4), h: (H + 1.1) * 1.9, z: Z }
    },

    // up out of sight, ready to drop in
    hold() {
      if (stepped.reduced) return
      lift(5.2)
      ground.material.opacity = 0
    },

    async dropIn() {
      if (stepped.reduced) return
      const DROP = [[5.2, 0.05, 1, 1], [3.8, 0.045, 1, 1], [2.2, 0.03, 1, 1], [0.75, 0.015, 0.98, 1.02], [0, 0, 1.07, 0.9],
        [0.3, -0.015, 0.98, 1.04], [0.42, -0.01, 0.99, 1.02], [0.26, 0, 1, 1], [0, 0, 1.03, 0.95], [0, 0, 0.995, 1.01], [0, 0, 1, 1]]
      await stepped.poses(DROP, ([y, rz, sxz, sy]) => {
        lift(y)
        box.rotation.z = rz
        box.scale.set(sxz, sy, sxz)
        ground.material.opacity = 0.6 * Math.max(0, 1 - y / 4.5) ** 2
        ground.scale.setScalar(1 + y * 0.12)
      })
    },

    idle,

    // how much of the work is done, 0 to 1
    setProgress(p) {
      progress = Math.max(progress, Math.min(1, p))
      const pct = Math.floor(progress * 100)
      if (pct === shown) return
      // (sending the note to the graphics card while it compiles shaders would
      // stall the page: it is written up next time instead)
      if (pct < 100 && !quiet()) return
      shown = pct
      drawNote(noteCanvas, pct)
      noteMap.needsUpdate = true
      redraw()
    },

    open,
    rise,

    // Called every frame, after the camera has moved: carries the rising
    // shelf along with the camera between its ticks. True if it moved it.
    frame(camera) {
      if (!rising || !pose) return false
      camera.updateMatrixWorld()
      if (fresh) {
        fresh = false
        Ck.copy(camera.matrixWorld)
        CkInv.copy(Ck).invert()
        q.setFromAxisAngle(UP, pose.yaw)
        Wk.compose(pv.set(pose.x, pose.y, pose.z), q, sv.set(pose.s * pose.sx, pose.s * pose.sy, pose.s * pose.sx))
      }
      M.multiplyMatrices(camera.matrixWorld, CkInv).multiply(Wk)
      M.decompose(shelf.group.position, shelf.group.quaternion, shelf.group.scale)
      return true
    },

    // done with: the shelf in its place, the box out of the picture
    finish() {
      state = 'done'
      idling = false
      rising = false
      group.visible = false
      shelf.group.position.set(0, 0, 0)
      shelf.group.rotation.set(0, 0, 0)
      shelf.group.scale.set(1, 1, 1)
    },

    dispose() {
      group.removeFromParent()
      group.traverse((o) => {
        o.geometry?.dispose()
        for (const m of [o.material].flat()) m?.dispose()
      })
      for (const t of own) t.dispose()
    },
  }
}
