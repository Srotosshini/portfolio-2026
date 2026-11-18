// HTML for project pages, About and the list view, all from one template.
// It runs in two places: in the browser, for the paper cards over the scene,
// and at build time, to bake list.html so it works with no JavaScript or WebGL.
// Keep it free of browser-only code.
import { site, boxes, projects, about, photos } from '../data/projects.js'

const TODO = /^TODO:\s*/
export const isTodo = (s) => typeof s === 'string' && TODO.test(s)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

// Finished text prints as written. Text still marked TODO prints in pencil,
// or not at all once site.placeholders is switched off.
function text(s) {
  if (!s) return ''
  if (!isTodo(s)) return esc(s)
  return site.placeholders ? `<span class="todo">${esc(s.replace(TODO, ''))}</span>` : ''
}
// For attributes and <title>: never leak a TODO.
const plain = (s) => (isTodo(s) ? '' : esc(s))

const slot = (what, path, tag = 'p') =>
  site.placeholders ? `<${tag} class="todo slot">${esc(what)} <code>public/${esc(path)}</code></${tag}>` : ''

// One project: pitch, role, tools, clip or build, process images, what she learned.
// `media: false` leaves the clip out (in the arcade it plays in the cabinet screen).
export function renderProject(p, { files = [], base = '', level = 2, media = true } = {}) {
  const has = (f) => !!f && files.includes(f)
  const L = site.labels
  const sub = `h${level + 1}`
  const out = [`<h${level} class="hand title" id="title-${p.id}" tabindex="-1">${text(p.title)}</h${level}>`]

  if (p.credit) out.push(`<p class="credit"><b>${esc(L.credit)}</b> ${text(p.credit)}</p>`)
  const pitch = text(p.pitch)
  if (pitch) out.push(`<p class="pitch">${pitch}</p>`)

  const tools = (p.tools || []).map(text).filter(Boolean).join(', ')
  const facts = [[L.role, text(p.role)], [L.tools, tools]].filter(([, value]) => value)
  if (facts.length)
    out.push(`<dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`)

  if (media) {
    if (has(p.clip)) {
      const poster = has(p.poster) ? ` poster="${base}${esc(p.poster)}"` : ''
      out.push(`<video class="clip" controls playsinline muted loop preload="none"${poster} src="${base}${esc(p.clip)}"></video>`)
    } else if (p.clip && !p.build) out.push(slot(L.clipSlot, p.clip))
  }
  // a playable build or a live sketch can always be opened full size, even
  // when it is already running in its cabinet or window
  if (p.build) out.push(`<p><a class="button hand" href="${esc(p.build)}">${esc(p.kind === 'sketch' ? L.runSketch : L.play)}</a></p>`)

  const shots = (p.process || [])
    .map((s) =>
      has(s.src)
        ? `<li><a href="${base}${esc(s.src)}"><img src="${base}${esc(s.src)}" alt="${plain(s.alt)}" loading="lazy" decoding="async"></a></li>`
        : slot('', s.src, 'li'),
    )
    .filter(Boolean)
  if (shots.length) out.push(`<${sub} class="hand">${esc(L.process)}</${sub}><ul class="process">${shots.join('')}</ul>`)

  const learned = text(p.learned)
  if (learned) out.push(`<${sub} class="hand">${esc(L.learned)}</${sub}><p>${learned}</p>`)

  const links = (p.links || []).filter((l) => l.href).map((l) => `<a href="${esc(l.href)}">${text(l.label)}</a>`)
  if (links.length) out.push(`<p class="links">${links.join(' ')}</p>`)
  return out.join('\n')
}

// Photography: every image in public/photos, in file-name order. If there are
// none yet, eight stand-ins so the reel can be tried out (unless placeholders
// are switched off, in which case the reel is simply empty).
export function photoList(files = []) {
  const found = files.filter((f) => /^photos\/[^/]+\.(jpe?g|png|webp|avif)$/i.test(f))
  if (found.length)
    return found.map((src) => {
      const id = src.slice('photos/'.length).replace(/\.[^.]+$/, '')
      const words = photos[id] || {}
      const thumb = files.find((f) => f.startsWith(`photos/thumbs/${id}.`)) || src
      return { id, src, thumb, caption: words.caption || '', alt: words.alt || '', real: true }
    })
  if (!site.placeholders) return []
  return Array.from({ length: 8 }, (_, i) => {
    const id = String(i + 1).padStart(2, '0')
    return { id, src: `photos/${id}.jpg`, thumb: null, caption: '', alt: '', real: false }
  })
}

// Is there a page for this address (#/box/id)?
export function itemExists(box, id, files = []) {
  if (projects.some((p) => p.box === box && p.id === id)) return true
  return box === 'photography' && photoList(files).some((p) => p.id === id)
}

