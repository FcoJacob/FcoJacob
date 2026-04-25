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
  <div class="space-y-12">
    <PageHeader eyebrow="Writing" :title="t('nav.blog')" />

    <div v-if="blogs?.length" class="space-y-4 md:space-y-5">
      <NuxtLink
        v-for="(blog, i) in blogs"
        :key="blog._id"
        v-reveal="{ delay: i * 0.08 }"
        :to="`/blog/${blog.slug}`"
        class="block group"
      >
        <UCard
          variant="subtle"
          class="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-(--ui-color-primary-500)/30"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="space-y-2 flex-1">
              <h2 class="card-title group-hover:text-(--ui-color-primary-500) transition-colors">
                {{ blog.title }}
              </h2>
              <p class="card-body line-clamp-2">{{ blog.excerpt }}</p>
              <div class="flex flex-wrap items-center gap-3 text-sm text-(--ui-text-muted)">
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-thumbs-up" class="size-4" />
                  <span>{{ blog.likeCount ?? 0 }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-thumbs-down" class="size-4" />
                  <span>{{ blog.dislikeCount ?? 0 }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 text-base text-(--ui-text-muted) shrink-0">
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
