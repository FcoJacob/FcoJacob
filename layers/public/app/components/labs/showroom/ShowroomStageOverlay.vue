<script setup lang="ts">
const props = defineProps<{
  activeStep: {
    eyebrow: string
    title: string
    description: string
  }
  activeStepIndex: number
  introPhase: 'booting' | 'staged' | 'entering' | 'interactive'
  motionDurationMs: number
  motionOffsetPx: number
  posterSrc: string
  progressPercentage: string
  reviewMode: boolean
  totalSteps: number
  transitionDirection: 'forward' | 'backward'
  transitionPhase: 'idle' | 'out' | 'in'
  vehicleName: string
  environmentLabel: string
}>()

const emit = defineEmits<{
  enter: []
}>()

const { t } = useI18n()
const activeCardRef = useTemplateRef<HTMLElement>('activeCard')

const stepCounter = computed(() => {
  const current = String(props.activeStepIndex + 1).padStart(2, '0')
  const total = String(props.totalSteps).padStart(2, '0')

  return `${current} / ${total}`
})

const introStateLabel = computed(() => {
  if (props.introPhase === 'booting') {
    return t('labs_showroom.overlay.loading_state')
  }

  if (props.introPhase === 'entering') {
    return t('labs_showroom.overlay.entering_state')
  }

  return t('labs_showroom.overlay.ready_state')
})

const activeSalesNarrative = computed(() => {
  if (props.activeStepIndex <= 1) {
    return t('labs_showroom.overlay.sales_narrative_discovery')
  }

  if (props.activeStepIndex === 2) {
    return t('labs_showroom.overlay.sales_narrative_focus')
  }

  return t('labs_showroom.overlay.sales_narrative_config')
})

function focusActiveCard() {
  activeCardRef.value?.focus({ preventScroll: true })
}

defineExpose({
  focusActiveCard,
})
</script>

