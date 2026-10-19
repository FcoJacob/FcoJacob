<script setup lang="ts">
import AlleyCanvas from './AlleyCanvas.client.vue'
import {
  alleyShops,
  findAlleyItem,
  findAlleyShop,
  type AlleySlot,
} from '../../../utils/labs/wizard-alley/catalog'
import type {
  AlleyRuntimeEvent,
  AlleyRuntimeState,
} from '../../../utils/labs/wizard-alley/runtime'

const { t } = useI18n()
const localePath = useLocalePath()
const canvasRef = useTemplateRef<InstanceType<typeof AlleyCanvas>>('canvas')

const runtimeState = shallowRef<AlleyRuntimeState | null>(null)
const gateOpen = shallowRef(true)
const unsupported = shallowRef(false)
const reducedMotion = shallowRef(false)
const coarsePointer = shallowRef(false)
const toast = shallowRef<{ id: number; text: string; color: string } | null>(null)

let reducedMotionQuery: MediaQueryList | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null
let toastId = 0

const mode = computed(() => runtimeState.value?.mode ?? 'alley')
const isReady = computed(() => runtimeState.value?.ready ?? false)
const isTransitioning = computed(() => mode.value === 'entering' || mode.value === 'leaving')
const progressPercentage = computed(() => `${Math.round((runtimeState.value?.progress ?? 0) * 100)}%`)
const nearShop = computed(() => {
  const id = runtimeState.value?.nearShopId
  return id ? findAlleyShop(id) : null
})
const activeShop = computed(() => {
  const id = runtimeState.value?.activeShopId
  return id ? findAlleyShop(id) : null
})
const showPrompt = computed(() => !gateOpen.value && mode.value === 'alley' && nearShop.value !== null)
const showDock = computed(() => mode.value === 'shop' && activeShop.value !== null)
const lightMode = computed(() => runtimeState.value?.quality === 'low')
const pointerLocked = computed(() => runtimeState.value?.pointerLocked ?? false)

const slotMeta: Array<{ slot: AlleySlot; icon: string; labelKey: string }> = [
  { slot: 'head', icon: 'i-lucide-crown', labelKey: 'labs_alley.slot_head' },
  { slot: 'cloak', icon: 'i-lucide-shirt', labelKey: 'labs_alley.slot_cloak' },
  { slot: 'wand', icon: 'i-lucide-wand-sparkles', labelKey: 'labs_alley.slot_wand' },
]

const outfit = computed(() =>
  slotMeta.map((meta) => {
    const itemId = runtimeState.value?.worn[meta.slot] ?? null
    const item = itemId ? findAlleyItem(itemId) : null
    return {
      ...meta,
      label: t(meta.labelKey),
      value: item ? t(`labs_alley.items.${item.labelKey}`) : t('labs_alley.slot_empty'),
      color: item?.spark ?? null,
    }
  }),
)

const shopItems = computed(() => {
  const shop = activeShop.value
  if (!shop) {
    return []
  }
  return shop.items.map((item) => ({
    id: item.id,
    label: t(`labs_alley.items.${item.labelKey}`),
    description: t(`labs_alley.items.${item.descriptionKey}`),
    swatch: item.primary,
    accent: item.accent,
    spark: item.spark,
    worn: runtimeState.value?.worn[item.slot] === item.id,
  }))
})

function shopName(shopId: string | null | undefined) {
  const shop = shopId ? findAlleyShop(shopId) : null
  return shop ? t(`labs_alley.shops.${shop.nameKey}`) : ''
}

function shopTagline(shopId: string | null | undefined) {
  const shop = shopId ? findAlleyShop(shopId) : null
  return shop ? t(`labs_alley.shops.${shop.taglineKey}`) : ''
}

function showToast(text: string, color: string) {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastId += 1
  toast.value = { id: toastId, text, color }
  toastTimer = setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 2400)
}

function handleState(state: AlleyRuntimeState) {
  runtimeState.value = state
}

