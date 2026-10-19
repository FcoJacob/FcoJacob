import * as THREE from 'three'
import type { AlleyItem, AlleySlot } from './catalog'
import { disposeObject } from './items'
import type { ApprenticeModel, RiggedApprentice } from './assets'
import { createClothCloak, type CloakCollider, type ClothCloak } from './cloak'

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
  /**
   * Replaces the wearable in a slot (null clears it). On the rigged body the
   * cloak becomes a simulated cloth built from the item's colours.
   */
  equip(slot: AlleySlot, object: THREE.Object3D | null, item?: AlleyItem | null): void
  /** Smoothly turns the avatar toward a yaw (radians). */
  setTargetYaw(yaw: number): void
  /** Replaces the primitive body with the Blender apprentice parts. */
  applyModel(model: ApprenticeModel): void
  /** Replaces everything with a skinned, animated humanoid (idle / walk / run clips). */
  applyRiggedModel(model: RiggedApprentice): void
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
  // Primitive meshes, hidden once the Blender model arrives.
  const primitives: THREE.Object3D[] = []

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.43, 1.1, 28), robeMaterial)
  robe.position.y = 0.8
  torso.add(robe)
  primitives.push(robe)

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), robeMaterial)
  shoulders.scale.set(1.25, 0.6, 0.9)
  shoulders.position.y = 1.33
  torso.add(shoulders)
  primitives.push(shoulders)

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 10, 36), beltMaterial)
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.98
  torso.add(belt)
  primitives.push(belt)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), skinMaterial)
  neck.position.y = 1.4
  torso.add(neck)
  primitives.push(neck)

  const head = new THREE.Group()
  head.position.y = 1.58
  torso.add(head)

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 20), skinMaterial)
  head.add(skull)
  primitives.push(skull)

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMaterial,
  )
  hair.position.set(0, 0.02, -0.02)
  hair.rotation.x = -0.15
  head.add(hair)
  primitives.push(hair)

  const eyeGeometry = new THREE.SphereGeometry(0.018, 10, 8)
  const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eyeLeft.position.set(-0.065, 0.02, 0.17)
  const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial)
  eyeRight.position.set(0.065, 0.02, 0.17)
  head.add(eyeLeft, eyeRight)
  primitives.push(eyeLeft, eyeRight)

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
    primitives.push(upper, hand)
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
    const leg = new THREE.Mesh(legGeometry, bootMaterial)
    const boot = new THREE.Mesh(bootGeometry, bootMaterial)
    pivot.add(leg, boot)
    primitives.push(leg, boot)
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

    if (rigged) {
      updateRigged(dt, smoothedSpeed, pose, reducedMotion)
      return
    }

    const presentTarget = pose === 'present' ? 1 : 0
    armPresentBlend += (presentTarget - armPresentBlend) * Math.min(1, dt * (reducedMotion ? 30 : 5))
    wandSlot.rotation.x = THREE.MathUtils.lerp(WAND_REST_PITCH, WAND_PRESENT_PITCH, armPresentBlend)

    if (reducedMotion) {
      legLeft.rotation.x = 0
      legRight.rotation.x = 0
      armLeft.pivot.rotation.x = 0
      armRight.pivot.rotation.x = ARM_PRESENT_PITCH * armPresentBlend
      armRight.pivot.rotation.z = THREE.MathUtils.lerp(modelApplied ? 0 : -0.12, ARM_PRESENT_ROLL, armPresentBlend)
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

  function clearCloth() {
    if (cloth) {
      cloth.object.removeFromParent()
      cloth.dispose()
      cloth = null
    }
  }

  function equip(slot: AlleySlot, object: THREE.Object3D | null, item?: AlleyItem | null) {
    const previous = worn[slot]
    if (previous) {
      slots[slot].remove(previous)
      disposeObject(previous)
    }
    worn[slot] = null
    if (slot === 'cloak') {
      clearCloth()
    }
    if (!object) {
      return
    }
    if (slot === 'cloak' && rigged && item) {
      // Simulated cloth instead of the static shell; a hidden marker keeps
      // the worn record pointing at the item.
      disposeObject(object)
      cloth = createClothCloak({ primary: item.primary, accent: item.accent, variant: item.variant }, 0.34, 0.74)
      ;(group.parent ?? group).add(cloth.object)
      group.getWorldPosition(lastGroupPosition)
      const marker = new THREE.Group()
      marker.name = object.name
      marker.userData.itemId = item.id
      worn[slot] = marker
      slots[slot].add(marker)
      return
    }
    worn[slot] = object
    slots[slot].add(object)
  }

  function setTargetYaw(yaw: number) {
    targetYaw = yaw
  }

  let modelApplied = false
  let rigged: RiggedApprentice | null = null
  let cloth: ClothCloak | null = null
  const clothNeck = new THREE.Vector3()
  const clothForward = new THREE.Vector3()
  const clothRight = new THREE.Vector3()
  const clothVelocity = new THREE.Vector3()
  const shoulderLeft = new THREE.Vector3()
  const shoulderRight = new THREE.Vector3()
  const lastGroupPosition = new THREE.Vector3()
  const colliderHips = { center: new THREE.Vector3(), radius: 0.17 }
  const colliderChest = { center: new THREE.Vector3(), radius: 0.17 }
  const colliderHead = { center: new THREE.Vector3(), radius: 0.12 }
  const colliders: CloakCollider[] = [colliderHips, colliderChest, colliderHead]
  let mixer: THREE.AnimationMixer | null = null
  let idleAction: THREE.AnimationAction | null = null
  let walkAction: THREE.AnimationAction | null = null
  let runAction: THREE.AnimationAction | null = null
  const presentQuaternion = new THREE.Quaternion()
  const presentAxis = new THREE.Vector3(0, 0, 1)

  /**
   * Skinned humanoid: the procedural rig is hidden, slots re-anchor to bones
   * and the animation mixer blends idle / walk / run from the travel speed.
   */
  function applyRiggedModel(model: RiggedApprentice) {
    if (rigged) {
      return
    }
    rigged = model
    primitives.forEach((mesh) => (mesh.visible = false))
    torso.visible = false
    legLeft.visible = false
    legRight.visible = false

    const targetHeight = 1.55
    const scale = model.height > 0.1 ? targetHeight / model.height : 1
    model.root.scale.setScalar(scale)
    model.root.position.set(0, 0, 0)
    // Bind pose, upright, so slot world positions can be measured before attaching.
    const savedYaw = group.rotation.y
    group.rotation.y = 0
    group.add(model.root)
    group.updateMatrixWorld(true)

    // Slots are placed in world space at bind pose (crown, neck, right palm) and
    // then attached to their bones, which keeps that placement while bones animate
    // regardless of how the rig orients its local axes.
    const groupWorld = new THREE.Vector3()
    group.getWorldPosition(groupWorld)
    const boneWorld = new THREE.Vector3()
    const placeSlot = (
      slot: THREE.Group,
      bone: THREE.Bone | null,
      offset: THREE.Vector3,
      tilt: THREE.Euler,
      slotScale: number,
    ) => {
      if (!bone) {
        return
      }
      bone.getWorldPosition(boneWorld)
      slot.removeFromParent()
      group.add(slot)
      slot.position.set(
        boneWorld.x - groupWorld.x + offset.x,
        boneWorld.y - groupWorld.y + offset.y,
        boneWorld.z - groupWorld.z + offset.z,
      )
      slot.rotation.copy(tilt)
      slot.scale.setScalar(slotScale)
      group.updateMatrixWorld(true)
      bone.attach(slot)
    }
    const headBone = model.bones.head
    let crownY = targetHeight
    if (headBone) {
      headBone.getWorldPosition(boneWorld)
      // Crown of the modelled head: the head bone sits at the jaw, the skull top ~0.17 m above.
      crownY = Math.min(boneWorld.y - groupWorld.y + 0.17, targetHeight - 0.04)
      placeSlot(headSlot, headBone, new THREE.Vector3(0, crownY - (boneWorld.y - groupWorld.y), 0.01), new THREE.Euler(-0.05, 0, 0), 1)
    }
    placeSlot(cloakSlot, model.bones.neck ?? model.bones.head, new THREE.Vector3(0, -0.03, -0.02), new THREE.Euler(0, 0, 0), 0.58)
    // Wand: along +y of the slot, so tilt it to point forward and up from the palm.
    placeSlot(wandSlot, model.bones.rightHand, new THREE.Vector3(0, -0.04, -0.03), new THREE.Euler(Math.PI / 2 - 0.4, 0, 0), 1)

    group.rotation.y = savedYaw
    group.updateMatrixWorld(true)

    mixer = new THREE.AnimationMixer(model.root)
    if (model.clips.idle) {
      idleAction = mixer.clipAction(model.clips.idle)
      idleAction.play()
    }
    if (model.clips.walk) {
      walkAction = mixer.clipAction(model.clips.walk)
      walkAction.play()
      walkAction.setEffectiveWeight(0)
    }
    if (model.clips.run) {
      runAction = mixer.clipAction(model.clips.run)
      runAction.play()
      runAction.setEffectiveWeight(0)
    }
    shadow.scale.setScalar(1.05)
  }

  function updateRigged(dt: number, speed: number, pose: AvatarPose, reducedMotion: boolean) {
    if (!mixer || !rigged) {
      return
    }
    const magnitude = Math.abs(speed)
    const walkBlend = THREE.MathUtils.clamp((magnitude - 0.15) / 0.6, 0, 1)
    const runBlend = THREE.MathUtils.clamp((magnitude - 2.4) / 1.2, 0, 1)
    const idleWeight = 1 - walkBlend
    const walkWeight = walkBlend * (1 - runBlend)
    const runWeight = walkBlend * runBlend
    const smoothing = reducedMotion ? 1 : Math.min(1, dt * 8)
    const blendTo = (action: THREE.AnimationAction | null, weight: number) => {
      if (!action) return
      action.setEffectiveWeight(THREE.MathUtils.lerp(action.getEffectiveWeight(), weight, smoothing))
    }
    blendTo(idleAction, idleWeight)
    blendTo(walkAction, walkAction && !runAction ? walkBlend : walkWeight)
    blendTo(runAction, runWeight)
    if (walkAction) {
      walkAction.timeScale = THREE.MathUtils.clamp(magnitude / 1.35, 0.7, 1.6)
    }
    if (runAction) {
      runAction.timeScale = THREE.MathUtils.clamp(magnitude / 4.2, 0.8, 1.4)
    }
    mixer.update(reducedMotion ? 0 : dt)

    // Cloth cloak follows the collar; body spheres keep it off the torso.
    if (cloth) {
      group.updateMatrixWorld(true)
      // Collar anchor: just below the head bone (the auto-rig's shoulder bones sit
      // at chest height, too low for a collar). Shoulders only give the lateral centre.
      if (rigged.bones.head) {
        rigged.bones.head.getWorldPosition(clothNeck)
        if (rigged.bones.leftShoulder && rigged.bones.rightShoulder) {
          rigged.bones.leftShoulder.getWorldPosition(shoulderLeft)
          rigged.bones.rightShoulder.getWorldPosition(shoulderRight)
          clothNeck.x = (shoulderLeft.x + shoulderRight.x) / 2
          clothNeck.z = (shoulderLeft.z + shoulderRight.z) / 2
        }
        clothNeck.y -= 0.05
      } else {
        group.getWorldPosition(clothNeck)
        clothNeck.y += 1.25
      }
      const yaw = group.rotation.y
      clothForward.set(Math.sin(yaw), 0, Math.cos(yaw))
      clothRight.set(Math.cos(yaw), 0, -Math.sin(yaw))
      cloth.setAnchors(clothNeck, clothForward, clothRight)
      if (rigged.bones.hips) {
        rigged.bones.hips.getWorldPosition(colliderHips.center)
      } else {
        group.getWorldPosition(colliderHips.center)
        colliderHips.center.y += 0.85
      }
      colliderChest.center.lerpVectors(colliderHips.center, clothNeck, 0.55)
      if (rigged.bones.head) {
        rigged.bones.head.getWorldPosition(colliderHead.center)
        colliderHead.center.y += 0.06
      } else {
        colliderHead.center.copy(clothNeck)
        colliderHead.center.y += 0.15
      }
      group.getWorldPosition(clothVelocity)
      const dtSafe = Math.max(dt, 0.001)
      clothVelocity.sub(lastGroupPosition).divideScalar(dtSafe)
      group.getWorldPosition(lastGroupPosition)
      cloth.update(dt, colliders, clothVelocity, reducedMotion)
    }

    // Presentation pose: lift the wand arm after the mixer has posed the rig.
    const arm = rigged.bones.rightArm
    if (arm) {
      const target = 0
      void pose
      armPresentBlend += (target - armPresentBlend) * Math.min(1, dt * 5)
      if (armPresentBlend > 0.001) {
        presentQuaternion.setFromAxisAngle(presentAxis, -1.25 * armPresentBlend)
        arm.quaternion.multiply(presentQuaternion)
      }
    }
  }

  /**
   * Swaps the primitives for the Blender parts. Each part's node translation
   * is its joint pivot (neck, shoulders, hips), so pivots move to match and
   * the slots are re-anchored to the modelled crown, neck and right hand.
   */
  function applyModel(model: ApprenticeModel) {
    if (modelApplied) {
      return
    }
    modelApplied = true
    primitives.forEach((mesh) => (mesh.visible = false))

    const mount = (node: THREE.Object3D, pivot: THREE.Group) => {
      pivot.position.copy(node.position)
      node.position.set(0, 0, 0)
      node.rotation.set(0, 0, 0)
      pivot.add(node)
    }

    const torsoNode = model.parts.TORSO
    torsoNode.position.set(0, 0, 0)
    torso.add(torsoNode)
    mount(model.parts.HEAD, head)
    mount(model.parts.ARM_L, armLeft.pivot)
    mount(model.parts.ARM_R, armRight.pivot)
    mount(model.parts.LEG_L, legLeft)
    mount(model.parts.LEG_R, legRight)
    armLeft.pivot.rotation.z = 0
    armRight.pivot.rotation.z = 0

    // Slots measured on the Blender model (crown, neck, right palm).
    headSlot.position.set(0, 1.86 - head.position.y, 0)
    headSlot.rotation.x = -0.04
    cloakSlot.position.set(0, 1.34, -0.02)
    armRight.grip.position.set(0.42 - armRight.pivot.position.x, 0.74 - armRight.pivot.position.y, 0.04)
    shadow.scale.setScalar(1.15)
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
    mixer?.stopAllAction()
    mixer = null
    clearCloth()
    equip('head', null)
    equip('cloak', null)
    equip('wand', null)
    disposeObject(group)
  }

  return { group, slots, worn, update, equip, setTargetYaw, applyModel, applyRiggedModel, getWandTip, dispose }
}
