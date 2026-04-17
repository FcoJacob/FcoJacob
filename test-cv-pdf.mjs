// Standalone test script - generates the CV PDF without needing the dev server
import { jsPDF } from './node_modules/.pnpm/jspdf@4.2.1/node_modules/jspdf/dist/jspdf.node.js'
import { writeFileSync } from 'node:fs'

// A4: 210mm x 297mm
const PAGE_W = 210
const PAGE_H = 297
const SIDEBAR_W = 68
const MAIN_X = SIDEBAR_W + 8
const MAIN_W = PAGE_W - MAIN_X - 10
const SIDE_PAD = 6
const SIDE_CONTENT_W = SIDEBAR_W - SIDE_PAD * 2

const C = {
  sidebar: [30, 41, 59],
  sidebarText: [226, 232, 240],
  sidebarMuted: [148, 163, 184],
  white: [255, 255, 255],
  accent: [59, 130, 246],
  accentLight: [96, 165, 250],
  mainText: [30, 41, 59],
  mainMuted: [100, 116, 139],
  border: [226, 232, 240],
  chipBg: [51, 65, 85],
  chipText: [203, 213, 225],
  chipMainBg: [241, 245, 249],
  success: [34, 197, 94],
}

const data = {
  name: 'Jacob Sarmiento',
  label: 'Desarrollador de software - UI/UX',
  summary:
    'Me encanta la Informatica y las tecnologias, la mayor parte de mi tiempo libre la dedico a investigar nuevos medios y formas de hacer las cosas, me encanta innovar, me considero una persona muy creativa, alegre y con muy buena actitud. Me afana trabajar en proyectos que mejoren la vida de los demas. Me encanta las dinamicas de grupos y el trabajo en equipo.',
  location: 'Las Palmas, Canarias',
  email: 'fco.j.sarmientoperez@gmail.com',
  phone: '+34 696124038',
  linkedinUrl: 'https://www.linkedin.com/in/fcojacob/',
  githubUrl: 'https://github.com/FcoJacob',
  websiteUrl: 'https://jsarmiento.dev',
  skills: [
    {
      name: 'Frontend',
      level: 'Senior',
      keywords: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Vue.js', 'Nuxt'],
    },
    { name: 'Backend', level: 'Intermedio', keywords: ['Node.js', 'Firebase', 'Convex'] },
    { name: 'Diseño', level: 'Intermedio', keywords: ['Photoshop', 'Illustrator', 'UI/UX'] },
    {
      name: 'Herramientas',
      level: 'Avanzado',
      keywords: ['Git', 'GitHub', 'ClickUp', 'Jira', 'Office'],
    },
    { name: 'IA', level: 'Intermedio', keywords: ['Copilot', 'ChatGPT', 'Prompt Engineering'] },
    {
      name: 'Principios',
      level: 'Avanzado',
      keywords: ['SOLID', 'Clean Code', 'Responsive Design'],
    },
  ],
  softSkills: [
    'Creatividad',
    'Atencion a los detalles',
    'Trabajo en equipo',
    'Resolucion de problemas',
    'Comunicacion',
    'Capacidad de adaptacion',
    'Etica de trabajo',
  ],
  languages: [
    { language: 'Español', fluency: 'Nativo' },
    { language: 'Ingles', fluency: 'Elemental' },
  ],
  certifications: [
    'CSS Grid Layout',
    'Git y GitHub',
    'Fundamentos de TypeScript',
    'Desarrollo web online',
    'Introduccion al diseño',
  ],
  driving: 'Permiso B y C',
  work: [
    {
      position: 'Senior Frontend Developer',
      name: 'AIDA',
      startDate: 'Dic 2024',
      endDate: '',
      summary: 'Desarrollo de aplicaciones frontend con tecnologias modernas.',
      highlights: ['Promocion a Senior Frontend Developer'],
    },
    {
      position: 'Frontend Developer',
      name: 'AIDA',
      startDate: 'Mar 2023',
      endDate: 'Dic 2024',
      summary: 'Desarrollo de actividades de front-end con Vue, JavaScript, HTML y CSS.',
      highlights: ['Desarrollo de interfaces de usuario', 'Integracion con APIs'],
    },
    {
      position: 'Desarrollador de aplicaciones',
      name: 'Progrentis',
      startDate: 'Jul 2020',
      endDate: 'Ene 2024',
      summary: 'Desarrollo de aplicaciones frontend con Vue, JavaScript, HTML y CSS.',
      highlights: ['Desarrollo frontend', 'Trabajo remoto internacional'],
    },
    {
      position: 'Desarrollador de paginas web autonomo',
      name: 'Profesional independiente',
      startDate: 'Jun 2017',
      endDate: '',
      summary: 'Desarrollo web freelance para multiples clientes y proyectos.',
      highlights: ['Multiples proyectos web', 'Clientes variados', 'Digitalizacion de negocios'],
    },
    {
      position: 'Especialista en mantenimiento de aeronaves',
      name: 'Ejercito del Aire',
      startDate: 'Dic 2007',
      endDate: '',
      summary: 'Diversas tareas de mantenimiento en cazas de combate.',
      highlights: ['Mantenimiento de aeronaves militares'],
    },
    {
      position: 'Marinero - Especialista Maniobra y Navegacion',
      name: 'Armada Española',
      startDate: 'Dic 2004',
      endDate: 'Dic 2006',
      summary:
        'Mas de 260 horas de mar, campañas de control de pesca, defensa de aguas nacionales.',
      highlights: ['Control de pesca', 'Defensa de aguas nacionales'],
    },
    {
      position: 'Militar',
      name: 'Ejercito de Tierra',
      startDate: 'Dic 2000',
      endDate: 'Ago 2004',
      summary: 'Operaciones de transmisiones y ofimatica. Medalla al merito aeronautico.',
      highlights: ['Transmisiones y ofimatica', 'Medalla al merito aeronautico'],
    },
  ],
  education: [
    {
      institution: 'Universitat Oberta de Catalunya',
      studyType: 'Grado en Ingenieria',
      area: 'Informatica, comunicaciones y servicios de asistencia',
      startDate: 'Feb 2022',
      endDate: '',
      note: 'En curso - 140 creditos superados',
    },
    {
      institution: 'CIFP Villa de Agüimes',
      studyType: 'Tecnico',
      area: 'Desarrollo de aplicaciones Web',
      startDate: '2016',
      endDate: '2018',
    },
    {
      institution: 'Academia Telde',
      studyType: 'Curso',
      area: 'Mantenimiento y Reparacion de Ordenadores',
      startDate: '2005',
      endDate: '2006',
    },
    {
      institution: 'Colegio El Batan',
      studyType: 'E.S.O.',
      area: 'Educacion Secundaria Obligatoria',
      startDate: '1987',
      endDate: '1998',
    },
  ],
  projects: [
    {
      name: 'masquehuellas.es',
      description: 'Digitalizacion web de la clinica veterinaria +QHuellas.',
    },
    { name: 'foroebc.org', description: 'Promover nuevos ambitos y competencias profesionales.' },
    {
      name: 'businessevolver.net',
      description: 'Alianzas para un futuro en desarrollo sostenible (ODS) y digitalizacion.',
    },
    { name: 'lajairadeana.com', description: 'Web para la granja escuela La Jaira de Ana.' },
    { name: 'doelhierro.es', description: 'Web de la Denominacion de Origen de Vinos del Hierro.' },
    {
      name: 'JamApp',
      description: 'Proyecto fin de estudios premiado con apoyo de la EOI y el Cabildo.',
    },
  ],
  labels: {
    skills: 'Habilidades',
    softSkills: 'Habilidades Blandas',
    languages: 'Idiomas',
    certifications: 'Certificaciones',
    driving: 'Carnet de Conducir',
    work: 'Experiencia Laboral',
    education: 'Educacion',
    projects: 'Proyectos',
    present: 'Actualmente',
  },
}