function handleEvent(event: AlleyRuntimeEvent) {
  if (event.type === 'equipped') {
    const item = findAlleyItem(event.itemId)
    if (!item) {
      return
    }
    const key =
      item.slot === 'wand'
        ? 'labs_alley.toast_wand'
        : item.slot === 'head'
          ? 'labs_alley.toast_hat'
          : 'labs_alley.toast_cloak'
    showToast(t(key), item.spark)
    return
  }
  if (event.type === 'unequipped') {
    showToast(t('labs_alley.toast_removed'), '#d8c8a8')
  }
}

function handleUnsupported() {
  unsupported.value = true
  gateOpen.value = false
}

function enterAlley() {
  gateOpen.value = false
}

function requestEnter() {
  canvasRef.value?.requestEnter()
}

function exitShop() {
  canvasRef.value?.exitShop()
}

function toggleItem(itemId: string) {
  canvasRef.value?.toggleItem(itemId)
}

function interact() {
  canvasRef.value?.interact()
}

// ── Virtual joystick (touch devices) ─────────────────────────────────────
const stickRef = useTemplateRef<HTMLDivElement>('stick')
const stickKnob = shallowRef({ x: 0, y: 0 })
const stickActive = shallowRef(false)
let stickPointerId: number | null = null
const STICK_RADIUS = 38

function updateStick(event: PointerEvent) {
  const element = stickRef.value
  if (!element) {
    return
  }
  const rect = element.getBoundingClientRect()
  const dx = event.clientX - (rect.left + rect.width / 2)
  const dy = event.clientY - (rect.top + rect.height / 2)
  const length = Math.hypot(dx, dy)
  const scale = length > STICK_RADIUS ? STICK_RADIUS / length : 1
  const x = (dx * scale) / STICK_RADIUS
  const y = (dy * scale) / STICK_RADIUS
  stickKnob.value = { x: x * STICK_RADIUS, y: y * STICK_RADIUS }
  // Screen up means forward.
  canvasRef.value?.setMoveInput(x, -y)
}

function handleStickDown(event: PointerEvent) {
  stickPointerId = event.pointerId
  stickActive.value = true
  stickRef.value?.setPointerCapture?.(event.pointerId)
  updateStick(event)
}

function handleStickMove(event: PointerEvent) {
  if (stickPointerId !== event.pointerId) {
    return
  }
  updateStick(event)
}

function handleStickUp(event: PointerEvent) {
  if (stickPointerId !== event.pointerId) {
    return
  }
  stickPointerId = null
  stickActive.value = false
  stickKnob.value = { x: 0, y: 0 }
  stickRef.value?.releasePointerCapture?.(event.pointerId)
  canvasRef.value?.setMoveInput(0, 0)
}

const actionLabel = computed(() => {
  if (mode.value === 'shop') {
    return t('labs_alley.action_next')
  }
  return t('labs_alley.action_enter')
})
const showActionButton = computed(
  () => coarsePointer.value && !gateOpen.value && ((mode.value === 'alley' && nearShop.value !== null) || mode.value === 'shop'),
)

function syncReducedMotion(event?: MediaQueryListEvent) {
  reducedMotion.value = event?.matches ?? reducedMotionQuery?.matches ?? false
}

onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncReducedMotion()
  reducedMotionQuery.addEventListener('change', syncReducedMotion)
  coarsePointer.value = window.matchMedia('(pointer: coarse)').matches
})

onBeforeUnmount(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  reducedMotionQuery?.removeEventListener('change', syncReducedMotion)
  reducedMotionQuery = null
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})
</script>

