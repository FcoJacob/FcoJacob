import type { jsPDF } from 'jspdf'

interface CvPdfData {
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
  }
}

// A4: 210mm x 297mm
const PAGE_W = 210
const PAGE_H = 297
const SIDEBAR_W = 68
const MAIN_X = SIDEBAR_W + 8
const MAIN_W = PAGE_W - MAIN_X - 10
const SIDE_PAD = 6
const SIDE_CONTENT_W = SIDEBAR_W - SIDE_PAD * 2

// RGB colors
const C = {
  sidebar: [30, 41, 59] as [number, number, number],
  sidebarText: [226, 232, 240] as [number, number, number],
  sidebarMuted: [148, 163, 184] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
  accentLight: [96, 165, 250] as [number, number, number],
  mainText: [30, 41, 59] as [number, number, number],
  mainMuted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  chipBg: [51, 65, 85] as [number, number, number],
  chipText: [203, 213, 225] as [number, number, number],
  chipMainBg: [241, 245, 249] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
}

function setFill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2])
}
function setText(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2])
}
function setDraw(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2])
}

function drawSidebarBackground(doc: jsPDF) {
  setFill(doc, C.sidebar)
  doc.rect(0, 0, SIDEBAR_W, PAGE_H, 'F')
}

function drawChips(
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  maxW: number,
  opts: { bg: [number, number, number]; text: [number, number, number]; fontSize: number },
): number {
  doc.setFontSize(opts.fontSize)
  doc.setFont('helvetica', 'normal')
  const padX = 1.8
  const gap = 1.5
  const chipH = opts.fontSize * 0.352778 + 1.6
  const rowGap = 1
  let cursorX = x
  let cursorY = y
  for (const item of items) {
    const textW = doc.getTextWidth(item)
    const chipW = textW + padX * 2
    if (cursorX + chipW > x + maxW && cursorX > x) {
      cursorX = x
      cursorY += chipH + rowGap
    }
    setFill(doc, opts.bg)
    doc.roundedRect(cursorX, cursorY, chipW, chipH, 0.8, 0.8, 'F')
    setText(doc, opts.text)
    doc.text(item, cursorX + padX, cursorY + chipH - 1.2, { baseline: 'alphabetic' })
    cursorX += chipW + gap
  }
  return cursorY + chipH
}

function drawSidebarHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.sidebarMuted)
  doc.text(text.toUpperCase(), SIDE_PAD, y, { charSpace: 0.3 })
  return y + 3.8
}

function drawSidebarDivider(doc: jsPDF, y: number): number {
  setDraw(doc, C.chipBg)
  doc.setLineWidth(0.2)
  doc.line(SIDE_PAD, y, SIDEBAR_W - SIDE_PAD, y)
  return y + 4
}

