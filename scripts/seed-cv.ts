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
      'Desarrollador Frontend Senior con más de 8 años de experiencia construyendo interfaces y productos web con Vue.js, Nuxt y TypeScript. Combino ejecución técnica de alto volumen con iniciativa propia, documentación rigurosa y buenas prácticas de equipo (Jira, Confluence, Git). Motivado por la mejora continua, el trabajo en equipo y la creación de productos que aporten valor real a los usuarios. Me implico activamente en el negocio y en entender las necesidades reales de los clientes, buscando siempre soluciones que aporten valor medible, no solo la implementación técnica.',
    location: {
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
        '793 commits (+324.047 / -159.550 líneas) en los productos clave de ventas (sales-web, sales-shared, sales-specifications, importer-sales, SalesBackOffice)',
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
        'Desarrollo de proyectos web para distintas empresas y clientes, compaginado en paralelo con mis puestos a tiempo completo desde 2020.',
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
      name: 'Fuerzas Armadas Españolas',
      position: 'Especialista técnico y operativo (Ejército de Tierra, Armada y Ejército del Aire)',
      startDate: '2000-12',
      endDate: '2022-01',
      summary:
        'Más de 21 años en las Fuerzas Armadas españolas, con especialización progresiva en mantenimiento de aeronaves, maniobra y navegación, y transmisiones/ofimática.',
      highlights: [
        'Ejército del Aire (2007–2022): Especialista en mantenimiento de aeronaves de combate. Medalla a la Cruz del Mérito Aeronáutico',
        'Armada (2004–2006): Marinero, Especialista en Maniobra y Navegación. Más de 260 horas de mar en campañas de control de pesca y defensa de aguas nacionales',
        'Ejército de Tierra (2000–2004): Operaciones de transmisiones y ofimática',
        'En excedencia desde enero de 2022 (fin de contrato: julio de 2027)',
      ],
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
      name: 'Negocio',
      level: 'Avanzado',
      keywords: [
        'Orientación al cliente',
        'Visión de negocio',
        'Requisitos funcionales',
        'Comunicación con stakeholders',
      ],
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
      fluency: 'Intermedio (B1)',
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
