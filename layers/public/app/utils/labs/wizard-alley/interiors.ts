import * as THREE from 'three'
import { ALLEY_HALF_WIDTH, type AlleyItem, type AlleyShop } from './catalog'
import { createItemObject, disposeObject } from './items'
import { createRandom, type AlleyTextureSet } from './textures'

/**
 * Shop interiors live behind their storefront, hidden until the avatar walks
 * in. Each room exposes where the avatar stands, where the camera sits and
 * the floating display items the visitor can click to try on.
 */

export interface ShopDisplay {
  item: AlleyItem
  object: THREE.Group
  pivot: THREE.Group
  baseY: number
}

export interface ShopInterior {
  shop: AlleyShop
  group: THREE.Group
  displays: ShopDisplay[]
  standPoint: THREE.Vector3
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
  update(elapsed: number): void
  setVisible(visible: boolean): void
  dispose(): void
}

const ROOM_WIDTH = 7.4
const ROOM_HEIGHT = 4.2
const ROOM_DEPTH = 7

export function createShopInterior(shop: AlleyShop, textures: AlleyTextureSet): ShopInterior {
  const side = shop.side === 'left' ? -1 : 1
  const center = new THREE.Vector3(side * (ALLEY_HALF_WIDTH + ROOM_WIDTH / 2 + 0.2), 0, shop.z)
  const random = createRandom(shop.z * 31)
  const group = new THREE.Group()
  group.name = `interior:${shop.id}`
  group.position.copy(center)
  group.visible = false

  const disposables: Array<{ dispose(): void }> = []
  const accent = new THREE.Color(shop.accent)

  const wallMaterial = new THREE.MeshStandardMaterial({ map: textures.darkWood, roughness: 0.85 })
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: textures.wood,
    roughness: 0.55,
    metalness: 0.05,
    envMapIntensity: 0.6,
  })
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: '#1d1511', roughness: 0.95 })
  const brassMaterial = new THREE.MeshStandardMaterial({
    color: '#b8893a',
    roughness: 0.35,
    metalness: 0.8,
  })
  const accentMaterial = new THREE.MeshStandardMaterial({ color: accent.clone().multiplyScalar(0.32), roughness: 1 })
  const candleMaterial = new THREE.MeshBasicMaterial({ color: '#ffe2a8' })
  disposables.push(wallMaterial, floorMaterial, ceilingMaterial, brassMaterial, accentMaterial, candleMaterial)

  // Shell.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  group.add(floor)
  disposables.push(floor.geometry)

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), ceilingMaterial)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = ROOM_HEIGHT
  group.add(ceiling)
  disposables.push(ceiling.geometry)

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMaterial)
  backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2)
  group.add(backWall)
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMaterial)
  frontWall.position.set(0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2)
  frontWall.rotation.y = Math.PI
  group.add(frontWall)
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial)
  leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0)
  leftWall.rotation.y = Math.PI / 2
  group.add(leftWall)
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial)
  rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0)
  rightWall.rotation.y = -Math.PI / 2
  group.add(rightWall)
  disposables.push(backWall.geometry, frontWall.geometry, leftWall.geometry, rightWall.geometry)

  // Ceiling beams.
  const beamGeometry = new THREE.BoxGeometry(ROOM_WIDTH, 0.22, 0.22)
  disposables.push(beamGeometry)
  for (let i = 0; i < 4; i += 1) {
    const beam = new THREE.Mesh(beamGeometry, wallMaterial)
    beam.position.set(0, ROOM_HEIGHT - 0.11, -ROOM_DEPTH / 2 + (i + 0.5) * (ROOM_DEPTH / 4))
    group.add(beam)
  }

  // Rug.
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 40), accentMaterial)
  rug.rotation.x = -Math.PI / 2
  rug.position.set(-0.6, 0.01, 0.4)
  group.add(rug)
  disposables.push(rug.geometry)

  // Back shelves.
  const shelfGeometry = new THREE.BoxGeometry(ROOM_WIDTH - 0.6, 0.06, 0.42)
  disposables.push(shelfGeometry)
  const shelfHeights = [1.15, 1.85, 2.55, 3.25]
  for (const y of shelfHeights) {
    const shelf = new THREE.Mesh(shelfGeometry, wallMaterial)
    shelf.position.set(0, y, -ROOM_DEPTH / 2 + 0.25)
    group.add(shelf)
  }

  // Shelf stock per shop type.
  if (shop.slot === 'wand') {
    const boxGeometry = new THREE.BoxGeometry(0.44, 0.075, 0.11)
    disposables.push(boxGeometry)
    const boxMaterial = new THREE.MeshStandardMaterial({ roughness: 0.85 })
    disposables.push(boxMaterial)
    const perShelf = 14
    const stacks = 3
    const sideShelves = 2 * 4 * 8 * 2
    const total = shelfHeights.length * perShelf * stacks + sideShelves
    const boxes = new THREE.InstancedMesh(boxGeometry, boxMaterial, total)
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const scale = new THREE.Vector3(1, 1, 1)
    const color = new THREE.Color()
    const palette = ['#4a3528', '#5a4a3b', '#2e2a3a', '#6b4b36', '#3b3f52', '#6f5a40', '#54393a']
    let index = 0
    const place = (x: number, y: number, z: number, yaw: number) => {
      if (index >= total) {
        return
      }
      position.set(x, y, z)
      euler.set(0, yaw, (random() - 0.5) * 0.04)
      quaternion.setFromEuler(euler)
      matrix.compose(position, quaternion, scale)
      boxes.setMatrixAt(index, matrix)
      color.set(palette[Math.floor(random() * palette.length)] ?? '#4a3528')
      color.multiplyScalar(0.75 + random() * 0.5)
      boxes.setColorAt(index, color)
      index += 1
    }
    shelfHeights.forEach((shelfY) => {
      for (let column = 0; column < perShelf; column += 1) {
        for (let stack = 0; stack < stacks; stack += 1) {
          if (random() < 0.08) {
            continue
          }
          const x = -ROOM_WIDTH / 2 + 0.55 + column * ((ROOM_WIDTH - 1.1) / (perShelf - 1))
          place(
            x + (random() - 0.5) * 0.06,
            shelfY + 0.07 + stack * 0.08,
            -ROOM_DEPTH / 2 + 0.26 + (random() - 0.5) * 0.08,
            (random() - 0.5) * 0.3,
          )
        }
      }
    })
    // Side-wall shelves with boxes stacked end-on.
    const sideShelfGeometry = new THREE.BoxGeometry(0.42, 0.06, ROOM_DEPTH - 2.2)
    disposables.push(sideShelfGeometry)
    for (const wallSide of [-1, 1]) {
      for (let s = 0; s < 4; s += 1) {
        const y = 1.15 + s * 0.7
        const shelf = new THREE.Mesh(sideShelfGeometry, wallMaterial)
        shelf.position.set(wallSide * (ROOM_WIDTH / 2 - 0.22), y, -0.6)
        group.add(shelf)
        for (let column = 0; column < 8; column += 1) {
          for (let stack = 0; stack < 2; stack += 1) {
            if (random() < 0.12) {
              continue
            }
            place(
              wallSide * (ROOM_WIDTH / 2 - 0.24),
              y + 0.07 + stack * 0.08,
              -ROOM_DEPTH / 2 + 1.7 + column * 0.55,
              Math.PI / 2 + (random() - 0.5) * 0.25,
            )
          }
        }
      }
    }
    boxes.count = index
    boxes.instanceMatrix.needsUpdate = true
    if (boxes.instanceColor) {
      boxes.instanceColor.needsUpdate = true
    }
    group.add(boxes)
    disposables.push(boxes)
  } else if (shop.slot === 'head') {
    const standGeometry = new THREE.CylinderGeometry(0.025, 0.04, 0.5, 10)
    disposables.push(standGeometry)
    const palette = ['#2b2538', '#3d2b22', '#1e2a2e', '#4a2434', '#2f3a24', '#3a3a44']
    shelfHeights.slice(0, 3).forEach((shelfY) => {
      for (let column = 0; column < 7; column += 1) {
        const x = -ROOM_WIDTH / 2 + 0.7 + column * ((ROOM_WIDTH - 1.4) / 6)
        const stand = new THREE.Mesh(standGeometry, wallMaterial)
        stand.position.set(x, shelfY + 0.28, -ROOM_DEPTH / 2 + 0.26)
        group.add(stand)
        const filler: AlleyItem = {
          id: `filler-hat-${shelfY}-${column}`,
          slot: 'head',
          labelKey: '',
          descriptionKey: '',
          primary: palette[Math.floor(random() * palette.length)] ?? '#2b2538',
          accent: random() > 0.5 ? '#8c6a2f' : '#5a5a66',
          spark: '#ffffff',
          variant: random() > 0.6 ? 'crooked' : random() > 0.3 ? 'pointed' : 'wide',
        }
        const hat = createItemObject(filler)
        hat.scale.setScalar(0.85)
        hat.position.set(x, shelfY + 0.52, -ROOM_DEPTH / 2 + 0.26)
        hat.rotation.y = random() * Math.PI * 2
        group.add(hat)
      }
    })
  } else {
    // Cloak rails along the back wall.
    const railGeometry = new THREE.CylinderGeometry(0.02, 0.02, ROOM_WIDTH - 1, 10)
    railGeometry.rotateZ(Math.PI / 2)
    disposables.push(railGeometry)
    const palette = ['#1a1b24', '#3a1420', '#152a22', '#2a1f3a', '#3a2a14', '#1f2a3a']
    for (const railY of [2.35, 3.4]) {
      const rail = new THREE.Mesh(railGeometry, brassMaterial)
      rail.position.set(0, railY, -ROOM_DEPTH / 2 + 0.5)
      group.add(rail)
      for (let column = 0; column < 8; column += 1) {
        const x = -ROOM_WIDTH / 2 + 0.8 + column * ((ROOM_WIDTH - 1.6) / 7)
        const filler: AlleyItem = {
          id: `filler-cloak-${railY}-${column}`,
          slot: 'cloak',
          labelKey: '',
          descriptionKey: '',
          primary: palette[Math.floor(random() * palette.length)] ?? '#1a1b24',
          accent: '#b8893a',
          spark: '#ffffff',
          variant: random() > 0.7 ? 'trim' : 'plain',
        }
        const cloak = createItemObject(filler)
        cloak.scale.set(0.55, 0.8, 0.55)
        cloak.position.set(x, railY - 0.05, -ROOM_DEPTH / 2 + 0.5)
        cloak.rotation.y = Math.PI + (random() - 0.5) * 0.3
        group.add(cloak)
      }
    }
  }

  // Counter with a candle.
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.7), wallMaterial)
  counter.position.set(-2.2, 0.475, -2.2)
  group.add(counter)
  disposables.push(counter.geometry)
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 0.8), floorMaterial)
  counterTop.position.set(-2.2, 0.98, -2.2)
  group.add(counterTop)
  disposables.push(counterTop.geometry)
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.22, 10), candleMaterial)
  candle.position.set(-1.6, 1.12, -2.1)
  group.add(candle)
  disposables.push(candle.geometry)
  const candleLight = new THREE.PointLight('#ffb15c', 3.5, 5, 2)
  candleLight.position.set(-1.6, 1.3, -2.1)
  group.add(candleLight)

  // Hanging lantern + main light.
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), brassMaterial)
  chain.position.set(0, ROOM_HEIGHT - 0.5, 0)
  group.add(chain)
  disposables.push(chain.geometry)
  const lanternBody = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), brassMaterial)
  lanternBody.position.set(0, ROOM_HEIGHT - 1, 0)
  group.add(lanternBody)
  disposables.push(lanternBody.geometry)
  const lanternCore = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), candleMaterial)
  lanternCore.position.copy(lanternBody.position)
  group.add(lanternCore)
  disposables.push(lanternCore.geometry)
  const mainLight = new THREE.PointLight('#ffc78a', 14, 14, 2)
  mainLight.position.set(0, ROOM_HEIGHT - 1.1, 0.2)
  group.add(mainLight)
  const fillLight = new THREE.PointLight(accent.clone().lerp(new THREE.Color('#ffffff'), 0.4), 5, 10, 2)
  fillLight.position.set(1.6, 2.4, 2.6)
  group.add(fillLight)

  // Display pedestals.
  const displays: ShopDisplay[] = []
  const pedestalGeometry = new THREE.CylinderGeometry(0.3, 0.36, 1, 20)
  const ringGeometry = new THREE.TorusGeometry(0.3, 0.025, 8, 30)
  disposables.push(pedestalGeometry, ringGeometry)
  const haloMaterial = new THREE.SpriteMaterial({
    map: textures.glow,
    color: accent,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.45,
  })
  disposables.push(haloMaterial)

  const pedestalHeight = shop.slot === 'cloak' ? 0.25 : 0.9
  const floatHeight = shop.slot === 'cloak' ? 1.55 : shop.slot === 'wand' ? 1.25 : 1.25
  const slots: Array<[number, number]> = [
    [0.2, -0.4],
    [1.15, -1.1],
    [2.1, -0.4],
  ]
  shop.items.forEach((item, index) => {
    const slot = slots[index] ?? [0.5 + index, -0.5]
    const pedestal = new THREE.Mesh(pedestalGeometry, wallMaterial)
    pedestal.scale.y = pedestalHeight
    pedestal.position.set(slot[0], pedestalHeight / 2, slot[1])
    group.add(pedestal)
    const ring = new THREE.Mesh(ringGeometry, brassMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.set(slot[0], pedestalHeight + 0.01, slot[1])
    group.add(ring)

    const pivot = new THREE.Group()
    pivot.position.set(slot[0], floatHeight, slot[1])
    group.add(pivot)
    const object = createItemObject(item)
    if (item.slot === 'wand') {
      object.rotation.z = Math.PI / 2 - 0.35
      object.position.set(-0.12, 0, 0)
    }
    pivot.add(object)

    const halo = new THREE.Sprite(haloMaterial)
    halo.scale.setScalar(1.3)
    halo.position.set(slot[0], floatHeight - (item.slot === 'cloak' ? 0.6 : 0.05), slot[1])
    group.add(halo)

    displays.push({ item, object, pivot, baseY: floatHeight })
  })

  const standPoint = center.clone().add(new THREE.Vector3(-1.25, 0, 0.5))
  const cameraPosition = center.clone().add(new THREE.Vector3(0.15, 1.75, 3.9))
  const cameraTarget = center.clone().add(new THREE.Vector3(0.2, 1.2, -0.4))

  function update(elapsed: number) {
    displays.forEach((display, index) => {
      display.pivot.rotation.y = elapsed * 0.6 + index
      display.pivot.position.y = display.baseY + Math.sin(elapsed * 1.4 + index * 1.3) * 0.05
    })
    candleLight.intensity = 3.2 + Math.sin(elapsed * 11) * 0.3 + Math.sin(elapsed * 27) * 0.2
  }

  function setVisible(visible: boolean) {
    group.visible = visible
  }

  function dispose() {
    disposables.forEach((entry) => entry.dispose())
    displays.forEach((display) => disposeObject(display.object))
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name.startsWith('item:')) {
        disposeObject(child)
      }
    })
  }

  return { shop, group, displays, standPoint, cameraPosition, cameraTarget, update, setVisible, dispose }
}