<template>
  <div
    class="showroom-stage-overlay-root"
    :style="{
      '--showroom-overlay-duration': `${motionDurationMs}ms`,
      '--showroom-overlay-offset': `${motionOffsetPx}px`,
    }"
  >
    <Transition name="showroom-editorial-fade">
      <div
        v-if="introPhase !== 'interactive'"
        class="showroom-editorial-gate"
        :data-intro-phase="introPhase"
      >
        <img
          :src="posterSrc"
          :alt="t('labs_showroom.poster_alt')"
          class="showroom-editorial-image"
        />
        <div class="showroom-editorial-scrim" />

        <div class="showroom-editorial-panel">
          <div class="showroom-editorial-topline">
            <span>{{ t('labs_showroom.overlay.entry_label') }}</span>
            <span>{{ introStateLabel }}</span>
          </div>

          <p class="showroom-editorial-eyebrow">{{ activeStep.eyebrow }}</p>
          <h2 class="showroom-editorial-title">{{ activeStep.title }}</h2>
          <p class="showroom-editorial-copy">{{ activeStep.description }}</p>
          <p class="showroom-editorial-support">
            {{ t('labs_showroom.overlay.editorial_sales_copy') }}
          </p>

          <div class="showroom-editorial-offer">
            <p class="showroom-editorial-offer-label">
              {{ t('labs_showroom.overlay.offer_kicker') }}
            </p>
            <p class="showroom-editorial-offer-copy">
              {{ t('labs_showroom.overlay.offer_copy', { vehicle: vehicleName }) }}
            </p>
          </div>

          <div class="showroom-editorial-footer">
            <div class="showroom-editorial-metrics">
              <span>{{ vehicleName }}</span>
              <span>{{ environmentLabel }}</span>
              <span>{{ stepCounter }}</span>
            </div>

            <div class="showroom-editorial-progress" aria-hidden="true">
              <span :style="{ width: progressPercentage }" />
            </div>

            <p class="showroom-editorial-hint">{{ t('labs_showroom.overlay.enter_hint') }}</p>

            <NuxtLink to="/labs" class="showroom-editorial-link">
              {{ t('labs_showroom.back_to_labs') }}
            </NuxtLink>

            <button
              v-if="introPhase === 'staged'"
              type="button"
              class="showroom-editorial-button"
              @click="emit('enter')"
            >
              {{ t('labs_showroom.enter_cta') }}
            </button>

            <div v-else class="showroom-editorial-loading" aria-live="polite">
              <span>{{ t('common.loading') }}</span>
              <span>{{ progressPercentage }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition :mode="reviewMode ? 'out-in' : undefined" name="showroom-overlay-card">
      <article
        v-if="introPhase === 'interactive'"
        ref="activeCard"
        :key="activeStepIndex"
        class="showroom-step-overlay"
        :data-direction="transitionDirection"
        :data-phase="transitionPhase"
        tabindex="-1"
        aria-live="polite"
      >
        <div class="showroom-step-overlay-topline">
          <p class="showroom-step-overlay-eyebrow">{{ activeStep.eyebrow }}</p>
          <span class="showroom-step-overlay-counter">{{ stepCounter }}</span>
        </div>

        <h2 class="showroom-step-overlay-title">{{ activeStep.title }}</h2>
        <p class="showroom-step-overlay-copy">{{ activeStep.description }}</p>
        <p class="showroom-step-overlay-support">{{ activeSalesNarrative }}</p>
      </article>
    </Transition>
  </div>
</template>

<style scoped>
.showroom-stage-overlay-root {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.showroom-editorial-gate {
  position: absolute;
  inset: 0;
  display: grid;
  align-items: end;
  padding: clamp(1.25rem, 3vw, 2rem);
  pointer-events: auto;
}

.showroom-editorial-image,
.showroom-editorial-scrim {
  position: absolute;
  inset: 0;
}

.showroom-editorial-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.34;
  filter: saturate(0.85) blur(2px);
  transform: scale(1.04);
}

.showroom-editorial-scrim {
  background:
    radial-gradient(circle at 20% 20%, rgba(204, 155, 88, 0.24), transparent 34%),
    linear-gradient(180deg, rgba(5, 7, 10, 0.26), rgba(5, 7, 10, 0.8) 72%),
    linear-gradient(90deg, rgba(5, 7, 10, 0.92), rgba(5, 7, 10, 0.3) 58%, rgba(5, 7, 10, 0.82));
}

.showroom-editorial-panel {
  position: relative;
  display: grid;
  gap: 1rem;
  max-width: min(42rem, 100%);
  padding: clamp(1.25rem, 2.4vw, 2rem);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.75rem;
  background: linear-gradient(180deg, rgba(11, 15, 20, 0.74), rgba(11, 15, 20, 0.56));
  backdrop-filter: blur(18px);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
}

.showroom-editorial-gate[data-intro-phase='entering'] .showroom-editorial-panel {
  transform: translateY(28px) scale(0.985);
  opacity: 0;
}

.showroom-editorial-gate[data-intro-phase='entering'] .showroom-editorial-image {
  transform: scale(1.08);
  opacity: 0.22;
}

.showroom-editorial-topline,
.showroom-editorial-metrics,
.showroom-step-overlay-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.showroom-editorial-topline span,
.showroom-editorial-metrics span,
.showroom-step-overlay-counter {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0.32rem 0.72rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 248, 236, 0.82);
  background: rgba(255, 255, 255, 0.04);
}

.showroom-editorial-eyebrow,
.showroom-step-overlay-eyebrow {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
}

.showroom-editorial-title,
.showroom-step-overlay-title {
  margin: 0;
  font-size: clamp(2.1rem, 5vw, 4.8rem);
  font-weight: 600;
  line-height: 0.94;
  letter-spacing: -0.05em;
  color: white;
}

.showroom-step-overlay-title {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
}

.showroom-editorial-copy,
.showroom-editorial-support,
.showroom-step-overlay-copy,
.showroom-step-overlay-support {
  margin: 0;
  max-width: 38rem;
  font-size: 1rem;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.8);
}

.showroom-editorial-support {
  color: rgba(255, 255, 255, 0.56);
}

.showroom-step-overlay-support {
  color: rgba(255, 244, 226, 0.74);
}

