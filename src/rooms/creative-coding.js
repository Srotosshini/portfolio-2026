// Creative coding: the paper gallery.
// A corridor of paintings that never stop moving: each one is a sketch of hers,
// newest at the entrance, older work further along, where the paper has
// yellowed. Drag, swipe or scroll to walk along it; tap a painting to open it
// big and play with it live. A paper doodle of her walks along with the
// pointer, waves when nobody moves, and points at the painting in front of you.
//
// The gallery wall is one long strip that slides past inside the box (the
// box's side walls hide where it goes), so the corridor can be any length.
import * as THREE from 'three'
import { sketches, words } from '../data/sketches.js'
import { site } from '../data/projects.js'
import { PALETTE as P, makePiece, makeFlat, texture, softShadow, stack, popUp, foldFlat, rng } from '../lib/paper.js'
import * as drawn from '../lib/placeholders.js'
import { art, files, base, turn } from '../lib/assets.js'
import { preview, standIn, standInCode } from '../lib/sketches.js'
import { isTodo } from '../lib/pages.js'

const SPACING = 1.5 // from one painting to the next
const PAINT = { w: 1.0, h: 0.75 } // the moving picture
const FRAME_W = PAINT.w * (300 / 258) // its paper frame: the drawing's opening is 258 of its 300
const FRAME_H = FRAME_W * (236 / 300)
const RAIL = 2.3 // the picture rail, above the floor
const HANG = 0.36 // from the rail down to the top of a frame
const START = -SPACING // where the newest painting hangs when you arrive (with two more beside it)
const DOODLE_Z = -0.95
const NOTE_Z = -0.42
const SEEN = 'gallery-walked' // remembered once a visitor has walked: the floor note stays gone

