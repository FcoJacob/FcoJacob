<script setup lang="ts">
import ShowroomShell from '../../components/labs/showroom/ShowroomShell.vue'
import { showroomManifest } from '../../utils/labs/showroom/manifest'

const { t } = useI18n()

definePageMeta({
  layout: false,
})

useSeoMeta({
  title: `${t('labs_showroom.title')} - ${t('app.title')}`,
  description: t('labs_showroom.summary'),
})
</script>

<template>
  <ShowroomShell :manifest="showroomManifest" />
</template>
