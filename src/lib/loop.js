// A box's loop on the shelf.
// Every box with a room plays a little scene of its own while the shelf is on
// screen: its whole scene for a moment first, then something that comes apart
// and back together, over and over (curtains close and open, packs dive into
// their steps and climb back, snow falls, settles and melts away). Each box
// has its own clock and its own length of loop, so no two ever move in step,
// and the box under the pointer runs a little faster. Like everything made of
// paper it moves on the stop-motion tick, so it also stops with the tab hidden.
import { FPS } from './stepped.js'

export const HOLD = 1 // seconds a box shows its whole scene before its loop starts
const HOT = 1.35 // how much faster a loop runs while the pointer is on its box

// `period`: the loop's length in seconds. `active()`: may it run right now?
// `group`: the room (it is hidden while it is still being made).
// `tick(t, prev, clock)`: called each tick with the time in the loop (0 up to
// `period`) and its time on the tick before; it returns what stepped.every
// expects (false: nothing changed, 'looks': no shadows moved).
export function loopClock(stepped, { box, group, period, active, tick }) {
  let last = null
  const clock = {
    period,
    time: -HOLD, // seconds since the loop began; below 0 it is holding the whole scene
    get cycle() {
      return Math.floor(Math.max(0, clock.time) / period)
    },
    // from the top: the whole scene, held for a moment, then the loop
    restart() {
      clock.time = -HOLD
      last = null
    },
  }
  stepped.every(1, () => {
    if (!active() || !box.group.visible || !group.visible) return false
    clock.time += (box.hot ? HOT : 1) / FPS
    if (clock.time < 0) return false
    const t = clock.time % period
    const prev = last ?? -1e-6
    last = t
    return tick(t, prev, clock)
  })
  return clock
}

// Did the loop go past `at` between the last tick and this one? (It may have wrapped round.)
export const passed = (prev, t, at) => (prev <= t ? prev < at && at <= t : at > prev || at <= t)

// 0 → 1 with soft ends
export const smooth = (x) => {
  const k = Math.min(1, Math.max(0, x))
  return k * k * (3 - 2 * k)
}
