<script setup lang="ts">
const { t, locale } = useI18n()

useSeoMeta({
  title: `${t('nav.blog')} - ${t('app.title')}`,
  description: t('app.description'),
})

const { data: blogs } = await useAsyncData('blogs', () =>
  $fetch('/api/public/blogs', { query: { locale: locale.value } }),
)
</script>

<template>
  <div class="space-y-10">
    <header v-reveal class="space-y-3">
      <p class="text-xs uppercase tracking-[0.25em] text-(--ui-color-primary-500)">Writing</p>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
        {{ t('nav.blog') }}
      </h1>
    </header>

    <div v-if="blogs?.length" v-reveal.stagger class="space-y-5">
      <NuxtLink
        v-for="blog in blogs"
        :key="blog._id"
        :to="`/blog/${blog.slug}`"
        class="block group"
      >
        <UCard
          variant="subtle"
          class="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-(--ui-color-primary-500)/30"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="space-y-1.5 flex-1">
              <h2
                class="text-lg font-semibold group-hover:text-(--ui-color-primary-500) transition-colors"
              >
                {{ blog.title }}
              </h2>
              <p class="text-sm text-(--ui-text-muted) line-clamp-2">{{ blog.excerpt }}</p>
            </div>
            <div class="flex items-center gap-3 text-sm text-(--ui-text-muted) shrink-0">
              <time :datetime="new Date(blog.createdAt).toISOString()">{{
                new Date(blog.createdAt).toLocaleDateString(locale)
              }}</time>
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-(--ui-text-muted)">{{ t('common.no_items') }}</p>
    </div>
  </div>
</template>
