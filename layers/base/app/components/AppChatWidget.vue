<script setup lang="ts">
const config = useRuntimeConfig()
const chatEndpoint = computed(() => `${config.public.convex.url.replace('.convex.cloud', '.convex.site')}/chat`)

useHead({
  script: [{ type: 'module', src: '/chapi-chat.js' }],
})
</script>

<template>
  <ClientOnly>
    <chapi-chat
      :endpoint="chatEndpoint"
      persona-name="fsarmiento"
      locale="es"
      mode="launcher"
    />
  </ClientOnly>
</template>
