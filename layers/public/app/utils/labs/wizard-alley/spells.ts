import * as THREE from 'three'

/**
 * Lightweight CPU particle system for wand sparks and try-on bursts.
 * A single `Points` object with additive blending; dead particles are parked
 * far below the scene with black colour so they vanish under additive blend.
 */

export interface SparkSystem {
  points: THREE.Points
  /** Explosive burst from `origin`, `amount` particles in a loose upward cone. */
  burst(origin: THREE.Vector3, color: THREE.ColorRepresentation, amount: number): void
  /** Gentle trickle, used while a wand is held. */
  trickle(origin: THREE.Vector3, color: THREE.ColorRepresentation, amount: number): void
  /** Point-light flash that decays over time. */
  flash(origin: THREE.Vector3, color: THREE.ColorRepresentation, intensity: number): void
  update(dt: number): void
  dispose(): void
}

export function createSparkSystem(glowTexture: THREE.Texture, count = 420): SparkSystem {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const life = new Float32Array(count)
  const maxLife = new Float32Array(count)
  const baseColors = new Float32Array(count * 3)

  for (let i = 0; i < count; i += 1) {
    positions[i * 3 + 1] = -100
  }

  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(positions, 3)
  const colorAttribute = new THREE.BufferAttribute(colors, 3)
  positionAttribute.setUsage(THREE.DynamicDrawUsage)
  colorAttribute.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('color', colorAttribute)

  const material = new THREE.PointsMaterial({
    size: 0.11,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.name = 'sparks'

  const flashLight = new THREE.PointLight('#ffffff', 0, 5, 2)
  flashLight.visible = false
  points.add(flashLight)
  let flashIntensity = 0

  const tempColor = new THREE.Color()
  let cursor = 0

  function spawn(
    origin: THREE.Vector3,
    color: THREE.ColorRepresentation,
    amount: number,
    speedMin: number,
    speedMax: number,
    spread: number,
    lifeMin: number,
    lifeMax: number,
  ) {
    tempColor.set(color)
    for (let n = 0; n < amount; n += 1) {
      const i = cursor
      cursor = (cursor + 1) % count

      positions[i * 3] = origin.x
      positions[i * 3 + 1] = origin.y
      positions[i * 3 + 2] = origin.z

      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * spread
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.cos(phi) * speed
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

      const ttl = lifeMin + Math.random() * (lifeMax - lifeMin)
      life[i] = ttl
      maxLife[i] = ttl

      // Slight hue variation so the cloud sparkles instead of reading flat.
      const jitter = 0.85 + Math.random() * 0.3
      baseColors[i * 3] = Math.min(1, tempColor.r * jitter)
      baseColors[i * 3 + 1] = Math.min(1, tempColor.g * jitter)
      baseColors[i * 3 + 2] = Math.min(1, tempColor.b * jitter)
    }
  }

  function burst(origin: THREE.Vector3, color: THREE.ColorRepresentation, amount: number) {
    spawn(origin, color, amount, 1.4, 3.6, Math.PI * 0.75, 0.6, 1.4)
  }

  function trickle(origin: THREE.Vector3, color: THREE.ColorRepresentation, amount: number) {
    spawn(origin, color, amount, 0.15, 0.6, Math.PI, 0.5, 1.1)
  }

  function flash(origin: THREE.Vector3, color: THREE.ColorRepresentation, intensity: number) {
    flashLight.position.copy(origin)
    flashLight.color.set(color)
    flashIntensity = intensity
    flashLight.intensity = intensity
    flashLight.visible = true
  }

  function update(dt: number) {
    let anyAlive = false
    for (let i = 0; i < count; i += 1) {
      const remaining = life[i] ?? 0
      if (remaining <= 0) {
        if ((positions[i * 3 + 1] ?? -100) > -99) {
          positions[i * 3 + 1] = -100
          colors[i * 3] = 0
          colors[i * 3 + 1] = 0
          colors[i * 3 + 2] = 0
        }
        continue
      }
      anyAlive = true
      const nextLife = remaining - dt
      life[i] = nextLife

      const vx = (velocities[i * 3] ?? 0) * 0.985
      const vy = (velocities[i * 3 + 1] ?? 0) * 0.985 - 2.4 * dt
      const vz = (velocities[i * 3 + 2] ?? 0) * 0.985
      velocities[i * 3] = vx
      velocities[i * 3 + 1] = vy
      velocities[i * 3 + 2] = vz

      positions[i * 3] = (positions[i * 3] ?? 0) + vx * dt
      positions[i * 3 + 1] = (positions[i * 3 + 1] ?? 0) + vy * dt
      positions[i * 3 + 2] = (positions[i * 3 + 2] ?? 0) + vz * dt

      const fade = Math.max(0, nextLife / (maxLife[i] || 1))
      const glow = fade * fade
      colors[i * 3] = (baseColors[i * 3] ?? 0) * glow
      colors[i * 3 + 1] = (baseColors[i * 3 + 1] ?? 0) * glow
      colors[i * 3 + 2] = (baseColors[i * 3 + 2] ?? 0) * glow
    }

    if (anyAlive) {
      positionAttribute.needsUpdate = true
      colorAttribute.needsUpdate = true
    }

    if (flashIntensity > 0.02) {
      flashIntensity *= Math.max(0, 1 - dt * 6)
      flashLight.intensity = flashIntensity
    } else if (flashLight.visible) {
      flashLight.visible = false
      flashLight.intensity = 0
    }
  }

  function dispose() {
    geometry.dispose()
    material.dispose()
  }

  return { points, burst, trickle, flash, update, dispose }
}
