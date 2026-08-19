/** Perfil de candidato (solo lectura, lo ve el formador) — portado del `PerfilModal` original. */
import { useState, type ReactNode } from "react";
import {
  CheckCircle2, Building2, MapPin, Briefcase, GraduationCap, Heart, FolderPlus,
  Archive, ArchiveRestore, Download, Share2,
} from "lucide-react";
import { ComentariosCandidato } from "./ComentariosCandidato";
import { FichaTalento } from "../movilidad/FichaTalento";
import { nivelMovilidad } from "../../utils/movilidad";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";
import { Chip } from "../common/Chip";
import { MatchRing } from "../common/MatchRing";
import { money, rangoFechas } from "../../utils/format";
import { descargarCV } from "../../utils/descargarCV";
import type { Candidato, Formador, Requisito } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  match?: number | null;
  onClose: () => void;
  extra?: ReactNode;
  req?: Requisito;
  fav?: boolean;
  enCat?: boolean;
  archivado?: boolean;
  onFav?: () => void;
  onCat?: () => void;
  onArchivar?: () => void;
  onCompartir?: () => void;
  /** Resuelve el nombre del formador que firmó cada comentario. */
  formadores?: Formador[];
}

type Vista = "perfil" | "ficha" | "comentarios";

const TITULO: Record<Vista, string> = {
  perfil: "Perfil",
  ficha: "Ficha de talento",
  comentarios: "Comentarios",
};

function MC({ e, hit, base }: { e: string; hit?: boolean; base?: string }) {
  return <span className={"chip " + (hit ? "ok" : base || "")}>{hit && <CheckCircle2 size={11} />}{e}</span>;
}

