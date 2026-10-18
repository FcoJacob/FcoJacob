import * as THREE from 'three'
import type { AlleySlot } from './catalog'
import { disposeObject } from './items'

/**
 * Third-person apprentice built from primitives with a procedural walk cycle.
 * Ground is y = 0. Height ~1.75 m so the alley proportions feel human.
 */

export type AvatarPose = 'walk' | 'present'

export interface AlleyAvatar {
  group: THREE.Group
  /** Attachment points for wearables. */
  slots: Record<AlleySlot, THREE.Group>
  /** Current wearable per slot, if any. */
  worn: Record<AlleySlot, THREE.Object3D | null>
  /**
   * Advances the walk/idle animation. `speed` is signed metres per second.
   * `present` raises the wand arm so a held wand reads clearly on camera.
   */
  update(dt: number, speed: number, elapsed: number, reducedMotion: boolean, pose?: AvatarPose): void
  /** Replaces the wearable in a slot (null clears it). */
  equip(slot: AlleySlot, object: THREE.Object3D | null): void
  /** Smoothly turns the avatar toward a yaw (radians). */
  setTargetYaw(yaw: number): void
  /** World-space position of the wand tip, or the hand if no wand is held. */
  getWandTip(target: THREE.Vector3): THREE.Vector3
  dispose(): void
}

