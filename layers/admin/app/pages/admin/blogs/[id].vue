<script setup lang="ts">
import type { Id } from '~~/convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import BlogFooterBlock from '../../../../../base/app/components/BlogFooterBlock.vue'
import authorPortrait from '../../../../../../assets/B92E7B57-48CB-4316-81F2-8EE982B602D9_1_201_a.jpeg'

type ResearchDocument = {
  _id: string
  fileName: string
  mimeType: string
  slug: string
  storageId: string
  title: string
  url: string | null
}

type BlogFooterPreset = {
  _id: string
  name: string
  content: {
    authorEyebrow: { es: string; en: string }
    authorName: string
    authorRole: { es: string; en: string }
    authorNote: { es: string; en: string }
    gratitudeNote: { es: string; en: string }
    authorImage: string
  }
}

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

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const {
  createBlog,
  updateBlog,
  getResearchDocument,
  createResearchDocumentUploadUrl,
  upsertResearchDocument,
} = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const isNew = computed(() => route.params.id === 'new')
const saving = ref(false)
const autoSlug = ref(true)
const researchUploading = ref(false)
const footerPreviewLocale = ref<'es' | 'en'>('es')
const researchDocument = shallowRef<ResearchDocument | null>(null)
const researchDocumentTitle = ref(
  'Investigación profunda sobre gestión del talento y desmotivación laboral',
)
const previousSlug = ref('')
const researchInput = ref<HTMLInputElement>()

const existing = isNew.value
  ? ref(null)
  : useSafeConvexQuery(api.blogs.getById, { id: route.params.id as Id<'blogs'> })

const footerPresets = useSafeConvexQuery(api.blogFooters.list, {})

const form = reactive({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  coverImage: '',
  tags: '',
  researchLinkLabelEs: DEFAULT_RESEARCH_LINK.linkLabel.es,
  researchLinkLabelEn: DEFAULT_RESEARCH_LINK.linkLabel.en,
  researchLeadEs: DEFAULT_RESEARCH_LINK.lead.es,
  researchLeadEn: DEFAULT_RESEARCH_LINK.lead.en,
  researchCtaEs: DEFAULT_RESEARCH_LINK.ctaLabel.es,
  researchCtaEn: DEFAULT_RESEARCH_LINK.ctaLabel.en,
  researchHintEs: DEFAULT_RESEARCH_LINK.hint.es,
  researchHintEn: DEFAULT_RESEARCH_LINK.hint.en,
  researchExternalUrl: DEFAULT_RESEARCH_LINK.externalUrl,
  footerMode: 'preset',
  footerPresetId: '',
  footerAuthorEyebrowEs: DEFAULT_FOOTER.authorEyebrow.es,
  footerAuthorEyebrowEn: DEFAULT_FOOTER.authorEyebrow.en,
  footerAuthorName: DEFAULT_FOOTER.authorName,
  footerAuthorRoleEs: DEFAULT_FOOTER.authorRole.es,
  footerAuthorRoleEn: DEFAULT_FOOTER.authorRole.en,
  footerAuthorNoteEs: DEFAULT_FOOTER.authorNote.es,
  footerAuthorNoteEn: DEFAULT_FOOTER.authorNote.en,
  footerGratitudeEs: DEFAULT_FOOTER.gratitudeNote.es,
  footerGratitudeEn: DEFAULT_FOOTER.gratitudeNote.en,
  footerAuthorImage: DEFAULT_FOOTER.authorImage,
  published: false,
  locale: 'es',
})

const footerPresetOptions = computed(() =>
  (footerPresets.value ?? []).map((preset: BlogFooterPreset) => ({
    label: preset.name,
    value: preset._id,
  })),
)

const selectedFooterPreset = computed(
  () =>
    (footerPresets.value ?? []).find(
      (preset: BlogFooterPreset) => preset._id === form.footerPresetId,
    ) ?? null,
)

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

watch(
  () => form.title,
  (title) => {
    if (autoSlug.value && isNew.value) {
      form.slug = generateSlug(title)
    }
  },
)

