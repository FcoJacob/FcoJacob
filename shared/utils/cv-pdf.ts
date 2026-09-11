import type { jsPDF } from 'jspdf'

export interface CvPdfData {
  name: string
  label: string
  summary: string
  location: string
  email: string
  phone: string
  linkedinUrl: string
  githubUrl: string
  websiteUrl: string
  skills: Array<{ name: string; level: string; keywords: string[] }>
  softSkills: string[]
  languages: Array<{ language: string; fluency: string }>
  certifications: string[]
  driving: string
  work: Array<{
    position: string
    name: string
    startDate: string
    endDate: string
    summary: string
    highlights: string[]
  }>
  education: Array<{
    institution: string
    studyType: string
    area: string
    startDate: string
    endDate: string
    note?: string
  }>
  projects: Array<{
    name: string
    description: string
    url?: string
  }>
  labels: {
    skills: string
    softSkills: string
    languages: string
    certifications: string
    driving: string
    work: string
    education: string
    projects: string
    present: string
    dateTo: string
    additionalInfo: string
  }
}

/**
 * Single-column, plain-text-flow layout. Multi-column resumes (sidebar +
 * main content) are a well-known ATS parsing hazard: many parsers read text
 * by vertical position rather than by column, which interleaves sidebar and
 * main content into garbled output. Everything here is drawn top-to-bottom
 * in one column so the underlying PDF text stream matches natural reading
 * order regardless of how a given parser extracts it.
 */

// A4: 210mm x 297mm
const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 18
const CONTENT_W = PAGE_W - MARGIN_X * 2
const BOTTOM = PAGE_H - 16

// All body text renders in pure black per ATS/reviewer-tool convention
// (color variation reads as "not fully black" to automated CV scorers).
// Color is reserved for the thin hairline rules between sections.
const C = {
  heading: [0, 0, 0] as [number, number, number],
  accent: [0, 0, 0] as [number, number, number],
  text: [0, 0, 0] as [number, number, number],
  muted: [0, 0, 0] as [number, number, number],
  border: [190, 190, 190] as [number, number, number],
  // Conventional hyperlink styling (blue + underline) — the one deliberate
  // exception to the all-black rule, since it's how a link is expected to
  // read visually, in print or on screen.
  link: [37, 99, 235] as [number, number, number],
}

const SECTION_GAP_BEFORE = 3.6
// Comfortable single-line leading for wrapped body text. A tighter factor
// (previously 0.42, chosen to force the document onto fewer pages) reads
// as cramped in a real PDF viewer even though it looks fine as raw
// extracted text — legibility takes priority over hitting a page count.
const LINE_HEIGHT_FACTOR = 0.5

function setText(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2])
}
function setDraw(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2])
}

class Cursor {
  y = 16

  constructor(private doc: jsPDF) {}

  ensure(needed: number) {
    if (this.y + needed > BOTTOM) {
      this.doc.addPage()
      this.y = 16
    }
  }

  gap(h: number) {
    this.y += h
  }
}

function drawSectionHeading(doc: jsPDF, cursor: Cursor, text: string) {
  cursor.gap(SECTION_GAP_BEFORE)
  // Reserve room for the heading plus at least the start of its first
  // entry, so a heading never lands as the last line on a page with all
  // of its content pushed to the next one (an orphaned heading).
  cursor.ensure(20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.heading)
  doc.text(text.toUpperCase(), MARGIN_X, cursor.y, { charSpace: 0.4 })
  setDraw(doc, C.border)
  doc.setLineWidth(0.4)
  doc.line(MARGIN_X, cursor.y + 1.6, MARGIN_X + CONTENT_W, cursor.y + 1.6)
  cursor.gap(6.5)
}

function drawParagraph(
  doc: jsPDF,
  cursor: Cursor,
  text: string,
  opts: { size?: number; color?: [number, number, number]; bold?: boolean; indent?: number } = {},
) {
  const size = opts.size ?? 9
  const color = opts.color ?? C.text
  const indent = opts.indent ?? 0
  doc.setFontSize(size)
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
  setText(doc, color)
  const lines = doc.splitTextToSize(text, CONTENT_W - indent) as string[]
  const lineH = size * LINE_HEIGHT_FACTOR
  const blockH = lines.length * lineH
  // Keep the whole paragraph together across a page break so no single
  // wrapped line is orphaned at the top of the next page.
  if (blockH <= BOTTOM - 16) cursor.ensure(blockH)
  for (const line of lines) {
    cursor.ensure(lineH)
    doc.text(line, MARGIN_X + indent, cursor.y)
    cursor.gap(lineH)
  }
}

