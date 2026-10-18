import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import {
  ALLEY_HALF_WIDTH,
  ALLEY_LENGTH,
  SHOP_PROMPT_RANGE,
  findAlleyItem,
  type AlleyItem,
  type AlleyShop,
  type AlleySlot,
} from './catalog'
import { loadAlleyProps, type AlleyPropLibrary } from './assets'
import { createAvatar } from './avatar'
import { createShopInterior, type ShopInterior } from './interiors'
import { createItemObject } from './items'
import { createSparkSystem } from './spells'
import { createAlleyTextures, disposeAlleyTextures } from './textures'
import { createAlleyWorld } from './world'

/**
 * Owns the Three.js scene for the Wizard Alley lab. The Vue shell only talks
 * to this through the returned API and the `onState` / `onEvent` callbacks,
 * so the UI never touches Three objects directly.
 *
 * Controls are game-like: arrows / WASD move the apprentice freely along and
 * across the alley, Shift runs, E / Space / Enter interact, Escape leaves a
 * shop. Phones get the same model through `setMoveInput` (virtual joystick).
 */

export type AlleyMode = 'alley' | 'entering' | 'shop' | 'leaving'
export type AlleyQuality = 'high' | 'medium' | 'low'

export interface AlleyRuntimeState {
  mode: AlleyMode
  /** 0 at the entrance, 1 at the far gate. */
  progress: number
  nearShopId: string | null
  activeShopId: string | null
  worn: Record<AlleySlot, string | null>
  ready: boolean
  quality: AlleyQuality
}

export type AlleyRuntimeEvent =
  | { type: 'equipped'; itemId: string }
  | { type: 'unequipped'; slot: AlleySlot }
  | { type: 'entered'; shopId: string }
  | { type: 'left' }

export interface AlleyRuntimeOptions {
  canvas: HTMLCanvasElement
  host: HTMLElement
  shops: AlleyShop[]
  reducedMotion: boolean
  onState: (state: AlleyRuntimeState) => void
  onEvent: (event: AlleyRuntimeEvent) => void
}

export interface AlleyRuntime {
  /** Analog movement from a virtual joystick: x = strafe (-1..1), y = forward (-1..1). */
  setMoveInput(x: number, y: number): void
  /** Primary action: enter the nearby shop, or cycle the shop's items inside. */
  interact(): void
  requestEnter(): void
  exitShop(): void
  /** Tries an item on; trying the item already worn takes it off. */
  toggleItem(itemId: string): void
  setReducedMotion(value: boolean): void
  dispose(): void
}

const WALK_SPEED = 2.9
const RUN_MULTIPLIER = 1.65
const MIN_Z = -(ALLEY_LENGTH - 2)
const MAX_Z = 1
const MAX_X = ALLEY_HALF_WIDTH - 1.25
const TRANSITION_SWAP = 0.55
const TRANSITION_END = 1.1

export function resolveAlleyQuality(): AlleyQuality {
  if (typeof window === 'undefined') {
    return 'medium'
  }
  const dpr = window.devicePixelRatio || 1
  const width = window.innerWidth
  const cores = navigator.hardwareConcurrency ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (coarse && (width < 900 || cores <= 4)) {
    return 'low'
  }
  if (width < 1100 || cores <= 4 || dpr > 2.2) {
    return 'medium'
  }
  return 'high'
}

