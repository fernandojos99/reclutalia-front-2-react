/**
 * Carta oferta: calculadora de compensación (sueldo fijo por tabulador) + fecha y ubicación.
 *
 * Con un candidato INTERNO se compara además contra lo que gana hoy: un aumento por encima del
 * 30 % exige autorización de administración antes de poder enviar la oferta.
 */
import { useState } from "react";
import { Send, Calculator, AlertTriangle, ShieldCheck, CalendarClock } from "lucide-react";
import { Modal } from "../common/Modal";
import { money, fechasQuincena } from "../../utils/format";
import { DIRECCION_CORP } from "../../constants/catalogos";
import type { Candidato, Vacante } from "../../types/models/domain";

interface Props {
  v: Vacante;
  cand: Candidato;
  onSend: (monto: number, fecha: string, ubicacion: string) => void;
}

const pct = (t: string) => <span style={{ color: "var(--gray)", fontWeight: 400, fontSize: 11.5 }}>{t}</span>;

/** Umbral de aumento a partir del cual hace falta autorización. */
const TOPE = 0.30;

export function OfertaTool({ v, cand, onSend }: Props) {
  // Sueldo fijo (tabulador). Desglose determinista para la calculadora de compensación.
  const sueldoTabulador = v.req.sueldo ?? Math.round((v.req.salarioMin + v.req.salarioMax) / 2 / 500) * 500;

  const interno = cand.tipo === "interno";
  const sueldoActual = interno ? cand.sueldoActual ?? 0 : 0;
  const [topado, setTopado] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [pidiendo, setPidiendo] = useState(false);

  // Al topar se redondea hacia ABAJO, para no volver a cruzar el 30 % por el redondeo.
  const sueldoTope = Math.floor((sueldoActual * (1 + TOPE)) / 100) * 100;
  const sueldo = topado ? sueldoTope : sueldoTabulador;

  const aumento = sueldoActual > 0 ? (sueldo - sueldoActual) / sueldoActual : 0;
  const excede = sueldoActual > 0 && aumento > TOPE;
  const bloqueado = excede && !autorizado;

  const bono = Math.round(sueldo * 0.18);
  const prestaciones = Math.round(sueldo * 0.12);
  const total = sueldo + bono + prestaciones;

  const fechas = fechasQuincena();
  const [fecha, setFecha] = useState(fechas[0]);
  const [fechaLibre, setFechaLibre] = useState("");
  const otra = fecha === "otra";
  const fmtLibre = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const fechaFinal = otra ? (fechaLibre ? fmtLibre(fechaLibre) : "") : fecha;
  const [ubicacion, setUbicacion] = useState(DIRECCION_CORP);

  return (
    <div className="grid2">
      <div>
        {/* Calculadora de compensación */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Calculator size={16} color="var(--gold-dark)" />
            <b style={{ fontSize: 14 }}>Paquete de compensación</b>
          </div>
          <div style={{ marginBottom: 10 }}><span className="chip gold">Salario fijo · tabulador autorizado</span></div>

          {/* Solo internos: ya son empleados, así que hay un sueldo previo contra el que comparar. */}
          {sueldoActual > 0 && (
            <>
              <div className="comp-row"><span>Sueldo actual</span><b>{money(sueldoActual)}</b></div>
              <div className="comp-row">
                <span>Aumento</span>
                <b style={{ color: "var(--ok)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  +{Math.round(aumento * 100)}%
                  {excede && !autorizado && (
                    <AlertTriangle size={15} style={{ color: "var(--bad)" }}
                      aria-label="Supera el 30 %: requiere autorización" />
                  )}
                  {autorizado && <ShieldCheck size={15} style={{ color: "var(--ok)" }} aria-label="Autorizado" />}
                </b>
              </div>
            </>
          )}

          <div className="comp-row"><span>Sueldo base</span><b>{money(sueldo)}</b></div>
          <div className="comp-row"><span>Bono variable est. {pct("(≈18%)")}</span><b>{money(bono)}</b></div>
          <div className="comp-row"><span>Prestaciones grupo {pct("(≈12%)")}</span><b>{money(prestaciones)}</b></div>
          <div className="comp-total"><span>Valor total mensual</span><b>{money(total)}</b></div>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--gray)", marginTop: -4, textAlign: "right" }}>Información cargada de Compensalia.</div>
      </div>

      <div>
        {/* Al interno no se le piden fecha ni sede: una transferencia todavía no las tiene. Se
            acuerdan durante el trámite, con su formador actual de por medio, y hasta entonces
            ponerlas aquí sería inventarlas. El externo sigue igual: para él, firmar e ingresar es
            el mismo día y la sede ya está decidida. */}
        {interno ? (
          <div className="aibox" style={{ marginBottom: 12 }}>
            <CalendarClock size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
            La <b>fecha de ingreso</b> y la <b>sede</b> no se definen aquí. Se acuerdan durante el
            trámite de transferencia, una vez que {cand.nombre.split(" ")[0]} acepte su carta oferta.
          </div>
        ) : (
          <>
            <div className="field">
              <label>Fecha de firma e ingreso (mismo día)</label>
              <select value={fecha} onChange={(e) => setFecha(e.target.value)}>
                {fechas.map((f) => <option key={f} value={f}>{f}</option>)}
                <option value="otra">Otra fecha…</option>
              </select>
              {otra && <input type="date" style={{ marginTop: 8 }} value={fechaLibre} onChange={(e) => setFechaLibre(e.target.value)} />}
              <div className="help">{otra ? "Elige libremente la fecha de ingreso del candidato." : 'Inicios de quincena (día 1 o 16), o elige "Otra fecha" para una fecha libre.'}</div>
            </div>
            <div className="field">
              <label>Ubicación donde el candidato debe presentarse</label>
              <textarea rows={2} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Dirección completa de presentación el primer día…" />
              <div className="help">Se incluirá en la carta oferta y en la pantalla de bienvenida (con enlace a Google Maps).</div>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn gold" disabled={(!interno && (!ubicacion.trim() || !fechaFinal)) || bloqueado}
            title={bloqueado ? "Requiere autorización: el aumento supera el 30 %" : undefined}
            onClick={() => onSend(sueldo, interno ? "" : fechaFinal, interno ? "" : ubicacion.trim())}>
            <Send size={15} /> Enviar carta oferta a {cand.nombre.split(" ")[0]}
          </button>
          {bloqueado && (
            <button className="btn ghost" onClick={() => setPidiendo(true)}>
              <AlertTriangle size={15} /> Solicitar autorización
            </button>
          )}
        </div>
        {bloqueado && (
          <p className="help" style={{ marginTop: 8 }}>
            El aumento supera el 30 % permitido: solicita la autorización o topa el aumento para
            poder enviar la carta oferta.
          </p>
        )}
        {autorizado && (
          <p className="help" style={{ marginTop: 8, color: "var(--ok)" }}>
            Aumento autorizado por administración. Ya puedes enviar la carta oferta.
          </p>
        )}

        {pidiendo && (
          <Modal onClose={() => setPidiendo(false)}>
            <h3 style={{ marginBottom: 4 }}>Autorización de aumento</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              Estás por ofrecer <b>{money(sueldo)}</b> a {cand.nombre.split(" ")[0]}, que gana hoy{" "}
              <b>{money(sueldoActual)}</b>: un aumento del <b>{Math.round(aumento * 100)}%</b>.
              Para superar el 30 % deberás esperar la autorización de tu administración. También
              puedes topar el aumento al 30 % y enviar la carta oferta de inmediato.
            </p>
            <div className="paso-acciones">
              <button className="btn gold" onClick={() => { setAutorizado(true); setPidiendo(false); }}>
                <ShieldCheck size={15} /> Continuar con la autorización
              </button>
              <button className="btn ghost" onClick={() => { setTopado(true); setAutorizado(false); setPidiendo(false); }}>
                Topar aumento a 30% ({money(sueldoTope)})
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
