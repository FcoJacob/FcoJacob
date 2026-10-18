import * as THREE from 'three'

/**
 * Procedural canvas textures. Every surface in the alley is painted here at
 * runtime so the lab ships zero image assets.
 */

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('2D canvas context unavailable')
  }
  return { canvas, context }
}

/** Deterministic pseudo random so textures look the same on every visit. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function finishTexture(canvas: HTMLCanvasElement, repeat = 1, srgb = true) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 4
  if (srgb) {
    texture.colorSpace = THREE.SRGBColorSpace
  }
  texture.needsUpdate = true
  return texture
}

/** Wet cobblestones: rounded stones with mortar and subtle colour drift. */
export function createCobblestoneTexture(size = 512) {
  const { canvas, context } = createCanvas(size, size)
  const random = createRandom(11)

  context.fillStyle = '#1b1a20'
  context.fillRect(0, 0, size, size)

  const cell = size / 10
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const offsetX = (row % 2) * cell * 0.5
      const x = col * cell + offsetX + cell * 0.5
      const y = row * cell + cell * 0.5
      const w = cell * (0.72 + random() * 0.18)
      const h = cell * (0.62 + random() * 0.2)
      const shade = 40 + Math.floor(random() * 22)
      const warm = Math.floor(random() * 10)
      context.fillStyle = `rgb(${shade + warm}, ${shade}, ${shade + 6})`
      context.beginPath()
      context.ellipse(x, y, w * 0.5, h * 0.5, (random() - 0.5) * 0.4, 0, Math.PI * 2)
      context.fill()
      // Highlight rim so the stones read as rounded when lit.
      context.fillStyle = `rgba(255, 255, 255, ${0.02 + random() * 0.03})`
      context.beginPath()
      context.ellipse(x - w * 0.12, y - h * 0.16, w * 0.3, h * 0.22, 0, 0, Math.PI * 2)
      context.fill()
    }
  }

  // Scattered grit.
  for (let i = 0; i < 900; i += 1) {
    context.fillStyle = `rgba(0, 0, 0, ${random() * 0.35})`
    context.fillRect(random() * size, random() * size, 2, 2)
  }

  return finishTexture(canvas, 1)
}

/** Aged plaster with timber beams baked in. */
export function createPlasterTexture(tint: string, seed: number, size = 512) {
  const { canvas, context } = createCanvas(size, size)
  const random = createRandom(seed)

  context.fillStyle = tint
  context.fillRect(0, 0, size, size)

  for (let i = 0; i < 2600; i += 1) {
    const alpha = random() * 0.09
    context.fillStyle = random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
    const s = 2 + random() * 6
    context.fillRect(random() * size, random() * size, s, s)
  }

  // Dirt streaks running down the wall.
  for (let i = 0; i < 24; i += 1) {
    const x = random() * size
    const gradient = context.createLinearGradient(x, 0, x, size)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, `rgba(0,0,0,${0.12 + random() * 0.2})`)
    context.fillStyle = gradient
    context.fillRect(x, 0, 6 + random() * 16, size)
  }

  // Timber frame.
  context.fillStyle = '#2a1d14'
  const beam = size * 0.045
  context.fillRect(0, 0, size, beam)
  context.fillRect(0, size - beam, size, beam)
  context.fillRect(0, 0, beam, size)
  context.fillRect(size - beam, 0, beam, size)
  context.fillRect(size * 0.5 - beam * 0.5, 0, beam, size)
  context.save()
  context.translate(size * 0.25, size * 0.5)
  context.rotate(0.6)
  context.fillRect(-size * 0.4, -beam * 0.5, size * 0.8, beam)
  context.restore()
  context.save()
  context.translate(size * 0.75, size * 0.5)
  context.rotate(-0.6)
  context.fillRect(-size * 0.4, -beam * 0.5, size * 0.8, beam)
  context.restore()

  return finishTexture(canvas, 1)
}

