/**
 * Carta oferta vista por un candidato INTERNO.
 *
 * Deliberadamente enseña MENOS que la del externo. Un movimiento interno es una transferencia, y
 * hasta que el trámite no termina no hay ni fecha de ingreso ni sede confirmadas; el sueldo nuevo
 * tampoco se contrasta aquí. Por eso solo se muestra lo que ya es cierto —su sueldo actual y el
 * puesto al que va— y se dice en voz alta qué falta por confirmar.
 */
import { FileSignature, CheckCircle2, Download, ArrowRight, XCircle, Clock } from "lucide-react";
import { money } from "../../utils/format";
import { descargarOferta } from "../../utils/descargarOferta";
import type { Candidato, PipelineEntry, Vacante } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  v: Vacante;
  p: PipelineEntry;
  onAceptar: () => void;
  onRechazar: () => void;
}

export function OfertaInterna({ cand, v, p, onAceptar, onRechazar }: Props) {
  return (
    <div className="card" style={{ borderColor: "var(--gold)" }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>
        <FileSignature size={16} style={{ verticalAlign: -3 }} /> Tu carta oferta interna
      </h3>

      <div style={{ marginBottom: 14 }}>
        <label>Sueldo mensual actual</label>
        <div style={{ fontSize: 13.5 }}><b>{money(cand.sueldoActual ?? 0)}</b></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label>Puesto y área</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13.5 }}>
          <span style={{ color: "var(--gray)", textDecoration: "line-through" }}>
            {cand.puesto} · {cand.departamento ?? cand.area}
          </span>
          <ArrowRight size={15} style={{ color: "var(--gold-dark)", flexShrink: 0 }} />
          <b>{v.req.titulo} · {v.req.departamento || v.req.area}</b>
        </div>
      </div>

      <div className="aibox" style={{ marginBottom: 14 }}>
        <Clock size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
        Tu <b>fecha de ingreso</b> y tu <b>nueva sede</b> se te notificarán cuando se complete el
        trámite interno de transferencia.
      </div>

      <p className="help" style={{ marginBottom: 12 }}>
        Al aceptar esta oferta confirmas que liberarás tu puesto actual de {cand.puesto} para
        incorporarte a tu nueva posición.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn gold" onClick={onAceptar}><CheckCircle2 size={15} /> Aceptar oferta</button>
        <button className="btn ghost" onClick={() => descargarOferta(cand, v, p)}>
          <Download size={14} /> Descargar carta oferta
        </button>
        <button className="btn ghost" onClick={onRechazar}><XCircle size={14} /> Rechazar oferta</button>
      </div>
    </div>
  );
}
