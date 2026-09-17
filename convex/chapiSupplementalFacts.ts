/**
 * Extra facts for the chapi-ai chatbot's RAG index that don't belong on the
 * public /cv.pdf itself (the CV recruiters download), but that the chatbot
 * should still be able to answer from — chapi-ai's grounding is strict
 * ("never use info outside the knowledge source, even if you know it"), so
 * anything not literally present in an ingested source can't be answered,
 * regardless of what the persona description says.
 */
export const CHAPI_SUPPLEMENTAL_FACTS: string[] = [
  "Jacob Sarmiento también es conocido por su nombre legal completo, Francisco Jacobo Sarmiento Pérez. 'Jacob' es el nombre profesional que usa habitualmente.",
]
