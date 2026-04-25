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
const saving = ref(false)

const existing = isNew.value
  ? ref(null)
  : useSafeConvexQuery(api.projects.getById, { id: route.params.id as Id<'projects'> })

const form = reactive({
  name: '',
  description: '',
  url: '',
  thumbnail: '',
  tags: '' as string,
  isActive: true,
  order: 0,
})

watch(
  existing,
  (project) => {
    if (project) {
      Object.assign(form, {
        name: project.name,
        description: project.description,
        url: project.url ?? '',
        thumbnail: project.thumbnail ?? '',
        tags: project.tags.join(', '),
        isActive: project.isActive,
        order: project.order,
      })
    }
  },
  { immediate: true },
)

async function handleSubmit() {
  if (!form.name || !form.description) {
    toast.add({ title: t('admin.project_editor.validation_required'), color: 'error' })
    return
  }
  saving.value = true
  try {
    const data = {
      name: form.name,
      description: form.description,
      url: form.url || undefined,
      thumbnail: form.thumbnail || undefined,
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isActive: form.isActive,
      order: form.order,
    }
    if (isNew.value) {
      await createProject(data as Parameters<typeof createProject>[0])
    } else {
      await updateProject(route.params.id as string, data)
    }
    toast.add({
      title: isNew.value ? t('admin.project_editor.created') : t('admin.project_editor.updated'),
      color: 'success',
    })
    router.push('/admin/projects')
  } catch {
    toast.add({ title: t('admin.project_editor.save_error'), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <UButton icon="i-lucide-arrow-left" variant="ghost" size="sm" to="/admin/projects" />
        <h2 class="text-2xl font-bold tracking-tight">
          {{ isNew ? t('common.create') : t('common.edit') }} {{ t('admin.projects') }}
        </h2>
      </div>
      <UBadge
        :color="form.isActive ? 'success' : 'neutral'"
        :label="
          form.isActive ? t('admin.project_editor.active') : t('admin.project_editor.inactive')
        "
        variant="subtle"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <!-- Main content area -->
      <div class="space-y-6 min-w-0">
        <!-- Name -->
        <UInput
          v-model="form.name"
          :placeholder="t('admin.project_editor.name_placeholder')"
          size="xl"
          class="w-full"
          :ui="{ base: 'text-2xl! font-bold!' }"
        />

        <!-- Description -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">{{ t('admin.project_editor.description') }}</label>
            <span class="text-xs text-(--ui-text-muted)">
              {{ form.description.length }} / 500
            </span>
          </div>
          <UTextarea
            v-model="form.description"
            :rows="4"
            :maxlength="500"
            :placeholder="t('admin.project_editor.description_placeholder')"
            class="w-full"
          />
        </div>

        <!-- Project URL -->
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('admin.project_editor.project_url') }}</label>
          <UInput
            v-model="form.url"
            type="url"
            :placeholder="t('admin.project_editor.url_placeholder')"
            class="w-full"
            icon="i-lucide-external-link"
          />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-5 lg:sticky lg:top-4 lg:self-start">
        <!-- Actions card -->
        <div class="rounded-xl border border-(--ui-border) overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-(--ui-border)">
            <h3 class="text-sm font-semibold">{{ t('admin.project_editor.settings') }}</h3>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-(--ui-text-muted)">{{
                t('admin.project_editor.status')
              }}</span>
              <USwitch v-model="form.isActive" size="sm" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-(--ui-text-muted)">{{
                t('admin.project_editor.order')
              }}</label>
              <UInput v-model.number="form.order" type="number" size="sm" class="w-full" :min="0" />
            </div>
            <div class="flex gap-2 pt-2 border-t border-(--ui-border)">
              <UButton
                :label="t('common.save')"
                icon="i-lucide-save"
                :loading="saving"
                size="sm"
                class="flex-1"
                @click="handleSubmit"
              />
              <UButton
                :label="t('common.cancel')"
                variant="outline"
                size="sm"
                to="/admin/projects"
              />
            </div>
          </div>
        </div>

        <!-- Thumbnail card -->
        <div class="rounded-xl border border-(--ui-border) overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-(--ui-border)">
            <h3 class="text-sm font-semibold">{{ t('admin.project_editor.thumbnail') }}</h3>
          </div>
          <div class="p-4 space-y-3">
            <UInput
              v-model="form.thumbnail"
              :placeholder="t('admin.project_editor.thumbnail_placeholder')"
              size="sm"
              class="w-full"
            />
            <div
              v-if="form.thumbnail"
              class="rounded-lg overflow-hidden border border-(--ui-border)"
            >
              <img
                :src="form.thumbnail"
                alt="Thumbnail preview"
                class="w-full aspect-video object-cover"
              />
            </div>
            <div
              v-else
              class="rounded-lg border border-dashed border-(--ui-border) flex items-center justify-center aspect-video text-(--ui-text-muted)"
            >
              <div class="text-center space-y-1">
                <UIcon name="i-lucide-image" class="size-6 mx-auto opacity-40" />
                <p class="text-xs">{{ t('admin.project_editor.no_image') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags card -->
        <div class="rounded-xl border border-(--ui-border) overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-(--ui-border)">
            <h3 class="text-sm font-semibold">{{ t('admin.project_editor.tags') }}</h3>
          </div>
          <div class="p-4 space-y-3">
            <UInput
              v-model="form.tags"
              :placeholder="t('admin.project_editor.tags_placeholder')"
              size="sm"
              class="w-full"
            />
            <div v-if="form.tags" class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="tag in form.tags
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean)"
                :key="tag"
                :label="tag"
                size="sm"
                variant="subtle"
              />
            </div>
            <p v-else class="text-xs text-(--ui-text-muted)">
              {{ t('admin.project_editor.tags_hint') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
