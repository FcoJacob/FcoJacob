<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('nav.projects')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: projects } = await useAsyncData('projects', () => $fetch('/api/public/projects'))
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">
      {{ t('nav.projects') }}
    </h1>

    <div v-if="projects?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard v-for="project in projects" :key="project._id">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              {{ project.name }}
            </h2>
            <UBadge v-if="project.isActive" color="success" :label="t('cv.active')" size="xs" />
          </div>
        </template>

        <p class="text-(--ui-text-muted) mb-4">
          {{ project.description }}
        </p>

        <div v-if="project.highlights.length" class="mb-4">
          <ul class="list-disc list-inside text-sm space-y-1">
            <li v-for="highlight in project.highlights" :key="highlight">
              {{ highlight }}
            </li>
          </ul>
        </div>

        <div v-if="project.tags.length" class="flex flex-wrap gap-1">
          <UBadge v-for="tag in project.tags" :key="tag" :label="tag" color="neutral" size="xs" />
        </div>

        <template #footer>
          <div class="flex gap-2">
            <UButton
              v-if="project.url"
              :to="project.url"
              :label="t('common.visit')"
              size="xs"
              variant="outline"
              target="_blank"
              external
            />
            <UButton
              v-if="project.github"
              :to="project.github"
              label="GitHub"
              size="xs"
              variant="ghost"
              icon="i-simple-icons-github"
              target="_blank"
              external
            />
          </div>
        </template>
      </UCard>
    </div>

    <p v-else class="text-(--ui-text-muted)">
      {{ t('common.loading') }}
    </p>
  </div>
</template>
