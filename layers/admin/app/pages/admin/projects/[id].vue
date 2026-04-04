<script setup lang="ts">
import type { Id } from '~~/convex/_generated/dataModel'
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { createProject, updateProject } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const isNew = computed(() => route.params.id === 'new')

const existing = isNew.value
  ? ref(null)
  : useSafeConvexQuery(api.projects.getById, { id: route.params.id as Id<'projects'> })

const form = reactive({
  name: '',
  description: '',
  url: '',
  github: '',
  isActive: true,
  highlights: '' as string,
  tags: '' as string,
  order: 0,
})

watch(existing, (project) => {
  if (project) {
    Object.assign(form, {
      name: project.name,
      description: project.description,
      url: project.url ?? '',
      github: project.github ?? '',
      isActive: project.isActive,
      highlights: project.highlights.join(', '),
      tags: project.tags.join(', '),
      order: project.order,
    })
  }
}, { immediate: true })

async function handleSubmit() {
  try {
    const data = {
      name: form.name,
      description: form.description,
      url: form.url || undefined,
      github: form.github || undefined,
      isActive: form.isActive,
      highlights: form.highlights.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      order: form.order,
    }
    if (isNew.value) {
      await createProject(data as Parameters<typeof createProject>[0])
    }
    else {
      await updateProject(route.params.id as string, data)
    }
    toast.add({ title: isNew.value ? 'Project created' : 'Project updated', color: 'success' })
    router.push('/admin/projects')
  }
  catch {
    toast.add({ title: 'Error saving project', color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <UButton :label="t('common.back')" icon="i-lucide-arrow-left" variant="ghost" to="/admin/projects" />
      <h2 class="text-2xl font-bold">
        {{ isNew ? t('common.create') : t('common.edit') }} {{ t('admin.projects') }}
      </h2>
    </div>

    <UForm :state="form" class="space-y-4 max-w-2xl" @submit="handleSubmit">
      <UFormField label="Name" name="name">
        <UInput v-model="form.name" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="form.description" />
      </UFormField>

      <UFormField label="URL" name="url">
        <UInput v-model="form.url" type="url" />
      </UFormField>

      <UFormField label="GitHub" name="github">
        <UInput v-model="form.github" type="url" />
      </UFormField>

      <UFormField label="Highlights (comma-separated)" name="highlights">
        <UInput v-model="form.highlights" />
      </UFormField>

      <UFormField label="Tags (comma-separated)" name="tags">
        <UInput v-model="form.tags" />
      </UFormField>

      <UFormField label="Order" name="order">
        <UInput v-model.number="form.order" type="number" />
      </UFormField>

      <UFormField label="Active" name="isActive">
        <USwitch v-model="form.isActive" />
      </UFormField>

      <div class="flex gap-2 pt-4">
        <UButton type="submit" :label="t('common.save')" />
        <UButton :label="t('common.cancel')" variant="outline" to="/admin/projects" />
      </div>
    </UForm>
  </div>
</template>
