<script setup lang="ts">
import * as THREE from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useTemplateRef, watch } from 'vue'
import type {
  ShowroomDebugTuning,
  ShowroomWheelInputProfile,
} from '../../../utils/labs/showroom/debug'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    activeStepIndex: number
    debugTuning: ShowroomDebugTuning
    timeOfDay?: 'day' | 'night'
    hdrPath: string
    immersive?: boolean
    modelPath: string
    selectedOptions: Record<string, string | null>
  }>(),
  {
    immersive: false,
    timeOfDay: 'night',
  },
)

const emit = defineEmits<{
  cameraState: [
    {
      inputProfile: ShowroomWheelInputProfile
      progress: number
      scrollVelocity: number
      stepIndex: number
    },
  ]
  runtimeState: [
    {
      isLoading: boolean
      isReady: boolean
      progress: number
    },
  ]
}>()

type RuntimeMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const hostRef = useTemplateRef<HTMLDivElement>('host')
const webglSupported = shallowRef(true)
const reducedMotionPreferred = shallowRef(false)
const runtimeLoading = shallowRef(true)
const runtimeLoadProgress = shallowRef(0)
const sceneReady = shallowRef(false)
const frameProfile = shallowRef<'compact' | 'balanced' | 'wide'>('wide')
const runtimeQuality = shallowRef<'cinematic' | 'balanced' | 'efficient'>('cinematic')

let motionQuery: MediaQueryList | null = null

let loadingManager: THREE.LoadingManager | null = null
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let ambientLight: THREE.AmbientLight | null = null
let keyLight: THREE.DirectionalLight | null = null
let rimLight: THREE.PointLight | null = null
let celestialSphere: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null
let floor: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial> | null = null
let pedestal: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial> | null = null
let frameId = 0
let mountAborted = false
let heroRoot: THREE.Group | null = null
let heroBaseSize: THREE.Vector3 | null = null
let heroBaseCenter: THREE.Vector3 | null = null
let heroBaseMinY = 0
// Mesh collections — arrays so every mesh of a given type gets the same material update
let bodyMeshes: RuntimeMesh[] = []
let glassMeshes: RuntimeMesh[] = []
let windowMirrorMeshes: RuntimeMesh[] = []
let trimMeshes: RuntimeMesh[] = []
let wireframe: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial> | null = null
// Separate arrays for rims vs tires so material updates stay correct
let rimMeshes: RuntimeMesh[] = []
// Rim nodes (THREE.Object3D groups) used for geometry swap
let rimNodes: THREE.Object3D[] = []
let packWheelTemplates: Map<string, THREE.Object3D> = new Map()
let currentSwappedRims: THREE.Object3D[] = []
// Individual rim-metal meshes hidden during swap (keeps tires visible)
let hiddenRimMeshes: THREE.Mesh[] = []
// Set of original Audi tyre meshes — used to exclude them from rimMeshes during swap
let tireMeshSet: Set<THREE.Mesh> = new Set()
// Backward-compat aliases (procedural fallback uses these directly for positioning)
let body: RuntimeMesh | null = null
let canopy: RuntimeMesh | null = null
let trim: RuntimeMesh | null = null
let glowRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null
let wheelMeshes: RuntimeMesh[] = []
let environmentSource: THREE.Texture | null = null
let environmentMap: THREE.Texture | null = null
let pmremGenerator: THREE.PMREMGenerator | null = null
let dragPointerId: number | null = null
let lastPointerX = 0
let lastPointerY = 0
let manualOrbitAzimuth = 0
let manualOrbitPolar = 0
let targetManualOrbitAzimuth = manualOrbitAzimuth
let targetManualOrbitPolar = manualOrbitPolar
let orbitAzimuth = 0.36
let orbitPolar = 1.18
let orbitDistance = 9.6
let targetOrbitDistance = orbitDistance
let currentInputProfile: ShowroomWheelInputProfile = 'wheel'
let interactionVelocity = 0
const sampledCameraTarget = new THREE.Vector3()
const sampledLookAtTarget = new THREE.Vector3()
const orbitLookAtTarget = new THREE.Vector3()
const orbitCameraPosition = new THREE.Vector3()
const orbitSpherical = new THREE.Spherical()
const baseVehicleRotation = 0.32

const zoomStepDistances = [10.4, 9.05, 7.95, 6.95, 6.15, 5.45] as const
const zoomLookAtHeights = [0.66, 0.58, 0.5, 0.4, 0.3, 0.22] as const
const zoomStepAzimuths = [0.28, 0.34, 0.42, 0.62, 1.08, 1.42] as const
const zoomStepPolars = [1.24, 1.21, 1.17, 1.1, 0.98, 0.88] as const
const minOrbitDistance = zoomStepDistances[zoomStepDistances.length - 1]
const maxOrbitDistance = zoomStepDistances[0]
const orbitRecenteringThresholds = {
  azimuth: 0.26,
  polar: 0.38,
} as const

function getProfileMotionConfig(profile: ShowroomWheelInputProfile) {
  if (profile === 'trackpad') {
    return {
      zoomMultiplier: 0.0019,
      distanceLerp: 0.072,
      distanceBoost: 0.042,
      angleLerp: 0.09,
      angleBoost: 0.034,
      decay: 0.052,
      azimuthSensitivity: 0.0042,
      polarSensitivity: 0.0032,
    }
  }

  if (profile === 'magic-mouse') {
    return {
      zoomMultiplier: 0.0043,
      distanceLerp: 0.094,
      distanceBoost: 0.056,
      angleLerp: 0.112,
      angleBoost: 0.042,
      decay: 0.064,
      azimuthSensitivity: 0.0048,
      polarSensitivity: 0.0035,
    }
  }

  return {
    zoomMultiplier: 0.0072,
    distanceLerp: 0.108,
    distanceBoost: 0.064,
    angleLerp: 0.126,
    angleBoost: 0.048,
    decay: 0.076,
    azimuthSensitivity: 0.005,
    polarSensitivity: 0.0038,
  }
}

const cameraRigs = {
  wide: {
    heroLength: 3.45,
    positions: [
      new THREE.Vector3(0, 2.58, 8.6),
      new THREE.Vector3(-0.45, 2.16, 7.3),
      new THREE.Vector3(0.62, 1.62, 5.58),
      new THREE.Vector3(-1.35, 1.24, 4.62),
      new THREE.Vector3(1.24, 1.18, 4.36),
      new THREE.Vector3(0, 1.04, 4.02),
    ],
    lookAtTargets: [
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0, 0.78, 0),
      new THREE.Vector3(0, 0.52, 0),
      new THREE.Vector3(-0.2, 0.38, 0),
      new THREE.Vector3(0.28, 0.31, 0),
      new THREE.Vector3(0, 0.24, 0),
    ],
  },
  balanced: {
    heroLength: 3.24,
    positions: [
      new THREE.Vector3(0, 2.72, 8.95),
      new THREE.Vector3(-0.35, 2.28, 7.68),
      new THREE.Vector3(0.52, 1.78, 5.98),
      new THREE.Vector3(-1.08, 1.36, 4.98),
      new THREE.Vector3(1.02, 1.3, 4.76),
      new THREE.Vector3(0, 1.2, 4.48),
    ],
    lookAtTargets: [
      new THREE.Vector3(0, 0.96, 0),
      new THREE.Vector3(0, 0.82, 0),
      new THREE.Vector3(0, 0.56, 0),
      new THREE.Vector3(-0.16, 0.42, 0),
      new THREE.Vector3(0.22, 0.34, 0),
      new THREE.Vector3(0, 0.28, 0),
    ],
  },
  compact: {
    heroLength: 3,
    positions: [
      new THREE.Vector3(0, 2.92, 9.35),
      new THREE.Vector3(-0.18, 2.42, 8.08),
      new THREE.Vector3(0.3, 1.98, 6.42),
      new THREE.Vector3(-0.82, 1.52, 5.44),
      new THREE.Vector3(0.74, 1.46, 5.2),
      new THREE.Vector3(0, 1.34, 4.9),
    ],
    lookAtTargets: [
      new THREE.Vector3(0, 1.02, 0),
      new THREE.Vector3(0, 0.88, 0),
      new THREE.Vector3(0, 0.62, 0),
      new THREE.Vector3(-0.1, 0.46, 0),
      new THREE.Vector3(0.14, 0.38, 0),
      new THREE.Vector3(0, 0.32, 0),
    ],
  },
} as const
const stageColors = [
  new THREE.Color('#6d737d'),
  new THREE.Color('#857864'),
  new THREE.Color('#b08c63'),
  new THREE.Color('#4a4f57'),
  new THREE.Color('#8d4f35'),
  new THREE.Color('#c8d0d8'),
]
const currentLookAt = new THREE.Vector3(0, 0.9, 0)

