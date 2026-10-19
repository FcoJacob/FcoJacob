import * as THREE from 'three'
import { ALLEY_HALF_WIDTH, ALLEY_LENGTH, type AlleyShop } from './catalog'
import type { AlleyBuildingLibrary, AlleyBuildingName, AlleyPropLibrary } from './assets'
import { createItemObject } from './items'
import { createRandom, createSignTexture, createWindowTexture, type AlleyTextureSet } from './textures'

/**
 * Builds the outdoor alley: crooked timber houses, lit windows, shopfronts,
 * lanterns, sky and ambient motes. Everything is static except the bits
 * returned in `animated` which the runtime ticks every frame.
 */

export interface AlleyWorld {
  group: THREE.Group
  /** Per-frame animation hook (sign swing, lantern flicker, motes). */
  update(elapsed: number, dt: number): void
  /** Disables half the lantern lights on constrained devices. */
  setLightBudget(level: 'full' | 'reduced'): void
  /** Swaps procedural stand-ins for the Blender props once the GLB has loaded. */
  applyProps(library: AlleyPropLibrary): void
  /** Replaces the procedural filler houses with the village buildings. */
  applyBuildings(library: AlleyBuildingLibrary): void
  dispose(): void
}

interface Segment {
  zStart: number
  zEnd: number
  shop: AlleyShop | null
}

const BUILDING_DEPTH = 5
const ROW_X = ALLEY_HALF_WIDTH

function planSegments(side: 'left' | 'right', shops: AlleyShop[], random: () => number) {
  const sideShops = shops
    .filter((shop) => shop.side === side)
    .sort((a, b) => b.z - a.z)
  const segments: Segment[] = []
  const end = -(ALLEY_LENGTH + 2)
  let cursor = 5
  let shopIndex = 0

  while (cursor > end) {
    const nextShop = sideShops[shopIndex]
    if (nextShop && nextShop.z + 4 >= cursor - 9.5) {
      const gap = cursor - (nextShop.z + 4)
      if (gap > 1.6) {
        segments.push({ zStart: cursor, zEnd: nextShop.z + 4, shop: null })
      }
      segments.push({ zStart: nextShop.z + 4, zEnd: nextShop.z - 4, shop: nextShop })
      cursor = nextShop.z - 4
      shopIndex += 1
      continue
    }
    const length = 5.5 + random() * 3.2
    const zEnd = Math.max(end, cursor - length)
    segments.push({ zStart: cursor, zEnd, shop: null })
    cursor = zEnd
  }

  return segments
}

