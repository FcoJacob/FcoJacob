import * as THREE from 'three'
import type { AlleyItem } from './catalog'
import type { AlleyWearableLibrary, AlleyWearableName } from './assets'

let wearableLibrary: AlleyWearableLibrary | null = null

/** Once the generated hats and wand are loaded, item builders use them instead of primitives. */
export function setWearableLibrary(library: AlleyWearableLibrary | null) {
  wearableLibrary = library
}

/**
 * Recolours a textured wearable while keeping its shading: the texel is
 * reduced to luminance and multiplied by the item colour, so a navy hat can
 * become plum without losing seams, folds or the band.
 */
function tintMaterial(material: THREE.MeshStandardMaterial, hex: string, strength: number, lumRef: number) {
  const tint = new THREE.Color(hex)
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTint = { value: tint }
    shader.uniforms.uTintStrength = { value: strength }
    shader.uniforms.uLumRef = { value: lumRef }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uTint;\nuniform float uTintStrength;\nuniform float uLumRef;')
      .replace(
        '#include <color_fragment>',
        [
          '#include <color_fragment>',
          'float tintLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));',
          'vec3 tinted = uTint * clamp(tintLum / max(uLumRef, 0.02), 0.0, 1.8);',
          'diffuseColor.rgb = mix(diffuseColor.rgb, tinted, uTintStrength);',
        ].join('\n'),
      )
  }
  material.customProgramCacheKey = () => `alley-tint-${hex}-${strength}-${lumRef}`
  material.needsUpdate = true
}

function createWearableInstance(name: AlleyWearableName, tint: string | null, lumRef: number) {
  if (!wearableLibrary?.has(name)) {
    return null
  }
  const instance = wearableLibrary.create(name)
  if (!instance) {
    return null
  }
  instance.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = (child.material as THREE.MeshStandardMaterial).clone()
      if (tint) {
        tintMaterial(material, tint, 0.85, lumRef)
      }
      child.material = material
    }
  })
  return instance
}

/**
 * Procedural wearables. Each builder returns a group whose origin matches the
 * avatar slot it attaches to:
 *  - head:  origin at the crown of the head, +y up
 *  - cloak: origin at the base of the neck, +y up, cloak hangs down
 *  - wand:  origin at the palm, wand runs along +y (the hand slot aims it)
 *
 * Objects are tagged with `userData.itemId` so raycasts in the shop interiors
 * can map a clicked display back to the catalog.
 */

function feltMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.02 })
}

function brassMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.85,
    emissive: new THREE.Color(color).multiplyScalar(0.08),
  })
}

function woodMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 })
}

/** Bends a cone so the tip droops like a worn wizard hat. */
function bendCone(geometry: THREE.ConeGeometry, height: number, bend: number, droop: number) {
  const position = geometry.attributes.position
  if (!position) {
    return geometry
  }
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i)
    const t = THREE.MathUtils.clamp(y / height, 0, 1)
    position.setX(i, position.getX(i) + t * t * bend)
    position.setZ(i, position.getZ(i) - t * t * droop)
    position.setY(i, y - t * t * t * droop * 0.6)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function buildHat(item: AlleyItem) {
  const group = new THREE.Group()
  const felt = feltMaterial(item.primary)
  const brass = brassMaterial(item.accent)

  const isWide = item.variant === 'wide'
  const isCrooked = item.variant === 'crooked'
  const coneHeight = isCrooked ? 0.64 : isWide ? 0.42 : 0.52
  const coneRadius = isWide ? 0.26 : 0.23
  const brimRadius = isWide ? 0.48 : 0.37

  const cone = new THREE.ConeGeometry(coneRadius, coneHeight, 28, 8)
  cone.translate(0, coneHeight / 2, 0)
  bendCone(cone, coneHeight, isCrooked ? 0.2 : 0.11, isCrooked ? 0.16 : 0.08)
  const coneMesh = new THREE.Mesh(cone, felt)
  group.add(coneMesh)

  const brim = new THREE.CylinderGeometry(brimRadius, brimRadius * 0.98, 0.022, 36)
  const brimMesh = new THREE.Mesh(brim, felt)
  brimMesh.position.y = 0.01
  if (isWide) {
    brimMesh.rotation.x = 0.08
  }
  group.add(brimMesh)

  const band = new THREE.CylinderGeometry(coneRadius * 0.93, coneRadius * 1.02, 0.07, 28)
  const bandMesh = new THREE.Mesh(band, brass)
  bandMesh.position.y = 0.05
  group.add(bandMesh)

  if (isCrooked) {
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), brass)
    buckle.position.set(0, 0.05, coneRadius + 0.005)
    group.add(buckle)
  }

  // Lift slightly so the brim sits on the hair instead of cutting through it.
  group.position.y = -0.03
  group.scale.setScalar(0.65)
  return group
}

