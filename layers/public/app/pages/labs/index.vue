<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('nav.labs')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: labs } = await useAsyncData('labs', () => $fetch('/api/public/labs'))
</script>

<template>
  <div class="space-y-12">
    <PageHeader eyebrow="Experiments" :title="t('nav.labs')" />

    <UCard
      v-reveal
      variant="subtle"
      class="featured-lab-card overflow-hidden"
    >
      <div class="grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UBadge color="primary" variant="soft" :label="t('labs_showroom.featured_badge')" />
            <UBadge color="neutral" variant="outline" :label="t('labs_showroom.phase_zero_badge')" />
          </div>

          <div class="space-y-3">
            <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-highlighted">
              {{ t('labs_showroom.title') }}
            </h2>
            <p class="max-w-2xl text-sm sm:text-base leading-7 text-muted">
              {{ t('labs_showroom.featured_summary') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="tag in [t('labs_showroom.tag_webgl'), t('labs_showroom.tag_scroll'), t('labs_showroom.tag_configurator')]"
              :key="tag"
              :label="tag"
              color="neutral"
              variant="outline"
              size="md"
            />
          </div>

          <div class="flex flex-wrap gap-3 pt-1">
            <UButton
              to="/labs/dealer-showroom"
              :label="t('labs_showroom.enter_cta')"
              icon="i-lucide-arrow-right"
              size="lg"
            />
          </div>
        </div>

        <div class="relative min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <img
            src="/labs/dealer-showroom/posters/hero-poster.svg"
            :alt="t('labs_showroom.poster_alt')"
            class="absolute inset-0 size-full object-cover"
          >
          <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 p-5">
            <p class="text-xs font-medium uppercase tracking-[0.24em] text-white/70">
              {{ t('labs_showroom.poster_caption') }}
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <div v-if="labs?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      <UCard
        v-for="(lab, i) in labs"
        :key="lab._id"
        v-reveal="{ delay: i * 0.08 }"
        variant="subtle"
        class="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-(--ui-color-primary-500)/30"
      >
        <div class="space-y-3 md:space-y-4">
          <h2 class="card-title group-hover:text-primary-500 transition-colors">
            {{ lab.name }}
          </h2>
          <p class="card-body">{{ lab.description }}</p>
          <div v-if="lab.tags.length" class="flex flex-wrap gap-1.5 md:gap-2">
            <UBadge
              v-for="tag in lab.tags"
              :key="tag"
              :label="tag"
              color="neutral"
              variant="outline"
              size="md"
            />
          </div>
          <UButton
            v-if="lab.url"
            :to="lab.url"
            :label="t('common.visit')"
            size="md"
            variant="outline"
            icon="i-lucide-external-link"
            target="_blank"
            external
          />
        </div>
      </UCard>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-muted">{{ t('common.no_items') }}</p>
    </div>
  </div>
</template>

<style scoped>
.featured-lab-card {
  border-color: color-mix(in oklab, var(--ui-color-primary-500) 30%, var(--ui-border));
  background:
    radial-gradient(circle at top left, color-mix(in oklab, var(--ui-color-primary-500) 20%, transparent), transparent 40%),
    linear-gradient(135deg, color-mix(in oklab, var(--ui-bg-elevated) 92%, black 8%), color-mix(in oklab, var(--ui-bg) 82%, black 18%));
}
</style>