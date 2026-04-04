<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() =>
  locales.value.filter((l) => typeof l !== 'string'),
)
</script>

<template>
  <USelect
    :model-value="locale"
    :items="availableLocales.map((l) => ({ label: l.name ?? l.code, value: l.code }))"
    size="sm"
    class="w-24"
    :ui="{ content: 'z-[60]' }"
    @update:model-value="setLocale($event)"
  />
</template>
