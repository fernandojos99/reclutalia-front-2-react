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

export function enviarMensajeMovilidad(
  payload: MovilidadPayload,
  onEvent: (e: MovilidadEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  return leerStreamSSE<MovilidadEvent>(`${API_BASE_URL}/movilidad/chat`, payload, onEvent, signal);
}
