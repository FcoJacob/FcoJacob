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
      variant="outline"
      class="group relative overflow-hidden bg-white dark:bg-gray-900/50 ring-1 ring-gray-200 dark:ring-white/10 hover:ring-primary-500/50 dark:hover:ring-primary-400/50 transition-shadow"
    >
      <div
        class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_var(--ui-color-primary-500)_0%,_transparent_50%)] opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity"
      />
      <div class="relative grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
        <div class="space-y-5">
          <div class="flex flex-wrap gap-2">
            <UBadge color="primary" variant="soft" :label="t('labs_showroom.featured_badge')" />
            <UBadge
              color="neutral"
              variant="outline"
              class="bg-white dark:bg-transparent"
              :label="t('labs_showroom.phase_zero_badge')"
            />
          </div>

          <div class="space-y-3">
            <h2
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {{ t('labs_showroom.title') }}
            </h2>
            <p class="max-w-2xl text-sm sm:text-base leading-7 text-gray-600 dark:text-gray-300">
              {{ t('labs_showroom.featured_summary') }}
            </p>
          </div>

          <div class="space-y-2">
            <p
              class="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400"
            >
              {{ t('labs_showroom.stack_label') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="tag in [
                  t('labs_showroom.tag_threejs'),
                  t('labs_showroom.tag_gltf'),
                  t('labs_showroom.tag_hdr'),
                  t('labs_showroom.tag_physics'),
                  t('labs_showroom.tag_typescript'),
                  t('labs_showroom.tag_nuxt4'),
                ]"
                :key="tag"
                :label="tag"
                color="neutral"
                variant="outline"
                class="bg-white dark:bg-transparent"
                size="md"
              />
            </div>
          </div>

          <div class="space-y-2.5 border-t border-gray-200 dark:border-white/10 pt-4">
            <p
              class="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400"
            >
              {{ t('labs_showroom.challenges_label') }}
            </p>
            <ul class="space-y-2">
              <li
                v-for="key in ['challenge_1', 'challenge_2', 'challenge_3']"
                :key="key"
                class="flex items-start gap-2.5"
              >
                <UIcon
                  name="i-lucide-zap"
                  class="mt-0.5 shrink-0 size-3.5 text-primary-500 dark:text-primary-400"
                />
                <span class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{{
                  t(`labs_showroom.${key}`)
                }}</span>
              </li>
            </ul>
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

        <div
          class="relative min-h-64 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30"
        >
          <img
            src="/labs/dealer-showroom/posters/hero-poster.svg"
            :alt="t('labs_showroom.poster_alt')"
            class="absolute inset-0 size-full object-cover opacity-90 dark:opacity-100"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-gray-900/80 dark:from-black/80 via-gray-900/20 dark:via-black/20 to-transparent"
          />
          <div class="absolute inset-x-0 bottom-0 p-5">
            <p class="text-xs font-medium uppercase tracking-[0.24em] text-white">
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
  </div>
</template>

<style scoped></style>
