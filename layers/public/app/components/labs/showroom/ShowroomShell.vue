<script setup lang="ts">
import ShowroomControlDock from './ShowroomControlDock.vue'
import ShowroomCanvas from './ShowroomCanvas.client.vue'
import ShowroomDebugPanel from './ShowroomDebugPanel.vue'
import ShowroomStageOverlay from './ShowroomStageOverlay.vue'
import {
  defaultShowroomDebugTuning,
  showroomDebugStorageKeys,
  showroomMagicMousePreset,
  showroomReviewModePreset,
  showroomTrackpadPreset,
} from '../../../utils/labs/showroom/debug'
import type { ShowroomManifest } from '../../../utils/labs/showroom/manifest'
import type {
  ShowroomDebugTuning,
  ShowroomWheelInputProfile,
} from '../../../utils/labs/showroom/debug'

const props = defineProps<{
  manifest: ShowroomManifest
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const storyRef = useTemplateRef<HTMLElement>('story')
const stageOverlayRef = useTemplateRef<InstanceType<typeof ShowroomStageOverlay>>('stageOverlay')
const heroVehicle = computed(() => props.manifest.vehicles[0])
const debugTuning = reactive({ ...defaultShowroomDebugTuning })
const cameraStepIndex = shallowRef(0)
const cameraProgress = shallowRef(0)
const cameraVelocity = shallowRef(0)
const cameraInputProfile = shallowRef<ShowroomWheelInputProfile>('wheel')
const reviewMode = shallowRef(false)
const isProgrammaticNav = shallowRef(false)
const debugSwitchVisible = import.meta.dev
const timeOfDay = shallowRef<'day' | 'night'>('night')
const debugPanelEnabled = computed(() => {
  if (!import.meta.dev) {
    return false
  }

  const queryValue = route.query.showroomDebug
  return queryValue === '' || queryValue === '1' || queryValue === 'true'
})
const reducedMotionPreferred = shallowRef(false)
const introPhase = shallowRef<'booting' | 'staged' | 'entering' | 'interactive'>('booting')
const presentedStepIndex = shallowRef(0)
const transitionPhase = shallowRef<'idle' | 'out' | 'in'>('idle')
const transitionDirection = shallowRef<'forward' | 'backward'>('forward')
const runtimeState = reactive({
  isLoading: true,
  isReady: false,
  progress: 0,
})

let reducedMotionQuery: MediaQueryList | null = null
let introTimer: ReturnType<typeof window.setTimeout> | null = null
let stepOutTimer: ReturnType<typeof window.setTimeout> | null = null
let stepInTimer: ReturnType<typeof window.setTimeout> | null = null

function syncReducedMotionPreference(event?: MediaQueryListEvent) {
  reducedMotionPreferred.value = event?.matches ?? reducedMotionQuery?.matches ?? false
}

function getConfigGroupLabel(groupId: string, fallback: string) {
  if (groupId === 'exterior-color') {
    return t('labs_showroom.configurator.group_exterior_color')
  }

  if (groupId === 'trim-package') {
    return t('labs_showroom.configurator.group_trim_package')
  }

  if (groupId === 'wheel-set') {
    return t('labs_showroom.configurator.group_wheel_set')
  }

  return fallback
}

const storySteps = computed(() => [
  {
    id: 'default-presentation',
    eyebrow: t('labs_showroom.story.presentation_eyebrow'),
    title: t('labs_showroom.story.presentation_title'),
    description: t('labs_showroom.story.presentation_description'),
    configGroupId: null,
    panelLabel: t('labs_showroom.story.presentation_eyebrow'),
  },
  {
    id: 'trim-package',
    eyebrow: t('labs_showroom.story.package_eyebrow'),
    title: t('labs_showroom.story.package_title'),
    description: t('labs_showroom.story.package_description'),
    configGroupId: 'trim-package',
    panelLabel: t('labs_showroom.configurator.group_trim_package'),
  },
  {
    id: 'exterior-color',
    eyebrow: t('labs_showroom.story.color_eyebrow'),
    title: t('labs_showroom.story.color_title'),
    description: t('labs_showroom.story.color_description'),
    configGroupId: 'exterior-color',
    panelLabel: t('labs_showroom.configurator.group_exterior_color'),
  },
  {
    id: 'satin-tone',
    eyebrow: t('labs_showroom.story.satin_eyebrow'),
    title: t('labs_showroom.story.satin_title'),
    description: t('labs_showroom.story.satin_description'),
    configGroupId: 'satin-tone',
    panelLabel: t('labs_showroom.configurator.group_satin_tone'),
  },
  {
    id: 'paint-treatment',
    eyebrow: t('labs_showroom.story.treatment_eyebrow'),
    title: t('labs_showroom.story.treatment_title'),
    description: t('labs_showroom.story.treatment_description'),
    configGroupId: 'paint-treatment',
    panelLabel: t('labs_showroom.configurator.group_paint_treatment'),
  },
  {
    id: 'wheel-set',
    eyebrow: t('labs_showroom.story.wheels_eyebrow'),
    title: t('labs_showroom.story.wheels_title'),
    description: t('labs_showroom.story.wheels_description'),
    configGroupId: 'wheel-set',
    panelLabel: t('labs_showroom.configurator.group_wheel_set'),
  },
])

const interactionEnabled = computed(() => introPhase.value === 'interactive')
const {
  selectedOptionIds,
  selectionSnapshot,
  selectionsByType,
  selectOption,
  restoreSelections,
  resetSelections,
} = useVehicleConfigurator(computed(() => heroVehicle.value.optionGroups))
const { hasRestoredState, lastSavedAt, resetPersistedSelections } = useShowroomPersistence(
  `showroom:${props.manifest.slug}:selections`,
  selectionSnapshot,
  restoreSelections,
  resetSelections,
)

function scrollToStep(index: number) {
  if (!import.meta.client || !interactionEnabled.value) {
    return
  }

  const clampedIndex = Math.min(Math.max(index, 0), storySteps.value.length - 1)
  if (clampedIndex === cameraStepIndex.value) {
    return
  }

  // Raise the flag so handleCameraState does not overwrite while the canvas
  // is still lerping orbitDistance toward the new target step.
  isProgrammaticNav.value = true
  cameraStepIndex.value = clampedIndex
  nextTick(() => {
    stageOverlayRef.value?.focusActiveCard()
  })
}

function handleCameraState(payload: {
  inputProfile: ShowroomWheelInputProfile
  progress: number
  scrollVelocity: number
  stepIndex: number
}) {
  cameraInputProfile.value = payload.inputProfile
  cameraProgress.value = payload.progress
  cameraVelocity.value = payload.scrollVelocity

  if (isProgrammaticNav.value) {
    // The canvas is still animating toward the programmatically-set step.
    // Once orbitDistance reaches the target, canvas will emit the correct stepIndex.
    if (payload.stepIndex === cameraStepIndex.value) {
      isProgrammaticNav.value = false
    }
    // Do NOT overwrite cameraStepIndex — that would cancel the animation.
    return
  }

  // Desktop wheel/trackpad: let the canvas drive the step index normally.
  cameraStepIndex.value = payload.stepIndex
}

function loadPersistedBaseline(storageKey: string) {
  if (!import.meta.client) {
    return null
  }

  const rawValue = localStorage.getItem(storageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as ShowroomDebugTuning
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

function jumpToHeroFraming() {
  reviewMode.value = true
  scrollToStep(2)
}

function jumpToFinalFraming() {
  reviewMode.value = true
  scrollToStep(storySteps.value.length - 1)
}

function setDebugPanelEnabled(enabled: boolean) {
  if (!import.meta.client) {
    return
  }

  const nextQuery = { ...route.query }

  if (enabled) {
    nextQuery.showroomDebug = '1'
  } else {
    delete nextQuery.showroomDebug
    reviewMode.value = false
  }

  router.replace({ query: nextQuery })
}

function applyDebugPreset(preset: 'trackpad' | 'magic-mouse' | 'review') {
  const persistedTrackpad = loadPersistedBaseline(showroomDebugStorageKeys.trackpadBaseline)
  const persistedMagicMouse = loadPersistedBaseline(showroomDebugStorageKeys.magicMouseBaseline)
  const nextPreset: ShowroomDebugTuning =
    preset === 'trackpad'
      ? (persistedTrackpad ?? showroomTrackpadPreset)
      : preset === 'magic-mouse'
        ? (persistedMagicMouse ?? showroomMagicMousePreset)
        : showroomReviewModePreset

  Object.assign(debugTuning, nextPreset)
  reviewMode.value = preset === 'review'
}

function saveDebugBaseline(target: 'trackpad' | 'magic-mouse') {
  if (!import.meta.client) {
    return
  }

  const storageKey =
    target === 'trackpad'
      ? showroomDebugStorageKeys.trackpadBaseline
      : showroomDebugStorageKeys.magicMouseBaseline

  localStorage.setItem(storageKey, JSON.stringify({ ...debugTuning }))
}

function applyPreset(selection: Record<string, string>) {
  restoreSelections(selection)
}

function clearStepTimers() {
  if (stepOutTimer) {
    window.clearTimeout(stepOutTimer)
    stepOutTimer = null
  }

  if (stepInTimer) {
    window.clearTimeout(stepInTimer)
    stepInTimer = null
  }
}

function clearIntroTimer() {
  if (!introTimer) {
    return
  }

  window.clearTimeout(introTimer)
  introTimer = null
}

function handleRuntimeState(payload: { isLoading: boolean; isReady: boolean; progress: number }) {
  runtimeState.isLoading = payload.isLoading
  runtimeState.isReady = payload.isReady
  runtimeState.progress = payload.progress

  if (payload.isLoading) {
    introPhase.value = 'booting'
    return
  }

  if (introPhase.value === 'booting') {
    introPhase.value = 'staged'
  }
}

function enterShowroom() {
  clearIntroTimer()
  introPhase.value = 'entering'
  introTimer = window.setTimeout(() => {
    introPhase.value = 'interactive'
    introTimer = null
    nextTick(() => {
      stageOverlayRef.value?.focusActiveCard()
    })
  }, 260)
}

function getMotionScale() {
  const velocity = cameraVelocity.value
  const sourceScale =
    cameraInputProfile.value === 'trackpad'
      ? 1
      : cameraInputProfile.value === 'magic-mouse'
        ? 0.94
        : 0.88
  return Math.max(0.68, Math.min(1.18, sourceScale - velocity * 0.34))
}

const activeStep = computed(() => storySteps.value[presentedStepIndex.value] ?? storySteps.value[0])
const progressPercentage = computed(() => `${Math.round(runtimeState.progress * 100)}%`)
const narrativeProgressPercentage = computed(() => `${Math.round(cameraProgress.value * 100)}%`)
const selectedConfiguration = computed(() =>
  heroVehicle.value.optionGroups.map((group) => {
    const selectedId = selectedOptionIds[group.id]
    const selectedOption = group.options.find((option) => option.id === selectedId)

    return {
      id: group.id,
      label: getConfigGroupLabel(group.id, group.label),
      optionLabel: selectedOption?.label ?? '—',
      swatchColor: group.type === 'color' ? (selectedOption?.value ?? null) : null,
    }
  }),
)
const selectedColorLabel = computed(
  () =>
    selectedConfiguration.value.find((item) => item.id === 'exterior-color')?.optionLabel ?? '—',
)
const selectedTrimLabel = computed(
  () => selectedConfiguration.value.find((item) => item.id === 'trim-package')?.optionLabel ?? '—',
)
const selectedWheelsLabel = computed(
  () => selectedConfiguration.value.find((item) => item.id === 'wheel-set')?.optionLabel ?? '—',
)
const preConfigStage = computed(() => !activeStep.value?.configGroupId)
const activeConfigGroup = computed(() => {
  const groupId = activeStep.value?.configGroupId

  if (!groupId) {
    return null
  }

  const group = heroVehicle.value.optionGroups.find((entry) => entry.id === groupId)

  if (!group) {
    return null
  }

  return group
})
const activeConfigDisplayLabel = computed(() => activeStep.value?.panelLabel ?? null)
const overlayMotionDuration = computed(() => {
  const baseDuration = reducedMotionPreferred.value ? 180 : 320
  return Math.max(160, Math.round(baseDuration * getMotionScale()))
})
const overlayMotionOffset = computed(() => {
  const baseOffset =
    cameraInputProfile.value === 'trackpad'
      ? 10
      : cameraInputProfile.value === 'magic-mouse'
        ? 14
        : 18
  return Math.round(baseOffset + cameraVelocity.value * 20)
})
const stepTimingMap = {
  intro: { out: 170, hold: 300, enter: 420 },
  approach: { out: 150, hold: 250, enter: 360 },
  focus: { out: 130, hold: 220, enter: 320 },
  config: { out: 110, hold: 180, enter: 260 },
} as const

function resolveStepTiming(stepId: string) {
  const motionScale = getMotionScale()

  if (stepId === 'intro') {
    return {
      out: Math.round(stepTimingMap.intro.out * motionScale),
      hold: Math.round(stepTimingMap.intro.hold * motionScale),
      enter: Math.round(stepTimingMap.intro.enter * motionScale),
    }
  }

  if (stepId === 'approach') {
    return {
      out: Math.round(stepTimingMap.approach.out * motionScale),
      hold: Math.round(stepTimingMap.approach.hold * motionScale),
      enter: Math.round(stepTimingMap.approach.enter * motionScale),
    }
  }

  if (stepId === 'focus') {
    return {
      out: Math.round(stepTimingMap.focus.out * motionScale),
      hold: Math.round(stepTimingMap.focus.hold * motionScale),
      enter: Math.round(stepTimingMap.focus.enter * motionScale),
    }
  }

  return {
    out: Math.round(stepTimingMap.config.out * motionScale),
    hold: Math.round(stepTimingMap.config.hold * motionScale),
    enter: Math.round(stepTimingMap.config.enter * motionScale),
  }
}
function handleNavigateStep(direction: 'prev' | 'next' | 'back-to-labs') {
  if (direction === 'back-to-labs') {
    router.push('/labs')
    return
  }
  scrollToStep(direction === 'next' ? cameraStepIndex.value + 1 : cameraStepIndex.value - 1)
}

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  const persistedTrackpad = loadPersistedBaseline(showroomDebugStorageKeys.trackpadBaseline)

  if (persistedTrackpad) {
    Object.assign(debugTuning, persistedTrackpad)
  }

  presentedStepIndex.value = cameraStepIndex.value
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncReducedMotionPreference()
  reducedMotionQuery.addEventListener('change', syncReducedMotionPreference)
})

watch(
  cameraStepIndex,
  (nextIndex, previousIndex) => {
    if (!interactionEnabled.value || previousIndex === undefined || nextIndex === previousIndex) {
      presentedStepIndex.value = nextIndex
      return
    }

    if (reviewMode.value) {
      clearStepTimers()
      transitionDirection.value = nextIndex > previousIndex ? 'forward' : 'backward'
      presentedStepIndex.value = nextIndex
      transitionPhase.value = 'idle'
      return
    }

    clearStepTimers()
    const nextStep = storySteps.value[nextIndex]
    const timing = resolveStepTiming(nextStep?.id ?? 'config')
    transitionDirection.value = nextIndex > previousIndex ? 'forward' : 'backward'
    transitionPhase.value = 'out'

    stepOutTimer = window.setTimeout(() => {
      presentedStepIndex.value = nextIndex
      transitionPhase.value = 'in'
      stepOutTimer = null

      stepInTimer = window.setTimeout(() => {
        transitionPhase.value = 'idle'
        stepInTimer = null
      }, timing.enter)
    }, timing.hold)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  }

  clearIntroTimer()
  clearStepTimers()
  reducedMotionQuery?.removeEventListener('change', syncReducedMotionPreference)
  reducedMotionQuery = null
})
</script>

