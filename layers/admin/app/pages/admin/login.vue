<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-bold text-center">
          {{ t('common.login') }}
        </h1>
      </template>

      <div class="flex flex-col gap-3">
        <UButton
          to="/auth/google"
          icon="i-simple-icons-google"
          label="Google"
          color="neutral"
          variant="outline"
          size="lg"
          block
          external
        />
        <UButton
          to="/auth/linkedin"
          icon="i-simple-icons-linkedin"
          label="LinkedIn"
          color="neutral"
          variant="outline"
          size="lg"
          block
          external
        />
      </div>
    </UCard>
  </div>
</template>
