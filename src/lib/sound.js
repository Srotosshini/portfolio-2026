// Sound. Off until the visitor turns it on with the switch in the corner
// (the brief: optional, off by default). Every sound is made on the spot with
// Web Audio, so there are no files to load: foil crinkle and tear, a card
// flick, a sparkle for a chase card, the snap of a binder ring.
let audio = null
const listeners = new Set()

function context() {
  audio ||= new (window.AudioContext || window.webkitAudioContext)()
  if (audio.state === 'suspended') audio.resume()
  return audio
}

// a short burst of noise through a band-pass filter: the stuff of paper and foil
function noise(ctx, at, { length = 0.08, freq = 3000, q = 1, level = 0.3, sweep = 1 } = {}) {
  const frames = Math.max(1, Math.round(ctx.sampleRate * length))
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = q
  band.frequency.setValueAtTime(freq, at)
  band.frequency.exponentialRampToValueAtTime(Math.max(80, freq * sweep), at + length)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(level, at)
  source.connect(band).connect(gain).connect(ctx.destination)
  source.start(at)
}

function tone(ctx, at, freq, { length = 0.4, level = 0.12, type = 'sine' } = {}) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(level, at + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + length + 0.05)
}

const SOUNDS = {
  crinkle(ctx, t) {
    for (let i = 0; i < 5; i++) noise(ctx, t + i * 0.035 + Math.random() * 0.02, { length: 0.04, freq: 2500 + Math.random() * 4000, q: 2, level: 0.18 })
  },
  tear(ctx, t) {
    noise(ctx, t, { length: 0.42, freq: 5200, q: 0.8, level: 0.32, sweep: 0.35 })
    for (let i = 0; i < 4; i++) noise(ctx, t + 0.05 + i * 0.08, { length: 0.05, freq: 3000 + Math.random() * 3000, q: 3, level: 0.12 })
  },
  flick(ctx, t) {
    noise(ctx, t, { length: 0.03, freq: 6000, q: 0.7, level: 0.22 })
    tone(ctx, t, 180, { length: 0.06, level: 0.08, type: 'triangle' })
  },
  sparkle(ctx, t) {
    ;[2093, 2637, 3136, 3951, 4186].forEach((f, i) => tone(ctx, t + i * 0.07, f, { length: 0.5, level: 0.06 }))
  },
  snap(ctx, t) {
    noise(ctx, t, { length: 0.025, freq: 4000, q: 1.5, level: 0.3 })
    tone(ctx, t + 0.005, 1750, { length: 0.18, level: 0.05, type: 'triangle' })
  },
}

export const sound = {
  on: false,
  set(on) {
    sound.on = on
    for (const listener of listeners) listener(on)
  },
  // fn(on) whenever the switch changes
  listen(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  // Start the audio ahead of the first sound: it takes a moment to wake up,
  // and that moment should not land in the middle of a camera glide. Call it
  // from a press (pointerdown, keydown), which browsers count as permission.
  warm() {
    if (!sound.on || audio) return
    try {
      context()
    } catch {
      // no Web Audio here
    }
  },
  // play one of: crinkle, tear, flick, sparkle, snap (nothing when sound is off)
  play(name) {
    if (!sound.on) return
    try {
      const ctx = context()
      SOUNDS[name]?.(ctx, ctx.currentTime + 0.005)
    } catch {
      // no Web Audio here: stay quiet
    }
  },
}