/** TipTap editor */
const editorEl = ref<HTMLDivElement>()
let editor: any = null
const editorReady = ref(false)

const activeMarks = reactive({
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  highlight: false,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  codeBlock: false,
  heading2: false,
  heading3: false,
  link: false,
})

function syncActiveMarks() {
  if (!editor) return
  activeMarks.bold = editor.isActive('bold')
  activeMarks.italic = editor.isActive('italic')
  activeMarks.underline = editor.isActive('underline')
  activeMarks.strike = editor.isActive('strike')
  activeMarks.code = editor.isActive('code')
  activeMarks.highlight = editor.isActive('highlight')
  activeMarks.bulletList = editor.isActive('bulletList')
  activeMarks.orderedList = editor.isActive('orderedList')
  activeMarks.blockquote = editor.isActive('blockquote')
  activeMarks.codeBlock = editor.isActive('codeBlock')
  activeMarks.heading2 = editor.isActive('heading', { level: 2 })
  activeMarks.heading3 = editor.isActive('heading', { level: 3 })
  activeMarks.link = editor.isActive('link')
}

watch(
  existing,
  async (blog) => {
    if (blog) {
      autoSlug.value = false
      previousSlug.value = blog.slug
      const researchLinkContent = (blog as any).researchLinkContent ?? DEFAULT_RESEARCH_LINK
      const footerContent = (blog as any).footerContent ?? DEFAULT_FOOTER

      Object.assign(form, {
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        excerpt: blog.excerpt,
        coverImage: blog.coverImage ?? '',
        tags: (blog as any).tags?.join(', ') ?? '',
        researchLinkLabelEs:
          researchLinkContent.linkLabel?.es ?? DEFAULT_RESEARCH_LINK.linkLabel.es,
        researchLinkLabelEn:
          researchLinkContent.linkLabel?.en ?? DEFAULT_RESEARCH_LINK.linkLabel.en,
        researchLeadEs: researchLinkContent.lead?.es ?? DEFAULT_RESEARCH_LINK.lead.es,
        researchLeadEn: researchLinkContent.lead?.en ?? DEFAULT_RESEARCH_LINK.lead.en,
        researchCtaEs: researchLinkContent.ctaLabel?.es ?? DEFAULT_RESEARCH_LINK.ctaLabel.es,
        researchCtaEn: researchLinkContent.ctaLabel?.en ?? DEFAULT_RESEARCH_LINK.ctaLabel.en,
        researchHintEs: researchLinkContent.hint?.es ?? DEFAULT_RESEARCH_LINK.hint.es,
        researchHintEn: researchLinkContent.hint?.en ?? DEFAULT_RESEARCH_LINK.hint.en,
        researchExternalUrl: researchLinkContent.externalUrl ?? DEFAULT_RESEARCH_LINK.externalUrl,
        footerMode: (blog as any).footerMode ?? 'preset',
        footerPresetId: (blog as any).footerPresetId ?? '',
        footerAuthorEyebrowEs: footerContent.authorEyebrow?.es ?? DEFAULT_FOOTER.authorEyebrow.es,
        footerAuthorEyebrowEn: footerContent.authorEyebrow?.en ?? DEFAULT_FOOTER.authorEyebrow.en,
        footerAuthorName: footerContent.authorName ?? DEFAULT_FOOTER.authorName,
        footerAuthorRoleEs: footerContent.authorRole?.es ?? DEFAULT_FOOTER.authorRole.es,
        footerAuthorRoleEn: footerContent.authorRole?.en ?? DEFAULT_FOOTER.authorRole.en,
        footerAuthorNoteEs: footerContent.authorNote?.es ?? DEFAULT_FOOTER.authorNote.es,
        footerAuthorNoteEn: footerContent.authorNote?.en ?? DEFAULT_FOOTER.authorNote.en,
        footerGratitudeEs: footerContent.gratitudeNote?.es ?? DEFAULT_FOOTER.gratitudeNote.es,
        footerGratitudeEn: footerContent.gratitudeNote?.en ?? DEFAULT_FOOTER.gratitudeNote.en,
        footerAuthorImage: footerContent.authorImage ?? DEFAULT_FOOTER.authorImage,
        published: blog.published,
        locale: blog.locale,
      })
      if (editor) {
        editor.commands.setContent(blog.content)
      }

      await loadResearchDocument(blog.slug)
    }
  },
  { immediate: true },
)

