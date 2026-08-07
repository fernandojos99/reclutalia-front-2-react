/** Modales de "Buscar vacantes": DetalleVacanteModal y AplicarModal (portados de App.jsx). */
import { useState, type ReactNode } from "react";
import { CheckCircle2, MapPin, ShieldCheck, Send } from "lucide-react";
import { Modal } from "../common/Modal";
import { Chip } from "../common/Chip";
import { MatchRing } from "../common/MatchRing";
import { EstadoChip } from "../common/EstadoChip";
import { money } from "../../utils/format";
import { matchScore } from "../../utils/match";
import type { Candidato, PipelineEntry, Vacante } from "../../types/models/domain";

function Row({ l, c }: { l: string; c: ReactNode }) {
  return <div style={{ marginBottom: 10 }}><label>{l}</label><div style={{ fontSize: 13.5 }}>{c}</div></div>;
}
function MC({ e, hit, base }: { e: string; hit?: boolean; base?: string }) {
  return <span className={"chip " + (hit ? "ok" : base || "")}>{hit && <CheckCircle2 size={11} />}{e}</span>;
}

export function DetalleVacanteModal({ v, cand, p, bloqueado, onAplicar, onClose }: {
  v: Vacante; cand: Candidato; p?: PipelineEntry; bloqueado?: boolean; onAplicar: () => void; onClose: () => void;
}) {
  const r = v.req;
  const has = (arr: string[] | undefined, e: string) => (arr || []).includes(e);
  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <MatchRing v={matchScore(cand, r)} size={56} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3>{r.titulo}</h3>
          <div className="tagpick" style={{ marginTop: 6 }}>
            <Chip>{r.area}</Chip>
            <Chip icon={MapPin}>{r.ubicacionTrabajo} · {r.modalidad}</Chip>
          </div>
        </div>
      </div>
      <div className="chip ok" style={{ marginBottom: 12 }}><CheckCircle2 size={12} /> En verde: lo que coincide con tu perfil</div>
      <div className="grid2">
        <div>
          <Row l="Descripción" c={r.descripcion} />
          <Row l="Especialidades requeridas" c={<div className="tagpick">{r.espRequeridas.map((e) => <MC key={e} e={e} hit={has(cand.esp, e)} base="gold" />)}</div>} />
          <Row l="Habilidades técnicas" c={<div className="tagpick">{r.hardSkills.map((e) => <MC key={e} e={e} hit={has(cand.hard, e)} />)}</div>} />
          <Row l="Habilidades blandas" c={<div className="tagpick">{r.softSkills.map((e) => <MC key={e} e={e} hit={has(cand.soft, e)} />)}</div>} />
          {r.aptitudes.length > 0 && <Row l="Aptitudes a evaluar" c={<div className="tagpick">{r.aptitudes.map((e) => <span key={e} className="chip">{e}</span>)}</div>} />}
        </div>
        <div>
          <div className="grid2">
            <Row l="Área" c={r.area} /><Row l="Experiencia mínima" c={r.expNoRelevante ? "No relevante" : r.anosExp + " años"} />
            <Row l="Estudios" c={r.educacion + (r.puedeSerSuperior ? " o superior" : "")} />
            <Row l="Ubicación del trabajo" c={r.ubicacionTrabajo} /><Row l="Modalidad" c={r.modalidad} />
            <Row l="Horario" c={r.horario} /><Row l="Días" c={r.dias.join(", ")} />
            {!r.sueldoOculto && <Row l="Sueldo mensual" c={money(r.sueldo ?? Math.round((r.salarioMin + r.salarioMax) / 2 / 500) * 500) + " /mes"} />}<Row l="Posiciones" c={r.numVacantes} />
            {r.sede && <Row l="Sede" c={`${r.tipoSede} · ${r.sede}`} />}
            {r.unidadNegocio && <Row l="Unidad de Negocio" c={r.unidadNegocio} />}
          </div>
          {r.examenMedico && <Row l="Examen médico" c={<Chip tone="gold" icon={ShieldCheck}>Requerido al ser seleccionado(a)</Chip>} />}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
        {p ? <EstadoChip estado={p.estado} candView />
          : bloqueado ? <span className="help">Ya tienes un proceso activo; no puedes postularte a otra vacante hasta que concluya.</span>
            : <button className="btn gold" onClick={onAplicar}><Send size={15} /> Aplicar a la vacante</button>}
        <button className="btn ghost" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

export function AplicarModal({ cand, v, onSend, onClose }: {
  cand: Candidato; v: Vacante; onSend: (msg: string) => void; onClose: () => void;
}) {
  const def = `Hola, soy ${cand.nombre.split(" ")[0]} y me interesa mucho la vacante "${v.req.titulo}" (${v.req.modalidad}, ${v.req.ubicacionTrabajo}). Considero que mi perfil es compatible y me encantaría participar en el proceso. ¡Saludos!`;
  const [msg, setMsg] = useState(def);
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 4 }}>Aplicar a la vacante</h3>
      <p className="help" style={{ marginBottom: 14 }}>Tu postulación a "{v.req.titulo}" se registrará con tu mensaje (y por correo/WhatsApp en la versión final).</p>
      <textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn gold" onClick={() => onSend(msg)}><Send size={15} /> Enviar postulación</button>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}
