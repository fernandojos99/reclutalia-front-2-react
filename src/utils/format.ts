/** Helpers de formato y presentación (portados de `App.jsx`). */
import { DIRECCION_CORP } from "../constants/catalogos";

export const money = (n: number): string => "$" + Number(n).toLocaleString("es-MX");

export const hoy = (): string =>
  new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

/** Días transcurridos desde la creación (usa creadaTs; fallback: parsea el string `creada`). */
export function diasActiva(v: { creadaTs?: number; creada?: string }): number {
  const ts = v.creadaTs ?? parseFechaMx(v.creada);
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
}

/** Días transcurridos desde una fecha es-MX ("12 abr 2026"). 0 si no se puede parsear. */
export function diasDesde(fecha?: string): number {
  const ts = parseFechaMx(fecha);
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
}

/** Etiqueta legible: "Hoy" / "1 día activa" / "N días activa". */
export const diasActivaLabel = (v: { creadaTs?: number; creada?: string }): string => {
  const n = diasActiva(v);
  return n === 0 ? "Hoy" : `${n} ${n === 1 ? "día" : "días"} activa`;
};

/**
 * Parsea "01 jul 2026" → timestamp ms. 0 si no cuadra.
 *
 * Ojo: `fechaVal` NO sirve para esto. Devuelve un número ordenable (aaaammdd comprimido), no una
 * fecha real, así que no se le pueden restar días.
 */
export function parseFechaMx(s?: string): number {
  if (!s) return 0;
  const m = /(\d{1,2})\s+([a-zá]{3,})\s+(\d{4})/i.exec(s);
  if (!m) return 0;
  const mes = MESES3.indexOf(m[2].slice(0, 3).toLowerCase());
  return mes < 0 ? 0 : new Date(Number(m[3]), mes, Number(m[1])).getTime();
}

/** Color del ring por banda de ranking. */
export const bandCol = (v: number): string =>
  v >= 90 ? "var(--ok)" : v >= 70 ? "#3E9B5F" : v >= 50 ? "#8B5E34" : "var(--gray)";

const MESES3 = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2021-03" → "mar 2021". */
export function fmtMes(s: string): string {
  if (!s) return "";
  const [y, m] = String(s).split("-");
  return (MESES3[Number(m) - 1] || "") + " " + y;
}

/** Rango de fechas con "Actual" si no hay fin. */
export function rangoFechas(inicio: string, fin: string): string {
  const a = fmtMes(inicio);
  const b = fin ? fmtMes(fin) : "Actual";
  return a ? `${a} – ${b}` : "";
}

export const mapsUrl = (dir?: string): string =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(dir || DIRECCION_CORP);

/** Folio de cita presencial determinista de 4 dígitos (por vacante+candidato). */
export const folioCita = (vacId: string, cid: number): string => {
  const base = [...vacId].reduce((a, ch) => a + ch.charCodeAt(0), 0) + cid * 137;
  return String(1000 + (base % 9000));
};

export const numEmpleado = (cid: number): string =>
  String(1_000_000 + (cid * 73_573) % 9_000_000).slice(0, 7);

const MESES_ABR: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};
/** Convierte "01 jul 2026" en un número ordenable (para "Buscar vacantes"). */
export function fechaVal(s: string): number {
  const m = String(s ?? "").toLowerCase().match(/(\d{1,2})\s+([a-zñ]{3})\.?\s+(\d{4})/);
  if (!m) return 0;
  return Number(m[3]) * 10_000 + (MESES_ABR[m[2]] ?? 0) * 100 + Number(m[1]);
}

/** Próximos n días (para agendar el examen médico dentro de la próxima semana). */
export function proximosDias(n = 7): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 1; i <= n; i++) {
    const f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    out.push(f.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }));
  }
  return out;
}

const SEIS_MESES_MS = 1000 * 60 * 60 * 24 * 182;
export const psicoVigente = (p: { ts: number } | null | undefined): boolean =>
  !!(p && p.ts && Date.now() - p.ts < SEIS_MESES_MS);
export function psicoVigenteHasta(p: { ts: number } | null | undefined): string {
  if (!p || !p.ts) return "";
  return new Date(p.ts + SEIS_MESES_MS).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
export function correoFormador(f: { nombre: string }): string {
  const p = sinAcentos(f.nombre).toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter(Boolean);
  return `${p[0] ?? "formador"}.${p[1] ?? "equipo"}@elektra.com.mx`;
}
export function telFormador(f: { id: string }): string {
  const n = Number(String(f.id).replace(/\D/g, "")) || 1;
  const d = String(41_000_000 + (n * 137_137) % 9_000_000).slice(0, 8);
  return `+52 55 ${d.slice(0, 4)} ${d.slice(4)}`;
}

/** Página simulada de apertura de cuenta de nómina (blob del navegador). */
export function abrirAperturaCuenta(): void {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Apertura de cuenta de nómina</title>
  <body style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:60px auto;color:#1A1A1A;text-align:center">
  <div style="border-top:6px solid #FFB81C;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.12);padding:36px">
  <h1 style="margin:0 0 6px">Apertura de cuenta de nómina</h1>
  <p style="color:#8A6400;font-weight:600;margin:0 0 20px">Portal del banco (simulado · demo Radar de Candidatos)</p>
  <p style="line-height:1.6;color:#3D3D3D">En la versión final, este enlace abrirá el portal del banco para que abras tu cuenta de nómina en línea con tu INE y RFC. Al terminar recibirás tu número de cuenta / CLABE, que deberás capturar en Radar de Candidatos.</p>
  <p style="margin-top:26px;font-size:12px;color:#999">Esta es una página de demostración; no se captura ni envía información real.</p>
  </div></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Próximas fechas de ingreso en inicio de quincena (día 1 o 16). */
export function fechasQuincena(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 5 && out.length < 4; i++) {
    const base = new Date(d.getFullYear(), d.getMonth() + i, 1);
    [1, 16].forEach((day) => {
      const f = new Date(base.getFullYear(), base.getMonth(), day);
      if (f > d && out.length < 4) {
        out.push(f.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
      }
    });
  }
  return out;
}
