<script setup lang="ts">
import {
  showroomDebugStorageKeys,
  showroomMagicMousePreset,
  showroomReviewModePreset,
  showroomTrackpadPreset,
} from '../../../utils/labs/showroom/debug'
import type {
  ShowroomDebugTuning,
  ShowroomWheelInputProfile,
} from '../../../utils/labs/showroom/debug'

const emit = defineEmits<{
  applyPreset: ['trackpad' | 'magic-mouse' | 'review']
  jumpToFinal: []
  jumpToHero: []
  saveBaseline: ['trackpad' | 'magic-mouse']
}>()

const props = defineProps<{
  currentProfile: ShowroomWheelInputProfile
  progress: number
  reviewMode: boolean
  scrollVelocity: number
  stepStage: 'intro' | 'approach' | 'focus' | 'config'
}>()

const tuning = defineModel<ShowroomDebugTuning>({ required: true })
const panelRef = useTemplateRef<HTMLElement>('panel')
const isCollapsed = shallowRef(false)
const panelPosition = reactive({ x: 16, y: 16 })

let dragPointerId: number | null = null
let dragOffsetX = 0
let dragOffsetY = 0

type DebugControl = {
  key: keyof ShowroomDebugTuning
  label: string
  min: number
  max: number
  step: number
}

const wheelControls: DebugControl[] = [
  {
    key: 'trackpadMultiplier',
    label: 'Trackpad multiplier',
    min: 0.0005,
    max: 0.006,
    step: 0.0001,
  },
  {
    key: 'magicMouseMultiplier',
    label: 'Magic Mouse multiplier',
    min: 0.0008,
    max: 0.01,
    step: 0.0002,
  },
  { key: 'wheelMultiplier', label: 'Wheel multiplier', min: 0.001, max: 0.016, step: 0.0002 },
]

const framingControls: DebugControl[] = [
  { key: 'globalZoomScale', label: 'Global zoom scale', min: 0.6, max: 1.6, step: 0.02 },
  { key: 'compactCurvePower', label: 'Mobile curve power', min: 0.7, max: 1.4, step: 0.02 },
  { key: 'wideCurvePower', label: 'Desktop curve power', min: 0.8, max: 1.6, step: 0.02 },
  { key: 'focusDistanceDrift', label: 'Focus distance drift', min: 0.08, max: 0.48, step: 0.01 },
  { key: 'focusHeightDrift', label: 'Focus height drift', min: 0, max: 0.3, step: 0.01 },
  { key: 'finalDistanceRelief', label: 'Final distance relief', min: 0.1, max: 1.2, step: 0.02 },
  { key: 'finalHeightRelief', label: 'Final height relief', min: 0, max: 0.6, step: 0.01 },
  { key: 'finalLookAtLift', label: 'Final look-at lift', min: 0, max: 0.24, step: 0.01 },
]

function formatValue(value: number) {
  return value < 0.01 ? value.toFixed(5) : value.toFixed(2)
}

function savePanelPosition() {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(
    showroomDebugStorageKeys.panelPosition,
    JSON.stringify({
      x: panelPosition.x,
      y: panelPosition.y,
    }),
  )
}

function saveCollapsedState() {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(showroomDebugStorageKeys.panelCollapsed, JSON.stringify(isCollapsed.value))
}

function applyPreset(type: 'trackpad' | 'magic-mouse' | 'review', preset: ShowroomDebugTuning) {
  Object.assign(tuning.value, preset)
  emit('applyPreset', type)
}

function clampPosition(nextX: number, nextY: number) {
  if (!import.meta.client) {
    panelPosition.x = nextX
    panelPosition.y = nextY
    return
  }

  const panelWidth = panelRef.value?.offsetWidth ?? 360
  const panelHeight = panelRef.value?.offsetHeight ?? 520
  panelPosition.x = Math.min(Math.max(nextX, 12), Math.max(window.innerWidth - panelWidth - 12, 12))
  panelPosition.y = Math.min(
    Math.max(nextY, 12),
    Math.max(window.innerHeight - panelHeight - 12, 12),
  )
}

function handlePointerMove(event: PointerEvent) {
  if (dragPointerId !== event.pointerId) {
    return
  }

  clampPosition(event.clientX - dragOffsetX, event.clientY - dragOffsetY)
  savePanelPosition()
}

function stopDrag() {
  if (dragPointerId === null) {
    return
  }

  savePanelPosition()
  dragPointerId = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopDrag)
}

function startDrag(event: PointerEvent) {
  if (!(event.target instanceof HTMLElement) || event.target.closest('button')) {
    return
  }

  dragPointerId = event.pointerId
  dragOffsetX = event.clientX - panelPosition.x
  dragOffsetY = event.clientY - panelPosition.y
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopDrag)
}

onMounted(() => {
  const savedCollapsed = localStorage.getItem(showroomDebugStorageKeys.panelCollapsed)

  if (savedCollapsed) {
    try {
      isCollapsed.value = JSON.parse(savedCollapsed) as boolean
    } catch {
      localStorage.removeItem(showroomDebugStorageKeys.panelCollapsed)
    }
  }

  const savedPosition = localStorage.getItem(showroomDebugStorageKeys.panelPosition)

  if (savedPosition) {
    try {
      const parsed = JSON.parse(savedPosition) as { x?: number; y?: number }
      clampPosition(parsed.x ?? window.innerWidth - 380, parsed.y ?? 16)
      return
    } catch {
      localStorage.removeItem(showroomDebugStorageKeys.panelPosition)
    }
  }

  clampPosition(window.innerWidth - 380, 16)
})

