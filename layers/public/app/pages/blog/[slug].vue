<script setup lang="ts">
import BlogFooterBlock from '../../../../base/app/components/BlogFooterBlock.vue'
import authorPortrait from '../../../../../assets/B92E7B57-48CB-4316-81F2-8EE982B602D9_1_201_a.jpeg'

type BlogReaction = 'like' | 'dislike'

const DEFAULT_RESEARCH_LINK = {
  linkLabel: {
    es: 'documento de investigación profunda realizado con Gemini',
    en: 'deep research document produced with Gemini',
  },
  lead: {
    es: 'y de una curiosidad personal por entender mejor este tema, escribí esta entrada para ordenar una postura propia sobre burnout, motivación, diseño del trabajo e IA.',
    en: 'and from a personal curiosity to understand this topic better, I wrote this post to organize my own view on burnout, motivation, work design, and AI.',
  },
  ctaLabel: {
    es: 'Descargar investigación completa',
    en: 'Download full research',
  },
  hint: {
    es: 'Si quieres leer el estudio completo antes o después del artículo, aquí lo tienes disponible en PDF.',
    en: 'If you want to read the full study before or after the article, the PDF is available here.',
  },
  externalUrl: '',
} as const

const DEFAULT_FOOTER = {
  authorEyebrow: {
    es: 'Firma del autor',
    en: 'Author note',
  },
  authorName: 'Jacob Sarmiento',
  authorRole: {
    es: 'Software Developer · UI/UX',
    en: 'Software Developer · UI/UX',
  },
  authorNote: {
    es: 'Este texto parte de una investigación real y de una lectura personal del documento. La IA puede haber ayudado a ordenar o pulir la redacción, pero el criterio, la interpretación y la tesis del artículo son míos.',
    en: 'This text is grounded in real research and my own reading of the source document. AI may have helped refine the wording, but the judgment, interpretation, and core thesis are mine.',
  },
  gratitudeNote: {
    es: 'Gracias por leer hasta el final. Esta entrada recoge una opinión personal y una lectura propia, pero el estudio existe gracias al trabajo previo de sus fuentes originales y a quienes investigan con rigor estos temas.',
    en: 'Thank you for reading to the end. This post reflects a personal view and my own reading, but the underlying study only exists thanks to the original sources and the people researching these topics seriously.',
  },
  authorImage: '',
} as const

const { t, locale } = useI18n()
const route = useRoute()

const { data: blog } = await useAsyncData(`blog-${route.params.slug}`, () =>
  $fetch('/api/public/blog-by-slug', { query: { slug: route.params.slug as string } }),
)

const { data: researchDocument } = await useAsyncData(
  `blog-research-document-${route.params.slug}`,
  () =>
    $fetch('/api/public/blog-research-document', {
      query: { slug: route.params.slug as string },
    }),
)

const resolvedCoverImage = computed(() => {
  const coverImage = blog.value?.coverImage

  if (!coverImage) {
    return ''
  }

  if (coverImage.startsWith('/blog/')) {
    return coverImage.replace('/blog/', '/images/blog/')
  }

  return coverImage
})

const createdAtIso = computed(() =>
  blog.value ? new Date(blog.value.createdAt).toISOString() : '',
)

const formattedDate = computed(() => {
  if (!blog.value) {
    return ''
  }

  const currentLocale = locale.value === 'es' ? 'es-ES' : 'en-US'

  return new Intl.DateTimeFormat(currentLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(blog.value.createdAt))
})

const researchLinkContent = computed(() => ({
  linkLabel: {
    es: blog.value?.researchLinkContent?.linkLabel?.es ?? DEFAULT_RESEARCH_LINK.linkLabel.es,
    en: blog.value?.researchLinkContent?.linkLabel?.en ?? DEFAULT_RESEARCH_LINK.linkLabel.en,
  },
  lead: {
    es: blog.value?.researchLinkContent?.lead?.es ?? DEFAULT_RESEARCH_LINK.lead.es,
    en: blog.value?.researchLinkContent?.lead?.en ?? DEFAULT_RESEARCH_LINK.lead.en,
  },
  ctaLabel: {
    es: blog.value?.researchLinkContent?.ctaLabel?.es ?? DEFAULT_RESEARCH_LINK.ctaLabel.es,
    en: blog.value?.researchLinkContent?.ctaLabel?.en ?? DEFAULT_RESEARCH_LINK.ctaLabel.en,
  },
  hint: {
    es: blog.value?.researchLinkContent?.hint?.es ?? DEFAULT_RESEARCH_LINK.hint.es,
    en: blog.value?.researchLinkContent?.hint?.en ?? DEFAULT_RESEARCH_LINK.hint.en,
  },
  externalUrl: blog.value?.researchLinkContent?.externalUrl ?? DEFAULT_RESEARCH_LINK.externalUrl,
}))

