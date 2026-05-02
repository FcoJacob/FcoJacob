<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type ShowroomOption = {
  id: string
  label: string
  value: string
}

type ShowroomOptionGroup = {
  id: string
  label: string
  type: string
  options: ShowroomOption[]
}

const props = defineProps<{
  activeConfigGroup: ShowroomOptionGroup | null
  activeConfigDisplayLabel: string | null
  activeStepIndex: number
  activeStepLabel: string
  environmentLabel: string
  hasDebugSwitch: boolean
  heroName: string
  interactionEnabled: boolean
  manifestPhase: string
  preConfigStage: boolean
  selectedColorLabel: string
  selectedOptionIds: Record<string, string | undefined>
  selectedTrimLabel: string
  selectedWheelsLabel: string
  totalSteps: number
}>()

const emit = defineEmits<{
  selectOption: [groupId: string, optionId: string]
  navigateStep: [direction: 'prev' | 'next' | 'back-to-labs']
}>()

const { t } = useI18n()

// Only essential strings kept for minimalist luxury design
function getLocalizedGroupLabel(groupId: string, fallback: string) {
  if (groupId === 'exterior-color') return t('labs_showroom.configurator.group_exterior_color')
  if (groupId === 'trim-package') return t('labs_showroom.configurator.group_trim_package')
  if (groupId === 'wheel-set') return t('labs_showroom.configurator.group_wheel_set')
  if (groupId === 'satin-tone') return t('labs_showroom.configurator.group_satin_tone')
  if (groupId === 'paint-treatment') return t('labs_showroom.configurator.group_paint_treatment')
  return fallback
}

function getLocalizedOptionLabel(groupId: string, option: ShowroomOption) {
  if (groupId === 'satin-tone') {
    if (option.id === 'gloss') return t('labs_showroom.configurator.option_gloss')
    if (option.id === 'matte') return t('labs_showroom.configurator.option_matte')
  }
  if (groupId === 'paint-treatment') {
    if (option.id === 'standard') return t('labs_showroom.configurator.option_treatment_standard')
    if (option.id === 'ppf') return t('labs_showroom.configurator.option_treatment_ppf')
    if (option.id === 'ceramic') return t('labs_showroom.configurator.option_treatment_ceramic')
  }
  return option.label
}
</script>