async function loadResearchDocument(slug: string) {
  if (!slug) {
    researchDocument.value = null
    return
  }

  const document = (await getResearchDocument(slug)) as ResearchDocument | null
  researchDocument.value = document

  if (document?.title) {
    researchDocumentTitle.value = document.title
  }
}

function buildResearchLinkContent() {
  return {
    linkLabel: {
      es: form.researchLinkLabelEs,
      en: form.researchLinkLabelEn,
    },
    lead: {
      es: form.researchLeadEs,
      en: form.researchLeadEn,
    },
    ctaLabel: {
      es: form.researchCtaEs,
      en: form.researchCtaEn,
    },
    hint: {
      es: form.researchHintEs,
      en: form.researchHintEn,
    },
    externalUrl: form.researchExternalUrl.trim(),
  }
}

function buildFooterContent() {
  return {
    authorEyebrow: {
      es: form.footerAuthorEyebrowEs,
      en: form.footerAuthorEyebrowEn,
    },
    authorName: form.footerAuthorName.trim() || DEFAULT_FOOTER.authorName,
    authorRole: {
      es: form.footerAuthorRoleEs,
      en: form.footerAuthorRoleEn,
    },
    authorNote: {
      es: form.footerAuthorNoteEs,
      en: form.footerAuthorNoteEn,
    },
    gratitudeNote: {
      es: form.footerGratitudeEs,
      en: form.footerGratitudeEn,
    },
    authorImage: form.footerAuthorImage.trim(),
  }
}

const resolvedFooterPreviewContent = computed(() => {
  if (form.footerMode === 'preset' && selectedFooterPreset.value) {
    return selectedFooterPreset.value.content
  }

  return buildFooterContent()
})

const footerPreviewCopy = computed(() => {
  const currentLocale = footerPreviewLocale.value
  const source = resolvedFooterPreviewContent.value

  return {
    eyebrow: source.authorEyebrow[currentLocale],
    authorName: source.authorName,
    role: source.authorRole[currentLocale],
    authorNote: source.authorNote[currentLocale],
    gratitudeNote: source.gratitudeNote[currentLocale],
    image: source.authorImage || authorPortrait,
  }
})

onMounted(async () => {
  if (!editorEl.value) return

  const [{ Editor }, StarterKit, Link, Image, Underline, Placeholder, Highlight] =
    await Promise.all([
      import('@tiptap/core'),
      import('@tiptap/starter-kit').then((m) => m.default),
      import('@tiptap/extension-link').then((m) => m.default),
      import('@tiptap/extension-image').then((m) => m.default),
      import('@tiptap/extension-underline').then((m) => m.default),
      import('@tiptap/extension-placeholder').then((m) => m.default),
      import('@tiptap/extension-highlight').then((m) => m.default),
    ])

  editor = new Editor({
    element: editorEl.value,
    content: form.content || '<p></p>',
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      Placeholder.configure({ placeholder: t('admin.blog_editor.editor_placeholder') }),
      Highlight,
    ],
    onUpdate: ({ editor: ed }) => {
      form.content = ed.getHTML()
      syncActiveMarks()
    },
    onSelectionUpdate: () => syncActiveMarks(),
  })

  editorReady.value = true
})

onBeforeUnmount(() => {
  editor?.destroy()
  editor = null
})

/** Editor commands */
function cmd(action: string, opts?: Record<string, unknown>) {
  editor?.chain().focus()[action](opts).run()
}