const resolvedFooterSource = computed(() => {
  if (!blog.value) {
    return null
  }

  if (blog.value.footerMode === 'custom') {
    return blog.value.footerContent ?? null
  }

  if (blog.value.footerMode === 'preset') {
    return blog.value.footerPreset?.content ?? null
  }

  return blog.value.footerContent ?? blog.value.footerPreset?.content ?? null
})

const footerContent = computed(() => ({
  authorEyebrow: {
    es: resolvedFooterSource.value?.authorEyebrow?.es ?? DEFAULT_FOOTER.authorEyebrow.es,
    en: resolvedFooterSource.value?.authorEyebrow?.en ?? DEFAULT_FOOTER.authorEyebrow.en,
  },
  authorName: resolvedFooterSource.value?.authorName ?? DEFAULT_FOOTER.authorName,
  authorRole: {
    es: resolvedFooterSource.value?.authorRole?.es ?? DEFAULT_FOOTER.authorRole.es,
    en: resolvedFooterSource.value?.authorRole?.en ?? DEFAULT_FOOTER.authorRole.en,
  },
  authorNote: {
    es: resolvedFooterSource.value?.authorNote?.es ?? DEFAULT_FOOTER.authorNote.es,
    en: resolvedFooterSource.value?.authorNote?.en ?? DEFAULT_FOOTER.authorNote.en,
  },
  gratitudeNote: {
    es: resolvedFooterSource.value?.gratitudeNote?.es ?? DEFAULT_FOOTER.gratitudeNote.es,
    en: resolvedFooterSource.value?.gratitudeNote?.en ?? DEFAULT_FOOTER.gratitudeNote.en,
  },
  authorImage: resolvedFooterSource.value?.authorImage ?? DEFAULT_FOOTER.authorImage,
}))

const author = computed(() => ({
  image: footerContent.value.authorImage || authorPortrait,
  name: footerContent.value.authorName,
  role:
    locale.value === 'es' ? footerContent.value.authorRole.es : footerContent.value.authorRole.en,
}))

const authorEyebrow = computed(() =>
  locale.value === 'es'
    ? footerContent.value.authorEyebrow.es
    : footerContent.value.authorEyebrow.en,
)

const authorNote = computed(() =>
  locale.value === 'es' ? footerContent.value.authorNote.es : footerContent.value.authorNote.en,
)

const gratitudeNote = computed(() =>
  locale.value === 'es'
    ? footerContent.value.gratitudeNote.es
    : footerContent.value.gratitudeNote.en,
)

const researchDocumentUrl = computed(
  () => researchLinkContent.value.externalUrl.trim() || researchDocument.value?.url || '',
)

const researchDocumentTitle = computed(() =>
  locale.value === 'es'
    ? researchLinkContent.value.linkLabel.es
    : researchLinkContent.value.linkLabel.en,
)

const leadNote = computed(() =>
  locale.value === 'es' ? researchLinkContent.value.lead.es : researchLinkContent.value.lead.en,
)

const researchDocumentCta = computed(() =>
  locale.value === 'es'
    ? researchLinkContent.value.ctaLabel.es
    : researchLinkContent.value.ctaLabel.en,
)

const researchDocumentHint = computed(() =>
  locale.value === 'es' ? researchLinkContent.value.hint.es : researchLinkContent.value.hint.en,
)

const hasAuthorNote = computed(() => authorNote.value.trim().length > 0)
const hasGratitudeNote = computed(() => gratitudeNote.value.trim().length > 0)

const selectedReaction = shallowRef<BlogReaction | null>(null)
const isSubmittingReaction = shallowRef(false)

const reactionStorageKey = computed(() => `blog-reaction:${route.params.slug as string}`)

const likeCount = computed(() => blog.value?.likeCount ?? 0)
const dislikeCount = computed(() => blog.value?.dislikeCount ?? 0)

const reactionTitle = computed(() => {
  return locale.value === 'es'
    ? '¿Qué te ha parecido este artículo?'
    : 'How did this article land for you?'
})

const reactionHint = computed(() => {
  if (selectedReaction.value === 'like') {
    return locale.value === 'es'
      ? 'Tu reacción positiva ya quedó registrada en este navegador.'
      : 'Your positive reaction has already been saved in this browser.'
  }

  if (selectedReaction.value === 'dislike') {
    return locale.value === 'es'
      ? 'Tu reacción negativa ya quedó registrada en este navegador.'
      : 'Your negative reaction has already been saved in this browser.'
  }

  return locale.value === 'es'
    ? 'Sirve para medir si el artículo está conectando bien con la comunidad.'
    : 'This helps gauge how strongly the article is landing with the community.'
})

