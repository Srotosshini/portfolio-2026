// Stop-motion clock.
// The render loop can run at any rate and the camera can glide, but paper
// only ever changes on a 12 fps tick. Anything made of paper is animated
// through here so it moves in steps, never smoothly.
export const FPS = 12
const STEP = 1 / FPS

export function createStepped() {
  const jobs = new Set()
  let acc = 0

  const stepped = {
    frame: 0,
    reduced: false, // reduced motion: tweens jump to their last pose, loops stop
    dirty: false, // something moved on a tick, so the scene needs redrawing

    // Call once per animation frame with the seconds since the last one.
    update(dt) {
      acc += Math.min(dt, 0.25)
      while (acc >= STEP) {
        acc -= STEP
        stepped.frame++
        for (const job of [...jobs]) if (job(stepped.frame) === false) jobs.delete(job)
      }
    },

    // Run fn(frame) on every nth tick, forever. Return false from fn when
    // nothing changed, so the scene is not redrawn for no reason.
    every(n, fn) {
      const job = (frame) => {
        if (stepped.reduced || frame % n) return
        if (fn(frame) !== false) stepped.dirty = true
      }
      jobs.add(job)
      return () => jobs.delete(job)
    },

    // fn(t) once per tick, t going from just above 0 to exactly 1 over `frames` ticks.
    play(frames, fn, { delay = 0 } = {}) {
      return new Promise((done) => {
        if (stepped.reduced || frames <= 0) {
          fn(1)
          stepped.dirty = true
          return done()
        }
        let i = -delay
        jobs.add(() => {
          if (++i <= 0) return
          fn(Math.min(1, i / frames))
          stepped.dirty = true
          if (i >= frames) {
            done()
            return false
          }
        })
      })
    },

    // Hold each value in `list` for one tick: fn(value, index). Ends on the last one.
    poses(list, fn, options) {
      return stepped.play(
        list.length,
        (t) => {
          const i = Math.max(0, Math.round(t * list.length) - 1)
          fn(list[i], i)
        },
        options,
      )
    },

    wait(frames) {
      return stepped.play(frames, () => {})
    },
  }
  return stepped
}
