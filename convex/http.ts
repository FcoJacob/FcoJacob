import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { createConvexHandler } from 'chapi-ai/adapters/convex'
import { withCors } from 'chapi-ai/adapters/cors'
import { internal } from './_generated/api'
import { createChapiBot } from './chapiBot'

const http = httpRouter()

// The chat widget calls this endpoint from the browser on jsarmiento.dev (a
// different origin than *.convex.site), so it needs CORS headers — chapi-ai's
// withCors handles that (wildcard origin is safe here: the endpoint is
// public and unauthenticated, and it also keeps local dev working against
// the same Convex deployment). Convex's router still dispatches by
// method+path though, so OPTIONS needs its own route pointing at the same
// handler — withCors answers the preflight itself.
const chatHandler = httpAction(async (ctx, req) => {
  const handleRequest = withCors(async (request) => {
    const chunks = await ctx.runQuery(internal.chapiKnowledge.getChunks, {})
    if (!chunks) {
      return new Response('El chatbot todavía no tiene conocimiento ingerido. Ejecuta chapiIngest:ingest.', {
        status: 503,
      })
    }
    const bot = createChapiBot(chunks)
    return createConvexHandler(bot)(ctx, request)
  })
  return handleRequest(req)
})

http.route({ path: '/chat', method: 'POST', handler: chatHandler })
http.route({ path: '/chat', method: 'OPTIONS', handler: chatHandler })

export default http