const qualityBadgeLabel = computed(() => {
  switch (runtimeQuality.value) {
    case 'efficient':
      return t('labs_showroom.runtime.quality_efficient_badge')
    case 'balanced':
      return t('labs_showroom.runtime.quality_balanced_badge')
    default:
      return t('labs_showroom.runtime.quality_cinematic_badge')
  }
})

const runtimeTitle = computed(() => t('labs_showroom.runtime.asset_title'))
const runtimeLoadingLabel = computed(() => `${Math.round(runtimeLoadProgress.value * 100)}%`)

const runtimeCopy = computed(() => {
  if (reducedMotionPreferred.value) {
    return t('labs_showroom.runtime.reduced_motion_copy')
  }

  switch (runtimeQuality.value) {
    case 'efficient':
      return t('labs_showroom.runtime.quality_efficient_copy')
    case 'balanced':
      return t('labs_showroom.runtime.quality_balanced_copy')
    default:
      return t('labs_showroom.story.canvas_reactive_copy')
  }
})

function emitRuntimeState() {
  emit('runtimeState', {
    isLoading: runtimeLoading.value,
    isReady: sceneReady.value,
    progress: runtimeLoadProgress.value,
  })
}

function parseColor(value: string | null, fallback: string) {
  return new THREE.Color(value ?? fallback)
}

function resolveFrameProfile(width: number) {
  if (width < 720) {
    return 'compact' as const
  }

  if (width < 1180) {
    return 'balanced' as const
  }

  return 'wide' as const
}

function getFrameReferenceWidth() {
  if (!import.meta.client) {
    return hostRef.value?.clientWidth ?? 1280
  }

  return Math.max(hostRef.value?.clientWidth ?? 0, window.innerWidth)
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const materials = Array.isArray(material) ? material : [material]

  for (const entry of materials) {
    entry.dispose()
  }
}

function replaceMaterial(mesh: RuntimeMesh, material: THREE.Material) {
  disposeMaterial(mesh.material)
  mesh.material = material
}

function createBodyMaterial(color: THREE.Color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    metalness: 0.74,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.85,
  })
}

function createGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d9e2ea'),
    roughness: 0.08,
    metalness: 0.08,
    transmission: 0.62,
    transparent: true,
    opacity: 0.36,
    thickness: 0.3,
    ior: 1.42,
  })
}

function createWindowMirrorMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0a0a0c'),
    roughness: 0.05,
    metalness: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    transmission: 0.0,
    transparent: false,
    opacity: 1.0,
    ior: 2.0,
  })
}

function createTrimMaterial(isShadow: boolean) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(isShadow ? '#3f4751' : '#c8b089'),
    roughness: isShadow ? 0.26 : 0.42,
    metalness: isShadow ? 0.84 : 0.54,
  })
}

function createWheelMaterial(isForged: boolean) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(isForged ? '#d3dae2' : '#78808b'),
    roughness: isForged ? 0.3 : 0.44,
    metalness: isForged ? 0.94 : 0.82,
  })
}

function createTireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a1a1e'),
    roughness: 0.86,
    metalness: 0.0,
  })
}

function detectWheelInputProfile(event: WheelEvent): ShowroomWheelInputProfile {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
    return 'wheel'
  }

  if (!Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 8) {
    return 'trackpad'
  }

  if (Math.abs(event.deltaY) < 42) {
    return 'magic-mouse'
  }

  return 'wheel'
}

function getZoomDistanceForStep(stepIndex: number) {
  return zoomStepDistances[Math.min(Math.max(stepIndex, 0), zoomStepDistances.length - 1)]
}

function getStepIndexFromDistance(distance: number) {
  let stepIndex = 0

  for (let index = 0; index < zoomStepDistances.length - 1; index += 1) {
    const midpoint = (zoomStepDistances[index] + zoomStepDistances[index + 1]) / 2

    if (distance <= midpoint) {
      stepIndex = index + 1
    }
  }

  return stepIndex
}

function getZoomProgress(distance: number) {
  return THREE.MathUtils.clamp(
    (maxOrbitDistance - distance) / Math.max(maxOrbitDistance - minOrbitDistance, 0.001),
    0,
    1,
  )
}

function getLookAtHeightForDistance(distance: number) {
  for (let index = 0; index < zoomStepDistances.length - 1; index += 1) {
    const startDistance = zoomStepDistances[index]
    const endDistance = zoomStepDistances[index + 1]

    if (distance <= startDistance && distance >= endDistance) {
      const blend = (startDistance - distance) / Math.max(startDistance - endDistance, 0.001)
      return THREE.MathUtils.lerp(zoomLookAtHeights[index], zoomLookAtHeights[index + 1], blend)
    }
  }

  return distance > maxOrbitDistance
    ? zoomLookAtHeights[0]
    : zoomLookAtHeights[zoomLookAtHeights.length - 1]
}

function interpolateStepValue(distance: number, values: readonly number[]) {
  for (let index = 0; index < zoomStepDistances.length - 1; index += 1) {
    const startDistance = zoomStepDistances[index]
    const endDistance = zoomStepDistances[index + 1]

    if (distance <= startDistance && distance >= endDistance) {
      const blend = (startDistance - distance) / Math.max(startDistance - endDistance, 0.001)
      return THREE.MathUtils.lerp(values[index], values[index + 1], blend)
    }
  }

  return distance > maxOrbitDistance ? values[0] : values[values.length - 1]
}

function syncCameraState() {
  emit('cameraState', {
    inputProfile: currentInputProfile,
    progress: getZoomProgress(orbitDistance),
    scrollVelocity: interactionVelocity,
    stepIndex: getStepIndexFromDistance(orbitDistance),
  })
}

function getProfileBlend(progressSegment: number) {
  const normalizedSegment = Math.min(Math.max(progressSegment, 0), 1)
  const balancedCurvePower =
    (props.debugTuning.compactCurvePower + props.debugTuning.wideCurvePower) / 2

  if (frameProfile.value === 'compact') {
    return THREE.MathUtils.smoothstep(
      Math.pow(normalizedSegment, props.debugTuning.compactCurvePower),
      0,
      1,
    )
  }

  if (frameProfile.value === 'balanced') {
    return THREE.MathUtils.smootherstep(Math.pow(normalizedSegment, balancedCurvePower), 0, 1)
  }

  return THREE.MathUtils.smootherstep(
    Math.pow(normalizedSegment, props.debugTuning.wideCurvePower),
    0,
    1,
  )
}

function getCameraRig() {
  return cameraRigs[frameProfile.value]
}

