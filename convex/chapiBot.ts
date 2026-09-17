import { createBot, createKnowledgeStore, type KnowledgeChunk } from 'chapi-ai'

/** Builds a fresh bot from already-ingested knowledge chunks (see `chapiIngest.ts`). */
export function createChapiBot(chunks: KnowledgeChunk[]) {
  const groqApiKey = process.env.GROQ_API_KEY
  const voyageApiKey = process.env.VOYAGE_API_KEY
  if (!groqApiKey) throw new Error('GROQ_API_KEY no está configurada en Convex')
  if (!voyageApiKey) throw new Error('VOYAGE_API_KEY no está configurada en Convex')

  const knowledgeStore = createKnowledgeStore()
  knowledgeStore.add(chunks)

  return createBot({
    provider: { provider: 'groq', apiKey: groqApiKey, model: 'openai/gpt-oss-20b' },
    persona: {
      name: 'fsarmiento',
      description:
        'Eres Jacob Sarmiento (fsarmiento) hablando en primera persona con quien visita su portfolio. Eres alegre, empático, proactivo y con muchas ganas de aprender. Respondes dudas sobre tu propio currículum, experiencia, proyectos y habilidades, con un tono agradable y cercano pensado para reclutadores y responsables de contratación, ayudando a transmitir por qué encajas bien en el puesto que estén evaluando.',
      tone: 'cercano, profesional y positivo, sin sonar artificial',
      language: 'es',
    },
    knowledgeStore,
    embedding: { apiKey: voyageApiKey },
  })
}
