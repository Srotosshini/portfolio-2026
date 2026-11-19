// The paper overlays inside the Christmas market's stalls, in HTML over the
// scene: the case study note pinned in every stall, a viewer for a piece and
// its process photos, the classroom's workbook, the workshop's notes on its
// numbered tags, the card beside a jewellery piece on its stand, the
// magnifier, and the flurry of snow as you step in through a door.
import { site } from '../data/projects.js'
import { words } from '../data/design.js'
import { base } from './assets.js'
import { isTodo } from './pages.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
// finished words print as written; TODO words in pencil while placeholders show
const say = (s) => (!s ? '' : !isTodo(s) ? esc(s) : site.placeholders ? `<span class="todo">${esc(s.replace(/^TODO:\s*/, ''))}</span>` : '')
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

// A picture's address: a file of hers, or a stand-in canvas (made into a
// blob the first time it is wanted).
const blobs = new WeakMap()
export function urlFor(source) {
  if (!source) return Promise.resolve('')
  if (typeof source === 'string') return Promise.resolve(base + source)
  if (!blobs.has(source))
    blobs.set(source, new Promise((done) => source.toBlob((blob) => done(blob ? URL.createObjectURL(blob) : source.toDataURL()))))
  return blobs.get(source)
}

export function makeMarketUI({ reduced = () => false } = {}) {
  const el = document.createElement('div')
  el.className = 'market-ui'
  el.innerHTML = `
    <section class="market-sheet case-study" role="dialog" aria-modal="true" aria-labelledby="case-title" hidden>
      <p class="case-kicker hand">${esc(words.caseStudy)}</p>
      <h2 class="hand" id="case-title" tabindex="-1"></h2>
      <div class="case-body"></div>
      <button type="button" class="paper-button hand" data-act="close">${esc(words.close)}</button>
    </section>
    <section class="market-sheet viewer" role="dialog" aria-modal="true" aria-labelledby="viewer-title" hidden>
      <figure class="viewer-picture"><img alt=""></figure>
      <div class="viewer-words">
        <h2 class="hand" id="viewer-title" tabindex="-1"></h2>
        <p class="viewer-note"></p>
        <p class="viewer-label hand"></p>
        <ul class="viewer-strip"></ul>
        <button type="button" class="paper-button hand" data-act="close">${esc(words.close)}</button>
      </div>
    </section>
    <section class="market-sheet workbook" role="dialog" aria-modal="true" aria-labelledby="book-title" hidden>
      <h2 class="hand sr-only" id="book-title" tabindex="-1">${esc(words.workbook)}</h2>
      <div class="workbook-page"><img alt=""></div>
      <p class="workbook-turn">
        <button type="button" class="paper-button hand" data-act="prev">${esc(words.previous)}</button>
        <span class="workbook-count hand" aria-live="polite"></span>
        <button type="button" class="paper-button hand" data-act="next">${esc(words.next)}</button>
      </p>
      <button type="button" class="paper-button hand workbook-close" data-act="close">${esc(words.close)}</button>
    </section>
    <aside class="note-pop" role="dialog" aria-labelledby="note-title" hidden>
      <span class="note-n hand"></span>
      <h3 class="hand" id="note-title" tabindex="-1"></h3>
      <p></p>
      <button type="button" class="paper-tab hand" data-act="close">${esc(words.close)}</button>
    </aside>
    <aside class="piece-card" hidden>
      <h3 class="hand" tabindex="-1"></h3>
      <p class="piece-note"></p>
      <p class="piece-hint hand"></p>
      <button type="button" class="paper-button hand" data-act="put-back">${esc(words.putBack)}</button>
    </aside>
    <div class="loupe" aria-hidden="true" hidden></div>
    <div class="swirl" aria-hidden="true"></div>`
  document.body.append(el)
  const $ = (selector) => el.querySelector(selector)
  const sheets = { case: $('.case-study'), viewer: $('.viewer'), book: $('.workbook') }
  let open = null // the sheet that is out, if any
  let returnFocus = null
  let onPutBack = null
  let book = { pages: [], at: 0 }
  let shown = null // the viewer's pictures

  function showSheet(sheet, focus) {
    if (open && open !== sheet) open.hidden = true
    returnFocus = document.activeElement
    open = sheet
    sheet.hidden = false
    el.classList.add('is-modal')
    sheet.classList.remove('is-in')
    void sheet.offsetWidth
    sheet.classList.add('is-in')
    focus?.focus({ preventScroll: true })
  }
  function closeSheet() {
    if (!open) return false
    open.hidden = true
    open.classList.remove('is-in')
    open = null
    el.classList.remove('is-modal')
    returnFocus?.focus?.({ preventScroll: true })
    returnFocus = null
    return true
  }

  // the viewer: one big picture, its words, and a strip of the rest to pick from
  async function view(index) {
    const pic = shown.pictures[index]
    shown.at = index
    const img = $('.viewer-picture img')
    img.src = await urlFor(pic.source)
    img.alt = pic.alt && !isTodo(pic.alt) ? pic.alt : ''
    el.querySelectorAll('.viewer-strip button').forEach((b, i) => b.toggleAttribute('aria-current', i === index))
  }

  // the workbook: a page at a time, turned with a quick stop-motion flip
  async function turnTo(at) {
    if (!book.pages.length) return
    book.at = Math.max(0, Math.min(book.pages.length - 1, at))
    const page = book.pages[book.at]
    const node = $('.workbook-page')
    node.classList.remove('is-turning')
    void node.offsetWidth
    if (!reduced()) node.classList.add('is-turning')
    const img = node.querySelector('img')
    img.src = await urlFor(page.source)
    img.alt = page.alt && !isTodo(page.alt) ? page.alt : ''
    $('.workbook-count').textContent = words.page(book.at + 1, book.pages.length)
    $('[data-act=prev]').disabled = book.at === 0
    $('[data-act=next]').disabled = book.at === book.pages.length - 1
  }

  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'close') {
      if (e.target.closest('.note-pop')) ui.note(null)
      else closeSheet()
    } else if (act === 'prev') turnTo(book.at - 1)
    else if (act === 'next') turnTo(book.at + 1)
    else if (act === 'put-back') onPutBack?.()
    else if (e.target.closest('.viewer-strip button')) view(+e.target.closest('button').dataset.at)
  })
  addEventListener('keydown', (e) => {
    if (open === sheets.book && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) turnTo(book.at + (e.key === 'ArrowRight' ? 1 : -1))
  })

  const ui = {
    el,
    get modal() {
      return !!open
    },

    // the case study pinned up in a stall
    caseStudy(stall) {
      $('#case-title').textContent = stall.title
      const parts = [
        [words.problem, stall.caseStudy.problem],
        [words.made, stall.caseStudy.made],
        [words.how, stall.caseStudy.how],
        [words.learned, stall.caseStudy.learned],
      ]
        .map(([head, text]) => [head, say(text)])
        .filter(([, text]) => text)
      $('.case-body').innerHTML = parts.map(([head, text]) => `<h3 class="hand">${esc(head)}</h3><p>${text}</p>`).join('')
      showSheet(sheets.case, $('#case-title'))
    },

    // a piece, big: pictures = [{ source, alt }] (the first is the piece itself)
    viewer({ title, note, pictures, label = '', tint = '' }) {
      shown = { pictures, at: 0 }
      $('#viewer-title').innerHTML = say(title)
      const line = say(note)
      $('.viewer-note').innerHTML = line
      $('.viewer-note').hidden = !line
      $('.viewer-label').textContent = pictures.length > 1 ? label : ''
      const strip = $('.viewer-strip')
      strip.hidden = pictures.length < 2
      strip.innerHTML = ''
      pictures.forEach((pic, i) => {
        const li = document.createElement('li')
        li.innerHTML = `<button type="button" data-at="${i}" aria-label="${i + 1} / ${pictures.length}"><img alt=""></button>`
        urlFor(pic.source).then((url) => (li.querySelector('img').src = url))
        strip.append(li)
      })
      sheets.viewer.style.setProperty('--tint', tint || 'var(--card)')
      view(0)
      showSheet(sheets.viewer, $('#viewer-title'))
    },

    // the workbook, open at page `start`: pages = [{ source, alt }]
    workbook(pages, start = 0) {
      book = { pages, at: start }
      turnTo(start)
      showSheet(sheets.book, $('#book-title'))
    },

    // a numbered tag's note, beside it on screen ({ x, y } in pixels); null puts it away
    note(at, n, title, text) {
      const node = $('.note-pop')
      if (!at) {
        node.hidden = true
        return
      }
      node.querySelector('.note-n').textContent = n
      node.querySelector('h3').innerHTML = say(title)
      node.querySelector('p').innerHTML = say(text)
      node.hidden = false
      const w = node.offsetWidth
      const h = node.offsetHeight
      const x = Math.min(innerWidth - w - 12, Math.max(12, at.x + 24))
      const y = Math.min(innerHeight - h - 12, Math.max(12, at.y - h / 2))
      node.style.transform = `translate(${x}px, ${y}px) rotate(-1.5deg)`
      node.querySelector('h3').focus({ preventScroll: true })
    },
    get noteOpen() {
      return !$('.note-pop').hidden
    },

    // the card beside a jewellery piece on its stand (null puts it away)
    piece(item, { hint = '', putBack } = {}) {
      const card = $('.piece-card')
      if (!item) {
        card.hidden = true
        onPutBack = null
        return
      }
      card.querySelector('h3').innerHTML = say(item.title)
      const line = say(item.note)
      card.querySelector('.piece-note').innerHTML = line
      card.querySelector('.piece-note').hidden = !line
      card.querySelector('.piece-hint').textContent = hint
      onPutBack = putBack
      card.hidden = false
    },

    // the magnifier: a circle over the piece showing it closer. `rect` is the
    // piece on screen, `src` its picture; off when `src` is empty.
    loupe(x, y, rect, src) {
      const lens = $('.loupe')
      if (!src) {
        lens.hidden = true
        return
      }
      const zoom = 2.6
      lens.hidden = false
      lens.style.transform = `translate(${x - 70}px, ${y - 70}px)`
      lens.style.backgroundImage = `url("${src}")`
      lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`
      lens.style.backgroundPosition = `${70 - (x - rect.left) * zoom}px ${70 - (y - rect.top) * zoom}px`
    },

    // snow rushing past as you step in through a door
    async swirl() {
      if (reduced()) return
      const node = $('.swirl')
      node.innerHTML = ''
      for (let i = 0; i < 28; i++) {
        const flake = document.createElement('i')
        const a = Math.random() * Math.PI * 2
        const d = 0.6 + Math.random() * 0.6
        flake.style.setProperty('--x', `${Math.cos(a) * d * 60}vw`)
        flake.style.setProperty('--y', `${Math.sin(a) * d * 60}vh`)
        flake.style.setProperty('--s', (0.5 + Math.random()).toFixed(2))
        flake.style.animationDelay = `${(Math.floor(Math.random() * 4) * 0.083).toFixed(3)}s`
        node.append(flake)
      }
      node.classList.add('is-on')
      await sleep(900)
      node.classList.remove('is-on')
      node.innerHTML = ''
    },

    // Escape: put away whatever is out on top, if anything is
    escape() {
      if (!$('.note-pop').hidden) {
        ui.note(null)
        return true
      }
      return closeSheet()
    },
    closeAll() {
      closeSheet()
      ui.note(null)
      ui.piece(null)
      ui.loupe(0, 0, null, '')
    },
  }
  return ui
}
