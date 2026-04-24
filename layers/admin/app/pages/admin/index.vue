<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const blogs = useSafeConvexQuery(api.blogs.list, {})
const projects = useSafeConvexQuery(api.projects.list, {})

const stats = computed(() => [
  {
    label: t('admin.blogs'),
    value: blogs.value?.length ?? 0,
    icon: 'i-lucide-file-text',
    to: '/admin/blogs',
    published: blogs.value?.filter((b) => b.published).length ?? 0,
  },
  {
    label: t('admin.projects'),
    value: projects.value?.length ?? 0,
    icon: 'i-lucide-folder-kanban',
    to: '/admin/projects',
    published: projects.value?.filter((p) => p.isActive).length ?? 0,
  },
])
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">
      {{ t('admin.dashboard') }}
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <UCard v-for="stat in stats" :key="stat.label" class="hover:shadow-md transition-shadow">
        <NuxtLink :to="stat.to" class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-elevated">
            <UIcon :name="stat.icon" class="size-6 text-primary" />
          </div>
          <div>
            <p class="text-2xl font-bold">
              {{ stat.value }}
            </p>
            <p class="text-sm text-muted">{{ stat.label }} &middot; {{ stat.published }} active</p>
          </div>
        </NuxtLink>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Quick actions</h3>
      </template>
      <div class="flex flex-wrap gap-2">
        <UButton
          :label="`New ${t('admin.blogs')}`"
          icon="i-lucide-plus"
          variant="outline"
          to="/admin/blogs/new"
        />
        <UButton
          :label="`New ${t('admin.projects')}`"
          icon="i-lucide-plus"
          variant="outline"
          to="/admin/projects/new"
        />
        <UButton
          :label="`Edit ${t('admin.cv')}`"
          icon="i-lucide-pencil"
          variant="outline"
          to="/admin/cv"
        />
      </div>
    </UCard>
  </div>
</template>