function insertLink() {
  const prev = editor?.getAttributes('link').href ?? ''
  const url = window.prompt(t('admin.blog_editor.link_prompt'), prev)
  if (url === null) return
  if (url === '') {
    editor?.chain().focus().unsetLink().run()
  } else {
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}

function insertImage() {
  const url = window.prompt(t('admin.blog_editor.image_prompt'))
  if (url) {
    editor?.chain().focus().setImage({ src: url }).run()
  }
}

function openResearchPicker() {
  if (isNew.value) {
    toast.add({
      title: 'Guarda primero el artículo para habilitar los recursos públicos.',
      color: 'warning',
    })
    return
  }

  researchInput.value?.click()
}

async function handleResearchFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  if (!form.slug) {
    toast.add({ title: 'Define el slug antes de subir el documento.', color: 'warning' })
    target.value = ''
    return
  }

  researchUploading.value = true

  try {
    const uploadUrl = (await createResearchDocumentUploadUrl()) as string
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/pdf',
      },
      body: file,
    })

    if (!response.ok) {
      throw new Error('No se pudo subir el documento.')
    }

    const result = (await response.json()) as { storageId?: string }

    if (!result.storageId) {
      throw new Error('Convex no devolvió storageId para el documento.')
    }

    await upsertResearchDocument({
      slug: form.slug,
      title: researchDocumentTitle.value.trim() || file.name,
      fileName: file.name,
      mimeType: file.type || 'application/pdf',
      storageId: result.storageId,
    })

    await loadResearchDocument(form.slug)

    toast.add({ title: 'Documento de investigación actualizado.', color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo subir el documento a Convex.', color: 'error' })
  } finally {
    researchUploading.value = false
    target.value = ''
  }
}

/** Form submission */
async function handleSubmit() {
  if (!form.title || !form.slug || !form.content) {
    toast.add({ title: t('admin.blog_editor.validation_required'), color: 'error' })
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt,
      coverImage: form.coverImage || undefined,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : undefined,
      researchLinkContent: buildResearchLinkContent(),
      footerMode: form.footerMode,
      footerPresetId:
        form.footerMode === 'preset' && form.footerPresetId ? form.footerPresetId : undefined,
      footerContent: buildFooterContent(),
      published: form.published,
      locale: form.locale,
    }
    if (isNew.value) {
      const blogId = await createBlog(payload)
      toast.add({ title: t('admin.blog_editor.created'), color: 'success' })
      await router.push(`/admin/blogs/${blogId}`)
      return
    }

    await updateBlog(route.params.id as string, payload)

    if (researchDocument.value && previousSlug.value && previousSlug.value !== form.slug) {
      await upsertResearchDocument({
        slug: form.slug,
        title: researchDocument.value.title,
        fileName: researchDocument.value.fileName,
        mimeType: researchDocument.value.mimeType,
        storageId: researchDocument.value.storageId,
      })
    }

    toast.add({
      title: t('admin.blog_editor.updated'),
      color: 'success',
    })
    router.push('/admin/blogs')
  } catch {
    toast.add({ title: t('admin.blog_editor.save_error'), color: 'error' })
  } finally {
    saving.value = false
  }
}

/** Toolbar button config */
type ToolbarBtn = { icon: string; action: () => void; active: keyof typeof activeMarks }
type ToolbarSep = { sep: true }
type ToolbarItem = ToolbarBtn | ToolbarSep