function buildCloak(item: AlleyItem) {
  const group = new THREE.Group()
  const velvet = new THREE.MeshStandardMaterial({
    color: item.primary,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  const trim = brassMaterial(item.accent)

  const height = 1.14
  const shell = new THREE.CylinderGeometry(0.4, 0.62, height, 36, 6, true)
  shell.translate(0, -height / 2 + 0.02, 0)
  // Let the back fall longer and flare so it reads as fabric, not a tube.
  const position = shell.attributes.position
  if (position) {
    for (let i = 0; i < position.count; i += 1) {
      const z = position.getZ(i)
      const y = position.getY(i)
      const t = THREE.MathUtils.clamp(-y / height, 0, 1)
      if (z < 0) {
        position.setZ(i, z * (1 + t * 0.35))
        position.setY(i, y - t * 0.08)
      } else {
        // Open the front a touch so the robe underneath shows.
        position.setZ(i, z * (1 - t * 0.12))
      }
    }
    position.needsUpdate = true
    shell.computeVertexNormals()
  }
  group.add(new THREE.Mesh(shell, velvet))

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.05, 12, 32), velvet)
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.03
  group.add(collar)

  if (item.variant === 'trim') {
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.015, 8, 48), trim)
    hem.rotation.x = Math.PI / 2
    hem.position.y = -height + 0.04
    group.add(hem)
  }

  if (item.variant === 'clasp' || item.variant === 'trim') {
    const clasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), trim)
    clasp.position.set(0, -0.08, 0.26)
    group.add(clasp)
  }

  return group
}

function buildWand(item: AlleyItem) {
  const group = new THREE.Group()
  const wood = woodMaterial(item.primary)
  const detail = item.variant === 'elder' ? brassMaterial(item.accent) : woodMaterial(item.accent)

  const length = 0.4
  const shaft = new THREE.CylinderGeometry(0.009, 0.017, length, 12)
  shaft.translate(0, length / 2, 0)
  group.add(new THREE.Mesh(shaft, wood))

  const handle = new THREE.CylinderGeometry(0.02, 0.024, 0.11, 12)
  handle.translate(0, 0.055, 0)
  group.add(new THREE.Mesh(handle, detail))

  if (item.variant === 'holly') {
    const bulge = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), detail)
    bulge.position.y = 0.115
    group.add(bulge)
  }

  if (item.variant === 'elder') {
    for (let i = 0; i < 4; i += 1) {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02 - i * 0.003, 10, 8), detail)
      knob.position.y = 0.16 + i * 0.065
      group.add(knob)
    }
  }

  if (item.variant === 'vine') {
    const leaf = new THREE.MeshStandardMaterial({ color: item.accent, roughness: 0.7 })
    for (let i = 0; i < 6; i += 1) {
      const t = i / 6
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), leaf)
      const angle = t * Math.PI * 4
      bead.position.set(Math.cos(angle) * 0.016, 0.12 + t * 0.24, Math.sin(angle) * 0.016)
      group.add(bead)
    }
  }

  // Spark emitter anchor.
  const tip = new THREE.Object3D()
  tip.name = 'wand-tip'
  tip.position.y = length + 0.01
  group.add(tip)
  group.scale.setScalar(0.9)

  return group
}

/** Generated-model variants: which template each catalog item maps to and whether it is recoloured. */
const WEARABLE_VARIANTS: Record<string, { name: AlleyWearableName; tint: string | null; lumRef: number; scale?: [number, number, number] }> = {
  // All three hats derive from the wide felt hat (the cleanest generation): the
  // dark ones are stretched taller and narrower, then recoloured.
  'hat-midnight': { name: 'HAT_wide', tint: '#232b4a', lumRef: 0.3, scale: [0.84, 1.45, 0.84] },
  'hat-plum': { name: 'HAT_wide', tint: '#6a2d6e', lumRef: 0.3, scale: [0.8, 1.75, 0.8] },
  'hat-moss': { name: 'HAT_wide', tint: null, lumRef: 0.3 },
  'wand-holly': { name: 'WAND_holly', tint: null, lumRef: 0.45 },
  'wand-elder': { name: 'WAND_holly', tint: '#3b2b24', lumRef: 0.45 },
  'wand-vine': { name: 'WAND_holly', tint: '#8a5a36', lumRef: 0.45 },
}

function buildFromLibrary(item: AlleyItem): THREE.Group | null {
  const variant = WEARABLE_VARIANTS[item.id]
  if (!variant) {
    return null
  }
  const instance = createWearableInstance(variant.name, variant.tint, variant.lumRef)
  if (!instance) {
    return null
  }
  const group = new THREE.Group()
  group.add(instance)
  if (variant.scale) {
    instance.scale.set(variant.scale[0], variant.scale[1], variant.scale[2])
  }
  if (item.slot === 'head') {
    // Brim underside sits a touch below the crown so hair tucks under it.
    group.position.y = -0.025
  } else if (item.slot === 'wand') {
    const tip = new THREE.Object3D()
    tip.name = 'wand-tip'
    tip.position.y = 0.34
    group.add(tip)
  }
  return group
}

export function createItemObject(item: AlleyItem): THREE.Group {
  const fromLibrary = buildFromLibrary(item)
  const object =
    fromLibrary ?? (item.slot === 'head' ? buildHat(item) : item.slot === 'cloak' ? buildCloak(item) : buildWand(item))
  object.name = `item:${item.id}`
  object.traverse((child) => {
    child.userData.itemId = item.id
  })
  return object
}

/** Frees geometries and materials created by `createItemObject`. */
export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const material = child.material as THREE.Material | THREE.Material[]
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose())
      } else {
        material.dispose()
      }
    }
    if (child instanceof THREE.Points || child instanceof THREE.Sprite) {
      const material = child.material as THREE.Material
      material.dispose()
      if ('geometry' in child) {
        child.geometry.dispose()
      }
    }
  })
}
