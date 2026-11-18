// Sound. Off until the visitor switches it on (the brief: optional, off by
// default). For now it is the dark box's paper piano: each note is made on the
// spot with Web Audio, a soft pluck, like a toy piano.
let audio = null

export const sound = {
  on: false,
  // main.js points this at something that shows where the sound switch is,
  // for when a note is played with the sound off
  hint() {},

  set(on) {
    sound.on = on
  },

  // A note at `freq` Hz. Returns false (and plays nothing) when sound is off.
  note(freq, { level = 0.2 } = {}) {
    if (!sound.on) return false
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)()
      if (audio.state === 'suspended') audio.resume()
      const t = audio.currentTime
      const out = audio.createGain()
      out.gain.setValueAtTime(0.0001, t)
      out.gain.exponentialRampToValueAtTime(level, t + 0.008)
      out.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
      // bright when struck, mellowing as it rings
      const tone = audio.createBiquadFilter()
      tone.type = 'lowpass'
      tone.frequency.setValueAtTime(freq * 6, t)
      tone.frequency.exponentialRampToValueAtTime(freq * 1.4, t + 0.7)
      tone.connect(out).connect(audio.destination)
      for (const [type, mult, gain] of [['triangle', 1, 1], ['sine', 2, 0.32], ['sine', 3.01, 0.1]]) {
        const osc = audio.createOscillator()
        osc.type = type
        osc.frequency.value = freq * mult
        const g = audio.createGain()
        g.gain.value = gain
        osc.connect(g).connect(tone)
        osc.start(t)
        osc.stop(t + 1.6)
      }
      return true
    } catch {
      return false // no Web Audio here: stay silent
    }
  },
}
