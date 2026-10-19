import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Prop library modelled in Blender (via the 3D Jutsu scene builder) and
 * exported as one Draco-compressed GLB. Every root node is named `PROP_<name>`.
 * Templates are grounded (min y = 0) and centred on x/z so placement code can
 * treat them like the primitives they replace. Materials use vertex colours;
 * glowing props get a shader patch that turns bright vertex colours into
 * emissive light so candles, lantern glass and the portal read at night.
 */

export type AlleyPropName =
  | 'streetlamp'
  | 'barrel'
  | 'crate'
  | 'cauldron'
  | 'hanging_lantern'
  | 'hand_cart'
  | 'alchemy_shelf'
  | 'floor_candles'
  | 'magic_portal'
  | 'chalkboard'

export const ALLEY_PROPS_URL = '/labs/wizard-alley/models/alley-props.glb'
export const ALLEY_APPRENTICE_URL = '/labs/wizard-alley/models/alley-apprentice.glb'
export const ALLEY_BUILDINGS_URL = '/labs/wizard-alley/models/alley-buildings.glb'

function createGltfLoader() {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)
  return { loader, dracoLoader }
}

/** Loads a Draco GLB and resolves with its scene graph. */
export function loadGltfScene(url: string): Promise<THREE.Group> {
  const { loader, dracoLoader } = createGltfLoader()
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        dracoLoader.dispose()
        resolve(gltf.scene)
      },
      undefined,
      (error) => {
        dracoLoader.dispose()
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}

export function loadAlleyProps(url = ALLEY_PROPS_URL): Promise<AlleyPropLibrary> {
  return loadPropLibrary<AlleyPropName>(url, 'PROP_', (name) => GLOW_SETTINGS[name])
}

export function loadAlleyBuildings(url = ALLEY_BUILDINGS_URL): Promise<AlleyBuildingLibrary> {
  return loadPropLibrary<AlleyBuildingName>(url, 'BLD_', () => BUILDING_GLOW)
}

/**
 * Apprentice modelled in Blender as separate parts (TORSO, HEAD, ARM_L/R,
 * LEG_L/R) whose node translations are the joint pivots the avatar rig uses.
 */
export const APPRENTICE_PART_NAMES = ['TORSO', 'HEAD', 'ARM_L', 'ARM_R', 'LEG_L', 'LEG_R'] as const
export type ApprenticePartName = (typeof APPRENTICE_PART_NAMES)[number]

export interface ApprenticeModel {
  parts: Record<ApprenticePartName, THREE.Object3D>
  dispose(): void
}

export function loadApprenticeModel(url = ALLEY_APPRENTICE_URL): Promise<ApprenticeModel> {
  return loadGltfScene(url).then((root) => {
    const parts = {} as Record<ApprenticePartName, THREE.Object3D>
    const materials: THREE.MeshStandardMaterial[] = []
    const geometries: THREE.BufferGeometry[] = []
    for (const name of APPRENTICE_PART_NAMES) {
      const node = root.getObjectByName(name)
      if (!node) {
        throw new Error(`apprentice model is missing part ${name}`)
      }
      node.removeFromParent()
      node.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          material.envMapIntensity = 0.45
          materials.push(material)
          geometries.push(child.geometry)
        }
      })
      parts[name] = node
    }
    return {
      parts,
      dispose: () => {
        materials.forEach((material) => {
          material.map?.dispose()
          material.metalnessMap?.dispose()
          material.roughnessMap?.dispose()
          material.dispose()
        })
        geometries.forEach((geometry) => geometry.dispose())
      },
    }
  })
}

interface GlowSettings {
  threshold: number
  boost: number
}

/** Props whose bright vertex colours should emit light. */
const GLOW_SETTINGS: Partial<Record<AlleyPropName, GlowSettings>> = {
  streetlamp: { threshold: 0.55, boost: 1.4 },
  hanging_lantern: { threshold: 0.62, boost: 0.9 },
  floor_candles: { threshold: 0.7, boost: 1.4 },
  cauldron: { threshold: 0.42, boost: 1.1 },
  magic_portal: { threshold: 0.22, boost: 1.5 },
}

export interface PropLibrary<Name extends string> {
  has(name: Name): boolean
  /** Fresh instance sharing geometry and material with the template. */
  create(name: Name): THREE.Object3D | null
  /** Grounded, centred bounding-box size of the template. */
  size(name: Name): THREE.Vector3
  names(): Name[]
  dispose(): void
}

export type AlleyPropLibrary = PropLibrary<AlleyPropName>

export type AlleyBuildingName =
  | 'townhouse'
  | 'timber'
  | 'tavern'
  | 'general_store'
  | 'bakery'
  | 'blacksmith'
  | 'cottage'
  | 'thatched'
  | 'market_hall'

