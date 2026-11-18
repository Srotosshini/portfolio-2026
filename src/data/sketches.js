// Creative coding: the paper gallery. Every sketch hangs as a painting that is
// always moving. Keep this list newest first: the top one hangs at the
// entrance, older work further along the corridor.
//
// Each sketch's files go in public/sketches/<slug>/:
//   index.html + sketch.js   the sketch, copied from the p5 editor. It runs live
//                            when its painting is opened.
//   loop.mp4                 5 to 10 seconds of it being used, muted. This is
//                            what plays on the wall (and what plays instead of
//                            the live sketch when it can't run live).
//   still.jpg                optional: one frame, for the timeline strip and
//                            the list page.
//
// slug      the folder name, and the end of its address (#/creative-coding/<slug>)
// date      as it should read on the painting's tag, e.g. 'oct 2026'. The year
//           in it decides where the "2025" sign goes and how aged the paper is.
// oneLiner  one line about it, in your voice (on its placard and in the list)
// uses      what it needs: any of 'mouse', 'mic', 'camera', 'hand', 'llm', 'arduino'
//             mic, camera, hand   ask the visitor first; if they say no, the loop plays
//             llm                 never runs live here (no API keys on a public
//                                 site): the loop plays
//             arduino             the loop plays, with a note saying why
// loop      the wall loop (see above)
// code      the file shown when the painting is flipped over
// editorUrl the sketch's page on editor.p5js.org, linked under its code
// learned   a short paragraph for its "what i learned" note
// process   2 or 3 pictures for that note: { src: 'sketches/<slug>/process-1.jpg', alt: '…' }
// colors    optional: the paint the doodle gets splashed with after visiting it
//
// The dates and the list itself are a first guess from the p5 editor (which
// shows when a sketch was last edited, not made): correct them freely.
export const sketches = [
  // ---- fall 2026
  {
    slug: 'llm-cult-negotiation',
    title: 'LLM Cult negotiation',
    date: 'fall 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: ['llm'],
    loop: 'sketches/llm-cult-negotiation/loop.mp4',
    code: 'sketches/llm-cult-negotiation/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'continuum',
    title: 'Continuum (projectA)',
    date: 'fall 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/continuum/loop.mp4',
    code: 'sketches/continuum/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'embodied-movement',
    title: 'Project B with Embodied Movement',
    date: 'fall 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/embodied-movement/loop.mp4',
    code: 'sketches/embodied-movement/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'babykitto',
    title: 'week 4 babykitto',
    date: 'fall 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/babykitto/loop.mp4',
    code: 'sketches/babykitto/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  // ---- spring 2026
  {
    slug: 'project-b',
    title: 'Project B',
    date: 'spring 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/project-b/loop.mp4',
    code: 'sketches/project-b/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'iridescent-puzzle',
    title: 'Iridescent puzzle',
    date: 'spring 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/iridescent-puzzle/loop.mp4',
    code: 'sketches/iridescent-puzzle/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'bloom-concierge',
    title: 'bloom concierge',
    date: 'spring 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/bloom-concierge/loop.mp4',
    code: 'sketches/bloom-concierge/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'wuthering-waves',
    title: 'wuthering waves',
    date: 'spring 2026',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/wuthering-waves/loop.mp4',
    code: 'sketches/wuthering-waves/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  // ---- 2025
  {
    slug: 'woolly-bounce',
    title: 'Woolly bounce',
    date: '2025',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/woolly-bounce/loop.mp4',
    code: 'sketches/woolly-bounce/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'pied-piper-of-abu-dhabi',
    title: 'Pied Piper of Abu Dhabi',
    date: '2025',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/pied-piper-of-abu-dhabi/loop.mp4',
    code: 'sketches/pied-piper-of-abu-dhabi/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'car-maintenance',
    title: 'Car Maintenance',
    date: '2025',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/car-maintenance/loop.mp4',
    code: 'sketches/car-maintenance/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
  {
    slug: 'self-portrait',
    title: 'Self Portrait',
    date: '2025',
    oneLiner: 'TODO: one line about it, in your voice',
    uses: [],
    loop: 'sketches/self-portrait/loop.mp4',
    code: 'sketches/self-portrait/sketch.js',
    editorUrl: '',
    learned: 'TODO: a short paragraph on what you learned',
    process: [],
  },
]

// The words in the gallery. Rewrite any of them.
export const words = {
  howTo: 'drag to walk → tap a painting to open it',
  timeline: 'every sketch, newest first',
  back: '← back to the corridor',
  flip: 'flip it over',
  flipBack: 'flip back',
  learned: 'what i learned',
  putBack: 'put it back',
  editor: 'open it in the p5 editor',
  openIt: 'open it',
  // shown for three seconds when a sketch opens, for the first thing it uses
  hints: {
    mouse: 'move your mouse / finger around',
    mic: 'make some noise',
    camera: 'wave at your camera',
    hand: 'wave at your camera',
  },
  // the card before a sketch that needs the mic or camera
  asks: {
    mic: 'this one listens to you',
    camera: 'this one watches you',
    hand: 'this one watches your hands',
  },
  allow: {
    mic: 'allow mic?',
    camera: 'allow camera?',
    hand: 'allow camera?',
  },
  yes: 'yes',
  justVideo: 'just show me the video',
  // taped beside a sketch that can only be shown as its video
  arduino: 'needs my arduino, so here’s a video',
  llm: 'this one talks to a language model, so here’s a recording',
}
