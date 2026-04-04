<script setup lang="ts">
const { t } = useI18n()

const navItems = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: t('nav.blog'), to: '/blog' },
  { label: t('nav.projects'), to: '/projects' },
  { label: t('nav.labs'), to: '/labs' },
  { label: t('nav.cv'), to: '/cv' },
])
</script>

<template>
  <header class="sticky top-0 z-50 bg-(--ui-bg)/80 backdrop-blur-lg border-b border-(--ui-border)">
    <UContainer>
      <nav class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <span class="flex items-center justify-center size-8 rounded-full bg-(--ui-color-secondary-500) text-white text-sm font-bold">JS</span>
        </NuxtLink>

        <div class="flex items-center gap-1">
          <UNavigationMenu :items="navItems" />
          <USeparator orientation="vertical" class="h-5 mx-1" />
          <LanguageSwitcher />
          <UColorModeButton />
        </div>
      </nav>
    </UContainer>
  </header>
</template>
