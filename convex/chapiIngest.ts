'use node'

import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { ingestPdf, ingestText, type KnowledgeChunk } from 'chapi-ai'
import { CHAPI_SUPPLEMENTAL_FACTS } from './chapiSupplementalFacts'

/**
 * Reuses the site's own live CV PDF (served by server/routes/cv.pdf.get.ts,
 * generated from the same Convex `cv` data as the /cv page) as the RAG
 * source for the chapi-ai chatbot, instead of duplicating CV content into a
 * second PDF. This keeps the chatbot's knowledge from ever drifting out of
 * sync with the published CV.
 *
 * PDF parsing (`ingestPdf`, via the `unpdf` dependency) uses a Worker/
 * `postMessage` internally, which Convex's default V8 action runtime does
 * not support (`structuredClone with transfer not supported`). It works
 * fine in the Node.js action runtime, so ingestion runs here and the
 * resulting chunks are persisted — the chat httpAction (default runtime)
 * only ever reads pre-computed chunks, never parses the PDF itself.
 */
const CV_PDF_URL = 'https://jsarmiento.dev/cv.pdf'

async function ingestCvPdf(voyageApiKey: string): Promise<KnowledgeChunk[]> {
  const res = await fetch(CV_PDF_URL)
  if (!res.ok) {
    throw new Error(`No se pudo descargar el CV para el RAG del chatbot: HTTP ${res.status}`)
  }
  const pdfBytes = new Uint8Array(await res.arrayBuffer())
  return ingestPdf(pdfBytes, { apiKey: voyageApiKey })
}

/**
 * chapi-ai's grounding only lets it answer from ingested source text (never
 * from the persona description, even though that also mentions who the bot
 * is). Facts that shouldn't appear on the public, downloadable CV but that
 * the chatbot should still be able to answer (see `chapiSupplementalFacts`)
 * go through `ingestText` directly.
 */
async function ingestSupplementalFacts(voyageApiKey: string): Promise<KnowledgeChunk[]> {
  if (CHAPI_SUPPLEMENTAL_FACTS.length === 0) return []
  return ingestText(CHAPI_SUPPLEMENTAL_FACTS.join('\n\n'), { apiKey: voyageApiKey })
}

export const ingest = internalAction({
  args: {},
  handler: async (ctx) => {
    const voyageApiKey = process.env.VOYAGE_API_KEY
    if (!voyageApiKey) throw new Error('VOYAGE_API_KEY no está configurada en Convex')

    const [cvChunks, supplementalChunks] = await Promise.all([
      ingestCvPdf(voyageApiKey),
      ingestSupplementalFacts(voyageApiKey),
    ])
    const chunks = [...cvChunks, ...supplementalChunks]
    await ctx.runMutation(internal.chapiKnowledge.save, { chunks })
    return { chunkCount: chunks.length, supplementalChunkCount: supplementalChunks.length }
  },
})