/** Wooden planks for doors, shelves and interiors. */
export function createWoodTexture(tint: string, seed: number, size = 512) {
  const { canvas, context } = createCanvas(size, size)
  const random = createRandom(seed)

  context.fillStyle = tint
  context.fillRect(0, 0, size, size)

  const plankHeight = size / 6
  for (let i = 0; i < 6; i += 1) {
    const y = i * plankHeight
    context.fillStyle = `rgba(0,0,0,${0.08 + random() * 0.1})`
    context.fillRect(0, y, size, 3)
    for (let g = 0; g < 40; g += 1) {
      const gy = y + random() * plankHeight
      context.strokeStyle = `rgba(0,0,0,${0.05 + random() * 0.12})`
      context.lineWidth = 1 + random() * 2
      context.beginPath()
      context.moveTo(0, gy)
      context.bezierCurveTo(size * 0.3, gy + random() * 8 - 4, size * 0.6, gy + random() * 8 - 4, size, gy)
      context.stroke()
    }
  }

  return finishTexture(canvas, 1)
}

/** Hanging shop sign with hand-painted lettering. */
export function createSignTexture(text: string, accent: string) {
  const width = 512
  const height = 256
  const { canvas, context } = createCanvas(width, height)
  const random = createRandom(text.length * 97)

  context.fillStyle = '#2b1c12'
  context.fillRect(0, 0, width, height)
  for (let i = 0; i < 1200; i += 1) {
    context.fillStyle = `rgba(0,0,0,${random() * 0.25})`
    context.fillRect(random() * width, random() * height, 3, 1)
  }

  context.strokeStyle = accent
  context.lineWidth = 10
  context.strokeRect(18, 18, width - 36, height - 36)
  context.strokeStyle = 'rgba(0,0,0,0.5)'
  context.lineWidth = 3
  context.strokeRect(32, 32, width - 64, height - 64)

  context.fillStyle = accent
  context.font = `italic 700 ${text.length > 8 ? 84 : 104}px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0,0,0,0.7)'
  context.shadowBlur = 8
  context.shadowOffsetY = 4
  context.fillText(text, width / 2, height / 2 + 6)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

/** Soft radial sprite used by sparks, lantern halos and the moon glow. */
export function createGlowTexture(size = 128) {
  const { canvas, context } = createCanvas(size, size)
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/** Elliptical shadow blob placed under the avatar and pedestals. */
export function createContactShadowTexture(size = 128) {
  const { canvas, context } = createCanvas(size, size)
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,0.7)')
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.32)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export interface AlleyTextureSet {
  cobblestone: THREE.Texture
  plaster: THREE.Texture[]
  wood: THREE.Texture
  darkWood: THREE.Texture
  glow: THREE.Texture
  contactShadow: THREE.Texture
}

export function createAlleyTextures(): AlleyTextureSet {
  const cobblestone = createCobblestoneTexture()
  cobblestone.repeat.set(10, 84)
  const wood = createWoodTexture('#6a4a2c', 5)
  const darkWood = createWoodTexture('#3b2617', 9)
  return {
    cobblestone,
    plaster: [
      createPlasterTexture('#8a7d6a', 21),
      createPlasterTexture('#7d6f63', 22),
      createPlasterTexture('#6f6a63', 23),
      createPlasterTexture('#8c7560', 24),
    ],
    wood,
    darkWood,
    glow: createGlowTexture(),
    contactShadow: createContactShadowTexture(),
  }
}

export function disposeAlleyTextures(set: AlleyTextureSet) {
  set.cobblestone.dispose()
  set.plaster.forEach((texture) => texture.dispose())
  set.wood.dispose()
  set.darkWood.dispose()
  set.glow.dispose()
  set.contactShadow.dispose()
}

/** Lit window with mullions; tinted per instance so one texture lights the whole street. */
export function createWindowTexture(size = 128) {
  const { canvas, context } = createCanvas(size, size)
  const gradient = context.createRadialGradient(
    size * 0.5,
    size * 0.6,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.75,
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.72)')
  gradient.addColorStop(1, 'rgba(255,255,255,0.45)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  context.fillStyle = 'rgba(20, 12, 8, 1)'
  const bar = size * 0.07
  context.fillRect(size * 0.5 - bar * 0.5, 0, bar, size)
  context.fillRect(0, size * 0.45 - bar * 0.5, size, bar)
  context.fillRect(0, 0, bar, size)
  context.fillRect(size - bar, 0, bar, size)
  context.fillRect(0, 0, size, bar)
  context.fillRect(0, size - bar, size, bar)

  // Curtain shadow in a corner so not every window looks identical when tinted.
  context.fillStyle = 'rgba(0,0,0,0.25)'
  context.fillRect(bar, bar, size * 0.22, size * 0.45 - bar)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
