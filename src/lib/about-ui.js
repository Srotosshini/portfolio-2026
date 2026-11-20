// The paper things that open over her room (the About box), in HTML so their
// words stay sharp and everything works with a keyboard and a screen reader:
// the buttons under a polaroid held up big, her photos from a trip, the bio
// in her notebook, the letter in the envelope, the business card, the report
// card from the pennants, the two sheet-music frames from the violin case,
// the pinboard as a grid (on a phone), a little note, and a strip of her links.
import { site } from '../data/projects.js'
import { base } from './assets.js'
import { isTodo } from './pages.js'
import { sound } from './sound.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
// finished words print as written; TODO words in pencil while placeholders show
const say = (s) => (!s ? '' : !isTodo(s) ? esc(s) : site.placeholders ? `<span class="todo">${esc(s.replace(/^TODO:\s*/, ''))}</span>` : '')

export function makeAboutUI({ reduced = () => false } = {}) {
  const el = document.createElement('div')
  el.className = 'about-ui'
  el.hidden = true
  document.body.append(el)
  const strip = document.createElement('nav')
  strip.className = 'about-links hand'
  strip.setAttribute('aria-label', 'links')
  strip.hidden = true
  document.body.append(strip)
  const toaster = document.createElement('p')
  toaster.className = 'about-toast hand'
  toaster.setAttribute('role', 'status')
  toaster.hidden = true
  document.body.append(toaster)

  let open = null // { name, node, onClose, returnFocus }
  let toastTimer = 0

  function close(quiet = false) {
    if (!open) return false
    const { node, onClose, returnFocus, media } = open
    open = null
    for (const video of media || []) {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
    node.remove()
    el.classList.remove('is-modal', 'is-bar')
    el.hidden = true
    if (!quiet) onClose?.()
    returnFocus?.focus?.({ preventScroll: true })
    return true
  }

  // put a sheet up; `modal` darkens the room behind it
  function sheet(name, html, { modal = true, className = '', onClose, focus = 'button' } = {}) {
    close(true)
    const node = document.createElement('section')
    node.className = `about-sheet ${className}`
    if (modal) {
      node.setAttribute('role', 'dialog')
      node.setAttribute('aria-modal', 'true')
    }
    node.innerHTML = html
    el.append(node)
    el.hidden = false
    el.classList.toggle('is-modal', modal)
    el.classList.toggle('is-bar', !modal)
    void node.offsetWidth
    node.classList.add('is-in')
    open = { name, node, onClose, returnFocus: document.activeElement, media: [] }
    node.querySelector(focus === 'heading' ? '[tabindex="-1"]' : 'button, a')?.focus({ preventScroll: true })
    node.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act
      if (act === 'close') close()
    })
    return node
  }

  const api = {
    get open() {
      return open?.name || null
    },
    close,

    // the two buttons under a polaroid held up big
    polaroid({ city, hasPhotos, onPhotos, onPinBack }) {
      const node = sheet(
        'polaroid',
        `<p class="polaroid-bar">
          <button type="button" class="paper-button hand primary" data-act="photos">${hasPhotos ? 'see my photos →' : 'photos soon →'}</button>
          <button type="button" class="paper-button hand" data-act="close">pin it back</button>
        </p>`,
        { modal: false, className: 'polaroid-controls', onClose: onPinBack },
      )
      node.setAttribute('aria-label', city)
      node.querySelector('[data-act="photos"]').addEventListener('click', () => onPhotos())
      return node
    },

    // her real photos from one trip: a paper-framed lightbox
    gallery({ city, photos, onClose }) {
      let at = 0
      const node = sheet(
        'gallery',
        `<h2 class="hand" tabindex="-1">${esc(city)}</h2>
        ${
          photos.length
            ? `<figure class="gallery-frame"><img alt=""></figure>
               <p class="gallery-turn">
                 <button type="button" class="paper-button hand" data-act="prev" aria-label="previous photo">←</button>
                 <span class="gallery-count hand" aria-live="polite"></span>
                 <button type="button" class="paper-button hand" data-act="next" aria-label="next photo">→</button>
               </p>`
            : `<p class="gallery-empty hand">her photos from ${esc(city)} are on their way</p>`
        }
        <button type="button" class="paper-tab hand" data-act="close">close</button>`,
        { className: 'gallery', onClose, focus: 'heading' },
      )
      if (!photos.length) return
      const img = node.querySelector('img')
      const count = node.querySelector('.gallery-count')
      const show = (k) => {
        at = (k + photos.length) % photos.length
        img.src = base + photos[at]
        img.alt = `${city}, photo ${at + 1} of ${photos.length}`
        count.textContent = `${at + 1} / ${photos.length}`
      }
      show(0)
      node.querySelector('[data-act="prev"]').addEventListener('click', () => show(at - 1))
      node.querySelector('[data-act="next"]').addEventListener('click', () => show(at + 1))
      node.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') show(at - 1)
        if (e.key === 'ArrowRight') show(at + 1)
      })
      let x0 = null
      img.addEventListener('pointerdown', (e) => (x0 = e.clientX))
      img.addEventListener('pointerup', (e) => {
        if (x0 != null && Math.abs(e.clientX - x0) > 40) show(at + (e.clientX < x0 ? 1 : -1))
        x0 = null
      })
    },

    // the bio, written out big in her notebook
    notebook({ bio, onClose }) {
      sheet(
        'notebook',
        `<h2 class="hand" tabindex="-1">about me</h2>
        ${bio.map((para) => `<p class="hand">${say(para)}</p>`).join('')}
        <button type="button" class="paper-tab hand" data-act="close">close the notebook</button>`,
        { className: 'notebook', onClose, focus: 'heading' },
      )
    },

    // the letter out of the envelope: her email, a copy button, a mailto link
    letter({ email, onClose }) {
      const node = sheet(
        'letter',
        `<h2 class="hand" tabindex="-1">write to me!</h2>
        <p class="letter-email hand">${esc(email)}</p>
        <p class="letter-actions">
          <button type="button" class="paper-button hand primary" data-act="copy">copy</button>
          <a class="paper-button hand" href="mailto:${esc(email)}">send an email</a>
        </p>
        <button type="button" class="paper-tab hand" data-act="close">fold it back up</button>`,
        { className: 'letter', onClose, focus: 'heading' },
      )
      const button = node.querySelector('[data-act="copy"]')
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(email)
          button.textContent = 'copied!'
        } catch {
          const range = document.createRange()
          range.selectNodeContents(node.querySelector('.letter-email'))
          getSelection().removeAllRanges()
          getSelection().addRange(range)
          button.textContent = 'selected: copy it'
        }
      })
    },

    // the business card that pops up out of its holder
    card({ name, url, onClose }) {
      sheet(
        'card',
        `<h2 class="hand" tabindex="-1">linkedin</h2>
        <p class="hand card-name">${esc(name)}</p>
        <p><a class="paper-button hand primary" href="${esc(url)}" target="_blank" rel="noopener">open linkedin →</a></p>
        <button type="button" class="paper-tab hand" data-act="close">put it back</button>`,
        { className: 'business-card', onClose, focus: 'heading' },
      )
    },

    // the report card the pennants pull down
    report({ education, onClose }) {
      sheet(
        'report',
        `<h2 class="hand" tabindex="-1">report card</h2>
        <dl class="report-list">
          ${education
            .map(
              (e) => `<div><dt class="hand">${esc(e.school)}</dt><dd>${say(e.what)}</dd><dd class="report-when">${say(e.when)}</dd></div>`,
            )
            .join('')}
        </dl>
        <button type="button" class="paper-tab hand" data-act="close">roll it back up</button>`,
        { className: 'report', onClose, focus: 'heading' },
      )
    },

    // the two sheet-music frames out of the violin case
    music({ pieces, files, onClose }) {
      const node = sheet(
        'music',
        `<h2 class="hand sr-only" tabindex="-1">music</h2>
        <div class="music-frames">
          ${pieces
            .map(
              (m) => `<figure class="music-frame">
                <figcaption class="hand">${esc(m.label)}</figcaption>
                ${files.includes(m.video) ? `<video controls playsinline preload="none" data-src="${esc(m.video)}" aria-label="${esc(m.label)}"></video>` : `<p class="music-soon hand">her ${esc(m.label)} video is on its way</p>`}
              </figure>`,
            )
            .join('')}
        </div>
        <button type="button" class="paper-button hand" data-act="close">put it away</button>`,
        { className: 'music', onClose, focus: 'heading' },
      )
      for (const video of node.querySelectorAll('video[data-src]')) {
        video.src = base + video.dataset.src
        video.muted = !sound.on
        open.media.push(video)
      }
    },

    // on a phone: the pinboard as a grid you can scroll
    grid({ places, thumbs, onPick, onClose }) {
      const node = sheet(
        'grid',
        `<h2 class="hand" tabindex="-1">${esc(places.length)} cities and counting</h2>
        <ul class="board-grid">
          ${places.map((p, i) => `<li><button type="button" data-i="${i}" aria-label="${esc(p.city)}"><img alt="" src="${thumbs[i] || ''}"></button></li>`).join('')}
        </ul>
        <button type="button" class="paper-tab hand" data-act="close">close</button>`,
        { className: 'grid', onClose, focus: 'heading' },
      )
      node.querySelector('.board-grid').addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]')
        if (b) onPick(Number(b.dataset.i))
      })
    },

    toast(text) {
      toaster.textContent = text
      toaster.hidden = false
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => (toaster.hidden = true), 2600)
    },

    // her links, in plain words, along the bottom of the room
    links(on, contact = [], cv = null) {
      strip.hidden = !on
      if (!on || strip.childElementCount) return
      const items = contact
        .filter((c) => c.href && !isTodo(c.value))
        .map((c) => `<a href="${esc(c.href)}"${c.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(c.label.toLowerCase())}</a>`)
      if (cv) items.push(`<a href="${esc(base + cv)}" download>cv</a>`)
      strip.innerHTML = items.join('<span aria-hidden="true"> · </span>')
    },
  }
  return api
}