function drawSidebar(doc: jsPDF, data: CvPdfData) {
  drawSidebarBackground(doc)

  // Avatar circle
  const avatarCx = SIDEBAR_W / 2
  const avatarCy = 20
  setFill(doc, C.accent)
  doc.circle(avatarCx, avatarCy, 10, 'F')
  const initials = data.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.white)
  doc.text(initials, avatarCx, avatarCy + 1.6, { align: 'center' })

  // Name
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.white)
  const nameLines = doc.splitTextToSize(data.name, SIDE_CONTENT_W) as string[]
  let y = avatarCy + 14
  for (const line of nameLines) {
    doc.text(line, avatarCx, y, { align: 'center' })
    y += 4.8
  }

  // Label
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setText(doc, C.accentLight)
  const labelLines = doc.splitTextToSize(data.label, SIDE_CONTENT_W) as string[]
  for (const line of labelLines) {
    doc.text(line, avatarCx, y, { align: 'center' })
    y += 3.2
  }
  y += 3

  // Contact block
  doc.setFontSize(7.5)
  const contact: Array<[string, string, [number, number, number]]> = [
    ['@', data.email, C.sidebarMuted],
    ['T', data.phone, C.sidebarMuted],
    ['#', data.location, C.sidebarMuted],
    [
      'in',
      data.linkedinUrl.replace('https://www.linkedin.com/in/', '').replace(/\/$/, ''),
      C.accentLight,
    ],
    ['gh', data.githubUrl.replace('https://github.com/', ''), C.accentLight],
    ['W', data.websiteUrl.replace(/^https?:\/\//, ''), C.accentLight],
  ]
  for (const [icon, text, color] of contact) {
    if (!text) continue
    setText(doc, C.sidebarMuted)
    doc.setFont('helvetica', 'bold')
    doc.text(icon, SIDE_PAD, y)
    setText(doc, color)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, SIDE_CONTENT_W - 5) as string[]
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], SIDE_PAD + 4, y + i * 3)
    }
    y += Math.max(3, lines.length * 3) + 0.5
  }
  y += 2
  y = drawSidebarDivider(doc, y)

  // Skills
  y = drawSidebarHeading(doc, data.labels.skills, y)
  for (const skill of data.skills) {
    // Reserve vertical room for the level chip drawn above the baseline
    y += 1
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.sidebarText)
    doc.text(skill.name, SIDE_PAD, y)

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    const lvlW = doc.getTextWidth(skill.level) + 3.6
    const lvlX = SIDEBAR_W - SIDE_PAD - lvlW
    setFill(doc, skill.level === 'Senior' ? C.success : C.accent)
    doc.roundedRect(lvlX, y - 2.8, lvlW, 3.8, 1.9, 1.9, 'F')
    setText(doc, C.white)
    doc.text(skill.level, lvlX + lvlW / 2, y - 0.2, { align: 'center' })
    y += 2.5

    if (skill.keywords.length) {
      y = drawChips(doc, skill.keywords, SIDE_PAD, y, SIDE_CONTENT_W, {
        bg: C.chipBg,
        text: C.chipText,
        fontSize: 6.5,
      })
    }
    y += 3
  }
  y += 1
  y = drawSidebarDivider(doc, y)

  // Soft skills
  y = drawSidebarHeading(doc, data.labels.softSkills, y)
  y = drawChips(doc, data.softSkills, SIDE_PAD, y, SIDE_CONTENT_W, {
    bg: C.chipBg,
    text: C.chipText,
    fontSize: 6.5,
  })
  y += 2.5
  y = drawSidebarDivider(doc, y)

  // Languages
  y = drawSidebarHeading(doc, data.labels.languages, y)
  for (const lang of data.languages) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setText(doc, C.sidebarText)
    doc.text(lang.language, SIDE_PAD, y)
    setText(doc, C.sidebarMuted)
    doc.text(lang.fluency, SIDEBAR_W - SIDE_PAD, y, { align: 'right' })
    y += 3.4
  }
  y += 1
  y = drawSidebarDivider(doc, y)

  // Certifications
  y = drawSidebarHeading(doc, data.labels.certifications, y)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  for (const cert of data.certifications) {
    setText(doc, C.accentLight)
    doc.text('*', SIDE_PAD, y)
    setText(doc, C.sidebarMuted)
    const lines = doc.splitTextToSize(cert, SIDE_CONTENT_W - 4) as string[]
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], SIDE_PAD + 3.5, y + i * 3)
    }
    y += Math.max(3, lines.length * 3) + 0.3
  }
  y += 1
  y = drawSidebarDivider(doc, y)

  // Driving
  y = drawSidebarHeading(doc, data.labels.driving, y)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setText(doc, C.sidebarText)
  doc.text(data.driving, SIDE_PAD, y)
}

function ensureSpace(
  doc: jsPDF,
  currentY: number,
  needed: number,
  state: { hasSidebar: boolean },
): { y: number; x: number; width: number; paged: boolean } {
  const bottom = PAGE_H - 15
  if (currentY + needed <= bottom) {
    return {
      y: currentY,
      x: state.hasSidebar ? MAIN_X : 15,
      width: state.hasSidebar ? MAIN_W : PAGE_W - 30,
      paged: false,
    }
  }
  doc.addPage()
  state.hasSidebar = false
  return { y: 18, x: 15, width: PAGE_W - 30, paged: true }
}

function drawMainHeading(doc: jsPDF, text: string, y: number, x: number, width: number): number {
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.mainMuted)
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.5 })
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)
  doc.line(x, y + 1.8, x + width, y + 1.8)
  return y + 7
}

