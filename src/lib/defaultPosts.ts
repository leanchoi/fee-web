export interface PostItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_POSTS: PostItem[] = [
  {
    id: "post-1",
    title: "Inicio del Ciclo Lectivo 2026",
    slug: "inicio-ciclo-lectivo-2026",
    category: "Institucional",
    excerpt: "Comenzamos un nuevo año con la esperanza y el compromiso renovado de toda la comunidad educativa, recibiendo a las familias y nuevos ingresantes.",
    content: "Damos inicio a un nuevo año escolar con gran entusiasmo y el compromiso de siempre. Durante esta primera semana, las familias y estudiantes de los tres niveles compartieron las jornadas de bienvenida e integración pedagógica. Agradecemos a toda la comunidad por acompañarnos en este hermoso camino formativo.",
    imageUrl: "/hero-bg.png",
    published: true,
    createdAt: "2026-02-26T10:00:00.000Z",
    updatedAt: "2026-02-26T10:00:00.000Z",
  },
  {
    id: "post-2",
    title: "Cambridge English Acreditation",
    slug: "cambridge-english-acreditation",
    category: "Inglés",
    excerpt: "Felicitamos a los alumnos de 6to año que han obtenido su First Certificate con honores en las mesas internacionales de evaluación.",
    content: "Queremos hacer un reconocimiento especial a nuestros estudiantes de Nivel Secundario por su destacado desempeño en las certificaciones internacionales de Cambridge English (B2 First y C1 Advanced). Su dedicación y el acompañamiento del equipo docente de inglés demuestran la solidez de nuestro proyecto bilingüe.",
    imageUrl: "/nivel-secundario.png",
    published: true,
    createdAt: "2026-03-14T10:00:00.000Z",
    updatedAt: "2026-03-14T10:00:00.000Z",
  },
  {
    id: "post-3",
    title: "Kermesse Solidaria de Otoño",
    slug: "kermesse-solidaria-de-otono",
    category: "Comunidad",
    excerpt: "Invitamos a todas las familias al gran evento solidario del año en el SUM de la sede primaria para compartir juegos, buffet y proyectos comunitarios.",
    content: "El próximo sábado nos encontramos toda la comunidad de la Fundación Educativa Esquel para celebrar nuestra tradicional Kermesse de Otoño. Habrá stands recreativos organizados por los cursos, buffet solidario a beneficio de proyectos estudiantiles y presentaciones artísticas. ¡Los esperamos a todos!",
    imageUrl: "/comunidad-hero.png",
    published: true,
    createdAt: "2026-04-02T10:00:00.000Z",
    updatedAt: "2026-04-02T10:00:00.000Z",
  }
];
