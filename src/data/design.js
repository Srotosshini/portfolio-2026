// Design: the Christmas market. Each project is a wooden stall on a snowy
// street at night; click one to go inside, where everything is about that
// project. Stalls stand left to right in this order. Adding a stall is adding
// an entry (pick an interiorType, or 'shop' for a plain display table).
//
// slug          the stall's address (#/design/<slug>); its files go in public/design/<slug>/
// title         the project's name
// stallSign     what the sign over the stall says (her lettering: drawings/sign-<slug>.png)
// signDoodle    a little doodle beside the sign's words: 'ring', 'drop', 'wheel', 'star' (or none)
// trimColour    the stall's trim, bunting and lanterns
// decoration    what hangs on the front: 'bunting', 'ornaments', 'wheel', 'lanterns' (or none)
// oneLiner      one line, on the tag that pops up over the stall when the pointer is on it
// cover         a photo for the list page
// windowPreview pictures shown small in its lit window; left empty, its first items are used
// interiorType  what is inside: 'jewelry', 'resin', 'workshop', 'classroom' or 'shop'
// items         the pieces inside: { image, title, note, turntable, process }
//                 image      a photo of it, cut out (transparent PNG)
//                 turntable  (jewelry) a short video of it turning, to drag through
//                 process    (resin) a few process photos: [{ image, alt }]
// wall          pictures pinned or taped to the wall inside (sketches, research): [{ image, alt }]
// hotspots      (workshop) numbered tags on the product: { x, y, title, note }, where x and
//               y say where on the product's photo, as fractions across and down
// pages         (classroom) the module's pages, in order: [{ image, alt }]
// module        (classroom) its title and goal, chalked on the blackboard
// caseStudy     the note pinned up inside every stall
const TODO = {
  oneLiner: 'TODO: one line about it, in your voice',
  caseStudy: {
    problem: 'TODO: the problem it set out to solve',
    made: 'TODO: what you made',
    how: 'TODO: how you made it',
    learned: 'TODO: what you learned',
  },
}

const piece = (slug, n, more = {}) => ({
  image: `design/${slug}/piece-${n}.png`,
  title: `TODO: what piece ${n} is called`,
  note: 'TODO: a line about it',
  turntable: '',
  process: [],
  ...more,
})
const pinned = (slug, name, n) => ({ image: `design/${slug}/${name}-${n}.jpg`, alt: `TODO: describe ${name} ${n}` })

const stall = (slug, title, more) => ({
  slug,
  title,
  stallSign: title.toLowerCase(),
  signDoodle: '',
  trimColour: '#c98a4b',
  decoration: '',
  oneLiner: TODO.oneLiner,
  cover: `design/${slug}/cover.jpg`,
  windowPreview: [],
  interiorType: 'shop',
  items: [],
  wall: [],
  hotspots: [],
  pages: [],
  module: null,
  caseStudy: { ...TODO.caseStudy },
  ...more,
})

export const stalls = [
  stall('jewelry', 'Jewelry Design', {
    stallSign: 'jewelry',
    signDoodle: 'ring',
    trimColour: '#d47c96',
    decoration: 'bunting',
    interiorType: 'jewelry',
    items: [1, 2, 3].map((n) => piece('jewelry', n, { turntable: `design/jewelry/piece-${n}.mp4` })),
    wall: [1, 2, 3].map((n) => pinned('jewelry', 'sketch', n)),
  }),
  stall('resin-art', 'Resin Art', {
    stallSign: 'resin art',
    signDoodle: 'drop',
    trimColour: '#2b9d9a',
    decoration: 'ornaments',
    interiorType: 'resin',
    items: [1, 2, 3, 4].map((n) => piece('resin-art', n, { process: [1, 2, 3].map((k) => pinned('resin-art', `piece-${n}-process`, k)) })),
  }),
  stall('bloompath', 'BloomPath', {
    stallSign: 'bloompath bikes',
    signDoodle: 'wheel',
    trimColour: '#e3992c',
    decoration: 'wheel',
    interiorType: 'workshop',
    items: [{ image: 'design/bloompath/product.png', title: 'TODO: the product’s name', note: 'TODO: a line about it', turntable: '', process: [] }],
    hotspots: [
      { x: 0.28, y: 0.55, title: 'TODO: a design decision', note: 'TODO: why you made it' },
      { x: 0.55, y: 0.3, title: 'TODO: a design decision', note: 'TODO: why you made it' },
      { x: 0.78, y: 0.62, title: 'TODO: a design decision', note: 'TODO: why you made it' },
    ],
    wall: [
      pinned('bloompath', 'research', 1),
      pinned('bloompath', 'user-notes', 1),
      pinned('bloompath', 'sketch', 1),
    ],
  }),
  stall('wild-china', 'Wild China', {
    stallSign: 'wild china school',
    signDoodle: 'star',
    trimColour: '#3e9a5a',
    decoration: 'lanterns',
    interiorType: 'classroom',
    pages: [1, 2, 3, 4, 5, 6].map((n) => ({ image: `design/wild-china/page-${n}.jpg`, alt: `TODO: describe page ${n}` })),
    module: { title: 'TODO: the module’s title', goal: 'TODO: its goal, in a line' },
  }),
]

// The words in the market. Rewrite any of them.
export const words = {
  inside: 'click a stall to go inside',
  back: '← back to the market', // the sign by the door
  backTape: 'back to the market', // the tape button in the corner
  caseStudy: 'case study',
  problem: 'the problem',
  made: 'what i made',
  how: 'how i made it',
  learned: 'what i learned',
  close: 'close',
  putBack: 'put it back',
  turn: 'drag to turn it',
  closer: 'hover over it to look closer',
  process: 'process',
  previous: '← back a page',
  next: 'next page →',
  page: (n, total) => `page ${n} of ${total}`,
  workbook: 'the workbook',
  goInside: 'go inside',
}
