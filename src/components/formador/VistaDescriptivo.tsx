/**
 * Descriptivo de la vacante en DOS secciones ("El puesto" y "Perfil del candidato").
 * El formador puede EDITAR cada sección; al guardar, los cambios NO se aplican directamente:
 * se envían como PROPUESTA al administrador, que los confirma o rechaza (ver AdminVacantesPage).
 * Ya no existe la edición campo por campo con lápiz: solo estas dos cajas.
 * ⚠️ Row se INVOCA como función ({Row({...})}, no <Row/>) para que sus inputs no pierdan el foco.
 */
import { useState, type ReactNode } from "react";
import { Sparkles, Edit3, Send, Clock, CheckCircle2, ShieldCheck, Briefcase, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chip } from "../common/Chip";
import { CambiosResumen } from "../common/CambiosResumen";
import { TagPicker } from "../ui/uploads";
import { money } from "../../utils/format";
import { PROFESIONES, TURNOS, ESPECIALIDADES, HARD_SKILLS, SOFT_SKILLS, TIPOS_VACANTE } from "../../constants/catalogos";
import { PERFIL_POR_AREA, PERFIL_AREA_DEFAULT } from "../../utils/perfilIA";
import type { Requisito, Vacante } from "../../types/models/domain";

interface Props {
  v: Vacante;
  onAprobar: () => void;
  /** Envía una propuesta de edición (req completo + resumen de campos cambiados) al administrador. */
  onSolicitarEdicion: (req: Requisito, resumen: Record<string, string>) => void;
}

/** Campos editables de la sección 2. */
type PerfilDraft = Pick<Requisito, "educacion" | "areasConocimiento" | "espRequeridas" | "hardSkills" | "softSkills" | "ubicacionTrabajo" | "turno" | "anosExp">;

/** Sugerencia determinista de perfil por área (simula a la IA; sin azar). El mapa vive en `utils/perfilIA`. */
function sugerirPerfil(v: Vacante): PerfilDraft {
  const base = PERFIL_POR_AREA[v.req.area] ?? { ...PERFIL_AREA_DEFAULT, espRequeridas: v.req.espRequeridas };
  return {
    educacion: "Licenciatura", ubicacionTrabajo: v.req.ubicacionTrabajo,
    turno: TURNOS[v.id.charCodeAt(v.id.length - 1) % TURNOS.length],
    anosExp: Math.max(1, v.req.anosExp),
    areasConocimiento: base.areasConocimiento.slice(0, 3),
    espRequeridas: base.espRequeridas.slice(0, 5),
    hardSkills: base.hardSkills, softSkills: base.softSkills,
  };
}

