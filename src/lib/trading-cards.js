// The trading cards, in HTML over the scene: a real <video> for the picture,
// her handwriting for the words, and a sheen for the foil that follows the
// pointer. A card is placed by the four screen corners it should cover, so the
// same element can lie on the counter mat in perspective, fly up to the middle
// of the screen, or turn over. Also here: the binder, and the buttons round a
// card held up big.
import { site } from '../data/projects.js'
import { words } from '../data/sketches.js'
import { has, base, tracingsOf, loadImage } from './assets.js'
import { isTodo } from './pages.js'
import { useIcon } from './placeholders.js'
import { CARD, cardFrame, cardBack, mix } from './shop.js'
import { preview } from './sketches.js'

export const ASPECT = CARD.w / CARD.h
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const place = ([x, y, w, h]) => `left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%`
// finished words print as written; TODO words in pencil while placeholders show
const say = (s) => (!s ? '' : !isTodo(s) ? esc(s) : site.placeholders ? `<span class="todo">${esc(s.replace(/^TODO:\s*/, ''))}</span>` : '')

// the colour a stand-in picture is drawn in: the set's, lightened so it shows on black
export const tintOf = (set) => mix(set.color, '#ffffff', 0.4)

// a card's finish: the set's, or the set's chase finish for its chase card
export const finishOf = (set, chase) => (chase && set.chaseFinish) || set.finish

// ---- the size every card is laid out at ------------------------------------------
// Cards are laid out at the size they are seen big, so they stay sharp there,
// and are only ever scaled down.
export const size = { w: 315, h: 440 }
export function setSize(layer, w) {
  size.w = Math.round(w)
  size.h = Math.round(w / ASPECT)
  layer.style.setProperty('--cw', `${size.w}px`)
  layer.style.setProperty('--ch', `${size.h}px`)
}

// The CSS transform that maps a card onto four points on screen (top left,
// top right, bottom right, bottom left): the projective map of a unit square
// onto a quadrilateral, scaled to the card's size.
export function quadMatrix(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const sx = x0 - x1 + x2 - x3
  const sy = y0 - y1 + y2 - y3
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const det = dx1 * dy2 - dx2 * dy1 || 1e-9
  const g = (sx * dy2 - dx2 * sy) / det
  const h = (dx1 * sy - sx * dy1) / det
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + h * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + h * y3
  const W = size.w
  const H = size.h
  const n = (v) => (Math.abs(v) < 1e-12 ? 0 : +v.toPrecision(8))
  return `matrix3d(${n(a / W)},${n(d / W)},0,${n(g / W)},${n(b / H)},${n(e / H)},0,${n(h / H)},0,0,1,0,${n(x0)},${n(y0)},0,1)`
}

