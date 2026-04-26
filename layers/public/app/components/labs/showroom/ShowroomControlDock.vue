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
}>()

const emit = defineEmits<{
  selectOption: [groupId: string, optionId: string]
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
  top: calc(1rem + var(--dock-offset, 0px));
  right: clamp(1rem, 2.4vw, 2rem);
  bottom: clamp(1rem, 2.4vw, 2rem);
  display: flex;
  align-items: flex-start;
  z-index: 4;
  width: min(22rem, calc(100% - 2rem));
  min-height: 0;
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
  height: 100%;
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
</style>
