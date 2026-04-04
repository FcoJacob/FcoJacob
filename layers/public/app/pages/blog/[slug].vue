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
    <header class="mb-10">
      <UButton to="/blog" :label="t('common.back')" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="mb-6" />
      <h1 class="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">{{ blog.title }}</h1>
      <time :datetime="new Date(blog.createdAt).toISOString()" class="text-sm text-(--ui-text-muted)">
        {{ new Date(blog.createdAt).toLocaleDateString() }}
      </time>
    </header>

    <USeparator class="mb-10" />

    <div class="prose dark:prose-invert max-w-none" v-html="blog.content" />

    <USeparator class="my-10" />

    <UButton to="/blog" :label="t('common.back')" variant="outline" icon="i-lucide-arrow-left" size="sm" />
  </article>

  <div v-else class="text-center py-16">
    <p class="text-(--ui-text-muted)">{{ t('common.loading') }}</p>
  </div>
</template>
