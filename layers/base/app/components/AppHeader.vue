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
  <header class="border-b border-(--ui-border)">
    <UContainer>
      <nav class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="text-lg font-bold">
          {{ t('app.title') }}
        </NuxtLink>

        <div class="flex items-center gap-2">
          <UNavigationMenu :items="navItems" />

          <LanguageSwitcher />
          <UColorModeButton />
        </div>
      </nav>
    </UContainer>
  </header>
</template>
