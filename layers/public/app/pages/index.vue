<script setup lang="ts">
const { t, tm } = useI18n()

useSeoMeta({
  title: t('app.title'),
  description: t('app.description'),
})

const { data: projects } = await useAsyncData('home-projects', () => $fetch('/api/public/projects'))
const skillKeys = ['frontend', 'backend', 'design', 'tools', 'ai', 'principles'] as const
</script>

<template>
  <div class="space-y-16">
    <!-- Hero -->
    <section class="text-center py-12">
      <h1 class="text-4xl font-bold mb-4">
        {{ t('cv_data.basics.name') }}
      </h1>
      <p class="text-xl text-(--ui-text-muted) max-w-2xl mx-auto">
        {{ t('cv_data.basics.label') }}
      </p>
      <p class="mt-4 text-(--ui-text-muted) max-w-3xl mx-auto">
        {{ t('hero.summary') }}
      </p>
    </section>

    <!-- Featured Projects -->
    <section v-if="projects?.length">
      <h2 class="text-2xl font-bold mb-6">
        {{ t('nav.projects') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="project in projects.slice(0, 6)" :key="project._id">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">
                {{ project.name }}
              </h3>
              <UBadge v-if="project.isActive" color="success" :label="t('cv.active')" size="xs" />
            </div>
          </template>
          <p class="text-sm text-(--ui-text-muted)">
            {{ project.description }}
          </p>
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
      <div class="mt-6 text-center">
        <UButton :label="t('nav.projects')" to="/projects" variant="outline" />
      </div>
    </section>

    <!-- Skills -->
    <section>
      <h2 class="text-2xl font-bold mb-6">
        {{ t('cv.skills') }}
      </h2>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="key in skillKeys"
          :key="key"
          :label="t(`cv_data.skills.${key}.name`)"
          color="neutral"
          size="lg"
        />
      </div>
    </section>
  </div>
</template>