<template>
  <section class="alley-shell" :data-mode="mode" :data-gate="gateOpen ? 'open' : 'closed'">
    <ClientOnly>
      <AlleyCanvas
        v-if="!unsupported"
        ref="canvas"
        :reduced-motion="reducedMotion"
        @state="handleState"
        @event="handleEvent"
        @unsupported="handleUnsupported"
      />
    </ClientOnly>

    <div v-if="unsupported" class="alley-fallback">
      <p class="alley-kicker">{{ t('labs_alley.eyebrow') }}</p>
      <h1 class="alley-display">{{ t('labs_alley.no_webgl_title') }}</h1>
      <p class="alley-copy">{{ t('labs_alley.no_webgl_copy') }}</p>
      <NuxtLink :to="localePath('/labs')" class="alley-button alley-button-ghost">
        {{ t('labs_alley.back_to_labs') }}
      </NuxtLink>
    </div>

    <div class="alley-vignette" aria-hidden="true" />
    <div
      v-if="pointerLocked && mode === 'alley'"
      class="alley-reticle"
      :class="{ 'is-hot': nearShop !== null }"
      aria-hidden="true"
    />
    <div class="alley-fade" :class="{ 'is-active': isTransitioning, 'is-instant': reducedMotion }" aria-hidden="true" />

    <!-- Top HUD -->
    <header v-if="!unsupported" class="alley-hud-top">
      <NuxtLink :to="localePath('/labs')" class="alley-chip alley-chip-link">
        <UIcon name="i-lucide-arrow-left" class="size-3.5" />
        <span>{{ t('labs_alley.back_to_labs') }}</span>
      </NuxtLink>

      <div class="alley-hud-title">
        <p class="alley-kicker">
          {{ showDock ? t('labs_alley.shop_kicker') : t('labs_alley.eyebrow') }}
        </p>
        <h1 class="alley-hud-heading">
          {{ showDock ? shopName(activeShop?.id) : t('labs_alley.title') }}
        </h1>
      </div>

      <div class="alley-outfit" :aria-label="t('labs_alley.outfit_label')">
        <div
          v-for="entry in outfit"
          :key="entry.slot"
          class="alley-chip alley-outfit-chip"
          :class="{ 'is-filled': entry.color }"
          :style="entry.color ? { '--chip-accent': entry.color } : undefined"
        >
          <UIcon :name="entry.icon" class="size-3.5" />
          <span class="alley-outfit-slot">{{ entry.label }}</span>
          <span class="alley-outfit-value">{{ entry.value }}</span>
        </div>
      </div>
    </header>

    <!-- Shop prompt -->
    <Transition name="alley-rise">
      <div v-if="showPrompt && nearShop" class="alley-prompt" :style="{ '--prompt-accent': nearShop.accent }">
        <p class="alley-kicker">{{ t('labs_alley.prompt_kicker') }}</p>
        <p class="alley-prompt-name">{{ shopName(nearShop.id) }}</p>
        <p class="alley-prompt-tagline">{{ shopTagline(nearShop.id) }}</p>
        <button type="button" class="alley-button alley-button-primary" @click="requestEnter">
          <UIcon name="i-lucide-door-open" class="size-4" />
          <span>{{ t('labs_alley.prompt_enter') }}</span>
          <kbd v-if="!coarsePointer" class="alley-kbd">E</kbd>
        </button>
      </div>
    </Transition>

    <!-- Bottom HUD (alley) -->
    <footer v-if="!unsupported && !gateOpen && mode !== 'shop'" class="alley-hud-bottom">
      <div class="alley-hints">
        <template v-if="coarsePointer">
          <span class="alley-hint"><UIcon name="i-lucide-hand" class="size-3.5" />{{ t('labs_alley.hint_touch') }}</span>
        </template>
        <template v-else>
          <span class="alley-hint"><UIcon name="i-lucide-footprints" class="size-3.5" />{{ t('labs_alley.hint_walk') }}</span>
          <span class="alley-hint"><UIcon name="i-lucide-door-open" class="size-3.5" />{{ t('labs_alley.hint_action') }}</span>
          <span class="alley-hint"><UIcon name="i-lucide-mouse" class="size-3.5" />{{ pointerLocked ? t('labs_alley.hint_unlock') : t('labs_alley.hint_look') }}</span>
        </template>
        <span v-if="lightMode" class="alley-hint alley-hint-muted">{{ t('labs_alley.quality_low') }}</span>
      </div>

      <div class="alley-rail" role="progressbar" :aria-label="t('labs_alley.depth_label')" :aria-valuenow="Math.round((runtimeState?.progress ?? 0) * 100)" aria-valuemin="0" aria-valuemax="100">
        <span class="alley-rail-label">{{ t('labs_alley.depth_label') }}</span>
        <span class="alley-rail-track"><span class="alley-rail-fill" :style="{ width: progressPercentage }" /></span>
        <span class="alley-rail-value">{{ progressPercentage }}</span>
      </div>

      <div class="alley-hud-bottom-spacer" aria-hidden="true" />
    </footer>

    <!-- Touch controls: joystick + action button -->
    <div
      v-if="coarsePointer && !unsupported && !gateOpen && mode !== 'shop'"
      ref="stick"
      class="alley-stick"
      :class="{ 'is-active': stickActive }"
      :aria-label="t('labs_alley.hint_touch')"
      role="application"
      @pointerdown.prevent="handleStickDown"
      @pointermove="handleStickMove"
      @pointerup="handleStickUp"
      @pointercancel="handleStickUp"
    >
      <span class="alley-stick-ring" aria-hidden="true" />
      <span
        class="alley-stick-knob"
        aria-hidden="true"
        :style="{ transform: `translate(${stickKnob.x}px, ${stickKnob.y}px)` }"
      />
    </div>

    <Transition name="alley-rise">
      <button
        v-if="showActionButton"
        type="button"
        class="alley-action-button"
        @click="interact"
      >
        <UIcon :name="mode === 'shop' ? 'i-lucide-sparkles' : 'i-lucide-door-open'" class="size-5" />
        <span>{{ actionLabel }}</span>
      </button>
    </Transition>

    <!-- Shop dock -->
    <Transition name="alley-slide">
      <aside v-if="showDock && activeShop" class="alley-dock" :style="{ '--dock-accent': activeShop.accent }">
        <div class="alley-dock-head">
          <p class="alley-kicker">{{ shopTagline(activeShop.id) }}</p>
          <p class="alley-dock-hint">{{ coarsePointer ? t('labs_alley.shop_hint_touch') : t('labs_alley.shop_hint') }}</p>
          <p v-if="!coarsePointer" class="alley-dock-keys">
            <kbd class="alley-kbd">E</kbd><kbd class="alley-kbd">␣</kbd> {{ t('labs_alley.shop_key_cycle') }}
            <kbd class="alley-kbd">←</kbd><kbd class="alley-kbd">→</kbd> {{ t('labs_alley.shop_key_turn') }}
            <kbd class="alley-kbd">Esc</kbd> {{ t('labs_alley.shop_key_exit') }}
          </p>
        </div>

        <ul class="alley-items">
          <li v-for="item in shopItems" :key="item.id">
            <button
              type="button"
              class="alley-item"
              :class="{ 'is-worn': item.worn }"
              :style="{ '--item-swatch': item.swatch, '--item-accent': item.accent, '--item-spark': item.spark }"
              @click="toggleItem(item.id)"
            >
              <span class="alley-item-swatch" aria-hidden="true" />
              <span class="alley-item-body">
                <span class="alley-item-name">{{ item.label }}</span>
                <span class="alley-item-description">{{ item.description }}</span>
              </span>
              <span class="alley-item-state">
                {{ item.worn ? t('labs_alley.wearing') : t('labs_alley.try_on') }}
              </span>
            </button>
          </li>
        </ul>

        <button type="button" class="alley-button alley-button-ghost alley-dock-exit" @click="exitShop">
          <UIcon name="i-lucide-log-out" class="size-4" />
          <span>{{ t('labs_alley.shop_exit') }}</span>
          <kbd v-if="!coarsePointer" class="alley-kbd">Esc</kbd>
        </button>
      </aside>
    </Transition>

    <!-- Toast -->
    <Transition name="alley-rise">
      <p v-if="toast" :key="toast.id" class="alley-toast" :style="{ '--toast-accent': toast.color }">
        <UIcon name="i-lucide-sparkles" class="size-4" />
        <span>{{ toast.text }}</span>
      </p>
    </Transition>

    <!-- Entry gate -->
    <Transition name="alley-gate">
      <div v-if="gateOpen && !unsupported" class="alley-gate">
        <div class="alley-gate-card">
          <p class="alley-kicker">{{ t('labs_alley.gate_kicker') }}</p>
          <h1 class="alley-display">{{ t('labs_alley.title') }}</h1>
          <p class="alley-copy">{{ t('labs_alley.gate_copy') }}</p>
          <p class="alley-gate-hint">
            {{ coarsePointer ? t('labs_alley.gate_hint_touch') : t('labs_alley.gate_hint_desktop') }}
          </p>
          <button
            type="button"
            class="alley-button alley-button-primary alley-gate-button"
            :disabled="!isReady"
            @click="enterAlley"
          >
            <UIcon :name="isReady ? 'i-lucide-footprints' : 'i-lucide-sparkles'" class="size-4" />
            <span>{{ isReady ? t('labs_alley.gate_enter') : t('labs_alley.gate_loading') }}</span>
          </button>
          <p class="alley-gate-shops">
            <span v-for="shop in alleyShops" :key="shop.id" class="alley-gate-shop" :style="{ '--shop-accent': shop.accent }">
              {{ t(`labs_alley.shops.${shop.nameKey}`) }}
            </span>
          </p>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.alley-shell {
  --alley-ink: #f4ead6;
  --alley-ink-muted: rgba(244, 234, 214, 0.68);
  --alley-gold: #e0b35a;
  --alley-panel: rgba(9, 9, 18, 0.72);
  --alley-border: rgba(224, 179, 90, 0.22);
  --alley-serif: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
  position: relative;
  width: 100vw;
  height: 100svh;
  overflow: hidden;
  color: var(--alley-ink);
  background: #06070f;
  isolation: isolate;
}

