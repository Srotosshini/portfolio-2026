// The camera rig. Low field of view and far away, so everything reads as a
// miniature. It always looks straight at the shelf; a move is a smooth dolly
// from one framing to the next (camera moves may glide, paper may not).
import * as THREE from 'three'

const FOV = 20
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
export const FULL = { left: 0, top: 0, right: 1, bottom: 1 }
// gentle at both ends but moving from the first frame, so a glide never reads as a pause and then a cut
const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2

export function createRig() {
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 220)
  const pose = new THREE.Vector3(0, 0, 60) // where the camera sits, before parallax
  const look = new THREE.Vector3()
  const drift = new THREE.Vector2() // parallax offset, eased toward the pointer
  const pointer = new THREE.Vector2()
  let focus = 0 // z of the plane being framed
  let move = null
  let dirty = true
  let lift = 0

  const rig = {
    camera,
    reduced: false,
    parallax: 1, // 0 switches the pointer parallax off
    // How far above its framing the camera sits, as a fraction of its distance.
    // 0 is dead straight-on (the shelf). Inside a box a little lift looks down
    // onto the floor, so the tabs and contact shadows show.
    lift: 0,

    resize(w, h) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      dirty = true
    },

    // Where the camera must sit so that `rect` (a rectangle {cx, cy, w, h} on
    // the plane z) just fits inside `region` (a part of the viewport, as
    // fractions from the top left).
    poseFor(rect, region = FULL) {
      const rw = region.right - region.left
      const rh = region.bottom - region.top
      const dist = Math.max(rect.w / (rw * camera.aspect * 2 * TAN), rect.h / (rh * 2 * TAN))
      const viewH = 2 * dist * TAN
      const viewW = viewH * camera.aspect
      const nx = region.left + region.right - 1 // centre of the region, -1..1
      const ny = 1 - region.top - region.bottom
      return new THREE.Vector3(rect.cx - (nx * viewW) / 2, rect.cy - (ny * viewH) / 2, rect.z + dist)
    },

    go(rect, { region = FULL, duration = 1.3, instant = false } = {}) {
      const to = rig.poseFor(rect, region)
      if (move) {
        const { resolve } = move
        move = null
        resolve()
      }
      if (instant || rig.reduced || duration <= 0) {
        pose.copy(to)
        focus = rect.z
        dirty = true
        return Promise.resolve()
      }
      return new Promise((resolve) => {
        move = {
          from: pose.clone(), to, resolve, duration, t: 0,
          f0: focus, f1: rect.z,
          d0: Math.max(0.01, pose.z - rect.z),
          d1: Math.max(0.01, to.z - rect.z),
        }
      })
    },

    // pointer position across the window, -1..1 on both axes
    point(x, y) {
      pointer.set(x, y)
    },

    // is a glide in progress?
    get moving() {
      return !!move
    },

    // how much of the framed plane one screen pixel covers
    unitsPerPixel(viewportHeight) {
      return (2 * TAN * (pose.z - focus)) / viewportHeight
    },

    // Returns true when the camera moved and the scene needs drawing.
    update(dt) {
      let changed = dirty
      dirty = false
      if (move) {
        move.t = Math.min(1, move.t + dt / move.duration)
        const e = ease(move.t)
        // close the distance geometrically so the zoom feels even, and slide
        // along the straight line between the two poses
        const d = move.d0 * Math.pow(move.d1 / move.d0, e)
        const s = Math.abs(move.d1 - move.d0) < 1e-6 ? e : (d - move.d0) / (move.d1 - move.d0)
        pose.lerpVectors(move.from, move.to, s)
        focus = move.f0 + (move.f1 - move.f0) * s
        changed = true
        if (move.t >= 1) {
          const { resolve } = move
          move = null
          resolve()
        }
      }
      const reach = rig.reduced ? 0 : rig.parallax * 0.07 * (pose.z - focus)
      const tx = pointer.x * reach
      const ty = pointer.y * reach * 0.5
      if (Math.abs(tx - drift.x) > 1e-4 || Math.abs(ty - drift.y) > 1e-4) {
        const f = Math.min(1, dt * 5)
        drift.x += (tx - drift.x) * f
        drift.y += (ty - drift.y) * f
        changed = true
      }
      if (Math.abs(rig.lift - lift) > 1e-4) {
        lift = rig.reduced ? rig.lift : lift + (rig.lift - lift) * Math.min(1, dt * 4)
        changed = true
      }
      camera.position.set(pose.x + drift.x, pose.y + drift.y + lift * (pose.z - focus), pose.z)
      camera.lookAt(look.set(pose.x, pose.y, focus))
      return changed
    },
  }
  return rig
}
