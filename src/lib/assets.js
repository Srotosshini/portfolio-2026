// Artwork slots. Each slot is a file name in /public. If the file is there the
// site uses it; if not, it draws a placeholder that says which file it wants.
import * as THREE from 'three'
import files from 'virtual:public-files'
import { prepCutout, texture } from './paper.js'

export { files }
export const base = import.meta.env.BASE_URL
export const has = (path) => !!path && files.includes(path)
export const url = (path) => base + path

let redraw = () => {}
// main.js hands over a function that asks for the scene to be drawn again
export const onAssetLoaded = (fn) => (redraw = fn)

// All tracings of a drawing: "drawings/coin" finds coin-1.png, coin-2.png, …
// or a single coin.png.
export function tracingsOf(stem) {
  const numbered = files.filter((f) => f.startsWith(stem + '-') && /^-\d+\.(png|webp|avif)$/i.test(f.slice(stem.length)))
  if (numbered.length) return numbered
  return files.filter((f) => f.startsWith(stem + '.') && /^\.(png|webp|avif)$/i.test(f.slice(stem.length)))
}

export function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not load ${path}`))
    img.src = url(path)
  })
}

// A drawing slot, ready for makePiece()/makeFlat(): her tracings if they are
// in /public, otherwise `placeholder(n)` drawn `tracings` times.
export async function art(stem, placeholder, { edge = 5, tracings = 2, trim = true } = {}) {
  let sources
  const real = tracingsOf(stem)
  if (real.length) {
    try {
      sources = await Promise.all(real.map(loadImage))
    } catch (error) {
      console.warn(error.message, '- using the placeholder')
    }
  }
  if (!sources) {
    sources = []
    for (let i = 0; i < tracings; i++) {
      await turn()
      sources.push(placeholder(i + 1))
    }
  }
  const preps = []
  for (const source of sources) {
    await turn()
    preps.push(prepCutout(source, { edge, trim }))
  }
  return preps
}

// Drawing a stand-in or cutting out a drawing is slow work. It is done a
// piece at a time, in the time each frame has to spare: at least one piece per
// frame, more while the frame is still young. So the rooms are made quickly
// while the page is quiet, and a camera glide keeps moving while one is being
// made, instead of freezing and then jumping to the end.
const BUDGET = 11 // milliseconds into a frame that slow work may carry on
const waiting = []
let pumping = false
let frameStart = 0
const next = new MessageChannel()
function step(first) {
  if (!waiting.length) {
    pumping = false
    return
  }
  if (first || performance.now() - frameStart < BUDGET) {
    waiting.shift()()
    next.port2.postMessage(0) // (runs once the piece just let go has gone as far as its next turn)
  } else requestAnimationFrame(onFrame)
}
function onFrame(time) {
  frameStart = time
  step(true)
}
next.port1.onmessage = () => step(false)
export function turn() {
  return new Promise((resolve) => {
    waiting.push(resolve)
    if (!pumping) {
      pumping = true
      requestAnimationFrame(onFrame)
    }
  })
}

// A material slot: the first of her scans that exists (textures/<name>.jpg,
// .png or .webp), otherwise the placeholder canvas.
// By default a scan is laid at a fixed real size and repeats mirrored, so it
// never stretches and its edges never show as a seam. `tile: false` is for a
// drawing that should fill one wall exactly.
export function scan(names, placeholder, { tile = true } = {}) {
  const file = [names]
    .flat()
    .filter(Boolean)
    .map((name) => files.find((f) => f.startsWith(`textures/${name}.`)))
    .find(Boolean)
  let t
  if (file) {
    t = new THREE.TextureLoader().load(url(file), () => {
      if (tile) t.repeat.y = t.image.width / t.image.height // keep the scan's proportions
      redraw()
    })
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
  } else {
    t = texture(placeholder())
  }
  if (tile) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping
  return t
}