export function createAvatar(contactShadow: THREE.Texture): AlleyAvatar {
  const group = new THREE.Group()
  group.name = 'avatar'

  const robeMaterial = new THREE.MeshStandardMaterial({ color: '#2c3550', roughness: 0.9 })
  const skinMaterial = new THREE.MeshStandardMaterial({ color: '#d9a98a', roughness: 0.7 })
  const hairMaterial = new THREE.MeshStandardMaterial({ color: '#3b2416', roughness: 0.85 })
  const bootMaterial = new THREE.MeshStandardMaterial({ color: '#201612', roughness: 0.6 })
  const beltMaterial = new THREE.MeshStandardMaterial({
    color: '#8b6a2c',
    roughness: 0.4,
    metalness: 0.6,
  })
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.3 })

  // Body pivot so the whole torso can bob and lean without moving the feet.
  const torso = new THREE.Group()
  torso.position.y = 0
  group.add(torso)

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.43, 1.1, 28), robeMaterial)
  robe.position.y = 0.8
  torso.add(robe)

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), robeMaterial)
  shoulders.scale.set(1.25, 0.6, 0.9)
  shoulders.position.y = 1.33
  torso.add(shoulders)

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 10, 36), beltMaterial)
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.98
  torso.add(belt)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), skinMaterial)
  neck.position.y = 1.4
  torso.add(neck)

  const head = new THREE.Group()
  head.position.y = 1.58
  torso.add(head)

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 20), skinMaterial)
  head.add(skull)

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMaterial,
  )
  hair.position.set(0, 0.02, -0.02)
  hair.rotation.x = -0.15
  head.add(hair)

  const eyeGeometry = new THREE.SphereGeometry(0.018, 10, 8)
  const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eyeLeft.position.set(-0.065, 0.02, 0.17)
  const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eyeRight.position.set(0.065, 0.02, 0.17)
  head.add(eyeLeft, eyeRight)

  // Arms hang from shoulder pivots so they can swing.
  const armGeometry = new THREE.CapsuleGeometry(0.058, 0.4, 6, 12)
  armGeometry.translate(0, -0.25, 0)
  const handGeometry = new THREE.SphereGeometry(0.065, 14, 10)

  function buildArm(sign: 1 | -1) {
    const pivot = new THREE.Group()
    pivot.position.set(sign * 0.27, 1.3, 0)
    pivot.rotation.z = sign * -0.12
    const upper = new THREE.Mesh(armGeometry, robeMaterial)
    pivot.add(upper)
    const hand = new THREE.Mesh(handGeometry, skinMaterial)
    hand.position.y = -0.52
    pivot.add(hand)
    const grip = new THREE.Group()
    grip.position.set(0, -0.54, 0.02)
    pivot.add(grip)
    return { pivot, grip }
  }

  const armLeft = buildArm(-1)
  const armRight = buildArm(1)
  torso.add(armLeft.pivot, armRight.pivot)

  // Legs: short capsules peeking under the robe plus boots.
  const legGeometry = new THREE.CapsuleGeometry(0.07, 0.32, 6, 12)
  legGeometry.translate(0, -0.2, 0)
  const bootGeometry = new THREE.BoxGeometry(0.13, 0.1, 0.24)
  bootGeometry.translate(0, -0.42, 0.04)

  function buildLeg(sign: 1 | -1) {
    const pivot = new THREE.Group()
    pivot.position.set(sign * 0.12, 0.48, 0)
    pivot.add(new THREE.Mesh(legGeometry, bootMaterial))
    pivot.add(new THREE.Mesh(bootGeometry, bootMaterial))
    return pivot
  }

  const legLeft = buildLeg(-1)
  const legRight = buildLeg(1)
  group.add(legLeft, legRight)

  // Slots.
  const headSlot = new THREE.Group()
  headSlot.position.set(0, 0.17, -0.01)
  headSlot.rotation.x = -0.06
  head.add(headSlot)

  const cloakSlot = new THREE.Group()
  cloakSlot.position.set(0, 1.36, -0.02)
  torso.add(cloakSlot)

  const wandSlot = new THREE.Group()
  // Wand runs along +y locally. With the arm hanging it points forward and up
  // from the hip; in the presentation pose it continues the raised forearm.
  const WAND_REST_PITCH = Math.PI / 2 - 0.55
  const WAND_PRESENT_PITCH = Math.PI
  const ARM_PRESENT_PITCH = 0.35
  const ARM_PRESENT_ROLL = 2.25
  wandSlot.rotation.x = WAND_REST_PITCH
  wandSlot.rotation.z = -0.1
  armRight.grip.add(wandSlot)
  let armPresentBlend = 0

  const slots: Record<AlleySlot, THREE.Group> = {
    head: headSlot,
    cloak: cloakSlot,
    wand: wandSlot,
  }
  const worn: Record<AlleySlot, THREE.Object3D | null> = { head: null, cloak: null, wand: null }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({
      map: contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.012
  group.add(shadow)

  let walkPhase = 0
  let targetYaw = Math.PI
  let smoothedSpeed = 0
  group.rotation.y = targetYaw

  const tipTarget = new THREE.Vector3()

  function update(
    dt: number,
    speed: number,
    elapsed: number,
    reducedMotion: boolean,
    pose: AvatarPose = 'walk',
  ) {
    smoothedSpeed += (speed - smoothedSpeed) * Math.min(1, dt * 8)
    const magnitude = Math.min(1, Math.abs(smoothedSpeed) / 2.4)

    // Turn toward travel direction.
    let delta = targetYaw - group.rotation.y
    delta = Math.atan2(Math.sin(delta), Math.cos(delta))
    group.rotation.y += delta * Math.min(1, dt * (reducedMotion ? 30 : 7))

    const presentTarget = pose === 'present' ? 1 : 0
    armPresentBlend += (presentTarget - armPresentBlend) * Math.min(1, dt * (reducedMotion ? 30 : 5))
    wandSlot.rotation.x = THREE.MathUtils.lerp(WAND_REST_PITCH, WAND_PRESENT_PITCH, armPresentBlend)

    if (reducedMotion) {
      legLeft.rotation.x = 0
      legRight.rotation.x = 0
      armLeft.pivot.rotation.x = 0
      armRight.pivot.rotation.x = ARM_PRESENT_PITCH * armPresentBlend
      armRight.pivot.rotation.z = THREE.MathUtils.lerp(-0.12, ARM_PRESENT_ROLL, armPresentBlend)
      torso.position.y = 0
      torso.rotation.x = 0
      return
    }

    walkPhase += dt * (4.5 + magnitude * 6) * (magnitude > 0.02 ? 1 : 0)
    const swing = Math.sin(walkPhase) * 0.55 * magnitude
    legLeft.rotation.x = swing
    legRight.rotation.x = -swing
    armLeft.pivot.rotation.x = -swing * 0.8 + Math.sin(elapsed * 1.4) * 0.03
    const restArm = swing * 0.8 + Math.sin(elapsed * 1.4 + 1) * 0.03
    const presentArm = ARM_PRESENT_PITCH + Math.sin(elapsed * 1.8) * 0.04
    armRight.pivot.rotation.x = THREE.MathUtils.lerp(restArm, presentArm, armPresentBlend)
    armRight.pivot.rotation.z = THREE.MathUtils.lerp(-0.12, ARM_PRESENT_ROLL, armPresentBlend)

    const bob = Math.abs(Math.sin(walkPhase)) * 0.035 * magnitude
    const breathe = Math.sin(elapsed * 1.6) * 0.006
    torso.position.y = bob + breathe
    torso.rotation.x = -magnitude * 0.06
    head.rotation.y = Math.sin(elapsed * 0.7) * 0.08 * (1 - magnitude)
  }

  function equip(slot: AlleySlot, object: THREE.Object3D | null) {
    const previous = worn[slot]
    if (previous) {
      slots[slot].remove(previous)
      disposeObject(previous)
    }
    worn[slot] = object
    if (object) {
      slots[slot].add(object)
    }
  }

  function setTargetYaw(yaw: number) {
    targetYaw = yaw
  }

  function getWandTip(target: THREE.Vector3) {
    const wand = worn.wand
    const tip = wand?.getObjectByName('wand-tip')
    if (tip) {
      return tip.getWorldPosition(target)
    }
    return armRight.grip.getWorldPosition(tipTarget.copy(target))
  }

  function dispose() {
    equip('head', null)
    equip('cloak', null)
    equip('wand', null)
    disposeObject(group)
  }

  return { group, slots, worn, update, equip, setTargetYaw, getWandTip, dispose }
}