function getCameraTarget() {
  const zoomProgress = getZoomProgress(orbitDistance)
  // finalBlend: ramps up during the last 30% of the zoom range (approaching wheel config step)
  const finalBlend = THREE.MathUtils.smoothstep(zoomProgress, 0.7, 1.0)
  // focusBlend: peaks in the middle of the zoom range, fades out towards final step
  const focusBlend = Math.max(
    0,
    THREE.MathUtils.smoothstep(zoomProgress, 0.25, 0.55) -
      THREE.MathUtils.smoothstep(zoomProgress, 0.65, 0.88),
  )

  const baseLookAtY = getLookAtHeightForDistance(orbitDistance)
  orbitLookAtTarget.set(
    0,
    baseLookAtY +
      props.debugTuning.finalLookAtLift * finalBlend +
      props.debugTuning.focusHeightDrift * focusBlend,
    0,
  )
  orbitAzimuth = interpolateStepValue(orbitDistance, zoomStepAzimuths) + manualOrbitAzimuth
  orbitPolar = THREE.MathUtils.clamp(
    interpolateStepValue(orbitDistance, zoomStepPolars) + manualOrbitPolar,
    0.9,
    1.54,
  )
  // Visual distance offset: pull camera back without affecting step detection.
  // orbitDistance stays at the true step distance for getStepIndexFromDistance().
  const visualDistance =
    orbitDistance +
    props.debugTuning.finalDistanceRelief * finalBlend +
    props.debugTuning.focusDistanceDrift * focusBlend
  orbitSpherical.set(visualDistance, orbitPolar, orbitAzimuth)
  orbitCameraPosition.setFromSpherical(orbitSpherical).add(orbitLookAtTarget)
  // Lift camera height at final and focus steps
  orbitCameraPosition.y +=
    props.debugTuning.finalHeightRelief * finalBlend +
    props.debugTuning.focusHeightDrift * focusBlend
  sampledCameraTarget.copy(orbitCameraPosition)
  return sampledCameraTarget
}

function getLookAtTarget() {
  sampledLookAtTarget.copy(orbitLookAtTarget)
  return sampledLookAtTarget
}

function detectWebGLSupport() {
  if (!import.meta.client) {
    return false
  }

  const probe = document.createElement('canvas')

  return Boolean(
    probe.getContext('webgl2') ||
    probe.getContext('webgl') ||
    probe.getContext('experimental-webgl'),
  )
}

function syncReducedMotionPreference(event?: MediaQueryList | MediaQueryListEvent) {
  reducedMotionPreferred.value = event?.matches ?? motionQuery?.matches ?? false
}

function resolveRuntimeQuality() {
  if (!import.meta.client) {
    return 'cinematic' as const
  }

  const viewportWidth = window.innerWidth
  const devicePixelRatio = window.devicePixelRatio || 1
  const hardwareConcurrency = navigator.hardwareConcurrency || 4
  const deviceMemory =
    'deviceMemory' in navigator
      ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4)
      : 4

  if (
    viewportWidth < 768 ||
    devicePixelRatio > 2 ||
    hardwareConcurrency <= 4 ||
    deviceMemory <= 4
  ) {
    return 'efficient' as const
  }

  if (viewportWidth < 1280 || devicePixelRatio > 1.5) {
    return 'balanced' as const
  }

  return 'cinematic' as const
}

function applyTimeOfDay() {
  if (!scene || !ambientLight || !keyLight || !celestialSphere || !rimLight || !floor || !pedestal)
    return

  const isDay = props.timeOfDay === 'day'

  if (isDay) {
    scene.background = new THREE.Color(0xb5d8eb)
    scene.fog = new THREE.FogExp2(0xb5d8eb, 0.04)

    ambientLight.color.setHex(0xc0d0e0)
    ambientLight.intensity = runtimeQuality.value === 'efficient' ? 1.5 : 2.0

    keyLight.color.setHex(0xffea99) // Soft yellow sun
    keyLight.intensity = runtimeQuality.value === 'efficient' ? 2.5 : 3.5
    keyLight.position.set(-16, 12, -26)

    rimLight.intensity = runtimeQuality.value === 'efficient' ? 1.5 : 2.5
    rimLight.color.setHex(0xffa502) // Warm accent

    celestialSphere.scale.setScalar(1.6)
    celestialSphere.position.copy(keyLight.position)
    celestialSphere.material.color.copy(keyLight.color)

    floor.material.color.setHex(0x5a6572)
    pedestal.material.color.setHex(0x738090)
  } else {
    scene.background = null
    scene.fog = new THREE.Fog(0x090c11, 7, 16)

    ambientLight.color.setHex(0x9ca3af) // Cool gray ambient
    ambientLight.intensity = runtimeQuality.value === 'efficient' ? 1.0 : 1.2

    keyLight.color.setHex(0xe2e8f0) // Whitish-gray moon
    keyLight.intensity = runtimeQuality.value === 'efficient' ? 1.0 : 1.5
    keyLight.position.set(16, 14, -20)

    rimLight.intensity = runtimeQuality.value === 'efficient' ? 6 : 8
    rimLight.color.setHex(0x94a3b8) // Cool rim light

    celestialSphere.scale.setScalar(1.2)
    celestialSphere.position.copy(keyLight.position)
    celestialSphere.material.color.copy(keyLight.color)

    floor.material.color.setHex(0x11161d)
    pedestal.material.color.setHex(0x171e27)
  }
}

watch(
  () => props.timeOfDay,
  () => {
    applyTimeOfDay()
  },
)

function applyRuntimeQuality() {
  if (!renderer) {
    return
  }

  const pixelRatioCap = reducedMotionPreferred.value
    ? 1
    : runtimeQuality.value === 'efficient'
      ? 1
      : runtimeQuality.value === 'balanced'
        ? 1.25
        : 1.5

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap))

  if (wireframe) {
    wireframe.visible = runtimeQuality.value !== 'efficient'
  }

  if (glowRing) {
    glowRing.visible = runtimeQuality.value !== 'efficient'
  }
}

function renderScene() {
  if (!renderer || !scene || !camera) {
    return
  }

  renderer.render(scene, camera)
}

function resizeScene() {
  if (!renderer || !camera || !hostRef.value) {
    return
  }

  const { clientWidth, clientHeight } = hostRef.value

  if (!clientWidth || !clientHeight) {
    return
  }

  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderScene()
}

function handleWindowResize() {
  runtimeQuality.value = resolveRuntimeQuality()
  frameProfile.value = resolveFrameProfile(getFrameReferenceWidth())
  applyHeroFraming()
  applyRuntimeQuality()
  updateSceneState(0, reducedMotionPreferred.value)
  resizeScene()
}

function syncRuntimeDebugState(state: {
  bodyHex: string
  cameraY: string
  cameraZ: string
  trimVariant: string
  wheelsVariant: string
}) {
  if (!hostRef.value) {
    return
  }

  hostRef.value.dataset.modelSource = heroRoot ? 'glb' : 'procedural'
  hostRef.value.dataset.environmentSource = environmentMap ? 'hdr-pmrem' : 'none'
  hostRef.value.dataset.bodyHex = state.bodyHex
  hostRef.value.dataset.cameraY = state.cameraY
  hostRef.value.dataset.cameraZ = state.cameraZ
  hostRef.value.dataset.frameProfile = frameProfile.value
  hostRef.value.dataset.trimVariant = state.trimVariant
  hostRef.value.dataset.wheelsVariant = state.wheelsVariant
}

function fitHeroModel(root: THREE.Group) {
  // Studio props (Floor, Light, Cylinder) were already removed from the scene graph
  // in mountHeroModel before this call, so setFromObject is safe to use directly.
  const box = new THREE.Box3()
  box.setFromObject(root)

  if (box.isEmpty()) {
    return
  }

  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)

  heroBaseSize = size
  heroBaseCenter = center
  heroBaseMinY = box.min.y
  applyHeroFraming()
}

