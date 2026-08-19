/**
 * Trámite de transferencia visto por el FORMADOR que recibe al colaborador.
 *
 * Sustituye a la firma de contrato en los movimientos internos. La diferencia no es cosmética: en
 * una contratación externa el formador firma y se acabó, mientras que aquí lo que queda por hacer
 * es un trámite entre tres partes, y dos de sus cuatro pasos no son suyos. Por eso se ven siempre
 * los cuatro —para que sepa qué falta aunque no le toque— y solo se le ofrece acción en los dos
 * primeros.
 *
 * El paso de la fecha es el delicado: se acuerda con el formador ACTUAL del colaborador, que es
 * quien lo pierde y quien tiene que reorganizar su equipo. De ahí que su nombre salga en el aviso
 * en vez de un genérico "valídalo con el área correspondiente".
 */
import { useState } from "react";
import { CheckCircle2, CalendarCheck, ClipboardCheck, AlertTriangle } from "lucide-react";
import { PasosTransferencia } from "../candidato/PasosTransferencia";
import { SEDES, TIPOS_SEDE } from "../../constants/catalogos";
import type { Candidato, PipelineEntry } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  p: PipelineEntry;
  /** Nombre del formador que hoy tiene al colaborador. Puede faltar si no está registrado. */
  formadorActual?: string;
  enviando: boolean;
  onAvanzar: () => void;
  onDefinir: (fecha: string, sede: string) => void;
}

/** "2026-07-01" → "miércoles, 1 de julio de 2026". Mismo formato que usa la carta oferta. */
const fmtLibre = (s: string): string => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
};

export function PasosMovilidad({ cand, p, formadorActual, enviando, onAvanzar, onDefinir }: Props) {
  const paso = p.transferencia?.paso ?? 0;
  const nombre = cand.nombre.split(" ")[0];

  const [fecha, setFecha] = useState("");
  const [tipoSede, setTipoSede] = useState<string>(TIPOS_SEDE[0]);
  const [sede, setSede] = useState(SEDES[TIPOS_SEDE[0]][0]);

  // Sin `.card` propia: se monta dentro de la tarjeta de la pestaña "Carta oferta".
  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>
        <ClipboardCheck size={16} style={{ verticalAlign: -3 }} /> Movilidad de {nombre}
      </h3>
      <p className="help" style={{ marginTop: 0, marginBottom: 14 }}>
        {nombre} aceptó su carta oferta. Este movimiento es una transferencia, no una contratación:
        no hay contrato que firmes tú. Lo que queda es el trámite interno, en cuatro pasos.
      </p>

      <div style={{ maxWidth: 640, marginBottom: 18 }}>
        <PasosTransferencia actual={paso} />
      </div>

      {paso === 0 && (
        <div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 12 }}>
            {nombre} ya tiene expediente en la empresa, así que su documentación no se vuelve a
            pedir: solo hay que revisarla y darla por buena.
          </p>
          <button className="btn gold" disabled={enviando} onClick={onAvanzar}>
            <CheckCircle2 size={15} /> Marcar validación de documentos
          </button>
        </div>
      )}

      {paso === 1 && (
        <div>
          {/* El aviso va ARRIBA del formulario, no debajo del botón: si aparece después de elegir la
              fecha, llega tarde. */}
          <div className="aibox" style={{ marginBottom: 14, borderColor: "var(--gold)", background: "var(--gold-soft)", color: "var(--ink2)" }}>
            <AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 6, color: "var(--gold-dark)" }} />
            Valida esta fecha de ingreso con{" "}
            <b>{formadorActual ?? "el formador actual de " + nombre}</b> y con {nombre} antes de
            continuar. Es la fecha en la que {nombre} deja su puesto actual, y de ella depende cómo
            se reorganiza ese equipo.
          </div>

          <div className="grid2">
            <div className="field">
              <label>Fecha de ingreso al nuevo puesto</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <div className="help">{fecha ? fmtLibre(fecha) : "Sin fecha seleccionada."}</div>
            </div>
            <div className="field">
              <label>Tipo de sede</label>
              <select value={tipoSede} onChange={(e) => { setTipoSede(e.target.value); setSede(SEDES[e.target.value][0]); }}>
                {TIPOS_SEDE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Sede a la que se presentará</label>
            <select value={sede} onChange={(e) => setSede(e.target.value)}>
              {SEDES[tipoSede].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button className="btn gold" disabled={!fecha || enviando}
            onClick={() => onDefinir(fmtLibre(fecha), sede)}>
            <CalendarCheck size={15} /> Confirmar movimiento y continuar
          </button>
        </div>
      )}

      {paso >= 2 && (
        <div>
          <div className="grid2" style={{ marginBottom: 14 }}>
            <div>
              <label>Fecha de ingreso</label>
              <b style={{ fontSize: 13.5 }}>{p.oferta?.fecha || "—"}</b>
            </div>
            <div>
              <label>Sede</label>
              <div style={{ fontSize: 13.5 }}>{p.oferta?.ubicacion || "—"}</div>
            </div>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 0 }}>
            Tu parte del trámite está completa. Los dos pasos que faltan los cierra {nombre}: tiene
            que <b>dar de baja su puesto actual</b> y <b>firmar su nuevo contrato</b>. Se te
            notificará en cuanto lo haga, y ahí termina el proceso.
          </p>
        </div>
      )}
    </div>
  );
}
