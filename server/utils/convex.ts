import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'

let _client: ConvexHttpClient | null = null

export function useConvexHttpClient() {
  if (!_client) {
    const url = process.env.CONVEX_URL || process.env.NUXT_CONVEX_URL || process.env.VITE_CONVEX_URL
    if (!url) {
      throw new Error('Convex URL not configured. Set CONVEX_URL in .env')
    }
    _client = new ConvexHttpClient(url)
  }
  return { client: _client, api }
}
