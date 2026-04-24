<script setup lang="ts">
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { indentWithTab } from '@codemirror/commands'

const model = defineModel<string>({ default: '' })

const editorRef = ref<HTMLDivElement>()
let view: EditorView | null = null

const colorMode = useColorMode()

function createExtensions() {
  const exts = [
    basicSetup,
    json(),
    keymap.of([indentWithTab]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        model.value = update.state.doc.toString()
      }
    }),
  ]
  if (colorMode.value === 'dark') {
    exts.push(oneDark)
  }
  return exts
}

onMounted(() => {
  if (!editorRef.value) return
  view = new EditorView({
    state: EditorState.create({
      doc: model.value,
      extensions: createExtensions(),
    }),
    parent: editorRef.value,
  })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(model, (val) => {
  if (view && val !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: val },
    })
  }
})

watch(colorMode, () => {
  if (!view || !editorRef.value) return
  const doc = view.state.doc.toString()
  view.destroy()
  view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: createExtensions(),
    }),
    parent: editorRef.value,
  })
})
</script>

<template>
  <div
    ref="editorRef"
    class="rounded-lg border border-(--ui-border) overflow-hidden min-h-[500px]"
  />
</template>
