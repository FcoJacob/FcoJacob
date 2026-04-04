<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">
      {{ t('admin.dashboard') }}
    </h2>
    <p class="text-(--ui-text-muted)">
      {{ t('app.description') }}
    </p>
  </div>
</template>
