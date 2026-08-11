/**
 * "IA" de perfil — 100 % DETERMINISTA (regla del repo: nada de azar, todo reproducible).
 *
 * Cubre tres usos:
 *  1. `skillsSugeridas()` — recorta los catálogos de habilidades a lo que va acorde al puesto
 *     (lo consume la sección "Requisitos" del anuncio).
 *  2. `areasSugeridas()` — sube al frente las áreas predeterminadas del puesto, sin recortar.
 *  3. `interpretarTranscript()` — convierte el dictado por voz en campos del `Requisito`.
 *     SIN CONSUMIDORES desde que "Explicar con IA" redacta con `mrfn()` en vez de parsear texto.
 *     Se conserva porque es el único parser de dictado que hay; borrarlo cuesta más que recuperarlo.
 *
 * `PERFIL_POR_AREA` es la fuente única del mapa por área: también lo usa `sugerirPerfil()`
 * de `VistaDescriptivo` para no acabar con dos criterios divergentes.
 */
import {
  CIUDADES, EDUCACION, ESPECIALIDADES, HARD_SKILLS, MODALIDADES, PROFESIONES, SOFT_SKILLS, TURNOS,
  type Disciplina,
} from "../constants/catalogos";
import type { Requisito } from "../types/models/domain";

/** Texto en minúsculas y sin acentos, para comparar sin sorpresas. */
const norm = (s: string): string => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Une listas conservando el orden del catálogo y sin repetidos. */
const ordenar = (catalogo: readonly string[], elegidas: string[]): string[] => {
  const set = new Set(elegidas);
  const delCatalogo = catalogo.filter((x) => set.has(x));
  const fuera = elegidas.filter((x) => !catalogo.includes(x)); // añadidas a mano por el usuario
  return [...delCatalogo, ...fuera];
};

// ─────────────────────────────────────────────────────────────────────────────
// Perfil sugerido por área (compartido con VistaDescriptivo)
// ─────────────────────────────────────────────────────────────────────────────

export interface PerfilArea {
  areasConocimiento: string[];
  espRequeridas: string[];
  hardSkills: string[];
  softSkills: string[];
}

export const PERFIL_POR_AREA: Record<string, PerfilArea> = {
  "Atención a Clientes": {
    areasConocimiento: ["Administración de Empresas", "Comunicación"],
    espRequeridas: ["Servicio al Cliente"],
    hardSkills: ["CRM", "Excel avanzado", "Zendesk"],
    softSkills: ["Empatía", "Comunicación efectiva", "Tolerancia a la presión"],
  },
  Tecnología: {
    areasConocimiento: ["Ingeniería de Software", "Sistemas Computacionales"],
    espRequeridas: ["Desarrollo Frontend", "UX/UI"],
    hardSkills: ["React", "Node.js", "Figma"],
    softSkills: ["Trabajo en equipo", "Atención al detalle", "Proactividad"],
  },
  Ventas: {
    areasConocimiento: ["Mercadotecnia", "Ventas"],
    espRequeridas: ["Ventas B2C", "CRM y Fidelización"],
    hardSkills: ["CRM", "Negociación comercial", "Prospección en frío"],
    softSkills: ["Comunicación efectiva", "Orientación a resultados", "Empatía"],
  },
  "Datos y Analítica": {
    areasConocimiento: ["Actuaría", "Sistemas Computacionales"],
    espRequeridas: ["Ciencia de Datos", "Business Intelligence"],
    hardSkills: ["Python", "SQL", "Power BI"],
    softSkills: ["Pensamiento analítico", "Atención al detalle"],
  },
};

export const PERFIL_AREA_DEFAULT: PerfilArea = {
  areasConocimiento: ["Administración de Empresas"],
  espRequeridas: [],
  hardSkills: ["Excel avanzado"],
  softSkills: ["Comunicación efectiva", "Trabajo en equipo"],
};

