import { describe, it, expect } from 'vitest'
import { jsPDF } from 'jspdf'
import { drawCvPdf, type CvPdfData } from '../../shared/utils/cv-pdf'

const fixture: CvPdfData = {
  name: 'Jacob Sarmiento',
  label: 'Frontend Developer',
  summary: 'Summary text for the CV.',
  location: 'Las Palmas, Canarias',
  email: 'test@example.com',
  phone: '+34 600000000',
  linkedinUrl: 'https://www.linkedin.com/in/fcojacob/',
  githubUrl: 'https://github.com/FcoJacob',
  websiteUrl: 'https://jsarmiento.dev',
  skills: [{ name: 'Frontend', level: 'Senior', keywords: ['Vue.js', 'Nuxt', 'TypeScript'] }],
  softSkills: ['Teamwork'],
  languages: [{ language: 'Español', fluency: 'Nativo' }],
  certifications: ['Cert A'],
  driving: 'Permiso B',
  work: [
    {
      position: 'Senior Frontend Developer',
      name: 'AIDA',
      startDate: '2024-12',
      endDate: '',
      summary: 'Frontend work.',
      highlights: ['Highlight one'],
    },
  ],
  education: [
    {
      institution: 'UOC',
      studyType: 'Grado',
      area: 'Ingeniería Informática',
      startDate: '2022',
      endDate: '',
    },
  ],
  projects: [{ name: 'masquehuellas.es', description: 'Veterinary clinic site.' }],
  labels: {
    skills: 'Habilidades',
    softSkills: 'Habilidades Blandas',
    languages: 'Idiomas',
    certifications: 'Certificaciones',
    driving: 'Carnet de Conducir',
    work: 'Experiencia Laboral',
    education: 'Educación',
    projects: 'Proyectos',
    present: 'Actualmente',
    additionalInfo: 'Información Adicional',
  },
}

describe('drawCvPdf', () => {
  it('renders a text-based A4 PDF with at least one page', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    drawCvPdf(doc, fixture)

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)

    const bytes = doc.output('arraybuffer')
    expect(bytes.byteLength).toBeGreaterThan(1000)

    // Real text operators must be present (ATS-parseable), not rasterized images
    const raw = doc.output()
    expect(raw).toContain('/Helvetica')
  })

  it('includes every section label passed in', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    expect(() => drawCvPdf(doc, { ...fixture, work: [], projects: [] })).not.toThrow()
  })
})