function drawBullet(doc: jsPDF, cursor: Cursor, text: string) {
  const size = 8.6
  doc.setFontSize(size)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(text, CONTENT_W - 5) as string[]
  const lineH = size * LINE_HEIGHT_FACTOR
  const blockH = lines.length * lineH
  // Keep the whole bullet together across a page break so no single
  // wrapped line is orphaned at the top of the next page.
  if (blockH <= BOTTOM - 16) cursor.ensure(blockH)
  for (let i = 0; i < lines.length; i++) {
    cursor.ensure(lineH)
    setText(doc, C.accent)
    if (i === 0) doc.text('-', MARGIN_X + 1, cursor.y)
    setText(doc, C.muted)
    doc.text(lines[i], MARGIN_X + 4.5, cursor.y)
    cursor.gap(lineH)
  }
}

function drawHeader(doc: jsPDF, cursor: Cursor, data: CvPdfData) {
  doc.setFontSize(19)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.heading)
  doc.text(data.name, MARGIN_X, cursor.y)
  cursor.gap(7)

  doc.setFontSize(11.5)
  doc.setFont('helvetica', 'normal')
  setText(doc, C.accent)
  doc.text(data.label, MARGIN_X, cursor.y)
  cursor.gap(6.5)

  // Each contact part that has a real URL becomes an actual clickable link
  // annotation in the PDF (not just styled text), so LinkedIn/GitHub/site
  // work when opened in a PDF viewer. Only email and LinkedIn are rendered
  // in the blue link color — reviewer tooling treats any other colored text
  // as a "not fully black" violation, so GitHub/website links stay black
  // while remaining real, clickable URI annotations.
  const contactParts: Array<{ text: string; url?: string; colored?: boolean }> = [
    data.email && { text: data.email, url: `mailto:${data.email}`, colored: true },
    data.phone && { text: data.phone },
    data.location && { text: data.location },
    data.linkedinUrl && {
      text: `linkedin.com/in/${data.linkedinUrl.replace('https://www.linkedin.com/in/', '').replace(/\/$/, '')}`,
      url: data.linkedinUrl,
      colored: true,
    },
    data.githubUrl && {
      text: `github.com/${data.githubUrl.replace('https://github.com/', '')}`,
      url: data.githubUrl,
    },
    data.websiteUrl && {
      text: data.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      url: data.websiteUrl,
    },
  ].filter(Boolean) as Array<{ text: string; url?: string; colored?: boolean }>

  doc.setFontSize(8.6)
  doc.setFont('helvetica', 'normal')
  const SEP = '   |   '
  const sepW = doc.getTextWidth(SEP)
  let x = MARGIN_X
  for (let i = 0; i < contactParts.length; i++) {
    const part = contactParts[i]
    const partW = doc.getTextWidth(part.text)
    if (i > 0) {
      if (x + sepW + partW > MARGIN_X + CONTENT_W) {
        cursor.gap(3.6)
        x = MARGIN_X
      } else {
        setText(doc, C.muted)
        doc.text('|', x + (sepW - doc.getTextWidth('|')) / 2, cursor.y)
        x += sepW
      }
    }
    if (part.url && part.colored) {
      setText(doc, C.link)
      doc.textWithLink(part.text, x, cursor.y, { url: part.url })
      setDraw(doc, C.link)
      doc.setLineWidth(0.15)
      doc.line(x, cursor.y + 0.8, x + partW, cursor.y + 0.8)
    } else if (part.url) {
      setText(doc, C.muted)
      doc.textWithLink(part.text, x, cursor.y, { url: part.url })
    } else {
      setText(doc, C.muted)
      doc.text(part.text, x, cursor.y)
    }
    x += partW
  }
  cursor.gap(3.6)
  cursor.gap(2.5)

  setDraw(doc, C.border)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_X, cursor.y, MARGIN_X + CONTENT_W, cursor.y)
  cursor.gap(4)
}

function drawSkills(doc: jsPDF, cursor: Cursor, data: CvPdfData) {
  drawSectionHeading(doc, cursor, data.labels.skills)
  data.skills.forEach((skill, i) => {
    if (i > 0) cursor.gap(2)
    const line = `${skill.name} (${skill.level}): ${skill.keywords.join(', ')}`
    drawParagraph(doc, cursor, line, { size: 8.8 })
  })
}

