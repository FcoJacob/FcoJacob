<script setup lang="ts">
import { alleyShops } from '../../../utils/labs/wizard-alley/catalog'
import {
  createAlleyRuntime,
  detectWebGLSupport,
  type AlleyRuntime,
  type AlleyRuntimeEvent,
  type AlleyRuntimeState,
} from '../../../utils/labs/wizard-alley/runtime'

const props = defineProps<{
  reducedMotion: boolean
}>()

const emit = defineEmits<{
  state: [state: AlleyRuntimeState]
  event: [event: AlleyRuntimeEvent]
  unsupported: []
}>()

const { t } = useI18n()
const hostRef = useTemplateRef<HTMLDivElement>('host')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
let runtime: AlleyRuntime | null = null

onMounted(() => {
  if (!detectWebGLSupport() || !hostRef.value || !canvasRef.value) {
    emit('unsupported')
    return
  }

  try {
    runtime = createAlleyRuntime({
      canvas: canvasRef.value,
      host: hostRef.value,
      shops: alleyShops,
      reducedMotion: props.reducedMotion,
      onState: (state) => emit('state', state),
      onEvent: (event) => emit('event', event),
    })
  } catch (error) {
    console.error('[wizard-alley] runtime failed to start', error)
    emit('unsupported')
  }
})

watch(
  () => props.reducedMotion,
  (value) => runtime?.setReducedMotion(value),
)

onBeforeUnmount(() => {
  runtime?.dispose()
  runtime = null
})

defineExpose({
  setMoveInput: (x: number, y: number) => runtime?.setMoveInput(x, y),
  interact: () => runtime?.interact(),
  requestEnter: () => runtime?.requestEnter(),
  exitShop: () => runtime?.exitShop(),
  toggleItem: (itemId: string) => runtime?.toggleItem(itemId),
})
</script>

<template>
  <div ref="host" class="alley-canvas-host" role="img" :aria-label="t('labs_alley.canvas_label')">
    <canvas ref="canvas" class="alley-canvas" />
  </div>
</template>

<style scoped>
.alley-canvas-host {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  background: #06070f;
}

.alley-canvas-host:active {
  cursor: grabbing;
}

.alley-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
