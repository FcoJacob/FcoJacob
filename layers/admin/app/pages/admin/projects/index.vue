<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const { deleteProject } = useAdminApi()
const toast = useToast()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const projects = useSafeConvexQuery(api.projects.list, {})

async function handleDelete(id: string) {
  try {
    await deleteProject(id)
    toast.add({ title: 'Project deleted', color: 'success' })
  }
  catch {
    toast.add({ title: 'Error deleting project', color: 'error' })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">
        {{ t('admin.projects') }}
      </h2>
      <UButton
        :label="t('common.create')"
        icon="i-lucide-plus"
        to="/admin/projects/new"
      />
    </div>

    <UTable
      :data="projects ?? []"
      :columns="[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'isActive', header: 'Active' },
        { accessorKey: 'order', header: 'Order' },
        { accessorKey: 'actions', header: '' },
      ]"
    >
      <template #isActive-cell="{ row }">
        <UBadge :color="row.original.isActive ? 'success' : 'neutral'" :label="row.original.isActive ? 'Yes' : 'No'" />
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-2 justify-end">
          <UButton
            :to="`/admin/projects/${row.original._id}`"
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
