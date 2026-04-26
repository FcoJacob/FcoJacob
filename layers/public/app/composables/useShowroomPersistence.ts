export function useShowroomPersistence(
  storageKey: string,
  snapshot: Ref<Record<string, string>>,
  restoreSelections: (snapshot: Record<string, string>) => void,
  resetSelections: () => void,
) {
  const lastSavedAt = shallowRef<number | null>(null)
  const hasRestoredState = shallowRef(false)
  const isReadyToPersist = shallowRef(false)

  function restore() {
    if (!import.meta.client) {
      return
    }

    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) {
      return
    }

    try {
      const parsed = JSON.parse(rawValue) as {
        selections?: Record<string, string>
        savedAt?: number
      }
      if (parsed.selections) {
        restoreSelections(parsed.selections)
        hasRestoredState.value = true
      }
      if (typeof parsed.savedAt === 'number') {
        lastSavedAt.value = parsed.savedAt
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }

  function persistSelections(currentSnapshot: Record<string, string>) {
    if (!import.meta.client || !isReadyToPersist.value) {
      return
    }

    const savedAt = Date.now()
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        selections: currentSnapshot,
        savedAt,
      }),
    )
    lastSavedAt.value = savedAt
  }

  function resetPersistedSelections() {
    resetSelections()

    if (import.meta.client) {
      window.localStorage.removeItem(storageKey)
    }

    lastSavedAt.value = null
    hasRestoredState.value = false
  }

  onMounted(restore)

  onMounted(() => {
    isReadyToPersist.value = true
  })

  watch(snapshot, persistSelections, { deep: true })

  return {
    hasRestoredState,
    lastSavedAt,
    resetPersistedSelections,
  }
}
