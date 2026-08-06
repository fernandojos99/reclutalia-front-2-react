/**
 * Marco organizacional de la plantilla del formador: a qué organización pertenece el organigrama
 * que se ve en /formador y contra qué centro de costos se presupuesta.
 *
 * NO vive en el dominio a propósito: `Formador` no tiene estos campos y añadirlos obligaría a
 * tocar el espejo front↔back (dos repos, dos pushes, `db:reset`) por un dato que hoy es solo
 * informativo. Se deriva de lo que ya existe: el área del formador y la unidad de negocio que
 * traen sus vacantes.
 *
 * Cuando el centro de costos sea un dato real, este archivo es el único punto a cambiar.
 */
import type { Formador, Vacante } from "../types/models/domain";

/** Centros de costos conocidos por área. Lo demás cae al código derivado. */
const CENTROS: Record<string, string> = {
  "Ventas": "CC-4820",
  "Datos y Analítica": "CC-7315",
  "Atención a Clientes": "CC-5140",
  "Tecnología": "CC-6002",
};

/**
 * Código de centro de costos estable para un área.
 * Determinista por regla del proyecto: la misma área da siempre el mismo código, sin `Math.random`.
 */
function codigoCentro(area: string): string {
  const conocido = CENTROS[area];
  if (conocido) return conocido;
  let h = 0;
  for (let i = 0; i < area.length; i++) h = (h * 31 + area.charCodeAt(i)) % 9000;
  return `CC-${1000 + h}`;
}

/** Unidad de negocio predominante entre las vacantes del formador (la más repetida). */
function unidadPredominante(vacantes: Vacante[]): string {
  const cuenta = new Map<string, number>();
  for (const v of vacantes) {
    const u = v.req.unidadNegocio?.trim();
    if (u) cuenta.set(u, (cuenta.get(u) ?? 0) + 1);
  }
  let mejor = "";
  let max = 0;
  // Se recorre en orden de inserción: ante empate gana la primera, así el resultado no depende
  // del orden de iteración del Map.
  for (const [u, n] of cuenta) if (n > max) { mejor = u; max = n; }
  return mejor;
}

export interface MarcoOrganizacional {
  /** Área/organización a la que cuelga el organigrama. */
  organizacion: string;
  /** Unidad de negocio predominante; cadena vacía si ninguna vacante la trae. */
  unidadNegocio: string;
  centroCostos: string;
  /** Quién encabeza el organigrama. */
  responsable: string;
  puesto: string;
}

export function marcoOrganizacional(formador: Formador, vacantes: Vacante[]): MarcoOrganizacional {
  const area = formador.area || "Sin área asignada";
  return {
    organizacion: area,
    unidadNegocio: unidadPredominante(vacantes),
    centroCostos: codigoCentro(area),
    responsable: formador.nombre,
    puesto: formador.puesto,
  };
}
