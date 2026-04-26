import { mkdir, writeFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

class NodeFileReader {
  constructor() {
    this.result = null
    this.onloadend = null
  }

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.()
    })
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      const base64 = Buffer.from(buffer).toString('base64')
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`
      this.onloadend?.()
    })
  }
}

globalThis.FileReader = NodeFileReader

const rootDir = new URL('../', import.meta.url)
const modelsDir = new URL('../public/labs/dealer-showroom/models/', import.meta.url)
const hdrDir = new URL('../public/labs/dealer-showroom/hdr/', import.meta.url)

function applyMatrix(geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))
  matrix.compose(new THREE.Vector3(...position), quaternion, new THREE.Vector3(...scale))
  geometry.applyMatrix4(matrix)
  return geometry
}

function mergeGeometries(geometries) {
  return BufferGeometryUtils.mergeGeometries(
    geometries.map((geometry) => geometry.toNonIndexed()),
    false,
  )
}

// ── Car proportions ──────────────────────────────────────────────────────────
// Ground y = -C_TIRE_R.  Wheel centers y = 0.
// Body SILL starts at y = C_SILL (above wheel center) so wheels poke cleanly below.
const C_TIRE_R = 0.36 // tire outer radius
const C_TUBE_R = 0.095 // tire tube cross-section radius
const C_TIRE_W = 0.22 // tire width in Z
const C_RIM_R = 0.24 // rim outer radius (inside tyre)

const C_WX_F = 1.28 // front axle X
const C_WX_R = -1.28 // rear axle X
const C_WZ = 0.86 // wheel center ±Z

const C_HW = 0.86 // body half-width (= wheel Z so tyre flush with body edge)
const C_SILL = 0.14 // body sill bottom Y  (floats above wheel centre at y=0)
const C_SHLDR = 0.54 // shoulder / door-top Y
const C_ROOF = 0.82 // roof top Y

// ── BODY ─────────────────────────────────────────────────────────────────────
function makeBodyGeometry() {
  const doorH = C_SHLDR - C_SILL // 0.40
  const doorCY = (C_SILL + C_SHLDR) / 2 // 0.34  centre of door slab

  return mergeGeometries([
    // ── Door slab — full-length lower body block ─────────────────────
    applyMatrix(new THREE.BoxGeometry(4.52, doorH, C_HW * 2), [0, doorCY, 0]),

    // ── Front nose cap ───────────────────────────────────────────────
    applyMatrix(new THREE.BoxGeometry(0.3, doorH + 0.06, C_HW * 2 - 0.18), [2.26, doorCY, 0]),

    // ── Rear bumper cap ──────────────────────────────────────────────
    applyMatrix(new THREE.BoxGeometry(0.28, doorH + 0.04, C_HW * 2 - 0.18), [-2.26, doorCY, 0]),

    // ── Hood — two flat sections sloping gently forward ───────────────
    // Inner panel (near firewall, almost flat)
    applyMatrix(
      new THREE.BoxGeometry(1.38, 0.07, C_HW * 2 - 0.04),
      [1.06, C_SHLDR + 0.06, 0],
      [0, 0, -0.04],
    ),
    // Outer panel (near nose, steeper slope)
    applyMatrix(
      new THREE.BoxGeometry(0.88, 0.07, C_HW * 2 - 0.08),
      [1.84, C_SHLDR - 0.04, 0],
      [0, 0, -0.2],
    ),

    // ── Greenhouse (cabin box) ────────────────────────────────────────
    applyMatrix(new THREE.BoxGeometry(2.08, C_ROOF - C_SHLDR, C_HW * 2 - 0.06), [
      -0.05,
      (C_SHLDR + C_ROOF) / 2,
      0,
    ]),

    // ── Rear deck — short fastback slope ─────────────────────────────
    applyMatrix(
      new THREE.BoxGeometry(0.92, 0.07, C_HW * 2 - 0.04),
      [-1.58, C_SHLDR + 0.03, 0],
      [0, 0, 0.06],
    ),

    // ── Fender bulge over each wheel (raised body panel) ─────────────
    // These sit on top of the door slab at shoulder height, slightly outside body edge.
    applyMatrix(new THREE.BoxGeometry(0.78, 0.06, 0.12), [C_WX_F, C_SHLDR + 0.03, C_HW + 0.06]),
    applyMatrix(new THREE.BoxGeometry(0.78, 0.06, 0.12), [C_WX_F, C_SHLDR + 0.03, -(C_HW + 0.06)]),
    applyMatrix(new THREE.BoxGeometry(0.78, 0.06, 0.12), [C_WX_R, C_SHLDR + 0.03, C_HW + 0.06]),
    applyMatrix(new THREE.BoxGeometry(0.78, 0.06, 0.12), [C_WX_R, C_SHLDR + 0.03, -(C_HW + 0.06)]),
  ])
}

// ── GLASS ────────────────────────────────────────────────────────────────────
function makeGlassGeometry() {
  const glassH = (C_ROOF - C_SHLDR) * 0.86 // panel height inside greenhouse
  const glassCY = (C_SHLDR + C_ROOF) / 2 // vertical centre

  return mergeGeometries([
    // Windshield — thin slab, gently raked (≈ 26°)
    applyMatrix(
      new THREE.BoxGeometry(0.06, glassH, C_HW * 2 - 0.26),
      [0.92, glassCY, 0],
      [0, 0, -0.46],
    ),

    // Rear window — same rake, opposite direction
    applyMatrix(
      new THREE.BoxGeometry(0.06, glassH, C_HW * 2 - 0.28),
      [-0.98, glassCY, 0],
      [0, 0, 0.46],
    ),

    // Side glass — flat vertical panels
    applyMatrix(new THREE.BoxGeometry(1.48, glassH * 0.86, 0.04), [-0.03, glassCY, C_HW - 0.03]),
    applyMatrix(new THREE.BoxGeometry(1.48, glassH * 0.86, 0.04), [-0.03, glassCY, -(C_HW - 0.03)]),
  ])
}

// ── TRIM ─────────────────────────────────────────────────────────────────────
function makeTrimGeometry() {
  return mergeGeometries([
    // Side skirt left  — runs between the wheel openings
    applyMatrix(new THREE.BoxGeometry(2.5, 0.09, 0.06), [0, C_SILL + 0.045, C_HW + 0.01]),
    // Side skirt right
    applyMatrix(new THREE.BoxGeometry(2.5, 0.09, 0.06), [0, C_SILL + 0.045, -(C_HW + 0.01)]),

    // Front headlight strip
    applyMatrix(new THREE.BoxGeometry(0.06, 0.06, C_HW * 2 - 0.24), [2.31, 0.38, 0]),
    // Rear taillight strip
    applyMatrix(new THREE.BoxGeometry(0.06, 0.07, C_HW * 2 - 0.22), [-2.31, 0.38, 0]),

    // Belt line left (thin chrome edge along shoulder)
    applyMatrix(new THREE.BoxGeometry(4.1, 0.04, 0.04), [0, C_SHLDR + 0.01, C_HW]),
    // Belt line right
    applyMatrix(new THREE.BoxGeometry(4.1, 0.04, 0.04), [0, C_SHLDR + 0.01, -C_HW]),

    // Front splitter (low aero element under nose)
    applyMatrix(new THREE.BoxGeometry(0.1, 0.05, C_HW * 2 - 0.28), [2.36, C_SILL - 0.02, 0]),
    // Rear diffuser
    applyMatrix(new THREE.BoxGeometry(0.1, 0.05, C_HW * 2 - 0.26), [-2.36, C_SILL - 0.02, 0]),
  ])
}

// ── WHEEL ────────────────────────────────────────────────────────────────────
function makeWheelGeometry() {
  // The car's lateral axis is Z.  Wheels rotate around Z.
  // TorusGeometry default ring lies in XY plane, axis along Z → upright wheel ✓
  // CylinderGeometry default axis is Y → rotate [PI/2, 0, 0] to align axis with Z ✓

  const parts = [
    // Tyre (torus)
    applyMatrix(new THREE.TorusGeometry(C_TIRE_R, C_TUBE_R, 16, 40)),
    // Rim disk
    applyMatrix(
      new THREE.CylinderGeometry(C_RIM_R, C_RIM_R, C_TIRE_W, 28),
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
    ),
    // Hub cap
    applyMatrix(
      new THREE.CylinderGeometry(0.065, 0.065, C_TIRE_W + 0.02, 12),
      [0, 0, 0],
      [Math.PI / 2, 0, 0],
    ),
  ]

  // 5 flat spokes, each a thin box radiating from centre to near rim edge, in XY plane
  const SPOKE_L = C_RIM_R * 0.88
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2
    parts.push(
      applyMatrix(
        new THREE.BoxGeometry(SPOKE_L, 0.05, C_TIRE_W * 0.55),
        [Math.cos(a) * SPOKE_L * 0.5, Math.sin(a) * SPOKE_L * 0.5, 0],
        [0, 0, a],
      ),
    )
  }

  return mergeGeometries(parts)
}

function makeCarScene() {
  const root = new THREE.Group()

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    name: 'body',
    color: new THREE.Color('#8d4f35'),
    roughness: 0.28,
    metalness: 0.84,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    name: 'glass',
    color: new THREE.Color('#dbe5ef'),
    roughness: 0.06,
    metalness: 0.04,
    transmission: 0.92,
    thickness: 0.22,
    transparent: true,
    opacity: 0.42,
    ior: 1.48,
  })

  const trimMaterial = new THREE.MeshStandardMaterial({
    name: 'trim',
    color: new THREE.Color('#c9b089'),
    roughness: 0.34,
    metalness: 0.64,
  })

  const wheelsMaterial = new THREE.MeshStandardMaterial({
    name: 'wheels',
    color: new THREE.Color('#7d8792'),
    roughness: 0.4,
    metalness: 0.86,
  })

  const body = new THREE.Mesh(makeBodyGeometry(), bodyMaterial)
  body.name = 'Body'
  root.add(body)

  const glass = new THREE.Mesh(makeGlassGeometry(), glassMaterial)
  glass.name = 'Glass'
  root.add(glass)

  const trim = new THREE.Mesh(makeTrimGeometry(), trimMaterial)
  trim.name = 'Trim'
  root.add(trim)

  // Wheel positions aligned with body arch centers at x = ±1.42, z = ±0.83, y = 0
  const wheelPositions = new Map([
    ['WheelFL', [C_WX_F, 0.0, C_WZ]],
    ['WheelFR', [C_WX_F, 0.0, -C_WZ]],
    ['WheelRL', [C_WX_R, 0.0, C_WZ]],
    ['WheelRR', [C_WX_R, 0.0, -C_WZ]],
  ])

  for (const [name, position] of wheelPositions.entries()) {
    const wheel = new THREE.Mesh(makeWheelGeometry(), wheelsMaterial.clone())
    wheel.material.name = 'wheels'
    wheel.position.set(...position)
    wheel.name = name
    root.add(wheel)
  }

  return root
}

function exportGlb(scene) {
  const exporter = new GLTFExporter()

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(Buffer.from(result))
          return
        }

        reject(new Error('GLB export did not return ArrayBuffer'))
      },
      reject,
      { binary: true, includeCustomExtensions: false },
    )
  })
}

function toRGBE(red, green, blue) {
  const maxComponent = Math.max(red, green, blue)
  if (maxComponent < 1e-32) {
    return [0, 0, 0, 0]
  }

  const exponent = Math.ceil(Math.log2(maxComponent))
  const scale = 256 / 2 ** exponent

  return [
    Math.min(255, Math.round(red * scale)),
    Math.min(255, Math.round(green * scale)),
    Math.min(255, Math.round(blue * scale)),
    exponent + 128,
  ]
}

function encodeChannel(channel) {
  const encoded = []
  let index = 0

  while (index < channel.length) {
    let runLength = 1
    while (
      runLength < 127 &&
      index + runLength < channel.length &&
      channel[index] === channel[index + runLength]
    ) {
      runLength += 1
    }

    if (runLength >= 4) {
      encoded.push(128 + runLength, channel[index])
      index += runLength
      continue
    }

    const literalStart = index
    index += runLength

    while (index < channel.length) {
      runLength = 1
      while (
        runLength < 127 &&
        index + runLength < channel.length &&
        channel[index] === channel[index + runLength]
      ) {
        runLength += 1
      }

      if (runLength >= 4 || index - literalStart >= 127) {
        break
      }

      index += runLength
    }

    const literalLength = index - literalStart
    encoded.push(literalLength, ...channel.slice(literalStart, index))
  }

  return encoded
}

function generateHdr(width = 256, height = 128) {
  const header = Buffer.from(
    `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
    'ascii',
  )
  const rows = []

  for (let y = 0; y < height; y += 1) {
    const channels = [[], [], [], []]
    const v = y / (height - 1)
    const phi = v * Math.PI

    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1)
      const theta = u * Math.PI * 2
      const direction = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
      )

      const skyBase = new THREE.Color(0.015, 0.024, 0.038)
      const warmKey = Math.max(0, direction.dot(new THREE.Vector3(0.08, 0.98, -0.12))) ** 48
      const coolFill = Math.max(0, direction.dot(new THREE.Vector3(-0.68, 0.42, 0.2))) ** 14
      const floorBounce = Math.max(0, -direction.y) ** 2.2
      const rim = Math.max(0, direction.dot(new THREE.Vector3(0.74, 0.26, 0.62))) ** 20

      const red = skyBase.r + warmKey * 14 + coolFill * 0.42 + floorBounce * 0.28 + rim * 0.18
      const green = skyBase.g + warmKey * 9.5 + coolFill * 0.58 + floorBounce * 0.2 + rim * 0.16
      const blue = skyBase.b + warmKey * 4.4 + coolFill * 1.12 + floorBounce * 0.16 + rim * 0.34

      const [r, g, b, e] = toRGBE(red, green, blue)
      channels[0].push(r)
      channels[1].push(g)
      channels[2].push(b)
      channels[3].push(e)
    }

    const scanlineHeader = Buffer.from([2, 2, width >> 8, width & 255])
    const encodedChannels = channels.flatMap((channel) => encodeChannel(channel))
    rows.push(scanlineHeader, Buffer.from(encodedChannels))
  }

  return Buffer.concat([header, ...rows])
}

async function main() {
  await mkdir(modelsDir, { recursive: true })
  await mkdir(hdrDir, { recursive: true })

  const carRoot = makeCarScene()
  const exportScene = new THREE.Scene()
  exportScene.add(carRoot)

  const glb = await exportGlb(exportScene)
  await writeFile(new URL('hero-ev-sport.glb', modelsDir), glb)

  const hdr = generateHdr()
  await writeFile(new URL('dealer-atrium-studio.hdr', hdrDir), hdr)
}

await main()