const arrEq = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function VistaDescriptivo({ v, onAprobar, onSolicitarEdicion }: Props) {
  const [editSec, setEditSec] = useState<0 | 1 | 2>(0); // 0: ninguna · 1: puesto · 2: perfil
  const [d1, setD1] = useState({ titulo: "", descripcion: "", tipoVacante: "" });
  const [d2, setD2] = useState<PerfilDraft | null>(null);
  const [simulando, setSimulando] = useState(false);
  const r = v.req;
  const puedeEditar = v.estado === "asignada" || v.estado === "abierta";

  const abrirEdit1 = () => { setD1({ titulo: r.titulo, descripcion: r.descripcion, tipoVacante: r.tipoVacante }); setEditSec(1); };
  const abrirEdit2 = () => {
    setD2({ educacion: r.educacion, areasConocimiento: r.areasConocimiento ?? [], espRequeridas: r.espRequeridas, hardSkills: r.hardSkills, softSkills: r.softSkills, ubicacionTrabajo: r.ubicacionTrabajo, turno: r.turno || "Turno Mixto", anosExp: r.anosExp });
    setEditSec(2);
  };

  const guardar1 = () => {
    const resumen: Record<string, string> = {};
    if (d1.titulo !== r.titulo) resumen.titulo = d1.titulo;
    if (d1.descripcion !== r.descripcion) resumen.descripcion = d1.descripcion || "—";
    if (d1.tipoVacante !== r.tipoVacante) resumen.tipoVacante = d1.tipoVacante;
    if (Object.keys(resumen).length) onSolicitarEdicion({ ...r, ...d1 }, resumen);
    setEditSec(0);
  };
  const guardar2 = () => {
    if (!d2) return;
    const resumen: Record<string, string> = {};
    if (d2.educacion !== r.educacion) resumen.educacion = d2.educacion;
    if (!arrEq(d2.areasConocimiento, r.areasConocimiento ?? [])) resumen.areasConocimiento = d2.areasConocimiento.join(", ") || "—";
    if (!arrEq(d2.espRequeridas, r.espRequeridas)) resumen.espRequeridas = d2.espRequeridas.join(", ") || "—";
    if (!arrEq(d2.hardSkills, r.hardSkills)) resumen.hardSkills = d2.hardSkills.join(", ") || "—";
    if (!arrEq(d2.softSkills, r.softSkills)) resumen.softSkills = d2.softSkills.join(", ") || "—";
    if (d2.ubicacionTrabajo !== r.ubicacionTrabajo) resumen.ubicacionTrabajo = d2.ubicacionTrabajo;
    if (d2.turno !== (r.turno || "Turno Mixto")) resumen.turno = d2.turno;
    if (d2.anosExp !== r.anosExp) resumen.anosExp = d2.anosExp + " años";
    if (Object.keys(resumen).length) onSolicitarEdicion({ ...r, ...d2 }, resumen);
    setEditSec(0);
  };
  const simular = () => {
    setSimulando(true);
    window.setTimeout(() => { setD2(sugerirPerfil(v)); setSimulando(false); }, 2200);
  };

  const Row = ({ l, c }: { l: string; c: ReactNode }) => (
    <div style={{ marginBottom: 10 }} key={l}>
      <label>{l}</label>
      <div style={{ fontSize: 13.5 }}>{c}</div>
    </div>
  );

  const SecHeader = ({ icon: Icon, titulo, onEdit }: { icon: typeof Briefcase; titulo: string; onEdit?: () => void }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Icon size={16} color="var(--gold-dark)" />
      <b style={{ fontSize: 14, flex: 1 }}>{titulo}</b>
      {onEdit && puedeEditar && editSec === 0 && (
        <button className="btn ghost sm" onClick={onEdit}><Edit3 size={13} /> Editar</button>
      )}
    </div>
  );

  return (
    <div>
      {v.estado === "asignada" && editSec === 0 && (
        <div className="aibox" style={{ marginBottom: 16 }}>
          <div className="hd"><Sparkles size={15} /> Descriptivo precargado. Aprueba la información para comenzar la búsqueda de candidatos.</div>
        </div>
      )}
      {v.estado === "cambios" && (
        <div className="card" style={{ background: "var(--gold-soft)", borderColor: "#F0D9A5", marginBottom: 16 }}>
          <b style={{ fontSize: 13.5 }}><Clock size={14} style={{ verticalAlign: -2 }} /> Cambios enviados al administrador</b>
          <CambiosResumen cambios={v.cambios} />
          <p className="help">Recibirás una notificación cuando el administrador confirme o rechace tus cambios.</p>
        </div>
      )}

      {/* ── Sección 1 · El puesto ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <SecHeader icon={Briefcase} titulo="El puesto" onEdit={abrirEdit1} />
        {editSec === 1 ? (
          <div>
            <div className="field"><label>Título del puesto</label><input value={d1.titulo} onChange={(e) => setD1((x) => ({ ...x, titulo: e.target.value }))} /></div>
            <div className="field"><label>Descripción</label><textarea rows={4} value={d1.descripcion} onChange={(e) => setD1((x) => ({ ...x, descripcion: e.target.value }))} /></div>
            <div className="field"><label>Tipo de vacante</label>
              <div className="tagpick">{TIPOS_VACANTE.map((t) => <button type="button" key={t} className={"tag" + (d1.tipoVacante === t ? " on" : "")} onClick={() => setD1((x) => ({ ...x, tipoVacante: t }))}>{t}</button>)}</div>
            </div>
            <div className="help" style={{ marginBottom: 10 }}>El sueldo y el área los define Compensaciones / estructura organizacional. Tus cambios se enviarán al administrador para su confirmación.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn gold sm" disabled={!d1.titulo.trim()} onClick={guardar1}><Send size={14} /> Enviar cambios al administrador</button>
              <button className="btn ghost sm" onClick={() => setEditSec(0)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid2">
              <div>
                {Row({ l: "Puesto", c: <b>{r.titulo}</b> })}
              </div>
              <div>
                <div className="grid2">
                  {Row({ l: "Tipo de vacante", c: r.tipoVacante === "Confidencial" ? <Chip tone="gold" icon={ShieldCheck}>Confidencial</Chip> : (r.tipoVacante || "Estándar") })}
                  {Row({ l: "Área", c: r.area })}
                  {Row({ l: "Sueldo", c: <b style={{ color: "var(--gold-dark)" }}>{money(r.sueldo ?? Math.round((r.salarioMin + r.salarioMax) / 2 / 500) * 500)} /mes</b> })}
                  {Row({ l: "Posiciones", c: r.numVacantes })}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 2 }}>
              <label>Descripción</label>
              <div className="desc-md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.descripcion}</ReactMarkdown></div>
            </div>
          </>
        )}
      </div>

      {/* ── Sección 2 · Perfil del candidato ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <SecHeader icon={User} titulo="Perfil del candidato" onEdit={abrirEdit2} />
        {editSec === 2 && d2 ? (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button className="btn sm" style={{ background: "var(--ai-soft)", color: "var(--ai)", border: "1px solid #C7CBF5" }} onClick={simular} disabled={simulando}>
                {simulando ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {simulando ? "Analizando la vacante…" : "Simular con IA"}
              </button>
            </div>
            <div style={simulando ? { opacity: 0.45, pointerEvents: "none" } : undefined}>
              <div className="grid2">
                <div className="field"><label>Años de experiencia</label>
                  <input type="number" min="0" value={d2.anosExp} onChange={(e) => setD2((x) => x && ({ ...x, anosExp: +e.target.value }))} /></div>
                <div className="field"><label>Ubicación</label>
                  <input value={d2.ubicacionTrabajo} onChange={(e) => setD2((x) => x && ({ ...x, ubicacionTrabajo: e.target.value }))} /></div>
              </div>
              <div className="field"><label>Turno</label>
                <div className="tagpick">{TURNOS.map((t) => <button type="button" key={t} className={"tag" + (d2.turno === t ? " on" : "")} onClick={() => setD2((x) => x && ({ ...x, turno: t }))}>{t}</button>)}</div></div>
              <div className="field"><label>Área de conocimiento <span style={{ fontWeight: 400, color: "var(--gray)" }}>(máx. 3)</span></label>
                <TagPicker options={PROFESIONES} value={d2.areasConocimiento} onChange={(nv) => nv.length <= 3 && setD2((x) => x && ({ ...x, areasConocimiento: nv }))} /></div>
              <div className="field"><label>Especialidades <span style={{ fontWeight: 400, color: "var(--gray)" }}>(máx. 5)</span></label>
                <TagPicker options={ESPECIALIDADES} value={d2.espRequeridas} onChange={(nv) => nv.length <= 5 && setD2((x) => x && ({ ...x, espRequeridas: nv }))} addNew /></div>
              <div className="field"><label>Habilidades duras / técnicas</label>
                <TagPicker options={HARD_SKILLS} value={d2.hardSkills} onChange={(nv) => setD2((x) => x && ({ ...x, hardSkills: nv }))} addNew /></div>
              <div className="field"><label>Habilidades blandas</label>
                <TagPicker options={SOFT_SKILLS} value={d2.softSkills} onChange={(nv) => setD2((x) => x && ({ ...x, softSkills: nv }))} addNew /></div>
            </div>
            <div className="help" style={{ margin: "4px 0 10px" }}>Tus cambios se enviarán al administrador para su confirmación.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn gold sm" disabled={simulando || !d2.espRequeridas.length} onClick={guardar2}><Send size={14} /> Enviar cambios al administrador</button>
              <button className="btn ghost sm" disabled={simulando} onClick={() => setEditSec(0)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="grid2">
            <div>
              {(r.areasConocimiento ?? []).length > 0 && Row({ l: "Área de conocimiento", c: <div className="tagpick">{(r.areasConocimiento ?? []).map((e) => <span key={e} className="chip gold">{e}</span>)}</div> })}
              {Row({ l: "Especialidades", c: <div className="tagpick">{r.espRequeridas.map((e) => <span key={e} className="chip gold">{e}</span>)}</div> })}
              {Row({ l: "Habilidades técnicas", c: <div className="tagpick">{r.hardSkills.map((e) => <span key={e} className="chip">{e}</span>)}</div> })}
              {Row({ l: "Habilidades blandas", c: <div className="tagpick">{r.softSkills.map((e) => <span key={e} className="chip">{e}</span>)}</div> })}
              {r.aptitudes.length > 0 && Row({ l: "Aptitudes a evaluar", c: <div className="tagpick">{r.aptitudes.map((e) => <span key={e} className="chip">{e}</span>)}</div> })}
            </div>
            <div>
              <div className="grid2">
                {Row({ l: "Experiencia mínima", c: r.expNoRelevante ? "No relevante" : r.anosExp + " años" })}
                {Row({ l: "Ubicación", c: r.ubicacionTrabajo })}
                {Row({ l: "Modalidad", c: r.modalidad })}
                {Row({ l: "Turno", c: r.turno || "Turno Mixto" })}
                {r.sede && Row({ l: "Sede", c: `${r.tipoSede} · ${r.sede}` })}
                {r.unidadNegocio && Row({ l: "Unidad de Negocio", c: r.unidadNegocio })}
                {r.examenMedico && Row({ l: "Examen médico", c: <Chip tone="gold" icon={ShieldCheck}>Requerido al candidato seleccionado</Chip> })}
              </div>
              {Row({ l: "Historial", c: v.historial.map((h, i) => <div key={i} className="help">• {h}</div>) })}
            </div>
          </div>
        )}
      </div>

      {v.estado === "asignada" && editSec === 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn gold" onClick={onAprobar}><CheckCircle2 size={16} /> Aprobar e iniciar búsqueda</button>
        </div>
      )}
    </div>
  );
}
