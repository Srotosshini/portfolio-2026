// Off-cuts. A handful of paper scraps that get tossed up when something pops,
// tumble through the air a frame at a time, and stay where they land.
import * as THREE from 'three'
import { rng } from './paper.js'

const DT = 1 / 12

// `floor` is the height they land on; `bounds` keeps them inside the box
// ({ x: half-width, back, front }), all in the parent's coordinates.
export function createScraps(stepped, parent, { count = 40, colors, floor = 0, bounds }) {
  // one small crooked quad, drawn many times
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.38, 0, 0.5, -0.5, 0, 0.4, 0.5, 0, -0.5, 0.34, 0], 3))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  geometry.computeVertexNormals()
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), count)
  mesh.castShadow = mesh.receiveShadow = true
  mesh.frustumCulled = false

  const rand = rng(31)
  const tint = new THREE.Color()
  const dummy = new THREE.Object3D()
  const bits = Array.from({ length: count }, (_, i) => {
    mesh.setColorAt(i, tint.set(colors[i % colors.length]))
    return { at: new THREE.Vector3(), speed: new THREE.Vector3(), turn: new THREE.Euler(), size: 0.045 + rand() * 0.06, used: false, flying: false }
  })
  mesh.instanceColor.needsUpdate = true

  const write = () => {
    bits.forEach((bit, i) => {
      dummy.position.copy(bit.at)
      dummy.rotation.copy(bit.turn)
      dummy.scale.setScalar(bit.used ? bit.size : 0) // not thrown yet: not there
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  const land = (bit) => {
    bit.at.y = floor + 0.004 + rand() * 0.006
    bit.turn.set(-Math.PI / 2, 0, rand() * 6.28)
    bit.flying = false
  }
  const keepIn = (bit) => {
    if (!bounds) return
    bit.at.x = THREE.MathUtils.clamp(bit.at.x, -bounds.x, bounds.x)
    bit.at.z = THREE.MathUtils.clamp(bit.at.z, bounds.back, bounds.front)
  }
  write()
  parent.add(mesh)

  let next = 0
  let airborne = 0
  stepped.every(1, () => {
    if (!airborne) return false
    airborne = 0
    for (const bit of bits) {
      if (!bit.flying) continue
      bit.speed.y -= 9 * DT
      bit.speed.x *= 0.88 // paper is draggy
      bit.speed.z *= 0.88
      bit.at.addScaledVector(bit.speed, DT)
      keepIn(bit)
      bit.turn.set(rand() * 6.28, rand() * 6.28, rand() * 6.28) // a new attitude every frame
      if (bit.at.y <= floor + 0.01 && bit.speed.y < 0) land(bit)
      else airborne++
    }
    write()
  })

  return {
    // toss `n` scraps up from around a point
    burst(from, n = 10, power = 1) {
      for (let k = 0; k < n; k++) {
        const bit = bits[next++ % count]
        bit.used = true
        bit.at.set(from.x + (rand() - 0.5) * 0.4, from.y + 0.06, from.z + (rand() - 0.5) * 0.2)
        if (stepped.reduced) {
          // no flight: they are simply there, on the floor
          bit.at.x += (rand() - 0.5) * 0.9
          bit.at.z += rand() * 0.6
          keepIn(bit)
          land(bit)
          continue
        }
        bit.speed.set((rand() - 0.5) * 2.4 * power, (2.1 + rand() * 1.9) * power, (0.1 + rand() * 1.1) * power)
        bit.flying = true
        airborne++
      }
      if (stepped.reduced) write()
      stepped.dirty = true
    },
  }
}
