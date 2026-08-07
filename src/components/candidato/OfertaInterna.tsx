/**
 * Carta oferta vista por un candidato INTERNO.
 *
 * Es distinta de la del externo porque el interno ya es empleado: lo que le importa no es "cuánto
 * gano" sino "cuánto MÁS gano y qué dejo atrás". Por eso compara sueldo y puesto actuales contra
 * los nuevos, y advierte que aceptar implica liberar su puesto en la fecha acordada.
 */
import { FileSignature, CheckCircle2, Download, MapPin, ArrowRight, CalendarDays } from "lucide-react";
import { money, mapsUrl } from "../../utils/format";
import { DIRECCION_CORP } from "../../constants/catalogos";
import type { Candidato, PipelineEntry, Vacante } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  v: Vacante;
  p: PipelineEntry;
  onAceptar: () => void;
}

/** Un "de X a Y" con flecha, para sueldo y puesto. */
function Salto({ etiqueta, antes, despues, extra }: {
  etiqueta: string; antes: string; despues: string; extra?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label>{etiqueta}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13.5 }}>
        <span style={{ color: "var(--gray)", textDecoration: "line-through" }}>{antes}</span>
        <ArrowRight size={15} style={{ color: "var(--gold-dark)", flexShrink: 0 }} />
        <b>{despues}</b>
        {extra}
      </div>
    </div>
  );
}

export function OfertaInterna({ cand, v, p, onAceptar }: Props) {
  const nuevo = p.oferta?.monto ?? 0;
  const actual = cand.sueldoActual ?? 0;
  const aumento = actual > 0 ? Math.round(((nuevo - actual) / actual) * 100) : 0;

  return (
    <div className="card" style={{ borderColor: "var(--gold)" }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>
        <FileSignature size={16} style={{ verticalAlign: -3 }} /> Tu carta oferta interna
      </h3>

      <Salto
        etiqueta="Sueldo mensual"
        antes={money(actual)}
        despues={money(nuevo)}
        extra={aumento > 0 && <span className="chip ok">+{aumento}% de aumento</span>}
      />

      <Salto
        etiqueta="Puesto y área"
        antes={`${cand.puesto} · ${cand.departamento ?? cand.area}`}
        despues={`${v.req.titulo} · ${v.req.departamento || v.req.area}`}
      />

      <div style={{ marginBottom: 14 }}>
        <label>Fecha de traspaso</label>
        <div style={{ fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 7 }}>
          <CalendarDays size={14} style={{ color: "var(--gold-dark)" }} />
          Liberas tu puesto actual y comienzas el nuevo el <b>{p.oferta?.fecha}</b>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label>Nueva ubicación donde debes presentarte</label>
        <div style={{ fontSize: 13.5 }}>{p.oferta?.ubicacion || DIRECCION_CORP}</div>
        <a className="btn ghost sm" style={{ marginTop: 6 }} href={mapsUrl(p.oferta?.ubicacion)}
          target="_blank" rel="noreferrer"><MapPin size={13} /> Ver en Google Maps</a>
      </div>

      <p className="help" style={{ marginBottom: 12 }}>
        Al aceptar esta oferta confirmas que liberarás tu puesto actual de {cand.puesto} en la
        fecha acordada, para incorporarte a tu nueva posición.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn gold" onClick={onAceptar}><CheckCircle2 size={15} /> Aceptar oferta</button>
        <button className="btn ghost"><Download size={14} /> Descargar carta oferta</button>
      </div>
    </div>
  );
}
