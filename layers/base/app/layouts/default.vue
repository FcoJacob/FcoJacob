<template>
  <div class="min-h-screen flex flex-col relative">
    <SiteBackground />
    <AppHeader />

    <main class="flex-1">
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </main>

    <AppFooter />
  </div>
</template>
