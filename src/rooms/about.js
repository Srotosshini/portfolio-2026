// About: her room, in miniature.
// Her little camera stands on its tripod facing her (a doodle of her, drawn in
// marker), and on the wall beside it hangs a corkboard of polaroids. Over and
// over, on the shelf and inside: the camera's light blinks three times, it
// flashes, and a polaroid slides out of its top and slowly develops: her,
// somewhere else each time (the places are listed in data/projects.js). It
// flies to the corkboard and is pinned up. When the board is full the pins
// drop, the photos slip down behind the desk, and it fills up again.
// Clicking the box: one big flash, and the camera flies in; her About card
// (bio, CV, contact) opens beside the room.
import * as THREE from 'three'
import { about } from '../data/projects.js'
import { makePiece, makeFlat, texture, canvas, lightDot, boil, rng } from '../lib/paper.js'
import * as sketch from '../lib/placeholders.js'
import * as drawn from '../lib/polaroids.js'
import { art, files, base } from '../lib/assets.js'
import { renderAbout } from '../lib/pages.js'
import { loopClock, passed, smooth } from '../lib/loop.js'

// Where things are on the camera's drawing, as fractions of its width (from
// the left) and height (from the bottom): the countdown light, the flash, and
// the slot the photos come out of. Change these to fit your own drawing.
const LIGHT = { x: 0.545, y: 0.91 }
const FLASH = { x: 0.145, y: 0.91 }
const SLOT = { x: 0.548, y: 0.968 }

const PW = 0.24 // a polaroid, in scene units
const PH = PW * 1.2
const PINS = ['#e0483e', '#f2c544', '#4f86d9'] // pushpin colours (her own: pushpin-1.png, -2, -3)

// The loop, in seconds. Each photo's own times are counted from the start of
// the loop, or from when the board has cleared, if it was full.
const LOOP = 9
const CLEAR = 1.4 // the pins drop and the photos slip away, when the board is full
const BLINKS = [0, 0.6, 1.2] // the countdown light comes on, a quarter of a second each
const FLASH_AT = 1.8
const OUT = [2.1, 2.75] // the polaroid slides out of the top of the camera,
const DEVELOP = [2.75, 5.5] // develops, out of the white,
const FLY = [5.5, 6.4] // flies to the corkboard,
const PIN = 6.4 // and is pinned up

