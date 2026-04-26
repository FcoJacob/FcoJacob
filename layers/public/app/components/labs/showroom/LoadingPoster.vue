<script setup lang="ts">
const props = defineProps<{
  posterSrc: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="loading-poster">
    <img :src="props.posterSrc" :alt="t('labs_showroom.poster_alt')" class="loading-poster-image" />

    <div class="loading-poster-overlay">
      <div class="space-y-3">
        <p class="loading-poster-eyebrow">{{ t('labs_showroom.eyebrow') }}</p>
        <h2 class="loading-poster-title">{{ t('labs_showroom.title') }}</h2>
        <p class="loading-poster-copy">{{ t('labs_showroom.featured_summary') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-poster {
  position: relative;
  min-height: 28rem;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--ui-color-primary-500) 28%, var(--ui-border));
  border-radius: 1.5rem;
  background: black;
}

.loading-poster-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-poster-overlay {
  position: relative;
  display: flex;
  min-height: 28rem;
  align-items: end;
  padding: 1.5rem;
  background:
    linear-gradient(180deg, rgba(5, 7, 10, 0.08), rgba(5, 7, 10, 0.84) 80%),
    linear-gradient(135deg, rgba(157, 120, 71, 0.24), transparent 45%);
}

.loading-poster-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.74);
}

.loading-poster-title {
  font-size: clamp(2rem, 5vw, 3.75rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  color: white;
}

.loading-poster-copy {
  max-width: 38rem;
  font-size: 0.975rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.78);
}
</style>
