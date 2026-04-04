<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const { upsertCv } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const cvData = useSafeConvexQuery(api.cv.get, {})

const jsonInput = ref('')

watch(cvData, (data) => {
  if (data) {
    const { _id, _creationTime, ...rest } = data
    jsonInput.value = JSON.stringify(rest, null, 2)
  }
}, { immediate: true })

async function handleSubmit() {
  try {
    const parsed = JSON.parse(jsonInput.value)
    await upsertCv(parsed)
    toast.add({ title: 'CV updated', color: 'success' })
  }
  catch (e) {
    const message = e instanceof SyntaxError ? 'Invalid JSON' : 'Error saving CV'
    toast.add({ title: message, color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">
        {{ t('admin.cv') }}
      </h2>
      <UButton :label="t('common.save')" icon="i-lucide-save" @click="handleSubmit" />
    </div>

    <p class="text-sm text-(--ui-text-muted) mb-4">
      Edit the CV JSON following the
      <a
        href="https://github.com/midudev/minimalist-portfolio-json/blob/main/cv.json"
        target="_blank"
        rel="noopener"
        class="underline"
      >minimalist-portfolio-json</a>
      schema.
    </p>

    <UTextarea
      v-model="jsonInput"
      :rows="30"
      class="font-mono text-sm"
    />
  </div>
</template>
