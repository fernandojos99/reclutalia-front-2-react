/**
 * Reglas de movilidad interna, todas derivadas del estado real del colaborador.
 *
 * Nada de aquí se guarda: el estatus y la acción recomendada se CALCULAN cada vez, por la misma
 * razón que la checklist del pipeline en el backend — el proceso avanza también fuera de la
 * pantalla donde se muestran, así que un valor guardado se desincronizaría en cuanto alguien
 * actuara por otro camino.
 *
 * El semáforo también se calcula (Honesteles + desempeño); `c.movilidad` es solo el OVERRIDE que
 * puede fijar el administrador, y cuando existe manda sobre el cálculo.
 */
import { MOVILIDAD, DESEMPENO, PIPE_IDX, UMBRAL_AFINIDAD, DIAS_PERFIL_INACTIVO } from "../constants/catalogos";
import { diasDesde, parseFechaMx } from "./format";
import { matchScore } from "./match";
import type { Candidato, NivelMovilidad, Vacante } from "../types/models/domain";

export type EstadoMovilidad =
  | "Inactivo" | "Actualizado" | "En búsqueda" | "En proceso" | "Seleccionado" | "Contratado";

export type AccionRecomendada = "Transferir" | "Promover" | "Formar" | "Desvincular";

/** ¿Tiene expediente abierto en Honesteles? Un acta en revisión cuenta igual que una levantada. */
export const tieneHonesteles = (c: Candidato): boolean =>
  !!c.honesteles && (!!c.honesteles.enRevision || (c.honesteles.actas?.length ?? 0) > 0);

/**
 * Semáforo que sale del cálculo:
 *
 *   - con cualquier acta en Honesteles → **baja**, sin importar el desempeño;
 *   - sin actas → sigue al desempeño (alto → alta, medio → media, bajo → baja).
 *
 * Devuelve `undefined` si no hay desempeño registrado: sin ese dato no hay semáforo que dar.
 */
export function movilidadCalculada(c: Candidato): NivelMovilidad | undefined {
  if (tieneHonesteles(c)) return "baja";
  if (!c.desempeno) return undefined;
  return c.desempeno === "alto" ? "alta" : c.desempeno === "medio" ? "media" : "baja";
}

/**
 * El semáforo que se pinta en todas partes: el override del administrador si lo hay, y si no el
 * calculado. **Nunca leas `c.movilidad` directamente**: eso es solo el override.
 */
export const movilidadEfectiva = (c: Candidato): NivelMovilidad | undefined =>
  c.movilidad ?? movilidadCalculada(c);

/** Entrada del catálogo del semáforo efectivo, o undefined si no se puede determinar. */
export const nivelMovilidad = (c: Candidato) => MOVILIDAD.find((m) => m.nivel === movilidadEfectiva(c));

export const nivelDesempeno = (c: Candidato) => DESEMPENO.find((d) => d.nivel === c.desempeno);

/** "2 años y 5 meses" a partir de `antiguedadDesde`. Cadena vacía si no hay fecha. */
export function antiguedad(c: Candidato): string {
  const ts = parseFechaMx(c.antiguedadDesde);
  if (!ts) return "";
  const meses = Math.max(0, Math.floor((Date.now() - ts) / (86_400_000 * 30.44)));
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const pa = a ? `${a} ${a === 1 ? "año" : "años"}` : "";
  const pm = m ? `${m} ${m === 1 ? "mes" : "meses"}` : "";
  return [pa, pm].filter(Boolean).join(" y ") || "menos de un mes";
}

/** "hace 7 días" / "hoy" / "hace 4 meses", para la columna de última actualización. */
export function haceCuanto(fecha?: string): string {
  if (!fecha) return "sin registro";
  const d = diasDesde(fecha);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const m = Math.floor(d / 30);
  return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
}

/** El colaborador lleva más de 6 meses sin tocar su ficha. */
export const perfilInactivo = (c: Candidato): boolean =>
  !c.perfilActualizado || diasDesde(c.perfilActualizado) > DIAS_PERFIL_INACTIVO;

/**
 * Avance del plan de desarrollo. Es el "índice de completitud" de la vista del agente y NO altera
 * el semáforo: son dos cosas distintas a propósito.
 */
export function avancePlan(c: Candidato): { hechas: number; total: number; pct: number } {
  const hs = c.planDesarrollo?.habilidades ?? [];
  const hechas = hs.filter((h) => h.hecha).length;
  return { hechas, total: hs.length, pct: hs.length ? Math.round((hechas / hs.length) * 100) : 0 };
}

/** Vacantes abiertas ordenadas por afinidad con el perfil del colaborador. */
export function rankingVacantes(c: Candidato, vacantes: Vacante[]) {
  return vacantes
    .filter((v) => v.estado === "abierta" && v.req.tipoVacante !== "Confidencial")
    .map((v) => ({ v, afinidad: matchScore(c, v.req) }))
    .sort((a, b) => b.afinidad - a.afinidad);
}

/** ¿Tiene al menos una vacante abierta por encima del umbral de afinidad? */
export const tieneOportunidad = (c: Candidato, vacantes: Vacante[]): boolean =>
  rankingVacantes(c, vacantes).some((r) => r.afinidad >= UMBRAL_AFINIDAD);

/** Procesos del colaborador en cualquier vacante, del más avanzado al menos. */
const avanceMaximo = (c: Candidato, vacantes: Vacante[]): number =>
  vacantes.reduce((max, v) => {
    const p = v.pipeline[c.id];
    return p ? Math.max(max, PIPE_IDX[p.estado] ?? -1) : max;
  }, -1);

