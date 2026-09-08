import { jsPDF } from 'jspdf'
import { drawCvPdf, type CvPdfData } from '#shared/utils/cv-pdf'
import es from '../../layers/base/i18n/locales/es.json'
import en from '../../layers/base/i18n/locales/en.json'

const messages = { es, en } as const
type Locale = keyof typeof messages

/**
 * Serves the CV as a real, text-based PDF (ATS-parseable) at a stable URL.
 * Data comes from Convex — the same source the /cv page renders — so the
 * download never drifts from the published CV. `?locale=en` switches language.
 */
export default defineEventHandler(async (event) => {
  const localeParam = getQuery(event).locale
  const locale: Locale = localeParam === 'en' ? 'en' : 'es'
  const t = messages[locale]

  const { client, api } = useConvexHttpClient()
  const cv = await client.query(api.cv.get, { locale })
  if (!cv) {
    throw createError({ statusCode: 404, statusMessage: 'CV not found' })
  }

  const profiles: Array<{ network: string; url: string }> = cv.basics.profiles ?? []
  const profileUrl = (network: string) =>
    profiles.find((p) => p.network === network)?.url ?? ''

  const data: CvPdfData = {
    name: cv.basics.name,
    label: cv.basics.label,
    summary: cv.basics.summary,
    location: `${cv.basics.location.city}, ${cv.basics.location.region}`,
    email: cv.basics.email,
    phone: cv.basics.phone ?? '',
    linkedinUrl: profileUrl('LinkedIn'),
    githubUrl: profileUrl('GitHub'),
    websiteUrl: cv.basics.url ?? 'https://jsarmiento.dev',
    skills: cv.skills,
    softSkills: t.cv_data.soft_skills,
    languages: cv.languages,
    certifications: t.cv_data.certifications,
    driving: t.cv_data.driving,
    work: cv.work.map((j) => ({
      position: j.position,
      name: j.name,
      startDate: j.startDate,
      endDate: j.endDate ?? '',
      summary: j.summary,
      highlights: j.highlights ?? [],
    })),
    education: cv.education.map((e) => ({
      institution: e.institution,
      studyType: e.studyType,
      area: e.area,
      startDate: e.startDate,
      endDate: e.endDate ?? '',
      note: e.score,
    })),
    projects: cv.projects.map((p) => ({
      name: p.name,
      description: p.description,
      url: p.url,
    })),
    labels: {
      skills: t.cv.skills,
      softSkills: t.cv.soft_skills,
      languages: t.cv.languages,
      certifications: t.cv.certifications,
      driving: t.cv.driving,
      work: t.cv.work,
      education: t.cv.education,
      projects: t.cv.projects,
      present: t.cv.present,
      additionalInfo: t.cv.additional_info,
    },
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  drawCvPdf(doc, data)

  const filename = `${cv.basics.name.replace(/\s+/g, '-')}-CV${locale === 'en' ? '-EN' : ''}.pdf`
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="${filename}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')
  return Buffer.from(doc.output('arraybuffer'))
})
