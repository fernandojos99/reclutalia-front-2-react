/**
 * Lectura y escritura del markdown de `req.descripcion`, que es donde viven de verdad las
 * secciones del anuncio.
 *
 * Ni "Objetivo del puesto" ni "Funciones principales" son campos del dominio: son listas de bullets
 * bajo un encabezado en negrita dentro de ese markdown. Editarlas es reescribir ese trozo dejando
 * el resto intacto — así el anuncio gana secciones editables sin tocar `Requisito` ni, por tanto,
 * el espejo front↔back.
 */

export const OBJETIVO = "Objetivo del puesto";
export const FUNCIONES = "Funciones principales";

/** Encabezados que el anuncio sí muestra, EN ORDEN. El resto del markdown se recorta. */
const SECCIONES_VISIBLES = [OBJETIVO, FUNCIONES];

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

/** Índices [inicio, fin) del cuerpo de una sección dentro del array de líneas. */
function rangoSeccion(lineas: string[], titulo: string): [number, number] | null {
  const ini = lineas.findIndex((l) => encabezado(l) === titulo);
  if (ini === -1) return null;
  let fin = ini + 1;
  while (fin < lineas.length && encabezado(lineas[fin]) === null) fin++;
  return [ini + 1, fin];
}

/**
 * Contenido de una sección, un elemento por línea con sentido.
 *
 * Acepta bullets y párrafos: una descripción heredada puede traer el objetivo como texto corrido,
 * y descartarlo por no empezar con "- " sería perder el contenido al editarlo. Al guardar, todo
 * vuelve como bullets.
 */
export function leerSeccion(md: string, titulo: string): string[] {
  const lineas = md.split("\n");
  const rango = rangoSeccion(lineas, titulo);
  if (!rango) return [];
  return lineas
    .slice(rango[0], rango[1])
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith("- ") ? l.slice(2).trim() : l))
    .filter(Boolean);
}

/** ¿La descripción trae ya esta sección? Si no, se creará al guardar. */
export const tieneSeccion = (md: string, titulo: string): boolean =>
  rangoSeccion(md.split("\n"), titulo) !== null;

/**
 * Sustituye el cuerpo de una sección conservando el resto del markdown tal cual.
 *
 * Si la sección no existe la CREA, y la coloca respetando el orden de `SECCIONES_VISIBLES`: el
 * objetivo tiene que quedar por encima de las funciones aunque se escriba después. Sin esto, las
 * vacantes nuevas —que nacen con descripción de texto libre— no tendrían forma de estrenarlas.
 */
export function escribirSeccion(md: string, titulo: string, items: string[]): string {
  const lineas = md.split("\n");
  const rango = rangoSeccion(lineas, titulo);
  const bullets = items.map((f) => f.trim()).filter(Boolean).map((f) => `- ${f}`);

  if (rango) {
    return [...lineas.slice(0, rango[0]), "", ...bullets, "", ...lineas.slice(rango[1])].join("\n");
  }
  if (!bullets.length) return md;

  const bloque = [`**${titulo}**`, "", ...bullets, ""];
  // Primera sección visible que deba ir DESPUÉS de esta: el bloque nuevo se inserta justo antes.
  const posteriores = SECCIONES_VISIBLES.slice(SECCIONES_VISIBLES.indexOf(titulo) + 1);
  const corte = lineas.findIndex((l) => {
    const t = encabezado(l);
    return t ? posteriores.includes(t) : false;
  });
  if (corte !== -1) return [...lineas.slice(0, corte), ...bloque, ...lineas.slice(corte)].join("\n");

  const base = md.trimEnd();
  return [...(base ? [base, ""] : []), ...bloque].join("\n");
}

// Azúcar con nombre para las dos secciones que edita el anuncio.
export const leerObjetivo = (md: string): string[] => leerSeccion(md, OBJETIVO);
export const escribirObjetivo = (md: string, xs: string[]): string => escribirSeccion(md, OBJETIVO, xs);
export const leerFunciones = (md: string): string[] => leerSeccion(md, FUNCIONES);
export const escribirFunciones = (md: string, xs: string[]): string => escribirSeccion(md, FUNCIONES, xs);