/**
 * Áreas de conocimiento y de experiencia acordes al puesto.
 *
 * Devuelve SOLO lo predeterminado del área más lo ya elegido. Antes añadía detrás el catálogo
 * entero —25 profesiones y 22 especialidades— y el editor se volvía inmanejable; ahora el resto
 * se alcanza con el filtro por disciplina (`porDisciplina`).
 */
export function areasSugeridas(req: Requisito): { areas: string[]; esp: string[] } {
  const base = PERFIL_POR_AREA[req.area] ?? PERFIL_AREA_DEFAULT;
  return {
    areas: ordenar(PROFESIONES, [...new Set([...base.areasConocimiento, ...req.areasConocimiento])]),
    esp: ordenar(ESPECIALIDADES, [...new Set([...base.espRequeridas, ...req.espRequeridas])]),
  };
}

/**
 * Valores de un catálogo que pertenecen a una disciplina.
 *
 * Dos reglas que no se pueden saltar:
 *  · lo que NO está en el mapa es transversal y sale con cualquier disciplina;
 *  · lo ya elegido sale siempre, filtre lo que filtre — esconder un tag seleccionado lo haría
 *    parecer borrado.
 */
export function porDisciplina(
  catalogo: readonly string[],
  mapa: Record<string, Disciplina[]>,
  disciplina: Disciplina,
  elegidas: string[],
): string[] {
  const dentro = catalogo.filter((x) => !mapa[x] || mapa[x].includes(disciplina));
  return ordenar(catalogo, [...new Set([...dentro, ...elegidas])]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Habilidades acordes al puesto
// ─────────────────────────────────────────────────────────────────────────────

/** Habilidades técnicas típicas de cada área (solo valores del catálogo HARD_SKILLS). */
const HARD_POR_AREA: Record<string, string[]> = {
  Tecnología: ["React", "Node.js", "SQL", "Python", "Scrum", "Figma", "Redes Cisco", "Inglés avanzado"],
  "Datos y Analítica": ["SQL", "Python", "Power BI", "Tableau", "Excel avanzado", "Inglés avanzado"],
  Ventas: ["CRM", "Salesforce", "Negociación comercial", "Prospección en frío", "Excel avanzado"],
  Marketing: ["Google Ads", "Meta Ads", "SEO", "CRM", "Figma", "Inglés avanzado"],
  Finanzas: ["Excel avanzado", "Contabilidad NIF", "Modelado financiero", "SAP", "Power BI"],
  "Recursos Humanos": ["Nómina", "LMS", "Excel avanzado", "SAP", "Inglés avanzado"],
  Operaciones: ["SAP", "Excel avanzado", "Power BI", "AutoCAD", "Scrum"],
  "Atención a Clientes": ["Zendesk", "CRM", "Salesforce", "Excel avanzado", "Inglés avanzado"],
  Legal: ["Excel avanzado", "Inglés avanzado", "SAP"],
  Producto: ["Figma", "Scrum", "SQL", "Power BI", "Inglés avanzado"],
};

/** Habilidades blandas típicas de cada área (solo valores del catálogo SOFT_SKILLS). */
const SOFT_POR_AREA: Record<string, string[]> = {
  Tecnología: ["Trabajo en equipo", "Atención al detalle", "Proactividad", "Adaptabilidad"],
  "Datos y Analítica": ["Pensamiento analítico", "Atención al detalle", "Comunicación efectiva", "Gestión del tiempo"],
  Ventas: ["Comunicación efectiva", "Orientación a resultados", "Negociación", "Empatía", "Proactividad"],
  Marketing: ["Comunicación efectiva", "Proactividad", "Adaptabilidad", "Orientación a resultados"],
  Finanzas: ["Atención al detalle", "Pensamiento analítico", "Gestión del tiempo", "Comunicación efectiva"],
  "Recursos Humanos": ["Empatía", "Comunicación efectiva", "Resolución de conflictos", "Liderazgo"],
  Operaciones: ["Gestión del tiempo", "Orientación a resultados", "Trabajo en equipo", "Resolución de conflictos"],
  "Atención a Clientes": ["Empatía", "Comunicación efectiva", "Resolución de conflictos", "Adaptabilidad"],
  Legal: ["Atención al detalle", "Comunicación efectiva", "Pensamiento analítico", "Negociación"],
  Producto: ["Comunicación efectiva", "Pensamiento analítico", "Liderazgo", "Adaptabilidad"],
};

/**
 * Palabras del título del puesto que arrastran habilidades extra y, cuando la palabra lo permite,
 * la disciplina del puesto.
 *
 * `disc` es OPCIONAL a propósito: "supervisor", "gerente", "jefe" o "coordinador" dicen el nivel
 * jerárquico, no de qué va el puesto, y clasificar por ellas sería inventar. Un título que solo
 * traiga palabras de jerarquía cae al respaldo (la IA, y tras ella el área funcional).
 *
 * El orden importa: gana la primera entrada con `disc` que aparezca en el título, así que las claves
 * específicas van antes que las genéricas.
 */
const POR_TITULO: { clave: string; hard: string[]; soft: string[]; disc?: Disciplina }[] = [
  { clave: "supervis", hard: ["Excel avanzado"], soft: ["Liderazgo", "Resolución de conflictos", "Gestión del tiempo"] },
  { clave: "gerente", hard: ["Excel avanzado"], soft: ["Liderazgo", "Orientación a resultados", "Gestión del tiempo"] },
  { clave: "jefe", hard: [], soft: ["Liderazgo", "Resolución de conflictos"] },
  { clave: "coordinador", hard: ["Excel avanzado"], soft: ["Gestión del tiempo", "Liderazgo"] },
  { clave: "front", hard: ["React", "Figma"], soft: ["Atención al detalle"], disc: "Tecnología y Datos" },
  { clave: "back", hard: ["Node.js", "SQL", "Python"], soft: ["Pensamiento analítico"], disc: "Tecnología y Datos" },
  { clave: "desarroll", hard: ["React", "Node.js", "SQL", "Scrum"], soft: ["Trabajo en equipo"], disc: "Tecnología y Datos" },
  { clave: "dato", hard: ["SQL", "Python", "Power BI"], soft: ["Pensamiento analítico"], disc: "Tecnología y Datos" },
  { clave: "analista", hard: ["SQL", "Excel avanzado", "Power BI"], soft: ["Pensamiento analítico"], disc: "Tecnología y Datos" },
  { clave: "caj", hard: ["Excel avanzado"], soft: ["Atención al detalle", "Empatía"], disc: "Administración y Finanzas" },
  { clave: "contab", hard: ["Contabilidad NIF", "Excel avanzado", "SAP"], soft: ["Atención al detalle"], disc: "Administración y Finanzas" },
  { clave: "financ", hard: ["Modelado financiero", "Excel avanzado"], soft: ["Pensamiento analítico"], disc: "Administración y Finanzas" },
  { clave: "reclut", hard: ["LMS", "Excel avanzado"], soft: ["Empatía", "Comunicación efectiva"], disc: "Administración y Finanzas" },
  { clave: "nomina", hard: ["Nómina", "Excel avanzado"], soft: ["Atención al detalle"], disc: "Administración y Finanzas" },
  { clave: "vent", hard: ["CRM", "Negociación comercial", "Prospección en frío"], soft: ["Negociación", "Orientación a resultados"], disc: "Comercial y Marketing" },
  { clave: "comercial", hard: ["CRM", "Negociación comercial"], soft: ["Negociación", "Comunicación efectiva"], disc: "Comercial y Marketing" },
  { clave: "market", hard: ["Google Ads", "Meta Ads", "SEO"], soft: ["Proactividad"], disc: "Comercial y Marketing" },
  { clave: "soporte", hard: ["Zendesk", "CRM"], soft: ["Empatía", "Adaptabilidad"], disc: "Comercial y Marketing" },
  { clave: "servicio", hard: ["Zendesk", "CRM"], soft: ["Empatía", "Comunicación efectiva"], disc: "Comercial y Marketing" },
  { clave: "disen", hard: ["Figma"], soft: ["Atención al detalle"], disc: "Humanidades y Diseño" }, // `norm` ya quitó la ñ
  // Sin habilidades propias: existen solo para clasificar títulos frecuentes del catálogo.
  { clave: "atencion a client", hard: [], soft: [], disc: "Comercial y Marketing" },
  { clave: "logistic", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "almacen", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "operacion", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "ingenier", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "manteni", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "produccion", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "arquitect", hard: [], soft: [], disc: "Operaciones e Ingeniería" },
  { clave: "cobranza", hard: [], soft: [], disc: "Administración y Finanzas" },
  { clave: "auditor", hard: [], soft: [], disc: "Administración y Finanzas" },
  { clave: "administra", hard: [], soft: [], disc: "Administración y Finanzas" },
  { clave: "sistemas", hard: [], soft: [], disc: "Tecnología y Datos" },
  { clave: "software", hard: [], soft: [], disc: "Tecnología y Datos" },
  { clave: "seguridad de la informacion", hard: [], soft: [], disc: "Tecnología y Datos" },
  { clave: "medic", hard: [], soft: [], disc: "Salud y Bienestar" },
  { clave: "enfermer", hard: [], soft: [], disc: "Salud y Bienestar" },
  { clave: "psicolog", hard: [], soft: [], disc: "Salud y Bienestar" },
  { clave: "nutri", hard: [], soft: [], disc: "Salud y Bienestar" },
  { clave: "legal", hard: [], soft: [], disc: "Humanidades y Diseño" },
  { clave: "abogad", hard: [], soft: [], disc: "Humanidades y Diseño" },
  { clave: "juridic", hard: [], soft: [], disc: "Humanidades y Diseño" },
  { clave: "comunicac", hard: [], soft: [], disc: "Humanidades y Diseño" },
  { clave: "capacita", hard: [], soft: [], disc: "Humanidades y Diseño" },
];

/**
 * Disciplina deducida del título, sin red. Es el primer eslabón de la cadena: solo cuando esto
 * devuelve `undefined` se molesta a la IA del backend.
 */
export function disciplinaDeTitulo(titulo: string): Disciplina | undefined {
  const t = norm(titulo);
  return POR_TITULO.find((x) => x.disc && t.includes(x.clave))?.disc;
}

/**
 * Habilidades del catálogo que van acorde al puesto. Nunca oculta lo que ya está elegido
 * en la vacante, para que el picker no "pierda" valores al filtrar.
 */
export function skillsSugeridas(req: Requisito): { hard: string[]; soft: string[] } {
  const titulo = norm(req.titulo);
  const hard = new Set<string>([...(HARD_POR_AREA[req.area] ?? []), ...req.hardSkills]);
  const soft = new Set<string>([...(SOFT_POR_AREA[req.area] ?? []), ...req.softSkills]);

  for (const { clave, hard: h, soft: s } of POR_TITULO) {
    if (!titulo.includes(clave)) continue;
    h.forEach((x) => hard.add(x));
    s.forEach((x) => soft.add(x));
  }

  // Piso mínimo: si el área no está mapeada, al menos lo transversal.
  if (hard.size < 4) ["Excel avanzado", "Inglés avanzado", "CRM"].forEach((x) => hard.add(x));
  if (soft.size < 4) PERFIL_AREA_DEFAULT.softSkills.forEach((x) => soft.add(x));

  return {
    hard: ordenar(HARD_SKILLS, [...hard]),
    soft: ordenar(SOFT_SKILLS, [...soft]),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Dictado por voz
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transcripción enlatada que "escucha" el micrófono simulado (no hay MediaRecorder).
 * Es un caso concreto a propósito, para que la interpretación de abajo se note.
 */
export const TRANSCRIPT_DEMO =
  "Estoy buscando a alguien para el puesto de Cajero Supervisor en nuestra sucursal de CDMX. " +
  "Necesito una persona con al menos 3 años de experiencia manejando caja y supervisando a un equipo " +
  "pequeño, de unas cinco personas. Que tenga Bachillerato terminado. Es indispensable que domine " +
  "Excel avanzado para los cortes diarios y que haya usado algún CRM o sistema de punto de venta. " +
  "Del lado personal necesito mucha Atención al detalle, porque cuadran efectivo todos los días, y buena " +
  "Comunicación efectiva con el equipo y con los clientes; que sepa manejar la Resolución de conflictos " +
  "cuando se hace fila. El puesto es Presencial, Turno Matutino, y el sueldo autorizado es de 18,500 pesos " +
  "mensuales. Ah, y que tenga Liderazgo, porque va a coordinar a los cajeros de piso.";

/** Alias de ciudades que la gente dice pero no están tal cual en el catálogo. */
const ALIAS_CIUDAD: Record<string, string> = {
  "ciudad de mexico": "CDMX",
  "df": "CDMX",
  "distrito federal": "CDMX",
  "gdl": "Guadalajara",
  "mty": "Monterrey",
};

/** Devuelve del catálogo lo que aparezca mencionado en el texto (respetando el orden del catálogo). */
const mencionadas = (texto: string, catalogo: readonly string[]): string[] =>
  catalogo.filter((x) => texto.includes(norm(x)));

/**
 * Interpreta el dictado y devuelve SOLO los campos que reconoció. Puro regex/keywords:
 * determinista, sin red y sin modelo. Lo que no aparece en el texto no se toca.
 */
export function interpretarTranscript(texto: string): Partial<Requisito> {
  const t = norm(texto);
  const out: Partial<Requisito> = {};

  const exp = t.match(/(\d+)\s*(?:anos?|anios?)/);
  if (exp) out.anosExp = Number(exp[1]);

  const sueldo = t.match(/\$?\s*(\d{1,3}(?:,\d{3})+|\d{4,6})/);
  if (sueldo) {
    const monto = Number(sueldo[1].replace(/,/g, ""));
    out.sueldo = monto;
    out.salarioMin = Math.round((monto * 0.9) / 500) * 500;
    out.salarioMax = Math.round((monto * 1.15) / 500) * 500;
  }

  const ciudad = CIUDADES.find((c) => t.includes(norm(c)))
    ?? Object.entries(ALIAS_CIUDAD).find(([k]) => t.includes(k))?.[1];
  if (ciudad) {
    out.ubicacionTrabajo = ciudad;
    out.ubicacionCandidato = ciudad;
  }

  const turno = TURNOS.find((x) => t.includes(norm(x)) || t.includes(norm(x.replace("Turno ", ""))));
  if (turno) out.turno = turno;

  const modalidad = MODALIDADES.find((m) => t.includes(norm(m)));
  if (modalidad) out.modalidad = modalidad;

  const educacion = EDUCACION.find((e) => t.includes(norm(e)));
  if (educacion) out.educacion = educacion;

  const hard = mencionadas(t, HARD_SKILLS);
  if (hard.length) out.hardSkills = hard;

  const soft = mencionadas(t, SOFT_SKILLS);
  if (soft.length) out.softSkills = soft;

  const esp = mencionadas(t, ESPECIALIDADES).slice(0, 5); // el tope de 5 es regla del dominio
  if (esp.length) out.espRequeridas = esp;

  return out;
}

/** Etiquetas legibles de los campos que devuelve `interpretarTranscript` (para marcar los cambios). */
export const CAMPOS_VOZ: Record<string, string> = {
  anosExp: "Años de experiencia",
  sueldo: "Sueldo",
  salarioMin: "Salario mínimo",
  salarioMax: "Salario máximo",
  ubicacionTrabajo: "Ubicación",
  ubicacionCandidato: "Ubicación del candidato",
  turno: "Turno",
  modalidad: "Modalidad",
  educacion: "Nivel de estudios",
  hardSkills: "Habilidades técnicas",
  softSkills: "Habilidades blandas",
  espRequeridas: "Especialidades",
};