<template>
  <section ref="story" class="showroom-shell" :data-intro-phase="introPhase">
    <div v-if="interactionEnabled" class="showroom-progress-rail" aria-hidden="true">
      <div class="showroom-progress-rail-track">
        <span :style="{ width: narrativeProgressPercentage }" />
      </div>
    </div>

    <div class="showroom-switches">
      <label class="showroom-switch">
        <input
          :checked="timeOfDay === 'day'"
          type="checkbox"
          @change="timeOfDay = ($event.target as HTMLInputElement).checked ? 'day' : 'night'"
        />
        <span>{{ timeOfDay === 'day' ? '☀️ Día' : '🌙 Noche' }}</span>
      </label>

      <label v-if="debugSwitchVisible" class="showroom-switch">
        <input
          :checked="debugPanelEnabled"
          type="checkbox"
          @change="setDebugPanelEnabled(($event.target as HTMLInputElement).checked)"
        />
        <span>{{ debugPanelEnabled ? 'Debug on' : 'Debug off' }}</span>
      </label>
    </div>

    <ClientOnly>
      <ShowroomCanvas
        immersive
        :time-of-day="timeOfDay"
        :active-step-index="cameraStepIndex"
        :debug-tuning="debugTuning"
        :hdr-path="manifest.environment.hdr"
        :model-path="heroVehicle.model"
        :selected-options="selectionsByType"
        @camera-state="handleCameraState"
        @runtime-state="handleRuntimeState"
      />
      <template #fallback>
        <div class="showroom-canvas-fallback">
          <span>{{
            runtimeState.isLoading ? t('common.loading') : t('labs_showroom.runtime.no_webgl_title')
          }}</span>
        </div>
      </template>
    </ClientOnly>

    <ShowroomStageOverlay
      ref="stageOverlay"
      :active-step="activeStep"
      :active-step-index="presentedStepIndex"
      :environment-label="manifest.environment.label"
      :intro-phase="introPhase"
      :motion-duration-ms="overlayMotionDuration"
      :motion-offset-px="overlayMotionOffset"
      :poster-src="manifest.poster"
      :progress-percentage="narrativeProgressPercentage"
      :review-mode="reviewMode"
      :total-steps="storySteps.length"
      :transition-direction="transitionDirection"
      :transition-phase="transitionPhase"
      :vehicle-name="heroVehicle.name"
      @enter="enterShowroom"
    />

    <ShowroomControlDock
      :active-config-group="activeConfigGroup"
      :active-config-display-label="activeConfigDisplayLabel"
      :active-step-index="cameraStepIndex"
      :active-step-label="activeStep.title"
      :environment-label="manifest.environment.label"
      :has-debug-switch="debugSwitchVisible"
      :hero-name="heroVehicle.name"
      :interaction-enabled="interactionEnabled"
      :manifest-phase="manifest.phase"
      :pre-config-stage="preConfigStage"
      :selected-color-label="selectedColorLabel"
      :selected-option-ids="selectedOptionIds"
      :selected-trim-label="selectedTrimLabel"
      :selected-wheels-label="selectedWheelsLabel"
      :total-steps="storySteps.length"
      @navigate-step="handleNavigateStep"
      @select-option="selectOption"
    />

    <ShowroomDebugPanel
      v-if="debugPanelEnabled"
      v-model="debugTuning"
      :current-profile="cameraInputProfile"
      :progress="cameraProgress"
      :review-mode="reviewMode"
      :scroll-velocity="cameraVelocity"
      :step-stage="preConfigStage ? 'intro' : 'config'"
      @apply-preset="applyDebugPreset"
      @jump-to-final="jumpToFinalFraming"
      @jump-to-hero="jumpToHeroFraming"
      @save-baseline="saveDebugBaseline"
    />
  </section>