function applyHeroFraming() {
  if (!heroRoot || !heroBaseSize || !heroBaseCenter) {
    return
  }

  const targetLength = getCameraRig().heroLength
  const scale = targetLength / Math.max(heroBaseSize.x, heroBaseSize.z, 1)

  heroRoot.scale.setScalar(scale)
  heroRoot.position.set(
    -heroBaseCenter.x * scale,
    -0.62 - heroBaseMinY * scale,
    -heroBaseCenter.z * scale,
  )
  heroRoot.updateMatrixWorld(true)
}

// ── Audi TT RS 2019 node / material sets ─────────────────────────────────────
// Car Body has 5 GLTF primitives → Three.js loads it as a Group with unnamed Mesh children.
// Same for Rim nodes (5 prims each). We must match by MATERIAL NAME, not node name.
// Three.js GLTFLoader strips dots from node names (e.g. "Light.001" → "Light001"),
// so we must include both the original and the sanitized variants.
const AUDI_HIDE_NODES = new Set([
  'Floor',
  'Light',
  'Light.001',
  'Light001',
  'Light.002',
  'Light002',
  'Cylinder',
  'Camera',
])
// Materials from the GLB that belong to each visual layer:
const AUDI_BODY_MAT = new Set(['Car Paint'])
const AUDI_GLASS_MATS = new Set(['Glass', 'Matte Glass'])
const AUDI_WINDOW_MAT = new Set(['Black TInt Glass'])
const AUDI_TIRE_MAT = new Set(['Tires'])
// Rim node names — children of these Groups are the actual rim Meshes
const AUDI_RIM_NODES = new Set([
  'Rim_Front_Left',
  'Rim_Front_Right',
  'Rim_Back_Left',
  'Rim_Back_Right',
])
// Single-primitive trim nodes (node names work here)
const AUDI_TRIM_NODES = new Set(['Grill', 'Mirrors', 'Rear Bumper'])

function captureHeroNodes(root: THREE.Group) {
  body = null
  canopy = null
  trim = null
  bodyMeshes = []
  glassMeshes = []
  windowMirrorMeshes = []
  trimMeshes = []
  rimMeshes = []
  wheelMeshes = []
  rimNodes = []
  tireMeshSet = new Set()
  // Only capture the ROOT rim object per wheel — Three.js r140+ gives child meshes
  // the SAME name as the parent Group (for multi-primitive nodes), so we must only
  // push the outermost node (whose parent is NOT itself a rim node).
  root.traverse((object) => {
    if (AUDI_RIM_NODES.has(object.name) && !AUDI_RIM_NODES.has(object.parent?.name ?? '')) {
      rimNodes.push(object)
    }
  })

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.castShadow = false
    object.receiveShadow = false

    const n = object.name
    const parentName = object.parent?.name ?? ''

    // Read the original GLB material name BEFORE any replacement
    const origMat = Array.isArray(object.material) ? object.material[0] : object.material
    const matName: string = (origMat as THREE.Material & { name?: string })?.name ?? ''

    // ── Hide studio props (node + children) ──────────────────────────────
    if (AUDI_HIDE_NODES.has(n) || AUDI_HIDE_NODES.has(parentName)) {
      object.visible = false
      return
    }

    // ── Body paint: match by material name ───────────────────────────────
    // "Car Body" Group → unnamed Mesh children, each with their own mat.
    // We only replace the "Car Paint" primitive so headlights/seals keep their look.
    if (AUDI_BODY_MAT.has(matName)) {
      replaceMaterial(object, createBodyMaterial(new THREE.Color('#b08c63')))
      bodyMeshes.push(object)
      if (!body) body = object
      return
    }

    // ── Glass: headlights & other clear glass ────────────────────────────
    if (AUDI_GLASS_MATS.has(matName)) {
      replaceMaterial(object, createGlassMaterial())
      glassMeshes.push(object)
      if (!canopy) canopy = object
      return
    }

    // ── Mirrors/Window Glass: by material name ────────────────────────────
    if (AUDI_WINDOW_MAT.has(matName)) {
      replaceMaterial(object, createWindowMirrorMaterial())
      windowMirrorMeshes.push(object)
      if (!canopy) canopy = object
      return
    }

    // ── Tires: by material name OR by node name (Tire_* siblings) ────────
    // Node-name check ensures rubber material is applied even if the GLB material
    // name doesn't match 'Tires' exactly (avoids falling into the rim metal branch).
    if (AUDI_TIRE_MAT.has(matName) || n.startsWith('Tire_')) {
      replaceMaterial(object, createTireMaterial())
      wheelMeshes.push(object)
      tireMeshSet.add(object)
      return
    }

    // ── Rims: children of Rim* node Groups (Tire_* already handled above) ─
    if (AUDI_RIM_NODES.has(parentName) || AUDI_RIM_NODES.has(n)) {
      replaceMaterial(object, createWheelMaterial(false))
      rimMeshes.push(object)
      wheelMeshes.push(object)
      return
    }

    // ── Trim: single-primitive named nodes ───────────────────────────────
    if (AUDI_TRIM_NODES.has(n)) {
      replaceMaterial(object, createTrimMaterial(false))
      trimMeshes.push(object)
      if (!trim) trim = object
      return
    }

    // ── Legacy procedural node names ──────────────────────────────────────
    switch (n) {
      case 'Body':
        replaceMaterial(object, createBodyMaterial(new THREE.Color('#b08c63')))
        bodyMeshes.push(object)
        body = object
        break
      case 'Glass':
        replaceMaterial(object, createGlassMaterial())
        glassMeshes.push(object)
        canopy = object
        break
      case 'Trim':
        replaceMaterial(object, createTrimMaterial(false))
        trimMeshes.push(object)
        trim = object
        break
      case 'WheelFL':
      case 'WheelFR':
      case 'WheelRL':
      case 'WheelRR':
        replaceMaterial(object, createWheelMaterial(false))
        wheelMeshes.push(object)
        break
    }
  })
}

// ── Wheel pack geometry swap ─────────────────────────────────────────────────
// Left wheels (positive X) need face pointing +X → rotate Y→X via +90° Z.
// Right wheels (negative X) need face pointing -X → rotate Y→-X via -90° Z.
const PACK_ORIENT_LEFT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2))
const PACK_ORIENT_RIGHT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))

async function loadWheelPack() {
  const gltfLoader = new GLTFLoader()
  let gltf
  try {
    gltf = await gltfLoader.loadAsync('/labs/dealer-showroom/models/wheel-pack.glb')
  } catch {
    return
  }
  const packScene = gltf.scene
  const tyrePat = /^tyre/i
  ;(['Wheel01', 'Wheel02', 'Wheel03'] as const).forEach((name, i) => {
    const wheelNode = packScene.getObjectByName(name)
    if (!wheelNode) return
    const clean = wheelNode.clone(true)
    const toRemove: THREE.Object3D[] = []
    clean.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material
        const matName = (mat as THREE.Material & { name?: string })?.name ?? ''
        if (tyrePat.test(matName)) toRemove.push(obj)
      }
    })
    toRemove.forEach((obj) => obj.removeFromParent())
    clean.position.set(0, 0, 0)
    packWheelTemplates.set(`wheel-0${i + 1}`, clean)
  })
}