const toolbar: ToolbarItem[] = [
  { icon: 'i-lucide-bold', action: () => cmd('toggleBold'), active: 'bold' },
  { icon: 'i-lucide-italic', action: () => cmd('toggleItalic'), active: 'italic' },
  { icon: 'i-lucide-underline', action: () => cmd('toggleUnderline'), active: 'underline' },
  { icon: 'i-lucide-strikethrough', action: () => cmd('toggleStrike'), active: 'strike' },
  { icon: 'i-lucide-highlighter', action: () => cmd('toggleHighlight'), active: 'highlight' },
  { icon: 'i-lucide-code', action: () => cmd('toggleCode'), active: 'code' },
  { sep: true },
  {
    icon: 'i-lucide-heading-2',
    action: () => cmd('toggleHeading', { level: 2 }),
    active: 'heading2',
  },
  {
    icon: 'i-lucide-heading-3',
    action: () => cmd('toggleHeading', { level: 3 }),
    active: 'heading3',
  },
  { sep: true },
  { icon: 'i-lucide-list', action: () => cmd('toggleBulletList'), active: 'bulletList' },
  { icon: 'i-lucide-list-ordered', action: () => cmd('toggleOrderedList'), active: 'orderedList' },
  { icon: 'i-lucide-text-quote', action: () => cmd('toggleBlockquote'), active: 'blockquote' },
  { icon: 'i-lucide-square-code', action: () => cmd('toggleCodeBlock'), active: 'codeBlock' },
  { sep: true },
  { icon: 'i-lucide-link', action: insertLink, active: 'link' },
  { icon: 'i-lucide-image', action: insertImage, active: 'bold' /* dummy */ },
  { icon: 'i-lucide-minus', action: () => cmd('setHorizontalRule'), active: 'bold' /* dummy */ },
]

