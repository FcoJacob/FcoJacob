<script setup lang="ts">
import { api } from '#convex/_generated/api'

const { deleteBlogFooter } = useAdminApi()

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const footers = useSafeConvexQuery(api.blogFooters.list, {})
const { showModal, requestDelete, cancelDelete, confirmDelete } = useDeleteConfirm()
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold">Pies de blog</h2>
        <p class="mt-1 text-sm text-muted">
          Crea bloques reutilizables de firma y nota final para asignarlos a cualquier entrada.
        </p>
      </div>

      <UButton label="Nuevo bloque" icon="i-lucide-plus" to="/admin/blog-footers/new" />
    </div>

    <div v-if="!footers" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
    </div>

    <UTable
      v-else
      :data="footers"
      :columns="[
        { accessorKey: 'name', header: 'Bloque' },
        { accessorKey: 'author', header: 'Autor' },
        { accessorKey: 'actions', header: '' },
      ]"
    >
      <template #author-cell="{ row }">
        <div>
          <p class="font-medium">{{ row.original.content.authorName }}</p>
          <p class="text-xs text-muted">
            {{ row.original.content.authorRole.es || row.original.content.authorRole.en }}
          </p>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-2">
          <UButton
            :to="`/admin/blog-footers/${row.original._id}`"
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
          <h3 class="mb-2 text-lg font-semibold">Eliminar bloque</h3>
          <p class="mb-4 text-muted">
            Se quitará este preset del panel. Las entradas que lo tuvieran asignado caerán al pie
            por defecto o al override propio del post.
          </p>
          <div class="flex justify-end gap-2">
            <UButton label="Cancelar" variant="outline" @click="cancelDelete" />
            <UButton
              label="Eliminar"
              color="error"
              @click="confirmDelete(deleteBlogFooter, 'Blog footer')"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