function swapRimMeshes(wheelId: string | null) {
  // Remove previously added pack rims
  for (const obj of currentSwappedRims) {
    obj.removeFromParent()
  }
  currentSwappedRims = []

  // Restore individually hidden rim meshes (tyres were never hidden)
  for (const m of hiddenRimMeshes) m.visible = true
  hiddenRimMeshes = []

  // Rebuild rimMeshes from original Audi rim nodes, excluding tyre meshes
  rimMeshes = []
  for (const rimNode of rimNodes) {
    rimNode.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !tireMeshSet.has(obj)) {
        rimMeshes.push(obj as RuntimeMesh)
      }
    })
  }

  const template = wheelId ? packWheelTemplates.get(wheelId) : null
  if (!template || rimNodes.length === 0 || !heroRoot) return

  heroRoot.updateMatrixWorld(true)

  // Measure pack template bounding box — center AND size in local space
  const packBox = new THREE.Box3().setFromObject(template)
  const packSize = new THREE.Vector3()
  packBox.getSize(packSize)
  const packCenter = new THREE.Vector3()
  packBox.getCenter(packCenter)
  const packRadiusLocal = Math.max(packSize.x, packSize.y, packSize.z) / 2

  rimMeshes = []
  for (const rimNode of rimNodes) {
    // Hide only the RIM METAL meshes inside the group, NOT tires.
    // Use tireMeshSet (populated in captureHeroNodes) to distinguish — material names
    // are unavailable here because replaceMaterial() already replaced them with unnamed materials.
    rimNode.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !tireMeshSet.has(obj)) {
        obj.visible = false
        hiddenRimMeshes.push(obj)
      }
    })

    // Measure this rim in WORLD space for scale reference
    const audiBox = new THREE.Box3().setFromObject(rimNode)
    const audiSize = new THREE.Vector3()
    audiBox.getSize(audiSize)
    const audiRadiusWorld = Math.max(audiSize.x, audiSize.y, audiSize.z) / 2

    // Find the sibling tyre mesh (e.g. Tire_Front_Left when rimNode = Rim_Front_Left).
    // Use its outer radius as reference so the pack rim fills the rubber zone correctly.
    const tyreSiblingName = rimNode.name.replace('Rim_', 'Tire_')
    const tyreMesh = rimNode.parent?.getObjectByName(tyreSiblingName)
    let referenceRadiusWorld = audiRadiusWorld
    if (tyreMesh) {
      const tyreBox = new THREE.Box3().setFromObject(tyreMesh)
      const tyreSize = new THREE.Vector3()
      tyreBox.getSize(tyreSize)
      const dims = [tyreSize.x, tyreSize.y, tyreSize.z].sort((a, b) => b - a)
      referenceRadiusWorld = dims[0] / 2 // largest dimension = tyre outer diameter
    }

    const parent = rimNode.parent ?? heroRoot
    const parentWorldScale = new THREE.Vector3()
    parent.getWorldScale(parentWorldScale)
    // Scale the pack to 72% of tyre radius — pack rim matches original Audi rim disc
    // and leaves ~28% of tyre rubber visible as a ring around it.
    const scaleFactor =
      packRadiusLocal > 0.001
        ? (referenceRadiusWorld / (parentWorldScale.x * packRadiusLocal)) * 0.72
        : 0.72

    // Left wheels (name contains 'Left') need face pointing outward (+X);
    // Right wheels need face pointing inward-out (-X). Different orient per side.
    const isLeft = rimNode.name.includes('Left')
    const orientFix = isLeft ? PACK_ORIENT_LEFT : PACK_ORIENT_RIGHT

    const clone = template.clone(true)
    clone.position.copy(rimNode.position)
    clone.quaternion.copy(rimNode.quaternion).multiply(orientFix)
    clone.scale.setScalar(scaleFactor)

    // Push the clone inward along the wheel's outward axis so the rim face sits
    // flush with the tyre outer face rather than protruding beyond the bodywork.
    // The pack hub axis (local +X) maps through clone.quaternion to the outward
    // direction in parent space. We offset by the pack face distance so the
    // visible face is centred over the original rim position.
    const hubOutward = new THREE.Vector3(1, 0, 0).applyQuaternion(clone.quaternion)
    // Pack face is at (packCenter.x - packSize.x/2) from clone origin in local X.
    // After scaling, that distance in parent local space = face_local * scaleFactor.
    const faceDist = (packCenter.x - packSize.x / 2) * scaleFactor // negative = outward face is inside
    // Shift clone so that the pack face lines up at the Audi rim's outer face position.
    // audiSize.x/2 = half hub depth of Audi rim in world; divide by parentWorldScale to get parent-local.
    const audiHubHalfLocal = audiSize.x / 2 / parentWorldScale.x
    // We want: clone.position + faceDist * hubOutward + audiHubHalfLocal * hubOutward = rimNode.position
    // Solving: clone.position = rimNode.position - (faceDist + audiHubHalfLocal) * hubOutward
    const faceAlignOffset = faceDist + audiHubHalfLocal
    clone.position.addScaledVector(hubOutward, -faceAlignOffset)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        replaceMaterial(obj as RuntimeMesh, createWheelMaterial(false))
        rimMeshes.push(obj as RuntimeMesh)
      }
    })
    parent.add(clone)
    currentSwappedRims.push(clone)
  }
}

async function mountHeroModel() {
  if (!scene) {
    return false
  }

  const gltfLoader = new GLTFLoader(loadingManager ?? undefined)
  const gltf = await gltfLoader.loadAsync(props.modelPath)
  const root = gltf.scene

  // Order matters:
  // 1. Remove studio props (Floor, Lights, Cylinder) from the scene graph entirely so
  //    they don't pollute the bounding box and aren't rendered at all.
  // 2. heroRoot must be set before fitHeroModel so applyHeroFraming works.
  // 3. fitHeroModel computes bounding box and applies scale/position.
  // 4. captureHeroNodes classifies the remaining meshes for material updates.
  const toRemove: THREE.Object3D[] = []
  root.traverse((obj) => {
    if (AUDI_HIDE_NODES.has(obj.name)) {
      toRemove.push(obj)
    }
  })
  toRemove.forEach((obj) => obj.removeFromParent())

  heroRoot = root
  scene.add(root)
  fitHeroModel(root)
  captureHeroNodes(root)
  // Preload wheel pack in background — re-apply selection once ready (user may have
  // already selected a variant before the pack finishes loading).
  loadWheelPack().then(() => {
    const sel = props.selectedOptions.wheels
    if (sel && heroRoot) {
      swapRimMeshes(sel)
      renderScene()
    }
  })

  // Accept the GLB as long as it loaded — at minimum the body should be found.
  // If none of the expected nodes were found we still keep the model visible rather
  // than silently falling back to the procedural capsule.
  const isValidModel = true

  if (!isValidModel) {
    scene.remove(root)
    heroRoot = null
    body = null
    canopy = null
    trim = null
    bodyMeshes = []
    glassMeshes = []
    trimMeshes = []
    rimMeshes = []
    wheelMeshes = []
  }

  return isValidModel
}

async function mountEnvironment() {
  if (!scene || !renderer) {
    return
  }

  const hdrLoader = new HDRLoader(loadingManager ?? undefined)
  pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  environmentSource = await hdrLoader.loadAsync(props.hdrPath)

  if (mountAborted || !scene || !pmremGenerator) {
    environmentSource?.dispose()
    environmentSource = null
    return
  }

  environmentSource.mapping = THREE.EquirectangularReflectionMapping

  environmentMap = pmremGenerator.fromEquirectangular(environmentSource).texture
  scene.environment = environmentMap
  scene.background = environmentMap
  scene.backgroundBlurriness = 0.44
  scene.backgroundIntensity = 0.68
}

