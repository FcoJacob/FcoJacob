/// <reference types="node" />
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'

const CONVEX_URL = process.env.CONVEX_URL
if (!CONVEX_URL) {
  console.error('Set CONVEX_URL environment variable')
  process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

const cvData = {
  basics: {
    name: 'Jacob Sarmiento',
    label: 'Desarrollador de software - UI/UX',
    image: '',
    email: 'fco.j.sarmientoperez@gmail.com',
    phone: '+34 696124038',
    url: 'https://jsarmiento.dev/',
    summary:
      'Me encanta la Informática y las tecnologías, la mayor parte de mi tiempo libre la dedico a investigar nuevos medios y formas de hacer las cosas, me encanta innovar, me considero una persona muy creativa, alegre y con muy buena actitud. Me afana trabajar en proyectos que mejoren la vida de los demás. Me encanta las dinámicas de grupos y el trabajo en equipo.',
    location: {
      address: 'Calle Del Canario, 34',
      postalCode: '35269',
      city: 'Las Palmas',
      countryCode: 'ES',
      region: 'Canarias',
    },
    profiles: [
      {
        network: 'LinkedIn',
        username: 'fcojacob',
        url: 'https://www.linkedin.com/in/fcojacob/',
      },
      {
        network: 'GitHub',
        username: 'FcoJacob',
        url: 'https://github.com/FcoJacob',
      },
    ],
  },
  work: [
    {
      name: 'AIDA',
      position: 'Senior Frontend Developer',
      startDate: '2024-12',
      endDate: '2026-08',
      summary:
        'Desarrollo de aplicaciones frontend con tecnologías modernas.',
      highlights: [
        'Promovido a Senior Frontend Developer, asumiendo ownership técnico del frontend de ventas y de la librería de componentes compartida',
        '793 commits (+324.047 / −159.550 líneas) en los productos clave de ventas (sales-web, sales-shared, sales-specifications, importer-sales, SalesBackOffice)',
        'En mi etapa en AIDA (2023–2026): cerré 258 de 266 incidencias Jira asignadas y reporté 90 propias, combinando ejecución técnica con detección proactiva de mejoras',
        'Documenté el conocimiento del equipo con 56 páginas creadas y contribución en 132 más en Confluence',
      ],
    },
    {
      name: 'AIDA',
      position: 'Frontend Developer',
      startDate: '2023-03',
      endDate: '2024-12',
      summary:
        'Desarrollo de actividades de front-end con Vue, JavaScript, HTML y CSS.',
      highlights: [
        'Desarrollo de interfaces de usuario',
        'Integración con APIs',
      ],
    },
    {
      name: 'Progrentis',
      position: 'Desarrollador de aplicaciones - Frontend',
      url: 'https://progrentis.com',
      startDate: '2020-07',
      endDate: '2024-01',
      summary:
        'Desarrollo de actividades de front-end con Vue, JavaScript, HTML y CSS. Entre otras de menos relevancia.',
      highlights: [
        'Desarrollo frontend con Vue.js',
        'Trabajo remoto internacional (Guatemala)',
      ],
    },
    {
      name: 'Profesional independiente',
      position: 'Desarrollador de páginas web autónomo',
      startDate: '2017-06',
      endDate: null,
      summary:
        'Desarrollo de proyectos web para distintas empresas y clientes.',
      highlights: [
        'masquehuellas.es – Digitalización web de la clínica veterinaria +QHuellas',
        'foroebc.org – Promover nuevos ámbitos y competencias profesionales',
        'businessevolver.net – Alianzas para el desarrollo sostenible (ODS)',
        'lajairadeana.com – Web para la granja escuela La Jaira de Ana',
        'doelhierro.es – Web de la Denominación de Origen de Vinos del Hierro',
        'JamApp – Premio del centro, apoyo empresarial de la EOI y del Cabildo de Gran Canaria',
      ],
    },
    {
      name: 'Ejército del Aire',
      position: 'Especialista en mantenimiento de aeronaves',
      startDate: '2007-12',
      endDate: '2022-01',
      summary:
        'Realizo diversas tareas de mantenimiento en cazas de combate.',
      highlights: [
        'Medalla a la Cruz del Mérito Aeronáutico',
        'Operaciones de transmisiones y ofimática',
        'En excedencia desde enero de 2022 (fin de contrato: julio de 2027)',
      ],
    },
    {
      name: 'Spanish Navy',
      position: 'Marinero – Especialista Maniobra y Navegación',
      startDate: '2004-12',
      endDate: '2006-12',
      summary:
        'Más de 260 horas de mar, campañas de control de pesca, defensa de aguas nacionales y servicios de marinero de puente.',
      highlights: [
        'Manejo de zodiac con motor de turbina',
        'Maniobras en alta mar con helicópteros',
      ],
    },
    {
      name: 'Ejército de Tierra',
      position: 'Militar',
      startDate: '2000-12',
      endDate: '2004-08',
      summary:
        'Diversas tareas como servicios de guardia y ofimática.',
      highlights: [],
    },
  ],
  education: [
    {
      institution: 'Universitat Oberta de Catalunya',
      url: 'https://www.uoc.edu',
      area: 'Informática, comunicaciones y servicios de asistencia',
      studyType: 'Grado en Ingeniería',
      startDate: '2022-02',
      endDate: '',
    },
    {
      institution: 'CIFP Villa de Agüimes',
      area: 'Desarrollo de aplicaciones Web',
      studyType: 'Técnico',
      startDate: '2016',
      endDate: '2018',
    },
    {
      institution: 'Académia Telde',
      area: 'Mantenimiento y Reparación de Ordenadores',
      studyType: 'Curso',
      startDate: '2005',
      endDate: '2006',
    },
    {
      institution: 'Colegio El Batan',
      area: 'E.S.O.',
      studyType: 'Educación Secundaria Obligatoria',
      startDate: '1987',
      endDate: '1998',
    },
  ],
  skills: [
    {
      name: 'Frontend',
      level: 'Avanzado',
      keywords: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Vue.js', 'Nuxt'],
    },
    {
      name: 'Backend',
      level: 'Intermedio Alto',
      keywords: ['Node.js', '.NET', 'C#', 'OpenAPI', 'Firebase', 'Convex'],
    },
    {
      name: 'Calidad',
      level: 'Intermedio Alto',
      keywords: ['Testing', 'Mocks (MSW)', 'Refactorización'],
    },
    {
      name: 'Diseño',
      level: 'Intermedio',
      keywords: ['Photoshop', 'Illustrator', 'UI/UX'],
    },
    {
      name: 'Herramientas',
      level: 'Avanzado',
      keywords: ['Git', 'GitHub', 'ClickUp', 'Jira', 'Confluence', 'Azure DevOps', 'Office'],
    },
    {
      name: 'IA',
      level: 'Intermedio',
      keywords: ['Copilot', 'ChatGPT', 'Prompt Engineering'],
    },
    {
      name: 'Principios',
      level: 'Avanzado',
      keywords: ['SOLID', 'Clean Code', 'Responsive Design'],
    },
  ],
  languages: [
    {
      language: 'Español',
      fluency: 'Nativo',
    },
    {
      language: 'Inglés',
      fluency: 'Elemental',
    },
  ],
  projects: [
    {
      name: 'masquehuellas.es',
      isActive: false,
      description: 'Digitalización web de la clínica veterinaria +QHuellas.',
      highlights: ['Vue.js', 'Firebase'],
    },
    {
      name: 'foroebc.org',
      isActive: false,
      description: 'Promover nuevos ámbitos y competencias profesionales.',
      highlights: ['Web development'],
    },
    {
      name: 'businessevolver.net',
      isActive: false,
      description:
        'Proyecto de alianzas para llevar a las empresas a un futuro en el desarrollo sostenible (ODS) y la digitalización.',
      highlights: ['ODS', 'Digitalización'],
    },
    {
      name: 'lajairadeana.com',
      isActive: false,
      description: 'Web para la granja escuela La Jaira de Ana.',
      highlights: ['Proyecto anterior, actualmente mantenido por otro proveedor'],
      url: 'https://lajairadeana.com/',
    },
    {
      name: 'doelhierro.es',
      isActive: true,
      description: 'Web de la Denominación de Origen de Vinos del Hierro.',
      highlights: ['Desarrollo web'],
      url: 'https://doelhierro.es/',
    },
    {
      name: 'w2ew.eu',
      description: 'Proyecto europeo.',
      highlights: [],
      url: 'https://w2ew.eu/',
    },
    {
      name: 'JamApp',
      description:
        'Proyecto ejecutado al finalizar los estudios obteniendo un premio por el centro, apoyo empresarial de la EOI y del Cabildo de Gran Canaria.',
      highlights: [
        'Premio del centro',
        'Apoyo EOI',
        'Apoyo Cabildo Gran Canaria',
      ],
    },
  ],
}

async function seed() {
  console.log('Seeding CV data to Convex...')
  const id = await client.mutation(api.cv.upsert, cvData)
  console.log('CV seeded successfully! ID:', id)
}

seed().catch((err) => {
  console.error('Failed to seed CV:', err)
  process.exit(1)
})
