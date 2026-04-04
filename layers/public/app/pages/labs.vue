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
    <h1 class="text-3xl font-bold mb-8">
      {{ t('nav.labs') }}
    </h1>

    <div v-if="labs?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard v-for="lab in labs" :key="lab._id">
        <template #header>
          <h2 class="font-semibold">
            {{ lab.name }}
          </h2>
        </template>

        <p class="text-sm text-(--ui-text-muted)">
          {{ lab.description }}
        </p>

        <div v-if="lab.tags.length" class="mt-3 flex flex-wrap gap-1">
          <UBadge v-for="tag in lab.tags" :key="tag" :label="tag" color="neutral" size="xs" />
        </div>

        <template v-if="lab.url" #footer>
          <UButton
            :to="lab.url"
            :label="t('common.visit')"
            size="xs"
            variant="outline"
            target="_blank"
            external
          />
        </template>
      </UCard>
    </div>

    <p v-else class="text-(--ui-text-muted)">
      {{ t('common.loading') }}
    </p>
  </div>
</template>