.showroom-editorial-offer {
  display: grid;
  gap: 0.25rem;
  width: fit-content;
  max-width: min(34rem, 100%);
  padding: 0.8rem 0.95rem;
  border: 1px solid rgba(207, 157, 94, 0.2);
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(207, 157, 94, 0.12), rgba(255, 255, 255, 0.03));
}

.showroom-editorial-offer-label {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 244, 226, 0.72);
}

.showroom-editorial-offer-copy {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.65;
  color: rgba(255, 248, 236, 0.88);
}

.showroom-editorial-footer {
  display: grid;
  gap: 0.9rem;
}

.showroom-editorial-progress {
  overflow: hidden;
  height: 0.32rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.showroom-editorial-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #cf9d5e, #f0d0a8);
}

.showroom-editorial-hint {
  margin: 0;
  max-width: 30rem;
  font-size: 0.85rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.62);
}

.showroom-editorial-button,
.showroom-editorial-loading {
  width: fit-content;
  min-width: 12rem;
  min-height: 3rem;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.showroom-editorial-link {
  width: fit-content;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
}

.showroom-editorial-link:hover {
  color: white;
}

.showroom-editorial-button {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.9);
  color: #0c1118;
  transition:
    transform 180ms ease,
    background-color 180ms ease;
}

.showroom-editorial-button:hover {
  transform: translateY(-1px);
  background: white;
}

.showroom-editorial-button:focus-visible,
.showroom-step-overlay:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.88);
  outline-offset: 3px;
}

.showroom-editorial-loading {
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}

.showroom-step-overlay {
  position: absolute;
  top: clamp(1.35rem, 3.4vw, 2.65rem);
  left: clamp(1rem, 2.8vw, 2rem);
  display: grid;
  gap: 0.9rem;
  width: min(34rem, calc(100% - 2rem));
  padding: 1.2rem 1.2rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  background: linear-gradient(180deg, rgba(8, 12, 17, 0.68), rgba(8, 12, 17, 0.42));
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
  pointer-events: auto;
}

.showroom-step-overlay[data-phase='out'][data-direction='forward'] {
  transform: translateY(calc(var(--showroom-overlay-offset, 12px) * -1));
  opacity: 0.22;
}

.showroom-step-overlay[data-phase='out'][data-direction='backward'] {
  transform: translateY(var(--showroom-overlay-offset, 12px));
  opacity: 0.22;
}

.showroom-step-overlay[data-phase='in'] {
  transform: translateY(0);
  opacity: 1;
}

.showroom-step-overlay-copy {
  max-width: 32rem;
  font-size: 0.95rem;
}

.showroom-editorial-fade-enter-active,
.showroom-editorial-fade-leave-active,
.showroom-overlay-card-enter-active,
.showroom-overlay-card-leave-active {
  transition:
    opacity var(--showroom-overlay-duration, 320ms) ease,
    transform var(--showroom-overlay-duration, 320ms) cubic-bezier(0.22, 1, 0.36, 1);
}

.showroom-editorial-fade-enter-from,
.showroom-editorial-fade-leave-to,
.showroom-overlay-card-enter-from,
.showroom-overlay-card-leave-to {
  opacity: 0;
}

.showroom-editorial-fade-enter-from .showroom-editorial-panel,
.showroom-editorial-fade-leave-to .showroom-editorial-panel {
  transform: translateY(24px);
}

.showroom-overlay-card-enter-from .showroom-step-overlay,
.showroom-overlay-card-leave-to .showroom-step-overlay {
  transform: translateY(calc(var(--showroom-overlay-offset, 16px) * -1));
}

@media (max-width: 767px) {
  .showroom-editorial-gate {
    align-items: end;
    padding: 1rem;
  }

  .showroom-editorial-panel,
  .showroom-step-overlay {
    width: 100%;
    max-width: none;
  }

  .showroom-step-overlay {
    top: 1.4rem;
    left: 1rem;
    width: calc(100% - 2rem);
  }

  .showroom-editorial-title,
  .showroom-step-overlay-title {
    font-size: clamp(1.9rem, 9vw, 3.2rem);
  }
}
</style>