</template>

<style scoped>
.showroom-shell {
  position: relative;
  width: 100vw;
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #05070b;
  isolation: isolate;
}

.showroom-switches {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 7;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.showroom-switch {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  min-height: 2.5rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(7, 10, 15, 0.72);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.9);
  pointer-events: auto;
  cursor: pointer;
}

.showroom-progress-rail {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  pointer-events: none;
}

.showroom-progress-rail-track {
  overflow: hidden;
  height: 0.34rem;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.12);
}

.showroom-progress-rail-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(207, 157, 94, 0.9), rgba(240, 208, 168, 1));
}

.showroom-switch span {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.showroom-canvas-fallback {
  display: grid;
  height: 100%;
  min-height: inherit;
  place-items: center;
  color: rgba(255, 255, 255, 0.82);
  background:
    radial-gradient(circle at top, rgba(196, 151, 87, 0.28), transparent 38%),
    linear-gradient(180deg, rgba(8, 10, 14, 0.98), rgba(13, 18, 24, 0.92));
}

:deep(.showroom-canvas-placeholder),
:deep(.showroom-canvas-placeholder-fallback) {
  height: 100%;
  min-height: inherit;
  border: 0;
  border-radius: inherit;
}

:deep(.showroom-canvas-content) {
  min-height: inherit;
  padding: 1.2rem;
}

:deep(.showroom-canvas-badges) {
  justify-content: end;
}

@media (max-width: 767px) {
  .showroom-progress-rail {
    top: 0;
  }

  .showroom-shell {
    height: 100svh;
    min-height: 100svh;
  }

  /* Move day/night switches to top right in mobile to be completely out of the way */
  .showroom-switches {
    top: 1rem;
    right: 1rem;
    bottom: auto;
    left: auto;
    transform: scale(0.9);
    transform-origin: top right;
  }

  :deep(.showroom-canvas-content) {
    padding: 0.9rem;
  }

  /*
   * Constrain the Three.js host to only the area above the bottom dock (~9rem tall).
   * resizeScene() reads hostRef.clientHeight, so the renderer renders into this
   * smaller rect and the camera naturally centers the car in the visible viewport.
   */
  :deep(.showroom-canvas-placeholder) {
    height: calc(100svh - 9rem);
    min-height: unset;
  }
}
</style>
