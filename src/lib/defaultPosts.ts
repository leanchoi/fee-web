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
    id: "post-oxford-amsterdam-2026",
    title: "Viaje Educativo e Inmersión Cultural: Nuestros Estudiantes en Oxford y Ámsterdam",
    slug: "viaje-educativo-oxford-amsterdam-2026",
    excerpt: "Una experiencia formativa inolvidable recorriendo los históricos colleges de la Universidad de Oxford en Inglaterra y la riqueza cultural de los Países Bajos.",
    content: "<p>En el marco del Programa de Inglés Intensivo y Formación Global de la Fundación Educativa Esquel, un contingente de estudiantes y docentes vivió una experiencia formativa transformadora recorriendo el Reino Unido y los Países Bajos.</p><p>La primera etapa del viaje tuvo como epicentro la histórica <strong>Universidad de Oxford</strong> (Inglaterra), donde los alumnos recorrieron edificios centenarios como la emblemática <strong>Radcliffe Camera</strong> y los tradicionales colleges británicos, practicando el idioma en contextos académicos y cotidianos reales.</p><p>La travesía continuó en <strong>Ámsterdam y los Países Bajos</strong>, donde el grupo exploró los históricos molinos de viento de <strong>Zaanse Schans</strong>, los canales holandeses y centros de innovación cultural y científica. Esta vivencia fortalece la autonomía, la convivencia, la confianza comunicativa y la apertura intercultural de nuestros estudiantes, consolidando el perfil de egresados con visión global y compromiso con su comunidad.</p>",
    imageUrl: "/photos/fee_photo_oxford.jpg",
    category: "Experiencias Internacionales",
    published: true,
    createdAt: "2026-09-01T20:30:00.000Z",
    updatedAt: "2026-09-01T20:30:00.000Z"
  }
];