function mountProceduralFallback() {
  body = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      1.35,
      1.75,
      runtimeQuality.value === 'efficient' ? 4 : 8,
      runtimeQuality.value === 'efficient' ? 12 : 24,
    ),
    createBodyMaterial(new THREE.Color('#b08c63')),
  )
  body.rotation.z = Math.PI / 2
  body.position.y = 0.22
  bodyMeshes = [body]
  scene?.add(body)

  canopy = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.78,
      runtimeQuality.value === 'efficient' ? 18 : 32,
      runtimeQuality.value === 'efficient' ? 12 : 20,
      0,
      Math.PI,
    ),
    createGlassMaterial(),
  )
  canopy.scale.set(1.4, 0.62, 0.92)
  canopy.rotation.z = Math.PI / 2
  canopy.position.set(0.18, 0.7, 0)
  glassMeshes = [canopy]
  scene?.add(canopy)

  trim = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.56, 1.34), createTrimMaterial(false))
  trim.position.y = 0.18
  trimMeshes = [trim]
  scene?.add(trim)

  // Wireframe outline — only in procedural fallback
  wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 0.7, 1.45)),
    new THREE.LineBasicMaterial({
      color: 0xf3d0a1,
      transparent: true,
      opacity: 0.58,
    }),
  )
  wireframe.position.y = 0.18
  scene?.add(wireframe)

  const wheelOffsets = [
    new THREE.Vector3(1.05, -0.16, 0.98),
    new THREE.Vector3(1.05, -0.16, -0.98),
    new THREE.Vector3(-1.05, -0.16, 0.98),
    new THREE.Vector3(-1.05, -0.16, -0.98),
  ]

  wheelMeshes = wheelOffsets.map((position) => {
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.54,
        0.14,
        runtimeQuality.value === 'efficient' ? 12 : 16,
        runtimeQuality.value === 'efficient' ? 28 : 48,
      ),
      createWheelMaterial(false),
    )
    wheel.rotation.y = Math.PI / 2
    wheel.position.copy(position)
    scene?.add(wheel)
    return wheel
  })
}

function handlePointerMove(event: PointerEvent) {
  if (dragPointerId !== event.pointerId) {
    return
  }

  const motionConfig = getProfileMotionConfig(currentInputProfile)
  const deltaX = event.clientX - lastPointerX
  const deltaY = event.clientY - lastPointerY
  lastPointerX = event.clientX
  lastPointerY = event.clientY

  targetManualOrbitAzimuth -= deltaX * motionConfig.azimuthSensitivity
  targetManualOrbitPolar = THREE.MathUtils.clamp(
    targetManualOrbitPolar + deltaY * motionConfig.polarSensitivity,
    -0.52,
    0.58,
  )
  interactionVelocity = Math.min(1, Math.max(Math.abs(deltaX), Math.abs(deltaY)) / 44)
}

function stopPointerDrag() {
  if (dragPointerId === null) {
    return
  }

  dragPointerId = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopPointerDrag)
  // Camera stays at the dragged position — no recentering
}

function startPointerDrag(event: PointerEvent) {
  if (event.button !== 0) {
    return
  }

  dragPointerId = event.pointerId
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  interactionVelocity = 0
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopPointerDrag)
}

function handleWheelZoom(event: WheelEvent) {
  event.preventDefault()

  const profile = detectWheelInputProfile(event)
  currentInputProfile = profile

  const zoomMultiplier =
    profile === 'trackpad'
      ? props.debugTuning.trackpadMultiplier
      : profile === 'magic-mouse'
        ? props.debugTuning.magicMouseMultiplier
        : props.debugTuning.wheelMultiplier

  targetOrbitDistance = THREE.MathUtils.clamp(
    targetOrbitDistance + event.deltaY * zoomMultiplier,
    minOrbitDistance,
    maxOrbitDistance,
  )
  interactionVelocity = Math.min(1, Math.abs(event.deltaY) / 160)
}

function updateSceneState(now: number, isReducedMotion: boolean) {
  const motionConfig = getProfileMotionConfig(currentInputProfile)
  const distanceLerp = isReducedMotion
    ? 1
    : motionConfig.distanceLerp + interactionVelocity * motionConfig.distanceBoost
  const angleLerp = isReducedMotion
    ? 1
    : motionConfig.angleLerp + interactionVelocity * motionConfig.angleBoost
  orbitDistance = THREE.MathUtils.lerp(orbitDistance, targetOrbitDistance, distanceLerp)
  manualOrbitAzimuth = THREE.MathUtils.lerp(manualOrbitAzimuth, targetManualOrbitAzimuth, angleLerp)
  manualOrbitPolar = THREE.MathUtils.lerp(manualOrbitPolar, targetManualOrbitPolar, angleLerp)

  const cameraTarget = getCameraTarget()
  const lookAtTarget = getLookAtTarget()
  const zoomProgress = getZoomProgress(orbitDistance)
  const colorIndex = Math.min(
    Math.round(zoomProgress * Math.max(stageColors.length - 1, 1)),
    stageColors.length - 1,
  )
  const baseStageColor = stageColors[colorIndex]
  const selectedBodyColor = parseColor(
    props.selectedOptions.color,
    `#${baseStageColor.getHexString()}`,
  )
  const trimShadow = props.selectedOptions.trim === 'shadow'
  const satinMatte = props.selectedOptions.finish === 'matte'
  const coatingLevel = props.selectedOptions.coating ?? 'standard'
  const forgedWheels = props.selectedOptions.wheels === 'forged-21'
  const oscillation = isReducedMotion ? 0 : Math.sin(now * 0.0014) * 0.03
  const ringPulse = isReducedMotion ? 0.5 : (Math.sin(now * 0.002) + 1) * 0.05
  const velocityBoost = Math.min(interactionVelocity, 1)

  if (!camera) {
    return
  }

  const cameraLerp = isReducedMotion ? 1 : 0.28 + velocityBoost * 0.08
  const lookAtLerp = isReducedMotion ? 1 : 0.22 + velocityBoost * 0.06

  camera.position.lerp(cameraTarget, cameraLerp)
  currentLookAt.lerp(lookAtTarget, lookAtLerp)
  camera.lookAt(currentLookAt)

  // When a real GLB model is loaded, rotate the whole root group so all nodes move together.
  // For the procedural fallback (heroRoot = null) individual mesh rotations handle it below.
  if (heroRoot) {
    heroRoot.rotation.y = baseVehicleRotation
  }

  // ── Body paint (all body meshes) ─────────────────────────────────────────
  for (const mesh of bodyMeshes) {
    if (!heroRoot) mesh.rotation.y = baseVehicleRotation
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.color.lerp(selectedBodyColor, isReducedMotion ? 1 : 0.08)
      // satin-tone: matte kills clearcoat and raises roughness; gloss = showroom shine
      // coating: ppf slightly protective, ceramic = hyper-mirror
      if (mat instanceof THREE.MeshPhysicalMaterial) {
        let targetClearcoat = satinMatte ? 0 : 1
        let targetClearcoatRoughness = satinMatte ? 0.4 : 0.14
        let targetRoughness = satinMatte ? 0.72 : trimShadow ? 0.2 : 0.34
        if (!satinMatte) {
          if (coatingLevel === 'ppf') {
            targetClearcoat = 0.88
            targetClearcoatRoughness = 0.22
            targetRoughness = 0.38
          } else if (coatingLevel === 'ceramic') {
            targetClearcoat = 1
            targetClearcoatRoughness = 0.04
            targetRoughness = 0.28
          }
        }
        mat.clearcoat = THREE.MathUtils.lerp(
          mat.clearcoat,
          targetClearcoat,
          isReducedMotion ? 1 : 0.08,
        )
        mat.clearcoatRoughness = THREE.MathUtils.lerp(
          mat.clearcoatRoughness,
          targetClearcoatRoughness,
          isReducedMotion ? 1 : 0.08,
        )
        mat.roughness = THREE.MathUtils.lerp(
          mat.roughness,
          targetRoughness,
          isReducedMotion ? 1 : 0.08,
        )
      }
      mat.metalness = trimShadow ? 0.82 : 0.74
    }
  }

  // ── Glass (all glass meshes) ──────────────────────────────────────────────
  for (const mesh of glassMeshes) {
    if (!heroRoot) mesh.rotation.y = baseVehicleRotation
    if (!heroRoot) mesh.position.y = 0.64 + oscillation
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.opacity = trimShadow ? 0.26 : 0.34
      mat.transparent = true
    }
  }

  // ── Windows (all window mirror lenses) ────────────────────────────────────
  for (const mesh of windowMirrorMeshes) {
    if (!heroRoot) mesh.rotation.y = baseVehicleRotation
    if (!heroRoot) mesh.position.y = 0.64 + oscillation
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.color.lerp(
        parseColor(trimShadow ? '#030303' : '#08080a', '#08080a'),
        isReducedMotion ? 1 : 0.08,
      )
      mat.metalness = trimShadow ? 0.95 : 0.9
      mat.roughness = trimShadow ? 0.02 : 0.05
    }
  }

  // ── Trim (all trim meshes) ────────────────────────────────────────────────
  for (const mesh of trimMeshes) {
    if (!heroRoot) mesh.rotation.y = baseVehicleRotation
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.color.lerp(
        parseColor(trimShadow ? '#3f4751' : '#c8b089', '#c8b089'),
        isReducedMotion ? 1 : 0.08,
      )
      mat.metalness = trimShadow ? 0.84 : 0.54
      mat.roughness = trimShadow ? 0.26 : 0.42
    }
  }

  // Wireframe bounding-box overlay — only used in procedural fallback mode
  if (wireframe) {
    wireframe.visible = !heroRoot
    if (!heroRoot) {
      wireframe.rotation.y = baseVehicleRotation
      wireframe.material.opacity = (trimShadow ? 0.24 : 0.4) + zoomProgress * 0.28
      wireframe.material.color.lerp(
        parseColor(trimShadow ? '#6b737d' : '#f3d0a1', '#f3d0a1'),
        isReducedMotion ? 1 : 0.08,
      )
    }
  }

  if (glowRing) {
    glowRing.material.opacity = 0.24 + zoomProgress * 0.24 + ringPulse
    glowRing.scale.setScalar(1 + zoomProgress * 0.06)
    glowRing.material.color.lerp(
      parseColor(trimShadow ? '#8b8f96' : '#c49757', '#c49757'),
      isReducedMotion ? 1 : 0.08,
    )
  }

  // ── Wheels: only rims are updated in the render loop — tires are static black
  // When pack geometry is swapped in, rimMeshes contains pack clone meshes.
  // wheelMeshes fallback is only used in procedural mode (no heroRoot).
  for (const mesh of heroRoot ? rimMeshes : wheelMeshes) {
    if (!mesh) continue
    if (!heroRoot) mesh.rotation.y = Math.PI / 2
    mesh.scale.setScalar(forgedWheels ? 1.08 : 1)
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.color.lerp(
        parseColor(forgedWheels ? '#d3dae2' : '#78808b', '#78808b'),
        isReducedMotion ? 1 : 0.08,
      )
      mat.metalness = forgedWheels ? 0.94 : 0.82
      mat.roughness = forgedWheels ? 0.3 : 0.44
    }
  }

  syncRuntimeDebugState({
    bodyHex: selectedBodyColor.getHexString(),
    cameraY: camera.position.y.toFixed(3),
    cameraZ: camera.position.z.toFixed(3),
    trimVariant: trimShadow ? 'shadow' : 'satin',
    wheelsVariant: forgedWheels ? 'forged-21' : 'aero-20',
  })

  interactionVelocity = THREE.MathUtils.lerp(
    interactionVelocity,
    0,
    isReducedMotion ? 1 : motionConfig.decay,
  )
  syncCameraState()
}