.alley-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.25), transparent 22%, transparent 78%, rgba(0, 0, 0, 0.35));
}

.alley-reticle {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 4;
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.alley-reticle.is-hot {
  border-color: var(--alley-gold);
  background: var(--alley-gold);
  transform: translate(-50%, -50%) scale(1.4);
  box-shadow: 0 0 14px var(--alley-gold);
}

.alley-fade {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  background: #04040a;
  opacity: 0;
}

.alley-fade.is-active {
  animation: alley-blink 1.1s ease-in-out forwards;
}

.alley-fade.is-active.is-instant {
  animation-duration: 0.3s;
}

@keyframes alley-blink {
  0% {
    opacity: 0;
  }
  42% {
    opacity: 1;
  }
  58% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.alley-kicker {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--alley-gold);
}

.alley-display {
  font-family: var(--alley-serif);
  font-size: clamp(2.1rem, 5vw, 3.6rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--alley-ink);
}

.alley-copy {
  max-width: 34rem;
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--alley-ink-muted);
}

.alley-chip {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  min-height: 2.1rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--alley-border);
  border-radius: 999px;
  background: var(--alley-panel);
  backdrop-filter: blur(12px);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--alley-ink);
}

.alley-chip-link {
  pointer-events: auto;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.alley-chip-link:hover {
  border-color: var(--alley-gold);
  transform: translateX(-2px);
}

.alley-button {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: 0.7rem 1.35rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.alley-button:disabled {
  cursor: progress;
  opacity: 0.6;
}

.alley-button-primary {
  color: #1a1208;
  background: linear-gradient(135deg, #f1cf7e, var(--alley-gold));
  box-shadow: 0 10px 30px -10px rgba(224, 179, 90, 0.75);
}

.alley-button-primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 34px -10px rgba(224, 179, 90, 0.9);
}

.alley-button-ghost {
  border-color: var(--alley-border);
  color: var(--alley-ink);
  background: var(--alley-panel);
  backdrop-filter: blur(12px);
  text-decoration: none;
}

.alley-button-ghost:hover {
  border-color: var(--alley-gold);
}

.alley-kbd {
  padding: 0.1rem 0.4rem;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 0.35rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  opacity: 0.75;
}

.alley-button-ghost .alley-kbd {
  border-color: var(--alley-border);
}

/* ── Top HUD ─────────────────────────────────────────────────────────── */
.alley-hud-top {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.1rem;
  pointer-events: none;
}

.alley-hud-title {
  display: grid;
  gap: 0.15rem;
  justify-items: center;
  text-align: center;
}

.alley-hud-heading {
  font-family: var(--alley-serif);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
}

.alley-outfit {
  display: flex;
  gap: 0.4rem;
  justify-content: end;
}

.alley-outfit-chip {
  gap: 0.35rem;
  color: var(--alley-ink-muted);
}

.alley-outfit-chip.is-filled {
  border-color: color-mix(in oklab, var(--chip-accent) 55%, transparent);
  color: var(--alley-ink);
  box-shadow: 0 0 18px -6px var(--chip-accent);
}

.alley-outfit-slot {
  opacity: 0.6;
}

.alley-outfit-value {
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Prompt ──────────────────────────────────────────────────────────── */
.alley-prompt {
  position: absolute;
  bottom: 7.6rem;
  left: 50%;
  z-index: 6;
  display: grid;
  gap: 0.35rem;
  justify-items: center;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.1rem 1.3rem 1.2rem;
  border: 1px solid color-mix(in oklab, var(--prompt-accent) 45%, transparent);
  border-radius: 1.2rem;
  background: var(--alley-panel);
  backdrop-filter: blur(14px);
  text-align: center;
  transform: translateX(-50%);
  box-shadow: 0 24px 60px -24px color-mix(in oklab, var(--prompt-accent) 70%, black);
}

.alley-prompt-name {
  font-family: var(--alley-serif);
  font-size: 1.45rem;
  font-weight: 600;
  line-height: 1.1;
}

.alley-prompt-tagline {
  margin-bottom: 0.5rem;
  font-size: 0.82rem;
  color: var(--alley-ink-muted);
}

/* ── Bottom HUD ──────────────────────────────────────────────────────── */
.alley-hud-bottom {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: end;
  padding: 1rem 1.1rem 1.1rem;
  pointer-events: none;
}

.alley-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.alley-hint {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(6, 7, 15, 0.55);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--alley-ink-muted);
  backdrop-filter: blur(10px);
}

.alley-hint-muted {
  opacity: 0.6;
}

.alley-rail {
  display: grid;
  gap: 0.3rem;
  justify-items: center;
  min-width: 12rem;
}

.alley-rail-label,
.alley-rail-value {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--alley-ink-muted);
}

.alley-rail-track {
  display: block;
  width: 12rem;
  height: 0.22rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.alley-rail-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgba(224, 179, 90, 0.7), #f3d58a);
  transition: width 0.25s ease-out;
}

.alley-hud-bottom-spacer {
  min-width: 1px;
}

/* ── Touch controls ──────────────────────────────────────────────────── */
.alley-stick {
  position: absolute;
  bottom: 6.4rem;
  left: 1.2rem;
  z-index: 6;
  display: grid;
  place-items: center;
  width: 7.2rem;
  height: 7.2rem;
  border-radius: 999px;
  touch-action: none;
  user-select: none;
  pointer-events: auto;
}

.alley-stick-ring {
  position: absolute;
  inset: 0;
  border: 1px solid var(--alley-border);
  border-radius: 999px;
  background: rgba(9, 9, 18, 0.5);
  backdrop-filter: blur(10px);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.alley-stick.is-active .alley-stick-ring {
  border-color: var(--alley-gold);
  background: rgba(224, 179, 90, 0.12);
}

.alley-stick-knob {
  position: relative;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, #f3d58a, #b8893a);
  box-shadow: 0 8px 20px -8px rgba(224, 179, 90, 0.8);
  transition: transform 0.05s linear;
}

.alley-action-button {
  position: absolute;
  right: 1.2rem;
  bottom: 7.4rem;
  z-index: 6;
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  width: 5.2rem;
  height: 5.2rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #1a1208;
  background: radial-gradient(circle at 35% 30%, #f3d58a, var(--alley-gold));
  box-shadow: 0 14px 34px -10px rgba(224, 179, 90, 0.9);
  pointer-events: auto;
  touch-action: manipulation;
  user-select: none;
}

.alley-action-button:active {
  transform: scale(0.96);
}

.alley-dock-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.5rem;
  align-items: center;
  font-size: 0.68rem;
  color: var(--alley-ink-muted);
}

.alley-dock-keys .alley-kbd {
  margin-right: 0.1rem;
  border-color: var(--alley-border);
}

/* ── Shop dock ───────────────────────────────────────────────────────── */
.alley-dock {
  position: absolute;
  top: 5.4rem;
  right: 1.1rem;
  bottom: 1.1rem;
  z-index: 6;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.9rem;
  width: min(21rem, calc(100vw - 2.2rem));
  padding: 1.1rem;
  border: 1px solid color-mix(in oklab, var(--dock-accent) 40%, transparent);
  border-radius: 1.3rem;
  background: var(--alley-panel);
  backdrop-filter: blur(16px);
  pointer-events: auto;
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.9);
}

.alley-dock-head {
  display: grid;
  gap: 0.4rem;
}

.alley-dock-hint {
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--alley-ink-muted);
}

