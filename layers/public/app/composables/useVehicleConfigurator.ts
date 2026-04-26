import { readonly } from 'vue'
import type { ShowroomOptionGroup, ShowroomOptionType } from '../utils/labs/showroom/manifest'

export function useVehicleConfigurator(optionGroups: Ref<ShowroomOptionGroup[]>) {
  const selectedOptionIds = reactive<Record<string, string>>({})

  function getDefaultSelections() {
    const defaults: Record<string, string> = {}

    for (const group of optionGroups.value) {
      if (group.options[0]) {
        defaults[group.id] = group.options[0].id
      }
    }

    return defaults
  }

  function initializeSelections() {
    for (const group of optionGroups.value) {
      if (!selectedOptionIds[group.id] && group.options[0]) {
        selectedOptionIds[group.id] = group.options[0].id
      }
    }
  }

  function selectOption(groupId: string, optionId: string) {
    selectedOptionIds[groupId] = optionId
  }

  function restoreSelections(snapshot: Record<string, string>) {
    const allowedOptions = new Map(
      optionGroups.value.map((group) => [
        group.id,
        new Set(group.options.map((option) => option.id)),
      ]),
    )

    for (const [groupId, optionId] of Object.entries(snapshot)) {
      if (allowedOptions.get(groupId)?.has(optionId)) {
        selectedOptionIds[groupId] = optionId
      }
    }

    initializeSelections()
  }

  function resetSelections() {
    const defaults = getDefaultSelections()

    for (const key of Object.keys(selectedOptionIds)) {
      delete selectedOptionIds[key]
    }

    Object.assign(selectedOptionIds, defaults)
  }

  const selectionSnapshot = computed(() => ({ ...selectedOptionIds }))

  const selectionsByType = computed<Record<ShowroomOptionType, string | null>>(() => {
    const entries: Record<ShowroomOptionType, string | null> = {
      color: null,
      trim: null,
      wheels: null,
      interior: null,
      finish: null,
      coating: null,
    }

    for (const group of optionGroups.value) {
      const selectedId = selectedOptionIds[group.id]
      const selectedOption = group.options.find((option) => option.id === selectedId)
      entries[group.type] = selectedOption?.value ?? null
    }

    return entries
  })

  onMounted(initializeSelections)
  watch(optionGroups, initializeSelections, { immediate: true })

  return {
    selectedOptionIds: readonly(selectedOptionIds),
    selectionSnapshot,
    selectionsByType,
    selectOption,
    restoreSelections,
    resetSelections,
  }
}