const reactionLabels = computed(() => {
  return locale.value === 'es'
    ? {
        like: 'Me gusta',
        dislike: 'No me gusta',
      }
    : {
        like: 'Like',
        dislike: 'Dislike',
      }
})

onMounted(() => {
  const storedReaction = window.localStorage.getItem(reactionStorageKey.value)

  if (storedReaction === 'like' || storedReaction === 'dislike') {
    selectedReaction.value = storedReaction
  }
})

async function submitReaction(reaction: BlogReaction) {
  if (!blog.value || selectedReaction.value || isSubmittingReaction.value) {
    return
  }

  isSubmittingReaction.value = true

  try {
    const counts = (await $fetch('/api/public/blog-reaction', {
      method: 'POST',
      body: {
        slug: blog.value.slug,
        reaction,
      },
    })) as { likeCount: number; dislikeCount: number }

    blog.value = {
      ...blog.value,
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
    }

    selectedReaction.value = reaction
    window.localStorage.setItem(reactionStorageKey.value, reaction)
  } catch (error) {
    console.error('[blog-reaction] failed to submit reaction', error)
  } finally {
    isSubmittingReaction.value = false
  }
}

useSeoMeta({
  title: () => blog.value?.title ?? t('nav.blog'),
  description: () => blog.value?.excerpt ?? '',
  ogTitle: () => blog.value?.title ?? t('nav.blog'),
  ogDescription: () => blog.value?.excerpt ?? '',
  ogImage: () => resolvedCoverImage.value,
})
</script>

<template>
  <article v-if="blog" class="blog-article mx-auto max-w-4xl">
    <header class="mb-12 space-y-6">
      <UButton
        to="/blog"
        :label="t('common.back')"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      />

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
          <time :datetime="createdAtIso" class="blog-meta-pill">
            {{ formattedDate }}
          </time>

          <UBadge
            v-for="tag in blog.tags ?? []"
            :key="tag"
            :label="tag"
            size="sm"
            variant="subtle"
            color="neutral"
          />
        </div>

        <h1 class="text-4xl leading-tight lg:text-5xl font-extrabold tracking-tight text-balance">
          {{ blog.title }}
        </h1>

        <p v-if="researchDocumentUrl" class="blog-excerpt">
          <template v-if="locale === 'es'">
            A partir del
            <a
              :href="researchDocumentUrl"
              class="blog-inline-link"
              target="_blank"
              rel="noreferrer"
            >
              {{ researchDocumentTitle }}
            </a>
            , {{ leadNote }}
          </template>
          <template v-else>
            Based on the
            <a
              :href="researchDocumentUrl"
              class="blog-inline-link"
              target="_blank"
              rel="noreferrer"
            >
              {{ researchDocumentTitle }}
            </a>
            , {{ leadNote }}
          </template>
        </p>

        <p v-else-if="blog.excerpt" class="blog-excerpt">
          {{ blog.excerpt }}
        </p>

        <div v-if="researchDocumentUrl" class="blog-source-actions">
          <UButton
            :to="researchDocumentUrl"
            target="_blank"
            icon="i-lucide-download"
            :label="researchDocumentCta"
            size="sm"
            variant="soft"
          />
          <p class="blog-source-actions__hint">
            {{ researchDocumentHint }}
          </p>
        </div>
      </div>

      <figure v-if="resolvedCoverImage" class="blog-cover-frame">
        <img :src="resolvedCoverImage" :alt="blog.title" class="block h-full w-full object-cover" />
      </figure>
    </header>

    <div class="blog-content" v-html="blog.content" />

    <section class="blog-reactions" aria-label="article reactions">
      <div class="blog-reactions__copy">
        <h2 class="blog-reactions__title">
          {{ reactionTitle }}
        </h2>
        <p class="blog-reactions__hint">
          {{ reactionHint }}
        </p>
      </div>

      <div class="blog-reactions__actions">
        <UButton
          :label="`${reactionLabels.like} · ${likeCount}`"
          icon="i-lucide-thumbs-up"
          :variant="selectedReaction === 'like' ? 'solid' : 'outline'"
          :disabled="Boolean(selectedReaction) || isSubmittingReaction"
          @click="submitReaction('like')"
        />
        <UButton
          :label="`${reactionLabels.dislike} · ${dislikeCount}`"
          icon="i-lucide-thumbs-down"
          color="neutral"
          :variant="selectedReaction === 'dislike' ? 'solid' : 'outline'"
          :disabled="Boolean(selectedReaction) || isSubmittingReaction"
          @click="submitReaction('dislike')"
        />
      </div>
    </section>

    <BlogFooterBlock
      :eyebrow="authorEyebrow"
      :name="author.name"
      :role="author.role"
      :image="author.image"
      :gratitude-note="gratitudeNote"
      :author-note="authorNote"
      name-tag="h2"
    />

    <USeparator class="my-12" />

    <UButton
      to="/blog"
      :label="t('common.back')"
      variant="outline"
      icon="i-lucide-arrow-left"
      size="sm"
    />
  </article>

  <div v-else class="text-center py-16">
    <p class="text-muted">{{ t('common.loading') }}</p>
  </div>