.alley-items {
  display: grid;
  gap: 0.55rem;
  align-content: start;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.alley-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.95rem;
  text-align: left;
  color: var(--alley-ink);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.alley-item:hover {
  border-color: color-mix(in oklab, var(--item-accent) 60%, transparent);
  background: rgba(255, 255, 255, 0.06);
}

.alley-item.is-worn {
  border-color: var(--item-spark);
  background: color-mix(in oklab, var(--item-spark) 12%, transparent);
  box-shadow: 0 0 24px -8px var(--item-spark);
}

.alley-item-swatch {
  width: 1.6rem;
  height: 1.6rem;
  border: 2px solid var(--item-accent);
  border-radius: 999px;
  background: var(--item-swatch);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.3);
}

.alley-item-body {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.alley-item-name {
  font-family: var(--alley-serif);
  font-size: 1rem;
  font-weight: 600;
}

.alley-item-description {
  font-size: 0.74rem;
  line-height: 1.4;
  color: var(--alley-ink-muted);
}

.alley-item-state {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--alley-gold);
}

.alley-item.is-worn .alley-item-state {
  color: var(--item-spark);
}

.alley-dock-exit {
  width: 100%;
}

/* ── Toast ───────────────────────────────────────────────────────────── */
.alley-toast {
  position: absolute;
  bottom: 5.2rem;
  left: 50%;
  z-index: 7;
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.6rem 1rem;
  border: 1px solid color-mix(in oklab, var(--toast-accent) 55%, transparent);
  border-radius: 999px;
  background: var(--alley-panel);
  backdrop-filter: blur(12px);
  font-family: var(--alley-serif);
  font-size: 0.98rem;
  color: var(--alley-ink);
  transform: translateX(-50%);
  box-shadow: 0 0 30px -8px var(--toast-accent);
  pointer-events: none;
}

