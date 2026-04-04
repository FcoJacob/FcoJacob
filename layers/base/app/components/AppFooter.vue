<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-(--ui-border) mt-auto">
    <UContainer class="py-10">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <p class="text-sm text-(--ui-text-muted)">
            &copy; {{ new Date().getFullYear() }} {{ t('app.title') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            to="https://www.linkedin.com/in/fcojacob/"
            icon="i-lucide-linkedin"
            variant="ghost"
            color="neutral"
            size="md"
            target="_blank"
            external
            aria-label="LinkedIn"
          />
          <UButton
            to="https://github.com/FcoJacob"
            icon="i-lucide-github"
            variant="ghost"
            color="neutral"
            size="md"
            target="_blank"
            external
            aria-label="GitHub"
          />
          <UButton
            to="mailto:fco.j.sarmientoperez@gmail.com"
            icon="i-lucide-mail"
            variant="ghost"
            color="neutral"
            size="md"
            external
            aria-label="Email"
          />
        </div>
      </div>
    </UContainer>
  </footer>
</template>
