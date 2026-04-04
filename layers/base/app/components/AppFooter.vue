<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-(--ui-border) py-8 mt-auto">
    <UContainer>
      <p class="text-sm text-(--ui-text-muted) text-center">
        &copy; {{ new Date().getFullYear() }} {{ t('app.title') }}
      </p>
    </UContainer>
  </footer>
</template>
