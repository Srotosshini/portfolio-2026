// Her doodle: a little drawing of her, cute and simple, not a likeness. Brown
// skin; long dark hair past her shoulders, with two long strands of bangs
// framing her face; dressed in blue, her favourite colour. One figure for
// everywhere she appears (standing in her room, and in every polaroid), in
// any of a few poses, outfits and props:
//   pose:   'stand' (hands together), 'peace', 'wave', 'hold' (something held
//           in front), 'hold-up' (a stick held up), 'sit', 'bow', 'warrior'
//   outfit: 'dress', 'scarf', 'hanfu', 'kimono', 'coat', 'beach'
//   prop:   'drink', 'tanghulu', 'umbrella', 'panda', 'dimsum', 'takoyaki', 'coconut'
//   makeup: 'douyin' (a lighter face, rosy blush, glossy lips)
// Her own drawing replaces the room's figure: public/drawings/doodle.png (and
// doodle-<pose>.png for the others, see the README).
import { canvas } from './paper.js'
import { fibres } from './placeholders.js'
import { oval, curve, puff, eye, blush, darker, lighter } from './soft.js'

const NAVY = '#1d2a5b'
export const HER = { skin: '#9b6343', light: '#bb876a', hair: '#24170f', blue: '#3f72d6' }

const OUTFITS = {
  dress: { color: HER.blue, sleeve: 'short', hem: 600 },
  scarf: { color: HER.blue, sleeve: 'short', hem: 600, scarf: '#f39ab4' },
  beach: { color: '#f7d36d', sleeve: 'none', hem: 590, glasses: true, flowers: '#ffffff' },
  coat: { color: '#8fb3e6', sleeve: 'long', hem: 560, scarf: '#e0505f', muffs: true, quilted: true },
  hanfu: { color: '#f5b8c6', sleeve: 'wide', hem: 712, robe: true, sash: '#5b7fd6', collar: '#ffffff' },
  kimono: { color: HER.blue, sleeve: 'wide', hem: 712, robe: true, sash: '#e25563', collar: '#f3e6cf', flowers: '#ffffff' },
}

