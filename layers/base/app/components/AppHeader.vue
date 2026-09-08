<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const navItems = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: t('nav.blog'), to: '/blog' },
  { label: t('nav.projects'), to: '/projects' },
  { label: t('nav.labs'), to: '/labs' },
  { label: t('nav.cv'), to: '/cv' },
])

const mobileMenuOpen = ref(false)
const route = useRoute()

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

watch(mobileMenuOpen, (isOpen) => {
  if (typeof window === 'undefined') return
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Sliding Pill navigation refs and logic
const navContainer = ref<HTMLElement | null>(null)
const pillStyle = ref({
  width: '0px',
  left: '0px',
  opacity: 0,
})

function updatePill(el: HTMLElement) {
  if (!el) return
  pillStyle.value = {
    width: `${el.offsetWidth}px`,
    left: `${el.offsetLeft}px`,
    opacity: 1,
  }
}

function resetPill() {
  nextTick(() => {
    if (!navContainer.value) return
    const activeEl = navContainer.value.querySelector('.router-link-active') as HTMLElement
    if (activeEl) {
      updatePill(activeEl)
    } else {
      pillStyle.value.opacity = 0
    }
  })
}

// Watch for route changes to reposition the pill
watch(
  () => route.path,
  () => {
    setTimeout(resetPill, 80)
  },
  { immediate: true },
)

onMounted(() => {
  setTimeout(resetPill, 150)
  window.addEventListener('resize', resetPill)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resetPill)
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-(--ui-bg)/80 backdrop-blur-lg border-b border-(--ui-border)">
    <UContainer>
      <nav class="flex items-center justify-between h-16">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2 group">
          <span class="flex items-center justify-center size-8 rounded-full bg-(--ui-color-secondary-500) text-white text-sm font-bold">JS</span>
        </NuxtLink>

        <!-- Desktop nav (md+) with custom Sliding Pill capsule -->
        <div class="hidden md:flex items-center gap-1.5">
          <div
            ref="navContainer"
            class="relative flex items-center gap-0.5 bg-(--ui-bg-elevated)/45 border border-(--ui-border) rounded-full p-1"
            @mouseleave="resetPill"
          >
            <!-- Sliding Pill background -->
            <div
              class="absolute h-[30px] rounded-full bg-(--ui-color-primary-500)/10 border border-(--ui-color-primary-500)/20 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
              :style="pillStyle"
            />

            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="localePath(item.to)"
              class="relative px-3.5 py-1 text-sm font-medium transition-colors duration-200 text-(--ui-text-muted) hover:text-(--ui-text) cursor-pointer"
              active-class="!text-(--ui-color-primary-500) font-semibold"
              @mouseenter="updatePill($event.target as HTMLElement)"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
          <USeparator orientation="vertical" class="h-5 mx-1" />
          <LanguageSwitcher />
          <UColorModeButton />
        </div>

        <!-- Mobile hamburger button -->
        <button
          class="md:hidden flex items-center justify-center size-11 rounded-lg hover:bg-(--ui-bg-elevated) transition-colors cursor-pointer"
          :aria-label="mobileMenuOpen ? t('nav.close_menu') : t('nav.open_menu')"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-6" />
        </button>
      </nav>
    </UContainer>
  </header>

  <!-- Mobile fullscreen overlay (teleported to body to avoid stacking context issues) -->
  <Teleport to="body">
    <Transition name="mobile-menu">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 top-16 z-40 flex flex-col md:hidden mobile-menu-bg"
      >
        <nav class="flex-1 flex flex-col items-center justify-center gap-2 px-6">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="localePath(item.to)"
            class="w-full text-center text-xl font-semibold py-4 rounded-xl transition-colors hover:bg-(--ui-bg-elevated) active:bg-(--ui-bg-elevated)"
            active-class="text-(--ui-color-primary-500)"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="flex items-center justify-center gap-4 pb-10 pt-4 border-t border-(--ui-border) mx-6">
          <LanguageSwitcher />
          <UColorModeButton />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-menu-bg {
  background-color: var(--ui-bg);
}
.mobile-menu-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.mobile-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

