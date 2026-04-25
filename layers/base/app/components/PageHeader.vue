<script setup lang="ts">
/**
 * PageHeader — Canonical section header used across all public pages.
 * Applies unified design tokens: .eyebrow, .page-title, .page-subtitle.
 * Always renders with v-reveal for scroll entrance animation.
 */
defineProps<{
  /** Overline label above the title (e.g., "Work", "Writing") */
  eyebrow?: string
  /** Main page h1 */
  title: string
  /** Optional lead paragraph below the title */
  subtitle?: string
}>()
</script>

<template>
  <header v-reveal class="space-y-3 md:space-y-4">
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
    <h1 class="page-title">{{ title }}</h1>
    <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
  </header>
</template>
