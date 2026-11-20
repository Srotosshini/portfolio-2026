// The city scenes on her polaroids: a little illustration of each place, with
// her doodle in it, posed and dressed for it (see data/places.js). Stand-ins,
// like everything drawn in code: her own drawing of a scene replaces it
// (public/drawings/scene-<slug>.png). Drawn on a square sheet, 440 across,
// at any size.
import { canvas, rng } from './paper.js'
import { fibres } from './placeholders.js'
import { oval, curve, puff, eye, blush, darker, lighter } from './soft.js'
import { doodle } from './doodle.js'

export const SIZE = 440

const soft = (ctx, shape, color, o = {}) => puff(ctx, shape, color, { width: 3.5, fuzz: 0.3, glow: 0.35, shade: 0.2, ...o })
function sky(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, SIZE)
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)
}
function stars(ctx, r, n = 30, maxY = 200) {
  ctx.fillStyle = 'rgba(255, 250, 220, 0.9)'
  for (let i = 0; i < n; i++) {
    ctx.beginPath()
    ctx.arc(r() * SIZE, r() * maxY, 0.8 + r() * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
}
function rect(ctx, x, y, w, h, color, o) {
  soft(ctx, curve([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), color, o)
}
function block(ctx, x, w, top, base, color, { lit = null, r } = {}) {
  ctx.fillStyle = color
  ctx.fillRect(x, top, w, base - top)
  ctx.strokeStyle = darker(color, 0.4)
  ctx.lineWidth = 2.5
  ctx.strokeRect(x, top, w, base - top)
  if (!lit) return
  ctx.fillStyle = lit
  for (let y = top + 8; y < base - 8; y += 14) for (let x2 = x + 5; x2 < x + w - 7; x2 += 10) if (!r || r() < 0.7) ctx.fillRect(x2, y, 5, 7)
}
function water(ctx, y, color, glints = 'rgba(255, 255, 255, 0.5)', r) {
  ctx.fillStyle = color
  ctx.fillRect(0, y, SIZE, SIZE - y)
  ctx.strokeStyle = glints
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let i = 0; i < 16; i++) {
    const x = (r ? r() : i / 16) * SIZE
    const yy = y + 10 + ((i * 37) % (SIZE - y - 10))
    ctx.beginPath()
    ctx.moveTo(x, yy)
    ctx.lineTo(x + 14 + i % 3 * 6, yy)
    ctx.stroke()
  }
}
function lantern(ctx, x, y, s = 1, color = '#e2453f') {
  soft(ctx, oval(x, y, 11 * s, 14 * s), color, { glow: 0.7, width: 2.5 })
  ctx.fillStyle = '#f4c95d'
  ctx.fillRect(x - 5 * s, y - 16 * s, 10 * s, 4 * s)
  ctx.fillRect(x - 5 * s, y + 12 * s, 10 * s, 4 * s)
}
function tree(ctx, x, base, h, leaf = '#6fae5f', trunk = '#8a5a3b') {
  soft(ctx, curve([[x - 7, base], [x + 7, base], [x + 5, base - h * 0.55], [x - 5, base - h * 0.55]]), trunk)
  for (const [dx, dy, rr] of [[0, -h * 0.8, h * 0.32], [-h * 0.22, -h * 0.62, h * 0.24], [h * 0.22, -h * 0.62, h * 0.24]]) soft(ctx, oval(x + dx, base + dy, rr, rr * 0.9), leaf)
}
function palm(ctx, x, base, h) {
  ctx.strokeStyle = '#8a5a3b'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, base)
  ctx.quadraticCurveTo(x + 14, base - h * 0.6, x + 6, base - h)
  ctx.stroke()
  for (let a = -2.8; a < 0.2; a += 0.55) soft(ctx, curve([[x + 6, base - h], [x + 6 + Math.cos(a) * 70, base - h + Math.sin(a) * 30 + 24], [x + 6 + Math.cos(a) * 40, base - h + Math.sin(a) * 10 + 8]]), '#5fa35a', { width: 2.5 })
}
// a cat, lying (for the sofa at home): white with a brown patch, or grey
function loafCat(ctx, x, y, s, fur, patch) {
  soft(ctx, oval(x, y + 10 * s, 46 * s, 26 * s), fur, { glow: 0.5 })
  for (const side of [-1, 1]) soft(ctx, curve([[x + side * 30 * s, y - 26 * s], [x + side * 22 * s, y - 52 * s], [x + side * 8 * s, y - 32 * s]]), fur, { width: 2.5 })
  soft(ctx, oval(x, y - 14 * s, 30 * s, 25 * s), fur, { glow: 0.5 })
  if (patch) soft(ctx, oval(x - 4 * s, y - 32 * s, 13 * s, 7 * s), patch, { width: 2 })
  for (const side of [-1, 1]) {
    ctx.strokeStyle = '#3a2a2e'
    ctx.lineWidth = 2.5 * s
    ctx.beginPath()
    ctx.arc(x + side * 11 * s, y - 14 * s, 5 * s, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  }
  blush(ctx, x - 18 * s, y - 6 * s, 7 * s, 4 * s)
  blush(ctx, x + 18 * s, y - 6 * s, 7 * s, 4 * s)
}

// Each place draws its background; it may also say where she stands
// ({ x, y, h }: her middle, the top of her head, her height) and draw what is
// in front of her (`front`).
const PLACES = {
  home(ctx, r) {
    ctx.fillStyle = '#f2dfc4'
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let x = 0; x < SIZE; x += 32) {
      ctx.fillStyle = 'rgba(200, 150, 110, 0.12)'
      ctx.fillRect(x, 0, 14, SIZE)
    }
    rect(ctx, 286, 40, 110, 96, '#9ec7e8')
    ctx.fillStyle = '#f9d58a'
    ctx.beginPath()
    ctx.arc(352, 78, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#7a5236'
    ctx.lineWidth = 6
    ctx.strokeRect(286, 40, 110, 96)
    ctx.beginPath()
    ctx.moveTo(341, 40)
    ctx.lineTo(341, 136)
    ctx.stroke()
    rect(ctx, 48, 58, 70, 54, '#f6efe0')
    soft(ctx, oval(83, 85, 18, 14), '#e48aa3', { width: 2 })
    // the sofa
    soft(ctx, curve([[10, 230], [430, 230], [434, 330], [6, 330]]), '#8aa8de')
    soft(ctx, oval(36, 330, 46, 70), '#7b98d0')
    soft(ctx, oval(404, 330, 46, 70), '#7b98d0')
    soft(ctx, curve([[30, 320], [410, 320], [416, 440], [24, 440]]), '#98b5e6')
    soft(ctx, oval(330, 290, 40, 32, 0.3), '#f3b4c3')
    return {
      her: { x: 216, y: 120, h: 400 },
      front(c) {
        loafCat(c, 92, 352, 1.05, '#fbf8f2', '#a87652')
        loafCat(c, 352, 360, 0.95, '#b9b4b0', null)
      },
    }
  },
  dunes(ctx, r) {
    sky(ctx, ['#7d6bc0', '#f08aa0', '#ffc08a'])
    ctx.fillStyle = '#ffe3a3'
    ctx.beginPath()
    ctx.arc(320, 236, 56, 0, Math.PI * 2)
    ctx.fill()
    for (const [y, c] of [[250, '#e8a76a'], [300, '#d9925a'], [350, '#f0b77a']]) {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.moveTo(0, SIZE)
      ctx.lineTo(0, y + 20)
      ctx.quadraticCurveTo(110, y - 50, 220, y + 10)
      ctx.quadraticCurveTo(330, y + 60, SIZE, y - 10)
      ctx.lineTo(SIZE, SIZE)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(80, 40, 50, 0.6)'
    for (const [x, y] of [[96, 236], [118, 238]]) {
      ctx.beginPath()
      ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  burj(ctx, r) {
    sky(ctx, ['#7ec2f0', '#d6eefc'])
    for (const [x, w, h] of [[20, 50, 120], [80, 40, 90], [340, 46, 140], [392, 40, 100]]) block(ctx, x, w, SIZE - 120 - h, SIZE - 100, '#b9cfe2', { lit: 'rgba(255, 255, 255, 0.6)', r })
    soft(ctx, curve([[300, 340], [366, 340], [348, 200], [338, 110], [333, 40], [328, 110], [318, 200]]), '#cfdcea', { glow: 0.7 })
    ctx.strokeStyle = 'rgba(80, 110, 150, 0.4)'
    ctx.lineWidth = 2
    for (let y = 120; y < 340; y += 26) {
      ctx.beginPath()
      ctx.moveTo(320 - (340 - y) * 0.03, y)
      ctx.lineTo(346 + (340 - y) * 0.03, y)
      ctx.stroke()
    }
    ctx.fillStyle = '#e9d8b4'
    ctx.fillRect(0, 340, SIZE, 100)
    palm(ctx, 60, 360, 110)
  },
  bund(ctx, r) {
    sky(ctx, ['#1c2357', '#3b3f86', '#7a5ea8'])
    stars(ctx, r, 28, 150)
    block(ctx, 250, 40, 150, 300, '#3f4a85', { lit: '#ffd77a', r })
    soft(ctx, curve([[300, 300], [302, 120], [316, 50], [330, 120], [334, 300]]), '#8ea6d6', { glow: 0.5 })
    ctx.strokeStyle = '#d8a6f0'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(120, 300)
    ctx.lineTo(130, 90)
    ctx.stroke()
    for (const [y, rr] of [[230, 26], [150, 15], [112, 7]]) soft(ctx, oval(128, y, rr, rr), '#f26b9f', { glow: 0.8 })
    for (const [x, w, h] of [[0, 46, 90], [46, 40, 60], [160, 50, 80], [350, 46, 110], [396, 44, 70]]) block(ctx, x, w, 300 - h, 300, '#2d3566', { lit: '#ffe08a', r })
    water(ctx, 300, '#24305e', 'rgba(255, 210, 140, 0.5)', r)
    ctx.fillStyle = '#5a4a63'
    ctx.fillRect(0, 392, SIZE, 10)
    for (let x = 10; x < SIZE; x += 34) ctx.fillRect(x, 372, 6, 22)
    ctx.fillRect(0, 368, SIZE, 6)
  },
  forbidden(ctx, r) {
    sky(ctx, ['#8cc4ee', '#e0f0fb'])
    soft(ctx, curve([[0, 140], [440, 140], [440, 176], [0, 176]]), '#e2b54a', { glow: 0.5 })
    ctx.strokeStyle = 'rgba(140, 90, 20, 0.5)'
    ctx.lineWidth = 3
    for (let x = 0; x < SIZE; x += 18) {
      ctx.beginPath()
      ctx.moveTo(x, 144)
      ctx.lineTo(x, 172)
      ctx.stroke()
    }
    ctx.fillStyle = '#b8352f'
    ctx.fillRect(0, 176, SIZE, 264)
    soft(ctx, curve([[150, 250], [290, 250], [290, 440], [150, 440]]), '#8c2420')
    ctx.fillStyle = '#f2c75c'
    for (let y = 268; y < 440; y += 26) for (let x = 166; x < 286; x += 26) {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  terracotta(ctx, r) {
    sky(ctx, ['#b78a62', '#8a6447'])
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 9; i++) {
        const x = 20 + i * 50 + (row % 2) * 25
        const y = 150 + row * 40
        soft(ctx, oval(x, y - 26, 10, 11), '#a77450', { width: 2 })
        soft(ctx, curve([[x - 14, y - 14], [x + 14, y - 14], [x + 16, y + 30], [x - 16, y + 30]]), '#9a6a48', { width: 2 })
      }
    ctx.fillStyle = '#7a5538'
    ctx.fillRect(0, 300, SIZE, 140)
    return {
      her: { x: 290, y: 120, h: 400 },
      front(c) {
        // the warrior beside her, in the same pose
        soft(c, curve([[64, 250], [176, 250], [190, 440], [50, 440]]), '#a87550')
        soft(c, curve([[70, 232], [170, 232], [176, 268], [64, 268]]), '#8f6142')
        soft(c, oval(120, 196, 40, 42), '#b8845c')
        soft(c, oval(120, 154, 26, 16), '#8f6142')
        soft(c, oval(120, 312, 26, 16), '#b8845c')
        c.strokeStyle = '#5e3f2a'
        c.lineWidth = 3
        c.beginPath()
        c.moveTo(106, 214)
        c.lineTo(134, 214)
        c.moveTo(104, 192)
        c.lineTo(114, 192)
        c.moveTo(126, 192)
        c.lineTo(136, 192)
        c.stroke()
      },
    }
  },
  lanterns(ctx, r) {
    sky(ctx, ['#f6d79a', '#f3c38a'])
    ctx.fillStyle = '#9b8a7a'
    ctx.fillRect(0, 300, SIZE, 140)
    for (const x of [30, 410]) {
      soft(ctx, curve([[x - 10, 440], [x + 10, 440], [x + 6, 120], [x - 6, 120]]), '#8a6a4a')
      for (let k = 0; k < 6; k++) soft(ctx, oval(x + (r() - 0.5) * 120, 60 + r() * 120, 50, 36), r() < 0.5 ? '#e6b23c' : '#d99a34', { width: 2 })
    }
    for (const y of [130, 190]) {
      ctx.strokeStyle = '#5a3a2a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, y - 20)
      ctx.quadraticCurveTo(220, y + 20, SIZE, y - 20)
      ctx.stroke()
      for (let x = 30; x < SIZE; x += 52) lantern(ctx, x, y + Math.sin((x / SIZE) * Math.PI) * 18, 0.9)
    }
  },
  moongate(ctx, r) {
    sky(ctx, ['#bfe3e8', '#e8f4ea'])
    ctx.fillStyle = '#f6f3ec'
    ctx.fillRect(0, 120, SIZE, 320)
    soft(ctx, curve([[0, 104], [440, 104], [440, 132], [0, 132]]), '#5e6670')
    ctx.save()
    ctx.beginPath()
    ctx.arc(220, 290, 120, 0, Math.PI * 2)
    ctx.clip()
    sky(ctx, ['#a8d8b0', '#7fbf8a'])
    for (let i = 0; i < 8; i++) tree(ctx, 110 + r() * 220, 360, 120 + r() * 60, r() < 0.5 ? '#5fa35a' : '#7cbd6a')
    ctx.fillStyle = '#7fb6c9'
    ctx.fillRect(100, 360, 240, 60)
    ctx.restore()
    ctx.strokeStyle = '#8f949c'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.arc(220, 290, 120, 0, Math.PI * 2)
    ctx.stroke()
    for (let k = 0; k < 5; k++) {
      ctx.strokeStyle = '#6fae5f'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(400 + k * 8, 440)
      ctx.lineTo(392 + k * 10, 160)
      ctx.stroke()
    }
  },
  pandas(ctx, r) {
    sky(ctx, ['#d7eecf', '#b9dfb0'])
    for (let i = 0; i < 14; i++) {
      const x = r() * SIZE
      ctx.strokeStyle = r() < 0.5 ? '#6fae5f' : '#89c27a'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(x, SIZE)
      ctx.lineTo(x + 10, 0)
      ctx.stroke()
    }
    ctx.fillStyle = '#9ccf8a'
    ctx.fillRect(0, 310, SIZE, 130)
    for (const [x, s] of [[70, 0.8], [372, 0.9]]) {
      soft(ctx, oval(x, 300, 46 * s, 44 * s), '#f8f6f0')
      soft(ctx, oval(x, 246, 34 * s, 30 * s), '#f8f6f0')
      for (const side of [-1, 1]) {
        soft(ctx, oval(x + side * 26 * s, 222, 11 * s, 10 * s), '#2a2a30', { width: 2 })
        soft(ctx, oval(x + side * 12 * s, 244, 9 * s, 11 * s, side * 0.4), '#2a2a30', { width: 2 })
        soft(ctx, oval(x + side * 36 * s, 300, 14 * s, 22 * s), '#2a2a30', { width: 2 })
      }
    }
  },
  hongyadong(ctx, r) {
    sky(ctx, ['#141a3e', '#2b2d63'])
    stars(ctx, r, 20, 120)
    for (let tier = 0; tier < 6; tier++) {
      const y = 290 - tier * 34
      const w = 330 - tier * 30
      const x = 220 - w / 2
      ctx.fillStyle = '#3a2a2a'
      ctx.fillRect(x, y - 30, w, 30)
      ctx.fillStyle = '#ffcf6b'
      for (let wx = x + 6; wx < x + w - 10; wx += 14) ctx.fillRect(wx, y - 22, 8, 12)
      ctx.fillStyle = '#5a3a2e'
      ctx.beginPath()
      ctx.moveTo(x - 14, y - 30)
      ctx.lineTo(x + w + 14, y - 30)
      ctx.lineTo(x + w - 10, y - 40)
      ctx.lineTo(x + 10, y - 40)
      ctx.fill()
    }
    water(ctx, 300, '#1e2550', 'rgba(255, 200, 110, 0.5)', r)
    return {
      front(c) {
        soft(c, oval(90, 420, 80, 30), '#3a3a42')
        soft(c, oval(90, 404, 70, 18), '#d8432f', { glow: 0.5 })
        c.strokeStyle = 'rgba(255, 255, 255, 0.55)'
        c.lineWidth = 6
        c.lineCap = 'round'
        for (const x of [60, 90, 120]) {
          c.beginPath()
          c.moveTo(x, 380)
          c.bezierCurveTo(x - 20, 340, x + 20, 320, x, 280)
          c.stroke()
        }
      },
    }
  },
  canton(ctx, r) {
    sky(ctx, ['#2e3a78', '#9a6fb0', '#f3a6a0'])
    soft(ctx, curve([[296, 330], [352, 330], [334, 210], [348, 90], [338, 30], [312, 30], [300, 90], [316, 210]]), '#cf7ad8', { glow: 0.7 })
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    for (let y = 50; y < 330; y += 20) {
      ctx.beginPath()
      ctx.moveTo(306, y)
      ctx.lineTo(342, y + 14)
      ctx.stroke()
    }
    for (const [x, w, h] of [[0, 60, 70], [60, 50, 50], [370, 70, 80]]) block(ctx, x, w, 330 - h, 330, '#3a3f78', { lit: '#ffd98a', r })
    water(ctx, 330, '#2a3168', 'rgba(255, 190, 220, 0.5)', r)
  },
  lijiang(ctx, r) {
    sky(ctx, ['#7fbcec', '#d5ecf8'])
    soft(ctx, curve([[0, 260], [120, 120], [180, 150], [250, 70], [330, 150], [440, 200], [440, 300], [0, 300]]), '#8aa0b8')
    soft(ctx, curve([[180, 150], [250, 70], [320, 146], [288, 136], [262, 150], [232, 132], [206, 156]]), '#f8fbff', { width: 2.5 })
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 5; i++) {
        const x = i * 100 - 20 + row * 40
        const y = 300 + row * 46
        soft(ctx, curve([[x, y], [x + 50, y - 30], [x + 100, y], [x + 92, y + 20], [x + 8, y + 20]]), '#5e6670', { width: 2.5 })
        ctx.fillStyle = '#c9a272'
        ctx.fillRect(x + 12, y + 20, 76, 30)
      }
    lantern(ctx, 60, 280, 0.8)
    lantern(ctx, 400, 300, 0.8)
  },
  beach(ctx, r) {
    sky(ctx, ['#5fb4ee', '#bfe6fb'])
    ctx.fillStyle = '#fff2b0'
    ctx.beginPath()
    ctx.arc(70, 70, 30, 0, Math.PI * 2)
    ctx.fill()
    water(ctx, 230, '#3fa3d8', 'rgba(255, 255, 255, 0.7)', r)
    ctx.fillStyle = '#f5dc9e'
    ctx.beginPath()
    ctx.moveTo(0, 300)
    ctx.quadraticCurveTo(220, 270, SIZE, 310)
    ctx.lineTo(SIZE, SIZE)
    ctx.lineTo(0, SIZE)
    ctx.fill()
    palm(ctx, 390, 330, 200)
  },
  ice(ctx, r) {
    sky(ctx, ['#0f1840', '#2a2f6a'])
    stars(ctx, r, 34, 160)
    for (const [x, w, h, c] of [[40, 90, 170, '#7fd3f0'], [150, 70, 210, '#a7a2f0'], [300, 100, 180, '#f0a2d8']]) {
      soft(ctx, curve([[x, 330], [x + w, 330], [x + w, 330 - h * 0.6], [x + w / 2, 330 - h], [x, 330 - h * 0.6]]), c, { glow: 0.9, line: 'rgba(255, 255, 255, 0.8)' })
    }
    ctx.fillStyle = '#eef4ff'
    ctx.fillRect(0, 330, SIZE, 110)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    for (let i = 0; i < 40; i++) {
      ctx.beginPath()
      ctx.arc(r() * SIZE, r() * 330, 1.5 + r() * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  pillars(ctx, r) {
    sky(ctx, ['#d4eaf1', '#eef5ee'])
    const pillar = (x, base, w, h, color) => {
      soft(ctx, curve([[x - w / 2, base], [x - w / 2 - 4, base - h * 0.5], [x - w * 0.42, base - h], [x, base - h - 12], [x + w * 0.42, base - h], [x + w / 2 + 4, base - h * 0.5], [x + w / 2, base]]), color)
      for (let i = 0; i < 4; i++) soft(ctx, oval(x - w / 2 + 6 + (i * w) / 3.4, base - h - 10, 13, 11), i % 2 ? '#4f8a4a' : '#3f7a45', { width: 2 })
    }
    pillar(70, 380, 46, 236, '#cfc6b2')
    pillar(372, 380, 52, 270, '#cdc3ad')
    pillar(250, 380, 42, 200, '#d1c9b6')
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.ellipse(r() * SIZE, 270 + r() * 60, 70, 16, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    pillar(150, 450, 66, 330, '#b6a283')
    pillar(318, 450, 58, 280, '#ad9a7c')
  },
  shibuya(ctx, r) {
    sky(ctx, ['#161a3c', '#33285e'])
    const signs = ['#ff5aa8', '#58c8ff', '#ffd23f', '#62f28a', '#ff8a3d']
    for (const [x, w, h] of [[0, 90, 250], [92, 70, 200], [300, 80, 260], [382, 58, 220]]) {
      block(ctx, x, w, 330 - h, 330, '#2a2d55', { lit: 'rgba(255, 230, 160, 0.7)', r })
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = signs[Math.floor(r() * signs.length)]
        ctx.globalAlpha = 0.85
        ctx.fillRect(x + 8, 330 - h + 20 + k * 60, w - 16, 26)
        ctx.globalAlpha = 1
      }
    }
    ctx.fillStyle = '#3a3a48'
    ctx.fillRect(0, 330, SIZE, 110)
    ctx.fillStyle = '#f2f2f2'
    for (let x = -20; x < SIZE; x += 44) {
      ctx.beginPath()
      ctx.moveTo(x, SIZE)
      ctx.lineTo(x + 24, SIZE)
      ctx.lineTo(x + 54, 340)
      ctx.lineTo(x + 38, 340)
      ctx.fill()
    }
  },
  gion(ctx, r) {
    sky(ctx, ['#f3c6a6', '#f7e2c6'])
    soft(ctx, curve([[330, 160], [350, 60], [370, 160]]), '#5e4a40')
    for (let t = 0; t < 4; t++) soft(ctx, curve([[318 + t * 4, 150 - t * 24], [382 - t * 4, 150 - t * 24], [372 - t * 4, 140 - t * 24], [328 + t * 4, 140 - t * 24]]), '#3f3530', { width: 2 })
    for (const x of [-10, 150, 300]) {
      soft(ctx, curve([[x, 200], [x + 160, 200], [x + 150, 182], [x + 10, 182]]), '#3f3530')
      ctx.fillStyle = '#6b4a34'
      ctx.fillRect(x + 8, 200, 144, 140)
      ctx.strokeStyle = '#3f2a1e'
      ctx.lineWidth = 3
      for (let lx = x + 14; lx < x + 150; lx += 9) {
        ctx.beginPath()
        ctx.moveTo(lx, 210)
        ctx.lineTo(lx, 300)
        ctx.stroke()
      }
      lantern(ctx, x + 80, 236, 0.9, '#f6efe0')
    }
    ctx.fillStyle = '#a89c90'
    ctx.fillRect(0, 340, SIZE, 100)
  },
  dotonbori(ctx, r) {
    sky(ctx, ['#1a1a40', '#3b2a5e'])
    const signs = ['#ff5a6a', '#ffd23f', '#58c8ff', '#ff8ad0', '#62f28a']
    for (let x = 0; x < SIZE; x += 62) {
      block(ctx, x, 60, 120 + r() * 60, 300, '#2b2a50', { lit: 'rgba(255, 220, 150, 0.6)', r })
      ctx.fillStyle = signs[Math.floor(r() * signs.length)]
      ctx.fillRect(x + 14, 90 + r() * 60, 30, 110)
    }
    water(ctx, 300, '#232a5c', 'rgba(255, 150, 200, 0.6)', r)
    ctx.fillStyle = '#4a3a4a'
    ctx.fillRect(0, 296, SIZE, 10)
  },
  deer(ctx, r) {
    sky(ctx, ['#bfe2f2', '#e6f4e8'])
    for (let i = 0; i < 6; i++) tree(ctx, 30 + i * 80, 280, 140 + r() * 40, i % 2 ? '#6fae5f' : '#5f9d55')
    ctx.fillStyle = '#9fd08a'
    ctx.fillRect(0, 280, SIZE, 160)
    return {
      her: { x: 160, y: 130, h: 400, pose: 'bow' },
      front(c) {
        // the deer, bowing back
        const fur = '#c48a55'
        for (const x of [318, 352, 384, 410]) soft(c, curve([[x - 6, 440], [x + 6, 440], [x + 5, 360], [x - 5, 360]]), fur)
        soft(c, oval(364, 340, 66, 40), fur)
        c.save()
        c.translate(300, 330)
        c.rotate(0.7)
        soft(c, curve([[-14, -10], [14, -10], [10, 40], [-10, 40]]), fur)
        soft(c, oval(0, 56, 22, 18), fur)
        soft(c, oval(-6, 70, 7, 6), '#3a2a2e', { width: 2 })
        c.restore()
        c.fillStyle = '#f6efe0'
        for (const [x, y] of [[340, 330], [370, 322], [395, 336]]) {
          c.beginPath()
          c.arc(x, y, 5, 0, Math.PI * 2)
          c.fill()
        }
      },
    }
  },
  petronas(ctx, r) {
    sky(ctx, ['#6fb6ec', '#d4ecfa'])
    for (const x of [280, 360]) {
      soft(ctx, curve([[x - 26, 360], [x + 26, 360], [x + 20, 120], [x + 8, 80], [x, 30], [x - 8, 80], [x - 20, 120]]), '#d4dde8', { glow: 0.8 })
      ctx.strokeStyle = 'rgba(80, 100, 130, 0.45)'
      ctx.lineWidth = 2
      for (let y = 100; y < 360; y += 18) {
        ctx.beginPath()
        ctx.moveTo(x - 22, y)
        ctx.lineTo(x + 22, y)
        ctx.stroke()
      }
    }
    soft(ctx, curve([[300, 200], [340, 200], [340, 212], [300, 212]]), '#aebbcc', { width: 2.5 })
    ctx.fillStyle = '#9fd08a'
    ctx.fillRect(0, 360, SIZE, 80)
    palm(ctx, 40, 380, 120)
  },
  catstatue(ctx, r) {
    sky(ctx, ['#86c4ee', '#e3f2f8'])
    water(ctx, 300, '#5fa8cf', 'rgba(255, 255, 255, 0.6)', r)
    return {
      her: { x: 150, y: 120, h: 400 },
      front(c) {
        // the giant cat statue, sitting on its plinth
        rect(c, 250, 380, 170, 60, '#c9c2b2')
        soft(c, oval(334, 300, 70, 90), '#fbf8f2', { glow: 0.5 })
        for (const side of [-1, 1]) soft(c, curve([[334 + side * 46, 170], [334 + side * 40, 120], [334 + side * 12, 160]]), '#fbf8f2', { width: 3 })
        soft(c, oval(334, 196, 58, 50), '#fbf8f2', { glow: 0.5 })
        for (const side of [-1, 1]) {
          eye(c, 334 + side * 22, 192, 8)
          blush(c, 334 + side * 36, 212, 10, 6)
        }
        soft(c, curve([[328, 208], [340, 208], [334, 216]]), '#ef9aa8', { width: 2, fuzz: 0 })
        soft(c, oval(334, 252, 30, 12), '#e2453f', { width: 2.5 })
      },
    }
  },
}

// A scene, drawn onto `target` (any size): the place, then her, then what is in front of her.
export function scene(target, where, her, seed = 1) {
  const ctx = target.getContext('2d')
  const k = target.width / SIZE
  ctx.save()
  ctx.scale(k, k)
  const r = rng(seed * 59 + where.length)
  const placed = (PLACES[where] || PLACES.pillars)(ctx, r) || {}
  const at = placed.her || { x: 220, y: 120, h: 400 }
  if (her) {
    const h = at.h
    const w = (h * her.width) / her.height
    ctx.drawImage(her, at.x - w / 2, at.y - h * 0.06, w, h)
  }
  placed.front?.(ctx)
  fibres(ctx)
  ctx.restore()
}

// her, dressed and posed for one place (a drawing of her own replaces the room's, not these)
export function herFor(place, seed = 1) {
  const s = place.scene || {}
  return doodle(seed, { pose: s.pose || 'peace', outfit: s.outfit || 'dress', prop: s.prop || null, makeup: s.makeup || null })
}

// a city's view through the window: the place without her, by day or by night
export function view(target, where, night, seed = 1) {
  scene(target, where, null, seed)
  if (!night) return
  const ctx = target.getContext('2d')
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = '#4a4f8a'
  ctx.fillRect(0, 0, target.width, target.height)
  ctx.restore()
}