watch(
  panelPosition,
  (nextPosition) => {
    localStorage.setItem(showroomDebugStorageKeys.panelPosition, JSON.stringify(nextPosition))
  },
  { deep: true },
)

watch(isCollapsed, () => {
  saveCollapsedState()
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('beforeunload', savePanelPosition)
  }

  savePanelPosition()
  stopDrag()
})

if (import.meta.client) {
  window.addEventListener('beforeunload', savePanelPosition)
}
</script>

<template>
  <section
    ref="panel"
    class="showroom-debug"
    :style="{
      left: `${panelPosition.x}px`,
      top: `${panelPosition.y}px`,
    }"
  >
    <header class="showroom-debug-header" @pointerdown="startDrag">
      <div>
        <p class="showroom-debug-summary">Showroom debug</p>
        <p class="showroom-debug-subtitle">Drag anywhere on this bar</p>
      </div>

      <button type="button" class="showroom-debug-toggle" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? 'Open' : 'Close' }}
      </button>
    </header>

    <div v-if="!isCollapsed" class="showroom-debug-body" data-showroom-scroll-surface="true">
      <div class="showroom-debug-status">
        <span>Input: {{ currentProfile }}</span>
        <span>Velocity: {{ scrollVelocity.toFixed(2) }}</span>
        <span>Progress: {{ Math.round(progress * 100) }}%</span>
        <span>Stage: {{ stepStage }}</span>
      </div>

      <section class="showroom-debug-group">
        <h3 class="showroom-debug-title">Presets</h3>
        <div class="showroom-debug-actions">
          <button
            type="button"
            class="showroom-debug-button"
            @click="applyPreset('trackpad', showroomTrackpadPreset)"
          >
            Trackpad
          </button>
          <button
            type="button"
            class="showroom-debug-button"
            @click="applyPreset('magic-mouse', showroomMagicMousePreset)"
          >
            Magic Mouse
          </button>
          <button
            type="button"
            class="showroom-debug-button"
            :data-active="reviewMode"
            @click="applyPreset('review', showroomReviewModePreset)"
          >
            Review mode
          </button>
        </div>
        <div class="showroom-debug-actions showroom-debug-actions-secondary">
          <button
            type="button"
            class="showroom-debug-button showroom-debug-button-secondary"
            @click="emit('saveBaseline', 'trackpad')"
          >
            Guardar baseline Trackpad
          </button>
          <button
            type="button"
            class="showroom-debug-button showroom-debug-button-secondary"
            @click="emit('saveBaseline', 'magic-mouse')"
          >
            Guardar baseline Magic Mouse
          </button>
        </div>
      </section>

      <section class="showroom-debug-group">
        <h3 class="showroom-debug-title">Review framing</h3>
        <div class="showroom-debug-actions">
          <button type="button" class="showroom-debug-button" @click="emit('jumpToHero')">
            Hero framing
          </button>
          <button type="button" class="showroom-debug-button" @click="emit('jumpToFinal')">
            Final framing
          </button>
        </div>
      </section>

      <section class="showroom-debug-group">
        <h3 class="showroom-debug-title">Wheel tuning</h3>
        <label v-for="control in wheelControls" :key="control.key" class="showroom-debug-control">
          <span>{{ control.label }}</span>
          <input
            v-model.number="tuning[control.key]"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            type="range"
          />
          <output>{{ formatValue(tuning[control.key]) }}</output>
        </label>
      </section>

      <section class="showroom-debug-group">
        <h3 class="showroom-debug-title">Camera framing</h3>
        <label v-for="control in framingControls" :key="control.key" class="showroom-debug-control">
          <span>{{ control.label }}</span>
          <input
            v-model.number="tuning[control.key]"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            type="range"
          />
          <output>{{ formatValue(tuning[control.key]) }}</output>
        </label>
      </section>
    </div>
  </section>
</template>

<style scoped>
.showroom-debug {
  position: absolute;
  z-index: 6;
  width: min(24rem, calc(100vw - 2rem));
  padding: 0.85rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  background: rgba(7, 10, 15, 0.88);
  color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
  touch-action: none;
}

.showroom-debug-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  cursor: grab;
  user-select: none;
}

.showroom-debug-summary {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.showroom-debug-subtitle {
  margin: 0.28rem 0 0;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.52);
}

.showroom-debug-toggle,
.showroom-debug-button {
  min-height: 2rem;
  padding: 0.45rem 0.72rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.showroom-debug-button-secondary {
  background: rgba(207, 157, 94, 0.12);
  border-color: rgba(207, 157, 94, 0.24);
}

.showroom-debug-body {
  display: grid;
  gap: 0;
  max-height: calc(100dvh - 5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.showroom-debug-status {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.8rem;
  font-size: 0.73rem;
  color: rgba(255, 255, 255, 0.62);
}

.showroom-debug-group {
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
}

.showroom-debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.showroom-debug-actions-secondary {
  margin-top: -0.2rem;
}

.showroom-debug-title {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.showroom-debug-control {
  display: grid;
  gap: 0.28rem;
}

.showroom-debug-control span,
.showroom-debug-control output {
  font-size: 0.74rem;
}

.showroom-debug-control input {
  width: 100%;
}

@media (max-width: 767px) {
  .showroom-debug {
    width: min(22rem, calc(100vw - 1.5rem));
  }
}
</style>