// --- Copy of composable logic below ---
function setFill(d, c) {
  d.setFillColor(c[0], c[1], c[2])
}
function setText(d, c) {
  d.setTextColor(c[0], c[1], c[2])
}
function setDraw(d, c) {
  d.setDrawColor(c[0], c[1], c[2])
}

function drawChips(d, items, x, y, maxW, opts) {
  d.setFontSize(opts.fontSize)
  d.setFont('helvetica', 'normal')
  const padX = 1.8,
    gap = 1.5
  const chipH = opts.fontSize * 0.352778 + 1.6
  const rowGap = 1
  let cx = x,
    cy = y
  for (const item of items) {
    const tw = d.getTextWidth(item)
    const cw = tw + padX * 2
    if (cx + cw > x + maxW && cx > x) {
      cx = x
      cy += chipH + rowGap
    }
    setFill(d, opts.bg)
    d.roundedRect(cx, cy, cw, chipH, 0.8, 0.8, 'F')
    setText(d, opts.text)
    d.text(item, cx + padX, cy + chipH - 1.2, { baseline: 'alphabetic' })
    cx += cw + gap
  }
  return cy + chipH
}

function drawSidebarHeading(d, t, y) {
  d.setFontSize(8)
  d.setFont('helvetica', 'bold')
  setText(d, C.sidebarMuted)
  d.text(t.toUpperCase(), SIDE_PAD, y, { charSpace: 0.3 })
  return y + 3.8
}
function drawSidebarDivider(d, y) {
  setDraw(d, C.chipBg)
  d.setLineWidth(0.2)
  d.line(SIDE_PAD, y, SIDEBAR_W - SIDE_PAD, y)
  return y + 4
}

