// Stand-in sketches for the paper gallery, until her own are in
// public/sketches/<slug>/. `standIn` runs one live in an opened painting,
// leaning toward the pointer; `preview` is a small one for the wall, stepped
// on the 12 fps clock. Like everything in placeholders.js, none of this is
// meant to survive to the finished site.
const W = 800
const H = 600
const NIGHT = '#0d0d12'

// a small copy for a painting on the wall: call step(t) to draw the next frame
export function preview(index, tint, width = 240, height = 180) {
  const node = document.createElement('canvas')
  node.width = width
  node.height = height
  const ctx = node.getContext('2d')
  ctx.setTransform(width / W, 0, 0, height / H, 0, 0) // the sketches draw at 800 × 600
  ctx.fillStyle = NIGHT
  ctx.fillRect(0, 0, W, H)
  const frame = SKETCHES[index % SKETCHES.length](ctx, tint, { x: W / 2, y: H / 2, over: false })
  return { node, step: frame }
}

// the code of a stand-in, for the back of its painting until her own code is there
export const standInCode = (index) => `// a stand-in, until the real sketch is in its folder\nconst draw = ${SKETCHES[index % SKETCHES.length].toString()}\n`

export function standIn(index, tint) {
  const node = document.createElement('canvas')
  node.width = W
  node.height = H
  const ctx = node.getContext('2d')
  const pointer = { x: W / 2, y: H / 2, over: false }
  node.addEventListener('pointermove', (e) => {
    const r = node.getBoundingClientRect()
    pointer.x = ((e.clientX - r.left) / r.width) * W
    pointer.y = ((e.clientY - r.top) / r.height) * H
    pointer.over = true
  })
  node.addEventListener('pointerleave', () => (pointer.over = false))
  ctx.fillStyle = NIGHT
  ctx.fillRect(0, 0, W, H)
  const frame = SKETCHES[index % SKETCHES.length](ctx, tint, pointer)
  let running = true
  const loop = (now) => {
    if (!running) return
    frame(now / 1000)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  return {
    node,
    stop() {
      running = false
    },
  }
}

const centre = (p) => (p.over ? [p.x, p.y] : [W / 2, H / 2])

const SKETCHES = [
  // dust in a current, gathering round the pointer
  (ctx, tint, p) => {
    const dots = Array.from({ length: 900 }, () => ({ x: Math.random() * W, y: Math.random() * H }))
    return (t) => {
      ctx.fillStyle = 'rgba(13, 13, 18, 0.12)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = tint
      for (const d of dots) {
        const a = Math.sin(d.x * 0.006 + t * 0.3) * 2 + Math.cos(d.y * 0.007 - t * 0.2) * 2
        let vx = Math.cos(a)
        let vy = Math.sin(a)
        if (p.over) {
          const dx = p.x - d.x
          const dy = p.y - d.y
          const dd = Math.hypot(dx, dy) + 1
          if (dd < 170) {
            vx += (dx / dd) * 1.4
            vy += (dy / dd) * 1.4
          }
        }
        d.x += vx * 1.6
        d.y += vy * 1.6
        if (d.x < 0 || d.x > W || d.y < 0 || d.y > H) {
          d.x = Math.random() * W
          d.y = Math.random() * H
        }
        ctx.fillRect(d.x, d.y, 2, 2)
      }
    }
  },

  // rings on looping paths, leaving trails
  (ctx, tint, p) => (t) => {
    ctx.fillStyle = 'rgba(13, 13, 18, 0.15)'
    ctx.fillRect(0, 0, W, H)
    const [cx, cy] = centre(p)
    ctx.strokeStyle = tint
    ctx.lineWidth = 2
    for (let i = 0; i < 9; i++) {
      const r = 40 + i * 26
      const a = t * (0.4 + i * 0.13) + i
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a * 3) * r, cy + Math.sin(a * 2) * r * 0.7, 5 + i, 0, Math.PI * 2)
      ctx.stroke()
    }
  },

  // a field of squares turning in a wave that starts from the pointer
  (ctx, tint, p) => (t) => {
    ctx.fillStyle = NIGHT
    ctx.fillRect(0, 0, W, H)
    const [cx, cy] = centre(p)
    ctx.strokeStyle = tint
    ctx.lineWidth = 2
    for (let y = 45; y < H; y += 58) {
      for (let x = 45; x < W; x += 58) {
        const d = Math.hypot(x - cx, y - cy)
        const s = 8 + 18 * (0.5 + 0.5 * Math.sin(t * 2 - d * 0.02))
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t * 0.5 + d * 0.01)
        ctx.strokeRect(-s / 2, -s / 2, s, s)
        ctx.restore()
      }
    }
  },

  // ridgelines that rise wherever the pointer is
  (ctx, tint, p) => (t) => {
    ctx.fillStyle = NIGHT
    ctx.fillRect(0, 0, W, H)
    const [cx] = centre(p)
    ctx.strokeStyle = tint
    ctx.lineWidth = 1.6
    for (let row = 0; row < 26; row++) {
      const y0 = 100 + row * 18
      ctx.beginPath()
      ctx.moveTo(60, y0)
      for (let x = 60; x <= W - 60; x += 8) {
        const near = 1 - Math.min(1, Math.abs(x - cx) / 260)
        const h = near * near * (34 + 30 * Math.sin(x * 0.05 + row * 1.7 + t * 1.5) * Math.sin(x * 0.013 - t + row))
        ctx.lineTo(x, y0 - Math.abs(h))
      }
      ctx.lineTo(W - 60, y0)
      ctx.fillStyle = NIGHT // each line hides the ones behind it
      ctx.fill()
      ctx.stroke()
    }
  },

  // drifting stars that join up when they pass close, the pointer among them
  (ctx, tint, p) => {
    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }))
    return () => {
      ctx.fillStyle = NIGHT
      ctx.fillRect(0, 0, W, H)
      for (const s of stars) {
        s.x = (s.x + s.vx + W) % W
        s.y = (s.y + s.vy + H) % H
      }
      const all = p.over ? [...stars, { x: p.x, y: p.y }] : stars
      ctx.strokeStyle = tint
      ctx.lineWidth = 1.2
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const d = Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y)
          if (d > 115) continue
          ctx.globalAlpha = 1 - d / 115
          ctx.beginPath()
          ctx.moveTo(all[i].x, all[i].y)
          ctx.lineTo(all[j].x, all[j].y)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff6dc'
      for (const s of stars) ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3)
    }
  },
]
