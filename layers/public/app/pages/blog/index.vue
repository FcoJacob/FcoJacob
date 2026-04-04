<script setup lang="ts">
const { t, locale } = useI18n()

useSeoMeta({
  title: `${t('nav.blog')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: blogs } = await useAsyncData('blogs', () => $fetch('/api/public/blogs', { query: { locale: locale.value } }))
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">
      {{ t('nav.blog') }}
    </h1>

    <div v-if="blogs?.length" class="space-y-6">
      <UCard v-for="blog in blogs" :key="blog._id">
        <template #header>
          <NuxtLink :to="`/blog/${blog.slug}`" class="hover:underline">
            <h2 class="text-xl font-semibold">
              {{ blog.title }}
            </h2>
          </NuxtLink>
        </template>
        <p class="text-(--ui-text-muted)">
          {{ blog.excerpt }}
        </p>
        <template #footer>
          <div class="flex items-center justify-between text-sm text-(--ui-text-muted)">
            <time :datetime="new Date(blog.createdAt).toISOString()">
              {{ new Date(blog.createdAt).toLocaleDateString(locale) }}
            </time>
            <NuxtLink :to="`/blog/${blog.slug}`" class="text-(--ui-color-primary-500) hover:underline">
              {{ t('common.read_more') }}
            </NuxtLink>
          </div>
        </template>
      </UCard>
    </div>

    <p v-else class="text-(--ui-text-muted)">
      {{ t('common.loading') }}
    </p>
  </div>
</template>