<template>
  <Transition name="showroom-dock-fade">
    <aside
      v-if="interactionEnabled"
      class="showroom-dock-sleek"
      :class="{ 'is-preconfig': preConfigStage }"
      :style="{ '--dock-offset': hasDebugSwitch ? '3.75rem' : '0px' }"
    >
      <!-- Back button sits OUTSIDE the panel so overflow:hidden doesn't clip it -->
      <button class="dock-sleek-mobile-back-btn" @click="emit('navigateStep', 'back-to-labs')">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="dock-sleek-panel">
        <!-- TOP: Main Identity & Car Info -->
        <header class="dock-sleek-header">
          <div class="dock-sleek-brand-row">
            <span class="dock-sleek-badge">{{ manifestPhase }}</span>
            <span class="dock-sleek-badge outline">{{ environmentLabel }}</span>
          </div>
          <h2 class="dock-sleek-hero-title">{{ heroName }}</h2>
          <p class="dock-sleek-price-guide">{{ t('labs_showroom.dock.sales_badge') }}</p>
        </header>

        <!-- MIDDLE: Configuration or Preview -->
        <div class="dock-sleek-body">
          <Transition name="showroom-dock-content-swap" mode="out-in">
            <!-- PRE-CONFIG: Hero Preview Specs -->
            <div v-if="preConfigStage" class="dock-sleek-preview" key="preview">
              <p class="dock-sleek-preview-copy">{{ t('labs_showroom.dock.hero_preview_copy') }}</p>

              <div class="dock-sleek-specs-list">
                <div class="dock-sleek-spec-item">
                  <span class="dock-spec-label">{{ t('labs_showroom.dock.spec_color') }}</span>
                  <span class="dock-spec-value">{{ selectedColorLabel }}</span>
                </div>
                <div class="dock-sleek-spec-item">
                  <span class="dock-spec-label">{{ t('labs_showroom.dock.spec_wheels') }}</span>
                  <span class="dock-spec-value">{{ selectedWheelsLabel }}</span>
                </div>
                <div class="dock-sleek-spec-item">
                  <span class="dock-spec-label">{{ t('labs_showroom.dock.spec_trim') }}</span>
                  <span class="dock-spec-value">{{ selectedTrimLabel }}</span>
                </div>
              </div>
            </div>

            <!-- CONFIG STAGE: Selection Panel -->
            <div
              v-else-if="activeConfigGroup"
              class="dock-sleek-config"
              :key="activeConfigGroup.id"
            >
              <div class="dock-sleek-config-head">
                <h3 class="dock-config-group-title">
                  {{
                    activeConfigDisplayLabel ??
                    getLocalizedGroupLabel(activeConfigGroup.id, activeConfigGroup.label)
                  }}
                </h3>
                <p class="dock-config-group-subtitle">
                  <!-- Show name of selected option if any -->
                  <template v-for="option in activeConfigGroup.options" :key="option.id">
                    <span v-if="selectedOptionIds[activeConfigGroup.id] === option.id">{{
                      getLocalizedOptionLabel(activeConfigGroup.id, option)
                    }}</span>
                  </template>
                </p>
              </div>

              <div class="dock-sleek-options-grid" :class="'grid-' + activeConfigGroup.type">
                <button
                  v-for="option in activeConfigGroup.options"
                  :key="option.id"
                  class="dock-sleek-option"
                  :class="[
                    { 'is-active': selectedOptionIds[activeConfigGroup.id] === option.id },
                    `option-style-${option.id}`,
                  ]"
                  :aria-pressed="selectedOptionIds[activeConfigGroup.id] === option.id"
                  @click="emit('selectOption', activeConfigGroup.id, option.id)"
                >
                  <!-- The visual swatch / graphic representation -->
                  <span
                    v-if="activeConfigGroup.type === 'color'"
                    class="dock-sleek-color-block"
                    :style="{
                      background: `linear-gradient(135deg, ${option.value} 0%, color-mix(in srgb, ${option.value} 40%, #000) 100%)`,
                    }"
                  />
                  <span
                    v-else-if="activeConfigGroup.type === 'wheels'"
                    class="dock-sleek-abstract-block wheel-block"
                  >
                    <span class="wheel-spoke" />
                    <span class="wheel-spoke" />
                    <span class="wheel-spoke" />
                  </span>
                  <span
                    v-else-if="activeConfigGroup.type === 'finish'"
                    class="dock-sleek-abstract-block finish-block"
                  >
                  </span>
                  <span
                    v-else-if="activeConfigGroup.type === 'coating'"
                    class="dock-sleek-abstract-block coating-block"
                    :class="'coating-' + option.id"
                  >
                  </span>
                  <span
                    v-else-if="activeConfigGroup.type === 'trim'"
                    class="dock-sleek-abstract-block trim-block"
                  >
                  </span>

                  <span
                    class="dock-sleek-option-label"
                    :class="{ 'with-visual': activeConfigGroup.type !== 'color' }"
                    >{{ getLocalizedOptionLabel(activeConfigGroup.id, option) }}</span
                  >
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- BOTTOM: Actions & Status -->
        <footer class="dock-sleek-footer">
          <div class="dock-sleek-status">
            <span class="active-stage-label">{{ activeStepLabel }}</span>
          </div>

          <!-- Mobile step navigation -->
          <div class="dock-sleek-mobile-nav" aria-label="Navigate steps">
            <button
              type="button"
              class="dock-sleek-nav-btn"
              :disabled="activeStepIndex <= 0"
              :aria-label="t('labs_showroom.dock.nav_prev')"
              @click="emit('navigateStep', 'prev')"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M10 12L6 8l4-4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <span class="dock-sleek-step-counter">
              {{ String(activeStepIndex + 1).padStart(2, '0') }} /
              {{ String(totalSteps).padStart(2, '0') }}
            </span>
            <button
              type="button"
              class="dock-sleek-nav-btn"
              :disabled="activeStepIndex >= totalSteps - 1"
              :aria-label="t('labs_showroom.dock.nav_next')"
              @click="emit('navigateStep', 'next')"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <NuxtLink to="/labs" class="dock-sleek-btn-primary">
            {{ t('labs_showroom.back_to_labs') }}
          </NuxtLink>
        </footer>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