export function doodle(seed = 1, { pose = 'peace', outfit = 'dress', prop = null, makeup = null } = {}) {
  const c = canvas(420, 780)
  const ctx = c.getContext('2d')
  const look = OUTFITS[outfit] || OUTFITS.dress
  const face = makeup === 'douyin' ? HER.light : HER.skin
  const line = { line: NAVY, seed }
  const skin = (shape, o = {}) => puff(ctx, shape, HER.skin, { ...line, ...o })
  const cloth = (shape, color = look.color, o = {}) => puff(ctx, shape, color, { ...line, ...o })
  const sit = pose === 'sit'
  const dy = sit ? 70 : 0 // sitting, everything above the knees comes down
  // bowing (to the right): everything above her knees tips over
  const tilt = () => {
    if (pose !== 'bow') return
    ctx.translate(184, 600)
    ctx.rotate(0.3)
    ctx.translate(-210, -600)
  }

  // the umbrella's canopy goes behind her
  if (prop === 'umbrella') {
    cloth(curve([[150, 92], [222, 22], [330, 6], [404, 60], [412, 118], [306, 84], [210, 104]]), '#e86a7a')
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 3
    for (const [x, y] of [[176, 92], [240, 60], [300, 44], [360, 58]]) {
      ctx.beginPath()
      ctx.moveTo(316, 30)
      ctx.lineTo(x, y + 30)
      ctx.stroke()
    }
    ctx.restore()
  }

  ctx.save()
  ctx.translate(0, dy)
  tilt()
  // her hair, behind her, down past her shoulders
  puff(ctx, curve([[116, 206], [122, 128], [160, 80], [210, 66], [260, 80], [298, 128], [304, 206], [312, 300], [320, 400], [306, 474], [272, 486], [262, 432], [158, 432], [148, 486], [114, 474], [100, 400], [108, 300]]), HER.hair, { ...line, glow: 0.22 })
  ctx.restore()

  // ---- legs, then the clothes
  if (!look.robe) {
    for (const x of [180, 240]) {
      if (sit) {
        skin(curve([[x - 13, 600], [x + 13, 600], [x + 12, 690], [x - 12, 690]]))
        cloth(curve([[x - 20, 686], [x + 18, 686], [x + 24, 708], [x - 26, 708]]), '#283a74')
      } else {
        skin(curve([[x - 12, 580], [x + 12, 580], [x + 11, 706], [x - 11, 706]]))
        cloth(curve([[x - 20, 700], [x + 18, 700], [x + 24, 726], [x - 26, 726]]), look.robe ? '#2a2a33' : '#283a74')
      }
    }
  }
  ctx.save()
  ctx.translate(0, dy)
  tilt()
  skin(curve([[196, 262], [224, 262], [224, 312], [196, 312]]), { width: 3.5 })
  ctx.restore()

  ctx.save()
  ctx.translate(0, dy)
  tilt()
  if (look.robe) {
    // a long robe to her ankles, its hem flaring; shoes peeking out under it
    for (const x of [178, 242]) cloth(oval(x, 716 - dy, 26, 12), '#2a2a33')
    cloth(curve([[160, 304], [260, 304], [300, 520], [326, 706 - dy], [94, 706 - dy], [120, 520]]))
    if (look.flowers) dots(ctx, 120, 330, 200, 360 - dy, look.flowers)
    cloth(curve([[166, 300], [254, 300], [214, 392], [206, 392]]), look.collar, { width: 3.5 }) // the crossed collar
    cloth(curve([[142, 404], [278, 404], [282, 444], [138, 444]]), look.sash, { width: 4 })
  } else {
    const hem = look.hem
    cloth(curve([[158, 304], [262, 304], [306, hem], [114, hem]]))
    if (look.quilted) quilt(ctx, 130, 330, 160, hem - 330)
    if (look.flowers) dots(ctx, 130, 340, 160, hem - 350, look.flowers)
    if (look.sleeve === 'short') {
      cloth(oval(150, 330, 28, 24))
      cloth(oval(270, 330, 28, 24))
    }
    if (outfit !== 'coat') {
      puff(ctx, oval(194, 310, 18, 11), '#ffffff', { ...line, width: 3.5 })
      puff(ctx, oval(226, 310, 18, 11), '#ffffff', { ...line, width: 3.5 })
    }
  }
  ctx.restore()

  // ---- arms (and whatever they hold)
  ctx.save()
  ctx.translate(0, dy)
  tilt()
  const sleeveColor = look.sleeve === 'long' || look.sleeve === 'wide' ? look.color : null
  const arm = (pts, hand) => {
    if (sleeveColor) cloth(curve(pts), sleeveColor)
    else skin(curve(pts))
    skin(oval(hand[0], hand[1], hand[2] || 15, hand[3] || 15))
  }
  if (look.sleeve === 'wide') {
    // wide sleeves hang from her shoulders to below her waist; hands together in front
    cloth(curve([[150, 312], [186, 330], [210, 470], [130, 486], [112, 420]]))
    cloth(curve([[270, 312], [234, 330], [210, 470], [290, 486], [308, 420]]))
    skin(oval(210, 452, 26, 16))
  } else if (pose === 'peace' || pose === 'wave' || pose === 'hold-up') {
    arm([[136, 330], [154, 338], [140, 470], [122, 466]], [130, 478])
    if (pose === 'peace') {
      arm([[262, 320], [286, 336], [334, 254], [316, 244]], [328, 238, 17, 17])
      skin(curve([[318, 228], [324, 226], [314, 186], [306, 190]]), { width: 3.5 })
      skin(curve([[332, 226], [338, 228], [348, 190], [340, 186]]), { width: 3.5 })
    } else if (pose === 'wave') {
      arm([[262, 320], [286, 336], [338, 252], [318, 242]], [332, 226, 22, 24])
      for (let k = 0; k < 4; k++) skin(oval(316 + k * 11, 198 - Math.sin((k / 3) * Math.PI) * 6, 6, 14, -0.3 + k * 0.2), { width: 3 })
    } else {
      arm([[262, 322], [286, 338], [320, 302], [300, 290]], [312, 296, 17, 17])
    }
  } else if (pose === 'hold') {
    arm([[138, 330], [158, 338], [194, 400], [178, 412]], [192, 406])
    arm([[282, 330], [262, 338], [226, 400], [242, 412]], [228, 406])
  } else {
    // 'stand', 'sit', 'warrior', 'bow': both hands together in front
    arm([[138, 326], [158, 336], [196, 452], [180, 462]], [196, 460])
    arm([[282, 326], [262, 336], [224, 452], [240, 462]], [224, 460])
    skin(oval(210, 462, 30, 18))
  }

  // ---- her face
  puff(ctx, oval(210, 194, 84, 90), face, line)
  puff(ctx, curve([[124, 206], [126, 144], [158, 102], [210, 88], [262, 102], [294, 144], [296, 206], [278, 154], [244, 128], [214, 120], [206, 120], [176, 128], [142, 154]]), HER.hair, { ...line, glow: 0.22 })
  puff(ctx, curve([[178, 124], [146, 156], [130, 214], [130, 286], [140, 334], [156, 326], [152, 280], [154, 214], [170, 160], [190, 130]]), HER.hair, { ...line, glow: 0.22 })
  puff(ctx, curve([[242, 124], [274, 156], [290, 214], [290, 286], [280, 334], [264, 326], [268, 280], [266, 214], [250, 160], [230, 130]]), HER.hair, { ...line, glow: 0.22 })
  if (look.glasses) {
    for (const x of [182, 238]) puff(ctx, oval(x, 204, 22, 17), '#2a2a36', { line: NAVY, width: 3.5, glow: 0.5, fuzz: 0 })
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(204, 202)
    ctx.lineTo(216, 202)
    ctx.stroke()
  } else {
    eye(ctx, 182, 204, 10)
    eye(ctx, 238, 204, 10)
    if (makeup === 'douyin') {
      // a little shimmer under each eye
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      for (const x of [176, 232]) {
        ctx.beginPath()
        ctx.arc(x, 222, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  if (makeup === 'douyin') {
    blush(ctx, 162, 236, 26, 15, '255, 120, 150')
    blush(ctx, 258, 236, 26, 15, '255, 120, 150')
    puff(ctx, curve([[198, 244], [210, 240], [222, 244], [214, 254], [206, 254]]), '#e2557f', { line: darker('#e2557f', 0.4), width: 2.5, fuzz: 0, glow: 0.7 })
  } else {
    blush(ctx, 164, 234)
    blush(ctx, 256, 234)
    ctx.strokeStyle = '#5a2a28'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (pose === 'warrior') {
      ctx.moveTo(198, 246)
      ctx.lineTo(222, 246)
    } else {
      ctx.moveTo(196, 238)
      ctx.quadraticCurveTo(210, 252, 224, 238)
    }
    ctx.stroke()
  }
  if (look.muffs) {
    ctx.strokeStyle = '#f5f1ea'
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.arc(210, 170, 92, Math.PI * 1.06, Math.PI * 1.94)
    ctx.stroke()
    for (const x of [122, 298]) puff(ctx, oval(x, 190, 26, 28), '#f5f1ea', line)
  }
  if (look.scarf) {
    cloth(curve([[150, 286], [210, 304], [270, 286], [272, 318], [210, 334], [148, 318]]), look.scarf)
    if (outfit === 'scarf') cloth(curve([[252, 300], [300, 296], [360, 270], [404, 286], [356, 310], [300, 326]]), look.scarf) // blowing in the wind
    else cloth(curve([[160, 316], [188, 320], [182, 392], [156, 388]]), look.scarf)
  }

  // ---- props held in front
  if (prop) drawProp(ctx, prop, line)
  ctx.restore()
  fibres(ctx)
  return c
}

// little flowers dotted over cloth
function dots(ctx, x, y, w, h, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.75
  for (let i = 0; i < 18; i++) {
    const px = x + ((i * 53) % w)
    const py = y + ((i * 97) % h)
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(px + Math.cos(a) * 5, py + Math.sin(a) * 5, 3.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}
// the stitched rows of a puffy coat
function quilt(ctx, x, y, w, h) {
  ctx.save()
  ctx.strokeStyle = 'rgba(29, 42, 91, 0.35)'
  ctx.lineWidth = 3
  for (let py = y + 30; py < y + h; py += 46) {
    ctx.beginPath()
    ctx.moveTo(x, py)
    ctx.quadraticCurveTo(x + w / 2, py + 10, x + w, py)
    ctx.stroke()
  }
  ctx.restore()
}

function drawProp(ctx, prop, line) {
  const p = (shape, color, o = {}) => puff(ctx, shape, color, { ...line, ...o })
  switch (prop) {
    case 'drink':
      p(curve([[186, 352], [234, 352], [228, 420], [192, 420]]), 'rgba(235, 245, 255, 0.95)', { glow: 0.7 })
      p(curve([[190, 372], [230, 372], [226, 416], [194, 416]]), '#f7a3c4', { width: 0, glow: 0.6 })
      p(oval(232, 356, 14, 10), '#f4e05a', { width: 3 })
      ctx.strokeStyle = '#e2557f'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(214, 380)
      ctx.lineTo(226, 326)
      ctx.stroke()
      break
    case 'tanghulu':
      ctx.strokeStyle = '#c9a26b'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(312, 314)
      ctx.lineTo(318, 150)
      ctx.stroke()
      for (let k = 0; k < 5; k++) p(oval(316, 168 + k * 24, 16, 15), '#e23b4a', { glow: 0.85 })
      break
    case 'umbrella':
      ctx.strokeStyle = '#7a4e33'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(314, 312)
      ctx.lineTo(316, 30)
      ctx.stroke()
      break
    case 'panda':
      p(oval(176, 352, 16, 14), '#2a2a30')
      p(oval(244, 352, 16, 14), '#2a2a30')
      p(oval(210, 400, 50, 46), '#f8f6f0')
      p(oval(190, 394, 12, 15, -0.4), '#2a2a30', { width: 2.5 })
      p(oval(230, 394, 12, 15, 0.4), '#2a2a30', { width: 2.5 })
      p(oval(210, 412, 7, 5), '#2a2a30', { width: 2 })
      break
    case 'dimsum':
      p(curve([[164, 372], [256, 372], [252, 418], [168, 418]]), '#d8b06a')
      ctx.strokeStyle = 'rgba(90, 60, 20, 0.5)'
      ctx.lineWidth = 3
      for (const y of [386, 402]) {
        ctx.beginPath()
        ctx.moveTo(166, y)
        ctx.lineTo(254, y)
        ctx.stroke()
      }
      for (const x of [186, 210, 234]) p(oval(x, 362, 15, 13), '#fbf5e8', { width: 3 })
      break
    case 'takoyaki':
      p(curve([[156, 388], [264, 388], [248, 424], [172, 424]]), '#e9d2a2')
      for (const [x, y] of [[178, 380], [204, 376], [230, 378], [192, 362], [218, 360], [244, 366]]) p(oval(x, y, 14, 12), '#b9763f', { glow: 0.4 })
      ctx.strokeStyle = '#fff6d8'
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let x = 168; x < 252; x += 12) ctx.lineTo(x, 362 + ((x / 12) % 2 ? 8 : 0))
      ctx.stroke()
      break
    case 'coconut':
      p(oval(210, 390, 44, 40), '#7fb35a')
      p(oval(210, 362, 30, 10), '#f4efe0', { width: 3 })
      ctx.strokeStyle = '#4fb3e2'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(218, 364)
      ctx.lineTo(236, 318)
      ctx.stroke()
      p(curve([[226, 322], [262, 300], [268, 326]]), '#f4c95d', { width: 3 })
      break
  }
}
