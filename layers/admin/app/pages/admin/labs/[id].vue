<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { createLab, updateLab } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const isNew = computed(() => route.params.id === 'new')

const form = reactive({
  name: '',
  description: '',
  url: '',
  tags: '' as string,
  published: false,
})

async function handleSubmit() {
  try {
    const data = {
      name: form.name,
      description: form.description,
      url: form.url || undefined,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      published: form.published,
    }
    if (isNew.value) {
      await createLab(data as Parameters<typeof createLab>[0])
    }
    else {
      await updateLab(route.params.id as string, data)
    }
    toast.add({ title: isNew.value ? 'Lab created' : 'Lab updated', color: 'success' })
    router.push('/admin/labs')
  }
  catch {
    toast.add({ title: 'Error saving lab', color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <UButton :label="t('common.back')" icon="i-lucide-arrow-left" variant="ghost" to="/admin/labs" />
      <h2 class="text-2xl font-bold">
        {{ isNew ? t('common.create') : t('common.edit') }} {{ t('admin.labs') }}
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

      <UFormField label="Tags (comma-separated)" name="tags">
        <UInput v-model="form.tags" />
      </UFormField>

      <UFormField label="Published" name="published">
        <USwitch v-model="form.published" />
      </UFormField>

      <div class="flex gap-2 pt-4">
        <UButton type="submit" :label="t('common.save')" />
        <UButton :label="t('common.cancel')" variant="outline" to="/admin/labs" />
      </div>
    </UForm>
  </div>
</template>
