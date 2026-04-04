import { resolve } from 'node:path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5,
  },

  modules: ['convex-nuxt'],

  convex: {
    url: (process.env.CONVEX_URL ?? '').replace(/\/$/, ''),
  },

  runtimeConfig: {
    public: {
      convex: {
        url: (process.env.CONVEX_URL ?? '').replace(/\/$/, ''),
      },
    },
  },

  extends: [
    './layers/base',
    './layers/public',
    './layers/admin',
  ],

  devtools: { enabled: true },

  compatibilityDate: '2026-04-04',

  hooks: {
    'app:resolve'(app) {
      const convexPlugin = app.plugins.find(p =>
        typeof p === 'object' && 'src' in p
          ? p.src.includes('convex-nuxt')
          : typeof p === 'string' && p.includes('convex-nuxt'),
      )
      if (convexPlugin && typeof convexPlugin === 'object') {
        convexPlugin.mode = 'client'
      }
    },
  },

  alias: {
    '#convex': resolve(import.meta.dirname, 'convex'),
  },

  nitro: {
    alias: {
      '#convex': resolve(import.meta.dirname, 'convex'),
    },
  },
})
