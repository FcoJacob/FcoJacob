<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: `${t('nav.projects')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: projects } = await useAsyncData('projects', () => $fetch('/api/public/projects'))
</script>

<template>
  <div class="space-y-14">
    <PageHeader
      eyebrow="Work"
      :title="t('nav.projects')"
      :subtitle="t('common.projects_subtitle')"
    />

    <div v-if="projects?.length" class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      <article
        v-for="(project, i) in projects"
        :key="project._id"
        v-reveal="{ delay: i * 0.1 }"
        class="project-card group relative rounded-2xl overflow-hidden border border-(--ui-border) bg-(--ui-bg-elevated) cursor-default"
      >
        <!-- Thumbnail con overlay -->
        <div class="relative h-52 md:h-60 overflow-hidden">
          <img
            v-if="project.thumbnail"
            :src="project.thumbnail"
            :alt="project.name"
            class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-(--ui-color-primary-900)/30 to-(--ui-bg) flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-layout-dashboard"
              class="size-12 text-(--ui-color-primary-500)/30"
            />
          </div>

          <!-- Gradient overlay siempre presente -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          />

          <!-- Nombre encima de la imagen en mobile/tablet -->
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <div class="flex items-end justify-between gap-3">
              <h2 class="text-lg md:text-xl font-bold text-white leading-tight drop-shadow-lg">
                {{ project.name }}
              </h2>
              <UBadge
                v-if="project.isActive"
                color="success"
                variant="solid"
                :label="t('cv.active')"
                size="md"
                class="shrink-0 mb-0.5"
              />
            </div>
          </div>

          <!-- Shine effect on hover -->
          <div
            class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style="
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
            "
          />
        </div>

        <!-- Contenido -->
        <div class="p-5 md:p-6 space-y-4">
          <p class="text-base md:text-base text-(--ui-text-muted) leading-relaxed line-clamp-3">
            {{ project.description }}
          </p>

          <!-- Tags -->
          <div v-if="project.tags?.length" class="flex flex-wrap gap-1.5 md:gap-2">
            <UBadge
              v-for="tag in project.tags"
              :key="tag"
              :label="tag"
              color="neutral"
              variant="subtle"
              size="md"
            />
          </div>

          <!-- CTA -->
          <div class="pt-1">
            <UButton
              v-if="project.url"
              :to="project.url"
              :label="t('common.visit')"
              size="md"
              variant="outline"
              icon="i-lucide-external-link"
              target="_blank"
              external
              class="w-full justify-center transition-all duration-300 group-hover:border-(--ui-color-primary-500) group-hover:text-(--ui-color-primary-500)"
            />
          </div>
        </div>

        <!-- Animated border glow on hover -->
        <div
          class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style="box-shadow: inset 0 0 0 1px rgba(var(--ui-color-primary-500-rgb, 99 102 241), 0.5)"
        />
      </article>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-(--ui-text-muted)">{{ t('common.no_items') }}</p>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  transform-style: preserve-3d;
  transition:
    transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.project-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(var(--ui-color-primary-500-rgb, 99 102 241) / 0.15);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