const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2
const stored = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const store = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export async function build({ box, stepped, overlay, redraw, goTo, lights }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)

  const rand = rng(23)
  const lerp = THREE.MathUtils.lerp
  const clamp = THREE.MathUtils.clamp
  const count = sketches.length
  const tints = Object.values(P.highlighter)
  const scrollMax = Math.max(0, (count - 3) * SPACING)
  // how old each painting's stretch of corridor looks, 0 (new) to 1 (the far end)
  const ageOf = (i) => (count > 1 ? Math.pow(clamp(i / (count - 1), 0, 1), 1.3) : 0)
  const yearOf = (s) => (String(s.date).match(/\d{4}/) || [''])[0]
  const has = (path) => !!path && files.includes(path)
  const livePage = (s) => `sketches/${s.slug}/index.html`

  // ---- the corridor only shows between the box's side walls --------------------
  const clipLeft = new THREE.Plane()
  const clipRight = new THREE.Plane()
  const clip = [clipLeft, clipRight]
  function placeClip() {
    box.body.updateWorldMatrix(true, false)
    const m = box.body.matrixWorld
    clipLeft.setFromNormalAndCoplanarPoint(new THREE.Vector3(1, 0, 0).transformDirection(m), new THREE.Vector3(-inner.w / 2, 0, 0).applyMatrix4(m))
    clipRight.setFromNormalAndCoplanarPoint(new THREE.Vector3(-1, 0, 0).transformDirection(m), new THREE.Vector3(inner.w / 2, 0, 0).applyMatrix4(m))
  }
  const clipped = (material) => {
    material.clippingPlanes = clip
    material.clipShadows = true
    return material
  }

  const strip = new THREE.Group() // the long gallery wall and everything hung on it
  strip.position.z = inner.back + 0.015
  room.add(strip)

  // the wall itself, a stretch per painting plus one at each end
  for (let i = -1; i <= count; i++) {
    await turn()
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(SPACING + 0.004, inner.h),
      clipped(new THREE.MeshLambertMaterial({ map: texture(drawn.wallSegment(ageOf(i), 40 + i)) })),
    )
    wall.position.set(i * SPACING, inner.h / 2, 0)
    wall.receiveShadow = true
    strip.add(wall)
  }

  // a sign taped to the wall wherever the year changes
  const signs = []
  for (let i = 1; i < count; i++) {
    const year = yearOf(sketches[i])
    if (!year || year === yearOf(sketches[i - 1])) continue
    const sign = makeFlat(await art(`drawings/year-${year}`, (seed) => drawn.tape(year, seed, { width: 300 }), { edge: 0 }), { height: 0.2 })
    clipped(sign.mesh.material)
    sign.mesh.castShadow = false
    sign.mesh.position.set((i - 0.5) * SPACING, RAIL - 0.2, 0.01)
    sign.mesh.rotation.z = (rand() - 0.5) * 0.12
    strip.add(sign.mesh)
    signs.push(sign)
  }

  // ---- the paintings ---------------------------------------------------------------
  const unit = new THREE.PlaneGeometry(1, 1)
  const holeLook = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending })
  const stringLook = clipped(new THREE.MeshBasicMaterial({ color: P.navy }))
  const backLook = clipped(new THREE.MeshLambertMaterial({ color: '#b48a5c', side: THREE.BackSide }))
  const yellowed = new THREE.Color('#e9d9a8')

  const paintings = await Promise.all(
    sketches.map(async (s, i) => {
      const age = ageOf(i)
      const tint = s.colors?.[0] || tints[i % tints.length]
      const [frameArt, tagArt] = await Promise.all([
        art('drawings/gallery-frame', (seed) => drawn.galleryFrame(age, seed + i * 7), { edge: 0 }),
        art(`drawings/date-${s.slug}`, (seed) => drawn.dateTag(s.date, seed + i), { edge: 0, tracings: 1 }),
      ])
      const hang = new THREE.Group() // hooked on the rail: it sways from here
      hang.position.set(i * SPACING, RAIL, 0.04)
      hang.visible = false // hung when the room is opened
      const lean = new THREE.Group() // the top edge of the frame: it leans out from here
      lean.position.y = -HANG
      const flip = new THREE.Group() // the middle of the frame: it turns over about here
      flip.position.y = -FRAME_H / 2
      hang.add(lean)
      lean.add(flip)
      strip.add(hang)

      // (Nothing on the wall casts a real shadow: the wall slides as you walk,
      // and redrawing shadows every frame would stall a modest graphics chip.
      // Each frame carries its own soft shadow instead.)
      const frame = makeFlat(frameArt, { width: FRAME_W })
      clipped(frame.mesh.material)
      frame.mesh.material.color.lerp(yellowed, age * 0.5) // even her own frame drawing yellows with age
      frame.mesh.position.z = 0.006
      frame.mesh.castShadow = false
      const shade = softShadow(FRAME_W * 1.18, FRAME_H * 1.2, 0.3)
      shade.rotation.x = 0
      clipped(shade.material)
      shade.position.set(0.035, -FRAME_H / 2 - 0.05, -0.03)
      lean.add(shade)
      const picture = new THREE.Mesh(unit, clipped(new THREE.MeshLambertMaterial({ color: '#2a2a32' })))
      picture.scale.set(PAINT.w * 1.02, PAINT.h * 1.02, 1)
      const back = new THREE.Mesh(unit, backLook) // the back of the canvas, seen when it is turned over
      back.scale.set(FRAME_W, FRAME_H, 1)
      back.position.z = -0.004
      flip.add(picture, frame.mesh, back)

      // two strings from the hook to the top corners of the frame
      for (const side of [-1, 1]) {
        const length = Math.hypot(FRAME_W * 0.36, HANG)
        const string = new THREE.Mesh(new THREE.PlaneGeometry(0.012, length), stringLook)
        string.position.set((side * FRAME_W * 0.36) / 2, -HANG / 2, -0.002)
        string.rotation.z = side * Math.atan2(FRAME_W * 0.36, HANG)
        hang.add(string)
      }

      const tag = makeFlat(tagArt, { width: 0.34 })
      clipped(tag.mesh.material)
      tag.mesh.castShadow = false
      tag.mesh.position.set(FRAME_W / 2 - 0.14, -FRAME_H - 0.06, 0.012)
      tag.mesh.rotation.z = -0.12 + rand() * 0.08
      lean.add(tag.mesh)

      // the placard: folded up behind the frame until the painting is the one in front of you
      const placardHinge = new THREE.Group()
      placardHinge.position.set(0, -FRAME_H - 0.015, -0.012)
      placardHinge.rotation.x = Math.PI
      lean.add(placardHinge)

      const corners = (object, w, h) => {
        const c = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
        return () => {
          c[0].set(-w / 2, -h / 2, 0)
          c[1].set(w / 2, -h / 2, 0)
          c[2].set(-w / 2, h / 2, 0)
          c[3].set(w / 2, h / 2, 0)
          for (const p of c) object.localToWorld(p)
          return c
        }
      }
      return {
        s, i, age, tint, hang, lean, flip, frame, picture, tag, placardHinge,
        placard: null,
        leaning: 0, // which lean move is the latest
        carding: 0, // which placard move is the latest
        look: null, // what plays on the wall: { tex, video } or { tex, still }
        x: 0,
        phase: rand() * 6,
        frameCorners: corners(flip, FRAME_W, FRAME_H),
        pictureCorners: corners(flip, PAINT.w, PAINT.h),
        spot: null,
      }
    }),
  )

  // What plays on the wall: her loop, or a stand-in. Only the ones near you
  // load their video; the rest stay still and light.
  function lookAt(p) {
    if (p.look) return
    if (has(p.s.loop)) {
      const video = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'auto' })
      video.src = base + p.s.loop
      video.play().catch(() => {})
      const tex = new THREE.Texture(video)
      tex.colorSpace = THREE.SRGBColorSpace
      p.look = { tex, video }
    } else {
      const still = preview(p.i, p.tint)
      for (let k = 0; k < 12; k++) still.step(k / 12) // let it get going
      p.look = { tex: texture(still.node), still }
    }
    p.picture.material.map = p.look.tex
    p.picture.material.color.set(0xffffff)
    p.picture.material.needsUpdate = true
  }
  function lookAway(p) {
    if (!p.look?.video) return // stand-ins are cheap: they stay
    p.look.video.pause()
    p.look.video.removeAttribute('src')
    p.look.video.load()
    p.look.tex.dispose()
    p.look = null
    p.picture.material.map = null
    p.picture.material.color.set('#2a2a32')
    p.picture.material.needsUpdate = true
  }

  // ---- the doodle guide ---------------------------------------------------------------
  const POSES = ['stand', 'wave', 'point', 'jump']
  const poseArt = Object.fromEntries(
    await Promise.all(POSES.map(async (pose) => [pose, await art(`drawings/doodle-${pose}`, (seed) => drawn.doodle(pose, seed), { trim: false })])),
  )
  const guide = makePiece(poseArt.stand, { height: 0.62 })
  guide.group.position.set(0, 0, DOODLE_Z)
  room.add(guide.group)
  const poseMaps = Object.fromEntries(POSES.map((pose) => [pose, poseArt[pose].map((prep) => texture(prep.front))]))
  // paint from the paintings she has visited, lying over her
  const splashLook = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
  const splashMesh = new THREE.Mesh(new THREE.PlaneGeometry(guide.width, guide.height).translate(0, guide.height / 2, 0), splashLook)
  splashMesh.position.z = 0.003
  guide.hinge.add(splashMesh)
  const visited = (stored('gallery-splashes') || '').split(',').filter((slug) => sketches.some((s) => s.slug === slug))
  function paintSplash() {
    const colors = visited.map((slug) => {
      const at = sketches.findIndex((s) => s.slug === slug)
      return sketches[at].colors?.[0] || tints[at % tints.length]
    })
    splashMesh.visible = colors.length > 0
    if (!colors.length) return
    splashLook.map?.dispose()
    splashLook.map = texture(drawn.splash(colors))
    splashLook.needsUpdate = true
  }
  paintSplash()

  const doodle = { x: 0, target: 0, pose: 'stand', tracing: 0, facing: 1, still: 0, busy: false, step: 0 }
  function setPose(pose) {
    doodle.pose = pose
    guide.face.material.map = poseMaps[pose][doodle.tracing % poseMaps[pose].length]
  }
  function face(dir) {
    doodle.facing = dir
    guide.group.scale.x = dir
  }

  // ---- the note on the floor ------------------------------------------------------------
  const noteArt = await art('drawings/floor-note', (seed) => drawn.floorNote(words.howTo, seed), { edge: 0, tracings: 1 })
  const note = makeFlat(noteArt, { width: 1.25 })
  const notePivot = new THREE.Group() // its bottom edge, taped to the floor; it leans back from here
  notePivot.position.set(0.25, 0.004, NOTE_Z)
  notePivot.rotation.x = -1.05
  note.mesh.position.y = note.height / 2
  notePivot.add(note.mesh)
  room.add(notePivot)
  let walked = stored(SEEN) === '1'
  notePivot.visible = !walked
  // the first drag or tap peels it off, and it falls out of the box
  function peel() {
    if (walked) return
    walked = true
    store(SEEN, '1')
    stepped
      .poses(
        [[-0.8, 0, 0], [-0.4, 0.02, 0.02], [0.1, 0.06, 0.08], [0.6, 0.02, 0.2], [1.1, -0.12, 0.36], [1.5, -0.4, 0.5], [1.7, -0.8, 0.62]],
        ([angle, y, z]) => {
          notePivot.rotation.x = -1.05 + angle
          notePivot.position.y = 0.004 + y
          notePivot.position.z = NOTE_Z + z
        },
      )
      .then(() => (notePivot.visible = false))
  }

  // ---- walking the corridor ------------------------------------------------------------
  let scroll = 0
  let aim = 0
  let vel = 0
  let dragging = false
  let glide = null
  let wheeled = 0
  const samples = []
  let standing = false
  let hovered = null
  let featured = null
  let opened = null

  const xOf = (p) => START - scroll + p.i * SPACING // where a painting hangs now, across the box
  const nearest = () => clamp(Math.round(1 + scroll / SPACING), 0, count - 1)
  const inView = (p, margin = 0) => Math.abs(p.x) < inner.w / 2 + PAINT.w / 2 + margin

  function layout() {
    strip.position.x = START - scroll
    for (const p of paintings) {
      p.x = xOf(p)
      if (Math.abs(p.x) < inner.w / 2 + SPACING) lookAt(p)
      else if (Math.abs(p.x) > inner.w / 2 + SPACING * 2.5) lookAway(p)
    }
    if (hovered == null && !opened) feature(paintings[nearest()])
    filmstrip.querySelectorAll('button').forEach((b, i) => b.toggleAttribute('aria-current', paintings[i] === featured))
  }

  // glide to put painting i in the middle
  function walkTo(i) {
    const to = clamp((i - 1) * SPACING, 0, scrollMax)
    vel = 0
    if (stepped.reduced || Math.abs(to - scroll) < 0.001) {
      scroll = aim = to
      glide = null
      layout()
      redraw()
      return Promise.resolve()
    }
    return new Promise((done) => {
      glide = { from: scroll, to, t: 0, duration: Math.min(1.2, 0.35 + (0.1 * Math.abs(to - scroll)) / SPACING), done }
    })
  }

  // A painting's lean and its placard each move through a list of poses; a
  // newer move takes over from one still going, so a quick slide past
  // several paintings never leaves two placards down.
  function leanTo(p, poses) {
    const mine = ++p.leaning
    stepped.poses(poses, (a) => mine === p.leaning && (p.lean.rotation.x = a))
  }
  function placardTo(p, poses) {
    const mine = ++p.carding
    stepped.poses(poses, (a) => mine === p.carding && (p.placardHinge.rotation.x = a))
  }
  const PLACARD_UP = [1.2, 2.2, Math.PI]

  // the painting in front of you leans out a little, and its placard flips down
  function feature(p) {
    if (p === featured) return
    const before = featured
    featured = p
    if (before) {
      leanTo(before, [-0.05, -0.02, 0])
      placardTo(before, PLACARD_UP)
    }
    if (!p) return
    if (!p.placard) {
      const line = isTodo(p.s.oneLiner) ? '' : p.s.oneLiner
      const sheet = drawn.galleryLabel({ title: p.s.title, line, date: p.s.date, uses: p.s.uses }, p.i + 3)
      p.placard = makeFlat([{ front: sheet, back: sheet, aspect: sheet.width / sheet.height }], { width: 0.76 })
      clipped(p.placard.mesh.material)
      p.placard.mesh.castShadow = false
      p.placard.mesh.position.y = -p.placard.height / 2
      p.placardHinge.add(p.placard.mesh)
    }
    leanTo(p, [-0.04, -0.09, -0.07])
    placardTo(p, [2.4, 1.6, 0.8, 0.2, -0.1, 0])
  }

  // ---- the timeline strip: every sketch, newest on the left ------------------------------
  const filmstrip = document.createElement('nav')
  filmstrip.className = 'filmstrip'
  filmstrip.setAttribute('aria-label', words.timeline)
  filmstrip.hidden = true
  for (const p of paintings) {
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('aria-label', `${p.s.title}, ${p.s.date}`)
    const still = files.find((f) => f.startsWith(`sketches/${p.s.slug}/still.`))
    if (still) {
      const img = Object.assign(document.createElement('img'), { src: base + still, alt: '', loading: 'lazy' })
      button.append(img)
    } else {
      const thumb = preview(p.i, p.tint, 112, 84)
      for (let k = 0; k < 40; k++) thumb.step(k / 12)
      button.append(thumb.node)
    }
    button.addEventListener('click', () => {
      peel()
      walkTo(p.i).then(() => feature(p))
    })
    filmstrip.append(button)
  }
  document.body.append(filmstrip)

  // ---- the opened painting's paper buttons, notes and cards -----------------------------
  const ui = document.createElement('div')
  ui.className = 'gallery-ui'
  ui.hidden = true
  ui.innerHTML = `
    <p class="gallery-title hand"></p>
    <p class="gallery-hint hand" aria-live="polite"></p>
    <p class="gallery-label hand" hidden></p>
    <div class="gallery-buttons">
      <button type="button" class="paper-button hand" data-act="back"></button>
      <button type="button" class="paper-button hand" data-act="flip"></button>
      <button type="button" class="paper-button hand" data-act="learned"></button>
    </div>
    <div class="ask-card" role="dialog" hidden>
      <canvas class="ask-icon" width="120" height="120" aria-hidden="true"></canvas>
      <p class="hand ask-words"></p>
      <p class="hand ask-question"></p>
      <p class="ask-buttons">
        <button type="button" class="paper-button hand" data-act="allow"></button>
        <button type="button" class="paper-button hand" data-act="video"></button>
      </p>
    </div>
    <section class="code-sheet" hidden>
      <button type="button" class="paper-tab hand" data-act="unflip"></button>
      <pre><code></code></pre>
      <p class="code-editor" hidden><a class="hand" target="_blank" rel="noopener"></a></p>
    </section>
    <section class="learned-note" hidden>
      <button type="button" class="paper-tab hand" data-act="unlearn"></button>
      <div class="learned-body"></div>
    </section>`
  const $ = (selector) => ui.querySelector(selector)
  $('[data-act=back]').textContent = words.back
  $('[data-act=flip]').textContent = words.flip
  $('[data-act=learned]').textContent = words.learned
  $('[data-act=allow]').textContent = words.yes
  $('[data-act=video]').textContent = words.justVideo
  $('[data-act=unflip]').textContent = words.flipBack
  $('[data-act=unlearn]').textContent = words.putBack
  $('.code-editor a').textContent = words.editor
  document.body.append(ui)
  ui.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'back') goTo(`#/${box.id}`)
    else if (act === 'flip') flipOver()
    else if (act === 'unflip') flipBack()
    else if (act === 'learned') showLearned(true)
    else if (act === 'unlearn') showLearned(false)
    else if (act === 'allow') answer(true)
    else if (act === 'video') answer(false)
  })

  let hintTimer = 0
  function hint(text) {
    const node = $('.gallery-hint')
    clearTimeout(hintTimer)
    node.textContent = text || ''
    node.classList.toggle('is-shown', !!text)
    if (text) hintTimer = setTimeout(() => node.classList.remove('is-shown'), 3000)
  }
  function label(text) {
    const node = $('.gallery-label')
    node.hidden = !text
    node.textContent = text || ''
  }

  // what runs in the opened frame: the live sketch, its video, or a stand-in
  let mounted = null
  function mount(p, kind) {
    unmount()
    let node
    let stop = () => {}
    if (kind === 'live' && has(livePage(p.s))) {
      node = document.createElement('iframe')
      node.src = base + livePage(p.s)
      node.title = p.s.title
      node.allow = 'microphone; camera; fullscreen; autoplay'
    } else if (kind === 'video' && has(p.s.loop)) {
      node = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, autoplay: true, src: base + p.s.loop })
      node.setAttribute('aria-label', p.s.title)
      node.play().catch(() => {})
    } else {
      // nothing of hers here yet: a stand-in, live, so the frame is never empty
      const running = standIn(p.i, p.tint)
      node = running.node
      stop = running.stop
    }
    mounted = { p, node, stop }
    p.picture.material = holeLook
    overlay.pin(node, p.pictureCorners)
    redraw()
  }
  function unmount() {
    if (!mounted) return
    mounted.stop()
    overlay.unpin(mounted.node)
    mounted.p.picture.material = mounted.p.pictureLook
    mounted = null
    redraw()
  }

  const camera = (uses) => uses.find((u) => u === 'mic' || u === 'camera' || u === 'hand')
  function begin(p) {
    const { uses } = p.s
    label('')
    if (uses.includes('arduino')) {
      label(words.arduino)
      return mount(p, 'video')
    }
    if (uses.includes('llm')) {
      label(words.llm)
      return mount(p, 'video')
    }
    const asks = camera(uses)
    if (asks) {
      // ask first: a paper card, with a doodle of what it needs
      const card = $('.ask-card')
      const icon = $('.ask-icon').getContext('2d')
      icon.clearRect(0, 0, 120, 120)
      drawn.useIcon(icon, asks, 60, 60, 96, p.i + 1)
      $('.ask-words').textContent = words.asks[asks]
      $('.ask-question').textContent = words.allow[asks]
      card.hidden = false
      $('[data-act=allow]').focus({ preventScroll: true })
      return
    }
    mount(p, 'live')
    hint(words.hints[uses.find((u) => words.hints[u]) || 'mouse'])
  }
  function answer(yes) {
    if (!opened) return
    $('.ask-card').hidden = true
    if (yes) {
      mount(opened, 'live')
      hint(words.hints[camera(opened.s.uses)])
    } else mount(opened, 'video')
    $('[data-act=back]').focus({ preventScroll: true })
  }

  // turn the painting over: its code, on lined paper
  let flipped = false
  async function flipOver() {
    if (!opened || flipped) return
    flipped = true
    const p = opened
    if (mounted) mounted.node.style.visibility = 'hidden'
    p.picture.material = p.pictureLook
    await stepped.poses([0.4, 1.0, 1.7, 2.4, 2.95, Math.PI], (a) => (p.flip.rotation.y = a))
    const sheet = $('.code-sheet')
    const code = sheet.querySelector('code')
    code.textContent = '…'
    sheet.hidden = false
    const link = $('.code-editor')
    link.hidden = !p.s.editorUrl
    link.querySelector('a').href = p.s.editorUrl || '#'
    let text = null
    if (has(p.s.code)) text = await fetch(base + p.s.code).then((r) => (r.ok ? r.text() : null), () => null)
    if (text == null) text = site.placeholders ? standInCode(p.i) : ''
    code.textContent = text
    sheet.querySelector('[data-act=unflip]').focus({ preventScroll: true })
  }
  async function flipBack() {
    if (!opened || !flipped) return
    const p = opened
    $('.code-sheet').hidden = true
    await stepped.poses([2.9, 2.2, 1.4, 0.7, 0.2, 0], (a) => (p.flip.rotation.y = a))
    flipped = false
    if (mounted?.p === p) {
      p.picture.material = holeLook
      mounted.node.style.visibility = ''
      redraw()
    }
    $('[data-act=flip]').focus({ preventScroll: true })
  }

  // what she learned: a taped note with a paragraph and a few process pictures
  function showLearned(on) {
    const note = $('.learned-note')
    if (!on) {
      note.classList.remove('is-up')
      setTimeout(() => (note.hidden = true), stepped.reduced ? 0 : 340)
      $('[data-act=learned]').focus({ preventScroll: true })
      return
    }
    const s = opened?.s
    if (!s) return
    const esc = (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
    const paragraph = isTodo(s.learned) ? (site.placeholders ? `<p class="todo">${esc(s.learned.replace(/^TODO:\s*/, ''))}</p>` : '') : `<p>${esc(s.learned)}</p>`
    const pictures = (s.process || [])
      .filter((pic) => has(pic.src))
      .map((pic) => `<img src="${base}${esc(pic.src)}" alt="${isTodo(pic.alt) ? '' : esc(pic.alt)}" loading="lazy">`)
      .join('')
    note.querySelector('.learned-body').innerHTML = `<h2 class="hand">${esc(s.title)}</h2>${paragraph}${pictures ? `<div class="learned-pictures">${pictures}</div>` : ''}`
    note.hidden = false
    void note.offsetWidth
    note.classList.add('is-up')
    note.querySelector('[data-act=unlearn]').focus({ preventScroll: true })
  }

  // ---- buttons over the paintings --------------------------------------------------------
  for (const p of paintings) {
    p.pictureLook = p.picture.material
    p.spot = overlay.addSpot({
      group: box.id,
      label: `${p.s.title}, ${p.s.date}`,
      corners: p.frameCorners,
      visible: () => standing && !opened && Math.abs(p.x) < inner.w / 2 - 0.25,
      onClick() {
        peel()
        goTo(`#/${box.id}/${p.s.slug}`)
      },
      onHover(on) {
        if (opened) return
        hovered = on ? p : null
        feature(on ? p : paintings[nearest()])
      },
    })
  }

  // ---- the stop-motion clock: sway, previews, the doodle --------------------------------
  // paintings sway on their strings, and every picture on the wall moves on
  stepped.every(1, (frame) => {
    if (!standing) return false
    for (const p of paintings) {
      if (!inView(p)) continue
      if (frame % 2 === 0) p.hang.rotation.z = Math.sin(frame * 0.26 + p.phase) * 0.012
      if (opened === p && mounted) continue
      if (p.look?.video) {
        if (p.look.video.readyState >= 2) p.look.tex.needsUpdate = true
      } else if (p.look?.still) {
        p.look.still.step(frame / 12)
        p.look.tex.needsUpdate = true
      }
    }
    return 'looks'
  })

  // the doodle: walks after the pointer, waves when nothing moves, points at the painting in front
  stepped.every(1, () => {
    if (!standing || doodle.busy || opened) return false // (while a painting is open she sits on its frame)
    const dx = doodle.target - doodle.x
    let moved = false
    if (Math.abs(dx) > 0.03) {
      const step = clamp(dx, -0.075, 0.075)
      doodle.x += step
      face(Math.sign(step))
      doodle.step++
      guide.group.position.set(doodle.x, doodle.step % 2 ? 0.025 : 0, DOODLE_Z) // a little bob with each step
      setPose('stand')
      moved = true
    } else {
      guide.group.position.y = 0
      doodle.still++
      const there = featured ? featured.x - doodle.x : 0
      if (doodle.still > 36) setPose('wave')
      else if (featured && Math.abs(there) > 0.3) {
        face(Math.sign(there))
        setPose('point')
      } else setPose('stand')
    }
    if (moved) doodle.still = 0
    return moved ? undefined : 'looks'
  })
  // and her lines boil, like every drawing here
  stepped.every(3, () => {
    if (!standing) return false
    doodle.tracing++
    setPose(doodle.pose)
    return 'looks'
  })

  // a hop from where she is to `to` (room coordinates), shrinking or growing to `size`
  function hop(to, size) {
    const from = guide.group.position.clone()
    const scaleFrom = Math.abs(guide.group.scale.y)
    doodle.busy = true
    setPose('jump')
    return stepped
      .poses([0.1, 0.26, 0.45, 0.64, 0.82, 1], (t) => {
        guide.group.position.lerpVectors(from, to, t)
        guide.group.position.y += Math.sin(Math.PI * t) * 0.5
        const k = lerp(scaleFrom, size, t)
        guide.group.scale.set(k * doodle.facing, k, k)
      })
      .then(() => {
        setPose('stand')
        doodle.busy = false
      })
  }

  const byId = (slug) => paintings.find((p) => p.s.slug === slug)

  return {
    async open() {
      placeClip()
      scroll = aim = 0
      vel = 0
      glide = null
      opened = null
      featured = null
      hovered = null
      layout()
      filmstrip.hidden = false
      notePivot.visible = !walked
      if (!walked) {
        notePivot.rotation.x = -1.05
        notePivot.position.set(0.25, 0.004, NOTE_Z)
      }
      // the paintings drop onto their hooks, the nearest first
      const order = [...paintings].sort((a, b) => Math.abs(a.x) - Math.abs(b.x))
      order.forEach((p, k) => {
        p.hang.visible = true
        if (!inView(p, SPACING)) return (p.hang.position.y = RAIL)
        stepped.poses([RAIL + 0.7, RAIL + 0.35, RAIL + 0.06, RAIL - 0.05, RAIL + 0.02, RAIL], (y) => (p.hang.position.y = y), { delay: k * 2 })
      })
      // and she stands up, in the middle
      doodle.x = doodle.target = 0
      face(1)
      guide.group.scale.set(1, 1, 1)
      guide.group.position.set(0, 0, DOODLE_Z)
      const pieces = stack([guide])
      await popUp(stepped, pieces)
      standing = true
      layout()
    },
    async close() {
      standing = false
      filmstrip.hidden = true
      for (const p of paintings) lookAway(p)
      await foldFlat(stepped, [guide]) // she folds down; the paintings stay hung
    },

    title: (slug) => byId(slug).s.title,
    spot: (slug) => byId(slug)?.spot,
    // while a painting is open, the camera frames it with a little room below for the buttons
    view(slug) {
      const c = byId(slug).frameCorners()
      const w = c[1].distanceTo(c[0])
      const h = c[2].distanceTo(c[0])
      const cx = (c[0].x + c[3].x) / 2
      const cy = (c[0].y + c[3].y) / 2
      return { cx, cy: cy - 0.13, w: w * 1.12, h: h * 1.1 + 0.34, z: c[0].z }
    },

    // before the camera moves in: bring it to the middle, and she hops into it
    async start(slug) {
      const p = byId(slug)
      peel()
      hovered = null
      await walkTo(p.i)
      feature(p)
      opened = p
      placardTo(p, PLACARD_UP) // its title goes on the frame instead, while it is open
      // she lands on the frame's bottom edge, small, to watch
      const corner = new THREE.Vector3(FRAME_W / 2 - 0.12, -FRAME_H / 2, 0.06)
      p.flip.localToWorld(corner)
      room.worldToLocal(corner)
      face(-1)
      await hop(corner, 0.42)
    },
    // once the camera has arrived: the sketch, its buttons, its hint
    show(slug) {
      const p = byId(slug)
      $('.gallery-title').textContent = p.s.title
      ui.hidden = false
      filmstrip.hidden = true
      begin(p)
      if ($('.ask-card').hidden) $('[data-act=back]').focus({ preventScroll: true })
    },
    hide() {
      unmount()
      clearTimeout(hintTimer)
      hint('')
      label('')
      $('.ask-card').hidden = true
      $('.code-sheet').hidden = true
      $('.learned-note').hidden = true
      $('.learned-note').classList.remove('is-up')
      ui.hidden = true
      if (flipped && opened) {
        opened.flip.rotation.y = 0
        flipped = false
      }
    },
    // back in the corridor: she hops down, with a splash of that painting's colours on her
    async end() {
      const p = opened
      opened = null
      filmstrip.hidden = false
      if (!p) return
      if (!visited.includes(p.s.slug)) {
        visited.push(p.s.slug)
        store('gallery-splashes', visited.join(','))
        paintSplash()
      }
      doodle.x = doodle.target = clamp(p.x, -inner.w / 2 + 0.4, inner.w / 2 - 0.4)
      await hop(new THREE.Vector3(doodle.x, 0, DOODLE_Z), 1)
      featured = null // so the painting in front leans out and drops its placard again
      layout()
    },

    // ---- hands on --------------------------------------------------------------------
    drag(dx) {
      if (!standing || opened) return
      peel()
      dragging = true
      glide = null
      aim = clamp(aim - dx, 0, scrollMax)
      samples.push([performance.now(), -dx])
      while (samples.length > 6) samples.shift()
      if (stepped.reduced) {
        scroll = aim
        layout()
        redraw()
      }
    },
    dragEnd() {
      dragging = false
      const now = performance.now()
      const recent = samples.filter(([t]) => now - t < 120)
      samples.length = 0
      vel = stepped.reduced || recent.length < 2 ? 0 : clamp(recent.reduce((sum, [, d]) => sum + d, 0) / ((now - recent[0][0]) / 1000 || 0.016), -12, 12)
    },
    wheel(delta) {
      if (!standing || opened) return
      peel()
      glide = null
      wheeled = performance.now()
      aim = clamp(aim + delta * 0.0035, 0, scrollMax)
    },
    pointer(fx) {
      if (!standing || opened) return
      doodle.target = lerp(-inner.w / 2 + 0.4, inner.w / 2 - 0.4, clamp(fx, 0, 1))
      doodle.still = 0
    },
    key(key, item) {
      if (item || !standing) return
      const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0
      if (step) walkTo(clamp(nearest() + step, 0, count - 1))
    },

    // Every frame: the walk along the corridor glides (it is the camera
    // walking, so it may be smooth; the paper itself still moves in steps).
    frame(dt) {
      if (!standing || opened) return false
      const before = scroll
      if (glide) {
        glide.t = Math.min(1, glide.t + dt / glide.duration)
        scroll = lerp(glide.from, glide.to, ease(glide.t))
        aim = scroll
        if (glide.t >= 1) {
          const { done } = glide
          glide = null
          done()
        }
      } else if (dragging) {
        scroll = aim
      } else if (Math.abs(vel) > 0.05) {
        aim = clamp(aim + vel * dt, 0, scrollMax)
        if (aim === 0 || aim === scrollMax) vel = 0
        vel *= Math.pow(0.03, dt)
        scroll += (aim - scroll) * Math.min(1, dt * 14)
      } else {
        vel = 0
        if (performance.now() - wheeled > 220) aim = clamp(Math.round(aim / SPACING) * SPACING, 0, scrollMax) // settle on a painting
        scroll += (aim - scroll) * Math.min(1, dt * 9)
        if (Math.abs(aim - scroll) < 0.0005) scroll = aim
      }
      if (scroll === before) return false
      layout()
      return true
    },
  }
}
