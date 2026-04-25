<script setup lang="ts">
const { t } = useI18n()
const { upsertCv } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const selectedLocale = ref('es')
const localeOptions = [
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' },
]

const jsonInput = ref('')
const editorRef = ref<HTMLDivElement>()
let editorView: any = null

async function loadCvData(locale: string) {
  try {
    const data = await $fetch('/api/public/cv', { query: { locale } })
    if (data) {
      const { _id, _creationTime, locale: _loc, ...rest } = data as Record<string, unknown>
      const newVal = JSON.stringify(rest, null, 2)
      jsonInput.value = newVal
      updateEditor(newVal)
    } else {
      jsonInput.value = ''
      updateEditor('')
    }
  } catch {
    jsonInput.value = ''
    updateEditor('')
  }
}

function updateEditor(content: string) {
  if (editorView && editorView.state.doc.toString() !== content) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: content },
    })
  }
}

watch(selectedLocale, (locale) => loadCvData(locale))

onMounted(async () => {
  if (!editorRef.value) return

  const [
    { EditorView, keymap },
    { EditorState },
    { json },
    { oneDark },
    { basicSetup },
    { indentWithTab },
  ] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/state'),
    import('@codemirror/lang-json'),
    import('@codemirror/theme-one-dark'),
    import('codemirror'),
    import('@codemirror/commands'),
  ])

  const colorMode = useColorMode()

  const extensions = [
    basicSetup,
    json(),
    keymap.of([indentWithTab]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update: any) => {
      if (update.docChanged) {
        jsonInput.value = update.state.doc.toString()
      }
    }),
  ]

  if (colorMode.value === 'dark') {
    extensions.push(oneDark)
  }

  editorView = new EditorView({
    state: EditorState.create({
      doc: jsonInput.value,
      extensions,
    }),
    parent: editorRef.value,
  })

  await loadCvData(selectedLocale.value)
})

onBeforeUnmount(() => {
  editorView?.destroy()
  editorView = null
})

async function handleSubmit() {
  try {
    const parsed = JSON.parse(jsonInput.value)
    await upsertCv(parsed, selectedLocale.value)
    toast.add({ title: `CV (${selectedLocale.value}) updated`, color: 'success' })
  } catch (e) {
    const message = e instanceof SyntaxError ? 'Invalid JSON' : 'Error saving CV'
    toast.add({ title: message, color: 'error' })
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(jsonInput.value)
    const formatted = JSON.stringify(parsed, null, 2)
    jsonInput.value = formatted
    updateEditor(formatted)
  } catch {
    toast.add({ title: 'Invalid JSON — cannot format', color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">
        {{ t('admin.cv') }}
      </h2>
      <div class="flex gap-2">
        <UButton label="Format" icon="i-lucide-braces" variant="outline" @click="formatJson" />
        <UButton :label="t('common.save')" icon="i-lucide-save" @click="handleSubmit" />
      </div>
    </div>

    <div class="flex items-center gap-4 mb-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{{ t('common.language') || 'Idioma' }}:</span>
        <div class="flex gap-1">
          <UButton
            v-for="opt in localeOptions"
            :key="opt.value"
            :label="opt.label"
            :variant="selectedLocale === opt.value ? 'solid' : 'outline'"
            size="sm"
            @click="selectedLocale = opt.value"
          />
        </div>
      </div>
      <p class="text-sm text-(--ui-text-muted)">
        Edit the CV JSON following the
        <a
          href="https://github.com/midudev/minimalist-portfolio-json/blob/main/cv.json"
          target="_blank"
          rel="noopener"
          class="underline"
          >minimalist-portfolio-json</a
        >
        schema.
      </p>
    </div>

    <div
      ref="editorRef"
      class="rounded-lg border border-(--ui-border) overflow-hidden min-h-[500px]"
    />
  </div>
</template>
