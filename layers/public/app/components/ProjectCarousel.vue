<script setup lang="ts">
const { t, tm, rt } = useI18n()

interface Project {
  name: string
  description: string
  details: string
  tags: string[]
  url?: string
}

function resolveProjects(): Project[] {
  const raw = tm('cv_data.projects')
  if (!Array.isArray(raw)) return []
  return raw.map((item: Record<string, unknown>) => {
    const resolved: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(item)) {
      if (Array.isArray(v)) {
        resolved[k] = v.map((el: unknown) => {
          if (typeof el === 'string') return el
          try { return rt(el as any) } catch { return String(el) }
        })
      } else if (typeof v === 'string') {
        resolved[k] = v
      } else {
        try { resolved[k] = rt(v as any) } catch { resolved[k] = String(v) }
      }
    }
    return resolved as Project
  })
}

const projects = computed(() => resolveProjects())
const selectedIndex = ref(0)
const selected = computed(() => projects.value[selectedIndex.value])

const scrollContainer = ref<HTMLElement | null>(null)

function select(index: number) {
  selectedIndex.value = index
  // Scroll the carousel to keep selected card visible
  const container = scrollContainer.value
  if (!container) return
  const card = container.children[index] as HTMLElement
  if (!card) return
  const containerRect = container.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

function prev() {
  if (selectedIndex.value > 0) select(selectedIndex.value - 1)
}

function next() {
  if (selectedIndex.value < projects.value.length - 1) select(selectedIndex.value + 1)
}
</script>

<template>
  <div v-if="projects.length" class="space-y-5">
    <!-- Focus area (top) -->
    <div class="relative overflow-hidden rounded-2xl border border-(--ui-border) bg-(--ui-bg-elevated) min-h-64">
      <Transition name="showcase" mode="out-in">
        <div :key="selected.name" class="p-6 sm:p-8 lg:p-10">
          <div class="flex flex-col gap-6">
            <!-- Header row -->
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <span class="inline-flex items-center gap-2 text-xs font-medium text-(--ui-color-primary-500) uppercase tracking-widest">
                  <span class="size-1.5 rounded-full bg-(--ui-color-primary-500) animate-pulse" />
                  {{ selected.tags?.[0] || 'Web' }}
                </span>
                <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {{ selected.name }}
                </h3>
              </div>
              <UButton
                v-if="selected.url"
                :to="selected.url"
                :label="t('common.visit')"
                icon="i-lucide-arrow-up-right"
                variant="subtle"
                size="md"
                target="_blank"
                external
                class="shrink-0"
              />
            </div>

            <!-- Description -->
            <p class="text-base text-(--ui-text-muted) leading-relaxed max-w-2xl">
              {{ selected.description }}
            </p>

            <!-- Details -->
            <p class="text-sm text-(--ui-text-dimmed) leading-relaxed max-w-2xl">
              {{ selected.details }}
            </p>

            <!-- Tags -->
            <div v-if="selected.tags?.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="tag in selected.tags"
                :key="tag"
                :label="tag"
                color="neutral"
                variant="outline"
                size="sm"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Navigation arrows on focus area -->
      <div class="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-10 flex gap-2">
        <button
          :disabled="selectedIndex === 0"
          class="flex items-center justify-center size-9 rounded-full border border-(--ui-border) bg-(--ui-bg)/60 backdrop-blur-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default hover:bg-(--ui-bg-elevated) hover:border-(--ui-border-hover)"
          aria-label="Previous project"
          @click="prev"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
        </button>
        <button
          :disabled="selectedIndex === projects.length - 1"
          class="flex items-center justify-center size-9 rounded-full border border-(--ui-border) bg-(--ui-bg)/60 backdrop-blur-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default hover:bg-(--ui-bg-elevated) hover:border-(--ui-border-hover)"
          aria-label="Next project"
          @click="next"
        >
          <UIcon name="i-lucide-arrow-right" class="size-4" />
        </button>
      </div>

      <!-- Progress bar -->
      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-(--ui-border)">
        <div
          class="h-full bg-(--ui-color-primary-500) transition-all duration-500 ease-out"
          :style="{ width: `${((selectedIndex + 1) / projects.length) * 100}%` }"
        />
      </div>
    </div>

    <!-- Selector strip (bottom) -->
    <div class="relative group/strip">
      <div
        ref="scrollContainer"
        class="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style="-ms-overflow-style: none; scrollbar-width: none;"
      >
        <button
          v-for="(project, i) in projects"
          :key="project.name"
          class="snap-start shrink-0 flex-1 min-w-32 max-w-48 rounded-xl px-4 py-3 text-left transition-all duration-300 cursor-pointer"
          :class="[
            i === selectedIndex
              ? 'bg-(--ui-color-primary-500)/10 border border-(--ui-color-primary-500)/40 shadow-sm scale-[1.02]'
              : 'bg-(--ui-bg-elevated) border border-transparent hover:border-(--ui-border) hover:bg-(--ui-bg-elevated)/80 opacity-60 hover:opacity-100',
          ]"
          @click="select(i)"
        >
          <p
            class="text-xs font-bold truncate transition-colors duration-300"
            :class="i === selectedIndex ? 'text-(--ui-color-primary-500)' : 'text-(--ui-text)'"
          >
            {{ project.name }}
          </p>
          <p class="text-[10px] text-(--ui-text-muted) mt-0.5 truncate">
            {{ project.tags?.[0] }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
/* Showcase container */
.showcase-enter-active,
.showcase-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.showcase-enter-from {
  opacity: 0;
  transform: scale(0.98) translateY(12px);
}
.showcase-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(-8px);
}

</style>
