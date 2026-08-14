/**
 * Cliente del AGENTE DE MOVILIDAD. Ruta y sesión propias, distintas de las del agente general.
 *
 * El `sessionId` va con prefijo "mov-" porque los dos agentes guardan su memoria en las mismas
 * tablas: sin el prefijo, una conversación de movilidad se mezclaría con la del asistente general.
 */
import { API_BASE_URL } from "../config/api";
import { leerStreamSSE } from "./sse";

export interface MovilidadPayload {
  sessionId: string;
  mensaje: string;
  candId: number;
}

/** Eventos que emite el backend (ver agent-movilidad/runner.ts). */
export type MovilidadEvent =
  | { type: "status"; text: string }
  | { type: "tool"; name: string; args: unknown }
  | { type: "token"; text: string }
  | { type: "error"; text: string }
  | { type: "done" };

const SESSION_KEY = "reclutalia_movilidad_session";

/** `sessionId` estable por navegador y por colaborador. */
export function getSessionMovilidad(candId: number): string {
  const clave = `${SESSION_KEY}_${candId}`;
  let id = localStorage.getItem(clave);
  if (!id) {
    id = `mov-${candId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(clave, id);
  }
  return id;
}

/** Olvida la conversación: el siguiente mensaje arranca sin memoria previa. */
export function resetSessionMovilidad(candId: number): void {
  localStorage.removeItem(`${SESSION_KEY}_${candId}`);
}

/** Cierre del formador: agradece al colaborador y deja el resumen en su historial. */
export async function agradecerColaborador(
  cid: number, formadorId: string, mensaje: string, resumen: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/movilidad/${cid}/agradecer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formadorId, mensaje, resumen }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error((d && (d.message as string)) || `Error HTTP ${res.status}`);
  }
}

/**
 * Dispara el barrido de "Inactivo" del equipo. Se llama al abrir el módulo porque a ese estatus se
 * llega por el paso del tiempo, sin que nadie actúe, así que ningún evento puede detectarlo.
 */
export async function barrerInactivos(formadorId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/movilidad/equipo/${formadorId}/barrer-inactivos`, { method: "POST" })
    .catch(() => { /* el barrido es accesorio: si falla, la pantalla se ve igual */ });
}

export function enviarMensajeMovilidad(
  payload: MovilidadPayload,
  onEvent: (e: MovilidadEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  return leerStreamSSE<MovilidadEvent>(`${API_BASE_URL}/movilidad/chat`, payload, onEvent, signal);
}