export async function build({ box, stepped, onShelf }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)
  const rand = rng(14)
  const places = (about.places || []).map((p) => String(p).trim()).filter(Boolean)
  const count = places.length
  const slotsOnBoard = Math.min(6, Math.max(3, count))

  // her drawings where they exist, labelled stand-ins where they do not
  const [doodleArt, cameraArt, corkArt, deskArt, pinArt] = await Promise.all([
    art('drawings/doodle', (seed) => sketch.doodle(seed)),
    art('drawings/selfie-camera', (seed) => drawn.selfieCamera(seed)),
    art('drawings/corkboard', (seed) => drawn.corkboard(seed), { tracings: 1 }),
    art('drawings/room-desk', (seed) => drawn.roomDesk(seed)),
    art('drawings/pushpin', (n) => drawn.pushpin(PINS[(n - 1) % PINS.length]), { edge: 2, tracings: PINS.length }),
  ])

  // ---- her, her camera, the corkboard and the desk under it -----------------------------
  const her = makePiece(doodleArt, { height: 1.18 })
  her.group.position.set(-0.98, 0, -1.02)
  her.group.rotation.y = 0.12
  room.add(her.group)

  const camera = makePiece(cameraArt, { height: 1.02 })
  camera.group.position.set(0.02, 0, -0.42)
  camera.group.rotation.y = -0.16 // turned a little toward her
  room.add(camera.group)
  const onCamera = (f, z = 0) => new THREE.Vector3((f.x - 0.5) * camera.width, f.y * camera.height, z)

  const board = makeFlat(corkArt, { width: 1.24 })
  const BOARD = { x: inner.w / 2 - 0.84, y: 1.44, z: inner.back + 0.012 }
  board.mesh.position.set(BOARD.x, BOARD.y, BOARD.z)
  board.mesh.castShadow = false
  room.add(board.mesh)

  const desk = makePiece(deskArt, { width: 1.32 })
  desk.group.position.set(BOARD.x, 0, inner.back + 0.32)
  room.add(desk.group)
  const behindDesk = desk.height * (400 / 700) - 0.03 // below its top, a photo has gone behind it

  // where the photos go on the board, each a little crooked
  const cols = slotsOnBoard > 4 ? 3 : 2
  const spots = Array.from({ length: slotsOnBoard }, (_, k) => {
    const col = k % cols
    const row = Math.floor(k / cols)
    return {
      x: BOARD.x + (col - (cols - 1) / 2) * (cols === 3 ? 0.34 : 0.4) + (rand() - 0.5) * 0.05,
      y: BOARD.y + 0.2 - row * 0.4 + (rand() - 0.5) * 0.04,
      z: BOARD.z + 0.006 + k * 0.0015,
      tilt: (rand() - 0.5) * 0.26,
    }
  })

  // ---- the photos: her, in front of each place ----------------------------------------------
  const photos = []
  for (let i = 0; i < count; i++) {
    const slug = places[i].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const [prep] = await art(`drawings/place-${slug}`, () => drawn.place(places[i], i + 1), { edge: 0, trim: false, tracings: 1 })
    const photo = canvas(440, 440)
    drawn.selfie(photo, prep.front, doodleArt[0].front, i)
    photos.push(photo)
  }

  // ---- polaroids: one for each spot on the board, and one more in the camera ----------------
  const back = new THREE.MeshLambertMaterial({ color: '#34343c', side: THREE.BackSide })
  const sheet = new THREE.PlaneGeometry(PW, PH)
  const polaroids = Array.from({ length: slotsOnBoard + 1 }, (_, k) => {
    const face = canvas(300, 360)
    const map = texture(face)
    const front = new THREE.Mesh(sheet, new THREE.MeshLambertMaterial({ map }))
    const rear = new THREE.Mesh(sheet, back)
    front.castShadow = front.receiveShadow = true
    const group = new THREE.Group()
    group.add(front, rear)
    group.visible = false
    room.add(group)
    const pin = makeFlat([pinArt[k % pinArt.length]], { width: 0.05 })
    pin.mesh.visible = false
    room.add(pin.mesh)
    return { group, face, map, pin: pin.mesh, place: -1, spot: -1, k: -1 }
  })
  function develop(p, k) {
    if (p.k === k) return false
    p.k = k
    drawn.polaroidFace(p.face, photos[p.place], places[p.place], k)
    p.map.needsUpdate = true
    return true
  }
  // up on the board, pinned
  function pinUp(p, spot, scale = 1, pinScale = 1) {
    const s = spots[spot]
    p.spot = spot
    p.group.visible = true
    p.group.position.set(s.x, s.y, s.z)
    p.group.rotation.set(0, 0, s.tilt)
    p.group.scale.setScalar(scale)
    p.pin.visible = pinScale > 0.01
    p.pin.position.set(s.x - Math.sin(s.tilt) * (PH / 2 - 0.03), s.y + Math.cos(s.tilt) * (PH / 2 - 0.03), s.z + 0.012)
    p.pin.scale.setScalar(pinScale)
  }

  // ---- the countdown light, the flash ---------------------------------------------------------
  const dot = texture(lightDot())
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16), new THREE.MeshBasicMaterial({ color: '#4a1712' }))
  lamp.position.copy(onCamera(LIGHT, 0.006))
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#ff5a46', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  lampGlow.position.copy(onCamera(LIGHT, 0.012))
  lampGlow.scale.setScalar(0.12)
  lampGlow.visible = false
  const flashGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#ffffff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  flashGlow.position.copy(onCamera(FLASH, 0.02))
  flashGlow.visible = false
  camera.hinge.add(lamp, lampGlow, flashGlow)
  // the whole box goes white for a moment
  const whiteout = new THREE.Mesh(
    new THREE.PlaneGeometry(inner.w, inner.h),
    new THREE.MeshBasicMaterial({ color: '#ffffff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }),
  )
  whiteout.position.set(0, inner.h / 2, -0.02)
  whiteout.visible = false
  room.add(whiteout)
  let lit = false
  function setLight(on) {
    if (on === lit) return false
    lit = on
    lamp.material.color.set(on ? '#ff4636' : '#4a1712')
    lampGlow.visible = on
    return true
  }
  let flashLevel = 0
  function setFlash(k) {
    if (k === flashLevel) return false
    flashLevel = k
    whiteout.visible = flashGlow.visible = k > 0.01
    whiteout.material.opacity = 0.85 * k
    flashGlow.scale.setScalar(0.25 + 0.75 * k)
    flashGlow.material.opacity = k
    return true
  }
  // one big flash over everything, as the box is clicked (a fade, not a movement: motion off skips it)
  const bigFlash = document.createElement('div')
  bigFlash.className = 'camera-flash'
  bigFlash.setAttribute('aria-hidden', 'true')
  document.body.append(bigFlash)

  // ---- the loop -----------------------------------------------------------------------------
  // where the polaroid is as it comes out of the camera: in the room, and turned with the camera
  room.updateWorldMatrix(true, true)
  const slotAt = (rise) => room.worldToLocal(camera.hinge.localToWorld(onCamera(SLOT, -0.012).add(new THREE.Vector3(0, rise, 0))))
  const inside = slotAt(-PH / 2 - 0.02) // all the way in
  const out = slotAt(PH * 0.36) // most of the way out
  const turned = camera.group.rotation.y

  const pinned = [] // up on the board, in the order they went up
  let next = 0 // the place the next photo is of
  let shot = null // the polaroid being taken
  let clearing = [] // what is coming down off a full board
  let offset = 0 // this time round, the photo waits for the board to clear first
  let inRoom = false // the camera is inside: the loop carries on there

  // The whole scene, as the shelf first shows it: a few polaroids already up.
  const first = Math.min(2, slotsOnBoard - 1, count)
  for (let i = 0; i < first; i++) {
    const p = polaroids[i]
    p.place = i
    develop(p, 1)
    pinUp(p, i)
    pinned.push(p)
  }
  next = count ? first % count : 0

  function takeNext() {
    const p = polaroids.find((q) => !pinned.includes(q) && !clearing.includes(q))
    p.place = next
    next = (next + 1) % count
    p.k = -1
    develop(p, 0)
    p.group.visible = false
    p.pin.visible = false
    p.group.scale.setScalar(1)
    return p
  }

  // what is on the board comes down: the pins pop out and drop, the photos swing and slip behind the desk
  function stepClear(t) {
    let moved = false
    clearing.forEach((p, i) => {
      const s = spots[p.spot]
      const tp = t - i * 0.09 // the pin
      const tf = tp - 0.14 // the photo, just after its pin
      if (tp > 0) {
        const y = s.y + PH / 2 - 0.03 + 0.04 * Math.min(1, tp / 0.1) - 4.5 * Math.max(0, tp - 0.1) ** 2
        p.pin.position.y = y
        p.pin.position.z = s.z + 0.012 + Math.min(0.04, tp * 0.3)
        p.pin.rotation.z = tp * 6
        p.pin.visible = y > behindDesk - 0.05
        moved = true
      }
      if (tf > 0) {
        p.group.rotation.z = s.tilt + Math.sin(tf * 9) * 0.25 * Math.max(0, 1 - tf)
        p.group.position.y = s.y - 3.2 * tf * tf
        p.group.position.x = s.x + Math.sin(tf * 5) * 0.03
        p.group.visible = p.group.position.y + PH / 2 > behindDesk - 0.02
        moved = true
      }
    })
    return moved
  }

  function placeShot(u) {
    const p = shot
    if (u < OUT[0]) {
      if (!p.group.visible) return false
      p.group.visible = false
      return true
    }
    let changed = false
    if (u < DEVELOP[0]) {
      // up out of the slot (the camera's body hides what is still inside)
      p.group.visible = true
      p.group.position.lerpVectors(inside, out, smooth((u - OUT[0]) / (OUT[1] - OUT[0])))
      p.group.rotation.set(0, turned, 0)
      return true
    }
    if (u < FLY[0]) {
      // it sits there, coming up out of the white
      if (!p.group.visible || !p.group.position.equals(out)) {
        p.group.visible = true
        p.group.position.copy(out)
        p.group.rotation.set(0, turned, 0)
        changed = true
      }
      const k = Math.round(Math.min(1, (u - DEVELOP[0]) / (DEVELOP[1] - DEVELOP[0])) * 12) / 12
      return develop(p, k) || changed
    }
    const spot = pinned.length
    const s = spots[spot]
    develop(p, 1)
    if (u < PIN) {
      // off to the corkboard, in an arc, turning to face the room
      const k = smooth((u - FLY[0]) / (FLY[1] - FLY[0]))
      const a = 1 - k
      p.group.visible = true
      p.group.position.set(
        a * a * out.x + 2 * a * k * (out.x + s.x) * 0.5 + k * k * s.x,
        a * a * out.y + 2 * a * k * (Math.max(out.y, s.y) + 0.45) + k * k * s.y,
        a * a * out.z + 2 * a * k * (out.z + 0.25) + k * k * s.z,
      )
      p.group.rotation.set(0, turned * a, s.tilt * k + Math.sin(Math.PI * k) * 0.6)
      return true
    }
    // pinned: the pin goes in, the photo gives a little bump
    const k = (u - PIN) / 0.25
    if (k < 1) {
      pinUp(p, spot, 1 + 0.06 * (1 - k), 1 + 0.6 * (1 - k))
      return true
    }
    pinUp(p, spot)
    pinned.push(p)
    shot = null
    return true
  }

  const clock = loopClock(stepped, {
    box,
    group: room,
    period: LOOP,
    active: () => count > 0 && (inRoom || onShelf()),
    tick(t, prev) {
      let changed = false
      if (passed(prev, t, 0)) {
        // a new photo; if the board is full, it comes down first
        if (shot) {
          // (the last one never got pinned: the loop was hurried along)
          shot.group.visible = shot.pin.visible = false
          shot = null
        }
        offset = 0
        if (pinned.length >= slotsOnBoard) {
          clearing = pinned.splice(0)
          offset = CLEAR
        }
        shot = takeNext()
      }
      if (clearing.length) {
        changed = stepClear(t) || changed
        if (t >= CLEAR) {
          for (const p of clearing) p.group.visible = p.pin.visible = false
          for (const p of clearing) p.pin.rotation.z = 0
          clearing = []
          changed = true
        }
      }
      const u = t - offset
      changed = setLight(BLINKS.some((b) => u >= b && u < b + 0.25)) || changed
      changed = setFlash(u >= FLASH_AT && u < FLASH_AT + 0.4 ? Math.round((1 - (u - FLASH_AT) / 0.4) * 8) / 8 : 0) || changed
      if (shot) changed = placeShot(u) || changed
      return changed
    },
  })

  boil(stepped, [her, camera, desk], () => inRoom || onShelf())

  return {
    card: () => renderAbout({ files, base }),
    // one big flash as the camera flies in; the loop carries on inside
    async open() {
      inRoom = true
      if (stepped.reduced) return
      setFlash(1)
      bigFlash.classList.remove('is-on')
      void bigFlash.offsetWidth // (so the fade plays again)
      bigFlash.classList.add('is-on')
      await stepped.poses([0.8, 0.55, 0.3, 0.12, 0], setFlash)
    },
    async close() {
      inRoom = false
    },
    // motion off: the board as it is, nothing moving
    motion(off) {
      if (!off) return
      setLight(false)
      setFlash(0)
      if (shot) shot.group.visible = shot.pin.visible = false
      shot = null
      for (const p of clearing) p.group.visible = p.pin.visible = false
      clearing = []
    },
  }
}
