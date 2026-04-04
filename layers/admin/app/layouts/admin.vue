<script setup lang="ts">
const { t } = useI18n()
const { user, clear } = useUserSession()

const adminNavItems = computed(() => [
  { label: t('admin.dashboard'), to: '/admin', icon: 'i-lucide-layout-dashboard' },
  { label: t('admin.blogs'), to: '/admin/blogs', icon: 'i-lucide-file-text' },
  { label: t('admin.projects'), to: '/admin/projects', icon: 'i-lucide-folder-kanban' },
  { label: t('admin.labs'), to: '/admin/labs', icon: 'i-lucide-flask-conical' },
  { label: t('admin.cv'), to: '/admin/cv', icon: 'i-lucide-user' },
])

async function handleLogout() {
  await clear()
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen flex">
    <aside class="w-64 border-r border-(--ui-border) p-4 flex flex-col gap-4">
      <div class="flex items-center gap-2 pb-4 border-b border-(--ui-border)">
        <UAvatar v-if="user?.avatar" :src="user.avatar" size="sm" />
        <span class="text-sm font-medium truncate">{{ user?.name }}</span>
      </div>

      <UVerticalNavigation :links="adminNavItems" />

      <div class="mt-auto">
        <UButton
          :label="t('common.logout')"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          block
          @click="handleLogout"
        />
      </div>
    </aside>

    <div class="flex-1 flex flex-col">
      <header class="border-b border-(--ui-border) h-16 flex items-center px-6 justify-between">
        <h1 class="text-lg font-semibold">
          {{ t('admin.title') }}
        </h1>
        <div class="flex items-center gap-2">
          <LanguageSwitcher />
          <UColorModeButton />
        </div>
      </header>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
