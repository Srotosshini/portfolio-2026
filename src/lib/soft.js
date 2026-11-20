// Soft drawing: the toolkit behind the plush toys and the About room. Shapes
// (ellipses, smooth curves through points) filled and shaded round like
// something puffy, felt-fuzzy, outlined in a darker thread of their own
// colour; shiny button eyes, rosy cheeks, stitches, glossy buttons.
import { rng } from './paper.js'

// ---- colour
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export const mixHex = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')
export const darker = (h, t = 0.45) => mixHex(h, '#1c1418', t)
export const lighter = (h, t = 0.4) => mixHex(h, '#ffffff', t)

// ---- shapes: an ellipse, or a smooth closed curve through points
export const oval = (cx, cy, rx, ry, rot = 0) => ({
  path(ctx) {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
  },
  box: { x: cx - Math.max(rx, ry), y: cy - Math.max(rx, ry), w: 2 * Math.max(rx, ry), h: 2 * Math.max(rx, ry) },
})
export const curve = (pts) => {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return {
    path(ctx) {
      const n = pts.length
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n]
        const p1 = pts[i]
        const p2 = pts[(i + 1) % n]
        const p3 = pts[(i + 2) % n]
        ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1])
      }
      ctx.closePath()
    },
    box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) },
  }
}

// A soft, stuffed shape: filled, shaded round like something puffy (light from
// the upper left), felt-fuzzy, and outlined in a darker thread of its own colour.
export function puff(ctx, shape, color, { glow = 0.45, shade = 0.3, line, width = 4.5, fuzz = 1, seed = 1 } = {}) {
  const { x, y, w, h } = shape.box
  ctx.save()
  shape.path(ctx)
  ctx.fillStyle = color
  ctx.fill()
  ctx.clip()
  const g = ctx.createRadialGradient(x + w * 0.34, y + h * 0.28, Math.min(w, h) * 0.04, x + w * 0.52, y + h * 0.56, Math.max(w, h) * 0.74)
  g.addColorStop(0, `rgba(255, 255, 255, ${glow})`)
  g.addColorStop(0.42, 'rgba(255, 255, 255, 0)')
  g.addColorStop(1, `rgba(45, 20, 35, ${shade})`)
  ctx.fillStyle = g
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12)
  if (fuzz) {
    const r = rng(seed * 131 + Math.round(x + y))
    const n = Math.round(((w * h) / 150) * fuzz)
    ctx.lineCap = 'round'
    for (let i = 0; i < n; i++) {
      const px = x + r() * w
      const py = y + r() * h
      const a = r() * Math.PI
      const l = 2 + r() * 4
      ctx.strokeStyle = r() < 0.5 ? `rgba(255, 255, 255, ${0.08 + r() * 0.14})` : `rgba(40, 20, 30, ${0.06 + r() * 0.1})`
      ctx.lineWidth = 1 + r()
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l)
      ctx.stroke()
    }
  }
  ctx.restore()
  if (width) {
    shape.path(ctx)
    ctx.lineJoin = 'round'
    ctx.lineWidth = width
    ctx.strokeStyle = line ?? darker(color, 0.5)
    ctx.stroke()
  }
}
// running stitches along a seam
export function stitch(ctx, draw, color = 'rgba(255, 248, 236, 0.85)', width = 2.6) {
  ctx.save()
  ctx.setLineDash([7, 6])
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  draw(ctx)
  ctx.stroke()
  ctx.restore()
}
// a shiny black button eye
export function eye(ctx, x, y, r) {
  ctx.save()
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.1)
  g.addColorStop(0, '#514856')
  g.addColorStop(1, '#120e16')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(x - r * 0.3, y - r * 0.36, r * 0.34, r * 0.28, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.arc(x + r * 0.34, y + r * 0.34, r * 0.14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
export function blush(ctx, x, y, rx = 24, ry = 14, color = '255, 140, 160') {
  const g = ctx.createRadialGradient(x, y, 1, x, y, rx)
  g.addColorStop(0, `rgba(${color}, 0.62)`)
  g.addColorStop(1, `rgba(${color}, 0)`)
  ctx.save()
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
// a little "w" of a mouth
export function mouth(ctx, x, y, w, color = '#4a2a2e', width = 3.5) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x - w / 2, y, w / 2, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.moveTo(x + w, y)
  ctx.arc(x + w / 2, y, w / 2, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.stroke()
  ctx.restore()
}
// a thick, soft tail along a path (the chameleon's curl, the kitten's)
export function tail(ctx, pts, color, width) {
  const line = (w, c) => {
    ctx.save()
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.strokeStyle = c
    ctx.lineWidth = w
    ctx.beginPath()
    // a smooth curve through the points
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1])
    }
    ctx.stroke()
    ctx.restore()
  }
  line(width + 9, darker(color, 0.5))
  line(width, color)
  ctx.save()
  ctx.translate(-width * 0.12, -width * 0.14)
  line(width * 0.3, 'rgba(255, 255, 255, 0.22)')
  ctx.restore()
}


// ---- for things made of painted card
export const LINE = '#2f5752'
export const KRAFT = '#c69b6d'

// rounded rectangle, filled and outlined
export function panel(ctx, x, y, w, h, r, fill, { line = LINE, width = 5, glow = 0.32 } = {}) {
  const shape = {
    path(c) {
      c.beginPath()
      c.roundRect(x, y, w, h, r)
    },
    box: { x, y, w, h },
  }
  puff(ctx, shape, fill, { line, width, glow, shade: 0.18, fuzz: 0.25 })
}
// a strip of card's cut edge: kraft, with the corrugation's wave inside
export function cutEdge(ctx, x, y, w, h) {
  ctx.save()
  ctx.fillStyle = KRAFT
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = 'rgba(90, 60, 30, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let px = x; px <= x + w; px += 4) ctx.lineTo(px, y + h / 2 + Math.sin(px / 5) * (h * 0.32))
  ctx.stroke()
  ctx.restore()
}
// a glossy round button
export function gloss(ctx, x, y, r, color) {
  puff(ctx, oval(x, y + r * 0.18, r * 1.12, r * 0.9), darker(color, 0.35), { width: 4, line: LINE, fuzz: 0, glow: 0.1 })
  puff(ctx, oval(x, y, r, r * 0.82), color, { width: 4, line: LINE, fuzz: 0, glow: 0.6 })
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.beginPath()
  ctx.ellipse(x - r * 0.35, y - r * 0.3, r * 0.3, r * 0.16, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
export const heartShape = (x, y, s) =>
  curve([[x, y + s * 0.95], [x - s * 0.95, y + s * 0.1], [x - s * 0.7, y - s * 0.6], [x - s * 0.15, y - s * 0.55], [x, y - s * 0.2], [x + s * 0.15, y - s * 0.55], [x + s * 0.7, y - s * 0.6], [x + s * 0.95, y + s * 0.1]])
export const starShape = (x, y, R) =>
  curve(
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 ? R * 0.48 : R
      return [x + Math.cos(a) * r, y + Math.sin(a) * r]
    }),
  )

