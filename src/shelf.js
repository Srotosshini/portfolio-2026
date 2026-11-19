// The landing: a shelf holding six open shoeboxes, each with a tape label.
import * as THREE from 'three'
import { boxes as boxData, site } from './data/projects.js'
import { makePiece, makeFlat, softShadow, texture, rng, stack, popUp } from './lib/paper.js'
import * as sketch from './lib/placeholders.js'
import { art, scan, files } from './lib/assets.js'

const T = 0.06 // cardboard thickness
const BOARD = 0.2 // shelf board thickness
const DEPTH = 3.1 // how deep the shelf is
const HEADROOM = 0.45 // gap between a box and the board above it
const TILE = 6 // a scanned sheet covers this much before it repeats

// Opening width, opening height and depth of each box. Games is the big one.
// Everything in a box folds forward to lie flat, so a box's depth is also the
// tallest thing that can stand in it.
const SIZES = {
  games: [7.2, 3.2, 2.6],
  about: [3.3, 2.4, 1.7],
  photography: [5.0, 3.0, 2.2],
  'creative-coding': [4.6, 2.6, 1.9],
  design: [5.0, 2.1, 1.6],
  research: [4.0, 2.3, 1.6],
}

// What each box is lined with: the scan to use if she has made it, and the
// flat stand-in to draw if not. Any box can also be given its own files:
// textures/lining-<box>.jpg for the walls, and textures/back-<box>.jpg for a
// drawing that fills the back wall. `case`: not an open shoebox but a
// collector's display case, with a cardboard frame and a cellophane front.
// `floor`: a floor of its own (the market's snow).
const LINING = {
  games: { scan: 'black-card', draw: 'black' },
  about: { draw: 'periwinkle' },
  photography: { scan: 'velvet', draw: 'velvet' },
  'creative-coding': { scan: 'display-case', draw: 'display', case: true },
  design: { scan: 'night', draw: 'night', floor: { scan: 'snow', draw: 'snow' } },
  research: { scan: 'manila', draw: 'manila' },
}

// Two arrangements of the same six boxes: a wide shelf for landscape screens
// and a tall one for phones. Rows run top to bottom; the number is where the
// middle of the box sits. Games is at eye level in both. `details` are the
// loose things standing on the shelf: [which, row, x, depth].
const LAYOUTS = {
  wide: {
    width: 13,
    rows: [
      [['photography', -3.2], ['creative-coding', 3.0]],
      [['games', -2.65], ['about', 4.3]],
      [['design', -2.9], ['research', 3.6]],
    ],
    details: [['jar', 1, 1.82, -1.3], ['roll', 0, 0.2, -1.0]],
  },
  tall: {
    width: 7.4,
    rows: [
      [['photography', -1.1]],
      [['creative-coding', 1.2]],
      [['games', 0]],
      [['about', -1.75]],
      [['design', 0.9]],
      [['research', -1.4]],
    ],
    details: [['jar', 3, 1.7, -1.2], ['roll', 1, -2.3, -1.0]],
  },
}

// A slab of card whose texture keeps its real size on every face, instead of
// stretching one whole scan across each. `whole` names a face (0-5) that
// should show one whole picture instead (a drawn back wall).
function slabGeometry(sx, sy, sz, whole = -1) {
  const geometry = new THREE.BoxGeometry(sx, sy, sz)
  const uv = geometry.attributes.uv
  const faces = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]] // +x, -x, +y, -y, +z, -z
  for (let f = 0; f < 6; f++) {
    if (f === whole) continue
    for (let k = f * 4; k < f * 4 + 4; k++) uv.setXY(k, (uv.getX(k) * faces[f][0]) / TILE, (uv.getY(k) * faces[f][1]) / TILE)
  }
  return geometry
}

function sheetGeometry(w, h) {
  const geometry = new THREE.PlaneGeometry(w, h)
  const uv = geometry.attributes.uv
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) * w) / TILE, (uv.getY(k) * h) / TILE)
  return geometry
}

