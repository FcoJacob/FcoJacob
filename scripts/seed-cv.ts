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
      address: 'Calle Zurbarán',
      postalCode: '35240',
      city: 'Las Palmas de Gran Canaria',
      countryCode: 'ES',
      region: 'Las Palmas',
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
        'Lidero de forma integral (producto, tecnología, negocio y ventas) la construcción de Qiklet desde cero, asumiendo toda decisión estratégica y operativa de la empresa',
        'Diseñé y lancé el modelo de precios SaaS en 3 niveles (Básico, Base, Enterprise), definiendo la propuesta de valor y el posicionamiento de producto',
        'Desarrollé el MVP completo (frontend, backend y analítica en tiempo real) y lo llevé a fase de ventas activa con [REVISAR: nº de negocios en fase piloto o de ventas]',
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
        'Mentoricé informalmente a [REVISAR: nº] compañeros del equipo de frontend, impulsando su motivación y su rendimiento',
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
        'Desarrollé [REVISAR: nº] componentes y vistas de interfaz de usuario en Vue.js para el producto de ventas',
        'Integré [REVISAR: nº] APIs REST con el backend de ventas, cubriendo los flujos funcionales principales del producto',
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
        'Desarrollé con Vue.js y Phaser [REVISAR: nº] experiencias interactivas para enseñar pensamiento computacional a niños de entre 6 y 16 años, desde experiencias sencillas hasta complejas',
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
        'Desarrollé y sigo manteniendo doelhierro.es, la web institucional de la Denominación de Origen de Vinos del Hierro, en producción activa',
        'Entregué 4 proyectos web adicionales (masquehuellas.es, foroebc.org, businessevolver.net, lajairadeana.com) para clientes de los sectores de salud animal, economía azul, alianzas empresariales y turismo rural, cubriendo diseño, desarrollo frontend y despliegue',
        'Ejecuté JamApp como proyecto fin de estudios, con el que obtuve un premio del centro, apoyo empresarial de la EOI y del Cabildo de Gran Canaria',
      ],
    },
    {
      name: 'Fuerzas Armadas Españolas',
      position: 'Especialista técnico y operativo (Ejército de Tierra, Armada y Ejército del Aire)',
      startDate: '2000-12',
      endDate: '2022-01',
      summary:
        'Más de 21 años en las Fuerzas Armadas españolas (Ejército de Tierra, Armada y Ejército del Aire), con especialización en mantenimiento de aeronaves, maniobra/navegación y transmisiones.',
      highlights: [
        'Acumulé más de 260 horas de mar como Especialista en Maniobra y Navegación en la Armada (2004–2006), en campañas de control de pesca y defensa de aguas nacionales',
        'Reconocido con la Medalla a la Cruz del Mérito Aeronáutico en el Ejército del Aire; actualmente en excedencia desde enero de 2022 (fin de contrato: julio de 2027)',
      ],
    },
  ],
  education: [
    {
      institution: 'Academia Forja Consultores',
      area: "Gestión y liderazgo — reconocido por Florida Global University (USA) como 'Online Management Skills'",
      studyType: 'Programa de Herramientas Gerenciales Online',
      startDate: '2024-09',
      endDate: '2024-12',
      score: 'Duración: 96 horas. Instructor: Eduardo Martí.',
    },
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
      institution: 'CIFP Villa de Agüimes',
      area: 'Desarrollo de aplicaciones Web',
      studyType: 'Técnico',
      startDate: '2016',
      endDate: '2018',
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
