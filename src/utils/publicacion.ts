/**
 * Lectura y escritura del markdown de `req.descripcion`, que es donde viven de verdad las
 * secciones del anuncio.
 *
 * Las "Funciones principales" NO son un campo del dominio: son una lista de bullets bajo un
 * encabezado en negrita dentro de ese markdown. Editarlas es reescribir ese trozo dejando el
 * resto intacto.
 */

/** Encabezados del markdown que el anuncio sí muestra; el resto se recorta. */
const SECCIONES_VISIBLES = ["Objetivo del puesto", "Funciones principales"];

const FUNCIONES = "Funciones principales";

/** ¿Es esta línea un encabezado `**Título**`? Devuelve el título o null. */
function encabezado(linea: string): string | null {
  const m = linea.trim().match(/^\*\*(.+?)\*\*$/);
  return m ? m[1].trim() : null;
}

/**
 * Corta la descripción en el primer encabezado que no esté en la lista visible.
 * Sin encabezados reconocibles (descripción de texto libre), se respeta íntegra.
 */
export function recortarDescripcion(md: string): string {
  const lineas = md.split("\n");
  const corte = lineas.findIndex((l) => {
    const t = encabezado(l);
    return t ? !SECCIONES_VISIBLES.includes(t) : false;
  });
  return corte === -1 ? md : lineas.slice(0, corte).join("\n").trimEnd();
}

/** Índices [inicio, fin) del cuerpo de la sección de funciones dentro del array de líneas. */
function rangoFunciones(lineas: string[]): [number, number] | null {
  const ini = lineas.findIndex((l) => encabezado(l) === FUNCIONES);
  if (ini === -1) return null;
  let fin = ini + 1;
  while (fin < lineas.length && encabezado(lineas[fin]) === null) fin++;
  return [ini + 1, fin];
}

/** Bullets bajo "Funciones principales". Vacío si la descripción no trae esa sección. */
export function leerFunciones(md: string): string[] {
  const lineas = md.split("\n");
  const rango = rangoFunciones(lineas);
  if (!rango) return [];
  return lineas
    .slice(rango[0], rango[1])
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

/** ¿La descripción tiene la sección editable? Si no, el editor debe avisar en vez de mentir. */
export const tieneFunciones = (md: string): boolean => rangoFunciones(md.split("\n")) !== null;

/** Sustituye los bullets de funciones conservando el resto del markdown tal cual. */
export function escribirFunciones(md: string, funciones: string[]): string {
  const lineas = md.split("\n");
  const rango = rangoFunciones(lineas);
  if (!rango) return md;
  const cuerpo = ["", ...funciones.map((f) => `- ${f.trim()}`), ""];
  return [...lineas.slice(0, rango[0]), ...cuerpo, ...lineas.slice(rango[1])].join("\n");
}