export async function buildShelf({ stepped }) {
  const group = new THREE.Group()
  const rand = rng(2026)
  // is there a scan called textures/<name>.(jpg|png|webp)?
  const has = (name) => files.some((f) => f.startsWith(`textures/${name}.`))

  // ---- materials -------------------------------------------------------------
  const cardboardMap = scan('cardboard', () => sketch.lining('cardboard'))
  // the cut edge of corrugated card, scaled so the wave fits the thickness of the sheet
  const cutEdge = (thickness, upright) => {
    const map = texture(sketch.corrugated(upright))
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    const along = TILE / (thickness * 9)
    const across = TILE / thickness
    map.repeat.set(upright ? across : along, upright ? along : across)
    return new THREE.MeshLambertMaterial({ map })
  }
  const mats = {
    cardboard: new THREE.MeshLambertMaterial({ map: cardboardMap }),
    board: new THREE.MeshLambertMaterial({ map: cardboardMap, color: '#f1e4cf' }),
    backPanel: new THREE.MeshLambertMaterial({ map: cardboardMap, color: '#b9a48c' }),
    wall: new THREE.MeshLambertMaterial({ map: scan('paper', () => sketch.lining('paper')) }),
    rim: cutEdge(T, false),
    rimUpright: cutEdge(T, true),
    boardEdge: cutEdge(BOARD, false),
    boardEdgeUpright: cutEdge(BOARD, true),
  }

  // ---- drawings on the landing ---------------------------------------------
  const [labels, closedTape, jarArt, rollArt] = await Promise.all([
    Promise.all(boxData.map((b) => art(`drawings/label-${b.id}`, (seed) => sketch.tape(b.label, seed), { edge: 0 }))),
    art('drawings/label-unbuilt', (seed) => sketch.tape(site.ui.unbuilt, seed, { width: 900 }), { edge: 0 }),
    art('drawings/shelf-jar', (seed) => sketch.jar(seed)),
    art('drawings/shelf-roll', (seed) => sketch.tapeRoll(seed)),
  ])

  const boxes = new Map()
  const boiling = [] // drawings that boil while the shelf is on screen

  // ---- the six boxes -----------------------------------------------------
  boxData.forEach((data, index) => {
    const [w, h, d] = SIZES[data.id]
    const box = new THREE.Group() // sits on a shelf board; origin = front bottom centre
    const body = new THREE.Group() // the part that moves when it is nudged or picked up
    box.add(body)

    const lining = LINING[data.id]
    const inside = new THREE.MeshLambertMaterial({
      map: scan([`lining-${data.id}`, lining.scan], () => sketch.lining(lining.draw)),
    })
    const floorLook = lining.floor
      ? new THREE.MeshLambertMaterial({ map: scan([`floor-${data.id}`, lining.floor.scan], () => sketch.lining(lining.floor.draw)) })
      : inside
    // the back wall can carry a drawing of its own, shown whole
    const drawnBack = has(`back-${data.id}`)
    const backWall = drawnBack
      ? new THREE.MeshLambertMaterial({ map: scan(`back-${data.id}`, null, { tile: false }) })
      : inside
    // One slab of card per side; `face` is the side that looks into the box.
    // Each is set a hair off true, the way card glued by hand never quite lines up.
    const slab = (sx, sy, sz, x, y, z, face, { material = inside, upright = false, whole = -1 } = {}) => {
      const sides = Array(6).fill(mats.cardboard) // +x, -x, +y, -y, +z, -z
      sides[4] = upright ? mats.rimUpright : mats.rim // the cut edge that faces the viewer
      sides[face] = material
      const mesh = new THREE.Mesh(slabGeometry(sx, sy, sz, whole), sides)
      mesh.position.set(x + (rand() - 0.5) * 0.012, y + (rand() - 0.5) * 0.008, z + (rand() - 0.5) * 0.01)
      mesh.rotation.set((rand() - 0.5) * 0.006, (rand() - 0.5) * 0.006, (rand() - 0.5) * 0.006)
      mesh.castShadow = mesh.receiveShadow = true
      body.add(mesh)
    }
    slab(w, T, d, 0, T / 2, -d / 2, 2, { material: floorLook }) // floor
    slab(w, T, d, 0, h - T / 2, -d / 2, 3) // top
    slab(T, h - 2 * T, d, -w / 2 + T / 2, h / 2, -d / 2, 0, { upright: true }) // left
    slab(T, h - 2 * T, d, w / 2 - T / 2, h / 2, -d / 2, 1, { upright: true }) // right
    slab(w - 2 * T, h - 2 * T, T, 0, h / 2, -d + T / 2, 4, { material: backWall, whole: drawnBack ? 4 : -1 }) // back

    // The display case: a frame of card round the front (a header along the
    // top, a post each side) and clear cellophane behind it. The cellophane
    // slides up into the header when the case is opened; `front` is what the
    // room needs to do that, its clipping plane included.
    let front = null
    if (lining.case) {
      const bar = (sx, sy, x, y) => {
        const mesh = new THREE.Mesh(slabGeometry(sx, sy, 0.09), mats.cardboard)
        mesh.position.set(x, y, 0)
        mesh.castShadow = mesh.receiveShadow = true
        body.add(mesh)
      }
      bar(w + 0.02, 0.22, 0, h - 0.11)
      bar(0.09, h - 0.22, -w / 2 + 0.045, (h - 0.22) / 2)
      bar(0.09, h - 0.22, w / 2 - 0.045, (h - 0.22) / 2)
      const glassH = h - 0.22 - T
      const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e5) // (clips nothing until it slides)
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 0.16, glassH),
        new THREE.MeshBasicMaterial({ map: texture(sketch.cellophane()), transparent: true, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [clip] }),
      )
      glass.position.set(0, T + glassH / 2, -0.055)
      glass.renderOrder = 2
      body.add(glass)
      front = { mesh: glass, clip, y: glass.position.y, height: glassH, top: h - 0.22 }
    }

    const ground = softShadow(w + 0.7, d + 0.7, 0.2)
    ground.position.set(0, 0.004, -d / 2 + 0.2)
    box.add(ground)

    // The arcade's neon. A stand-in: her own back wall (textures/back-games.jpg) replaces it.
    let neon = null
    if (data.id === 'games' && !drawnBack) {
      const { tubes, glow } = sketch.neon()
      const size = new THREE.PlaneGeometry(w - 2 * T - 0.3, h - 2 * T - 0.16)
      const sign = new THREE.Mesh(size, new THREE.MeshBasicMaterial({ map: texture(tubes), transparent: true, depthWrite: false }))
      const halo = new THREE.Mesh(
        size,
        new THREE.MeshBasicMaterial({ map: texture(glow), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      )
      halo.position.set(0, h / 2, -d + T + 0.008)
      sign.position.set(0, h / 2, -d + T + 0.014)
      body.add(halo, sign)
      neon = {
        level: 1,
        set(level) {
          neon.level = level
          sign.material.opacity = level
          halo.material.opacity = level * 0.6
        },
        // tubes catching: a few uneven blinks, then on
        strike() {
          return stepped.poses([0.25, 0, 0.7, 0.2, 1, 0.75, 1], neon.set)
        },
      }
      neon.set(1)
    }

    // Masking-tape label, stuck over the bottom edge. It sits well clear of the
    // board's front edge, so the box's slight twist never tucks one end behind it.
    const tapes = []
    const label = makeFlat(labels[index], { height: 0.42 })
    label.mesh.position.set(-w / 2 + label.width / 2 + 0.16 + rand() * 0.3, -0.05, 0.16)
    label.mesh.rotation.z = (rand() - 0.5) * 0.09
    body.add(label.mesh)
    boiling.push(label)
    tapes.push(label.mesh)

    if (!data.built) {
      // a strip of tape across the opening: still cutting this one out
      const strip = makeFlat(closedTape, { width: Math.min(w * 0.74, 2.7) })
      strip.mesh.position.set((rand() - 0.5) * 0.3, h * 0.52, 0.03)
      strip.mesh.rotation.z = -0.07 - rand() * 0.07
      strip.mesh.castShadow = false // its shadow lands deep inside the box as a heavy dark bar
      body.add(strip.mesh)
      boiling.push(strip)
      tapes.push(strip.mesh)
    }

    box.rotation.y = (rand() - 0.5) * 0.05 // nobody lines boxes up perfectly
    const corner = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]

    // Move the box through a list of poses, one per tick. A newer call takes
    // over from an older one.
    let latest = 0
    const act = (poses, apply) => {
      const mine = ++latest
      return stepped.poses(poses, (pose) => mine === latest && apply(pose))
    }
    // [out toward the viewer, up, tilt]
    const lift = ([z, y, tilt]) => {
      body.position.z = z
      body.position.y = y
      body.rotation.z = tilt
    }
    let hovered = false

    boxes.set(data.id, {
      id: data.id, data, group: box, body, tapes, neon, ground, front, w, h, d,
      // where things stand inside: floor height, back wall, usable width and height
      inner: { w: w - 2 * T, h: h - 2 * T, floor: T, back: -d + T },
      // corners of the opening in world space, for the hotspot button
      corners() {
        corner[0].set(-w / 2, 0, 0)
        corner[1].set(w / 2, 0, 0)
        corner[2].set(-w / 2, h, 0)
        corner[3].set(w / 2, h, 0)
        for (const c of corner) box.localToWorld(c)
        return corner
      },
      // The rectangle the camera frames once it has pushed inside: a little
      // wider than the box, so its side walls stay in view, and a little low,
      // so there is floor in front of the pieces. `focus` is how far back the
      // framed plane sits (0 the opening, 1 the back wall): a room whose
      // pieces stand near the front frames further forward. `fit` > 1 leaves
      // more room around it.
      view(focus = 0.8, fit = 1) {
        return { cx: box.position.x, cy: box.position.y + h / 2 - 0.12, w: (w + 0.4) * fit, h: (h - 0.1) * fit, z: -d * focus }
      },
      // Pointer or keyboard focus arrives. An open box is picked up a little,
      // as if someone has hold of it; a closed one only rocks on the shelf.
      hover(on) {
        if (on === hovered) return
        hovered = on
        if (!data.built) {
          if (on) act([0.05, -0.04, 0.025, -0.012, 0], (tilt) => (body.rotation.z = tilt))
        } else if (on) {
          act([[0.1, 0.05, 0.02], [0.24, 0.12, -0.014], [0.32, 0.15, 0.007], [0.3, 0.13, 0]], lift)
        } else {
          act([[0.18, 0.05, 0], [0.05, 0, 0.006], [0, 0, 0]], lift)
        }
      },
      // closed box: shuffle side to side on the board, no
      refuse() {
        return act([0.08, -0.08, 0.05, -0.05, 0.02, 0], (x) => (body.position.x = x))
      },
      // put it squarely back in its place, whatever it was doing
      rest() {
        latest++
        hovered = false
        body.position.set(0, 0, 0)
        body.rotation.set(0, 0, 0)
      },
    })
  })

  // ---- loose things on the shelf ------------------------------------------
  const details = {
    jar: makePiece(jarArt, { height: 1.15 }),
    roll: makePiece(rollArt, { height: 0.62 }),
  }
  for (const piece of Object.values(details)) {
    group.add(piece.group)
    boiling.push(piece)
  }

  // ---- the shelf itself, rebuilt whenever the arrangement changes --------
  let frame = null
  let shell = null
  let current = null

  function setLayout(name) {
    if (name === current) return
    current = name
    const layout = LAYOUTS[name]
    if (shell) {
      shell.traverse((o) => {
        o.geometry?.dispose()
        if (o.userData.ownMap) o.material.map.dispose()
      })
      group.remove(shell)
    }
    shell = new THREE.Group()
    group.add(shell)

    const outer = layout.width + BOARD * 2
    const add = (mesh, x, y, z) => {
      mesh.position.set(x, y, z)
      mesh.castShadow = mesh.receiveShadow = true
      shell.add(mesh)
      return mesh
    }
    const boardSides = [mats.board, mats.board, mats.board, mats.board, mats.boardEdge, mats.board]
    const board = (y) => {
      const mesh = add(new THREE.Mesh(slabGeometry(outer, BOARD, DEPTH), boardSides), 0, y - BOARD / 2, -DEPTH / 2 + 0.06)
      mesh.rotation.z = (rand() - 0.5) * 0.004 // no shelf is ever quite level
      return mesh
    }

    let y = 0
    const rowY = []
    const boardY = [0]
    board(0) // the bottom board; boxes on the lowest row stand on y = 0
    ;[...layout.rows].reverse().forEach((row) => {
      rowY.unshift(y)
      for (const [id, x] of row) {
        const box = boxes.get(id)
        box.group.position.set(x, y, 0)
        if (!box.group.parent) group.add(box.group)
      }
      y += Math.max(...row.map(([id]) => SIZES[id][1])) + HEADROOM + BOARD
      boardY.push(y)
      board(y)
    })
    const top = y

    const uprightSides = [mats.board, mats.board, mats.board, mats.board, mats.boardEdgeUpright, mats.board]
    for (const side of [-1, 1])
      add(new THREE.Mesh(slabGeometry(BOARD, top + BOARD, DEPTH), uprightSides), (side * (layout.width + BOARD)) / 2, (top - BOARD) / 2, -DEPTH / 2 + 0.06)

    add(new THREE.Mesh(sheetGeometry(outer, top + BOARD), mats.backPanel), 0, (top - BOARD) / 2, -DEPTH + 0.08).castShadow = false
    add(new THREE.Mesh(sheetGeometry(90, 63), mats.wall), 0, top / 2, -DEPTH).castShadow = false

    // pencil construction lines left on the wall around the shelf
    const gw = outer + 3.4
    const gh = top + BOARD + 2.4
    const gBottom = -BOARD - 0.7
    const guides = new THREE.Mesh(
      new THREE.PlaneGeometry(gw, gh),
      new THREE.MeshBasicMaterial({
        map: texture(sketch.guides({ w: gw, h: gh, boards: boardY, half: outer / 2, bottom: gBottom })),
        transparent: true,
        depthWrite: false,
      }),
    )
    guides.userData.ownMap = true
    guides.position.set(0, gBottom + gh / 2, -DEPTH + 0.02)
    shell.add(guides)

    for (const [which, row, x, z] of layout.details) details[which].group.position.set(x, rowY[row], z)

    // What the landing camera frames: the shelf plus some wall. The tall
    // shelf keeps more wall above it, because on a phone her name and the
    // index card sit over the top of the shelf rather than beside it.
    const wallAround = name === 'tall' ? 3.2 : 2
    frame = { cx: 0, cy: (top - BOARD) / 2 + wallAround * 0.08, w: outer + 1.5, h: top + BOARD + wallAround, z: 0 }
  }

  // ---- the opening --------------------------------------------------------
  // Stop-motion set dressing: the boxes are set down on the shelf one after
  // another, their tape is pressed on, the neon catches, and the loose things
  // stand up.
  const looseThings = stack(Object.values(details))
  for (const piece of looseThings) piece.setFold(0) // standing, unless the opening lays them down
  let run = 0
  let playing = false

  function snap() {
    for (const box of boxes.values()) {
      box.group.visible = true
      box.ground.visible = true
      box.rest()
      for (const tape of box.tapes) {
        tape.visible = true
        tape.scale.set(1, 1, 1)
      }
      box.neon?.set(1)
    }
    for (const piece of looseThings) {
      piece.setFold(0)
      piece.hinge.rotation.z = 0
    }
    stepped.dirty = true
  }

  // Skip to the end of the opening, if it is still playing.
  function settle() {
    if (!playing) return
    playing = false
    run++ // anything still running stops touching the scene
    snap()
  }

  async function playIntro() {
    const mine = ++run
    const live = () => mine === run
    playing = true
    const list = [...boxes.values()]
    for (const box of list) {
      box.group.visible = false
      box.ground.visible = false
      for (const tape of box.tapes) tape.visible = false
      box.neon?.set(0)
    }
    for (const piece of looseThings) piece.setFold(piece.flat)

    // [out toward the viewer, up, tilt]: carried in from the front, set down, a little bump
    const setDown = [[1.7, 0.42, 0.05], [1.05, 0.42, 0.03], [0.5, 0.34, 0.015], [0.14, 0.16, 0], [0, 0, -0.02], [0, 0.035, 0.01], [0, 0, 0]]
    const press = [1.5, 1.18, 0.94, 1]
    await Promise.all(
      list.map(async (box, i) => {
        await stepped.poses(
          setDown,
          ([z, y, tilt], k) => {
            if (!live()) return
            box.group.visible = true
            box.ground.visible = k >= 4
            box.body.position.set(0, y, z)
            box.body.rotation.z = tilt
          },
          { delay: 2 + i * 2 },
        )
        await stepped.poses(press, (scale) => {
          if (!live()) return
          for (const tape of box.tapes) {
            tape.visible = true
            tape.scale.setScalar(scale)
          }
        })
        if (live()) box.neon?.strike()
      }),
    )
    if (live()) await popUp(stepped, looseThings)
    if (live()) settle()
  }

  // The neon is never quite steady: every so often a tube dips for a frame or two.
  const sign = boxes.get('games')?.neon
  let dip = []
  if (sign) {
    stepped.every(1, () => {
      if (sign.level === 0) return false
      if (dip.length) {
        sign.set(dip.shift())
        return 'looks' // the tubes cast no shadow
      }
      if (rand() > 0.025) return false
      dip = [0.45, 1, 0.7, 1]
      return false
    })
  }

  return {
    group, boxes, boiling, setLayout, playIntro, settle,
    frame: () => frame,
    get layout() {
      return current
    },
  }
}
