import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Keeps the chatbot's RAG knowledge in sync with the published CV without
// re-parsing the PDF (and re-calling the embeddings API) on every cold start.
crons.interval('re-ingest chapi-ai CV knowledge', { hours: 24 }, internal.chapiIngest.ingest, {})

export default crons
