import { defineVitestConfig } from '@nuxt/test-utils/config'

process.env.CONVEX_URL = 'https://mock.convex.cloud'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    env: {
      CONVEX_URL: 'https://mock.convex.cloud',
    },
  },
})
