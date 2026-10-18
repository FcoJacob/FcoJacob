<script setup lang="ts">
import AlleyShell from '../../components/labs/wizard-alley/AlleyShell.vue'

const { t } = useI18n()

definePageMeta({
  layout: false,
})

useSeoMeta({
  title: `${t('labs_alley.title')} - ${t('app.title')}`,
  description: t('labs_alley.summary'),
  ogTitle: `${t('labs_alley.title')} - ${t('app.title')}`,
  ogDescription: t('labs_alley.summary'),
})
</script>

<template>
  <AlleyShell />
</template>