</template>

<style scoped>
.blog-article {
  color: var(--ui-text);
}

.blog-meta-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--ui-border) 75%, transparent);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ui-bg-elevated) 92%, white 8%),
    var(--ui-bg)
  );
}

.blog-excerpt {
  max-width: 60rem;
  font-size: clamp(1.05rem, 1rem + 0.4vw, 1.3rem);
  line-height: 1.7;
  color: color-mix(in srgb, var(--ui-text) 84%, var(--ui-text-dimmed) 16%);
  text-wrap: pretty;
}

.blog-inline-link {
  color: var(--ui-text);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.blog-source-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
}

.blog-source-actions__hint {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--ui-text-dimmed);
}

.blog-cover-frame {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ui-border) 78%, transparent);
  border-radius: 1.5rem;
  aspect-ratio: 16 / 9;
  background:
    radial-gradient(
      circle at top,
      color-mix(in srgb, var(--ui-color-primary-500) 24%, transparent),
      transparent 52%
    ),
    var(--ui-bg-elevated);
  box-shadow: 0 24px 80px color-mix(in srgb, black 20%, transparent);
}

.blog-content {
  font-size: 1.04rem;
  line-height: 1.9;
  color: color-mix(in srgb, var(--ui-text) 92%, var(--ui-text-muted) 8%);
}

.blog-content :deep(*) {
  max-width: 100%;
}

.blog-content :deep(p),
.blog-content :deep(ul),
.blog-content :deep(ol),
.blog-content :deep(blockquote),
.blog-content :deep(hr) {
  margin: 0;
}

.blog-content :deep(p + p),
.blog-content :deep(p + ul),
.blog-content :deep(p + ol),
.blog-content :deep(ul + p),
.blog-content :deep(ol + p),
.blog-content :deep(blockquote + p),
.blog-content :deep(p + blockquote),
.blog-content :deep(hr + p) {
  margin-top: 0.5rem;
}

.blog-content :deep(p:empty) {
  display: block;
  height: 0.55rem;
}

.blog-content :deep(h2),
.blog-content :deep(h3) {
  text-wrap: balance;
  color: var(--ui-text);
}

.blog-content :deep(h2) {
  margin: 3.25rem 0 1rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--ui-border) 82%, transparent);
  font-size: clamp(1.55rem, 1.35rem + 0.8vw, 2rem);
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.blog-content :deep(h3) {
  margin: 2.25rem 0 0.85rem;
  font-size: clamp(1.2rem, 1.1rem + 0.45vw, 1.45rem);
  line-height: 1.35;
  font-weight: 700;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  padding-left: 1.4rem;
}

.blog-content :deep(li + li) {
  margin-top: 0.45rem;
}

.blog-content :deep(strong) {
  color: var(--ui-text);
  font-weight: 700;
}

.blog-content :deep(a) {
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.blog-content :deep(blockquote) {
  margin-top: 1.5rem;
  padding: 1.1rem 1.25rem;
  border-left: 3px solid var(--ui-color-primary-500);
  border-radius: 0 1rem 1rem 0;
  background: color-mix(in srgb, var(--ui-bg-elevated) 88%, var(--ui-color-primary-500) 12%);
  color: color-mix(in srgb, var(--ui-text) 88%, var(--ui-text-dimmed) 12%);
}

.blog-content :deep(hr) {
  margin-top: 2.25rem;
  height: 1px;
  border: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ui-border) 92%, transparent),
    transparent
  );
}

.blog-reactions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-top: 2.25rem;
  padding: 1rem 1.15rem;
  border: 1px solid color-mix(in srgb, var(--ui-border) 84%, transparent);
  border-radius: 1.2rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ui-bg-elevated) 90%, white 10%),
    var(--ui-bg)
  );
}

.blog-reactions__copy {
  min-width: min(100%, 18rem);
}

.blog-reactions__title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.35;
  font-weight: 800;
  color: var(--ui-text);
}

.blog-reactions__hint {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--ui-text-dimmed);
}

.blog-reactions__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .blog-content {
    font-size: 1rem;
    line-height: 1.8;
  }

  .blog-cover-frame {
    border-radius: 1.1rem;
  }

  .author-signature {
    grid-template-columns: 1fr;
  }

  .blog-reactions {
    align-items: stretch;
  }

  .blog-reactions__actions {
    width: 100%;
  }
}
</style>
