<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { createBlog, updateBlog } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const isNew = computed(() => route.params.id === 'new')

const existing = isNew.value ? ref(null) : useSafeConvexQuery(api.blogs.getBySlug, { slug: '' })

const form = reactive({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  coverImage: '',
  published: false,
  locale: 'es',
})

watch(existing, (blog) => {
  if (blog) {
    Object.assign(form, {
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt,
      coverImage: blog.coverImage ?? '',
      published: blog.published,
      locale: blog.locale,
    })
  }
}, { immediate: true })

async function handleSubmit() {
  try {
    if (isNew.value) {
      await createBlog({ ...form, coverImage: form.coverImage || undefined })
    }
    else {
      await updateBlog(route.params.id as string, { ...form, coverImage: form.coverImage || undefined })
    }
    toast.add({ title: isNew.value ? 'Blog created' : 'Blog updated', color: 'success' })
    router.push('/admin/blogs')
  }
  catch {
    toast.add({ title: 'Error saving blog', color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <UButton :label="t('common.back')" icon="i-lucide-arrow-left" variant="ghost" to="/admin/blogs" />
      <h2 class="text-2xl font-bold">
        {{ isNew ? t('common.create') : t('common.edit') }} {{ t('admin.blogs') }}
      </h2>
    </div>

    <UForm :state="form" class="space-y-4 max-w-2xl" @submit="handleSubmit">
      <UFormField label="Title" name="title">
        <UInput v-model="form.title" />
      </UFormField>

      <UFormField label="Slug" name="slug">
        <UInput v-model="form.slug" />
      </UFormField>

      <UFormField label="Excerpt" name="excerpt">
        <UTextarea v-model="form.excerpt" />
      </UFormField>

      <UFormField label="Content" name="content">
        <UTextarea v-model="form.content" :rows="10" />
      </UFormField>

      <UFormField label="Cover Image URL" name="coverImage">
        <UInput v-model="form.coverImage" />
      </UFormField>

      <UFormField label="Locale" name="locale">
        <USelect
          v-model="form.locale"
          :items="[{ label: 'Español', value: 'es' }, { label: 'English', value: 'en' }]"
        />
      </UFormField>

      <UFormField label="Published" name="published">
        <USwitch v-model="form.published" />
      </UFormField>

      <div class="flex gap-2 pt-4">
        <UButton type="submit" :label="t('common.save')" />
        <UButton :label="t('common.cancel')" variant="outline" to="/admin/blogs" />
      </div>
    </UForm>
  </div>
</template>
