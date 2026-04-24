<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const { upsertCv } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const cvData = useSafeConvexQuery(api.cv.get, {})

const jsonInput = ref('')
const editorRef = ref<HTMLDivElement>()
let editorView: any = null

watch(
  cvData,
  (data) => {
    if (data) {
      const { _id, _creationTime, ...rest } = data
      const newVal = JSON.stringify(rest, null, 2)
      jsonInput.value = newVal
      if (editorView && editorView.state.doc.toString() !== newVal) {
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: newVal },
        })
      }
    }
  },
  { immediate: true },
)

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
})

onBeforeUnmount(() => {
  editorView?.destroy()
  editorView = null
})

async function handleSubmit() {
  try {
    const parsed = JSON.parse(jsonInput.value)
    await upsertCv(parsed)
    toast.add({ title: 'CV updated', color: 'success' })
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
    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: formatted },
      })
    }
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

    <p class="text-sm text-(--ui-text-muted) mb-4">
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

    <div
      ref="editorRef"
      class="rounded-lg border border-(--ui-border) overflow-hidden min-h-[500px]"
    />
  </div>
</template>
