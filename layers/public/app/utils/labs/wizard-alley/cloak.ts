import * as THREE from 'three'

/**
 * Real-time cloth cloak: a Verlet particle grid pinned along the shoulders,
 * with gravity, damping, inertia from the wearer's motion and sphere
 * collisions against the body. Rendered as a double-sided velvet surface
 * with a vertex-coloured trim along the hem.
 */

export interface CloakStyle {
  primary: string
  accent: string
  /** 'trim' paints the hem, 'clasp' adds a brass clasp, 'plain' neither. */
  variant: string
}

export interface CloakCollider {
  center: THREE.Vector3
  radius: number
}

export interface ClothCloak {
  object: THREE.Group
  /**
   * Anchors the collar: `neck` is the world position at the base of the neck,
   * `forward` / `right` the wearer's horizontal axes (unit vectors).
   */
  setAnchors(neck: THREE.Vector3, forward: THREE.Vector3, right: THREE.Vector3): void
  update(dt: number, colliders: CloakCollider[], velocity: THREE.Vector3, reducedMotion: boolean): void
  dispose(): void
}

const COLS = 11
const ROWS = 15
const STEP = 1 / 60
const GRAVITY = -7.5

export function createClothCloak(style: CloakStyle, shoulderSpan = 0.36, length = 0.92): ClothCloak {
  const count = COLS * ROWS
  const positions = new Float32Array(count * 3)
  const previous = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const pinned = new Uint8Array(count)

  const primary = new THREE.Color(style.primary)
  const accent = new THREE.Color(style.accent)
  const collarTint = primary.clone().lerp(new THREE.Color('#000000'), 0.25)

  // Rest layout: a trapezoid hanging straight down, slightly behind the body.
  for (let row = 0; row < ROWS; row += 1) {
    const v = row / (ROWS - 1)
    const halfWidth = (shoulderSpan / 2) * (1 + v * 0.75)
    for (let col = 0; col < COLS; col += 1) {
      const u = col / (COLS - 1)
      const index = row * COLS + col
      const x = (u - 0.5) * 2 * halfWidth
      const y = -v * length
      const z = -0.08 - v * 0.08
      positions[index * 3] = x
      positions[index * 3 + 1] = y
      positions[index * 3 + 2] = z
      previous[index * 3] = x
      previous[index * 3 + 1] = y
      previous[index * 3 + 2] = z
      pinned[index] = row === 0 ? 1 : 0
      const isHem = row >= ROWS - 2 && style.variant === 'trim'
      const tint = row === 0 ? collarTint : isHem ? accent : primary
      colors[index * 3] = tint.r
      colors[index * 3 + 1] = tint.g
      colors[index * 3 + 2] = tint.b
    }
  }

  // Constraints: structural + shear, rest lengths from the initial layout.
  const constraints: Array<[number, number, number]> = []
  const addConstraint = (a: number, b: number) => {
    const dx = positions[a * 3]! - positions[b * 3]!
    const dy = positions[a * 3 + 1]! - positions[b * 3 + 1]!
    const dz = positions[a * 3 + 2]! - positions[b * 3 + 2]!
    constraints.push([a, b, Math.hypot(dx, dy, dz)])
  }
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const index = row * COLS + col
      if (col < COLS - 1) addConstraint(index, index + 1)
      if (row < ROWS - 1) addConstraint(index, index + COLS)
      if (col < COLS - 1 && row < ROWS - 1) {
        addConstraint(index, index + COLS + 1)
        addConstraint(index + 1, index + COLS)
      }
      // Bend resistance: skip-one links keep the velvet from folding like paper.
      if (col < COLS - 2) addConstraint(index, index + 2)
      if (row < ROWS - 2) addConstraint(index, index + COLS * 2)
    }
  }

  const indices: number[] = []
  for (let row = 0; row < ROWS - 1; row += 1) {
    for (let col = 0; col < COLS - 1; col += 1) {
      const a = row * COLS + col
      const b = a + 1
      const c = a + COLS
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(positions, 3)
  positionAttribute.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.25,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.name = 'cloak-cloth'

  const object = new THREE.Group()
  object.name = 'cloak'
  object.add(mesh)

  const clasp =
    style.variant === 'clasp' || style.variant === 'trim'
      ? new THREE.Mesh(
          new THREE.OctahedronGeometry(0.028, 0),
          new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.3, metalness: 0.85 }),
        )
      : null
  if (clasp) {
    object.add(clasp)
  }

  // Collar anchors (world space) refreshed every frame by the avatar.
  const anchorNeck = new THREE.Vector3(0, 1.3, 0)
  const anchorForward = new THREE.Vector3(0, 0, 1)
  const anchorRight = new THREE.Vector3(1, 0, 0)
  const anchorPoint = new THREE.Vector3()
  let accumulator = 0
  let initialised = false
  const prevVelocity = new THREE.Vector3()

  function setAnchors(neck: THREE.Vector3, forward: THREE.Vector3, right: THREE.Vector3) {
    anchorNeck.copy(neck)
    anchorForward.copy(forward)
    anchorRight.copy(right)
  }

  /** Pins the top row along a collar arc wrapping the back of the neck. */
  function applyPins() {
    for (let col = 0; col < COLS; col += 1) {
      const u = col / (COLS - 1)
      const angle = (u - 0.5) * Math.PI * 1.15 // wrap ~200 degrees around the back
      const radius = shoulderSpan * 0.5
      anchorPoint
        .copy(anchorNeck)
        .addScaledVector(anchorRight, Math.sin(angle) * radius)
        .addScaledVector(anchorForward, -Math.cos(angle) * radius * 0.75 - 0.02)
      anchorPoint.y += -Math.abs(u - 0.5) * 0.05
      const index = col
      positions[index * 3] = anchorPoint.x
      positions[index * 3 + 1] = anchorPoint.y
      positions[index * 3 + 2] = anchorPoint.z
      previous[index * 3] = anchorPoint.x
      previous[index * 3 + 1] = anchorPoint.y
      previous[index * 3 + 2] = anchorPoint.z
    }
  }

  function snapToAnchors() {
    // First frame (or reduced motion): hang the cloth straight down from the collar.
    applyPins()
    for (let row = 1; row < ROWS; row += 1) {
      const v = row / (ROWS - 1)
      for (let col = 0; col < COLS; col += 1) {
        const u = col / (COLS - 1)
        const index = row * COLS + col
        const angle = (u - 0.5) * Math.PI * 1.15
        const radius = (shoulderSpan / 2) * (1 + v * 0.6)
        anchorPoint
          .copy(anchorNeck)
          .addScaledVector(anchorRight, Math.sin(angle) * radius)
          .addScaledVector(anchorForward, -Math.cos(angle) * radius * 0.75 - 0.02 - v * 0.05)
        anchorPoint.y -= v * length
        positions[index * 3] = anchorPoint.x
        positions[index * 3 + 1] = anchorPoint.y
        positions[index * 3 + 2] = anchorPoint.z
        previous[index * 3] = anchorPoint.x
        previous[index * 3 + 1] = anchorPoint.y
        previous[index * 3 + 2] = anchorPoint.z
      }
    }
    initialised = true
  }

  function integrate(windX: number, windY: number, windZ: number) {
    const damping = 0.985
    for (let i = 0; i < count; i += 1) {
      if (pinned[i]) continue
      const ix = i * 3
      const x = positions[ix]!
      const y = positions[ix + 1]!
      const z = positions[ix + 2]!
      const vx = (x - previous[ix]!) * damping
      const vy = (y - previous[ix + 1]!) * damping
      const vz = (z - previous[ix + 2]!) * damping
      previous[ix] = x
      previous[ix + 1] = y
      previous[ix + 2] = z
      positions[ix] = x + vx + windX * STEP * STEP
      positions[ix + 1] = y + vy + (GRAVITY + windY) * STEP * STEP
      positions[ix + 2] = z + vz + windZ * STEP * STEP
    }
  }

  function satisfy(colliders: CloakCollider[]) {
    for (let iteration = 0; iteration < 5; iteration += 1) {
      for (let c = 0; c < constraints.length; c += 1) {
        const [a, b, rest] = constraints[c]!
        const ax = a * 3
        const bx = b * 3
        const dx = positions[bx]! - positions[ax]!
        const dy = positions[bx + 1]! - positions[ax + 1]!
        const dz = positions[bx + 2]! - positions[ax + 2]!
        const distance = Math.hypot(dx, dy, dz) || 0.0001
        const diff = (distance - rest) / distance
        const pa = pinned[a]
        const pb = pinned[b]
        if (pa && pb) continue
        const wa = pa ? 0 : pb ? 1 : 0.5
        const wb = pb ? 0 : pa ? 1 : 0.5
        positions[ax] = positions[ax]! + dx * diff * wa
        positions[ax + 1] = positions[ax + 1]! + dy * diff * wa
        positions[ax + 2] = positions[ax + 2]! + dz * diff * wa
        positions[bx] = positions[bx]! - dx * diff * wb
        positions[bx + 1] = positions[bx + 1]! - dy * diff * wb
        positions[bx + 2] = positions[bx + 2]! - dz * diff * wb
      }
      // Body collision + floor.
      for (let i = 0; i < count; i += 1) {
        if (pinned[i]) continue
        const ix = i * 3
        for (const collider of colliders) {
          const dx = positions[ix]! - collider.center.x
          const dy = positions[ix + 1]! - collider.center.y
          const dz = positions[ix + 2]! - collider.center.z
          const distance = Math.hypot(dx, dy, dz)
          if (distance < collider.radius && distance > 0.0001) {
            const push = (collider.radius - distance) / distance
            positions[ix] = positions[ix]! + dx * push
            positions[ix + 1] = positions[ix + 1]! + dy * push
            positions[ix + 2] = positions[ix + 2]! + dz * push
          }
        }
        if (positions[ix + 1]! < 0.03) {
          positions[ix + 1] = 0.03
        }
      }
    }
  }

  function update(dt: number, colliders: CloakCollider[], velocity: THREE.Vector3, reducedMotion: boolean) {
    if (!initialised || reducedMotion) {
      snapToAnchors()
      geometry.computeVertexNormals()
      positionAttribute.needsUpdate = true
      if (clasp) {
        clasp.position.copy(anchorNeck).addScaledVector(anchorForward, 0.08).add(new THREE.Vector3(0, -0.04, 0))
      }
      return
    }
    accumulator = Math.min(accumulator + dt, STEP * 4)
    // Air drag against the wearer's motion plus a faint idle breeze.
    prevVelocity.lerp(velocity, 0.2)
    const windX = -prevVelocity.x * 1.6 + Math.sin(performance.now() * 0.0011) * 0.25
    const windZ = -prevVelocity.z * 1.6 + Math.cos(performance.now() * 0.0009) * 0.25
    while (accumulator >= STEP) {
      accumulator -= STEP
      applyPins()
      integrate(windX, 0, windZ)
      satisfy(colliders)
    }
    geometry.computeVertexNormals()
    positionAttribute.needsUpdate = true
    if (clasp) {
      clasp.position.copy(anchorNeck).addScaledVector(anchorForward, 0.085)
      clasp.position.y -= 0.045
    }
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
    if (clasp) {
      clasp.geometry.dispose()
      ;(clasp.material as THREE.Material).dispose()
    }
  }

  return { object, setAnchors, update, dispose }
}
