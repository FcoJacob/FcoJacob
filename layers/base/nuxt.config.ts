// layers/base - Shared UI, layouts, i18n, styles, and code quality config
import { resolve } from 'node:path'

const currentDir = import.meta.dirname!

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/eslint'],

  css: [resolve(currentDir, 'app/assets/css/main.css')],

  i18n: {
    baseUrl: 'https://jsarmiento.dev',
    locales: [
      { code: 'es', name: 'Español', language: 'es-ES', file: 'es.json' },
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
    ],
    defaultLocale: 'es',
    strategy: 'prefix_except_default',
    langDir: '../i18n/locales',
    lazy: true,
  },

  eslint: {
    config: {
      standalone: true,
    },
  },
})
