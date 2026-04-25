<script setup lang="ts">
import type { Id } from '~~/convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import BlogFooterBlock from '../../../../../base/app/components/BlogFooterBlock.vue'
import authorPortrait from '../../../../../../assets/B92E7B57-48CB-4316-81F2-8EE982B602D9_1_201_a.jpeg'

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

type FooterFormState = {
  name: string
  authorEyebrowEs: string
  authorEyebrowEn: string
  authorName: string
  authorRoleEs: string
  authorRoleEn: string
  authorNoteEs: string
  authorNoteEn: string
  gratitudeNoteEs: string
  gratitudeNoteEn: string
  authorImage: string
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { createBlogFooter, updateBlogFooter } = useAdminApi()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const isNew = computed(() => route.params.id === 'new')
const saving = ref(false)
const previewLocale = ref<'es' | 'en'>('es')

const existing = isNew.value
  ? ref(null)
  : useSafeConvexQuery(api.blogFooters.getById, { id: route.params.id as Id<'blogFooters'> })

const form = reactive<FooterFormState>({
  name: 'Firma editorial base',
  authorEyebrowEs: DEFAULT_FOOTER.authorEyebrow.es,
  authorEyebrowEn: DEFAULT_FOOTER.authorEyebrow.en,
  authorName: DEFAULT_FOOTER.authorName,
  authorRoleEs: DEFAULT_FOOTER.authorRole.es,
  authorRoleEn: DEFAULT_FOOTER.authorRole.en,
  authorNoteEs: DEFAULT_FOOTER.authorNote.es,
  authorNoteEn: DEFAULT_FOOTER.authorNote.en,
  gratitudeNoteEs: DEFAULT_FOOTER.gratitudeNote.es,
  gratitudeNoteEn: DEFAULT_FOOTER.gratitudeNote.en,
  authorImage: DEFAULT_FOOTER.authorImage,
})

watch(
  existing,
  (preset) => {
    if (!preset) {
      return
    }

    form.name = preset.name
    form.authorEyebrowEs = preset.content.authorEyebrow.es
    form.authorEyebrowEn = preset.content.authorEyebrow.en
    form.authorName = preset.content.authorName
    form.authorRoleEs = preset.content.authorRole.es
    form.authorRoleEn = preset.content.authorRole.en
    form.authorNoteEs = preset.content.authorNote.es
    form.authorNoteEn = preset.content.authorNote.en
    form.gratitudeNoteEs = preset.content.gratitudeNote.es
    form.gratitudeNoteEn = preset.content.gratitudeNote.en
    form.authorImage = preset.content.authorImage
  },
  { immediate: true },
)

function buildContent() {
  return {
    authorEyebrow: {
      es: form.authorEyebrowEs,
      en: form.authorEyebrowEn,
    },
    authorName: form.authorName.trim() || DEFAULT_FOOTER.authorName,
    authorRole: {
      es: form.authorRoleEs,
      en: form.authorRoleEn,
    },
    authorNote: {
      es: form.authorNoteEs,
      en: form.authorNoteEn,
    },
    gratitudeNote: {
      es: form.gratitudeNoteEs,
      en: form.gratitudeNoteEn,
    },
    authorImage: form.authorImage.trim(),
  }
}

async function handleSubmit() {
  saving.value = true

  try {
    const payload = {
      name: form.name.trim(),
      content: buildContent(),
    }

    if (isNew.value) {
      await createBlogFooter(payload)
    } else {
      await updateBlogFooter(route.params.id as string, payload)
    }

    toast.add({ title: 'Bloque de pie guardado.', color: 'success' })
    await router.push('/admin/blog-footers')
  } catch {
    toast.add({ title: 'No se pudo guardar el bloque.', color: 'error' })
  } finally {
    saving.value = false
  }
}

const previewContent = computed(() => buildContent())

const previewCopy = computed(() => {
  const currentLocale = previewLocale.value

  return {
    eyebrow: previewContent.value.authorEyebrow[currentLocale],
    role: previewContent.value.authorRole[currentLocale],
    authorNote: previewContent.value.authorNote[currentLocale],
    gratitudeNote: previewContent.value.gratitudeNote[currentLocale],
    image: previewContent.value.authorImage || authorPortrait,
  }
})
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-8">
    <div
      class="flex flex-col gap-4 rounded-3xl border border-default bg-default/90 p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between"
    >
      <div class="flex items-start gap-3">
        <UButton icon="i-lucide-arrow-left" variant="ghost" size="sm" to="/admin/blog-footers" />
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Biblioteca editorial
          </p>
          <h2 class="mt-2 text-3xl font-bold tracking-tight">
            {{ isNew ? 'Nuevo pie de blog' : 'Editar pie de blog' }}
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Define una firma y una nota final reutilizable en español e inglés. La vista previa se
            comporta como un cierre real de artículo, no como una tarjeta lateral.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UButton label="Cancelar" variant="outline" to="/admin/blog-footers" />
        <UButton
          label="Guardar bloque"
          icon="i-lucide-save"
          :loading="saving"
          @click="handleSubmit"
        />
      </div>
    </div>

    <section class="rounded-4xl border border-default bg-(--ui-bg-elevated)/60 p-5 sm:p-7">
      <div
        class="flex flex-col gap-4 border-b border-default pb-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Previsualización del cierre
          </p>
          <h3 class="mt-2 text-xl font-bold">Así se verá al final de un post</h3>
          <p class="mt-1 text-sm leading-6 text-muted">
            Cambia el idioma para revisar el tono del preset antes de guardarlo.
          </p>
        </div>

        <USelect
          v-model="previewLocale"
          size="sm"
          class="w-full lg:w-32"
          :items="[
            { label: 'Español', value: 'es' },
            { label: 'English', value: 'en' },
          ]"
        />
      </div>

      <div class="mx-auto mt-6 w-full max-w-4xl">
        <BlogFooterBlock
          :eyebrow="previewCopy.eyebrow"
          :name="previewContent.authorName"
          :role="previewCopy.role"
          :image="previewCopy.image"
          :gratitude-note="previewCopy.gratitudeNote"
          :author-note="previewCopy.authorNote"
          name-tag="h4"
        />
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div class="space-y-6">
        <div class="rounded-2xl border border-default bg-default p-6 space-y-4 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Identidad</p>
            <h3 class="mt-2 text-lg font-bold">Datos base del bloque</h3>
            <p class="mt-1 text-sm leading-6 text-muted">
              Usa un nombre reconocible para reutilizarlo luego desde el editor del blog.
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Nombre del bloque</label>
            <UInput v-model="form.name" size="lg" class="w-full" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Nombre del autor</label>
            <UInput v-model="form.authorName" class="w-full" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">URL de imagen del autor</label>
            <UInput
              v-model="form.authorImage"
              class="w-full"
              placeholder="Opcional. Si queda vacío se usa la imagen por defecto"
            />
          </div>
        </div>
      </div>

      <div class="grid gap-6 2xl:grid-cols-2">
        <div class="rounded-2xl border border-default bg-default p-6 space-y-4 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Español</p>
            <h3 class="mt-2 text-lg font-bold">Copy editorial</h3>
          </div>
          <UInput v-model="form.authorEyebrowEs" placeholder="Eyebrow" class="w-full" />
          <UInput v-model="form.authorRoleEs" placeholder="Rol" class="w-full" />
          <UTextarea
            v-model="form.authorNoteEs"
            :rows="8"
            class="w-full"
            placeholder="Nota de firma"
          />
          <UTextarea
            v-model="form.gratitudeNoteEs"
            :rows="6"
            class="w-full"
            placeholder="Nota final"
          />
        </div>

        <div class="rounded-2xl border border-default bg-default p-6 space-y-4 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">English</p>
            <h3 class="mt-2 text-lg font-bold">Editorial copy</h3>
          </div>
          <UInput v-model="form.authorEyebrowEn" placeholder="Eyebrow" class="w-full" />
          <UInput v-model="form.authorRoleEn" placeholder="Role" class="w-full" />
          <UTextarea
            v-model="form.authorNoteEn"
            :rows="8"
            class="w-full"
            placeholder="Author note"
          />
          <UTextarea
            v-model="form.gratitudeNoteEn"
            :rows="6"
            class="w-full"
            placeholder="Closing note"
          />
        </div>
      </div>
    </div>
  </div>
</template>
