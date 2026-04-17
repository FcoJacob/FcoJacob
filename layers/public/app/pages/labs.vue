<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('nav.labs')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: labs } = await useAsyncData('labs', () => $fetch('/api/public/labs'))
</script>

<template>
  <div class="space-y-10">
    <header v-reveal class="space-y-3">
      <p class="text-xs uppercase tracking-[0.25em] text-(--ui-color-primary-500)">Experiments</p>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
        {{ t('nav.labs') }}
      </h1>
    </header>

    <div
      v-if="labs?.length"
      v-reveal.stagger
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <UCard
        v-for="lab in labs"
        :key="lab._id"
        variant="subtle"
        class="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-(--ui-color-primary-500)/30"
      >
        <div class="space-y-3">
          <h2 class="font-semibold group-hover:text-(--ui-color-primary-500) transition-colors">
            {{ lab.name }}
          </h2>
          <p class="text-sm text-(--ui-text-muted) leading-relaxed">{{ lab.description }}</p>
          <div v-if="lab.tags.length" class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="tag in lab.tags"
              :key="tag"
              :label="tag"
              color="neutral"
              variant="outline"
              size="xs"
            />
          </div>
          <UButton
            v-if="lab.url"
            :to="lab.url"
            :label="t('common.visit')"
            size="xs"
            variant="outline"
            icon="i-lucide-external-link"
            target="_blank"
            external
          />
        </div>
      </UCard>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-(--ui-text-muted)">{{ t('common.no_items') }}</p>
    </div>
  </div>
</template>