function drawSidebar(d, data) {
  setFill(d, C.sidebar)
  d.rect(0, 0, SIDEBAR_W, PAGE_H, 'F')

  const cx = SIDEBAR_W / 2,
    cy = 20
  setFill(d, C.accent)
  d.circle(cx, cy, 10, 'F')
  const initials = data.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  d.setFontSize(14)
  d.setFont('helvetica', 'bold')
  setText(d, C.white)
  d.text(initials, cx, cy + 1.6, { align: 'center' })

  d.setFontSize(13)
  d.setFont('helvetica', 'bold')
  setText(d, C.white)
  const nameLines = d.splitTextToSize(data.name, SIDE_CONTENT_W)
  let y = cy + 14
  for (const line of nameLines) {
    d.text(line, cx, y, { align: 'center' })
    y += 4.8
  }

  d.setFontSize(8)
  d.setFont('helvetica', 'normal')
  setText(d, C.accentLight)
  const labelLines = d.splitTextToSize(data.label, SIDE_CONTENT_W)
  for (const line of labelLines) {
    d.text(line, cx, y, { align: 'center' })
    y += 3.2
  }
  y += 3

  d.setFontSize(7.5)
  const contact = [
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
    setText(d, C.sidebarMuted)
    d.setFont('helvetica', 'bold')
    d.text(icon, SIDE_PAD, y)
    setText(d, color)
    d.setFont('helvetica', 'normal')
    const lines = d.splitTextToSize(text, SIDE_CONTENT_W - 5)
    for (let i = 0; i < lines.length; i++) d.text(lines[i], SIDE_PAD + 4, y + i * 3)
    y += Math.max(3, lines.length * 3) + 0.5
  }
  y += 2
  y = drawSidebarDivider(d, y)

  y = drawSidebarHeading(d, data.labels.skills, y)
  for (const s of data.skills) {
    y += 1
    d.setFontSize(8.5)
    d.setFont('helvetica', 'bold')
    setText(d, C.sidebarText)
    d.text(s.name, SIDE_PAD, y)
    d.setFontSize(6.5)
    d.setFont('helvetica', 'bold')
    const lw = d.getTextWidth(s.level) + 3.6
    const lx = SIDEBAR_W - SIDE_PAD - lw
    setFill(d, s.level === 'Senior' ? C.success : C.accent)
    d.roundedRect(lx, y - 2.8, lw, 3.8, 1.9, 1.9, 'F')
    setText(d, C.white)
    d.text(s.level, lx + lw / 2, y - 0.2, { align: 'center' })
    y += 2.5
    if (s.keywords.length)
      y = drawChips(d, s.keywords, SIDE_PAD, y, SIDE_CONTENT_W, {
        bg: C.chipBg,
        text: C.chipText,
        fontSize: 6.5,
      })
    y += 3
  }
  y += 1
  y = drawSidebarDivider(d, y)

  y = drawSidebarHeading(d, data.labels.softSkills, y)
  y = drawChips(d, data.softSkills, SIDE_PAD, y, SIDE_CONTENT_W, {
    bg: C.chipBg,
    text: C.chipText,
    fontSize: 6.5,
  })
  y += 2.5
  y = drawSidebarDivider(d, y)

  y = drawSidebarHeading(d, data.labels.languages, y)
  for (const l of data.languages) {
    d.setFontSize(8)
    d.setFont('helvetica', 'normal')
    setText(d, C.sidebarText)
    d.text(l.language, SIDE_PAD, y)
    setText(d, C.sidebarMuted)
    d.text(l.fluency, SIDEBAR_W - SIDE_PAD, y, { align: 'right' })
    y += 3.4
  }
  y += 1
  y = drawSidebarDivider(d, y)

  y = drawSidebarHeading(d, data.labels.certifications, y)
  d.setFontSize(7.5)
  d.setFont('helvetica', 'normal')
  for (const c of data.certifications) {
    setText(d, C.accentLight)
    d.text('*', SIDE_PAD, y)
    setText(d, C.sidebarMuted)
    const lines = d.splitTextToSize(c, SIDE_CONTENT_W - 4)
    for (let i = 0; i < lines.length; i++) d.text(lines[i], SIDE_PAD + 3.5, y + i * 3)
    y += Math.max(3, lines.length * 3) + 0.3
  }
  y += 1
  y = drawSidebarDivider(d, y)

  y = drawSidebarHeading(d, data.labels.driving, y)
  d.setFontSize(8)
  d.setFont('helvetica', 'normal')
  setText(d, C.sidebarText)
  d.text(data.driving, SIDE_PAD, y)
}

