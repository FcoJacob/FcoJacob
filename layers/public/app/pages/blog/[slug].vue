<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

const { data: blog } = await useAsyncData(`blog-${route.params.slug}`, () =>
  $fetch('/api/public/blog-by-slug', { query: { slug: route.params.slug as string } }),
)

useSeoMeta({
  title: () => blog.value?.title ?? t('nav.blog'),
  description: () => blog.value?.excerpt ?? '',
})
</script>

<template>
  <article v-if="blog" class="max-w-3xl mx-auto">
    <header class="mb-8">
      <NuxtLink to="/blog" class="text-sm text-(--ui-text-muted) hover:underline mb-4 inline-block">
        ← {{ t('common.back') }}
      </NuxtLink>
      <h1 class="text-4xl font-bold mb-2">
        {{ blog.title }}
      </h1>
      <time :datetime="new Date(blog.createdAt).toISOString()" class="text-sm text-(--ui-text-muted)">
        {{ new Date(blog.createdAt).toLocaleDateString() }}
      </time>
    </header>

    <div class="prose dark:prose-invert max-w-none" v-html="blog.content" />
  </article>

  <div v-else class="text-center py-12">
    <p class="text-(--ui-text-muted)">
      {{ t('common.loading') }}
    </p>
  </div>
</template>