/* Minimalist, Sales-Focused Auto Configurator Dock */
.showroom-dock-sleek {
  position: absolute;
  top: max(calc(1rem + var(--dock-offset, 0px)), 5dvh);
  right: clamp(1rem, 2.4vw, 2rem);
  bottom: clamp(1rem, 2.4vw, 2rem);
  display: flex;
  flex-direction: column;
  z-index: 4;
  width: min(22rem, calc(100% - 2rem));
  max-height: calc(100vh - 2rem - var(--dock-offset, 0px));
}

.showroom-dock-sleek.is-preconfig {
  bottom: auto;
}

/* Glassmorphism Panel */
.dock-sleek-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.2rem;
  background: linear-gradient(160deg, rgba(8, 12, 17, 0.85), rgba(4, 6, 9, 0.95));
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  padding: 1.5rem;
  gap: 1.5rem;
}

/* Header Area */
.dock-sleek-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 0 0 auto;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dock-sleek-brand-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.dock-sleek-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(207, 157, 94, 0.9);
  background: rgba(207, 157, 94, 0.12);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(207, 157, 94, 0.2);
}

.dock-sleek-badge.outline {
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dock-sleek-hero-title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: #fff;
}

.dock-sleek-price-guide {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

/* Middle Body Area */
.dock-sleek-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
}
.dock-sleek-body::-webkit-scrollbar {
  display: none;
}

/* Pre-Config Specs */
.dock-sleek-preview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dock-sleek-preview-copy {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}

