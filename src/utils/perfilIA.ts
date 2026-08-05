/**
 * "IA" de perfil — 100 % DETERMINISTA (regla del repo: nada de azar, todo reproducible).
 *
 * Cubre dos usos:
 *  1. `skillsSugeridas()` — recorta los catálogos de habilidades a lo que va acorde al puesto
 *     (lo consume el botón "Editar" del asistente Revisar vacante).
 *  2. `interpretarTranscript()` — convierte el dictado por voz en campos del `Requisito`.
 *
 * `PERFIL_POR_AREA` es la fuente única del mapa por área: también lo usa `sugerirPerfil()`
 * de `VistaDescriptivo` para no acabar con dos criterios divergentes.
 */
import {
  CIUDADES, EDUCACION, ESPECIALIDADES, HARD_SKILLS, MODALIDADES, SOFT_SKILLS, TURNOS,
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

/** Palabras del título del puesto que arrastran habilidades extra. */
const POR_TITULO: { clave: string; hard: string[]; soft: string[] }[] = [
  { clave: "supervis", hard: ["Excel avanzado"], soft: ["Liderazgo", "Resolución de conflictos", "Gestión del tiempo"] },
  { clave: "gerente", hard: ["Excel avanzado"], soft: ["Liderazgo", "Orientación a resultados", "Gestión del tiempo"] },
  { clave: "jefe", hard: [], soft: ["Liderazgo", "Resolución de conflictos"] },
  { clave: "coordinador", hard: ["Excel avanzado"], soft: ["Gestión del tiempo", "Liderazgo"] },
  { clave: "caj", hard: ["Excel avanzado"], soft: ["Atención al detalle", "Empatía"] },
  { clave: "front", hard: ["React", "Figma"], soft: ["Atención al detalle"] },
  { clave: "back", hard: ["Node.js", "SQL", "Python"], soft: ["Pensamiento analítico"] },
  { clave: "desarroll", hard: ["React", "Node.js", "SQL", "Scrum"], soft: ["Trabajo en equipo"] },
  { clave: "analista", hard: ["SQL", "Excel avanzado", "Power BI"], soft: ["Pensamiento analítico"] },
  { clave: "dato", hard: ["SQL", "Python", "Power BI"], soft: ["Pensamiento analítico"] },
  { clave: "vent", hard: ["CRM", "Negociación comercial", "Prospección en frío"], soft: ["Negociación", "Orientación a resultados"] },
  { clave: "comercial", hard: ["CRM", "Negociación comercial"], soft: ["Negociación", "Comunicación efectiva"] },
  { clave: "soporte", hard: ["Zendesk", "CRM"], soft: ["Empatía", "Adaptabilidad"] },
  { clave: "servicio", hard: ["Zendesk", "CRM"], soft: ["Empatía", "Comunicación efectiva"] },
  { clave: "contab", hard: ["Contabilidad NIF", "Excel avanzado", "SAP"], soft: ["Atención al detalle"] },
  { clave: "financ", hard: ["Modelado financiero", "Excel avanzado"], soft: ["Pensamiento analítico"] },
  { clave: "reclut", hard: ["LMS", "Excel avanzado"], soft: ["Empatía", "Comunicación efectiva"] },
  { clave: "nomina", hard: ["Nómina", "Excel avanzado"], soft: ["Atención al detalle"] },
  { clave: "market", hard: ["Google Ads", "Meta Ads", "SEO"], soft: ["Proactividad"] },
  { clave: "disen", hard: ["Figma"], soft: ["Atención al detalle"] }, // `norm` ya quitó la ñ
];

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
