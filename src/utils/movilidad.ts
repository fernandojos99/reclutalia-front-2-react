/**
 * Reglas de movilidad interna, todas derivadas del estado real del colaborador.
 *
 * Nada de aquí se guarda: el estatus y la acción recomendada se CALCULAN cada vez, por la misma
 * razón que la checklist del pipeline en el backend — el proceso avanza también fuera de la
 * pantalla donde se muestran, así que un valor guardado se desincronizaría en cuanto alguien
 * actuara por otro camino.
 *
 * La única excepción es el semáforo (`c.movilidad`), que sí es un dato: lo decide el administrador.
 */
import { MOVILIDAD, DESEMPENO, PIPE_IDX, UMBRAL_AFINIDAD, DIAS_PERFIL_INACTIVO } from "../constants/catalogos";
import { diasDesde, parseFechaMx } from "./format";
import { matchScore } from "./match";
import type { Candidato, Vacante } from "../types/models/domain";

export type EstadoMovilidad =
  | "Inactivo" | "Actualizado" | "En búsqueda" | "En proceso" | "Seleccionado" | "Contratado";

export type AccionRecomendada =
  | "Transferir" | "Promover" | "Formar" | "Desvincular" | "Agradecer" | "Sin acción";

/** Entrada del catálogo del semáforo, o undefined si el candidato no tiene movilidad definida. */
export const nivelMovilidad = (c: Candidato) => MOVILIDAD.find((m) => m.nivel === c.movilidad);

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

/** El colaborador lleva más de un mes sin tocar su ficha. */
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
 * Las reglas del documento original no cubren todos los cruces posibles (p. ej. movilidad alta con
 * desempeño medio y sin vacantes afines), así que se evalúan EN ORDEN y lo que no encaje en ninguna
 * cae en "Sin acción" en vez de forzar una recomendación equivocada.
 *
 * "Agradecer" no venía definida: se interpreta como el colaborador que rinde alto pero tiene
 * movilidad baja — no se va a mover, así que toca reconocerlo y retenerlo.
 */
export function accionRecomendada(c: Candidato, vacantes: Vacante[]): AccionRecomendada {
  const mov = c.movilidad;
  const des = c.desempeno;
  const actualizado = !perfilInactivo(c);
  const oportunidad = tieneOportunidad(c, vacantes);

  if (mov === "alta" && des === "medio" && actualizado && oportunidad) return "Transferir";
  if (mov === "alta" && des === "alto" && actualizado && !oportunidad) return "Promover";
  if (mov === "media" && des === "medio") return "Formar";
  if (mov === "baja" && des === "bajo" && !actualizado && !oportunidad) return "Desvincular";
  if (mov === "baja" && des === "alto") return "Agradecer";
  return "Sin acción";
}

/** Tono de `Chip` para cada acción, para pintarlas igual en toda la aplicación. */
export const TONO_ACCION: Record<AccionRecomendada, string> = {
  Transferir: "ok",
  Promover: "ok",
  Formar: "gold",
  Desvincular: "bad",
  Agradecer: "gold",
  "Sin acción": "",
};
