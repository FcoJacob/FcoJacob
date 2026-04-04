<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('nav.labs')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: labs } = await useAsyncData('labs', () => $fetch('/api/public/labs'))
</script>

<template>
  <div>
    <div v-if="labs?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <UCard v-for="lab in labs" :key="lab._id" variant="subtle" class="group">
        <div class="space-y-3">
          <h2 class="font-semibold group-hover:text-(--ui-color-primary-500) transition-colors">{{ lab.name }}</h2>
          <p class="text-sm text-(--ui-text-muted) leading-relaxed">{{ lab.description }}</p>
          <div v-if="lab.tags.length" class="flex flex-wrap gap-1.5">
            <UBadge v-for="tag in lab.tags" :key="tag" :label="tag" color="neutral" variant="outline" size="xs" />
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