export function detectWebGLSupport() {
  if (typeof document === 'undefined') {
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function createAlleyRuntime(options: AlleyRuntimeOptions): AlleyRuntime {
  const { canvas, host, shops } = options
  let reducedMotion = options.reducedMotion
  const quality = resolveAlleyQuality()

  // ── Renderer & post ─────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality !== 'low',
    powerPreference: 'high-performance',
    alpha: false,
  })
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1),
  )
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#06070f')
  const fog = new THREE.FogExp2('#090a16', 0.03)
  scene.fog = fog

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 320)
  camera.position.set(0, 2.1, 3.8)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = environment
  scene.environmentIntensity = 0.22

  const hemisphere = new THREE.HemisphereLight('#2a3366', '#2b1d12', 0.55)
  scene.add(hemisphere)
  const moonLight = new THREE.DirectionalLight('#8fa4ff', 0.45)
  moonLight.position.set(18, 40, -60)
  scene.add(moonLight)

  let composer: EffectComposer | null = null
  let bloomPass: UnrealBloomPass | null = null
  if (quality !== 'low') {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), quality === 'high' ? 0.62 : 0.5, 0.55, 0.78)
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())
  }

  // ── World ───────────────────────────────────────────────────────────────
  const textures = createAlleyTextures()
  const world = createAlleyWorld(shops, textures, quality)
  world.setLightBudget(quality === 'low' ? 'reduced' : 'full')
  scene.add(world.group)

  const interiors: ShopInterior[] = shops.map((shop) => {
    const interior = createShopInterior(shop, textures)
    scene.add(interior.group)
    return interior
  })

  const avatar = createAvatar(textures.contactShadow)
  scene.add(avatar.group)

  const sparks = createSparkSystem(textures.glow)
  scene.add(sparks.points)

  // Blender props arrive asynchronously; the world renders with primitives
  // meanwhile and swaps them in once the GLB is parsed.
  let propLibrary: AlleyPropLibrary | null = null
  let assetsSettled = false
  loadAlleyProps()
    .then((library) => {
      if (disposed) {
        library.dispose()
        return
      }
      propLibrary = library
      world.applyProps(library)
      interiors.forEach((interior) => interior.applyProps(library))
    })
    .catch((error: unknown) => {
      console.warn('[wizard-alley] props failed to load, keeping primitives', error)
    })
    .finally(() => {
      assetsSettled = true
      publishState(true)
    })

  // ── State ───────────────────────────────────────────────────────────────
  let disposed = false
  let mode: AlleyMode = 'alley'
  const position = new THREE.Vector2(0, 0) // x across the alley, y along z
  const velocity = new THREE.Vector2(0, 0)
  const keyInput = { forward: false, back: false, left: false, right: false, run: false }
  const stickInput = new THREE.Vector2(0, 0)
  const moveInput = new THREE.Vector2(0, 0)
  let wheelImpulse = 0
  let lookX = 0
  let smoothedLookX = 0
  let transitionTime = 0
  let activeInterior: ShopInterior | null = null
  let nearShop: AlleyShop | null = null
  let nearShopDistance = SHOP_PROMPT_RANGE
  let shopYaw = 0
  let shopYawTarget = 0
  let trickleAccumulator = 0
  let elapsed = 0
  let frameId = 0
  let currentFov = camera.fov
  const wornItems: Record<AlleySlot, AlleyItem | null> = { head: null, cloak: null, wand: null }
  const cameraTarget = new THREE.Vector3(0, 1.15, -3)
  const cameraPosition = new THREE.Vector3().copy(camera.position)
  const desiredPosition = new THREE.Vector3()
  const desiredTarget = new THREE.Vector3()
  const scratch = new THREE.Vector3()
  const shopCameraPosition = new THREE.Vector3()
  const shopCameraTarget = new THREE.Vector3()
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  let lastState: AlleyRuntimeState | null = null

  function snapshot(): AlleyRuntimeState {
    return {
      mode,
      progress: THREE.MathUtils.clamp(-position.y / (ALLEY_LENGTH - 2), 0, 1),
      nearShopId: nearShop?.id ?? null,
      activeShopId: activeInterior?.shop.id ?? null,
      worn: {
        head: wornItems.head?.id ?? null,
        cloak: wornItems.cloak?.id ?? null,
        wand: wornItems.wand?.id ?? null,
      },
      ready: assetsSettled,
      quality,
    }
  }

  function publishState(force = false) {
    const next = snapshot()
    const previous = lastState
    const unchanged =
      previous &&
      previous.mode === next.mode &&
      Math.abs(previous.progress - next.progress) < 0.004 &&
      previous.nearShopId === next.nearShopId &&
      previous.activeShopId === next.activeShopId &&
      previous.worn.head === next.worn.head &&
      previous.worn.cloak === next.worn.cloak &&
      previous.worn.wand === next.worn.wand &&
      previous.ready === next.ready
    if (unchanged && !force) {
      return
    }
    lastState = next
    options.onState(next)
  }

  function isPortrait() {
    return camera.aspect < 0.9
  }

  // ── Input ───────────────────────────────────────────────────────────────
  let dragPointerId: number | null = null
  let dragStartX = 0
  let dragStartY = 0
  let dragLastX = 0
  let dragDistance = 0

  function handleWheel(event: WheelEvent) {
    event.preventDefault()
    if (mode !== 'alley') {
      return
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1
    wheelImpulse = THREE.MathUtils.clamp(wheelImpulse + event.deltaY * unit * 0.045, -12, 12)
  }

  function isTypingTarget(target: EventTarget | null) {
    const element = target as HTMLElement | null
    return Boolean(
      element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable),
    )
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (isTypingTarget(event.target)) {
      return
    }
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyInput.forward = true
        event.preventDefault()
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        keyInput.back = true
        event.preventDefault()
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyInput.left = true
        if (mode === 'shop') {
          shopYawTarget += 0.5
        }
        event.preventDefault()
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyInput.right = true
        if (mode === 'shop') {
          shopYawTarget -= 0.5
        }
        event.preventDefault()
        break
      case 'Shift':
        keyInput.run = true
        break
      case ' ':
      case 'Enter':
      case 'e':
      case 'E':
        if (!event.repeat) {
          interact()
        }
        event.preventDefault()
        break
      case 'Escape':
      case 'q':
      case 'Q':
        if (mode === 'shop') {
          exitShop()
        }
        break
      default:
        break
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyInput.forward = false
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        keyInput.back = false
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyInput.left = false
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyInput.right = false
        break
      case 'Shift':
        keyInput.run = false
        break
      default:
        break
    }
  }

  function handleWindowBlur() {
    keyInput.forward = false
    keyInput.back = false
    keyInput.left = false
    keyInput.right = false
    keyInput.run = false
  }

  function handlePointerMove(event: PointerEvent) {
    const rect = host.getBoundingClientRect()
    if (event.pointerType === 'mouse' && rect.width > 0 && dragPointerId === null) {
      lookX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1)
    }
    if (dragPointerId !== event.pointerId) {
      return
    }
    const dx = event.clientX - dragLastX
    dragLastX = event.clientX
    dragDistance += Math.abs(dx) + Math.abs(event.clientY - dragStartY)
    if (mode === 'shop') {
      shopYawTarget += dx * 0.012
    } else if (event.pointerType !== 'mouse') {
      // Touch drag on the scene pans the look-around offset.
      lookX = THREE.MathUtils.clamp(lookX + dx * 0.004, -1, 1)
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return
    }
    dragPointerId = event.pointerId
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragLastX = event.clientX
    dragDistance = 0
    host.setPointerCapture?.(event.pointerId)
  }

  function handlePointerUp(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) {
      return
    }
    dragPointerId = null
    host.releasePointerCapture?.(event.pointerId)
    const moved = Math.abs(event.clientX - dragStartX) + Math.abs(event.clientY - dragStartY)
    if (moved < 6 && dragDistance < 10) {
      handleTap(event)
    }
  }

  function handleTap(event: PointerEvent) {
    if (mode !== 'shop' || !activeInterior) {
      return
    }
    const rect = host.getBoundingClientRect()
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    const targets = activeInterior.displays.map((display) => display.object)
    const hits = raycaster.intersectObjects(targets, true)
    const itemId = hits[0]?.object.userData.itemId as string | undefined
    if (itemId) {
      toggleItem(itemId)
    }
  }

  function handlePointerLeave() {
    if (dragPointerId === null) {
      lookX = 0
    }
  }

  host.addEventListener('wheel', handleWheel, { passive: false })
  host.addEventListener('pointermove', handlePointerMove)
  host.addEventListener('pointerdown', handlePointerDown)
  host.addEventListener('pointerup', handlePointerUp)
  host.addEventListener('pointercancel', handlePointerUp)
  host.addEventListener('pointerleave', handlePointerLeave)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleWindowBlur)

  // ── Resize ──────────────────────────────────────────────────────────────
  function resize() {
    const width = Math.max(1, host.clientWidth)
    const height = Math.max(1, host.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    composer?.setSize(width, height)
    bloomPass?.setSize(width, height)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()

  function resolveFov() {
    if (!isPortrait()) {
      return 52
    }
    return mode === 'shop' || mode === 'entering' ? 86 : 62
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  function setMoveInput(x: number, y: number) {
    stickInput.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1))
  }

  function interact() {
    if (mode === 'alley') {
      requestEnter()
      return
    }
    if (mode === 'shop' && activeInterior) {
      // Cycle through the shop's items with the action key.
      const items = activeInterior.shop.items
      const slot = activeInterior.shop.slot
      const currentId = wornItems[slot]?.id ?? null
      const currentIndex = items.findIndex((item) => item.id === currentId)
      const next = items[(currentIndex + 1) % items.length]
      if (next) {
        toggleItem(next.id)
      }
    }
  }

  function requestEnter() {
    if (mode !== 'alley' || !nearShop) {
      return
    }
    const interior = interiors.find((entry) => entry.shop.id === nearShop?.id)
    if (!interior) {
      return
    }
    activeInterior = interior
    mode = 'entering'
    transitionTime = reducedMotion ? TRANSITION_SWAP : 0
    velocity.set(0, 0)
    wheelImpulse = 0
    avatar.setTargetYaw(nearShop.side === 'left' ? -Math.PI / 2 : Math.PI / 2)
    publishState(true)
  }

  function exitShop() {
    if (mode !== 'shop' || !activeInterior) {
      return
    }
    mode = 'leaving'
    transitionTime = reducedMotion ? TRANSITION_SWAP : 0
    publishState(true)
  }

  function equipWorldPosition(slot: AlleySlot, target: THREE.Vector3) {
    if (slot === 'wand') {
      return avatar.getWandTip(target)
    }
    return avatar.slots[slot].getWorldPosition(target)
  }

  function toggleItem(itemId: string) {
    const item = findAlleyItem(itemId)
    if (!item) {
      return
    }
    const current = wornItems[item.slot]
    if (current?.id === item.id) {
      avatar.equip(item.slot, null)
      wornItems[item.slot] = null
      options.onEvent({ type: 'unequipped', slot: item.slot })
      publishState(true)
      return
    }
    avatar.equip(item.slot, createItemObject(item))
    wornItems[item.slot] = item
    avatar.group.updateMatrixWorld(true)
    equipWorldPosition(item.slot, scratch)
    const isWand = item.slot === 'wand'
    if (!reducedMotion) {
      sparks.burst(scratch, item.spark, isWand ? 170 : 80)
    }
    sparks.flash(scratch, item.spark, isWand ? 9 : 4)
    options.onEvent({ type: 'equipped', itemId: item.id })
    publishState(true)
  }

  function setReducedMotion(value: boolean) {
    reducedMotion = value
  }

  // ── Frame loop ──────────────────────────────────────────────────────────
  const timer = new THREE.Timer()

  function updateAlley(dt: number) {
    // Compose the movement vector: keys + joystick + wheel impulse.
    moveInput.set(
      (keyInput.right ? 1 : 0) - (keyInput.left ? 1 : 0) + stickInput.x,
      (keyInput.forward ? 1 : 0) - (keyInput.back ? 1 : 0) + stickInput.y,
    )
    if (moveInput.lengthSq() > 1) {
      moveInput.normalize()
    }
    const speedLimit = WALK_SPEED * (keyInput.run ? RUN_MULTIPLIER : 1)
    // Forward input walks deeper into the alley (negative z).
    const targetVx = moveInput.x * speedLimit
    let targetVz = -moveInput.y * speedLimit
    if (Math.abs(wheelImpulse) > 0.01) {
      targetVz += -wheelImpulse
      wheelImpulse *= Math.max(0, 1 - dt * 3.5)
    } else {
      wheelImpulse = 0
    }
    const accel = reducedMotion ? 1 : Math.min(1, dt * 9)
    velocity.x += (targetVx - velocity.x) * accel
    velocity.y += (targetVz - velocity.y) * accel
    if (Math.abs(velocity.x) < 0.01) velocity.x = 0
    if (Math.abs(velocity.y) < 0.01) velocity.y = 0

    position.x = THREE.MathUtils.clamp(position.x + velocity.x * dt, -MAX_X, MAX_X)
    position.y = THREE.MathUtils.clamp(position.y + velocity.y * dt, MIN_Z, MAX_Z)
    avatar.group.position.set(position.x, 0, position.y)

    const speed = velocity.length()

    // Nearest storefront, measured to the facade centre on its side of the street.
    let closest: AlleyShop | null = null
    let closestDistance = SHOP_PROMPT_RANGE + 1.2
    for (const shop of shops) {
      const side = shop.side === 'left' ? -1 : 1
      const dx = side * (ALLEY_HALF_WIDTH - 0.6) - position.x
      const dz = shop.z - position.y
      const distance = Math.hypot(dx * 0.9, dz)
      if (distance < closestDistance) {
        closest = shop
        closestDistance = distance
      }
    }
    nearShop = closest
    nearShopDistance = closestDistance
    const shopSide = nearShop ? (nearShop.side === 'left' ? -1 : 1) : 0

    if (speed > 0.25) {
      avatar.setTargetYaw(Math.atan2(velocity.x, velocity.y))
    } else if (nearShop) {
      // Standing still by a shop: turn to look at the window.
      avatar.setTargetYaw(shopSide === -1 ? -Math.PI / 2 : Math.PI / 2)
    }
    avatar.update(dt, speed, elapsed, reducedMotion)

    smoothedLookX += (lookX - smoothedLookX) * (reducedMotion ? 1 : Math.min(1, dt * 4))
    const pullBack = Math.min(1.1, Math.abs(velocity.y) * 0.18)
    if (nearShop) {
      // Three-quarter framing: camera drifts to the opposite kerb and looks
      // across the avatar toward the storefront.
      const proximity = 1 - Math.min(1, nearShopDistance / (SHOP_PROMPT_RANGE + 1.2))
      const blend = (0.5 + proximity * 0.5) * (isPortrait() ? 0.22 : 1)
      desiredPosition.set(
        position.x * 0.5 - shopSide * 2.4 * blend + smoothedLookX * 0.5,
        2.0,
        position.y + 3.4 + pullBack,
      )
      desiredTarget.set(
        position.x * 0.5 + shopSide * 2.6 * blend + smoothedLookX * 0.8,
        1.5,
        nearShop.z - 1.2 * blend,
      )
    } else {
      desiredPosition.set(position.x * 0.6 + smoothedLookX * 0.9, 2.05, position.y + 3.7 + pullBack)
      desiredTarget.set(position.x * 0.8 + smoothedLookX * 1.7, 1.2, position.y - 3.6)
    }
    const cameraFollow = reducedMotion ? 1 : 1 - Math.exp(-dt * (nearShop ? 3 : 5))
    cameraPosition.lerp(desiredPosition, cameraFollow)
    cameraTarget.lerp(desiredTarget, cameraFollow)
  }

  /**
   * Shop framing adapts to portrait phones: the dock covers the lower half of
   * the screen, so the camera stays inside the room, widens its lens and aims
   * low to keep the avatar and the displays in the visible top half.
   */
  function resolveShopCamera(interior: ShopInterior) {
    shopCameraPosition.copy(interior.cameraPosition)
    shopCameraTarget.copy(interior.cameraTarget)
    if (isPortrait()) {
      shopCameraPosition.x += 0.75
      shopCameraPosition.y += 0.35
      shopCameraPosition.z -= 0.6
      shopCameraTarget.x += 0.75
      shopCameraTarget.y -= 0.4
    }
  }

  function updateShop(dt: number) {
    if (!activeInterior) {
      return
    }
    resolveShopCamera(activeInterior)
    shopYaw += (shopYawTarget - shopYaw) * (reducedMotion ? 1 : Math.min(1, dt * 6))
    avatar.setTargetYaw(shopYaw)
    avatar.update(dt, 0, elapsed, reducedMotion, wornItems.wand ? 'present' : 'walk')
    activeInterior.update(elapsed)
    const cameraFollow = reducedMotion ? 1 : 1 - Math.exp(-dt * 4)
    cameraPosition.lerp(shopCameraPosition, cameraFollow)
    cameraTarget.lerp(shopCameraTarget, cameraFollow)
  }

  function swapIntoShop() {
    if (!activeInterior) {
      return
    }
    activeInterior.setVisible(true)
    avatar.group.position.copy(activeInterior.standPoint)
    if (isPortrait()) {
      avatar.group.position.x += 1.2
      avatar.group.position.z += 0.35
    }
    shopYaw = 0.25
    shopYawTarget = 0.25
    avatar.setTargetYaw(shopYaw)
    avatar.group.rotation.y = shopYaw
    resolveShopCamera(activeInterior)
    cameraPosition.copy(shopCameraPosition)
    cameraTarget.copy(shopCameraTarget)
    fog.density = 0.012
  }

  function swapIntoAlley() {
    if (activeInterior) {
      activeInterior.setVisible(false)
      const side = activeInterior.shop.side === 'left' ? -1 : 1
      // Step back out onto the kerb in front of the shop, facing the street.
      position.set(side * (MAX_X - 0.4), activeInterior.shop.z)
      avatar.group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2
      avatar.setTargetYaw(avatar.group.rotation.y)
    }
    velocity.set(0, 0)
    avatar.group.position.set(position.x, 0, position.y)
    cameraPosition.set(position.x * 0.6, 2.05, position.y + 3.7)
    cameraTarget.set(position.x * 0.8, 1.2, position.y - 3.6)
    fog.density = 0.03
  }

  // Transitions run on wall-clock time so they stay in sync with the CSS fade
  // even when the GPU cannot hold a steady frame rate.
  function updateTransition(dt: number, realDt: number) {
    const before = transitionTime
    transitionTime += realDt
    if (before < TRANSITION_SWAP && transitionTime >= TRANSITION_SWAP) {
      if (mode === 'entering') {
        swapIntoShop()
      } else {
        swapIntoAlley()
      }
    }
    if (transitionTime >= TRANSITION_END) {
      if (mode === 'entering') {
        mode = 'shop'
        if (activeInterior) {
          options.onEvent({ type: 'entered', shopId: activeInterior.shop.id })
        }
      } else {
        mode = 'alley'
        activeInterior = null
        options.onEvent({ type: 'left' })
      }
      publishState(true)
    }
    avatar.update(dt, 0, elapsed, reducedMotion)
  }

  function tick() {
    if (disposed) {
      return
    }
    frameId = requestAnimationFrame(tick)
    timer.update()
    const realDt = timer.getDelta()
    const dt = Math.min(0.05, realDt)
    elapsed += dt

    if (mode === 'alley') {
      updateAlley(dt)
    } else if (mode === 'shop') {
      updateShop(dt)
    } else {
      updateTransition(dt, realDt)
    }

    world.update(elapsed, dt)
    sparks.update(dt)

    const wand = wornItems.wand
    if (wand && !reducedMotion) {
      trickleAccumulator += dt
      if (trickleAccumulator > 0.07) {
        trickleAccumulator = 0
        avatar.group.updateMatrixWorld(true)
        avatar.getWandTip(scratch)
        sparks.trickle(scratch, wand.spark, 1)
      }
    }

    const targetFov = resolveFov()
    if (Math.abs(targetFov - currentFov) > 0.05) {
      currentFov += (targetFov - currentFov) * (reducedMotion ? 1 : Math.min(1, dt * 5))
      camera.fov = currentFov
      camera.updateProjectionMatrix()
    }

    camera.position.copy(cameraPosition)
    camera.lookAt(cameraTarget)

    if (composer) {
      composer.render()
    } else {
      renderer.render(scene, camera)
    }

    publishState()
  }

  publishState(true)
  tick()

  function dispose() {
    disposed = true
    cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    host.removeEventListener('wheel', handleWheel)
    host.removeEventListener('pointermove', handlePointerMove)
    host.removeEventListener('pointerdown', handlePointerDown)
    host.removeEventListener('pointerup', handlePointerUp)
    host.removeEventListener('pointercancel', handlePointerUp)
    host.removeEventListener('pointerleave', handlePointerLeave)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', handleWindowBlur)

    world.dispose()
    interiors.forEach((interior) => interior.dispose())
    avatar.dispose()
    sparks.dispose()
    disposeAlleyTextures(textures)
    propLibrary?.dispose()
    propLibrary = null
    environment.dispose()
    pmrem.dispose()
    composer?.dispose()
    renderer.dispose()
  }

  return { setMoveInput, interact, requestEnter, exitShop, toggleItem, setReducedMotion, dispose }
}
