// Creative coding: her sketches as trading cards, in booster packs (one pack
// per semester, see sets.js). The list is a first draft from the p5 editor,
// which only shows when a sketch was last edited: move cards between sets,
// add and remove them freely.
//
// slug      the card's address (#/creative-coding/<slug>) and file names
// set       which pack it comes in (an id from sets.js)
// date      shown on the card: "made: sep 2026"
// uses      what it needs: any of 'mouse', 'mic', 'camera', 'hand', 'ai'
// vibe      one word, in your voice ("chaotic")
// oneLiner  one line about it, on the back of the card
// video     5 to 10 seconds of the sketch being used, muted, landscape: this
//           is the card's picture. Keep it small (under about 1.5 MB).
// poster    one frame of that video, shown until the video loads
// editorUrl its page on editor.p5js.org: "try it yourself" opens it
// learned   a short paragraph for the back of the card
// process   1 or 2 pictures for the back: { src: 'cards/<slug>-process-1.jpg', alt: '…' }
// chase     true for the set's favourite: it comes out of the pack last,
//           face down, and flips itself over. If no card in a set is marked,
//           the last one listed is the chase card.
//
// Nothing runs live on the site: a card's picture is always its video, and
// the sketch itself is one click away in the p5 editor.
const card = (slug, title, set, date, more = {}) => ({
  slug,
  title,
  set,
  date,
  uses: [],
  vibe: 'TODO: one word',
  oneLiner: 'TODO: one line about it, in your voice',
  video: `cards/${slug}.mp4`,
  poster: `cards/${slug}.jpg`,
  editorUrl: '',
  learned: 'TODO: a short paragraph on what you learned',
  process: [],
  chase: false,
  ...more,
})

export const sketches = [
  // ---- fall 2026 (newest)
  card('babykitto', 'week 4 babykitto', 'fall-2026', 'fall 2026'),
  card('embodied-movement', 'Project B with Embodied Movement', 'fall-2026', 'fall 2026'),
  card('continuum', 'Continuum', 'fall-2026', 'fall 2026'),
  card('mns-v2', 'week 5 mns v2', 'fall-2026', 'fall 2026'),
  card('cult-negotiation', 'Cult negotiation', 'fall-2026', 'fall 2026', { uses: ['ai'] }),
  card('drawing-together', 'Drawing together', 'fall-2026', 'fall 2026'),
  // ---- spring 2026
  card('wuthering-waves', 'wuthering waves', 'spring-2026', 'spring 2026'),
  card('project-b', 'Project B', 'spring-2026', 'spring 2026'),
  card('iridescent-puzzle', 'Iridescent puzzle', 'spring-2026', 'spring 2026'),
  card('bloom-concierge', 'bloom concierge', 'spring-2026', 'spring 2026'),
  card('w04', 'W04', 'spring-2026', 'spring 2026'),
  card('w05', 'W05', 'spring-2026', 'spring 2026'),
  // ---- fall 2025: nothing found in the p5 editor for this semester yet
  // ---- spring 2025
  card('pied-piper-of-abu-dhabi', 'Pied Piper of Abu Dhabi', 'spring-2025', 'spring 2025'),
  card('woolly-bounce', 'Woolly bounce', 'spring-2025', 'spring 2025'),
  card('nutritious-wineberry', 'Nutritious wineberry', 'spring-2025', 'spring 2025'),
  card('car-maintenance', 'Car Maintenance', 'spring-2025', 'spring 2025'),
  card('scratch-feeling', 'Scratch feeling', 'spring-2025', 'spring 2025'),
  card('bouncing-hearts', 'bouncing hearts', 'spring-2025', 'spring 2025'),
  // ---- fall 2024: the base set (add the others when you have confirmed them)
  card('self-portrait', 'Self Portrait', 'fall-2024', 'fall 2024'),
]

// The words in the card shop. Rewrite any of them.
export const words = {
  pick: 'pick a pack and rip it open',
  dontTouch: 'please don’t touch (jk, touch everything)',
  rip: 'drag along the top to rip it (or just tap it)',
  openAnother: 'open another pack',
  back: '← back to the counter',
  backToBinder: '← back to the binder',
  backToCase: '← back to the case',
  tryIt: 'try it yourself →',
  needs: { mic: '(needs your mic)', camera: '(needs your camera)', hand: '(needs your camera)' },
  noLink: 'the p5 editor link is coming',
  flip: 'flip it over',
  flipBack: 'flip back',
  play: 'play',
  pause: 'pause',
  learned: 'what i learned',
  uses: 'uses',
  vibe: 'vibe',
  made: 'made',
  card: 'card',
  cards: 'cards',
  chase: 'chase card',
  lost: 'lost set',
  toCase: 'back to the case',
  filed: 'filed in your binder',
  seeCard: 'see its card',
  binder: 'my binder',
  collected: (n, total) => `${n} / ${total} collected`,
  setComplete: 'set complete ✓',
  everything: 'show me everything',
  list: 'or see it all as a plain list',
  closeBinder: 'close the binder',
  missing: '?',
  // what each thing a sketch uses is called on its card
  names: { mouse: 'mouse', mic: 'mic', camera: 'camera', hand: 'hands', ai: 'AI' },
}