// The caption slip for one photograph: which one it is, her words if she
// wrote any, and the way to the ones either side of it.
export function renderPhoto(photo, { list = [], base = '', level = 2, box = 'photography' } = {}) {
  const L = site.labels
  const at = list.indexOf(photo)
  const to = (p) => `#/${box}/${encodeURIComponent(p.id)}`
  const out = [
    `<h${level} class="hand title" id="title-photo" tabindex="-1">${esc(L.photo)} ${at + 1}<span class="of"> / ${list.length}</span></h${level}>`,
  ]
  if (photo.caption) out.push(`<p class="pitch">${text(photo.caption)}</p>`)
  if (photo.alt) out.push(`<p class="sr-only">${esc(photo.alt)}</p>`)
  if (!photo.real) out.push(slot(L.photoSlot, photo.src))
  const turn = []
  if (at > 0) turn.push(`<a class="button hand" rel="prev" href="${to(list[at - 1])}">${esc(L.previous)}</a>`)
  if (at < list.length - 1) turn.push(`<a class="button hand" rel="next" href="${to(list[at + 1])}">${esc(L.next)}</a>`)
  if (turn.length) out.push(`<p class="turn">${turn.join(' ')}</p>`)
  if (photo.real) out.push(`<p><a href="${base}${esc(encodeURI(photo.src))}">${esc(L.fullSize)}</a></p>`)
  return out.join('\n')
}

export function renderAbout({ files = [], base = '', level = 2 } = {}) {
  const has = (f) => !!f && files.includes(f)
  const L = site.labels
  const out = [`<h${level} class="hand title" id="title-about" tabindex="-1">${esc(about.title)}</h${level}>`]
  for (const para of about.bio.map(text).filter(Boolean)) out.push(`<p>${para}</p>`)
  out.push(
    has(about.cv)
      ? `<p><a class="button hand" href="${base}${esc(about.cv)}" download="${esc(site.name)}-CV.pdf">${esc(L.cv)}</a></p>`
      : slot(L.cv, about.cv),
  )
  const contact = about.contact
    .map((c) => {
      const value = c.href ? `<a href="${esc(c.href)}">${text(c.value)}</a>` : text(c.value)
      return value ? `<div><dt>${esc(c.label)}</dt><dd>${value}</dd></div>` : ''
    })
    .filter(Boolean)
  if (contact.length)
    out.push(`<h${level + 1} class="hand">${esc(L.contact)}</h${level + 1}><dl class="facts">${contact.join('')}</dl>`)
  return out.join('\n')
}

// The whole list view: every box in shelf order, then About.
export function renderList(files = []) {
  const rooms = boxes
    .filter((b) => b.id !== 'about')
    .map((b) => {
      const head = `<h2 class="hand">${esc(b.label)}</h2>`
      if (!b.built) return `<section class="room unbuilt">${head}<p class="hand note">${esc(site.ui.unbuilt)}</p></section>`
      const inBox = `<p class="see"><a class="hand" href="./#/${b.id}">${esc(site.ui.seeInBox)}</a></p>`
      if (b.id === 'photography') {
        const real = photoList(files).filter((p) => p.real)
        const prints = real.map((p) => {
          const caption = p.caption ? `<figcaption>${text(p.caption)}</figcaption>` : ''
          return `<li><figure><a href="${esc(encodeURI(p.src))}"><img src="${esc(encodeURI(p.thumb))}" alt="${esc(p.alt)}" loading="lazy" decoding="async"></a>${caption}</figure></li>`
        })
        const body = prints.length ? `<ul class="photos">${prints.join('')}</ul>` : slot(site.labels.photoSlot, 'photos/')
        return `<section class="room" id="${b.id}">${head}${body}${inBox}</section>`
      }
      const cards = projects
        .filter((p) => p.box === b.id)
        .map(
          (p) => `<article class="card" id="${p.id}">
${renderProject(p, { files, level: 3 })}
<p class="see"><a class="hand" href="./#/${b.id}/${p.id}">${esc(site.ui.seeInBox)}</a></p>
</article>`,
        )
      return `<section class="room" id="${b.id}">${head}${cards.join('\n')}</section>`
    })
  const me = `<section class="room"><article class="card" id="about">${renderAbout({ files })}</article></section>`
  return [...rooms, me].join('\n')
}

// Her handwriting font and her scanned papers, when the files exist.
function headStyle(files) {
  const find = (stem) => files.find((f) => f.startsWith(stem + '.'))
  const css = []
  const font = find('fonts/hand')
  if (font) css.push(`@font-face{font-family:"Shelf Hand";src:url("${font}");font-display:swap}`)
  const vars = [
    ['paper', 'textures/paper'],
    ['tape', 'textures/masking-tape'],
    ['index-card', 'textures/index-card'],
  ]
    .map(([name, stem]) => [name, find(stem)])
    .filter(([, file]) => file)
    .map(([name, file]) => `--tex-${name}:url("${file}")`)
  if (vars.length) css.push(`:root{${vars.join(';')}}`)
  return css.length ? `<style>${css.join('')}</style>` : ''
}

// Fills the {{tokens}} and <!--shoebox:…--> marks in index.html and list.html.
export function fillPage(html, { files = [], list = false } = {}) {
  const words = { ...site.ui, name: site.name, description: site.description, intro: site.intro }
  html = html.replace('<!--shoebox:head-->', headStyle(files))
  if (list) {
    const intro = text(site.intro)
    html = html.replace('<!--shoebox:intro-->', intro ? `<p class="intro">${intro}</p>` : '')
    html = html.replace('<!--shoebox:list-->', renderList(files))
  }
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => plain(words[key]))
}

export function countTodos() {
  const count = (v) =>
    typeof v === 'string' ? Number(isTodo(v)) : v && typeof v === 'object' ? Object.values(v).reduce((n, x) => n + count(x), 0) : 0
  return count(site) + count(projects) + count(about)
}