export function createAlleyWorld(
  shops: AlleyShop[],
  textures: AlleyTextureSet,
  quality: 'high' | 'medium' | 'low',
): AlleyWorld {
  const group = new THREE.Group()
  group.name = 'alley-world'
  const random = createRandom(2026)
  const disposables: Array<{ dispose(): void }> = []
  const lanternLights: THREE.PointLight[] = []
  const lanternCores: THREE.MeshBasicMaterial[] = []
  const signs: Array<{ pivot: THREE.Group; phase: number }> = []
  // Registries used by applyProps() to swap primitives for Blender models.
  const lanternRegistry: Array<{
    lantern: THREE.Group
    shellParts: THREE.Object3D[]
    wallMounted: boolean
  }> = []
  const postRegistry: Array<{ post: THREE.Group; parts: THREE.Object3D[]; lantern: THREE.Group }> = []
  const streetPropRegistry: Array<{ parts: THREE.Object3D[]; kind: 'barrel' | 'crate'; x: number; z: number; yaw: number }> = []
  const storefrontRegistry: Array<{ front: THREE.Group; shop: AlleyShop; doorX: number }> = []
  const gateRegistry: { gate: THREE.Group | null; portal: THREE.Mesh | null; halo: THREE.Sprite | null } = {
    gate: null,
    portal: null,
    halo: null,
  }
  const extraLights: THREE.PointLight[] = []
  const fillerRegistry: Array<{
    building: THREE.Group
    side: -1 | 1
    zStart: number
    zEnd: number
    windowStart: number
    windowEnd: number
  }> = []
  let propsApplied = false
  let buildingsApplied = false
  const windowTexture = createWindowTexture()
  disposables.push(windowTexture)

  // ── Materials shared across the street ──────────────────────────────────
  const slateMaterial = new THREE.MeshStandardMaterial({ color: '#2a2d3a', roughness: 0.85 })
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: '#1c1b1f',
    roughness: 0.55,
    metalness: 0.7,
  })
  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    map: textures.darkWood,
    roughness: 0.7,
  })
  const woodMaterial = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: 0.75 })
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#9fb6c8',
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.1,
    envMapIntensity: 0.3,
    depthWrite: false,
  })
  const displayInteriorMaterial = new THREE.MeshStandardMaterial({
    color: '#6b503a',
    roughness: 0.9,
    side: THREE.BackSide,
  })
  disposables.push(
    slateMaterial,
    ironMaterial,
    darkWoodMaterial,
    woodMaterial,
    glassMaterial,
    displayInteriorMaterial,
  )
  /** Plaster tiles per building so the timber framing scales with the facade. */
  function createPlasterMaterial(length: number, height: number) {
    const base = textures.plaster[Math.floor(random() * textures.plaster.length)] ?? textures.plaster[0]
    if (!base) {
      return new THREE.MeshStandardMaterial({ color: '#7d6f63', roughness: 0.92 })
    }
    const texture = base.clone()
    texture.repeat.set(Math.max(1, Math.round(length / 3.8)), Math.max(1, Math.round(height / 3.4)))
    texture.needsUpdate = true
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92 })
    disposables.push(texture, material)
    return material
  }

  // ── Ground ──────────────────────────────────────────────────────────────
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: textures.cobblestone,
    color: '#cfc9c4',
    roughness: 0.58,
    metalness: 0.06,
    envMapIntensity: 0.45,
  })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(ROW_X * 2 + 2, ALLEY_LENGTH + 30), groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, 0, -(ALLEY_LENGTH + 30) / 2 + 8)
  group.add(ground)
  disposables.push(ground.geometry, groundMaterial)

  // Kerb stones along the facades.
  const kerbGeometry = new THREE.BoxGeometry(0.4, 0.12, ALLEY_LENGTH + 10)
  disposables.push(kerbGeometry)
  for (const sign of [-1, 1]) {
    const kerb = new THREE.Mesh(kerbGeometry, slateMaterial)
    kerb.position.set(sign * (ROW_X - 0.2), 0.06, -(ALLEY_LENGTH + 10) / 2 + 5)
    group.add(kerb)
  }

  // ── Buildings ───────────────────────────────────────────────────────────
  const windowGeometry = new THREE.PlaneGeometry(0.58, 0.82)
  disposables.push(windowGeometry)
  const windowMaterial = new THREE.MeshBasicMaterial({ map: windowTexture, toneMapped: false })
  disposables.push(windowMaterial)
  const windowMatrices: THREE.Matrix4[] = []
  const windowColors: THREE.Color[] = []
  const windowPalette = ['#ffb763', '#ffd08a', '#ffc072', '#9cc7ff', '#ffdba5', '#ff9f52']

  const roofGeometry = new THREE.ConeGeometry(1, 1, 4, 1)
  roofGeometry.rotateY(Math.PI / 4)
  roofGeometry.translate(0, 0.5, 0)
  disposables.push(roofGeometry)
  const chimneyGeometry = new THREE.BoxGeometry(0.5, 1.1, 0.5)
  disposables.push(chimneyGeometry)
  const beamGeometry = new THREE.BoxGeometry(0.16, 0.16, 1)
  disposables.push(beamGeometry)

  const tmpMatrix = new THREE.Matrix4()
  const tmpPosition = new THREE.Vector3()
  const tmpQuaternion = new THREE.Quaternion()
  const tmpScale = new THREE.Vector3(1, 1, 1)
  const tmpEuler = new THREE.Euler()

  function addWindows(
    side: -1 | 1,
    faceX: number,
    zStart: number,
    zEnd: number,
    yFrom: number,
    yTo: number,
    density: number,
  ) {
    const length = zStart - zEnd
    const columns = Math.max(1, Math.floor(length / 1.5))
    const rows = Math.max(1, Math.floor((yTo - yFrom) / 1.5))
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (random() > density) {
          continue
        }
        const z = zStart - (column + 0.5) * (length / columns) + (random() - 0.5) * 0.2
        const y = yFrom + (row + 0.5) * ((yTo - yFrom) / rows) + (random() - 0.5) * 0.15
        tmpPosition.set(faceX + side * -0.02, y, z)
        tmpEuler.set(0, side === -1 ? Math.PI / 2 : -Math.PI / 2, 0)
        tmpQuaternion.setFromEuler(tmpEuler)
        tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
        windowMatrices.push(tmpMatrix.clone())
        const paletteIndex = Math.floor(random() * windowPalette.length)
        const color = new THREE.Color(windowPalette[paletteIndex] ?? '#ffb763')
        color.multiplyScalar(0.55 + random() * 0.75)
        windowColors.push(color)
      }
    }
  }

  function addBuilding(side: -1 | 1, segment: Segment) {
    const length = segment.zStart - segment.zEnd
    const zCenter = (segment.zStart + segment.zEnd) / 2
    const height = segment.shop ? 8.2 : 6.8 + random() * 3
    const lowerHeight = 3.6
    const lean = (random() - 0.5) * 0.045
    const jetty = 0.3 + random() * 0.25
    const plaster = createPlasterMaterial(length, height)

    const building = new THREE.Group()
    building.position.set(side * (ROW_X + BUILDING_DEPTH / 2), 0, zCenter)
    building.rotation.z = side * lean
    building.rotation.x = (random() - 0.5) * 0.012
    group.add(building)

    if (!segment.shop) {
      const lowerGeometry = new THREE.BoxGeometry(BUILDING_DEPTH, lowerHeight, length)
      const lower = new THREE.Mesh(lowerGeometry, plaster)
      lower.position.y = lowerHeight / 2
      building.add(lower)
      disposables.push(lowerGeometry)
    }

    const upperGeometry = new THREE.BoxGeometry(BUILDING_DEPTH + jetty, height - lowerHeight, length)
    const upper = new THREE.Mesh(upperGeometry, plaster)
    upper.position.set(side * -jetty * 0.5, lowerHeight + (height - lowerHeight) / 2, 0)
    building.add(upper)
    disposables.push(upperGeometry)

    // Jetty beams under the overhang.
    const beamCount = Math.max(2, Math.floor(length / 1.3))
    for (let i = 0; i < beamCount; i += 1) {
      const beam = new THREE.Mesh(beamGeometry, darkWoodMaterial)
      beam.scale.z = 0.7
      beam.rotation.y = Math.PI / 2
      beam.position.set(
        side * (-BUILDING_DEPTH / 2 - jetty + 0.35),
        lowerHeight - 0.08,
        -length / 2 + (i + 0.5) * (length / beamCount),
      )
      building.add(beam)
    }

    const roof = new THREE.Mesh(roofGeometry, slateMaterial)
    const roofHeight = 2.2 + random() * 1.6
    roof.scale.set((BUILDING_DEPTH + jetty + 0.6) / Math.SQRT2, roofHeight, (length + 0.6) / Math.SQRT2)
    roof.position.set(side * -jetty * 0.5, height, 0)
    building.add(roof)

    if (random() > 0.35) {
      const chimney = new THREE.Mesh(chimneyGeometry, slateMaterial)
      chimney.position.set(side * (random() - 0.5) * 1.5, height + roofHeight * 0.55, (random() - 0.5) * length * 0.5)
      building.add(chimney)
    }

    const faceX = side * ROW_X
    const windowStart = windowMatrices.length
    addWindows(side, faceX - side * jetty, segment.zStart - 0.4, segment.zEnd + 0.4, lowerHeight + 0.5, height - 0.6, 0.62)
    if (!segment.shop) {
      addWindows(side, faceX, segment.zStart - 0.5, segment.zEnd + 0.5, 0.9, lowerHeight - 0.4, 0.35)
      fillerRegistry.push({
        building,
        side,
        zStart: segment.zStart,
        zEnd: segment.zEnd,
        windowStart,
        windowEnd: windowMatrices.length,
      })
    } else {
      addStorefront(side, segment.shop, faceX, lowerHeight)
    }
  }

  // ── Storefronts ─────────────────────────────────────────────────────────
  function addStorefront(side: -1 | 1, shop: AlleyShop, faceX: number, lowerHeight: number) {
    const front = new THREE.Group()
    front.position.set(faceX, 0, shop.z)
    // Local +z of the storefront points into the alley.
    front.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2
    group.add(front)

    // Ground floor built in four pieces so the display window is a real
    // opening instead of a pane glued onto a solid wall.
    const windowLeft = -2.45
    const windowRight = 1.25
    const windowBottom = 0.9
    const windowTop = 3.15
    const wallPieces: Array<[number, number, number, number]> = [
      // [xCenter, width, yCenter, height]
      [(-4 + windowLeft) / 2, windowLeft + 4, lowerHeight / 2, lowerHeight],
      [(windowRight + 4) / 2, 4 - windowRight, lowerHeight / 2, lowerHeight],
      [(windowLeft + windowRight) / 2, windowRight - windowLeft, (windowTop + lowerHeight) / 2, lowerHeight - windowTop],
      [(windowLeft + windowRight) / 2, windowRight - windowLeft, windowBottom / 2, windowBottom],
    ]
    for (const [xCenter, width, yCenter, height] of wallPieces) {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(width, height, BUILDING_DEPTH), darkWoodMaterial)
      piece.position.set(xCenter, yCenter, -BUILDING_DEPTH / 2)
      front.add(piece)
      disposables.push(piece.geometry)
    }

    const accent = new THREE.Color(shop.accent)
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.6,
      emissive: accent.clone().multiplyScalar(0.25),
    })
    const glowMaterial = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(1.6) })
    disposables.push(accentMaterial, glowMaterial)

    // Display box recessed into the facade.
    const displayWidth = 3.4
    const displayHeight = 2.1
    const displayDepth = 1.3
    const displayBox = new THREE.Mesh(
      new THREE.BoxGeometry(displayWidth, displayHeight, displayDepth),
      displayInteriorMaterial,
    )
    displayBox.position.set(-0.6, 0.9 + displayHeight / 2, -displayDepth / 2 + 0.02)
    front.add(displayBox)
    disposables.push(displayBox.geometry)

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(displayWidth + 0.3, displayHeight + 0.3, 0.14),
      darkWoodMaterial,
    )
    frame.position.set(-0.6, 0.9 + displayHeight / 2, 0.02)
    front.add(frame)
    disposables.push(frame.geometry)

    // Unlit warm back panel so the window reads as a glowing shop interior from any angle.
    const backPanelMaterial = new THREE.MeshBasicMaterial({
      color: accent.clone().lerp(new THREE.Color('#8f6a46'), 0.65).multiplyScalar(0.9),
    })
    disposables.push(backPanelMaterial)
    const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(displayWidth - 0.08, displayHeight - 0.08), backPanelMaterial)
    backPanel.position.set(-0.6, 0.9 + displayHeight / 2, -displayDepth + 0.05)
    front.add(backPanel)
    disposables.push(backPanel.geometry)

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(displayWidth - 0.1, displayHeight - 0.1), glassMaterial)
    glass.position.set(-0.6, 0.9 + displayHeight / 2, 0.1)
    front.add(glass)
    disposables.push(glass.geometry)

    // Mullions on the big window.
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, displayHeight, 0.05), darkWoodMaterial)
    mullionV.position.set(-0.6, 0.9 + displayHeight / 2, 0.1)
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(displayWidth, 0.06, 0.05), darkWoodMaterial)
    mullionH.position.set(-0.6, 0.9 + displayHeight * 0.62, 0.1)
    front.add(mullionV, mullionH)
    disposables.push(mullionV.geometry, mullionH.geometry)

    // Sill.
    const sill = new THREE.Mesh(new THREE.BoxGeometry(displayWidth + 0.5, 0.12, 0.35), darkWoodMaterial)
    sill.position.set(-0.6, 0.86, 0.1)
    front.add(sill)
    disposables.push(sill.geometry)

    // Window light + props.
    const displayLight = new THREE.PointLight(accent.clone().lerp(new THREE.Color('#ffd9a0'), 0.5), 10, 7, 2)
    displayLight.position.set(-0.6, 2.6, -0.5)
    front.add(displayLight)

    const props = new THREE.Group()
    props.position.set(-0.6, 1.05, -0.6)
    front.add(props)
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(displayWidth - 0.4, 0.08, 0.9), woodMaterial)
    shelf.position.y = -0.1
    props.add(shelf)
    disposables.push(shelf.geometry)

    if (shop.slot === 'head') {
      shop.items.slice(0, 2).forEach((item, index) => {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.7, 10), darkWoodMaterial)
        stand.position.set(-0.7 + index * 1.4, 0.35, 0)
        props.add(stand)
        disposables.push(stand.geometry)
        const hat = createItemObject(item)
        hat.position.set(-0.7 + index * 1.4, 0.72, 0)
        hat.rotation.y = random() * Math.PI
        props.add(hat)
      })
    } else if (shop.slot === 'cloak') {
      shop.items.slice(0, 2).forEach((item, index) => {
        const dummy = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 1.1, 14), displayInteriorMaterial)
        dummy.position.set(-0.75 + index * 1.5, 0.55, 0)
        props.add(dummy)
        disposables.push(dummy.geometry)
        const cloak = createItemObject(item)
        cloak.position.set(-0.75 + index * 1.5, 1.2, 0)
        cloak.rotation.y = Math.PI + (random() - 0.5) * 0.6
        props.add(cloak)
      })
    } else {
      // Wand boxes stacked in a pyramid plus one wand hovering on a cushion.
      const boxGeometry = new THREE.BoxGeometry(0.46, 0.07, 0.1)
      disposables.push(boxGeometry)
      const boxCount = 18
      const boxes = new THREE.InstancedMesh(boxGeometry, woodMaterial, boxCount)
      let boxIndex = 0
      for (let row = 0; row < 4 && boxIndex < boxCount; row += 1) {
        for (let column = 0; column < 6 - row && boxIndex < boxCount; column += 1) {
          tmpPosition.set(-1.1 + column * 0.5 + row * 0.25, row * 0.075, -0.1 + (random() - 0.5) * 0.08)
          tmpEuler.set(0, (random() - 0.5) * 0.25, 0)
          tmpQuaternion.setFromEuler(tmpEuler)
          tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
          boxes.setMatrixAt(boxIndex, tmpMatrix)
          boxIndex += 1
        }
      }
      boxes.count = boxIndex
      boxes.instanceMatrix.needsUpdate = true
      props.add(boxes)

      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.4), accentMaterial)
      cushion.position.set(1.0, 0, 0.1)
      props.add(cushion)
      disposables.push(cushion.geometry)
      const heroItem = shop.items[0]
      if (heroItem) {
        const wand = createItemObject(heroItem)
        wand.position.set(0.8, 0.2, 0.1)
        wand.rotation.z = Math.PI / 2 - 0.3
        wand.rotation.y = 0.5
        props.add(wand)
      }
    }

    storefrontRegistry.push({ front, shop, doorX: 1.85 })

    // Door + transom.
    const doorX = 1.85
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.5, 0.16), darkWoodMaterial)
    doorFrame.position.set(doorX, 1.25, 0.02)
    front.add(doorFrame)
    disposables.push(doorFrame.geometry)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.08), woodMaterial)
    door.position.set(doorX, 1.05, 0.08)
    front.add(door)
    disposables.push(door.geometry)
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), ironMaterial)
    knob.position.set(doorX + 0.32, 1.05, 0.14)
    front.add(knob)
    disposables.push(knob.geometry)
    const transom = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), glowMaterial)
    transom.position.set(doorX, 2.3, 0.13)
    front.add(transom)
    disposables.push(transom.geometry)

    // Awning.
    const awning = new THREE.Mesh(new THREE.BoxGeometry(displayWidth + 0.6, 0.05, 1.1), accentMaterial)
    awning.position.set(-0.6, 3.25, 0.55)
    awning.rotation.x = 0.35
    front.add(awning)
    disposables.push(awning.geometry)

    // Hanging sign.
    const signTexture = createSignTexture(shop.signText, shop.accent)
    const signMaterial = new THREE.MeshStandardMaterial({
      map: signTexture,
      emissiveMap: signTexture,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.42,
      roughness: 0.8,
    })
    disposables.push(signTexture, signMaterial)
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8), ironMaterial)
    bracket.rotation.x = Math.PI / 2
    bracket.position.set(-2.4, 3.95, 0.7)
    front.add(bracket)
    disposables.push(bracket.geometry)
    const signPivot = new THREE.Group()
    signPivot.position.set(-2.4, 3.95, 1.2)
    front.add(signPivot)
    const chainGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6)
    disposables.push(chainGeometry)
    for (const offset of [-0.5, 0.5]) {
      const chain = new THREE.Mesh(chainGeometry, ironMaterial)
      chain.position.set(offset, -0.18, 0)
      signPivot.add(chain)
    }
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.06), signMaterial)
    plank.position.y = -0.72
    signPivot.add(plank)
    disposables.push(plank.geometry)
    signs.push({ pivot: signPivot, phase: random() * Math.PI * 2 })

    // Wall lantern by the door.
    addLantern(front, new THREE.Vector3(doorX + 0.75, 2.5, 0.3), accent.clone().lerp(new THREE.Color('#ffb66a'), 0.6), 4, true)
  }

  // ── Lanterns ────────────────────────────────────────────────────────────
  const lanternCageGeometry = new THREE.BoxGeometry(0.34, 0.42, 0.34)
  const lanternCoreGeometry = new THREE.SphereGeometry(0.1, 12, 10)
  const lanternCapGeometry = new THREE.ConeGeometry(0.28, 0.22, 4)
  disposables.push(lanternCageGeometry, lanternCoreGeometry, lanternCapGeometry)
  const cageMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1e',
    roughness: 0.5,
    metalness: 0.7,
    transparent: true,
    opacity: 0.55,
  })
  disposables.push(cageMaterial)
  const haloMaterial = new THREE.SpriteMaterial({
    map: textures.glow,
    color: '#ffb066',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.55,
  })
  disposables.push(haloMaterial)

  function addLantern(
    parent: THREE.Object3D,
    position: THREE.Vector3,
    color: THREE.Color,
    intensity: number,
    wallMounted: boolean,
  ) {
    const lantern = new THREE.Group()
    lantern.position.copy(position)
    parent.add(lantern)

    const cage = new THREE.Mesh(lanternCageGeometry, cageMaterial)
    lantern.add(cage)
    const cap = new THREE.Mesh(lanternCapGeometry, ironMaterial)
    cap.position.y = 0.3
    cap.rotation.y = Math.PI / 4
    lantern.add(cap)
    const coreMaterial = new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.5) })
    disposables.push(coreMaterial)
    const core = new THREE.Mesh(lanternCoreGeometry, coreMaterial)
    lantern.add(core)
    lanternCores.push(coreMaterial)
    const shellParts: THREE.Object3D[] = [cage, cap, core]

    const halo = new THREE.Sprite(haloMaterial.clone())
    ;(halo.material as THREE.SpriteMaterial).color.copy(color)
    halo.scale.setScalar(wallMounted ? 1.4 : 2.1)
    lantern.add(halo)
    disposables.push(halo.material)

    const light = new THREE.PointLight(color, intensity, wallMounted ? 7 : 13, 2)
    light.position.y = -0.05
    lantern.add(light)
    lanternLights.push(light)

    if (wallMounted) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), ironMaterial)
      arm.position.set(0, 0.1, -0.25)
      lantern.add(arm)
      disposables.push(arm.geometry)
    }
    lanternRegistry.push({ lantern, shellParts, wallMounted })
    return lantern
  }

  const postGeometry = new THREE.CylinderGeometry(0.05, 0.07, 3.3, 10)
  const postBaseGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 12)
  disposables.push(postGeometry, postBaseGeometry)
  const lanternSpacing = 9
  for (let i = 0; i < Math.floor(ALLEY_LENGTH / lanternSpacing) + 1; i += 1) {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1
    const z = 1 - i * lanternSpacing
    const post = new THREE.Group()
    post.position.set(side * (ROW_X - 0.9), 0, z)
    post.rotation.z = side * (random() - 0.5) * 0.03
    group.add(post)
    const pole = new THREE.Mesh(postGeometry, ironMaterial)
    pole.position.y = 1.65
    post.add(pole)
    const base = new THREE.Mesh(postBaseGeometry, ironMaterial)
    base.position.y = 0.12
    post.add(base)
    const lantern = addLantern(post, new THREE.Vector3(0, 3.4, 0), new THREE.Color('#ffb066'), 9, false)
    postRegistry.push({ post, parts: [pole, base], lantern })
  }

  // ── Street props: barrels and crates ────────────────────────────────────
  const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.26, 0.72, 14)
  const bandGeometry = new THREE.TorusGeometry(0.3, 0.02, 6, 20)
  const crateGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6)
  disposables.push(barrelGeometry, bandGeometry, crateGeometry)
  const shopZones = shops.map((shop) => ({ side: shop.side === 'left' ? -1 : 1, z: shop.z }))
  for (let i = 0; i < 14; i += 1) {
    const side: -1 | 1 = random() > 0.5 ? -1 : 1
    const z = -2 - random() * (ALLEY_LENGTH - 6)
    const blocked = shopZones.some((zone) => zone.side === side && Math.abs(zone.z - z) < 4.6)
    if (blocked) {
      continue
    }
    const x = side * (ROW_X - 0.55)
    if (random() > 0.45) {
      const barrel = new THREE.Mesh(barrelGeometry, woodMaterial)
      barrel.position.set(x, 0.36, z)
      barrel.rotation.y = random() * Math.PI
      group.add(barrel)
      const parts: THREE.Object3D[] = [barrel]
      for (const y of [0.15, 0.55]) {
        const band = new THREE.Mesh(bandGeometry, ironMaterial)
        band.rotation.x = Math.PI / 2
        band.position.set(x, y, z)
        group.add(band)
        parts.push(band)
      }
      streetPropRegistry.push({ parts, kind: 'barrel', x, z, yaw: barrel.rotation.y })
    } else {
      const crate = new THREE.Mesh(crateGeometry, darkWoodMaterial)
      crate.position.set(x, 0.3, z)
      crate.rotation.y = (random() - 0.5) * 0.6
      group.add(crate)
      const parts: THREE.Object3D[] = [crate]
      if (random() > 0.5) {
        const top = new THREE.Mesh(crateGeometry, woodMaterial)
        top.scale.setScalar(0.8)
        top.position.set(x + (random() - 0.5) * 0.1, 0.84, z)
        top.rotation.y = (random() - 0.5) * 0.9
        group.add(top)
        parts.push(top)
      }
      streetPropRegistry.push({ parts, kind: 'crate', x, z, yaw: crate.rotation.y })
    }
  }

  // ── Far gate ────────────────────────────────────────────────────────────
  const gateZ = -(ALLEY_LENGTH + 2)
  const gate = new THREE.Group()
  gate.position.set(0, 0, gateZ)
  group.add(gate)
  const pillarGeometry = new THREE.BoxGeometry(1.2, 7.5, 1.2)
  disposables.push(pillarGeometry)
  for (const x of [-3.4, 3.4]) {
    const pillar = new THREE.Mesh(pillarGeometry, slateMaterial)
    pillar.position.set(x, 3.75, 0)
    gate.add(pillar)
  }
  const archGeometry = new THREE.TorusGeometry(3.4, 0.6, 10, 32, Math.PI)
  disposables.push(archGeometry)
  const arch = new THREE.Mesh(archGeometry, slateMaterial)
  arch.position.y = 7.4
  gate.add(arch)
  const portalMaterial = new THREE.MeshBasicMaterial({
    color: '#3f5bd6',
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  disposables.push(portalMaterial)
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 7.4), portalMaterial)
  portal.position.set(0, 3.7, -0.6)
  gate.add(portal)
  disposables.push(portal.geometry)
  const portalHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textures.glow,
      color: '#5b74ff',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    }),
  )
  portalHalo.scale.set(11, 11, 1)
  portalHalo.position.set(0, 4, -0.3)
  gate.add(portalHalo)
  disposables.push(portalHalo.material)
  gateRegistry.gate = gate
  gateRegistry.portal = portal
  gateRegistry.halo = portalHalo
  addLantern(gate, new THREE.Vector3(-3.4, 5.6, 0.8), new THREE.Color('#9db2ff'), 6, true)
  addLantern(gate, new THREE.Vector3(3.4, 5.6, 0.8), new THREE.Color('#9db2ff'), 6, true)

  // ── Sky ─────────────────────────────────────────────────────────────────
  const starCount = quality === 'low' ? 500 : 1100
  const starPositions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i += 1) {
    const theta = random() * Math.PI * 2
    const phi = random() * Math.PI * 0.42
    const radius = 150
    starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    starPositions[i * 3 + 1] = Math.cos(phi) * radius * 0.6 + 6
    starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 30
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starMaterial = new THREE.PointsMaterial({
    color: '#dfe6ff',
    size: 1.1,
    map: textures.glow,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.8,
  })
  const stars = new THREE.Points(starGeometry, starMaterial)
  stars.frustumCulled = false
  group.add(stars)
  disposables.push(starGeometry, starMaterial)

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 24, 18),
    new THREE.MeshBasicMaterial({ color: '#e8ecff' }),
  )
  moon.position.set(26, 42, -120)
  group.add(moon)
  disposables.push(moon.geometry, moon.material as THREE.Material)
  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textures.glow,
      color: '#aab7ff',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.8,
    }),
  )
  moonHalo.scale.set(34, 34, 1)
  moonHalo.position.copy(moon.position)
  group.add(moonHalo)
  disposables.push(moonHalo.material)

  // ── Drifting motes ──────────────────────────────────────────────────────
  const moteCount = quality === 'low' ? 90 : 220
  const motePositions = new Float32Array(moteCount * 3)
  const moteBase = new Float32Array(moteCount * 3)
  const moteSeed = new Float32Array(moteCount)
  for (let i = 0; i < moteCount; i += 1) {
    const x = (random() - 0.5) * ROW_X * 2
    const y = 0.4 + random() * 4.2
    const z = 4 - random() * (ALLEY_LENGTH + 6)
    moteBase[i * 3] = x
    moteBase[i * 3 + 1] = y
    moteBase[i * 3 + 2] = z
    motePositions[i * 3] = x
    motePositions[i * 3 + 1] = y
    motePositions[i * 3 + 2] = z
    moteSeed[i] = random() * Math.PI * 2
  }
  const moteGeometry = new THREE.BufferGeometry()
  const moteAttribute = new THREE.BufferAttribute(motePositions, 3)
  moteAttribute.setUsage(THREE.DynamicDrawUsage)
  moteGeometry.setAttribute('position', moteAttribute)
  const moteMaterial = new THREE.PointsMaterial({
    color: '#ffd796',
    size: 0.07,
    map: textures.glow,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.7,
  })
  const motes = new THREE.Points(moteGeometry, moteMaterial)
  motes.frustumCulled = false
  group.add(motes)
  disposables.push(moteGeometry, moteMaterial)

  // ── Build both rows ─────────────────────────────────────────────────────
  planSegments('left', shops, random).forEach((segment) => addBuilding(-1, segment))
  planSegments('right', shops, random).forEach((segment) => addBuilding(1, segment))

  // Instanced windows, built once every segment has registered its panes.
  const windowsFinal = new THREE.InstancedMesh(windowGeometry, windowMaterial, Math.max(1, windowMatrices.length))
  windowMatrices.forEach((matrix, index) => {
    windowsFinal.setMatrixAt(index, matrix)
    windowsFinal.setColorAt(index, windowColors[index] ?? new THREE.Color('#ffb763'))
  })
  windowsFinal.count = windowMatrices.length
  windowsFinal.instanceMatrix.needsUpdate = true
  if (windowsFinal.instanceColor) {
    windowsFinal.instanceColor.needsUpdate = true
  }
  group.add(windowsFinal)

  const baseIntensities = lanternLights.map((light) => light.intensity)

  function update(elapsed: number, dt: number) {
    void dt
    for (const sign of signs) {
      sign.pivot.rotation.x = Math.sin(elapsed * 0.9 + sign.phase) * 0.06
    }
    lanternLights.forEach((light, index) => {
      if (!light.visible) {
        return
      }
      const base = baseIntensities[index] ?? 1
      const flicker = 0.9 + Math.sin(elapsed * 9 + index * 1.7) * 0.05 + Math.sin(elapsed * 23 + index) * 0.04
      light.intensity = base * flicker
    })
    for (let i = 0; i < moteCount; i += 1) {
      const seed = moteSeed[i] ?? 0
      motePositions[i * 3] = (moteBase[i * 3] ?? 0) + Math.sin(elapsed * 0.35 + seed) * 0.5
      motePositions[i * 3 + 1] = (moteBase[i * 3 + 1] ?? 0) + Math.sin(elapsed * 0.6 + seed * 1.3) * 0.35
      motePositions[i * 3 + 2] = (moteBase[i * 3 + 2] ?? 0) + Math.cos(elapsed * 0.28 + seed) * 0.5
    }
    moteAttribute.needsUpdate = true
  }

  function applyProps(library: AlleyPropLibrary) {
    if (propsApplied) {
      return
    }
    propsApplied = true

    // Street lamps: Blender post replaces pole + base, lantern light moves to its head.
    if (library.has('streetlamp')) {
      const lampHeight = library.size('streetlamp').y
      const scale = 3.1 / Math.max(0.1, lampHeight)
      for (const entry of postRegistry) {
        entry.parts.forEach((part) => (part.visible = false))
        const lamp = library.create('streetlamp')
        if (!lamp) {
          continue
        }
        lamp.scale.setScalar(scale)
        lamp.rotation.y = entry.post.position.x < 0 ? Math.PI / 2 : -Math.PI / 2
        entry.post.add(lamp)
        entry.lantern.position.y = lampHeight * scale * 0.9
        const registered = lanternRegistry.find((item) => item.lantern === entry.lantern)
        registered?.shellParts.forEach((part) => (part.visible = false))
      }
    }

    // Wall lanterns: swap the primitive cage for the hanging lantern model.
    if (library.has('hanging_lantern')) {
      const lanternHeight = library.size('hanging_lantern').y
      for (const entry of lanternRegistry) {
        if (!entry.wallMounted) {
          continue
        }
        entry.shellParts.forEach((part) => (part.visible = false))
        const model = library.create('hanging_lantern')
        if (!model) {
          continue
        }
        const scale = 0.72 / Math.max(0.1, lanternHeight)
        model.scale.setScalar(scale)
        model.position.set(0, -0.42, 0)
        entry.lantern.add(model)
      }
    }

    // Barrels and crates.
    for (const entry of streetPropRegistry) {
      const model = library.create(entry.kind)
      if (!model) {
        continue
      }
      entry.parts.forEach((part) => (part.visible = false))
      model.position.set(entry.x, 0, entry.z)
      model.rotation.y = entry.yaw
      group.add(model)
      if (entry.kind === 'crate' && entry.parts.length > 1) {
        const top = library.create('crate')
        if (top) {
          top.scale.setScalar(0.82)
          top.position.set(entry.x + 0.05, library.size('crate').y, entry.z)
          top.rotation.y = entry.yaw + 0.5
          group.add(top)
        }
      }
    }

    // Hand carts parked where no shopfront lives.
    if (library.has('hand_cart')) {
      const cartSpots: Array<{ side: -1 | 1; z: number }> = [
        { side: 1, z: -8 },
        { side: -1, z: -37 },
      ]
      for (const spot of cartSpots) {
        const blocked = shopZones.some((zone) => zone.side === spot.side && Math.abs(zone.z - spot.z) < 5)
        if (blocked) {
          continue
        }
        const cart = library.create('hand_cart')
        if (!cart) {
          continue
        }
        cart.position.set(spot.side * (ROW_X - 1.05), 0, spot.z)
        cart.rotation.y = spot.side === 1 ? Math.PI * 0.08 : Math.PI * 0.92
        group.add(cart)
      }
    }

    // Shopfront dressing: chalkboard by the window, cauldron by the wand shop door.
    for (const entry of storefrontRegistry) {
      const board = library.create('chalkboard')
      if (board) {
        board.scale.setScalar(0.85)
        board.position.set(-3.1, 0, 0.8)
        board.rotation.y = 0.35
        entry.front.add(board)
      }
      if (entry.shop.slot === 'wand') {
        const cauldron = library.create('cauldron')
        if (cauldron) {
          cauldron.scale.setScalar(0.85)
          cauldron.position.set(entry.doorX + 1.55, 0, 0.75)
          entry.front.add(cauldron)
          const brew = new THREE.PointLight('#6cff9a', 2.4, 4, 2)
          brew.position.set(entry.doorX + 1.55, 0.9, 0.75)
          entry.front.add(brew)
          extraLights.push(brew)
        }
      }
    }

    // Far gate: the rune portal replaces the flat glowing plane.
    if (library.has('magic_portal') && gateRegistry.gate && gateRegistry.portal && gateRegistry.halo) {
      const portal = library.create('magic_portal')
      if (portal) {
        const size = library.size('magic_portal')
        const scale = 6.0 / Math.max(0.1, size.x)
        portal.scale.setScalar(scale)
        portal.position.set(0, 0, 0.9)
        gateRegistry.gate.add(portal)
        gateRegistry.portal.visible = false
        ;(gateRegistry.halo.material as THREE.SpriteMaterial).opacity = 0.35
        gateRegistry.halo.position.y = 3.2
        const glow = new THREE.PointLight('#8a6cff', 10, 16, 2)
        glow.position.set(0, 3, 2.2)
        gateRegistry.gate.add(glow)
        extraLights.push(glow)
      }
    }
  }

  const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0)

  /**
   * Packs village houses along every filler segment: pick a building that
   * fits the remaining length, face it toward the street, nudge its scale so
   * the row closes without gaps, and park the procedural box + its windows.
   */
  function applyBuildings(library: AlleyBuildingLibrary) {
    if (buildingsApplied) {
      return
    }
    const names = library.names()
    if (names.length === 0) {
      return
    }
    buildingsApplied = true
    const BASE_SCALE = 2.05
    const gapMaterial = new THREE.MeshStandardMaterial({ color: '#2a2320', roughness: 0.95 })
    disposables.push(gapMaterial)
    let lastName: AlleyBuildingName | null = null
    let fillerIndex = 0

    for (const entry of fillerRegistry) {
      fillerIndex += 1
      // Keep some of the lit timber houses so the street stays glowing and varied.
      if (fillerIndex % 3 === 0) {
        continue
      }
      entry.building.visible = false
      for (let i = entry.windowStart; i < entry.windowEnd; i += 1) {
        windowsFinal.setMatrixAt(i, zeroMatrix)
      }
      let cursor = entry.zStart
      const end = entry.zEnd
      let guard = 0
      while (cursor - end > 1.2 && guard < 8) {
        guard += 1
        const remaining = cursor - end
        // Candidates whose scaled width fits the remaining stretch (allow 18% squash).
        const candidates = names.filter((name) => {
          const width = library.size(name).x * BASE_SCALE
          return name !== lastName && width <= remaining * 1.18
        })
        const pool = candidates.length > 0 ? candidates : names.filter((name) => name !== lastName)
        const name = pool[Math.floor(random() * pool.length)] ?? names[0]
        if (!name) {
          break
        }
        const size = library.size(name)
        let scale = BASE_SCALE * (0.94 + random() * 0.12)
        let width = size.x * scale
        if (width > remaining) {
          scale *= remaining / width
          width = remaining
        }
        const model = library.create(name)
        if (!model) {
          break
        }
        const depth = size.z * scale
        model.scale.setScalar(scale)
        model.rotation.y = entry.side === -1 ? Math.PI / 2 : -Math.PI / 2
        model.position.set(entry.side * (ROW_X + depth / 2 - 0.05), 0, cursor - width / 2)
        group.add(model)
        // Warm porch light so the house reads at night.
        const porch = new THREE.PointLight('#ffb66a', 3.2, 7, 2)
        porch.position.set(entry.side * (ROW_X - 0.7), 2.3, cursor - width / 2)
        group.add(porch)
        extraLights.push(porch)
        // Dark party wall behind the house so there is never a hole between rows.
        const wallHeight = size.y * scale
        const gapWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, wallHeight, width + 0.2), gapMaterial)
        gapWall.position.set(entry.side * (ROW_X + 0.3), wallHeight / 2, cursor - width / 2)
        group.add(gapWall)
        disposables.push(gapWall.geometry)
        cursor -= width + 0.12
        lastName = name
      }
      if (cursor - end > 0.05) {
        const filler = new THREE.Mesh(new THREE.BoxGeometry(BUILDING_DEPTH, 6.5, cursor - end), darkWoodMaterial)
        filler.position.set(entry.side * (ROW_X + BUILDING_DEPTH / 2), 3.25, (cursor + end) / 2)
        group.add(filler)
        disposables.push(filler.geometry)
      }
    }
    windowsFinal.instanceMatrix.needsUpdate = true
  }

  function setLightBudget(level: 'full' | 'reduced') {
    lanternLights.forEach((light, index) => {
      light.visible = level === 'full' || index % 2 === 0
    })
  }

  function dispose() {
    disposables.forEach((entry) => entry.dispose())
    windowsFinal.dispose()
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name.startsWith('item:')) {
        child.geometry.dispose()
      }
    })
  }

  return { group, update, setLightBudget, applyProps, applyBuildings, dispose }
}