function ensureSpace(d, cy, needed, state) {
  const bottom = PAGE_H - 15
  if (cy + needed <= bottom) {
    return {
      y: cy,
      x: state.hasSidebar ? MAIN_X : 15,
      width: state.hasSidebar ? MAIN_W : PAGE_W - 30,
      paged: false,
    }
  }
  d.addPage()
  state.hasSidebar = false
  return { y: 18, x: 15, width: PAGE_W - 30, paged: true }
}

function drawMainHeading(d, t, y, x, w) {
  d.setFontSize(10.5)
  d.setFont('helvetica', 'bold')
  setText(d, C.mainMuted)
  d.text(t.toUpperCase(), x, y, { charSpace: 0.5 })
  setDraw(d, C.border)
  d.setLineWidth(0.3)
  d.line(x, y + 1.8, x + w, y + 1.8)
  return y + 7
}

function drawProjectCard(d, p, x, y, w, descLines) {
  const h = 5 + descLines.length * 3 + 3
  setDraw(d, C.border)
  setFill(d, [250, 251, 253])
  d.setLineWidth(0.2)
  d.roundedRect(x, y, w, h, 1.2, 1.2, 'FD')
  d.setFontSize(8.5)
  d.setFont('helvetica', 'bold')
  setText(d, C.mainText)
  d.text(p.name, x + 2.5, y + 3.8)
  d.setFontSize(7.3)
  d.setFont('helvetica', 'normal')
  setText(d, C.mainMuted)
  for (let i = 0; i < descLines.length; i++) d.text(descLines[i], x + 2.5, y + 7 + i * 3)
}

