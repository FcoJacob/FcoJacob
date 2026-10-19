<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()

useSeoMeta({
  title: `${t('nav.labs')} - ${t('app.title')}`,
  description: t('seo.labs_description'),
  ogTitle: `${t('nav.labs')} - ${t('app.title')}`,
  ogDescription: t('seo.labs_description'),
})

const { data: labs } = await useAsyncData('labs', () => $fetch('/api/public/labs'))

// Strip the locale prefix (e.g. "/en") before matching, since route.path
// includes it under the "prefix_except_default" i18n strategy.
function withoutLocalePrefix(path: string) {
  return path.replace(/\/$/, '').replace(/^\/en(?=\/|$)/, '') || '/'
}

// Immersive labs mount as a fixed fullscreen stage on top of the base layout.
const immersiveRoutes = ['/labs/wizard-alley', '/labs/dealer-showroom']

const isNestedLabsRoute = computed(() => withoutLocalePrefix(route.path) !== '/labs')
const isImmersiveRoute = computed(() => immersiveRoutes.includes(withoutLocalePrefix(route.path)))

const immersiveLabs = computed(() => [
  {
    slug: 'wizard-alley',
    badge: t('labs_alley.badge'),
    phase: t('labs_alley.phase_badge'),
    title: t('labs_alley.title'),
    summary: t('labs_alley.featured_summary'),
    tags: [t('labs_alley.tag_three'), t('labs_alley.tag_procedural'), t('labs_alley.tag_tryon')],
    cta: t('labs_alley.enter_cta'),
    poster: '/labs/wizard-alley/posters/hero-poster.svg',
    posterAlt: t('labs_alley.poster_alt'),
    posterCaption: t('labs_alley.poster_caption'),
  },
  {
    slug: 'dealer-showroom',
    badge: t('labs_showroom.featured_badge'),
    phase: t('labs_showroom.phase_zero_badge'),
    title: t('labs_showroom.title'),
    summary: t('labs_showroom.featured_summary'),
    tags: [
      t('labs_showroom.tag_webgl'),
      t('labs_showroom.tag_scroll'),
      t('labs_showroom.tag_configurator'),
    ],
    cta: t('labs_showroom.enter_cta'),
    poster: '/labs/dealer-showroom/posters/hero-poster.svg',
    posterAlt: t('labs_showroom.poster_alt'),
    posterCaption: t('labs_showroom.poster_caption'),
  },
])
</script>

<template>
  <div>
    <div
      v-if="isNestedLabsRoute"
      class="labs-nested-route"
      :class="{ 'labs-nested-route-immersive': isImmersiveRoute }"
    >
      <NuxtPage />
    </div>

    <div v-else class="space-y-12">
      <PageHeader eyebrow="AI · 3D" :title="t('nav.labs')" :subtitle="t('common.labs_subtitle')" />

      <div class="space-y-6">
        <UCard
          v-for="(lab, i) in immersiveLabs"
          :key="lab.slug"
          v-reveal="{ delay: i * 0.1 }"
          v-tilt
          variant="subtle"
          class="featured-lab-card !overflow-visible"
        >
          <div
            class="grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-center"
            :class="{ 'lg:[&>*:first-child]:order-2': i % 2 === 1 }"
          >
            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <UBadge color="primary" variant="soft" :label="lab.badge" />
                <UBadge color="neutral" variant="outline" :label="lab.phase" />
              </div>

              <div class="space-y-3">
                <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-highlighted">
                  {{ lab.title }}
                </h2>
                <p class="max-w-2xl text-sm sm:text-base leading-7 text-muted">
                  {{ lab.summary }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="tag in lab.tags"
                  :key="tag"
                  :label="tag"
                  color="neutral"
                  variant="outline"
                  size="md"
                />
              </div>

              <div class="flex flex-wrap gap-3 pt-1">
                <UButton
                  :to="localePath(`/labs/${lab.slug}`)"
                  :label="lab.cta"
                  icon="i-lucide-arrow-right"
                  size="lg"
                />
              </div>
            </div>

            <div class="relative min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img
                :src="lab.poster"
                :alt="lab.posterAlt"
                class="absolute inset-0 size-full object-cover"
              >
              <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent" />
              <div class="absolute inset-x-0 bottom-0 p-5">
                <p class="text-xs font-medium uppercase tracking-[0.24em] text-white/70">
                  {{ lab.posterCaption }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <div v-if="labs?.length" class="space-y-6">
        <h3 class="text-xl font-semibold tracking-tight text-highlighted">
          {{ t('common.other_experiments') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <UCard
            v-for="(lab, i) in labs"
            :key="lab._id"
            v-tilt
            v-reveal="{ delay: i * 0.08 }"
            variant="subtle"
            class="group !overflow-visible transition-[border-color,box-shadow] duration-300 hover:shadow-lg hover:border-(--ui-color-primary-500)/30"
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.labs-nested-route-immersive {
  position: fixed;
  inset: 0;
  z-index: 80;
  width: 100vw;
  height: 100svh;
  background: #05070b;
}

.featured-lab-card {
  border-color: color-mix(in oklab, var(--ui-color-primary-500) 30%, var(--ui-border));
  background:
    radial-gradient(circle at top left, color-mix(in oklab, var(--ui-color-primary-500) 20%, transparent), transparent 40%),
    linear-gradient(135deg, color-mix(in oklab, var(--ui-bg-elevated) 92%, black 8%), color-mix(in oklab, var(--ui-bg) 82%, black 18%));
}
</style>
