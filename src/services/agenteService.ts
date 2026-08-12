/**
 * Cliente del agente IA. Se comunica con el backend por SSE (no websockets):
 * hace POST a /agente/chat y lee la respuesta como stream de eventos SSE con
 * fetch + ReadableStream (EventSource no permite POST, por eso parseamos a mano).
 */
import { API_BASE_URL } from "../config/api";
import { leerStreamSSE } from "./sse";

export type Rol = "admin" | "formador" | "candidato";

export interface AgentePayload {
  sessionId: string;
  mensaje: string;
  rol: Rol;
  formadorId?: string;
  candId?: number;
  /** Etapa/pantalla actual (para respuestas contextuales del agente). */
  etapa?: string;
}

/** Eventos que emite el backend (ver runner.ts). */
export type AgenteEvent =
  | { type: "status"; text: string }
  | { type: "tool"; name: string; args: unknown }
  | { type: "token"; text: string }
  | { type: "error"; text: string }
  | { type: "done" };

const SESSION_KEY = "reclutalia_agent_session";

/** sessionId estable por navegador (memoria de sesión del lado servidor). */
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Olvida la sesión actual: el próximo getSessionId() creará una nueva, con lo que el
 * agente arranca sin memoria previa. Se usa al cambiar de perfil para resetear el asistente.
 */
export function resetSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Envía un mensaje y consume el stream SSE. Llama a `onEvent` por cada evento.
 * Devuelve una promesa que resuelve al terminar el stream.
 */
export function enviarMensaje(
  payload: AgentePayload,
  onEvent: (e: AgenteEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  return leerStreamSSE<AgenteEvent>(`${API_BASE_URL}/agente/chat`, payload, onEvent, signal);
}
