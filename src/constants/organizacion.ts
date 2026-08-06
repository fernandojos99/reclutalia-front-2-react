/**
 * Marco organizacional de la plantilla del formador: bajo qué unidad de negocio y departamento
 * cuelga el organigrama que se ve en /formador, y contra qué centro de costos se presupuesta.
 *
 * NO vive en el dominio a propósito: `Formador` no tiene estos campos y añadirlos obligaría a
 * tocar el espejo front↔back (dos repos, dos pushes, `db:reset`) por un dato que hoy es solo
 * informativo. El departamento sale del área real del formador; la unidad de negocio y el centro
 * de costos son de demo.
 *
 * Cuando estos datos sean reales, este archivo es el único punto a cambiar.
 */
import type { Formador } from "../types/models/domain";

/** Unidad de negocio del grupo. Fija mientras no exista el dato por formador. */
export const UNIDAD_NEGOCIO = "Elektra";

/** Centros de costos conocidos por departamento. Lo demás cae al número derivado. */
const CENTROS: Record<string, string> = {
  "Ventas": "482031",
  "Datos y Analítica": "731544",
  "Atención a Clientes": "514028",
  "Tecnología": "600217",
};

/**
 * Centro de costos estable para un departamento: siempre 6 dígitos.
 * Determinista por regla del proyecto: el mismo departamento da siempre el mismo número, sin
 * `Math.random`.
 */
function codigoCentro(area: string): string {
  const conocido = CENTROS[area];
  if (conocido) return conocido;
  let h = 0;
  for (let i = 0; i < area.length; i++) h = (h * 31 + area.charCodeAt(i)) % 900000;
  return String(100000 + h);
}

export interface MarcoOrganizacional {
  unidadNegocio: string;
  /** Departamento al que cuelga el organigrama (el área del formador). */
  departamento: string;
  centroCostos: string;
  /** Quién encabeza el organigrama. */
  responsable: string;
  puesto: string;
}

export function marcoOrganizacional(formador: Formador): MarcoOrganizacional {
  const area = formador.area || "Sin área asignada";
  return {
    unidadNegocio: UNIDAD_NEGOCIO,
    departamento: area,
    centroCostos: codigoCentro(area),
    responsable: formador.nombre,
    puesto: formador.puesto,
  };
}