export function PerfilModal({ cand, match, onClose, extra, req, fav, enCat, archivado, onFav, onCat, onArchivar, onCompartir, formadores }: Props) {
  // Solo los internos tienen ficha y comentarios; para un externo no hay pestañas que mostrar.
  const [vista, setVista] = useState<Vista>("perfil");
  const esInterno = cand.tipo === "interno";
  const espHit = (e: string) => !!req && req.espRequeridas.includes(e);

  /** Barra de pestañas. Una sola, para que no haya dos copias que se puedan desincronizar. */
  const tabs = esInterno ? (
    <div className="tabs">
      {(["perfil", "ficha", "comentarios"] as Vista[]).map((k) => (
        <button key={k} className={"tab" + (vista === k ? " on" : "")}
          onClick={() => setVista(k)}>{TITULO[k]}</button>
      ))}
    </div>
  ) : null;

  const hardHit = (e: string) => !!req && req.hardSkills.includes(e);
  const softHit = (e: string) => !!req && req.softSkills.includes(e);
  const [verExp, setVerExp] = useState(false);
  const [verEdu, setVerEdu] = useState(false);
  const exp = cand.experiencia ?? [];
  const edu = cand.educacion ?? [];
  const intereses = cand.intereses ?? [];
  const expShow = verExp ? exp : exp.slice(0, 3);
  const eduShow = verEdu ? edu : edu.slice(0, 3);

  // Ficha de talento del colaborador. `verHistorial` va en true: aquí quien mira es el formador, y
  // el documento pide que el historial de puestos solo se vea desde su vista.
  if (esInterno && vista === "ficha") {
    return (
      <Modal onClose={onClose} wide>
        {tabs}
        <FichaTalento cand={cand} vistaFormador />
      </Modal>
    );
  }

  if (esInterno && vista === "comentarios") {
    return (
      <Modal onClose={onClose} wide>
        {tabs}
        <h3 style={{ marginBottom: 4 }}>Comentarios sobre {cand.nombre}</h3>
        <ComentariosCandidato cand={cand} formadores={formadores ?? []} />
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} wide>
      {tabs}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
        <Avatar nombre={cand.nombre} foto={cand.foto} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 18 }}>{cand.nombre}</h3>
          <div style={{ color: "var(--gold-dark)", fontSize: 14, fontWeight: 700, marginTop: 1 }}>{cand.puesto}</div>
          <div style={{ color: "var(--gray)", fontSize: 12.5 }}>{cand.area}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Chip tone={cand.tipo === "interno" ? "gold" : ""} icon={Building2}>{cand.tipo === "interno" ? "Candidato interno" : "Candidato externo"}</Chip>
            {/* Semáforo de movilidad también aquí, en la pestaña de perfil: el formador lo consulta
                desde el Marketplace y no siempre entra a la ficha de talento. */}
            {nivelMovilidad(cand) && <Chip tone={nivelMovilidad(cand)!.tono}>{nivelMovilidad(cand)!.etiqueta}</Chip>}
            <Chip icon={MapPin}>{cand.ciudad}</Chip>
            <Chip icon={Briefcase}>{cand.exp} años de experiencia</Chip>
            <Chip icon={GraduationCap}>{String(cand.edu ?? "")}</Chip>
          </div>
        </div>
        {match != null && <MatchRing v={match} size={64} />}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn gold sm" onClick={() => descargarCV(cand)}><Download size={14} /> Descargar CV</button>
        {onFav && <button className={"iconact fav" + (fav ? " on" : "")} title={fav ? "Quitar de favoritos" : "Marcar favorito"} onClick={onFav}><Heart size={15} /></button>}
        {onCat && <button className={"iconact" + (enCat ? " on" : "")} title="Categorizar" onClick={onCat}><FolderPlus size={15} /></button>}
        {onCompartir && <button className="iconact" title="Compartir con otro formador" onClick={onCompartir}><Share2 size={15} /></button>}
        {onArchivar && <button className="iconact" title={archivado ? "Restaurar al Marketplace de talento" : "Archivar de esta vacante"} onClick={onArchivar}>{archivado ? <ArchiveRestore size={15} /> : <Archive size={15} />}</button>}
      </div>

      {cand.resumen && <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 12 }}>{cand.resumen}</p>}
      {intereses.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label>Interés actual</label>
          <div className="tagpick">{intereses.map((i) => <Chip key={i} tone="gold">{i}</Chip>)}</div>
        </div>
      )}
      {req && <div className="chip ok" style={{ marginBottom: 12 }}><CheckCircle2 size={12} /> En verde: coincidencias con el descriptivo de la vacante</div>}

      <div className="grid2">
        <div><label>Especialidades</label><div className="tagpick">{cand.esp.map((e) => <MC key={e} e={e} hit={espHit(e)} base="gold" />)}</div></div>
        <div><label>Modalidad y expectativa</label><div className="tagpick"><Chip>{cand.modalidad}</Chip><Chip>{money(Number(cand.salario ?? 0))} /mes esperado</Chip></div></div>
        <div><label>Habilidades técnicas</label><div className="tagpick">{cand.hard.map((e) => <MC key={e} e={e} hit={hardHit(e)} />)}</div></div>
        <div><label>Habilidades blandas</label><div className="tagpick">{cand.soft.map((e) => <MC key={e} e={e} hit={softHit(e)} />)}</div></div>
      </div>

      {exp.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label>Experiencia</label>
          {expShow.map((e, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 5, lineHeight: 1.4 }}>
              • <b>{e.puesto || "—"}</b>{e.empresa ? ` — ${e.empresa}` : ""}
              {rangoFechas(e.inicio, e.fin) && <span style={{ color: "var(--gray)" }}> ({rangoFechas(e.inicio, e.fin)})</span>}
            </div>
          ))}
          {exp.length > 3 && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setVerExp((x) => !x)}>{verExp ? "Ver menos" : `Ver más (${exp.length - 3})`}</button>}
        </div>
      )}
      {edu.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label>Educación</label>
          {eduShow.map((e, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 5, lineHeight: 1.4 }}>
              • <b>{e.titulo || "—"}</b>{e.institucion ? ` — ${e.institucion}` : ""}
              {rangoFechas(e.inicio, e.fin) && <span style={{ color: "var(--gray)" }}> ({rangoFechas(e.inicio, e.fin)})</span>}
            </div>
          ))}
          {edu.length > 3 && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setVerEdu((x) => !x)}>{verEdu ? "Ver menos" : `Ver más (${edu.length - 3})`}</button>}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        {extra}
      </div>
    </Modal>
  );
}