function stopAnimation() {
  if (!frameId) {
    return
  }

  window.cancelAnimationFrame(frameId)
  frameId = 0
}

function renderStaticScene() {
  if (!sceneReady.value) {
    return
  }

  updateSceneState(0, true)
  renderScene()
}

function startAnimation() {
  if (!sceneReady.value || reducedMotionPreferred.value || frameId) {
    return
  }

  const animate = () => {
    frameId = window.requestAnimationFrame(animate)
    updateSceneState(performance.now(), false)
    renderScene()
  }

  animate()
}

onMounted(async () => {
  mountAborted = false
  runtimeLoading.value = true
  runtimeLoadProgress.value = 0.05
  webglSupported.value = detectWebGLSupport()
  runtimeQuality.value = resolveRuntimeQuality()

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncReducedMotionPreference(motionQuery)
  motionQuery.addEventListener('change', syncReducedMotionPreference)

  if (!webglSupported.value || !canvasRef.value || !hostRef.value) {
    runtimeLoading.value = false
    return
  }

  frameProfile.value = resolveFrameProfile(getFrameReferenceWidth())
  loadingManager = new THREE.LoadingManager()
  loadingManager.onProgress = (_url, loaded, total) => {
    runtimeLoadProgress.value = total > 0 ? loaded / total : runtimeLoadProgress.value
  }
  loadingManager.onLoad = () => {
    runtimeLoadProgress.value = 1
    runtimeLoading.value = false
  }
  loadingManager.onError = () => {
    runtimeLoading.value = false
  }

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x090c11, 7, 16)

  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
  targetOrbitDistance = getZoomDistanceForStep(props.activeStepIndex)
  orbitDistance = targetOrbitDistance
  orbitLookAtTarget.set(0, getLookAtHeightForDistance(orbitDistance), 0)
  orbitSpherical.set(orbitDistance, orbitPolar, orbitAzimuth)
  orbitCameraPosition.setFromSpherical(orbitSpherical).add(orbitLookAtTarget)
  camera.position.copy(orbitCameraPosition)
  camera.lookAt(orbitLookAtTarget)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: runtimeQuality.value !== 'efficient',
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  applyRuntimeQuality()

  await mountEnvironment()

  if (mountAborted || !scene) {
    return
  }

  ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  keyLight = new THREE.DirectionalLight(0xf7f1e8, 2.4)
  keyLight.position.set(3.5, 5, 4.5)
  scene.add(keyLight)

  rimLight = new THREE.PointLight(0xc49757, 18, 18, 2)
  rimLight.position.set(-3, 1.8, -2.2)
  scene.add(rimLight)

  celestialSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }),
  )
  scene.add(celestialSphere)

  floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, runtimeQuality.value === 'efficient' ? 40 : 80),
    new THREE.MeshStandardMaterial({
      color: 0x11161d,
      roughness: 0.92,
      metalness: 0.16,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.1
  scene.add(floor)

  pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 2.15, 0.45, runtimeQuality.value === 'efficient' ? 24 : 48),
    new THREE.MeshStandardMaterial({
      color: 0x171e27,
      roughness: 0.78,
      metalness: 0.22,
    }),
  )
  pedestal.position.y = -0.85
  scene.add(pedestal)

  // Initialize day/night mode
  applyTimeOfDay()

  // Wireframe bounding-box is only used as a visual aid in procedural fallback mode.
  // Do NOT add it here — mountProceduralFallback adds it if the GLB fails to load.

  try {
    const mounted = await mountHeroModel()

    if (mountAborted || !scene) {
      return
    }

    if (!mounted) {
      mountProceduralFallback()
    }
  } catch {
    if (mountAborted || !scene) {
      return
    }

    mountProceduralFallback()
  }

  if (mountAborted || !scene) {
    return
  }

  glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.03, 8, runtimeQuality.value === 'efficient' ? 48 : 96),
    new THREE.MeshBasicMaterial({
      color: 0xc49757,
      transparent: true,
      opacity: 0.48,
    }),
  )
  glowRing.rotation.x = Math.PI / 2
  glowRing.position.y = -0.62
  scene.add(glowRing)

  applyRuntimeQuality()
  updateSceneState(0, reducedMotionPreferred.value)

  resizeScene()
  sceneReady.value = true

  if (reducedMotionPreferred.value) {
    renderStaticScene()
  } else {
    startAnimation()
  }

  hostRef.value.addEventListener('wheel', handleWheelZoom, { passive: false })
  hostRef.value.addEventListener('pointerdown', startPointerDrag)
  window.addEventListener('resize', handleWindowResize)
  syncCameraState()
})

