// The booster packs: one per semester. `order` runs from the oldest (1, the
// bottom step of the staircase) to the newest (the top step). Finish and
// polish rise with each one, from vintage to holographic.
//
// name     on the wrapper and the tags, in your handwriting
// place    on the wrapper only where you have confirmed it
// era      the little symbol on the wrapper and on its cards:
//            'skyline', 'dune', 'leaf', 'moon' or 'stamp' (draw your own:
//            drawings/era-<era>-1.png)
// wrapper  'holo', 'foil', 'glossy', 'matte' or 'vintage'
// finish   of its cards: 'holo', 'glossy', 'matte' or 'worn'
// chaseFinish  optional: a different finish for the set's chase card
// sticker  optional: stuck on the pack in the case
// sealed   a set with nothing in it yet: shown as a sealed pack with this
//          note taped on (or fold its cards into a neighbouring set)
// color    the pack's main colour
export const sets = [
  {
    id: 'fall-2024',
    name: 'fall 2024',
    title: 'Base Set',
    place: '',
    era: 'stamp',
    wrapper: 'vintage',
    finish: 'worn',
    order: 1,
    sticker: '1st edition — rare',
    stamp: 'est. 2024 · 1st edition',
    color: '#34507f',
  },
  {
    id: 'spring-2025',
    name: 'spring 2025',
    place: '',
    era: 'dune',
    wrapper: 'matte',
    finish: 'matte',
    order: 2,
    color: '#dd7a43',
  },
  {
    id: 'fall-2025',
    name: 'fall 2025',
    place: '',
    era: 'moon',
    wrapper: 'glossy',
    finish: 'glossy',
    order: 3,
    sealed: 'lost set · coming soon',
    color: '#2f8a6b',
  },
  {
    id: 'spring-2026',
    name: 'spring 2026',
    place: '',
    era: 'leaf',
    wrapper: 'foil',
    finish: 'glossy',
    chaseFinish: 'holo',
    order: 4,
    color: '#6672dd',
  },
  {
    id: 'fall-2026',
    name: 'fall 2026',
    place: 'shanghai',
    era: 'skyline',
    wrapper: 'holo',
    finish: 'holo',
    order: 5,
    sticker: 'new release!',
    color: '#df3f8e',
  },
]