// is this quad the right way round on screen? (false: we are looking at its back)
export const facing = ([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) =>
  x0 * y1 - x1 * y0 + (x1 * y2 - x2 * y1) + (x2 * y3 - x3 * y2) + (x3 * y0 - x0 * y3) >= 0

// ---- the drawn parts: one frame per set and finish, one shared back -----------------
const made = new Map()
const blobUrl = (canvas) => new Promise((done) => canvas.toBlob((blob) => done(blob ? URL.createObjectURL(blob) : canvas.toDataURL())))
async function eraImage(era) {
  const file = tracingsOf(`drawings/era-${era}`)[0]
  if (!file) return null
  try {
    return await loadImage(file)
  } catch {
    return null
  }
}
// a set's card face, as a canvas (the showcase draws it into its slabs)
export function frameCanvas(set, finish) {
  const key = `canvas:${set.id}:${finish}`
  if (!made.has(key)) made.set(key, eraImage(set.era).then((img) => cardFrame(set, finish, { eraImage: img, seed: set.order })))
  return made.get(key)
}
export function frameUrl(set, finish) {
  const key = `url:${set.id}:${finish}`
  if (!made.has(key)) made.set(key, frameCanvas(set, finish).then(blobUrl))
  return made.get(key)
}
export function backUrl() {
  if (!made.has('back')) {
    const file = tracingsOf('drawings/card-back')[0]
    made.set('back', file ? Promise.resolve(base + file) : blobUrl(cardBack()))
  }
  return made.get('back')
}

// the stat line along the bottom of a card: "uses: mic · vibe: chaotic · made: fall 2026"
function statLine(s) {
  const parts = []
  if (s.uses.length) parts.push(`${esc(words.uses)}: ${s.uses.map((u) => esc(words.names[u] || u)).join(', ')}`)
  const vibe = say(s.vibe)
  if (vibe) parts.push(`${esc(words.vibe)}: ${vibe}`)
  if (s.date) parts.push(`${esc(words.made)}: ${esc(s.date)}`)
  return parts.join(' · ')
}

// what the back says, once it is turned over in the big view
function aboutMarkup(s) {
  const out = [`<h3 class="hand">${esc(s.title)}</h3>`]
  const line = say(s.oneLiner)
  if (line) out.push(`<p class="tcard-line">${line}</p>`)
  const facts = [
    [words.uses, s.uses.map((u) => esc(words.names[u] || u)).join(', ')],
    [words.vibe, say(s.vibe)],
    [words.made, esc(s.date)],
  ].filter(([, v]) => v)
  if (facts.length) out.push(`<dl class="tcard-facts">${facts.map(([k, v]) => `<div><dt class="hand">${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`)
  const learned = say(s.learned)
  if (learned) out.push(`<h4 class="hand">${esc(words.learned)}</h4><p>${learned}</p>`)
  const pictures = (s.process || [])
    .filter((p) => has(p.src))
    .slice(0, 2)
    .map((p) => `<img src="${base}${esc(p.src)}" alt="${isTodo(p.alt) ? '' : esc(p.alt)}" loading="lazy" decoding="async">`)
  if (pictures.length) out.push(`<div class="tcard-process">${pictures.join('')}</div>`)
  return out.join('')
}

function drawIcons(root, s) {
  root.querySelectorAll('canvas[data-use]').forEach((c, i) => useIcon(c.getContext('2d'), c.dataset.use, 36, 36, 62, i + s.slug.length))
}

// A still for a card with no video and no poster yet: one frame of a stand-in sketch.
function standInStill(index, color, w, h) {
  const still = preview(index, color, w, h)
  for (let k = 0; k < 30; k++) still.step(k / 12)
  return still.node
}

// ---- a card ------------------------------------------------------------------------
// s: the sketch; set: its set; number/total: "3 / 6"; chase: the set's
// favourite; index: which stand-in sketch to show until her video exists.
export function makeCard(s, set, { number = 1, total = 1, chase = false, index = 0 } = {}) {
  const finish = finishOf(set, chase)
  const el = document.createElement('div')
  el.className = 'tcard'
  el.dataset.finish = finish
  el.setAttribute('aria-label', `${s.title}, ${set.name}${chase ? `, ${words.chase}` : ''}`)
  const uses = s.uses
    .map((u) => `<li><canvas data-use="${esc(u)}" width="72" height="72" aria-hidden="true"></canvas><span>${esc(words.names[u] || u)}</span></li>`)
    .join('')
  el.innerHTML = `
    <div class="tcard-face tcard-front">
      <p class="tcard-title hand" style="${place(CARD.title)}"><span>${esc(s.title)}</span></p>
      <div class="tcard-pic" style="${place(CARD.pic)}"><button type="button" class="tcard-play hand" hidden></button></div>
      <ul class="tcard-uses" style="${place(CARD.uses)}">${uses}</ul>
      <p class="tcard-stats hand" style="${place(CARD.stats)}">${statLine(s)}</p>
      <p class="tcard-foot hand" style="${place(CARD.foot)}"><span>${esc(set.name)}</span><span>${number} / ${total}</span></p>
      <span class="tcard-sheen" aria-hidden="true"></span>
    </div>
    <div class="tcard-face tcard-back"><div class="tcard-about"></div></div>`
  drawIcons(el, s)
  const front = el.querySelector('.tcard-front')
  const back = el.querySelector('.tcard-back')
  const pic = el.querySelector('.tcard-pic')
  const play = el.querySelector('.tcard-play')
  frameUrl(set, finish).then((url) => (front.style.backgroundImage = `url("${url}")`))
  backUrl().then((url) => (back.style.backgroundImage = `url("${url}")`))

  let lastTransform = ''
  let lastBack = null
  const card = {
    el, s, set, chase, finish,
    video: null,
    still: null, // a stand-in sketch, stepped on the 12 fps clock
    paused: false,
    loaded: false,

    // Put it on screen covering these four points. Seen from behind, it shows
    // its back the right way round.
    place(q) {
      const front = facing(q)
      const quad = front ? q : [q[1], q[0], q[3], q[2]]
      const transform = quadMatrix(quad)
      if (transform !== lastTransform) {
        el.style.transform = transform
        lastTransform = transform
      }
      if (lastBack !== !front) {
        el.classList.toggle('is-back', !front)
        lastBack = !front
      }
    },

    // Start its picture: her clip if it exists, else her poster, else a stand-in.
    load() {
      if (card.loaded) return
      card.loaded = true
      if (has(s.video)) {
        const video = document.createElement('video')
        Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'auto' })
        video.setAttribute('aria-hidden', 'true')
        if (has(s.poster)) video.poster = base + s.poster
        // a .webm beside the .mp4 is offered first
        const webm = s.video.replace(/\.mp4$/i, '.webm')
        if (webm !== s.video && has(webm)) video.append(Object.assign(document.createElement('source'), { src: base + webm, type: 'video/webm' }))
        video.append(Object.assign(document.createElement('source'), { src: base + s.video, type: 'video/mp4' }))
        pic.prepend(video)
        card.video = video
        if (!card.paused) video.play().catch(() => {})
      } else if (has(s.poster)) {
        pic.prepend(Object.assign(document.createElement('img'), { src: base + s.poster, alt: '', decoding: 'async' }))
      } else {
        card.still = preview(index, tintOf(set), 400, 300)
        for (let k = 0; k < 6; k++) card.still.step(k / 12)
        pic.prepend(card.still.node)
      }
      play.hidden = !card.video && !card.still
    },
    unload() {
      if (!card.loaded) return
      card.loaded = false
      if (card.video) {
        card.video.pause()
        card.video.querySelectorAll('source').forEach((source) => source.remove())
        card.video.load()
      }
      pic.querySelectorAll('video, img, canvas').forEach((node) => node.remove())
      card.video = card.still = null
    },
    setPaused(paused) {
      card.paused = paused
      if (card.video) paused ? card.video.pause() : card.video.play().catch(() => {})
      play.textContent = paused ? words.play : words.pause
      play.setAttribute('aria-pressed', String(paused))
    },
    // one 12 fps tick of a stand-in picture
    step(frame) {
      if (card.still && !card.paused) card.still.step(frame / 12)
    },
    // fill in the back, the first time it is needed
    about() {
      const node = back.querySelector('.tcard-about')
      if (!node.innerHTML) node.innerHTML = aboutMarkup(s)
      return node
    },
    destroy() {
      card.unload()
      el.remove()
    },
  }
  card.setPaused(false)
  play.addEventListener('click', (e) => {
    e.stopPropagation()
    card.setPaused(!card.paused)
  })

  // the foil catches the light where the pointer is
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
    el.style.setProperty('--py', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
  })
  return card
}

// ---- the binder ----------------------------------------------------------------------
// A ring binder with a page per set, a sleeve per card. Cards she has opened
// sit in their sleeves; the rest are outlines with a question mark.
//   onCard(slug, rect)  a collected card was picked (rect: where it is on screen)
//   onEverything()      "show me everything"
//   onClose()
export function makeBinder({ sets, sketches, onCard, onEverything, onClose }) {
  const newestFirst = [...sets].sort((a, b) => b.order - a.order)
  const el = document.createElement('div')
  el.className = 'binder-wrap'
  el.hidden = true
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.setAttribute('aria-labelledby', 'binder-title')
  el.innerHTML = `
    <div class="binder">
      <div class="binder-cover">
        <h2 class="hand" id="binder-title" tabindex="-1">${esc(words.binder)}</h2>
        <p class="binder-count hand"></p>
        <nav class="binder-tabs"></nav>
        <p class="binder-all"><button type="button" class="paper-button hand" data-act="all">${esc(words.everything)}</button></p>
        <p class="binder-list"><a class="hand" href="list.html">${esc(words.list)}</a></p>
      </div>
      <div class="binder-rings" aria-hidden="true"><i></i><i></i><i></i></div>
      <section class="binder-page" aria-live="polite"></section>
    </div>
    <button type="button" class="paper-button hand binder-close" data-act="close">${esc(words.closeBinder)}</button>`
  const $ = (selector) => el.querySelector(selector)
  const thumbs = new Map() // a card's little picture, made once
  let page = newestFirst.find((set) => sketches.some((s) => s.set === set.id))?.id
  let have = new Set()
  let turning = 0

  function thumb(s) {
    if (!thumbs.has(s.slug)) {
      const index = sketches.indexOf(s)
      const set = sets.find((x) => x.id === s.set)
      const node = has(s.poster)
        ? Object.assign(document.createElement('img'), { src: base + s.poster, alt: '', loading: 'lazy', decoding: 'async' })
        : standInStill(index, tintOf(set), 200, 150)
      node.className = 'mini-pic'
      node.style.cssText = place(CARD.pic)
      thumbs.set(s.slug, node)
    }
    return thumbs.get(s.slug)
  }

  function render() {
    const total = sketches.length
    $('.binder-count').textContent = words.collected(sketches.filter((s) => have.has(s.slug)).length, total)
    $('.binder-tabs').innerHTML = newestFirst
      .map((set) => {
        const cards = sketches.filter((s) => s.set === set.id)
        const got = cards.filter((s) => have.has(s.slug)).length
        const count = cards.length ? `${got} / ${cards.length}` : esc(set.sealed ? words.lost : '')
        return `<button type="button" class="binder-tab hand" data-set="${esc(set.id)}"${set.id === page ? ' aria-current="page"' : ''}><span>${esc(set.name)}</span><small>${count}</small></button>`
      })
      .join('')
    const set = sets.find((x) => x.id === page)
    const cards = sketches.filter((s) => s.set === set.id)
    const node = $('.binder-page')
    const heading = [set.name, set.place, set.title].filter(Boolean).map(esc).join(' · ')
    if (!cards.length) {
      node.innerHTML = `<h3 class="hand">${heading}</h3><div class="sleeves">${'<div class="sleeve is-empty"><span class="hand">?</span></div>'.repeat(3)}</div><p class="binder-lost hand">${esc(set.sealed || '')}</p>`
      return
    }
    const chase = chaseOf(cards)
    node.innerHTML = `<h3 class="hand">${heading}</h3><div class="sleeves"></div>${cards.every((s) => have.has(s.slug)) ? `<p class="binder-stamp hand">${esc(words.setComplete)}</p>` : ''}`
    const sleeves = node.querySelector('.sleeves')
    cards.forEach((s) => {
      if (!have.has(s.slug)) {
        sleeves.insertAdjacentHTML('beforeend', `<div class="sleeve is-empty"><span class="hand">${esc(words.missing)}</span></div>`)
        return
      }
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'sleeve is-filled'
      button.dataset.slug = s.slug
      button.setAttribute('aria-label', s.title)
      button.innerHTML = `<span class="mini" data-finish="${finishOf(set, s === chase)}"><span class="mini-title hand" style="${place(CARD.title)}"><span>${esc(s.title)}</span></span></span>`
      const mini = button.querySelector('.mini')
      mini.prepend(thumb(s))
      frameUrl(set, finishOf(set, s === chase)).then((url) => (mini.style.backgroundImage = `url("${url}")`))
      sleeves.append(button)
    })
  }

  el.addEventListener('click', (e) => {
    const target = e.target.closest('[data-act], [data-set], [data-slug]')
    if (!target) return
    if (target.dataset.act === 'close') onClose()
    else if (target.dataset.act === 'all') onEverything()
    else if (target.dataset.set) binder.show(target.dataset.set)
    else if (target.dataset.slug) onCard(target.dataset.slug, target.querySelector('.mini').getBoundingClientRect())
  })

  const binder = {
    el,
    get page() {
      return page
    },
    // what has been collected (a Set of slugs)
    set(collected) {
      have = collected
      if (!el.hidden) render()
    },
    // turn to a set's page (with a quick stop-motion page turn)
    show(id, { turn = true } = {}) {
      if (id) page = id
      render()
      const node = $('.binder-page')
      if (turn) {
        node.classList.remove('is-turning')
        void node.offsetWidth
        node.classList.add('is-turning')
        clearTimeout(turning)
        turning = setTimeout(() => node.classList.remove('is-turning'), 600)
      }
    },
    // where a card's sleeve is on screen, if its page is showing
    sleeveRect(slug) {
      const sleeve = el.querySelector(`[data-slug="${CSS.escape(slug)}"] .mini`)
      return !el.hidden && sleeve ? sleeve.getBoundingClientRect() : null
    },
    focusSleeve(slug) {
      el.querySelector(`[data-slug="${CSS.escape(slug)}"]`)?.focus({ preventScroll: true })
    },
  }
  return binder
}

// the chase card of a set's cards: the one marked, or the last one
export const chaseOf = (cards) => cards.find((s) => s.chase) || cards[cards.length - 1]

// ---- the buttons round a card held up big ---------------------------------------------
//   onBack(), onFlip()
export function makeCardView({ onBack, onFlip }) {
  const el = document.createElement('div')
  el.className = 'card-view'
  el.hidden = true
  el.innerHTML = `
    <div class="card-view-dim"></div>
    <div class="card-view-ui">
      <button type="button" class="paper-button hand" data-act="back">${esc(words.back)}</button>
      <div class="card-view-try">
        <a class="paper-button primary hand" data-act="try" target="_blank" rel="noopener">${esc(words.tryIt)}</a>
        <span class="card-view-needs hand"></span>
      </div>
      <button type="button" class="paper-button hand" data-act="flip" aria-pressed="false">${esc(words.flip)}</button>
    </div>`
  const $ = (selector) => el.querySelector(selector)
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'back') onBack()
    else if (act === 'flip') onFlip()
    else if (e.target.classList.contains('card-view-dim')) onBack()
  })
  return {
    el,
    // fill it in for one sketch; from: where its back button goes
    set(s, from = 'counter') {
      $('[data-act=back]').textContent = from === 'binder' ? words.backToBinder : from === 'counter' ? words.back : words.backToCase
      const link = $('[data-act=try]')
      if (s.editorUrl) {
        link.href = s.editorUrl
        link.removeAttribute('aria-disabled')
        link.textContent = words.tryIt
      } else {
        link.removeAttribute('href')
        link.setAttribute('aria-disabled', 'true')
        link.textContent = words.tryIt
      }
      const needs = s.uses.map((u) => words.needs[u]).find(Boolean)
      $('.card-view-needs').textContent = s.editorUrl ? needs || '' : words.noLink
      this.flipped(false)
    },
    flipped(on) {
      const flip = $('[data-act=flip]')
      flip.textContent = on ? words.flipBack : words.flip
      flip.setAttribute('aria-pressed', String(on))
    },
    // lay the buttons out round the card at `rect` (screen pixels)
    layout(rect, beside) {
      el.classList.toggle('is-beside', beside)
      el.style.setProperty('--left', `${rect.left}px`)
      el.style.setProperty('--right', `${innerWidth - rect.left - rect.width}px`)
      el.style.setProperty('--top', `${rect.top}px`)
      el.style.setProperty('--bottom', `${innerHeight - rect.top - rect.height}px`)
    },
    focus() {
      ;($('[data-act=try][href]') || $('[data-act=back]')).focus({ preventScroll: true })
    },
  }
}
