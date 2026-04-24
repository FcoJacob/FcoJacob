export function useDeleteConfirm() {
  const overlay = useOverlay()
  const toast = useToast()

  const pendingId = ref<string | null>(null)
  const showModal = ref(false)

  function requestDelete(id: string) {
    pendingId.value = id
    showModal.value = true
  }

  function cancelDelete() {
    pendingId.value = null
    showModal.value = false
  }

  async function confirmDelete(deleteFn: (id: string) => Promise<unknown>, label: string) {
    if (!pendingId.value) return
    try {
      await deleteFn(pendingId.value)
      toast.add({ title: `${label} deleted`, color: 'success' })
    } catch {
      toast.add({ title: `Error deleting ${label.toLowerCase()}`, color: 'error' })
    } finally {
      showModal.value = false
      pendingId.value = null
    }
  }

  return { pendingId, showModal, requestDelete, cancelDelete, confirmDelete }
}
