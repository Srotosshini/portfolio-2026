// The HTML that sits over (and under) the canvas.
//  - hotspots: real <button>s laid over each box and cabinet, so clicking,
//    touch, the keyboard and screen readers all use the same controls
//  - the paper card that holds a project page or About
//  - the media layer: a real <video> or playable build that sits *behind* the
//    canvas and shows through a cabinet's cut-out screen
import * as THREE from 'three'

const v = new THREE.Vector3()
const $ = (selector) => document.querySelector(selector)
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

export function createOverlay(camera) {
  const el = { spots: $('#hotspots'), stage: $('#stage'), card: $('#card'), slot: $('#card-slot'), back: $('#back'), status: $('#status') }
  const spots = []
  const pins = []
  let W = 1
  let H = 1
  let active = null

  // screen-space bounding box of some world-space points
  function place(node, corners, grow = 0) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const corner of corners) {
      v.copy(corner).project(camera)
      const x = (v.x + 1) * 0.5 * W
      const y = (1 - v.y) * 0.5 * H
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
    node.style.transform = `translate(${(x0 - grow).toFixed(1)}px,${(y0 - grow).toFixed(1)}px)`
    node.style.width = `${(x1 - x0 + grow * 2).toFixed(1)}px`
    node.style.height = `${(y1 - y0 + grow * 2).toFixed(1)}px`
  }

  const overlay = {
    el,
    reduced: false,
    dragged: false, // set by main.js when a touch turned into a pan, so the click is ignored

    resize(w, h) {
      W = w
      H = h
    },

    // A button over something in the scene. `corners()` returns its corners in
    // world space; `group` names the place where the button is live.
    //   onMove(fx, fy)  the pointer's position across the button, 0..1
    //   visible()       for things that come and go (a photo winding onto a reel)
    addSpot({ group, label, corners, onClick, onHover, onMove, visible, off = false }) {
      const node = document.createElement('button')
      node.type = 'button'
      node.className = 'hotspot'
      node.hidden = true
      node.setAttribute('aria-label', label)
      if (off) node.setAttribute('aria-disabled', 'true')
      node.addEventListener('click', () => {
        if (!overlay.dragged) onClick?.()
      })
      for (const [type, on] of [['pointerenter', true], ['pointerleave', false], ['focus', true], ['blur', false]])
        node.addEventListener(type, () => onHover?.(on))
      if (onMove)
        node.addEventListener('pointermove', (e) => {
          const r = node.getBoundingClientRect()
          onMove((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
        })
      el.spots.append(node)
      const spot = { node, group, corners, visible }
      spots.push(spot)
      return spot
    },

    showSpots(group) {
      active = group
      for (const spot of spots) spot.node.hidden = spot.group !== group || !!spot.visible
      overlay.update() // place them (and settle the ones that come and go) now, so they can take focus straight away
    },

    // call after the camera or anything with a hotspot has moved
    update() {
      for (const spot of spots) {
        if (spot.group !== active) continue
        const show = !spot.visible || spot.visible()
        if (spot.node.hidden === show) spot.node.hidden = !show
        if (show) place(spot.node, spot.corners())
      }
      for (const pin of pins) place(pin.node, pin.corners(), 1)
    },

    // Put a project's clip or playable build behind the canvas, pinned to the
    // screen-shaped hole at `corners()`. Returns null if there is nothing to show yet.
    mountMedia(project, corners, { files, base }) {
      let node = null
      if (project.build) {
        node = document.createElement('iframe')
        node.src = project.build
        node.allow = 'autoplay; fullscreen; gamepad'
        node.title = project.title
      } else if (files.includes(project.clip)) {
        node = document.createElement('video')
        node.muted = true
        node.loop = true
        node.playsInline = true
        node.controls = true
        node.preload = 'auto'
        if (files.includes(project.poster)) node.poster = base + project.poster
        node.src = base + project.clip
        node.setAttribute('aria-label', project.title)
        node.play().catch(() => {})
      }
      if (!node) return null
      node.className = 'media'
      el.stage.append(node)
      pins.push({ node, corners })
      overlay.update()
      return node
    },

    clearMedia() {
      for (const pin of pins.splice(0)) {
        pin.node.pause?.()
        pin.node.remove()
      }
    },

    async showCard(html) {
      el.card.innerHTML = `<div class="card-paper">${html}</div>`
      el.card.hidden = false
      void el.card.offsetWidth // so the slide-in runs
      el.card.classList.add('is-in')
      await sleep(overlay.reduced ? 0 : 430)
      el.card.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true })
    },

    async hideCard() {
      if (el.card.hidden) return
      el.card.classList.remove('is-in')
      await sleep(overlay.reduced ? 0 : 340)
      el.card.hidden = true
      el.card.innerHTML = ''
    },

    // swap what is written on a card that is already out
    setCard(html) {
      el.card.innerHTML = `<div class="card-paper">${html}</div>`
      el.card.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true })
    },

    // '' is the full project card; 'slim' is a caption slip that leaves more room for a picture
    cardSize(size) {
      document.body.dataset.card = size
    },

    // The part of the viewport the card leaves free, for the camera to frame into.
    stageRegion() {
      const r = el.slot.getBoundingClientRect()
      return W > H
        ? { left: 0.03, top: 0.14, right: r.left / W - 0.03, bottom: 0.94 }
        : { left: 0.04, top: 0.1, right: 0.96, bottom: r.top / H - 0.025 }
    },

    say(message) {
      el.status.textContent = message
    },
  }
  return overlay
}
