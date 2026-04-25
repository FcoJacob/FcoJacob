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

    <div v-if="labs?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      <UCard
        v-for="(lab, i) in labs"
        :key="lab._id"
        v-reveal="{ delay: i * 0.08 }"
        variant="subtle"
        class="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-(--ui-color-primary-500)/30"
      >
        <div class="space-y-3 md:space-y-4">
          <h2 class="card-title group-hover:text-(--ui-color-primary-500) transition-colors">
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
      <p class="text-(--ui-text-muted)">{{ t('common.no_items') }}</p>
    </div>
  </div>
</template>
