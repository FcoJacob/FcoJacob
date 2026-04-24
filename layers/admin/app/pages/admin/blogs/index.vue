<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { t } = useI18n()
const { deleteBlog } = useAdminApi()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const blogs = useSafeConvexQuery(api.blogs.list, {})
const { showModal, requestDelete, cancelDelete, confirmDelete } = useDeleteConfirm()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">
        {{ t('admin.blogs') }}
      </h2>
      <UButton :label="t('common.create')" icon="i-lucide-plus" to="/admin/blogs/new" />
    </div>

    <div v-if="!blogs" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-(--ui-text-muted)" />
    </div>

    <UTable
      v-else
      :data="blogs"
      :columns="[
        { accessorKey: 'title', header: 'Title' },
        { accessorKey: 'slug', header: 'Slug' },
        { accessorKey: 'locale', header: 'Locale' },
        { accessorKey: 'published', header: 'Published' },
        { accessorKey: 'actions', header: '' },
      ]"
    >
      <template #published-cell="{ row }">
        <UBadge
          :color="row.original.published ? 'success' : 'neutral'"
          :label="row.original.published ? 'Yes' : 'No'"
        />
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-2 justify-end">
          <UButton
            :to="`/admin/blogs/${row.original._id}`"
            icon="i-lucide-pencil"
            size="xs"
            variant="ghost"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            @click="requestDelete(row.original._id)"
          />
        </div>
      </template>
    </UTable>

    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-2">Confirm delete</h3>
          <p class="text-(--ui-text-muted) mb-4">
            Are you sure you want to delete this blog? This action cannot be undone.
          </p>
          <div class="flex gap-2 justify-end">
            <UButton label="Cancel" variant="outline" @click="cancelDelete" />
            <UButton label="Delete" color="error" @click="confirmDelete(deleteBlog, 'Blog')" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