/**
 * Estatus del colaborador. El avance en un proceso manda sobre el estado de la ficha: alguien que
 * está entrevistándose es cualquier cosa menos "Inactivo", tenga la ficha como la tenga.
 *
 * "En proceso" se define como haber llegado a `evaluado`, que es exactamente el punto en el que el
 * candidato terminó su video-entrevista con IA.
 */
export function estatusMovilidad(c: Candidato, vacantes: Vacante[]): EstadoMovilidad {
  const avance = avanceMaximo(c, vacantes);
  if (avance >= PIPE_IDX.contratado) return "Contratado";
  if (avance >= PIPE_IDX.seleccionado) return "Seleccionado";
  if (avance >= PIPE_IDX.evaluado) return "En proceso";
  if (c.planDesarrollo) return "En búsqueda";
  return perfilInactivo(c) ? "Inactivo" : "Actualizado";
}

/**
 * Acción que se le recomienda al formador.
 *
 * Las reglas no cubren todos los cruces posibles, así que se evalúan EN ORDEN y lo que no encaje en
 * ninguna cae en **"Formar"**: ante la duda, desarrollar a la persona.
 *
 * "Agradecer" ya no está aquí. Dejó de ser una recomendación y pasó a ser un botón que aparece
 * cuando el colaborador queda "Contratado" en otra vacante.
 */
export function accionRecomendada(c: Candidato, vacantes: Vacante[]): AccionRecomendada {
  // El efectivo, no el override: si no, un colaborador sin override nunca encajaría en las reglas.
  const mov = movilidadEfectiva(c);
  const des = c.desempeno;
  const actualizado = !perfilInactivo(c);
  const oportunidad = tieneOportunidad(c, vacantes);

  if (mov === "alta" && des === "medio" && actualizado && oportunidad) return "Transferir";
  if (mov === "alta" && des === "alto" && actualizado && !oportunidad) return "Promover";
  if (mov === "baja" && des === "bajo" && !actualizado && !oportunidad) return "Desvincular";
  // Ante la duda, desarrollar: es el default del documento y evita dejar filas sin recomendación.
  return "Formar";
}

/** Cuántas vacantes abiertas superan el umbral de afinidad con este colaborador. */
export const vacantesAfines = (c: Candidato, vacantes: Vacante[]): number =>
  rankingVacantes(c, vacantes).filter((r) => r.afinidad >= UMBRAL_AFINIDAD).length;

/**
 * Estatus del expediente en Honesteles, la plataforma de actas administrativas.
 *
 * Se DERIVA de las actas y del indicador de revisión. No hay ningún campo `estatus` guardado a
 * propósito: podría decir "sin actas" teniendo dos, que es la contradicción que este módulo evita
 * en todas partes.
 *
 * Devuelve `undefined` cuando no hay expediente sincronizado, que no es lo mismo que estar limpio.
 */
export function estatusHonesteles(c: Candidato): { etiqueta: string; tono: string; n: number } | undefined {
  const h = c.honesteles;
  if (!h) return undefined;
  const n = h.actas?.length ?? 0;
  if (h.enRevision) return { etiqueta: "Acta en revisión", tono: "gold", n };
  if (!n) return { etiqueta: "Sin actas administrativas", tono: "ok", n: 0 };
  return { etiqueta: `${n} ${n === 1 ? "acta administrativa" : "actas administrativas"}`, tono: "bad", n };
}

/**
 * Afinidad entre DOS colaboradores, para cubrir un puesto que va a quedar libre.
 *
 * `matchScore` no sirve aquí: compara un candidato contra un `Requisito`, y el puesto que deja
 * alguien que se mueve no es una vacante todavía —es justo lo que hay que prever—. Se mide el
 * solapamiento de especialidades, técnicas y blandas contra el perfil de quien se va, con el mismo
 * reparto de pesos que el motor de match (especialidades por encima de todo) y sin azar.
 */
export function afinidadEntre(candidato: Candidato, referencia: Candidato): number {
  const solape = (a: string[], b: string[]): number =>
    b.length ? a.filter((x) => b.includes(x)).length / b.length : 0;

  let s = 0;
  s += solape(candidato.esp, referencia.esp) * 55;
  s += solape(candidato.hard, referencia.hard) * 25;
  s += solape(candidato.soft, referencia.soft) * 10;
  if (candidato.area === referencia.area) s += 6;
  if (candidato.ciudad === referencia.ciudad) s += 4;
  return Math.min(98, Math.round(s));
}

/**
 * Perfiles que podrían cubrir el puesto de quien inicia una movilidad.
 *
 * Solo entran los de **semáforo verde**, como pide el documento: alguien con movilidad baja no es
 * candidato a moverse por muy afín que sea su perfil.
 */
export function candidatosParaCubrir(referencia: Candidato, todos: Candidato[], limite = 4) {
  return todos
    .filter((c) => c.id !== referencia.id && c.tipo === "interno" && c.movilidad === "alta")
    .map((c) => ({ c, afinidad: afinidadEntre(c, referencia) }))
    .sort((a, b) => b.afinidad - a.afinidad)
    .slice(0, limite);
}

/** Colaboradores del equipo con un proceso de movilidad en curso. */
export const enMovilidad = (equipo: Candidato[]): Candidato[] =>
  equipo.filter((c) => !!c.movilidadActivaVacId);

/** Tono de `Chip` para cada acción, para pintarlas igual en toda la aplicación. */
export const TONO_ACCION: Record<AccionRecomendada, string> = {
  Transferir: "ok",
  Promover: "ok",
  Formar: "gold",
  Desvincular: "bad",
};
