/**
 * Retratos y números de empleado de demo para el organigrama.
 *
 * La elección NO es aleatoria: se deriva del identificador de la persona, así que la misma
 * persona muestra siempre la misma cara. Es requisito del proyecto (todo debe ser reproducible)
 * y además una cara que cambiara en cada repintado se leería como un error.
 *
 * Las fotos son de `randomuser.me`, material de demo. Cuando haya fotos reales, este archivo es
 * el único punto a cambiar.
 */
import mujer1 from "../assets/personas/mujer-44.jpg";
import mujer2 from "../assets/personas/mujer-68.jpg";
import mujer3 from "../assets/personas/mujer-90.jpg";

const FOTOS = [mujer1, mujer2, mujer3];

/**
 * Hash estable de una cadena.
 *
 * La mezcla final no es adorno: con una sola pasada, los ids de un carácter ("1", "2", "3") caen
 * en valores consecutivos y los números de empleado saldrían correlativos. El factor de Knuth los
 * dispersa. Se mantiene por debajo de `Number.MAX_SAFE_INTEGER` (1e6 · 2.6e9 ≈ 2.6e15).
 */
function hash(sem: string): number {
  let h = 7919;
  for (let i = 0; i < sem.length; i++) h = (h * 31 + sem.charCodeAt(i)) % 1_000_000;
  return (h * 2_654_435_761) % 1_000_000;
}

/** Retrato de demo para una persona, estable entre recargas. */
export function fotoDe(id: string | number): string {
  return FOTOS[hash(String(id)) % FOTOS.length];
}

/** Número de empleado de demo (6 dígitos), derivado del id. No vive en el dominio: es decorativo. */
export function numeroEmpleado(id: string | number): string {
  return String(100_000 + (hash(String(id)) % 900_000));
}
