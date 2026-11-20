// The cities on the travel pinboard in the About room, in the order the red
// string runs between them (from home, Dhaka). Each gets a polaroid on the
// board: an illustrated scene of her there, its name and a one-line caption
// in her handwriting. Click a polaroid and it comes off the board, big, with a
// button for her real photos from that trip.
//
//   slug      the city's short name, used for its files
//   city      as written on the polaroid
//   country   the board groups the polaroids roughly by country
//   caption   one line, in her handwriting (TODO: hers to write)
//   scene     the stand-in illustration: what she is doing there. Her own
//             drawing replaces it: public/drawings/scene-<slug>.png (square)
//   date      optional, e.g. 'march 2025'
//   lat, lon  where it is, for the map behind the polaroids
//
// Her photos from a trip: any images in public/about/places/<slug>/ (they are
// found by themselves, in name order).
export const places = [
  { slug: 'dhaka', city: 'dhaka', country: 'Bangladesh', caption: 'home, on the sofa with my cats', lat: 23.8, lon: 90.4, scene: { pose: 'sit', place: 'home' } },
  { slug: 'abu-dhabi', city: 'abu dhabi', country: 'UAE', caption: 'dunes at sunset, scarf everywhere', lat: 24.45, lon: 54.4, scene: { pose: 'wave', outfit: 'scarf', place: 'dunes' } },
  { slug: 'dubai', city: 'dubai', country: 'UAE', caption: 'something pink under the burj', lat: 25.2, lon: 55.27, scene: { pose: 'hold', prop: 'drink', place: 'burj' } },
  { slug: 'shanghai', city: 'shanghai', country: 'China', caption: 'tanghulu on the bund, douyin face on', lat: 31.23, lon: 121.47, scene: { pose: 'hold-up', prop: 'tanghulu', makeup: 'douyin', place: 'bund', night: true } },
  { slug: 'beijing', city: 'beijing', country: 'China', caption: 'hanfu by the forbidden city walls', lat: 39.9, lon: 116.4, scene: { pose: 'stand', outfit: 'hanfu', place: 'forbidden' } },
  { slug: 'xian', city: "xi'an", country: 'China', caption: 'copying a terracotta warrior', lat: 34.34, lon: 108.94, scene: { pose: 'warrior', place: 'terracotta' } },
  { slug: 'nanjing', city: 'nanjing', country: 'China', caption: 'plane trees and temple lanterns', lat: 32.06, lon: 118.8, scene: { pose: 'wave', place: 'lanterns' } },
  { slug: 'suzhou', city: 'suzhou', country: 'China', caption: 'through the moon gate, umbrella up', lat: 31.3, lon: 120.6, scene: { pose: 'hold-up', prop: 'umbrella', place: 'moongate' } },
  { slug: 'chengdu', city: 'chengdu', country: 'China', caption: 'one panda in my arms, more behind', lat: 30.66, lon: 104.07, scene: { pose: 'hold', prop: 'panda', place: 'pandas' } },
  { slug: 'chongqing', city: 'chongqing', country: 'China', caption: 'hotpot steam and hongyadong lights', lat: 29.56, lon: 106.55, scene: { pose: 'peace', place: 'hongyadong', night: true } },
  { slug: 'guangzhou', city: 'guangzhou', country: 'China', caption: 'dim sum under the canton tower', lat: 23.13, lon: 113.26, scene: { pose: 'hold', prop: 'dimsum', place: 'canton' } },
  { slug: 'lijiang', city: 'lijiang', country: 'China', caption: 'old town roofs, snow mountain', lat: 26.87, lon: 100.23, scene: { pose: 'peace', place: 'lijiang' } },
  { slug: 'sanya', city: 'sanya', country: 'China', caption: 'coconut, sunglasses, beach', lat: 18.25, lon: 109.5, scene: { pose: 'hold', prop: 'coconut', outfit: 'beach', place: 'beach' } },
  { slug: 'harbin', city: 'harbin', country: 'China', caption: 'bundled up by the ice sculptures', lat: 45.8, lon: 126.53, scene: { pose: 'wave', outfit: 'coat', place: 'ice', night: true } },
  { slug: 'zhangjiajie', city: 'zhangjiajie', country: 'China', caption: 'pillar mountains in the mist', lat: 29.12, lon: 110.48, scene: { pose: 'peace', place: 'pillars' } },
  { slug: 'tokyo', city: 'tokyo', country: 'Japan', caption: 'shibuya crossing at night', lat: 35.68, lon: 139.69, scene: { pose: 'peace', place: 'shibuya', night: true } },
  { slug: 'kyoto', city: 'kyoto', country: 'Japan', caption: 'kimono in gion', lat: 35.01, lon: 135.77, scene: { pose: 'stand', outfit: 'kimono', place: 'gion' } },
  { slug: 'osaka', city: 'osaka', country: 'Japan', caption: 'takoyaki by the canal', lat: 34.69, lon: 135.5, scene: { pose: 'hold', prop: 'takoyaki', place: 'dotonbori', night: true } },
  { slug: 'nara', city: 'nara', country: 'Japan', caption: 'i bowed, the deer bowed back', lat: 34.69, lon: 135.8, scene: { pose: 'bow', place: 'deer' } },
  { slug: 'kuala-lumpur', city: 'kuala lumpur', country: 'Malaysia', caption: 'peace sign, petronas towers', lat: 3.14, lon: 101.69, scene: { pose: 'peace', place: 'petronas' } },
  { slug: 'kuching', city: 'kuching', country: 'Malaysia', caption: 'the cat city has a giant cat', lat: 1.55, lon: 110.34, scene: { pose: 'wave', place: 'catstatue' } },
]

// the window over her desk: the cities it can show (clicking it goes to the next)
export const windowViews = ['shanghai', 'dhaka', 'abu-dhabi', 'tokyo', 'kyoto']