.dock-sleek-specs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 1.25rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.dock-sleek-spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 0.5rem;
}
.dock-sleek-spec-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dock-spec-label {
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

.dock-spec-value {
  color: #fff;
  font-weight: 500;
}

/* Options Config Area */
.dock-sleek-config {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dock-sleek-config-head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.dock-config-group-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 400;
  color: #fff;
}

.dock-config-group-subtitle {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(207, 157, 94, 0.9);
}

/* Options Grid */
.dock-sleek-options-grid {
  display: grid;
  gap: 0.85rem;
}

.dock-sleek-options-grid.grid-color {
  grid-template-columns: repeat(2, 1fr);
}

.dock-sleek-options-grid:not(.grid-color) {
  grid-template-columns: 1fr;
}

/* Option Buttons */
.dock-sleek-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.8rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.dock-sleek-options-grid:not(.grid-color) .dock-sleek-option {
  flex-direction: row;
  justify-content: flex-start;
  padding: 1rem;
  gap: 1rem;
}

.dock-sleek-option:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.dock-sleek-option.is-active {
  background: rgba(207, 157, 94, 0.06);
  border-color: rgba(207, 157, 94, 0.5);
  box-shadow: 0 0 0 1px rgba(207, 157, 94, 0.1) inset;
}

/* Colors & Abstract Graphics */
.dock-sleek-color-block {
  width: 100%;
  height: 4.5rem;
  border-radius: 0.5rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease;
}

.dock-sleek-abstract-block {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease;
}

/* Wheel specific visuals */
.wheel-block {
  background: linear-gradient(135deg, #333, #111);
  border: 2px solid #555;
}
.option-style-forged .wheel-block {
  background: linear-gradient(135deg, #1f2226, #000);
  border: 2px solid #2a2d32;
}
.wheel-spoke {
  position: absolute;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
}
.wheel-spoke:nth-child(2) {
  transform: rotate(60deg);
}
.wheel-spoke:nth-child(3) {
  transform: rotate(120deg);
}

/* Trim specific visuals */
.option-style-satin .trim-block {
  background: linear-gradient(135deg, #e6e8eb, #9ea3a8);
  border-radius: 0.4rem;
}
.option-style-shadow .trim-block {
  background: linear-gradient(135deg, #2b2e33, #0f1115);
  border-radius: 0.4rem;
}

/* Finish (Gloss/Satin) specific visuals */
.option-style-gloss .finish-block {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1));
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.5),
    0 0 5px rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
.option-style-matte .finish-block {
  background: linear-gradient(135deg, rgba(120, 120, 120, 0.5), rgba(60, 60, 60, 0.5));
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  filter: blur(0.5px);
}

/* Paint treatment (Coating) specific visuals */
.coating-block {
  border-radius: 50%;
  transition: background 0.25s ease;
}
.coating-standard .coating-block {
  background: linear-gradient(135deg, rgba(180, 180, 180, 0.4), rgba(80, 80, 80, 0.4));
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.4);
}
.coating-ppf .coating-block {
  background: linear-gradient(135deg, rgba(210, 230, 250, 0.5), rgba(120, 160, 200, 0.3));
  box-shadow:
    inset 0 0 6px rgba(150, 200, 255, 0.3),
    0 0 4px rgba(100, 180, 255, 0.15);
}
.coating-ceramic .coating-block {
  background: conic-gradient(
    from 0deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(200, 220, 255, 0.6) 25%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(180, 210, 255, 0.5) 75%,
    rgba(255, 255, 255, 0.9) 100%
  );
  box-shadow:
    inset 0 0 12px rgba(255, 255, 255, 0.6),
    0 0 8px rgba(200, 230, 255, 0.3);
}

.dock-sleek-option:hover .dock-sleek-color-block,
.dock-sleek-option:hover .dock-sleek-abstract-block {
  transform: scale(1.05);
}

.dock-sleek-option-label {
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-sleek-option-label.with-visual {
  text-align: left;
}

.dock-sleek-option.is-active .dock-sleek-option-label {
  color: #fff;
  font-weight: 500;
}

/* Footer Area */
.dock-sleek-footer {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.dock-sleek-status {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.active-stage-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.3);
}

.dock-sleek-btn-primary {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1rem;
  border-radius: 0.6rem;
  background: rgba(207, 157, 94, 0.95);
  color: #000;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.02em;
}

.dock-sleek-btn-primary:hover {
  background: white;
  color: black;
}

/* Mobile step navigation (hidden on desktop) */
.dock-sleek-mobile-nav {
  display: none;
}

.dock-sleek-mobile-back-btn {
  display: none;
}

/* Transitions */
.showroom-dock-fade-enter-active,
.showroom-dock-fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.showroom-dock-fade-enter-from,
.showroom-dock-fade-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.showroom-dock-content-swap-enter-active,
.showroom-dock-content-swap-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.showroom-dock-content-swap-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}
.showroom-dock-content-swap-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* ─── Mobile: bottom sheet ───────────────────────────────────────────── */
@media (max-width: 767px) {
  /* ── Wrapper ── */
  .showroom-dock-sleek {
    position: absolute;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: none;
    border-radius: 0;
    /* MUST be visible so the back-btn absolute child floats above */
    overflow: visible;
    z-index: 6;
  }

  .showroom-dock-sleek.is-preconfig {
    bottom: 0;
  }

  /* ── Floating back button — child of <aside>, not the panel ── */
  .dock-sleek-mobile-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 100%;
    left: 1rem;
    margin-bottom: 0.5rem;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: rgba(8, 12, 17, 0.65);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
    z-index: 1;
  }

  .dock-sleek-mobile-back-btn:active {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(0.93);
  }

  /* ── Panel — overflow:visible so it never clips body content ── */
  .dock-sleek-panel {
    overflow: visible;
    border-radius: 1.5rem 1.5rem 0 0;
    padding: 0.75rem 1.25rem 1.25rem;
    gap: 0.85rem;
    box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.5);
    background: linear-gradient(160deg, rgba(8, 12, 17, 0.97), rgba(3, 5, 8, 0.99));
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-left: none;
    border-right: none;
    border-bottom: none;
    max-height: none;
  }

  /* Drag-handle pill */
  .dock-sleek-panel::before {
    content: '';
    display: block;
    width: 2.5rem;
    height: 0.22rem;
    margin: 0 auto 0.25rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    flex-shrink: 0;
  }

  /* ── Hide verbose sections ── */
  .dock-sleek-header,
  .dock-sleek-preview,
  .dock-sleek-status {
    display: none;
  }

  /* ── Body: transparent so the grid scroll container works ── */
  .dock-sleek-body {
    overflow: visible;
    flex: 0 0 auto;
    padding-bottom: 0;
  }

  /* ── Config section ── */
  .dock-sleek-config {
    gap: 0.6rem;
  }

  .dock-sleek-config-head {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    padding-bottom: 0;
    border-bottom: none;
  }

  .dock-config-group-title {
    font-size: 1rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
  }

  .dock-config-group-subtitle {
    font-size: 0.8rem;
    font-weight: 400;
    color: rgba(207, 157, 94, 0.9);
    text-align: right;
  }

  /* ── Options: self-contained scroll container ── */
  .dock-sleek-options-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    padding-right: 1.5rem;
    margin-right: -1.25rem;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
  }

  .dock-sleek-options-grid::-webkit-scrollbar {
    display: none;
  }

  .dock-sleek-options-grid.grid-color {
    display: flex;
  }

  /* ── Option card ── */
  .dock-sleek-option {
    flex: 0 0 auto;
    width: 5.5rem;
    height: auto;
    padding: 0.65rem 0.5rem;
    gap: 0.5rem;
    border-radius: 1rem;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    scroll-snap-align: start;
    touch-action: manipulation;
  }

  .dock-sleek-options-grid:not(.grid-color) .dock-sleek-option {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 6rem;
    padding: 0.75rem 0.5rem;
    gap: 0.5rem;
  }

  /* ── Swatches ── */
  .dock-sleek-color-block {
    width: 100%;
    height: 2.75rem;
    border-radius: 0.6rem;
    margin-bottom: 0.1rem;
  }

  .dock-sleek-abstract-block {
    width: 2.75rem;
    height: 2.75rem;
  }

  /* ── Labels ── */
  .dock-sleek-option-label {
    font-size: 0.75rem;
    text-align: center;
    white-space: normal;
    line-height: 1.25;
    overflow: visible;
    color: rgba(255, 255, 255, 0.7);
  }

  .dock-sleek-option-label.with-visual {
    text-align: center;
  }

  .dock-sleek-option.is-active .dock-sleek-option-label {
    color: #fff;
    font-weight: 600;
  }

  /* ── Footer ── */
  .dock-sleek-footer {
    gap: 0;
    padding-top: 0.5rem;
    border-top: none;
    margin-top: 0;
    flex-direction: column;
  }

  /* Desktop back-to-labs link hidden; floating back-btn replaces it */
  .dock-sleek-btn-primary {
    display: none;
  }

  /* ── Mobile nav row ── */
  .dock-sleek-mobile-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0;
    pointer-events: auto;
  }

  /* ── Prev / Next buttons ── */
  .dock-sleek-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.25rem;
    height: 3.25rem;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
    transition:
      background 0.15s ease,
      transform 0.1s ease;
  }

  .dock-sleek-nav-btn svg {
    width: 22px;
    height: 22px;
  }

  .dock-sleek-nav-btn:active {
    background: rgba(255, 255, 255, 0.18);
    transform: scale(0.94);
  }

  .dock-sleek-nav-btn:disabled {
    opacity: 0.28;
    pointer-events: none;
    border-color: rgba(255, 255, 255, 0.08);
    background: transparent;
  }

  /* ── Step counter ── */
  .dock-sleek-step-counter {
    flex: 1;
    text-align: center;
    font-size: 0.9rem;
    letter-spacing: 0.2em;
    font-variant-numeric: tabular-nums;
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