export type AlleyBuildingLibrary = PropLibrary<AlleyBuildingName>

/** Window glass on the village houses is pale blue; let it glow faintly at night. */
const BUILDING_GLOW: GlowSettings = { threshold: 0.97, boost: 0.35 }

function applyGlow(material: THREE.MeshStandardMaterial, settings: GlowSettings) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGlowBoost = { value: settings.boost }
    shader.uniforms.uGlowThreshold = { value: settings.threshold }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uGlowBoost;\nuniform float uGlowThreshold;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
#ifdef USE_COLOR
  float glowLum = dot(vColor.rgb, vec3(0.299, 0.587, 0.114));
  float glowMax = max(vColor.r, max(vColor.g, vColor.b));
  float glowSat = glowMax - min(vColor.r, min(vColor.g, vColor.b));
  float glowMask = smoothstep(uGlowThreshold, uGlowThreshold + 0.22, max(glowLum, glowSat * glowMax));
  totalEmissiveRadiance += vColor.rgb * glowMask * uGlowBoost;
#endif`,
      )
  }
  material.customProgramCacheKey = () => `alley-glow-${settings.threshold}-${settings.boost}`
  material.needsUpdate = true
}

export function loadPropLibrary<Name extends string>(
  url: string,
  prefix: string,
  glowFor: (name: Name) => GlowSettings | undefined,
): Promise<PropLibrary<Name>> {
  const { loader, dracoLoader } = createGltfLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        dracoLoader.dispose()
        const templates = new Map<Name, THREE.Group>()
        const sizes = new Map<Name, THREE.Vector3>()
        const materials: THREE.Material[] = []
        const geometries: THREE.BufferGeometry[] = []
        const box = new THREE.Box3()
        const center = new THREE.Vector3()

        const roots = [...gltf.scene.children]
        for (const root of roots) {
          if (!root.name.startsWith(prefix)) {
            continue
          }
          const name = root.name.slice(prefix.length) as Name
          root.removeFromParent()
          root.position.set(0, 0, 0)
          root.rotation.set(0, 0, 0)
          root.scale.set(1, 1, 1)
          root.updateWorldMatrix(true, true)

          // Per-prop material clone so glow settings stay local to that prop.
          const glow = glowFor(name)
          root.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const source = child.material as THREE.MeshStandardMaterial
              const material = source.clone()
              material.vertexColors = true
              material.roughness = 0.82
              material.metalness = 0.02
              material.envMapIntensity = 0.5
              if (glow) {
                applyGlow(material, glow)
              }
              child.material = material
              child.castShadow = false
              child.receiveShadow = false
              materials.push(material)
              geometries.push(child.geometry)
            }
          })

          box.setFromObject(root)
          box.getCenter(center)
          const template = new THREE.Group()
          template.name = `template:${name}`
          root.position.set(-center.x, -box.min.y, -center.z)
          template.add(root)
          templates.set(name, template)
          sizes.set(name, box.getSize(new THREE.Vector3()))
        }

        resolve({
          has: (name) => templates.has(name),
          create: (name) => {
            const template = templates.get(name)
            if (!template) {
              return null
            }
            const instance = template.clone(true)
            instance.name = `prop:${name}`
            return instance
          },
          size: (name) => sizes.get(name)?.clone() ?? new THREE.Vector3(),
          names: () => [...templates.keys()],
          dispose: () => {
            materials.forEach((material) => material.dispose())
            geometries.forEach((geometry) => geometry.dispose())
            templates.clear()
          },
        })
      },
      undefined,
      (error) => {
        dracoLoader.dispose()
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}

// ── Rigged, animated apprentice (image-to-3D + auto-rig) ──────────────────

/** One GLB: skinned apprentice plus idle / walk / run clips merged in Blender. */
export const ALLEY_RIGGED_URL = '/labs/wizard-alley/models/apprentice.glb'

export interface RiggedApprentice {
  /** Scene root holding the skinned mesh and its skeleton. */
  root: THREE.Group
  clips: { idle: THREE.AnimationClip | null; walk: THREE.AnimationClip | null; run: THREE.AnimationClip | null }
  bones: {
    head: THREE.Bone | null
    neck: THREE.Bone | null
    rightHand: THREE.Bone | null
    rightForeArm: THREE.Bone | null
    rightArm: THREE.Bone | null
    hips: THREE.Bone | null
    leftShoulder: THREE.Bone | null
    rightShoulder: THREE.Bone | null
  }
  /** Height of the model in metres at bind pose. */
  height: number
  dispose(): void
}

