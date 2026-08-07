/**
 * Títulos alternativos "sugeridos por IA" para una vacante, orientados a atraer más candidatos.
 *
 * Simulación determinista, igual que `skillsSugeridas()` o el dictado por voz: el mismo puesto da
 * siempre las mismas cinco propuestas. El proyecto prohíbe la aleatoriedad real, y unas
 * sugerencias que cambiaran en cada render se leerían como un fallo.
 *
 * Las plantillas ENVUELVEN el título en vez de reescribirlo por dentro. Intentar declinar el
 * sustantivo ("Cajero" → "Supervisor de Cajero") produce español torcido, porque haría falta un
 * léxico que sepa que el oficio es "Caja" y la persona "Cajero".
 *
 * Cuando haya un modelo detrás, este archivo es el único punto a reemplazar.
 */

type Plantilla = (titulo: string, area: string) => string;

const PLANTILLAS: Plantilla[] = [
  (t) => `${t} Senior`,
  (t, a) => `${t} · ${a}`,
  (t) => `${t} — Contratación inmediata`,
  (_t, a) => `Especialista en ${a}`,
  (t) => `${t} (Plan de carrera)`,
  (t) => `${t} — Sucursal`,
];

/** Desplazamiento estable: dos puestos distintos no reciben la lista en el mismo orden. */
function semilla(sem: string): number {
  let h = 7919;
  for (let i = 0; i < sem.length; i++) h = (h * 31 + sem.charCodeAt(i)) % 100_000;
  return h;
}

/** Cinco alternativas al título, sin repetir el original ni entre sí. */
export function titulosSugeridos(titulo: string, area: string): string[] {
  const t = titulo.trim();
  const a = (area || "").trim() || "el área";
  const s = semilla(`${t}·${a}`);

  const vistos = new Set<string>([t.toLowerCase()]);
  const salida: string[] = [];

  for (let i = 0; i < PLANTILLAS.length && salida.length < 5; i++) {
    const propuesta = PLANTILLAS[(s + i) % PLANTILLAS.length](t, a).replace(/\s+/g, " ").trim();
    const clave = propuesta.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(propuesta);
  }
  return salida;
}