.alley-shell[data-mode='shop'] .alley-toast {
  top: 5.2rem;
  bottom: auto;
}

/* ── Gate ────────────────────────────────────────────────────────────── */
.alley-gate {
  position: absolute;
  inset: 0;
  z-index: 9;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: radial-gradient(ellipse at center, rgba(6, 7, 15, 0.35), rgba(6, 7, 15, 0.85));
  backdrop-filter: blur(6px);
}

.alley-gate-card {
  display: grid;
  gap: 0.9rem;
  justify-items: center;
  max-width: 36rem;
  padding: 2rem 1.6rem;
  border: 1px solid var(--alley-border);
  border-radius: 1.6rem;
  background: rgba(9, 9, 18, 0.6);
  text-align: center;
  box-shadow: 0 40px 100px -40px rgba(224, 179, 90, 0.5);
}

.alley-gate-hint {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--alley-ink-muted);
}

.alley-gate-button {
  margin-top: 0.3rem;
  min-width: 14rem;
}

.alley-gate-shops {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.9rem;
  justify-content: center;
  margin-top: 0.4rem;
  font-family: var(--alley-serif);
  font-size: 0.86rem;
  color: var(--alley-ink-muted);
}

.alley-gate-shop::before {
  content: '';
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.4rem;
  border-radius: 999px;
  background: var(--shop-accent);
  box-shadow: 0 0 10px var(--shop-accent);
}

