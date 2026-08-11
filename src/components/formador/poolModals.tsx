/** Modales del Marketplace de talento del formador (portados de App.jsx). */
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, FolderPlus, Plus, Share2, Send } from "lucide-react";
import { Modal } from "../common/Modal";
import type { Candidato, CategoriaFormador, Vacante } from "../../types/models/domain";

/** Overlay de búsqueda con IA al aprobar el descriptivo (5 s simulados). */
export function BusquedaIAOverlay({ onDone }: { onDone: () => void }) {
  const msgs = ["Analizando el marketplace de talento…", "Comparando habilidades y experiencia…", "Generando ranking de compatibilidad…"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => setI((x) => (x + 1) % msgs.length), 1600);
    const to = window.setTimeout(() => { window.clearInterval(iv); onDone(); }, 5000);
    return () => { window.clearInterval(iv); window.clearTimeout(to); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="modal-bg">
      <div className="modal" style={{ maxWidth: 420, textAlign: "center", padding: "38px 30px" }}>
        <Loader2 size={46} className="ai-spin" />
        <h3 style={{ marginTop: 16, color: "var(--ai)" }}>La IA está buscando tu talento</h3>
        <p className="help" style={{ marginTop: 6 }}>Analizando a los candidatos del marketplace y ordenándolos por compatibilidad con tu vacante.</p>
        <div className="ai-search-msg">{msgs[i]}</div>
        <div className="mini-pipe" style={{ marginTop: 14 }}>{msgs.map((_, k) => <i key={k} className={k <= i ? "f" : ""} style={k <= i ? { background: "var(--ai)" } : {}} />)}</div>
      </div>
    </div>
  );
}

/** Categorizar candidato en categorías personales del formador. */
export function CategorizarModal({ cand, cats, onToggle, onCrear, onClose }: {
  cand: Candidato; cats: CategoriaFormador[];
  onToggle: (nombre: string) => void; onCrear: (nombre: string) => void; onClose: () => void;
}) {
  const [nueva, setNueva] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 4 }}>Categorizar a {cand.nombre.split(" ").slice(0, 2).join(" ")}</h3>
      <p className="help" style={{ marginBottom: 14 }}>Agrega o quita al candidato de tus categorías personales. Son visibles solo para ti.</p>
      {cats.length === 0 && <p className="help" style={{ marginBottom: 12 }}>Aún no tienes categorías. Crea la primera abajo.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {cats.map((c) => {
          const on = c.cids.includes(cand.id);
          return (
            <button key={c.nombre} className={"check-item" + (on ? " done" : "")} style={{ textAlign: "left" }} onClick={() => onToggle(c.nombre)}>
              {on ? <CheckCircle2 size={18} color="var(--ok)" /> : <FolderPlus size={18} color="var(--gray)" />}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.nombre}</div>
              <span className="help">{on ? "Incluido" : "Agregar"}</span>
            </button>
          );
        })}
      </div>
      <label>Crear nueva categoría</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="p. ej. Finalistas de ventas" />
        <button className="btn dark" disabled={!nueva.trim()} onClick={() => { onCrear(nueva); setNueva(""); }}><Plus size={14} /> Crear</button>
      </div>
    </Modal>
  );
}

/** Compartir candidato con otro formador (simulado). */
export function CompartirModal({ cand, onEnviar, onClose }: {
  cand: Candidato; onEnviar: (dest: string) => void; onClose: () => void;
}) {
  const [dest, setDest] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 4 }}>Compartir candidato</h3>
      <p className="help" style={{ marginBottom: 14 }}>Comparte el perfil de <b>{cand.nombre}</b> con otro formador de equipo.</p>
      <label>Nombre o número de empleado del formador</label>
      <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="p. ej. Arturo Castillo o 1002345" />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="btn gold" disabled={!dest.trim()} onClick={() => onEnviar(dest.trim())}><Share2 size={14} /> Compartir perfil</button>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
      </div>
      <div className="help" style={{ marginTop: 10 }}>Integración simulada en este prototipo; no se envía información real.</div>
    </Modal>
  );
}

/** Solicitar más candidatos a reclutamiento. */
export function SolicitarMasModal({ v, onConfirmar, onClose }: {
  v: Vacante; onConfirmar: (multiposting: boolean) => void; onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 4 }}>Solicitar búsqueda</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>Al continuar iniciará la búsqueda de candidatos internos y externos para <b>«{v.req.titulo}»</b> y se te habilitarán perfiles viables en los próximos días.</p>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="btn gold" onClick={() => onConfirmar(false)}><Send size={15} /> Confirmar solicitud</button>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}
