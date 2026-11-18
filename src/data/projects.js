// Everything a visitor reads lives in this one file.
//
// Anything that starts with "TODO:" is a placeholder waiting for your own
// words. It shows up on the site in grey pencil so it is easy to spot, and the
// build prints how many are left. Replace the whole string, including "TODO:".
//
// Files (clips, process shots, the CV) are looked for in /public at the paths
// written here. If a file is not there yet, the site shows a note with the
// path it expects instead of breaking.

export const site = {
  name: 'Srotosshini',
  description: 'TODO: one sentence about you, for search results and link previews',
  intro: 'TODO: one or two sentences that open the list view, in your own voice',

  // true: show pencil placeholders and "file goes here" notes.
  // false: hide anything unfinished (flip this before sending the link out).
  placeholders: true,

  // Small pieces of interface text. Rewrite any of them.
  ui: {
    list: 'list of all work',
    toShelf: 'back to the shelf',
    toRoom: 'back to the box',
    unbuilt: 'still cutting this one out',
    seeInBox: 'see it in its box',
    stopMotion: 'hold still',
    startMotion: 'let it move',
    claw: 'claw machine',
    soundIsOn: 'sound on',
    soundIsOff: 'sound off',
    windBack: 'wind the film back',
    windOn: 'wind the film on',
    noscript: 'The shelf needs JavaScript. Everything is also in the',
  },

  // Headings used on every project page.
  labels: {
    credit: 'Project by',
    role: 'Role',
    tools: 'Tools',
    process: 'Process',
    learned: 'What I learned',
    play: 'Play it',
    clipSlot: 'clip goes here',
    runSketch: 'Open it full size',
    cv: 'CV (PDF)',
    contact: 'Contact',
    photo: 'Photograph',
    photoSlot: 'photo goes here',
    fullSize: 'see it full size',
    previous: 'previous',
    next: 'next',
  },
}

// The six boxes on the shelf, in keyboard order. `built: false` shows the
// "still cutting this one out" tape and keeps the box closed.
export const boxes = [
  { id: 'games', label: 'Games', built: true },
  { id: 'photography', label: 'Photography', built: true },
  { id: 'code', label: 'Creative coding', built: true },
  { id: 'design', label: 'Design', built: false },
  { id: 'research', label: 'Art and research', built: false },
  { id: 'about', label: 'About', built: true },
]