.alley-fallback {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  gap: 1rem;
  place-content: center;
  justify-items: center;
  padding: 2rem;
  text-align: center;
}

/* ── Transitions ─────────────────────────────────────────────────────── */
.alley-rise-enter-active,
.alley-rise-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.alley-rise-enter-from,
.alley-rise-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

.alley-slide-enter-active,
.alley-slide-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.alley-slide-enter-from,
.alley-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.alley-gate-enter-active,
.alley-gate-leave-active {
  transition: opacity 0.6s ease;
}

.alley-gate-enter-from,
.alley-gate-leave-to {
  opacity: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .alley-hud-top {
    grid-template-columns: auto 1fr;
    gap: 0.6rem;
    padding: 0.8rem;
  }

  .alley-hud-title {
    justify-items: end;
    text-align: right;
  }

  .alley-hud-heading {
    font-size: 1rem;
  }

  .alley-outfit {
    grid-column: 1 / -1;
    gap: 0.3rem;
    justify-content: start;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .alley-outfit-chip {
    flex-shrink: 0;
    padding-inline: 0.55rem;
  }

  .alley-outfit-slot {
    display: none;
  }

  .alley-hud-bottom {
    grid-template-columns: 1fr auto;
    gap: 0.6rem;
    padding: 0.8rem;
  }

  /* Touch devices: the joystick and action button own the bottom corners,
     so the hints go away and the rail shrinks between them. */
  .alley-hints {
    display: none;
  }

  .alley-hud-bottom {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .alley-hud-bottom-spacer {
    display: none;
  }

  .alley-rail {
    justify-items: center;
    min-width: 0;
  }

  .alley-rail-track {
    width: 7rem;
  }

  .alley-prompt {
    top: 7.6rem;
    bottom: auto;
    width: min(20rem, calc(100vw - 2rem));
    padding: 0.9rem 1rem 1rem;
  }

  .alley-prompt-name {
    font-size: 1.2rem;
  }

  .alley-stick {
    bottom: 6.2rem;
    left: 0.9rem;
    width: 6.6rem;
    height: 6.6rem;
  }

  .alley-action-button {
    right: 0.9rem;
    bottom: 7rem;
  }

  .alley-dock {
    top: auto;
    right: 0.6rem;
    bottom: 0.6rem;
    left: 0.6rem;
    width: auto;
    max-height: 48svh;
    padding: 0.9rem;
    grid-template-rows: auto 1fr auto;
  }

  .alley-item-description {
    display: none;
  }

  .alley-shell[data-mode='shop'] .alley-toast {
    bottom: auto;
    top: 7.2rem;
    left: 50%;
  }

  .alley-gate-card {
    padding: 1.5rem 1.1rem;
  }
}
</style>
