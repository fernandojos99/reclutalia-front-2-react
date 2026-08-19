/**
 * Genera y descarga la carta oferta (demo, en cliente). Mismo patrón que `descargarCV`: un HTML
 * en un Blob, sin servidor ni PDF real.
 *
 * Para un colaborador INTERNO no se imprime el sueldo nuevo, ni la sede, ni la fecha de ingreso:
 * son datos que su proceso de transferencia todavía no ha fijado, y ponerlos en un documento
 * descargable los volvería un compromiso.
 */
import { money } from "./format";
import type { Candidato, PipelineEntry, Vacante } from "../types/models/domain";

export function descargarOferta(c: Candidato, v: Vacante, p: PipelineEntry): void {
  const interno = c.tipo === "interno";
  const filas: [string, string][] = [
    ["Puesto", v.req.titulo],
    ["Área", v.req.departamento || v.req.area],
  ];
  if (interno) {
    filas.push(["Sueldo mensual actual", money(c.sueldoActual ?? 0)]);
    filas.push(["Fecha de ingreso y sede", "Se confirman al completar el trámite de transferencia"]);
  } else {
    filas.push(["Sueldo mensual bruto", money(p.oferta?.monto ?? 0)]);
    filas.push(["Fecha de ingreso", p.oferta?.fecha ?? ""]);
    filas.push(["Te presentarás en", p.oferta?.ubicacion ?? ""]);
  }

  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Carta oferta ${c.nombre}</title>
  <body style="font-family:Segoe UI,Arial,sans-serif;max-width:720px;margin:40px auto;color:#1A1A1A">
  <div style="border-bottom:4px solid #FFB81C;padding-bottom:12px">
    <h1 style="margin:0">Carta oferta</h1>
    <p style="margin:4px 0;color:#555">${c.nombre} · ${v.id}</p>
  </div>
  <p>Estimado(a) ${c.nombre}: nos complace ofrecerte la siguiente posición dentro del grupo.</p>
  <table style="border-collapse:collapse;width:100%;margin:18px 0">
    ${filas.map(([k, val]) => `<tr>
      <td style="padding:8px 0;color:#555;width:220px">${k}</td>
      <td style="padding:8px 0"><b>${val}</b></td></tr>`).join("")}
  </table>
  ${interno
    ? `<p>Por tratarse de un movimiento interno de transferencia, tu fecha de ingreso y tu nueva sede
       se te notificarán cuando concluya el trámite, que puede tomar entre 2 y 4 semanas.</p>`
    : ""}
  <p style="margin-top:30px;font-size:11px;color:#999">Documento generado por Radar de Candidatos (prototipo demo).</p>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Carta_oferta_${c.nombre.replace(/ /g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}
