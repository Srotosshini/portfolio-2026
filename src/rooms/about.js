// About: the sketchbook page.
// For now this is the self-portrait standing in its box, with the About card
// (bio, CV, contact) open beside it. The postcard comes in version 3.
import * as THREE from 'three'
import { makePiece, stack, popUp, foldFlat, boil } from '../lib/paper.js'
import * as sketch from '../lib/placeholders.js'
import { art, files, base } from '../lib/assets.js'
import { renderAbout } from '../lib/pages.js'

export async function build({ box, stepped }) {
  const room = new THREE.Group()
  room.position.y = box.inner.floor
  box.body.add(room)

  const portraitArt = await art('drawings/self-portrait', (seed) =>
    sketch.portrait({ file: 'drawings/self-portrait-1.png' }, seed),
  )
  const portrait = makePiece(portraitArt, { height: 1.45 })
  portrait.group.position.set(-0.2, 0, -1.5)
  portrait.group.rotation.y = 0.06
  room.add(portrait.group)

  const ordered = stack([portrait])
  let standing = false
  boil(stepped, ordered, () => standing)

  return {
    card: () => renderAbout({ files, base }),
    async open() {
      await popUp(stepped, ordered)
      standing = true
    },
    async close() {
      standing = false
      await foldFlat(stepped, ordered)
    },
  }
}
