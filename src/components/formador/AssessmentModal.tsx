/**
 * Convocatoria de un Assessment center: la prueba práctica que evalúa un equipo de formadores.
 *
 * Reutiliza el `SelectorHorarios` de `AgendaModal` a propósito: los tres horarios que se eligen
 * aquí son los mismos del pipeline, así que el candidato confirma una sola vez y queda citado con
 * todos los evaluadores. Elegirlos en un calendario distinto haría creer lo contrario.
 *
 * El buscador de formadores repite el de `EntrevistasExtra` (nombre, número de empleado o puesto).
 */
import { useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Modal } from "../common/Modal";
import { Chip } from "../common/Chip";
import { SelectorHorarios } from "./AgendaModal";
import type { Candidato, Formador } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  formadores: Formador[];
  /** Dueño de la vacante: ya evalúa por su cuenta, no se invita a sí mismo. */
  formadorVacante: string;
  onSend: (evaluadores: string[], slots: string[], modalidad: string, proyecto: string) => void;
  onClose: () => void;
}

export function AssessmentModal({ cand, formadores, formadorVacante, onSend, onClose }: Props) {
  const nombre = cand.nombre.split(" ")[0];
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [proyecto, setProyecto] = useState(
    `Caso práctico de ${cand.area.toLowerCase()}: ${nombre} recibirá un escenario real del puesto y ` +
      `deberá plantear su solución y defenderla ante el equipo evaluador.`,
  );

  const disponibles = formadores.filter(
    (f) => f.id !== formadorVacante && !sel.includes(f.id) &&
      (q.trim() === "" ||
        f.nombre.toLowerCase().includes(q.toLowerCase()) ||
        f.id.toLowerCase().includes(q.toLowerCase()) ||
        f.puesto.toLowerCase().includes(q.toLowerCase())),
  );
  const nombreDe = (fid: string) => formadores.find((f) => f.id === fid)?.nombre ?? fid;

  return (
    <Modal onClose={onClose} wide>
      <h3>Assessment center</h3>
      <p className="help" style={{ marginBottom: 14 }}>
        {nombre} desarrollará una prueba práctica que evaluará un equipo de formadores. Los
        <b> 3 horarios</b> que elijas valen para todos: cuando {nombre} confirme uno, quedan citados
        el equipo y tú.
      </p>

      <div className="field">
        <label>Prueba que desarrollará</label>
        <textarea rows={3} value={proyecto} onChange={(e) => setProyecto(e.target.value)} />
      </div>

      <SelectorHorarios
        etiquetaEnviar={`Convocar assessment con ${sel.length + 1} evaluador(es)`}
        bloqueado={sel.length === 0}
        onSend={(slots, modalidad) => onSend(sel, slots, modalidad, proyecto)}
        onClose={onClose}
      >
        <div className="field">
          <label>Formadores que evaluarán la prueba, además de ti</label>
          {sel.length > 0 && (
            <div className="tagpick" style={{ marginBottom: 8 }}>
              {sel.map((fid) => (
                <button key={fid} type="button" title="Quitar del equipo evaluador"
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                  onClick={() => setSel((x) => x.filter((y) => y !== fid))}>
                  <Chip tone="gold">{nombreDe(fid)} <X size={11} /></Chip>
                </button>
              ))}
            </div>
          )}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: 12, color: "var(--gray)" }} />
            <input placeholder="Buscar por nombre, número de empleado o puesto…" value={q}
              onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
          {q.trim() !== "" && (
            <div style={{ marginTop: 8, maxHeight: 168, overflowY: "auto" }}>
              {disponibles.length === 0 ? (
                <p className="help" style={{ margin: 0 }}>Ningún formador coincide con la búsqueda.</p>
              ) : disponibles.map((f) => (
                <div key={f.id} className="trow" style={{ padding: "8px 10px" }}>
                  <div className="trow-body">
                    <b>{f.nombre}</b>
                    <div className="help">{f.puesto} · {f.id}</div>
                  </div>
                  <div className="trow-acts">
                    <button className="btn ghost sm" onClick={() => { setSel((x) => [...x, f.id]); setQ(""); }}>
                      <UserPlus size={12} /> Añadir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sel.length === 0 && (
            <div className="help">Elige al menos un formador para poder convocar el assessment.</div>
          )}
        </div>
      </SelectorHorarios>
    </Modal>
  );
}
