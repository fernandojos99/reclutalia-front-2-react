/**
 * Detecta la etapa/contexto del usuario en la VISTA DE CHAT integrada, para elegir los chips de
 * preguntas y avisar al agente. El chat solo existe para formador y candidato:
 *   - candidato → estado de su proceso más avanzado (cand_<estado>) / cand_sin / cand_cerrado / cand_contratado.
 *   - formador  → form_home (la vista de chat no está anclada a una vacante concreta).
 *
 * `stageKey` elige los chips locales (`preguntasContextuales.ts`) y `label` es lo que viaja al
 * agente como contexto. Por eso el formador conserva el `stageKey` fijo —es el único set de
 * preguntas que tiene— pero su `label` sí describe en qué punto están sus vacantes: antes mandaba
 * un "Inicio / Mis vacantes" a secas y el agente se quedaba sin saber sobre qué estaba trabajando,
 * justo en el rol que opera el pipeline.
 *
 * El label solo reporta HECHOS (estado de la vacante y estados del pipeline). Deducir a quién le
 * toca actuar es cosa del agente, que tiene el mapa del flujo en su prompt: replicarlo aquí sería
 * otra copia que mantener a mano entre los dos repos.
 */
import { PIPE_IDX } from "../constants/catalogos";
import type { Vacante } from "../types/models/domain";

const TERMINALES = ["descartado", "filtrado", "rechazado"];

export interface Etapa {
  stageKey: string;
  label: string;
}

export function etapaChat(
  rol: string,
  vacantes: Vacante[],
  candId?: number,
  formadorId?: string,
): Etapa {
  if (rol === "candidato" && candId != null) {
    const procesos = vacantes.filter((v) => v.pipeline[candId]);
    if (!procesos.length) return { stageKey: "cand_sin", label: "Sin postulaciones activas" };

    const activos = procesos.filter((v) => {
      const e = v.pipeline[candId].estado;
      return e !== "contratado" && !TERMINALES.includes(e);
    });
    if (!activos.length) {
      const contratado = procesos.some((v) => v.pipeline[candId].estado === "contratado");
      return contratado
        ? { stageKey: "cand_contratado", label: "Contratado" }
        : { stageKey: "cand_cerrado", label: "Proceso cerrado" };
    }

    const mejor = activos.reduce((a, b) =>
      (PIPE_IDX[b.pipeline[candId].estado] ?? -1) > (PIPE_IDX[a.pipeline[candId].estado] ?? -1) ? b : a);
    const estado = mejor.pipeline[candId].estado;
    return { stageKey: `cand_${estado}`, label: `Tu proceso está en la etapa "${estado}"` };
  }

  if (rol === "formador") {
    // `useData()` trae TODAS las vacantes; las páginas del formador filtran por `formadorId` y aquí
    // hay que hacer lo mismo, o el agente recibiría de contexto vacantes que no son suyas.
    const mias = vacantes.filter((v) => v.formadorId === formadorId);
    return { stageKey: "form_home", label: resumenFormador(mias) };
  }
  return { stageKey: "default", label: "General" };
}

/** Cuántas vacantes se describen antes de resumir el resto, para no inflar el prompt del agente. */
const MAX_VACANTES = 4;

/** "Inicio / Mis vacantes" + en qué punto está cada vacante del formador y su pipeline. */
function resumenFormador(vacantes: Vacante[]): string {
  if (!vacantes.length) return "Inicio / Mis vacantes · todavía no tienes vacantes asignadas";

  // Las cerradas al final: lo que importa es sobre lo que se puede actuar.
  const orden = [...vacantes].sort(
    (a, b) => Number(a.estado === "cerrada") - Number(b.estado === "cerrada"),
  );

  const descritas = orden.slice(0, MAX_VACANTES).map((v) => {
    const activos = Object.values(v.pipeline).filter((p) => !TERMINALES.includes(p.estado));
    if (!activos.length) return `${v.id} "${v.req.titulo}" (${v.estado}, sin candidatos en proceso)`;

    const porEstado = activos.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado] = (acc[p.estado] ?? 0) + 1;
      return acc;
    }, {});
    const detalle = Object.entries(porEstado)
      .sort((a, b) => (PIPE_IDX[b[0]] ?? 0) - (PIPE_IDX[a[0]] ?? 0))
      .map(([estado, n]) => `${n} en ${estado}`)
      .join(", ");
    return `${v.id} "${v.req.titulo}" (${v.estado}; ${detalle})`;
  });

  const resto = orden.length - descritas.length;
  return `Inicio / Mis vacantes · ${descritas.join(" · ")}${resto > 0 ? ` · y ${resto} más` : ""}`;
}
