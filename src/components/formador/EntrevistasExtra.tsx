/**
 * Módulo de entrevistas adicionales del formador dueño de la vacante.
 *
 * Encabeza con un resumen generado por IA de TODAS las entrevistas del proceso (la suya más las
 * de los formadores invitados) y el conteo de evaluaciones positivas, neutrales y negativas.
 * Debajo, el listado por candidato con el estado de cada entrevistador y el buscador para pedir
 * nuevas.
 *
 * El resumen es simulación determinista, como el resto de "IA" del prototipo.
 */
import { useState } from "react";
import { Sparkles, UserPlus, X, Search, CheckCircle2, Clock, CalendarCheck } from "lucide-react";
import { evalEmoji, evalLabel } from "./EntrevistaModal";
import type { Candidato, EntrevistaExtra, Formador, PipelineEntry, Vacante } from "../../types/models/domain";

interface Props {
  v: Vacante;
  /** Candidatos que ya llegaron a fase de entrevista, con su entrada de pipeline. */
  filas: { c: Candidato; p: PipelineEntry }[];
  formadores: Formador[];
  onSolicitar: (cid: number, formadorId: string) => void;
  onCancelar: (cid: number, formadorId: string) => void;
}

const ETIQUETA: Record<EntrevistaExtra["estado"], string> = {
  notificado: "Notificado",
  agendada: "Entrevista agendada",
  realizada: "Entrevista realizada",
};

const ICONO: Record<EntrevistaExtra["estado"], typeof Clock> = {
  notificado: Clock,
  agendada: CalendarCheck,
  realizada: CheckCircle2,
};

export function EntrevistasExtra({ v, filas, formadores, onSolicitar, onCancelar }: Props) {
  const [buscando, setBuscando] = useState<number | null>(null);
  const [q, setQ] = useState("");

  /** Todas las evaluaciones del proceso: la del formador principal y las de los invitados. */
  const evaluaciones = filas.flatMap(({ p }) => [
    ...(p.entrevista ? [p.entrevista.calificacion] : []),
    ...(p.entrevistasExtra ?? []).flatMap((e) => (e.entrevista ? [e.entrevista.calificacion] : [])),
  ]);
  const positivas = evaluaciones.filter((n) => n >= 4).length;
  const neutrales = evaluaciones.filter((n) => n === 3).length;
  const negativas = evaluaciones.filter((n) => n <= 2).length;

  const pendientes = filas.flatMap(({ p }) => (p.entrevistasExtra ?? []).filter((e) => e.estado !== "realizada"));

  const nombreDe = (fid: string) => formadores.find((f) => f.id === fid)?.nombre ?? fid;

  /** Resumen simulado: se apoya en los datos reales del proceso, sin llamar a ningún modelo. */
  const resumenIA = evaluaciones.length
    ? `Se han registrado ${evaluaciones.length} entrevista(s) sobre ${filas.length} candidato(s) para "${v.req.titulo}". ` +
      `El balance es de ${positivas} evaluación(es) positiva(s), ${neutrales} neutral(es) y ${negativas} negativa(s). ` +
      (pendientes.length
        ? `Quedan ${pendientes.length} entrevista(s) por realizar antes de poder elegir al candidato final.`
        : "Todas las entrevistas solicitadas están completas: ya puedes seleccionar al candidato final.")
    : "Todavía no hay entrevistas registradas en este proceso.";

  return (
    <div style={{ marginTop: 18 }}>
      <div className="aibox" style={{ marginBottom: 14 }}>
        <div className="hd"><Sparkles size={15} /> Resumen del proceso de entrevistas</div>
        <p style={{ fontSize: 12.5 }}>{resumenIA}</p>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span className="chip ok">👍 {positivas} positivas</span>
          <span className="chip">😐 {neutrales} neutrales</span>
          <span className="chip bad">👎 {negativas} negativas</span>
        </div>
      </div>

      <div className="rev-titulin">Entrevistas por candidato</div>

      {filas.map(({ c, p }) => {
        const extras = p.entrevistasExtra ?? [];
        const yaPedidos = new Set(extras.map((e) => e.formadorId));
        const disponibles = formadores.filter(
          (f) => f.id !== v.formadorId && !yaPedidos.has(f.id) &&
            (q.trim() === "" ||
              f.nombre.toLowerCase().includes(q.toLowerCase()) ||
              f.id.toLowerCase().includes(q.toLowerCase()) ||
              f.puesto.toLowerCase().includes(q.toLowerCase())),
        );

        return (
          <div className="card" key={c.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <b style={{ fontSize: 14 }}>{c.nombre}</b>
              {p.entrevista && (
                <span className="chip ok">
                  {evalEmoji(p.entrevista.calificacion)} Tu entrevista · {evalLabel(p.entrevista.calificacion)}
                </span>
              )}
              <button type="button" className="btn ghost sm" style={{ marginLeft: "auto" }}
                onClick={() => { setBuscando(buscando === c.id ? null : c.id); setQ(""); }}>
                <UserPlus size={13} /> Solicitar entrevista
              </button>
            </div>

            {extras.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {extras.map((e) => {
                  const Icono = ICONO[e.estado];
                  return (
                    <div className="fila-info" key={e.formadorId} style={{ marginTop: 8 }}>
                      <Icono size={15} className="fila-info-ico" />
                      <b>{nombreDe(e.formadorId)}</b>
                      <span className="fila-info-extra">{ETIQUETA[e.estado]}</span>
                      {e.entrevista && (
                        <span className="chip ok">
                          {evalEmoji(e.entrevista.calificacion)} {evalLabel(e.entrevista.calificacion)}
                        </span>
                      )}
                      {e.estado !== "realizada" && (
                        <button type="button" className="btn ghost sm" title="Cancelar esta entrevista"
                          onClick={() => onCancelar(c.id, e.formadorId)}><X size={13} /></button>
                      )}
                    </div>
                  );
                })}

                {/* El resumen y el feedback de cada entrevistador, para el formador principal. */}
                {extras.filter((e) => e.entrevista).map((e) => (
                  <div className="card" key={"det-" + e.formadorId} style={{ marginTop: 8, background: "var(--bg)" }}>
                    <label>{nombreDe(e.formadorId)} · {e.entrevista?.fecha}</label>
                    <p className="pub-nota" style={{ marginBottom: 6 }}>{e.entrevista?.resumen}</p>
                    <label>Feedback</label>
                    <p className="pub-nota">{e.entrevista?.feedback}</p>
                  </div>
                ))}
              </div>
            )}

            {buscando === c.id && (
              <div style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Buscar por nombre, número de empleado o puesto</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Search size={15} style={{ color: "var(--gray)", flexShrink: 0 }} />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="p. ej. Mónica, F3, Gerente…" />
                  </div>
                </div>
                {disponibles.length === 0 ? (
                  <p className="help" style={{ margin: 0 }}>Sin formadores disponibles con ese criterio.</p>
                ) : (
                  disponibles.map((f) => (
                    <div className="fila-info" key={f.id} style={{ marginTop: 8 }}>
                      <b>{f.nombre}</b>
                      <span className="fila-info-extra">{f.id} · {f.puesto}</span>
                      <button type="button" className="btn gold sm"
                        onClick={() => { onSolicitar(c.id, f.id); setBuscando(null); }}>
                        Solicitar
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