function drawMain(d, data) {
  const state = { hasSidebar: true }
  let y = 16,
    x = MAIN_X,
    width = MAIN_W

  d.setFontSize(8.5)
  d.setFont('helvetica', 'normal')
  setText(d, C.mainMuted)
  const sum = d.splitTextToSize(data.summary, width)
  for (const line of sum) {
    const s = ensureSpace(d, y, 3.8, state)
    y = s.y
    x = s.x
    width = s.width
    d.text(line, x, y)
    y += 3.8
  }
  y += 4

  {
    const s = ensureSpace(d, y, 10, state)
    y = s.y
    x = s.x
    width = s.width
    y = drawMainHeading(d, data.labels.work, y, x, width)
  }
  for (const job of data.work) {
    const slines = d.splitTextToSize(job.summary, width - 5)
    const s = ensureSpace(d, y, 12, state)
    y = s.y
    x = s.x
    width = s.width
    setFill(d, C.accent)
    d.circle(x + 1.2, y + 1.2, 1.1, 'F')

    const posX = x + 5
    const dt = `${job.startDate} - ${job.endDate || data.labels.present}`
    d.setFontSize(7)
    d.setFont('helvetica', 'normal')
    const dw = d.getTextWidth(dt) + 4
    const dx = x + width - dw
    d.setFontSize(10)
    d.setFont('helvetica', 'bold')
    setText(d, C.mainText)
    d.text(job.position, posX, y + 2)
    d.setFontSize(7)
    d.setFont('helvetica', 'normal')
    setFill(d, C.chipMainBg)
    d.roundedRect(dx, y - 1.2, dw, 4.2, 2.1, 2.1, 'F')
    setText(d, C.mainMuted)
    d.text(dt, dx + dw / 2, y + 1.5, { align: 'center' })
    y += 5.2
    d.setFontSize(8.5)
    d.setFont('helvetica', 'bold')
    setText(d, C.accent)
    d.text(job.name, posX, y)
    y += 4
    d.setFontSize(8)
    d.setFont('helvetica', 'normal')
    setText(d, C.mainMuted)
    for (const line of slines) {
      const sp = ensureSpace(d, y, 3.3, state)
      y = sp.y
      x = sp.x
      width = sp.width
      d.text(line, x + 5, y)
      y += 3.3
    }
    if (job.highlights.length) {
      y += 0.5
      d.setFontSize(7.8)
      for (const h of job.highlights) {
        const hl = d.splitTextToSize(h, width - 10)
        const sp = ensureSpace(d, y, hl.length * 3.3, state)
        y = sp.y
        x = sp.x
        width = sp.width
        setText(d, C.accent)
        d.setFont('helvetica', 'bold')
        d.text('>', x + 5, y)
        setText(d, C.mainMuted)
        d.setFont('helvetica', 'normal')
        for (let i = 0; i < hl.length; i++) d.text(hl[i], x + 8, y + i * 3.3)
        y += Math.max(3.3, hl.length * 3.3)
      }
    }
    y += 4
  }

  {
    const s = ensureSpace(d, y, 12, state)
    y = s.y
    x = s.x
    width = s.width
    y = drawMainHeading(d, data.labels.education, y, x, width)
  }
  for (const e of data.education) {
    const s = ensureSpace(d, y, 14, state)
    y = s.y
    x = s.x
    width = s.width
    setFill(d, C.border)
    d.circle(x + 1.2, y + 1.2, 1.1, 'F')
    d.setFontSize(9.5)
    d.setFont('helvetica', 'bold')
    setText(d, C.mainText)
    d.text(e.institution, x + 5, y + 2)
    y += 5.5
    d.setFontSize(8)
    d.setFont('helvetica', 'normal')
    setText(d, C.accent)
    const el = d.splitTextToSize(`${e.studyType} - ${e.area}`, width - 5)
    for (const line of el) {
      d.text(line, x + 5, y)
      y += 3.4
    }
    d.setFontSize(7.5)
    setText(d, C.mainMuted)
    d.text(`${e.startDate} - ${e.endDate || data.labels.present}`, x + 5, y)
    y += 3.4
    if (e.note) {
      d.setFont('helvetica', 'italic')
      const nl = d.splitTextToSize(e.note, width - 5)
      for (const line of nl) {
        d.text(line, x + 5, y)
        y += 3
      }
      d.setFont('helvetica', 'normal')
    }
    y += 3
  }

  {
    const s = ensureSpace(d, y, 20, state)
    y = s.y
    x = s.x
    width = s.width
    y = drawMainHeading(d, data.labels.projects, y, x, width)
  }
  const colGap = 4
  let col = 0,
    rowStartY = y,
    maxRowY = y
  for (const p of data.projects) {
    const colW = (width - colGap) / 2
    const dl = d.splitTextToSize(p.description, colW - 4)
    const h = 5 + dl.length * 3 + 3
    if (col === 0) {
      const s = ensureSpace(d, y, h, state)
      if (s.paged) {
        y = s.y
        x = s.x
        width = s.width
      }
      rowStartY = y
      maxRowY = y
    }
    const cw = (width - colGap) / 2
    const cdl = d.splitTextToSize(p.description, cw - 4)
    const colX = x + col * (cw + colGap)
    drawProjectCard(d, p, colX, rowStartY, cw, cdl)
    maxRowY = Math.max(maxRowY, rowStartY + 5 + cdl.length * 3 + 3)
    if (col === 1) {
      y = maxRowY + 2
      col = 0
    } else col = 1
  }
}

const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
drawSidebar(doc, data)
drawMain(doc, data)
const buf = doc.output('arraybuffer')
writeFileSync('/tmp/test-cv.pdf', Buffer.from(buf))
console.log('Written /tmp/test-cv.pdf, pages:', doc.getNumberOfPages())
