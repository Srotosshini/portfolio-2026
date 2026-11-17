// Games: the arcade.
// Cereal-box cabinets with cut-out screens, a claw machine you can play, and a
// quiet cutout for work that is not a cabinet. Click a cabinet to drop a paper
// coin; the camera pushes into its screen and the clip (or a playable build)
// runs there.
import * as THREE from 'three'
import { projects, site } from '../data/projects.js'
import { PALETTE as P, makePiece, makeFlat, texture, fillArea, canvas, stack, popUp, foldFlat, boil, rng } from '../lib/paper.js'
import { createScraps } from '../lib/scraps.js'
import * as sketch from '../lib/placeholders.js'
import { art, has, files, base, loadImage } from '../lib/assets.js'
import { renderProject } from '../lib/pages.js'

const CABINET_WIDTH = 1.18
const MACHINE_WIDTH = 1.14

// Everything in a box folds forward to lie flat, so nothing may be taller
// than its distance from the front of the box. Tall things stand at the back.
const BACK_ROW = -2.38
const FRONT_ROW = -2.02

const SCREEN_IDLE = 0.62 // how bright a screen is when nobody is looking at it

export async function build({ box, stepped, overlay, redraw, goTo, lights }) {
  const { inner } = box
  const room = new THREE.Group()
  room.position.y = inner.floor
  box.body.add(room)

  const games = projects.filter((p) => p.box === box.id && p.kind === 'cabinet')
  const quiet = projects.filter((p) => p.box === box.id && p.kind === 'cutout')
  const accents = Object.values(P.highlighter)
  const rand = rng(77)
  const lerp = THREE.MathUtils.lerp

  // her drawings where they exist, labelled stand-ins where they do not
  const [cabinetArt, cutoutArt, machineArt, clawArt, coinArt, toyArt] = await Promise.all([
    Promise.all(
      games.map((game, i) =>
        art(`drawings/cabinet-${game.id}`, (seed) =>
          sketch.cabinet({ title: game.title, accent: accents[i % accents.length], style: i, file: `drawings/cabinet-${game.id}-1.png` }, seed),
        ),
      ),
    ),
    Promise.all(
      quiet.map((project) =>
        art(`drawings/cutout-${project.id}`, (seed) =>
          sketch.placard({ title: project.title, file: `drawings/cutout-${project.id}-1.png` }, seed),
        ),
      ),
    ),
    art('drawings/claw-machine', (seed) => sketch.clawMachine({ file: 'drawings/claw-machine-1.png' }, seed)),
    art('drawings/claw', (seed) => sketch.claw(seed)),
    art('drawings/coin', (seed) => sketch.coin(seed)),
    Promise.all([0, 1, 2].map((i) => art(`drawings/character-${i + 1}`, (seed) => sketch.character(i, seed)))),
  ])

  // corners of a standing piece in world space, for its hotspot button
  const cornersOf = (piece) => {
    const c = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
    return () => {
      c[0].set(-piece.width / 2, 0, 0)
      c[1].set(piece.width / 2, 0, 0)
      c[2].set(-piece.width / 2, piece.height, 0)
      c[3].set(piece.width / 2, piece.height, 0)
      for (const p of c) piece.hinge.localToWorld(p)
      return c
    }
  }

  // off-cuts that fly up when things pop, and stay on the floor afterwards
  const scraps = createScraps(stepped, room, {
    colors: [P.paper, P.paper, ...accents, P.periwinkle],
    bounds: { x: inner.w / 2 - 0.15, back: inner.back + 0.15, front: -0.25 },
  })

  // ---- cabinets -------------------------------------------------------------
  // The screen is whatever hole she cut in the cabinet drawing. A card sits
  // behind it showing a still (or a little attract loop); when a game is
  // opened that card turns into a real hole in the canvas and the clip shows
  // through from behind.
  const hole = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending })

  function addScreen(piece, game, index) {
    const cut = piece.window ?? { x: 0.17, y: 0.26, w: 0.66, h: 0.24 }
    const w = cut.w * piece.width
    const h = cut.h * piece.height
    const cx = (cut.x + cut.w / 2 - 0.5) * piece.width
    const cy = (1 - cut.y - cut.h / 2) * piece.height
    const geometry = new THREE.PlaneGeometry(w * 1.1, h * 1.1)
    const idle = new THREE.MeshBasicMaterial()
    idle.color.setScalar(SCREEN_IDLE)
    const mesh = new THREE.Mesh(geometry, idle)
    mesh.position.set(cx, cy, -0.012)
    // seen from behind (when the cabinet lies face down) it is just the back of a card
    const backing = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: '#3a3a42', side: THREE.BackSide }))
    backing.position.set(cx, cy, -0.02)
    piece.hinge.add(mesh, backing)

    let play = null // redraws the attract loop, if this screen has one
    if (has(game.poster)) {
      loadImage(game.poster)
        .then((img) => {
          idle.map = fillArea(texture(img), img.width / img.height, w / h)
          idle.needsUpdate = true
          redraw()
        })
        .catch(() => {})
    } else {
      // no still yet: a doodle loop, with a note saying which file it is waiting for
      const loop = canvas(240, 135)
      const ctx = loop.getContext('2d')
      const lines = !site.placeholders
        ? []
        : has(game.clip) || game.build
          ? ['still image goes here', `public/${game.poster}`]
          : ['clip goes here', `public/${game.clip}`]
      idle.map = texture(loop)
      idle.map.magFilter = THREE.NearestFilter // close up it goes chunky, like an old arcade screen
      play = (frame) => {
        sketch.attract(ctx, index, frame, { title: game.title, lines })
        idle.map.needsUpdate = true
      }
      play(index * 3)
    }

    const c = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
    return {
      mesh, idle, play,
      // corners of the cut-out in world space
      corners() {
        c[0].set(cx - w / 2, cy - h / 2, 0)
        c[1].set(cx + w / 2, cy - h / 2, 0)
        c[2].set(cx - w / 2, cy + h / 2, 0)
        c[3].set(cx + w / 2, cy + h / 2, 0)
        for (const p of c) piece.hinge.localToWorld(p)
        return c
      },
    }
  }

  const spacing = Math.min(1.03, (inner.w - 0.04 - MACHINE_WIDTH - CABINET_WIDTH) / Math.max(1, games.length - 1))
  const left = -inner.w / 2 + 0.02 + CABINET_WIDTH / 2
  const cabinets = games.map((game, i) => {
    const front = i % 2 === 0 // every other one stands a step forward, toy-theatre style
    const piece = makePiece(cabinetArt[i], { width: front ? CABINET_WIDTH : CABINET_WIDTH * 1.05 })
    piece.group.position.set(left + i * spacing, 0, front ? FRONT_ROW : BACK_ROW)
    piece.group.rotation.y = (rand() - 0.5) * 0.07
    room.add(piece.group)
    return { game, piece, screen: addScreen(piece, game, i), nodding: false }
  })

  // ---- claw machine ------------------------------------------------------
  const machine = makePiece(machineArt, { width: MACHINE_WIDTH })
  machine.group.position.set(inner.w / 2 - MACHINE_WIDTH / 2 - 0.02, 0, BACK_ROW - 0.04)
  room.add(machine.group)

  const glass = machine.window ?? { x: 0.15, y: 0.15, w: 0.7, h: 0.44 }
  const glassX = (glass.x + glass.w / 2 - 0.5) * machine.width
  const glassW = glass.w * machine.width
  const glassH = glass.h * machine.height
  const glassTop = (1 - glass.y) * machine.height
  const inside = new THREE.Mesh(
    new THREE.PlaneGeometry(glassW * 1.1, glassH * 1.1),
    new THREE.MeshLambertMaterial({ color: P.periwinkle, side: THREE.DoubleSide }),
  )
  inside.position.set(glassX, glassTop - glassH / 2, -0.06)
  inside.receiveShadow = true
  machine.hinge.add(inside)

  // her characters, each hanging on a string behind the glass
  const stringMaterial = new THREE.MeshBasicMaterial({ color: P.navy })
  const toys = toyArt.map((prep, i) => {
    const hang = new THREE.Group() // swings from the top of the glass
    const length = 0.2 + (i % 2) * 0.14
    const home = new THREE.Vector3(glassX + (i - 1) * glassW * 0.3, glassTop - 0.03, -0.04 + i * 0.004)
    hang.position.copy(home)
    const string = new THREE.Mesh(new THREE.PlaneGeometry(0.014, length), stringMaterial)
    string.position.y = -length / 2
    const toy = makeFlat(prep, { height: 0.36 })
    toy.mesh.position.y = -length - 0.16
    hang.add(string, toy.mesh)
    machine.hinge.add(hang)
    return { hang, string, toy, home, length, swing: 0.06, phase: i * 2.1, held: false, won: false }
  })

  const claw = makeFlat(clawArt, { height: 0.42 })
  const clawHome = new THREE.Vector3(glassX, glassTop - 0.14, -0.026)
  claw.mesh.position.copy(clawHome)
  machine.hinge.add(claw.mesh)

  // The claw follows the pointer across the glass. A click drops it: line it
  // up with a character and it carries them to the chute, and they hop out
  // onto the floor. From the keyboard it goes for the next one by itself.
  const reachLeft = glassX - glassW / 2 + 0.12
  const reachRight = glassX + glassW / 2 - 0.12
  const chuteX = THREE.MathUtils.clamp(machine.width * -0.2, reachLeft, reachRight)
  let aim = clawHome.x
  let aimed = false // is a pointer steering it?
  let grabbing = false
  let prizes = 0
  let session = 0 // goes up when the room is put away, so a grab in progress knows to stop

  function hangBack(toy) {
    toy.hang.add(toy.toy.mesh)
    toy.toy.mesh.position.set(0, -toy.length - 0.16, 0)
    toy.toy.mesh.rotation.set(0, 0, 0)
    toy.toy.mesh.scale.setScalar(1)
    toy.hang.position.copy(toy.home)
    toy.hang.rotation.z = 0
    toy.string.visible = true
    toy.held = toy.won = false
  }
  function resetToys() {
    toys.forEach(hangBack)
    prizes = 0
  }

  const PUT_AWAY = Symbol('the room was put away')

  async function grab() {
    if (grabbing || !standing) return
    grabbing = true
    const mine = session
    // each step waits for its frames, then checks the room has not been put away meanwhile
    const step = async (motion) => {
      await motion
      if (mine !== session) throw PUT_AWAY
    }
    try {
      await clawGame(step)
    } catch (error) {
      if (error !== PUT_AWAY) throw error
    } finally {
      grabbing = false
    }
  }

  async function clawGame(step) {
    const hanging = toys.filter((toy) => !toy.won)
    if (!hanging.length) {
      // all won: they go back on their strings and it starts again
      resetToys()
      for (const toy of toys) toy.swing = 0.5
      return
    }
    const x0 = claw.mesh.position.x
    const nearest = hanging.reduce((a, b) => (Math.abs(b.home.x - x0) < Math.abs(a.home.x - x0) ? b : a))
    if (!aimed) await step(stepped.play(4, (t) => (claw.mesh.position.x = lerp(x0, nearest.home.x, t))))
    const x = claw.mesh.position.x
    const caught = Math.abs(nearest.home.x - x) < 0.17
    const top = clawHome.y
    const low = nearest.home.y - nearest.length + 0.17 // prongs just over the character's head
    await step(stepped.play(4, (t) => (claw.mesh.position.y = lerp(top, low, t))))
    await step(stepped.wait(2))

    if (!caught) {
      // closed on nothing: the machine shudders, the claw goes home
      await step(stepped.poses([0.03, -0.03, 0.015, 0], (a) => (machine.hinge.rotation.z = a)))
      await step(stepped.play(4, (t) => (claw.mesh.position.y = lerp(low, top, t))))
      return
    }

    // got one: the string lets go and it rides up under the claw
    const toy = nearest
    toy.held = true
    toy.string.visible = false
    toy.hang.rotation.z = 0
    const lifted = toy.home.y + (top - low)
    await step(
      stepped.play(4, (t) => {
        claw.mesh.position.y = lerp(low, top, t)
        toy.hang.position.set(x, lerp(toy.home.y, lifted, t), toy.home.z)
      }),
    )
    await step(
      stepped.play(5, (t) => {
        claw.mesh.position.x = lerp(x, chuteX, t)
        toy.hang.position.x = lerp(x, chuteX, t)
      }),
    )
    await step(stepped.wait(1))
    // dropped: it falls out of sight behind the front of the machine
    await step(stepped.poses([0.08, 0.3, 0.62, 1], (k) => (toy.hang.position.y = lifted - (glassH + 0.25) * k)))

    // … and hops out of the chute onto the floor in front
    const prize = toy.toy.mesh
    room.attach(prize)
    const from = new THREE.Vector3(machine.group.position.x + chuteX, machine.height * 0.22, machine.group.position.z + 0.08)
    const to = new THREE.Vector3(inner.w / 2 - 0.42 - prizes * 0.27, prize.geometry.parameters.height / 2, -0.8)
    prize.rotation.set(0, 0, 0)
    toy.won = true
    prizes++
    await step(
      stepped.poses([0, 0.12, 0.3, 0.5, 0.7, 0.88, 1], (k) => {
        prize.position.lerpVectors(from, to, k)
        prize.position.y += Math.sin(k * Math.PI) * 0.9
        prize.scale.setScalar(0.35 + 0.65 * Math.min(1, k * 2.5))
        prize.rotation.z = (1 - k) * 2.4
      }),
    )
    scraps.burst(to, 6, 0.7)
    await step(stepped.poses([0.2, -0.14, 0.08, -0.03, 0], (a) => (prize.rotation.z = a)))
    await step(stepped.play(4, (t) => (claw.mesh.position.x = lerp(chuteX, aimed ? aim : clawHome.x, t))))
  }

  // ---- the quiet cutout ---------------------------------------------------
  const cutouts = quiet.map((project, i) => {
    const piece = makePiece(cutoutArt[i], { height: 0.82 })
    piece.group.position.set(inner.w / 2 - 0.95 - i * 0.85, 0, -1)
    piece.group.rotation.y = -0.1
    room.add(piece.group)
    return { project, piece }
  })

  // ---- the coin -------------------------------------------------------------
  const coin = makeFlat(coinArt, { height: 0.2 })
  coin.mesh.visible = false
  room.add(coin.mesh)

  async function dropCoin({ piece, game, screen }) {
    const slot = game.coin ?? { x: 0.5, y: 0.18 }
    const target = new THREE.Vector3((slot.x - 0.5) * piece.width, slot.y * piece.height, 0.04)
    room.worldToLocal(piece.hinge.localToWorld(target))
    const height = 0.95
    const fall = [0, 0.03, 0.1, 0.22, 0.4, 0.64, 0.86, 1] // a little faster each frame
    const spin = [1, 0.35, -0.35, -1, -0.35, 0.35, 1, 1]
    let i = 0
    coin.mesh.visible = true
    await stepped.poses(fall, (k) => {
      coin.mesh.position.set(target.x, target.y + height * (1 - k), target.z)
      coin.mesh.scale.x = spin[i++ % spin.length]
    })
    coin.mesh.visible = false
    // the cabinet rattles and its screen stutters on
    const flicker = [2.2, 0.3, 1.7, 1]
    await stepped.poses([0.035, -0.025, 0.012, 0], (a, n) => {
      piece.hinge.rotation.z = a
      screen.idle.color.setScalar(flicker[Math.min(flicker.length - 1, n ?? 0)])
    })
    screen.idle.color.setScalar(1)
  }

  // ---- buttons ----------------------------------------------------------------
  for (const cabinet of cabinets) {
    cabinet.spot = overlay.addSpot({
      group: box.id,
      label: cabinet.game.title,
      corners: cornersOf(cabinet.piece),
      onClick: () => goTo(`#/${box.id}/${cabinet.game.id}`),
      onHover(on) {
        cabinet.screen.idle.color.setScalar(on ? 1 : SCREEN_IDLE)
        redraw()
        if (!on || !standing || cabinet.nodding) return
        cabinet.nodding = true
        stepped.poses([-0.06, 0.035, -0.014, 0], (a) => cabinet.piece.setFold(a)).then(() => (cabinet.nodding = false))
      },
    })
  }
  overlay.addSpot({
    group: box.id,
    label: site.ui.claw,
    corners: cornersOf(machine),
    onClick: grab,
    onHover(on) {
      aimed = false
      if (on) for (const toy of toys) toy.swing = Math.max(toy.swing, 0.3)
    },
    onMove(fx) {
      aimed = true
      aim = THREE.MathUtils.clamp((fx - 0.5) * machine.width, reachLeft, reachRight)
    },
  })
  for (const cutout of cutouts) {
    cutout.spot = overlay.addSpot({
      group: box.id,
      label: cutout.project.title,
      corners: cornersOf(cutout.piece),
      onClick: () => goTo(`#/${box.id}/${cutout.project.id}`),
    })
  }

  // ---- stand up, fold flat, and everything that keeps moving ------------------
  const ordered = stack([machine, ...cabinets.map((c) => c.piece), ...cutouts.map((c) => c.piece)])
  let standing = false
  let playing = null // the cabinet whose game is open

  boil(stepped, [...ordered, ...toys.map((t) => t.toy), claw], () => standing && !playing)

  stepped.every(1, () => {
    if (!standing || grabbing) return false
    const dx = aim - claw.mesh.position.x
    if (!aimed || Math.abs(dx) < 0.004) return false
    claw.mesh.position.x += dx * 0.55 // the claw trails after the pointer, a frame at a time
  })
  stepped.every(2, (frame) => {
    if (!standing) return false
    for (const toy of toys) {
      if (toy.held) continue
      toy.swing = Math.max(0.05, toy.swing * 0.88)
      toy.hang.rotation.z = Math.sin(frame * 0.33 + toy.phase) * toy.swing
    }
    if (playing) return
    cabinets.forEach((cabinet, i) => cabinet.screen.play?.(frame / 2 + i * 3)) // attract loops
  })

  const find = (id) => [...cabinets, ...cutouts].find((c) => (c.game ?? c.project).id === id)

  return {
    async open() {
      box.neon?.strike()
      await popUp(stepped, ordered, { onUp: (piece) => scraps.burst(piece.group.position, 3) })
      standing = true
    },
    async close() {
      standing = false
      session++
      resetToys()
      claw.mesh.position.copy(clawHome)
      machine.hinge.rotation.z = 0
      await foldFlat(stepped, ordered)
    },

    title: (id) => (find(id).game ?? find(id).project).title,
    spot: (id) => find(id)?.spot,
    // a cabinet plays its clip in its own screen, so the card leaves the clip out
    card(id) {
      const found = find(id)
      return renderProject(found.game ?? found.project, { files, base, media: !found.game })
    },

    // what the camera frames while a project is open
    view(id) {
      const found = find(id)
      if (found.game) {
        const c = found.screen.corners()
        const w = c[1].x - c[0].x
        const h = c[2].y - c[0].y
        // the screen, with the cabinet's marquee above and a little of its panel below
        const tall = innerWidth > innerHeight ? 1.62 : 1.22
        return { cx: (c[0].x + c[1].x) / 2, cy: (c[0].y + c[2].y) / 2 + h * 0.07, w: w * 1.16, h: h * tall, z: c[0].z }
      }
      const { piece } = found
      const at = piece.group.getWorldPosition(new THREE.Vector3())
      return { cx: at.x, cy: at.y + piece.height / 2, w: piece.width * 1.5, h: piece.height * 1.5, z: at.z }
    },

    async start(id) {
      const cabinet = cabinets.find((c) => c.game.id === id)
      if (!cabinet) return
      await dropCoin(cabinet)
      playing = cabinet
      const media = overlay.mountMedia(cabinet.game, cabinet.screen.corners, { files, base })
      if (media) cabinet.screen.mesh.material = hole
      // the arcade's lights go down, so the screen and the neon glow
      await stepped.poses([0.2, 0.4, 0.55], (k) => lights?.dim(k))
    },

    end() {
      overlay.clearMedia()
      if (playing) {
        playing.screen.mesh.material = playing.screen.idle
        playing.screen.idle.color.setScalar(SCREEN_IDLE)
      }
      playing = null
      stepped.poses([0.35, 0.15, 0], (k) => lights?.dim(k))
      redraw()
    },
  }
}