function isSep(item: ToolbarItem): item is ToolbarSep {
  return 'sep' in item
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <UButton icon="i-lucide-arrow-left" variant="ghost" size="sm" to="/admin/blogs" />
        <h2 class="text-2xl font-bold tracking-tight">
          {{ isNew ? t('common.create') : t('common.edit') }} {{ t('admin.blogs') }}
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <UBadge
          :color="form.published ? 'success' : 'neutral'"
          :label="form.published ? t('admin.blog_editor.published') : t('admin.blog_editor.draft')"
          variant="subtle"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <!-- Main content area -->
      <div class="space-y-6 min-w-0">
        <!-- Title -->
        <div class="space-y-2">
          <UInput
            v-model="form.title"
            :placeholder="t('admin.blog_editor.post_title_placeholder')"
            size="xl"
            class="w-full"
            :ui="{ base: 'text-2xl! font-bold!' }"
          />
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted font-mono shrink-0">{{
              t('admin.blog_editor.slug_prefix')
            }}</span>
            <UInput
              v-model="form.slug"
              size="xs"
              :ui="{ base: 'font-mono text-xs!' }"
              class="flex-1"
            />
            <UButton
              v-if="!isNew"
              icon="i-lucide-refresh-cw"
              size="xs"
              variant="ghost"
              :title="t('admin.blog_editor.regenerate_slug')"
              @click="form.slug = generateSlug(form.title)"
            />
          </div>
        </div>

        <!-- Rich text editor -->
        <div class="rounded-xl border border-default overflow-hidden bg-default">
          <!-- Toolbar -->
          <div
            v-if="editorReady"
            class="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-default bg-(--ui-bg-elevated)/50"
          >
            <template v-for="(item, idx) in toolbar" :key="idx">
              <div v-if="isSep(item)" class="w-px h-5 mx-1.5 bg-border" />
              <UButton
                v-else
                :icon="item.icon"
                size="xs"
                :variant="activeMarks[item.active] ? 'soft' : 'ghost'"
                :color="activeMarks[item.active] ? 'primary' : 'neutral'"
                @click="item.action"
              />
            </template>
          </div>

          <!-- Editor content -->
          <div ref="editorEl" class="blog-editor" />
        </div>

        <!-- Excerpt -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">{{ t('admin.blog_editor.excerpt') }}</label>
            <span class="text-xs text-muted"> {{ form.excerpt.length }} / 500 </span>
          </div>
          <UTextarea
            v-model="form.excerpt"
            :rows="3"
            :maxlength="500"
            :placeholder="t('admin.blog_editor.excerpt_placeholder')"
            class="w-full"
          />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-5 lg:sticky lg:top-4 lg:self-start">
        <!-- Actions card -->
        <div class="rounded-xl border border-default overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-default">
            <h3 class="text-sm font-semibold">{{ t('admin.blog_editor.publish') }}</h3>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">{{ t('admin.blog_editor.status') }}</span>
              <USwitch v-model="form.published" size="sm" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-muted">{{ t('admin.blog_editor.language') }}</label>
              <USelect
                v-model="form.locale"
                size="sm"
                class="w-full"
                :items="[
                  { label: 'Español', value: 'es' },
                  { label: 'English', value: 'en' },
                ]"
              />
            </div>
            <div class="flex gap-2 pt-2 border-t border-default">
              <UButton
                :label="t('common.save')"
                icon="i-lucide-save"
                :loading="saving"
                size="sm"
                class="flex-1"
                @click="handleSubmit"
              />
              <UButton :label="t('common.cancel')" variant="outline" size="sm" to="/admin/blogs" />
            </div>
          </div>
        </div>

        <!-- Cover image card -->
        <div class="rounded-xl border border-default overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-default">
            <h3 class="text-sm font-semibold">{{ t('admin.blog_editor.cover_image') }}</h3>
          </div>
          <div class="p-4 space-y-3">
            <UInput
              v-model="form.coverImage"
              :placeholder="t('admin.blog_editor.cover_image_placeholder')"
              size="sm"
              class="w-full"
            />
            <div v-if="form.coverImage" class="rounded-lg overflow-hidden border border-default">
              <img
                :src="form.coverImage"
                alt="Cover preview"
                class="w-full aspect-video object-cover"
              />
            </div>
            <div
              v-else
              class="rounded-lg border border-dashed border-default flex items-center justify-center aspect-video text-muted"
            >
              <div class="text-center space-y-1">
                <UIcon name="i-lucide-image" class="size-6 mx-auto opacity-40" />
                <p class="text-xs">{{ t('admin.blog_editor.no_image') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Public resources card -->
        <div class="rounded-xl border border-default overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-default">
            <h3 class="text-sm font-semibold">Apertura y documento de apoyo</h3>
          </div>
          <div class="p-4 space-y-3">
            <p class="text-sm text-muted">
              Aquí controlas el enlace visible dentro del texto, el botón de descarga y una URL
              manual opcional si no quieres usar el PDF servido desde Convex.
            </p>

            <div class="space-y-2">
              <label class="text-xs text-muted">Título interno del documento fuente</label>
              <UInput v-model="researchDocumentTitle" size="sm" class="w-full" :disabled="isNew" />
            </div>

            <div class="space-y-2">
              <label class="text-xs text-muted">URL manual del documento</label>
              <UInput
                v-model="form.researchExternalUrl"
                size="sm"
                class="w-full"
                placeholder="Opcional. Si se rellena, sustituye al enlace del PDF de Convex"
              />
            </div>

            <input
              ref="researchInput"
              type="file"
              accept="application/pdf"
              class="hidden"
              @change="handleResearchFileChange"
            />

            <UButton
              :label="researchDocument ? 'Reemplazar PDF en Convex' : 'Subir PDF a Convex'"
              icon="i-lucide-file-up"
              size="sm"
              class="w-full"
              :loading="researchUploading"
              :disabled="isNew"
              @click="openResearchPicker"
            />

            <div v-if="researchDocument" class="rounded-lg border border-default p-3 space-y-2">
              <p class="text-sm font-medium text-highlighted">
                {{ researchDocument.fileName }}
              </p>
              <a
                v-if="researchDocument.url"
                :href="researchDocument.url"
                target="_blank"
                rel="noreferrer"
                class="text-sm text-primary underline underline-offset-2"
              >
                Abrir documento publicado
              </a>
              <p class="text-xs text-muted">
                Este PDF se enlaza en la introducción del artículo público y se sirve desde Convex.
              </p>
            </div>

            <div v-else class="rounded-lg border border-dashed border-default p-3">
              <p class="text-xs text-muted">
                Sube aquí el documento fuente para que el enlace inicial y el botón de descarga del
                artículo público apunten a Convex.
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="space-y-2">
                <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Español
                </h4>
                <UInput
                  v-model="form.researchLinkLabelEs"
                  size="sm"
                  placeholder="Texto del enlace"
                />
                <UTextarea
                  v-model="form.researchLeadEs"
                  :rows="4"
                  placeholder="Texto posterior al enlace en la apertura"
                />
                <UInput v-model="form.researchCtaEs" size="sm" placeholder="Texto del botón" />
                <UTextarea v-model="form.researchHintEs" :rows="3" placeholder="Texto de apoyo" />
              </div>

              <div class="space-y-2">
                <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  English
                </h4>
                <UInput v-model="form.researchLinkLabelEn" size="sm" placeholder="Link label" />
                <UTextarea
                  v-model="form.researchLeadEn"
                  :rows="4"
                  placeholder="Opening text after the link"
                />
                <UInput v-model="form.researchCtaEn" size="sm" placeholder="Button label" />
                <UTextarea v-model="form.researchHintEn" :rows="3" placeholder="Supporting text" />
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-default overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-default">
            <h3 class="text-sm font-semibold">Pie del blog y firma</h3>
          </div>
          <div class="p-4 space-y-4">
            <p class="text-sm text-muted">
              Puedes usar un preset global o sobreescribirlo solo para esta entrada. En ambos casos
              quedan disponibles las versiones en español e inglés.
            </p>

            <div class="space-y-2">
              <label class="text-xs text-muted">Modo de pie</label>
              <USelect
                v-model="form.footerMode"
                size="sm"
                class="w-full"
                :items="[
                  { label: 'Usar bloque global', value: 'preset' },
                  { label: 'Personalizar esta entrada', value: 'custom' },
                ]"
              />
            </div>

            <template v-if="form.footerMode === 'preset'">
              <div class="space-y-2">
                <label class="text-xs text-muted">Bloque global</label>
                <USelect
                  v-model="form.footerPresetId"
                  size="sm"
                  class="w-full"
                  :items="footerPresetOptions"
                />
              </div>

              <UButton
                label="Gestionar bloques globales"
                icon="i-lucide-settings-2"
                size="sm"
                variant="outline"
                class="w-full"
                to="/admin/blog-footers"
              />
            </template>

            <template v-else>
              <div class="space-y-2">
                <label class="text-xs text-muted">Nombre del autor</label>
                <UInput v-model="form.footerAuthorName" size="sm" class="w-full" />
              </div>

              <div class="space-y-2">
                <label class="text-xs text-muted">URL de imagen del autor</label>
                <UInput
                  v-model="form.footerAuthorImage"
                  size="sm"
                  class="w-full"
                  placeholder="Opcional. Si queda vacío se usa la imagen por defecto"
                />
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <div class="space-y-2">
                  <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Español
                  </h4>
                  <UInput v-model="form.footerAuthorEyebrowEs" size="sm" placeholder="Eyebrow" />
                  <UInput v-model="form.footerAuthorRoleEs" size="sm" placeholder="Rol" />
                  <UTextarea
                    v-model="form.footerAuthorNoteEs"
                    :rows="5"
                    placeholder="Nota de firma"
                  />
                  <UTextarea v-model="form.footerGratitudeEs" :rows="4" placeholder="Nota final" />
                </div>

                <div class="space-y-2">
                  <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    English
                  </h4>
                  <UInput v-model="form.footerAuthorEyebrowEn" size="sm" placeholder="Eyebrow" />
                  <UInput v-model="form.footerAuthorRoleEn" size="sm" placeholder="Role" />
                  <UTextarea
                    v-model="form.footerAuthorNoteEn"
                    :rows="5"
                    placeholder="Author note"
                  />
                  <UTextarea
                    v-model="form.footerGratitudeEn"
                    :rows="4"
                    placeholder="Closing note"
                  />
                </div>
              </div>
            </template>

            <div class="rounded-lg bg-(--ui-bg-elevated)/60 p-3 text-xs text-muted">
              <p>
                La versión en inglés del post puede usar este mismo bloque bilingüe o su propio
                override. El locale del artículo no te limita estos campos.
              </p>
            </div>

            <div class="rounded-2xl border border-default bg-(--ui-bg-elevated)/60 p-4 space-y-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Vista previa del cierre
                  </p>
                  <p class="mt-1 text-sm text-muted">
                    Así quedará el final del artículo con el bloque global o con tu versión
                    personalizada.
                  </p>
                </div>

                <USelect
                  v-model="footerPreviewLocale"
                  size="xs"
                  class="w-full sm:w-28"
                  :items="[
                    { label: 'ES', value: 'es' },
                    { label: 'EN', value: 'en' },
                  ]"
                />
              </div>

              <BlogFooterBlock
                v-if="form.footerMode === 'custom' || selectedFooterPreset"
                :eyebrow="footerPreviewCopy.eyebrow"
                :name="footerPreviewCopy.authorName"
                :role="footerPreviewCopy.role"
                :image="footerPreviewCopy.image"
                :gratitude-note="footerPreviewCopy.gratitudeNote"
                :author-note="footerPreviewCopy.authorNote"
                name-tag="h4"
              />

              <p
                v-else
                class="rounded-xl border border-dashed border-default p-4 text-sm text-muted"
              >
                Selecciona un bloque global para ver aquí su resultado final.
              </p>
            </div>
          </div>
        </div>

        <!-- Tags card -->
        <div class="rounded-xl border border-default overflow-hidden">
          <div class="px-4 py-3 bg-(--ui-bg-elevated)/50 border-b border-default">
            <h3 class="text-sm font-semibold">{{ t('admin.blog_editor.tags') }}</h3>
          </div>
          <div class="p-4 space-y-3">
            <UInput
              v-model="form.tags"
              :placeholder="t('admin.blog_editor.tags_placeholder')"
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
            <p v-else class="text-xs text-muted">
              {{ t('admin.blog_editor.tags_hint') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-editor {
  min-height: 28rem;
}

.blog-editor :deep(.tiptap) {
  outline: none;
  padding: 1.25rem 1.5rem;
  min-height: 28rem;
  line-height: 1.75;
}

.blog-editor :deep(.tiptap p) {
  margin-bottom: 0.75rem;
}

.blog-editor :deep(.tiptap > *:last-child) {
  margin-bottom: 0;
}

.blog-editor :deep(.tiptap h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 2rem 0 0.75rem;
  line-height: 1.3;
}

.blog-editor :deep(.tiptap h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
  line-height: 1.4;
}

.blog-editor :deep(.tiptap h2:first-child),
.blog-editor :deep(.tiptap h3:first-child) {
  margin-top: 0;
}

.blog-editor :deep(.tiptap ul),
.blog-editor :deep(.tiptap ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.blog-editor :deep(.tiptap ul) {
  list-style: disc;
}

.blog-editor :deep(.tiptap ol) {
  list-style: decimal;
}

.blog-editor :deep(.tiptap li) {
  margin-bottom: 0.25rem;
}

.blog-editor :deep(.tiptap blockquote) {
  border-left: 3px solid var(--ui-primary);
  padding-left: 1rem;
  margin: 1.25rem 0;
  font-style: italic;
  color: var(--ui-text-muted);
}

.blog-editor :deep(.tiptap pre) {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin: 1.25rem 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.blog-editor :deep(.tiptap code) {
  background: var(--ui-bg-elevated);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.blog-editor :deep(.tiptap pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

.blog-editor :deep(.tiptap a) {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.blog-editor :deep(.tiptap a:hover) {
  opacity: 0.8;
}

.blog-editor :deep(.tiptap img) {
  max-width: 100%;
  border-radius: 0.5rem;
  margin: 1.25rem 0;
}

.blog-editor :deep(.tiptap hr) {
  border: none;
  border-top: 1px solid var(--ui-border);
  margin: 2rem 0;
}

.blog-editor :deep(.tiptap mark) {
  background-color: #fef08a;
  border-radius: 0.15rem;
  padding: 0.05rem 0.2rem;
  box-decoration-break: clone;
}

.blog-editor :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--ui-text-muted);
  pointer-events: none;
  height: 0;
  opacity: 0.5;
}
</style>