function findBone(root: THREE.Object3D, pattern: RegExp): THREE.Bone | null {
  let found: THREE.Bone | null = null
  root.traverse((child) => {
    if (!found && child instanceof THREE.Bone && pattern.test(child.name)) {
      found = child
    }
  })
  return found
}

/** Removes horizontal root motion from a clip so the character animates in place. */
function stripRootMotion(clip: THREE.AnimationClip, hipsName: string | null) {
  if (!hipsName) {
    return clip
  }
  clip.tracks = clip.tracks.filter((track) => {
    const [node, property] = track.name.split('.')
    if (node === hipsName && property === 'position') {
      const values = track.values
      for (let i = 0; i < values.length; i += 3) {
        values[i] = values[0] ?? 0
        values[i + 2] = values[2] ?? 0
      }
    }
    return true
  })
  return clip
}

export function loadRiggedApprentice(url = ALLEY_RIGGED_URL): Promise<RiggedApprentice> {
  const { loader, dracoLoader } = createGltfLoader()
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        dracoLoader.dispose()
        const root = gltf.scene
        const materials: THREE.MeshStandardMaterial[] = []
        const geometries: THREE.BufferGeometry[] = []
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.frustumCulled = false
            const material = child.material as THREE.MeshStandardMaterial
            material.envMapIntensity = 0.4
            materials.push(material)
            geometries.push(child.geometry)
          }
        })
        const hips = findBone(root, /hips$/i)
        const bones = {
          head: findBone(root, /(^|[:_])head$/i),
          neck: findBone(root, /neck$/i),
          rightHand: findBone(root, /right.?hand$/i),
          rightForeArm: findBone(root, /right.?fore.?arm$/i),
          rightArm: findBone(root, /right.?arm$/i),
          hips,
          leftShoulder: findBone(root, /left.?shoulder$/i),
          rightShoulder: findBone(root, /right.?shoulder$/i),
        }
        const box = new THREE.Box3().setFromObject(root)
        const height = box.max.y - box.min.y
        const hipsName = hips?.name ?? null
        const pick = (label: string) => {
          const clip = gltf.animations.find((entry) => entry.name === label) ?? null
          return clip ? stripRootMotion(clip, hipsName) : null
        }
        resolve({
          root,
          clips: {
            idle: pick('idle'),
            walk: pick('walk'),
            run: pick('run'),
          },
          bones,
          height,
          dispose: () => {
            materials.forEach((material) => {
              material.map?.dispose()
              material.normalMap?.dispose()
              material.roughnessMap?.dispose()
              material.metalnessMap?.dispose()
              material.dispose()
            })
            geometries.forEach((geometry) => geometry.dispose())
          },
        })
      },
      undefined,
      (error) => {
        dracoLoader.dispose()
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}

// ── Wearables (generated hats and wand, normalised in Blender) ─────────────

export const ALLEY_WEARABLES_URL = '/labs/wizard-alley/models/alley-wearables.glb'

export type AlleyWearableName = 'HAT_pointed' | 'HAT_wide' | 'WAND_holly'

export type AlleyWearableLibrary = PropLibrary<AlleyWearableName>

/**
 * Hats keep their origin at the underside of the brim (so the slot sits on the
 * crown) and the wand has its knob at the origin running along +y, which is why
 * these templates are NOT re-grounded like props: they load with the prefix
 * stripped and their authored pivots intact.
 */
export function loadAlleyWearables(url = ALLEY_WEARABLES_URL): Promise<AlleyWearableLibrary> {
  return loadGltfScene(url).then((root) => {
    const templates = new Map<AlleyWearableName, THREE.Group>()
    const sizes = new Map<AlleyWearableName, THREE.Vector3>()
    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []
    const box = new THREE.Box3()
    for (const node of [...root.children]) {
      const name = node.name as AlleyWearableName
      node.removeFromParent()
      node.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          material.envMapIntensity = 0.45
          materials.push(material)
          geometries.push(child.geometry)
        }
      })
      const template = new THREE.Group()
      template.name = `template:${name}`
      template.add(node)
      templates.set(name, template)
      sizes.set(name, box.setFromObject(template).getSize(new THREE.Vector3()))
    }
    return {
      has: (name) => templates.has(name),
      create: (name) => {
        const template = templates.get(name)
        if (!template) {
          return null
        }
        const instance = template.clone(true)
        instance.name = `wearable:${name}`
        return instance
      },
      size: (name) => sizes.get(name)?.clone() ?? new THREE.Vector3(),
      names: () => [...templates.keys()],
      dispose: () => {
        materials.forEach((material) => {
          const standard = material as THREE.MeshStandardMaterial
          standard.map?.dispose()
          material.dispose()
        })
        geometries.forEach((geometry) => geometry.dispose())
        templates.clear()
      },
    }
  })
}
