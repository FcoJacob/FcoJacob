<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('nav.projects')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: projects } = await useAsyncData('projects', () => $fetch('/api/public/projects'))
</script>

<template>
  <div class="space-y-10">
    <header v-reveal class="space-y-3">
      <p class="text-xs uppercase tracking-[0.25em] text-(--ui-color-primary-500)">Work</p>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
        {{ t('nav.projects') }}
      </h1>
      <p class="text-base text-(--ui-text-muted) max-w-2xl leading-relaxed">
        {{ t('common.projects_subtitle') }}
      </p>
    </header>

    <div v-if="projects?.length" v-reveal.stagger class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <UCard
        v-for="project in projects"
        :key="project._id"
        variant="subtle"
        class="group project-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-(--ui-color-primary-500)/40"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <h2
              class="text-lg font-semibold group-hover:text-(--ui-color-primary-500) transition-colors"
            >
              {{ project.name }}
            </h2>
            <UBadge
              v-if="project.isActive"
              color="success"
              variant="subtle"
              :label="t('cv.active')"
              size="xs"
            />
          </div>

          <p class="text-sm text-(--ui-text-muted) leading-relaxed">{{ project.description }}</p>

          <ul v-if="project.highlights.length" class="space-y-1.5">
            <li
              v-for="highlight in project.highlights"
              :key="highlight"
              class="flex items-start gap-2 text-sm text-(--ui-text-muted)"
            >
              <UIcon
                name="i-lucide-chevron-right"
                class="size-3.5 mt-0.5 shrink-0 text-(--ui-color-primary-500)"
              />
              {{ highlight }}
            </li>
          </ul>

          <div v-if="project.tags.length" class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="tag in project.tags"
              :key="tag"
              :label="tag"
              color="neutral"
              variant="outline"
              size="xs"
            />
          </div>

          <div class="flex gap-2 pt-1">
            <UButton
              v-if="project.url"
              :to="project.url"
              :label="t('common.visit')"
              size="xs"
              variant="outline"
              icon="i-lucide-external-link"
              target="_blank"
              external
            />
            <UButton
              v-if="project.github"
              :to="project.github"
              label="GitHub"
              size="xs"
              variant="ghost"
              icon="i-lucide-github"
              target="_blank"
              external
            />
          </div>
        </div>
      </UCard>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-(--ui-text-muted)">{{ t('common.no_items') }}</p>
    </div>
  </div>
</template>
