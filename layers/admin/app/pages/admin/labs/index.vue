<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const { deleteLab } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const labs = useConvexQuery(api.labs.list, {})

async function handleDelete(id: string) {
  try {
    await deleteLab(id)
    toast.add({ title: 'Lab deleted', color: 'success' })
  }
  catch {
    toast.add({ title: 'Error deleting lab', color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">
        {{ t('admin.labs') }}
      </h2>
      <UButton
        :label="t('common.create')"
        icon="i-lucide-plus"
        to="/admin/labs/new"
      />
    </div>

    <UTable
      :data="labs ?? []"
      :columns="[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'published', header: 'Published' },
        { accessorKey: 'actions', header: '' },
      ]"
    >
      <template #published-cell="{ row }">
        <UBadge :color="row.original.published ? 'success' : 'neutral'" :label="row.original.published ? 'Yes' : 'No'" />
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-2 justify-end">
          <UButton
            :to="`/admin/labs/${row.original._id}`"
            icon="i-lucide-pencil"
            size="xs"
            variant="ghost"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            @click="handleDelete(row.original._id)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>
