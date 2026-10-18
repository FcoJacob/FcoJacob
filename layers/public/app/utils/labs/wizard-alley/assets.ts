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

export interface AlleyPropLibrary {
  has(name: AlleyPropName): boolean
  /** Fresh instance sharing geometry and material with the template. */
  create(name: AlleyPropName): THREE.Object3D | null
  /** Grounded, centred bounding-box size of the template. */
  size(name: AlleyPropName): THREE.Vector3
  dispose(): void
}

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

export function loadAlleyProps(url = ALLEY_PROPS_URL): Promise<AlleyPropLibrary> {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        dracoLoader.dispose()
        const templates = new Map<AlleyPropName, THREE.Group>()
        const sizes = new Map<AlleyPropName, THREE.Vector3>()
        const materials: THREE.Material[] = []
        const geometries: THREE.BufferGeometry[] = []
        const box = new THREE.Box3()
        const center = new THREE.Vector3()

        const roots = [...gltf.scene.children]
        for (const root of roots) {
          if (!root.name.startsWith('PROP_')) {
            continue
          }
          const name = root.name.slice('PROP_'.length) as AlleyPropName
          root.removeFromParent()
          root.position.set(0, 0, 0)
          root.rotation.set(0, 0, 0)
          root.scale.set(1, 1, 1)
          root.updateWorldMatrix(true, true)

          // Per-prop material clone so glow settings stay local to that prop.
          const glow = GLOW_SETTINGS[name]
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
