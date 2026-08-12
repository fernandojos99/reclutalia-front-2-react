/**
 * Lectura de un stream SSE abierto con POST.
 *
 * `EventSource` no permite POST, así que hay que parsear el stream a mano. Esto es transporte puro
 * —bytes y separadores— y lo comparten el agente general y el de movilidad: duplicar el parser
 * sería copiar un bucle de bytes, no separar dos agentes.
 */

/** Hace el POST y llama a `onEvent` por cada evento del stream. Resuelve al cerrarse. */
export async function leerStreamSSE<E>(
  url: string,
  payload: unknown,
  onEvent: (e: E) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Error del agente (HTTP ${res.status}). ${detalle.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Los eventos SSE llegan separados por línea en blanco (\n\n).
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const bloque = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const linea = bloque.split("\n").find((l) => l.startsWith("data:"));
      if (!linea) continue;
      try {
        onEvent(JSON.parse(linea.slice(5).trim()) as E);
      } catch {
        /* ignora bloques no-JSON (p. ej. comentarios keep-alive) */
      }
    }
  }
}
