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
    label: 'Desarrollador Frontend Senior · Vue.js & Nuxt',
    image: '',
    email: 'fco.j.sarmientoperez@gmail.com',
    phone: '+34 696124038',
    url: 'https://jsarmiento.dev/',
    summary:
      'Desarrollador Frontend Senior con más de 8 años de experiencia construyendo interfaces y productos web con Vue.js, Nuxt y TypeScript. Combino ejecución técnica de alto volumen con iniciativa propia, atención al detalle y documentación rigurosa, además de una comunicación clara y buenas prácticas de equipo (Jira, Confluence, Git). Resuelvo problemas con un enfoque creativo, me adapto con rapidez a nuevos contextos y mantengo una ética de trabajo constante. Me implico activamente en el negocio y en entender las necesidades reales de los clientes, buscando siempre soluciones que aporten valor medible, no solo la implementación técnica.',
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
      name: 'Qiklet',
      position: 'Fundador',
      url: 'https://qiklet.com',
      startDate: '2025-11',
      endDate: null,
      summary:
        'Fundé y lidero Qiklet, una plataforma SaaS de gestión de colas en tiempo real: los clientes reservan turno escaneando un código QR y esperan donde quieran, mientras el negocio gestiona la cola y accede a analítica operativa en tiempo real. Actualmente en fase de ventas.',
      highlights: [
        'Defino la estrategia y la hoja de ruta tecnológica del producto de principio a fin',
        'Diseñé el modelo de precios SaaS por niveles (Básico, Base, Enterprise) y la propuesta de valor del producto',
        'Lidero el desarrollo de producto, negocio y ventas de la empresa desde cero, actualmente en fase de ventas activa',
      ],
    },
    {
      name: 'AIDA',
      position: 'Senior Frontend Developer',
      startDate: '2024-12',
      endDate: '2026-08',
      summary:
        'Desarrollo de aplicaciones frontend con tecnologías modernas.',
      highlights: [
        'Asumí la promoción a Senior Frontend Developer, liderando el ownership técnico del frontend de ventas y de la librería de componentes compartida',
        'Contribuí con 793 commits (+324.047 / -159.550 líneas) a los productos clave de ventas (sales-web, sales-shared, sales-specifications, importer-sales, SalesBackOffice)',
        'Cerré 258 de 266 incidencias Jira asignadas y reporté 90 propias a lo largo de mi etapa en AIDA (2023–2026), combinando ejecución técnica con detección proactiva de mejoras',
        'Documenté el conocimiento del equipo con 56 páginas creadas y contribución en 132 más en Confluence',
        'Impulsé la motivación y el rendimiento del equipo mediante liderazgo informal y mentoría entre compañeros',
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
        'Desarrollé interfaces de usuario para el producto de ventas',
        'Integré APIs REST con el backend de ventas',
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
        'Desarrollé con Vue.js y Phaser interfaces para enseñar pensamiento computacional a niños de entre 6 y 16 años, desde experiencias sencillas hasta complejas, adaptadas para un uso intuitivo con apenas conocimientos previos',
        'Coordiné trabajo remoto con equipos internacionales en Guatemala, contribuyendo a la expansión internacional del producto',
      ],
    },
    {
      name: 'Profesional independiente',
      position: 'Desarrollador de páginas web autónomo',
      startDate: '2017-06',
      endDate: null,
      summary:
        'Desarrollé y entregué 5 proyectos web para distintas empresas y clientes, compaginándolo en paralelo con mis puestos a tiempo completo desde 2020.',
      highlights: [
        'Desarrollé masquehuellas.es, la digitalización web de la clínica veterinaria +QHuellas',
        'Desarrollé foroebc.org, un portal para promover nuevos ámbitos y competencias profesionales',
        'Desarrollé businessevolver.net, una plataforma de alianzas empresariales para el desarrollo sostenible (ODS)',
        'Desarrollé lajairadeana.com, la web de la granja escuela La Jaira de Ana',
        'Desarrollé doelhierro.es, la web de la Denominación de Origen de Vinos del Hierro',
        'Ejecuté JamApp como proyecto fin de estudios, con el que obtuve un premio del centro, apoyo empresarial de la EOI y del Cabildo de Gran Canaria',
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
        'Realicé mantenimiento especializado en aeronaves de combate en el Ejército del Aire (2007–2022), reconocido con la Medalla a la Cruz del Mérito Aeronáutico',
        'Acumulé más de 260 horas de mar como Especialista en Maniobra y Navegación en la Armada (2004–2006), participando en campañas de control de pesca y defensa de aguas nacionales',
        'Realicé operaciones de transmisiones y ofimática en el Ejército de Tierra (2000–2004)',
        'Mantengo la excedencia desde enero de 2022, con fin de contrato previsto en julio de 2027',
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
      endDate: 'En pausa',
      score:
        '98 créditos superados. Pausado temporalmente por compaginar el grado con jornada laboral completa y responsabilidades familiares.',
    },
    {
      institution: 'Academia Forja Consultores',
      area: "Gestión y liderazgo — reconocido por Florida Global University (USA) como 'Online Management Skills'",
      studyType: 'Programa de Herramientas Gerenciales Online',
      startDate: '2024-09',
      endDate: '2024-12',
      score: 'Duración: 96 horas. Instructor: Eduardo Martí.',
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
        'Liderazgo',
        'Emprendimiento',
        'Gestión de proyectos',
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
        'Proyecto ejecutado al finalizar los estudios, con el que obtuve un premio del centro, apoyo empresarial de la EOI y del Cabildo de Gran Canaria.',
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