watch(runtimeQuality, () => {
  if (!sceneReady.value) {
    return
  }

  applyRuntimeQuality()
  applyHeroFraming()
  resizeScene()
})

watch(
  () => [
    props.activeStepIndex,
    props.debugTuning.globalZoomScale,
    props.debugTuning.compactCurvePower,
    props.debugTuning.wideCurvePower,
    props.debugTuning.focusDistanceDrift,
    props.debugTuning.focusHeightDrift,
    props.debugTuning.finalDistanceRelief,
    props.debugTuning.finalHeightRelief,
    props.debugTuning.finalLookAtLift,
    props.selectedOptions.color,
    props.selectedOptions.trim,
    props.selectedOptions.wheels,
  ],
  () => {
    // Keep targetOrbitDistance pure (step distance × globalZoomScale) so that
    // getStepIndexFromDistance() never gets confused by visual relief offsets.
    // finalDistanceRelief and focusDistanceDrift are applied visually in getCameraTarget().
    targetOrbitDistance =
      getZoomDistanceForStep(props.activeStepIndex) * props.debugTuning.globalZoomScale
    updateSceneState(0, reducedMotionPreferred.value)

    if (reducedMotionPreferred.value) {
      renderStaticScene()
    } else {
      renderScene()
    }
  },
)

watch(reducedMotionPreferred, (isReducedMotion) => {
  if (!sceneReady.value) {
    return
  }

  applyRuntimeQuality()

  if (isReducedMotion) {
    stopAnimation()
    renderStaticScene()
    return
  }

  startAnimation()
})

watch(
  [runtimeLoading, sceneReady, runtimeLoadProgress],
  () => {
    emitRuntimeState()
  },
  { immediate: true },
)

// Swap rim geometry when wheel option changes
watch(
  () => props.selectedOptions.wheels,
  (wheelId) => {
    if (!sceneReady.value || !heroRoot) return
    swapRimMeshes(wheelId ?? null)
    renderScene()
  },
)

onBeforeUnmount(() => {
  mountAborted = true
  stopAnimation()
  stopPointerDrag()
  hostRef.value?.removeEventListener('wheel', handleWheelZoom)
  hostRef.value?.removeEventListener('pointerdown', startPointerDrag)
  window.removeEventListener('resize', handleWindowResize)
  motionQuery?.removeEventListener('change', syncReducedMotionPreference)
  renderer?.dispose()
  pmremGenerator?.dispose()
  environmentMap?.dispose()
  environmentSource?.dispose()
  scene?.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) {
      return
    }

    object.geometry.dispose()

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      material.dispose()
    }
  })

  renderer = null
  scene = null
  camera = null
  heroRoot = null
  heroBaseSize = null
  heroBaseCenter = null
  heroBaseMinY = 0
  body = null
  canopy = null
  trim = null
  wireframe = null
  glowRing = null
  wheelMeshes = []
  rimNodes = []
  currentSwappedRims = []
  hiddenRimMeshes = []
  tireMeshSet = new Set()
  packWheelTemplates.clear()
  environmentMap = null
  environmentSource = null
  pmremGenerator = null
  loadingManager = null
  motionQuery = null
  runtimeLoading.value = false
  runtimeLoadProgress.value = 0
  sceneReady.value = false
})
</script>

<template>
  <div
    v-if="!webglSupported"
    class="showroom-canvas-placeholder showroom-canvas-placeholder-fallback"
    role="img"
    :aria-label="t('labs_showroom.runtime.no_webgl_title')"
  >
    <div class="showroom-canvas-content">
      <div class="showroom-canvas-dot" aria-hidden="true" />
      <p class="showroom-canvas-title">{{ t('labs_showroom.runtime.no_webgl_title') }}</p>
      <p class="showroom-canvas-copy">{{ t('labs_showroom.runtime.no_webgl_copy') }}</p>
    </div>
  </div>

  <div v-else ref="host" class="showroom-canvas-placeholder" aria-label="3D runtime showroom">
    <canvas ref="canvas" class="showroom-canvas-surface" />

    <div v-if="runtimeLoading" class="showroom-canvas-loading" aria-live="polite">
      <div class="showroom-canvas-loading-card">
        <p class="showroom-canvas-loading-label">{{ t('common.loading') }}</p>
        <p class="showroom-canvas-loading-value">{{ runtimeLoadingLabel }}</p>
      </div>
    </div>

    <div v-if="!immersive" class="showroom-canvas-content">
      <div class="showroom-canvas-dot" aria-hidden="true" />
      <div class="showroom-canvas-badges">
        <p v-if="reducedMotionPreferred" class="showroom-canvas-status">
          {{ t('labs_showroom.runtime.reduced_motion_badge') }}
        </p>
        <p class="showroom-canvas-status showroom-canvas-status-secondary">
          {{ qualityBadgeLabel }}
        </p>
      </div>
      <template>
        <p class="showroom-canvas-title">{{ runtimeTitle }}</p>
        <p class="showroom-canvas-copy">
          {{ runtimeCopy }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.showroom-canvas-placeholder {
  position: relative;
  min-height: 18rem;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--ui-border) 74%, white 26%);
  border-radius: 1rem;
  background:
    radial-gradient(circle at top, rgba(196, 151, 87, 0.28), transparent 38%),
    linear-gradient(180deg, rgba(8, 10, 14, 0.98), rgba(13, 18, 24, 0.92));
}

.showroom-canvas-surface {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.showroom-canvas-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(7, 10, 14, 0.24), rgba(7, 10, 14, 0.72));
  backdrop-filter: blur(10px);
}

.showroom-canvas-loading-card {
  display: grid;
  gap: 0.45rem;
  min-width: 10rem;
  padding: 1rem 1.1rem;
  border: 1px solid color-mix(in oklab, var(--ui-border) 70%, white 30%);
  border-radius: 1rem;
  background: rgba(6, 9, 13, 0.78);
  text-align: center;
}

.showroom-canvas-loading-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.68);
}

.showroom-canvas-loading-value {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.96);
}

.showroom-canvas-content {
  position: relative;
  display: grid;
  min-height: 18rem;
  align-content: start;
  gap: 0.85rem;
  padding: 1.5rem;
}

.showroom-canvas-placeholder-fallback {
  background:
    radial-gradient(circle at top, rgba(196, 151, 87, 0.2), transparent 36%),
    linear-gradient(180deg, rgba(20, 24, 31, 0.98), rgba(12, 16, 22, 0.94));
}

.showroom-canvas-status {
  width: fit-content;
  padding: 0.32rem 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.06);
}

.showroom-canvas-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.showroom-canvas-status-secondary {
  border-color: rgba(196, 151, 87, 0.24);
  color: rgba(255, 242, 223, 0.84);
  background: rgba(196, 151, 87, 0.12);
}

.showroom-canvas-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: #c49757;
  box-shadow: 0 0 0 0.5rem rgba(196, 151, 87, 0.12);
}

.showroom-canvas-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.showroom-canvas-copy {
  max-width: 34rem;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.72);
}
</style>