function drawWork(doc: jsPDF, cursor: Cursor, data: CvPdfData) {
  drawSectionHeading(doc, cursor, data.labels.work)
  data.work.forEach((job, jobIndex) => {
    if (jobIndex > 0) cursor.gap(4.5)
    cursor.ensure(10)
    const dateText = `${job.startDate} ${data.labels.dateTo} ${job.endDate || data.labels.present}`
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.text)
    doc.text(job.position, MARGIN_X, cursor.y)
    doc.setFontSize(8.4)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.muted)
    doc.text(dateText, MARGIN_X + CONTENT_W, cursor.y, { align: 'right' })
    cursor.gap(4.4)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.accent)
    doc.text(job.name, MARGIN_X, cursor.y)
    cursor.gap(4)

    if (job.summary) {
      drawParagraph(doc, cursor, job.summary, { size: 8.6, color: C.muted })
    }
    if (job.highlights.length) {
      cursor.gap(1)
      for (const h of job.highlights) drawBullet(doc, cursor, h)
    }
  })
}

function drawEducation(doc: jsPDF, cursor: Cursor, data: CvPdfData) {
  drawSectionHeading(doc, cursor, data.labels.education)
  data.education.forEach((edu, eduIndex) => {
    if (eduIndex > 0) cursor.gap(4)
    cursor.ensure(10)
    const dateText = `${edu.startDate} ${data.labels.dateTo} ${edu.endDate || data.labels.present}`

    // Degree/qualification first (most relevant), then area, then institution,
    // then dates. Area always gets its own wrapped line below so a long
    // qualification name never overlaps the right-aligned date.
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.text)
    doc.text(edu.studyType, MARGIN_X, cursor.y)
    doc.setFontSize(8.4)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.muted)
    doc.text(dateText, MARGIN_X + CONTENT_W, cursor.y, { align: 'right' })
    cursor.gap(4.2)

    drawParagraph(doc, cursor, edu.area, { size: 8.6, color: C.text })
    drawParagraph(doc, cursor, edu.institution, { size: 8.6, color: C.accent })
    if (edu.note) {
      drawParagraph(doc, cursor, edu.note, { size: 8, color: C.muted })
    }
  })
}

function drawProjects(doc: jsPDF, cursor: Cursor, data: CvPdfData) {
  drawSectionHeading(doc, cursor, data.labels.projects)
  data.projects.forEach((proj, projIndex) => {
    if (projIndex > 0) cursor.gap(3)
    cursor.ensure(6)
    const label = proj.url ? `${proj.name} (${proj.url.replace(/^https?:\/\//, '').replace(/\/$/, '')})` : proj.name
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.text)
    doc.text(label, MARGIN_X, cursor.y)
    cursor.gap(3.2)
    drawParagraph(doc, cursor, proj.description, { size: 8.4, color: C.muted })
  })
}

function drawAdditionalInfo(doc: jsPDF, cursor: Cursor, data: CvPdfData) {
  drawSectionHeading(doc, cursor, data.labels.additionalInfo)

  const languagesLine = data.languages.map((l) => `${l.language} (${l.fluency})`).join(', ')
  drawParagraph(doc, cursor, `${data.labels.languages}: ${languagesLine}`, { size: 8.6 })
  cursor.gap(1.6)

  // Soft skills are woven into the opening summary as prose instead of
  // repeated here as a bare keyword list (per user request).

  if (data.certifications.length) {
    drawParagraph(
      doc,
      cursor,
      `${data.labels.certifications}: ${data.certifications.join(', ')}`,
      { size: 8.6 },
    )
    cursor.gap(1.6)
  }

  if (data.driving) {
    drawParagraph(doc, cursor, `${data.labels.driving}: ${data.driving}`, { size: 8.6 })
  }
}

/** Draws the full single-column, ATS-friendly A4 CV into the given jsPDF document. */
export function drawCvPdf(doc: jsPDF, data: CvPdfData) {
  const cursor = new Cursor(doc)
  drawHeader(doc, cursor, data)

  if (data.summary) {
    drawParagraph(doc, cursor, data.summary, { size: 9 })
  }

  drawSkills(doc, cursor, data)
  drawWork(doc, cursor, data)
  drawEducation(doc, cursor, data)
  drawProjects(doc, cursor, data)
  drawAdditionalInfo(doc, cursor, data)
}