function drawMainContent(doc: jsPDF, data: CvPdfData) {
  const state = { hasSidebar: true }
  let y = 16
  let x = MAIN_X
  let width = MAIN_W

  // Summary
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  setText(doc, C.mainMuted)
  const summaryLines = doc.splitTextToSize(data.summary, width) as string[]
  for (const line of summaryLines) {
    const space = ensureSpace(doc, y, 3.8, state)
    y = space.y
    x = space.x
    width = space.width
    doc.text(line, x, y)
    y += 3.8
  }
  y += 4

  // Work
  {
    const space = ensureSpace(doc, y, 10, state)
    y = space.y
    x = space.x
    width = space.width
    y = drawMainHeading(doc, data.labels.work, y, x, width)
  }

  for (const job of data.work) {
    const summaryLinesArr = doc.splitTextToSize(job.summary, width - 5) as string[]
    const minNeeded = 12
    const space = ensureSpace(doc, y, minNeeded, state)
    y = space.y
    x = space.x
    width = space.width

    // Timeline dot
    setFill(doc, C.accent)
    doc.circle(x + 1.2, y + 1.2, 1.1, 'F')

    const posX = x + 5
    const dateText = `${job.startDate} — ${job.endDate || data.labels.present}`
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const dateW = doc.getTextWidth(dateText) + 4
    const dateX = x + width - dateW

    // Position
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.mainText)
    doc.text(job.position, posX, y + 2)

    // Date pill
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    setFill(doc, C.chipMainBg)
    doc.roundedRect(dateX, y - 1.2, dateW, 4.2, 2.1, 2.1, 'F')
    setText(doc, C.mainMuted)
    doc.text(dateText, dateX + dateW / 2, y + 1.5, { align: 'center' })

    y += 5.2
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.accent)
    doc.text(job.name, posX, y)
    y += 4

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setText(doc, C.mainMuted)
    for (const line of summaryLinesArr) {
      const s = ensureSpace(doc, y, 3.3, state)
      y = s.y
      x = s.x
      width = s.width
      doc.text(line, x + 5, y)
      y += 3.3
    }

    if (job.highlights.length) {
      y += 0.5
      doc.setFontSize(7.8)
      for (const h of job.highlights) {
        const hLines = doc.splitTextToSize(h, width - 10) as string[]
        const s = ensureSpace(doc, y, hLines.length * 3.3, state)
        y = s.y
        x = s.x
        width = s.width
        setText(doc, C.accent)
        doc.setFont('helvetica', 'bold')
        doc.text('>', x + 5, y)
        setText(doc, C.mainMuted)
        doc.setFont('helvetica', 'normal')
        for (let i = 0; i < hLines.length; i++) {
          doc.text(hLines[i], x + 8, y + i * 3.3)
        }
        y += Math.max(3.3, hLines.length * 3.3)
      }
    }
    y += 4
  }

  // Education
  {
    const space = ensureSpace(doc, y, 12, state)
    y = space.y
    x = space.x
    width = space.width
    y = drawMainHeading(doc, data.labels.education, y, x, width)
  }

  for (const edu of data.education) {
    const space = ensureSpace(doc, y, 14, state)
    y = space.y
    x = space.x
    width = space.width

    setFill(doc, C.border)
    doc.circle(x + 1.2, y + 1.2, 1.1, 'F')

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    setText(doc, C.mainText)
    doc.text(edu.institution, x + 5, y + 2)
    y += 5.5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setText(doc, C.accent)
    const eduLines = doc.splitTextToSize(`${edu.studyType} — ${edu.area}`, width - 5) as string[]
    for (const line of eduLines) {
      doc.text(line, x + 5, y)
      y += 3.4
    }

    doc.setFontSize(7.5)
    setText(doc, C.mainMuted)
    doc.text(`${edu.startDate} — ${edu.endDate || data.labels.present}`, x + 5, y)
    y += 3.4

    if (edu.note) {
      doc.setFont('helvetica', 'italic')
      const noteLines = doc.splitTextToSize(edu.note, width - 5) as string[]
      for (const line of noteLines) {
        doc.text(line, x + 5, y)
        y += 3
      }
      doc.setFont('helvetica', 'normal')
    }
    y += 3
  }

  // Projects
  {
    const space = ensureSpace(doc, y, 20, state)
    y = space.y
    x = space.x
    width = space.width
    y = drawMainHeading(doc, data.labels.projects, y, x, width)
  }

  const colGap = 4
  let col = 0
  let rowStartY = y
  let maxRowY = y

  for (const proj of data.projects) {
    const colW = (width - colGap) / 2
    const descLines = doc.splitTextToSize(proj.description, colW - 4) as string[]
    const itemH = 5 + descLines.length * 3 + 3

    if (col === 0) {
      const space = ensureSpace(doc, y, itemH, state)
      if (space.paged) {
        y = space.y
        x = space.x
        width = space.width
      }
      rowStartY = y
      maxRowY = y
    }

    const currentColW = (width - colGap) / 2
    const currentDescLines = doc.splitTextToSize(proj.description, currentColW - 4) as string[]
    const colX = x + col * (currentColW + colGap)
    drawProjectCard(doc, proj, colX, rowStartY, currentColW, currentDescLines)
    const h = 5 + currentDescLines.length * 3 + 3
    maxRowY = Math.max(maxRowY, rowStartY + h)

    if (col === 1) {
      y = maxRowY + 2
      col = 0
    } else {
      col = 1
    }
  }
}

function drawProjectCard(
  doc: jsPDF,
  proj: { name: string; description: string },
  x: number,
  y: number,
  w: number,
  descLines: string[],
) {
  const h = 5 + descLines.length * 3 + 3
  setDraw(doc, C.border)
  setFill(doc, [250, 251, 253])
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 1.2, 1.2, 'FD')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  setText(doc, C.mainText)
  doc.text(proj.name, x + 2.5, y + 3.8)

  doc.setFontSize(7.3)
  doc.setFont('helvetica', 'normal')
  setText(doc, C.mainMuted)
  for (let i = 0; i < descLines.length; i++) {
    doc.text(descLines[i], x + 2.5, y + 7 + i * 3)
  }
}

export function useGeneratePdf() {
  const isGenerating = ref(false)

  async function generate(data: CvPdfData, filename = 'cv.pdf') {
    if (isGenerating.value) return
    isGenerating.value = true

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

      drawSidebar(doc, data)
      drawMainContent(doc, data)

      doc.save(filename)
    } finally {
      isGenerating.value = false
    }
  }

  return { generate, isGenerating }
}

export type { CvPdfData }
