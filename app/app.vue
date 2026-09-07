<script setup lang="ts">
// Locale-aware <html lang/dir>, hreflang alternates, canonical, og:locale
const i18nHead = useLocaleHead({ seo: true })

useHead(() => ({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs?.lang ?? 'es',
    dir: i18nHead.value.htmlAttrs?.dir,
  },
  link: [...(i18nHead.value.link ?? [])],
  meta: [...(i18nHead.value.meta ?? [])],
}))

// Site-wide social card defaults; pages override title/description
useSeoMeta({
  ogSiteName: 'Jacob Sarmiento',
  ogType: 'website',
  ogImage: 'https://jsarmiento.dev/og.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://jsarmiento.dev/og.png',
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
  </UApp>
</template>