// One entry per project. Arcade cabinets appear left to right in this order.
//   kind: 'cabinet'  a cereal-box cabinet with a screen
//         'cutout'   a quiet standing cutout, no cabinet
//   clip:  20 to 40 seconds of gameplay, landscape (mp4)
//   build: web address of a playable build; if set, it runs in the cabinet
//          screen instead of the clip
//   coin:  where the coin slot is on the cabinet drawing, as fractions of its
//          width (from the left) and height (from the bottom)
export const projects = [
  {
    id: 'snikisnak',
    box: 'games',
    kind: 'cabinet',
    title: 'SnikiSnak',
    pitch: 'TODO: one-line pitch for SnikiSnak',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools'],
    clip: 'clips/snikisnak.mp4',
    poster: 'clips/snikisnak.jpg',
    build: '',
    coin: { x: 0.5, y: 0.18 },
    process: [
      { src: 'process/snikisnak-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/snikisnak-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/snikisnak-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'TODO: link label', href: '' }],
  },
  {
    id: 'patchwork',
    box: 'games',
    kind: 'cabinet',
    title: 'PATCHWORK',
    pitch: 'TODO: one-line pitch for PATCHWORK',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools'],
    clip: 'clips/patchwork.mp4',
    poster: 'clips/patchwork.jpg',
    build: '',
    coin: { x: 0.5, y: 0.18 },
    process: [
      { src: 'process/patchwork-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/patchwork-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/patchwork-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'TODO: link label', href: '' }],
  },
  {
    id: 'duckie',
    box: 'games',
    kind: 'cabinet',
    title: 'Duckie Goes Home',
    pitch: 'TODO: one-line pitch for Duckie Goes Home',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools'],
    clip: 'clips/duckie.mp4',
    poster: 'clips/duckie.jpg',
    build: '',
    coin: { x: 0.5, y: 0.18 },
    process: [
      { src: 'process/duckie-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/duckie-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/duckie-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'TODO: link label', href: '' }],
  },
  {
    id: 'park',
    box: 'games',
    kind: 'cabinet',
    title: 'A Day at the Park',
    pitch: 'TODO: one-line pitch for A Day at the Park',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools'],
    clip: 'clips/park.mp4',
    poster: 'clips/park.jpg',
    build: '',
    coin: { x: 0.5, y: 0.18 },
    process: [
      { src: 'process/park-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/park-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/park-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'TODO: link label', href: '' }],
  },
  {
    id: 'jam',
    box: 'games',
    kind: 'cabinet',
    title: 'Game jam entry',
    pitch: 'TODO: one-line pitch for the game jam entry (and swap the title above for its name)',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools'],
    clip: 'clips/jam.mp4',
    poster: 'clips/jam.jpg',
    build: '',
    coin: { x: 0.5, y: 0.18 },
    process: [
      { src: 'process/jam-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/jam-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/jam-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'TODO: link label', href: '' }],
  },
  {
    // Runs live inside its cabinet screen, straight from its own site.
    // (A pitch was suggested for it: "You are a laser pointer leading a crowd
    // of kittens to safety before a storm." Use it, or write your own.)
    id: 'red-dot-rescue',
    box: 'games',
    kind: 'cabinet',
    title: 'Red Dot Rescue',
    pitch: 'TODO: one-line pitch for Red Dot Rescue',
    role: 'TODO: what you did on it',
    tools: ['Three.js', 'JavaScript', 'Vite', 'Web Audio API'],
    clip: 'clips/red-dot-rescue.mp4',
    poster: 'clips/red-dot-rescue.jpg',
    build: 'https://srotosshini.github.io/red-dot-rescue/',
    coin: { x: 0.5, y: 0.18 },
    process: [
      { src: 'process/red-dot-rescue-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/red-dot-rescue-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/red-dot-rescue-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Srotosshini/red-dot-rescue' }],
  },
  {
    // Not a cabinet: this project belongs to your supervisor, so it gets a
    // quiet cutout and the credit line comes first.
    id: 'spatial-equity',
    box: 'games',
    kind: 'cutout',
    title: 'Spatial Equity: A Room for Many',
    credit: 'TODO: your supervisor’s name (this is their project)',
    pitch: 'TODO: one line on what the project is',
    role: 'Unity development, shaders, documentation',
    tools: ['Unity'],
    clip: 'clips/spatial-equity.mp4',
    poster: 'clips/spatial-equity.jpg',
    build: '',
    process: [
      { src: 'process/spatial-equity-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/spatial-equity-2.jpg', alt: 'TODO: describe this image' },
      { src: 'process/spatial-equity-3.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [{ label: 'TODO: link label', href: '' }],
  },
  // ---- Creative coding: the dark box --------------------------------------
  // Each sketch gets a key on the paper piano and a window cut in the back
  // wall: press the key and the window opens with the sketch running live
  // behind it. Keys and windows go left to right in this order.
  //   build: the web address of the live sketch (for a p5.js sketch, its
  //          https://editor.p5js.org/<you>/full/<id> link), or a folder of
  //          your own in public/, like 'sketches/flock/index.html'. Left
  //          empty, a stand-in runs in the window instead.
  {
    id: 'sketch-1',
    box: 'code',
    kind: 'sketch',
    title: 'TODO: what sketch 1 is called',
    pitch: 'TODO: one line about the sketch',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools (p5.js, three.js, …)'],
    build: '',
    process: [
      { src: 'process/sketch-1-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/sketch-1-2.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [],
  },
  {
    id: 'sketch-2',
    box: 'code',
    kind: 'sketch',
    title: 'TODO: what sketch 2 is called',
    pitch: 'TODO: one line about the sketch',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools (p5.js, three.js, …)'],
    build: '',
    process: [
      { src: 'process/sketch-2-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/sketch-2-2.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [],
  },
  {
    id: 'sketch-3',
    box: 'code',
    kind: 'sketch',
    title: 'TODO: what sketch 3 is called',
    pitch: 'TODO: one line about the sketch',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools (p5.js, three.js, …)'],
    build: '',
    process: [
      { src: 'process/sketch-3-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/sketch-3-2.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [],
  },
  {
    id: 'sketch-4',
    box: 'code',
    kind: 'sketch',
    title: 'TODO: what sketch 4 is called',
    pitch: 'TODO: one line about the sketch',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools (p5.js, three.js, …)'],
    build: '',
    process: [
      { src: 'process/sketch-4-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/sketch-4-2.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [],
  },
  {
    id: 'sketch-5',
    box: 'code',
    kind: 'sketch',
    title: 'TODO: what sketch 5 is called',
    pitch: 'TODO: one line about the sketch',
    role: 'TODO: what you did on it',
    tools: ['TODO: tools (p5.js, three.js, …)'],
    build: '',
    process: [
      { src: 'process/sketch-5-1.jpg', alt: 'TODO: describe this image' },
      { src: 'process/sketch-5-2.jpg', alt: 'TODO: describe this image' },
    ],
    learned: 'TODO: a short paragraph on what you learned',
    links: [],
  },
]

// Photography. There is no list to keep: every image in public/photos/ goes
// onto the reel, in file-name order (01.jpg, 02.jpg, …). If a smaller copy
// with the same name is in public/photos/thumbs/, the reel uses that and only
// loads the big one when it is projected.
//
// Words are optional. Add an entry under the file's name (without .jpg) to
// give a photo a caption, and `alt` to describe it for people who cannot see it.
export const photos = {
  // '01': { caption: 'where and when, or whatever you want to say', alt: 'what is in the picture' },
}

export const about = {
  title: 'About',
  bio: ['TODO: a short paragraph about you', 'TODO: what you are looking for (the internship)'],
  cv: 'cv.pdf',
  contact: [
    { label: 'Email', value: 'TODO: your email address', href: '' },
    { label: 'GitHub', value: 'TODO: your GitHub', href: '' },
    { label: 'Itch.io', value: 'TODO: your itch.io page', href: '' },
  ],
}
