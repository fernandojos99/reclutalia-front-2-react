/**
 * Detalle de vacante del formador — port fiel del `VacanteDetail` original.
 * Usa useData() (db + actions) en lugar de `db`/`run(ACT...)`, y react-router para la navegación.
 */
import { useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin, Clock, ShieldCheck, CheckCircle2, Sparkles, Filter, Users, Plus, FileText,
  Archive, ArchiveRestore, Heart, FolderPlus, Share2, User, Download, Send, Star, Video,
  Calendar, CalendarCheck, Link2, ClipboardList, ClipboardCheck, Bell, PartyPopper, Zap, AlertCircle, FileSignature,
  ChevronLeft, ChevronRight, UserCheck,
} from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { Avatar } from "../../components/common/Avatar";
import { MatchRing } from "../../components/common/MatchRing";
import { EstadoChip } from "../../components/common/EstadoChip";
import { FasesBar } from "../../components/common/FasesBar";
import { ConfirmarModal } from "../../components/common/ConfirmarModal";
import { PerfilModal } from "../../components/candidato/PerfilModal";

import { InvitarModal } from "../../components/formador/InvitarModal";
import { AgendaModal } from "../../components/formador/AgendaModal";
import { AssessmentModal } from "../../components/formador/AssessmentModal";
import { EntrevistaModal, VerEntrevistaModal, evalEmoji, evalLabel } from "../../components/formador/EntrevistaModal";
import { EntrevistasExtra } from "../../components/formador/EntrevistasExtra";
import { VideoIAResumenModal } from "../../components/formador/VideoIAResumenModal";
import { OfertaTool } from "../../components/formador/OfertaTool";
import { PasosMovilidad } from "../../components/formador/PasosMovilidad";
import { Celebracion } from "../../components/formador/Celebracion";
import { BusquedaIAOverlay, CategorizarModal, CompartirModal, SolicitarMasModal } from "../../components/formador/poolModals";
import { money, diasActivaLabel, mapsUrl, folioCita } from "../../utils/format";
import { procesoActivoEnOtra } from "../../utils/pipeline";
import { matchScore } from "../../utils/match";
import { nivelMovilidad } from "../../utils/movilidad";
import { descargarCV } from "../../utils/descargarCV";
import { candidatoElegido, faseVacante } from "../../utils/fases";
import { EDUCACION, PIPE_IDX } from "../../constants/catalogos";
import type { Candidato, PipelineEntry, Vacante } from "../../types/models/domain";

function tabInicial(v: Vacante): number {
  const { subpaso } = faseVacante(v);
  const ps = Object.values(v.pipeline || {});
  const mx = ps.length ? Math.max(...ps.map((p) => PIPE_IDX[p.estado] ?? -1)) : -1;
  if (subpaso === 3 && mx < PIPE_IDX.slots_enviados) return 2;
  if (subpaso === 6 && v.estado !== "cerrada" && mx < PIPE_IDX.contratado) return 5;
  return subpaso;
}

interface PoolRow { cid: number; match: number; c: Candidato; p?: PipelineEntry; }
interface FiltroVals { skills: string[]; expMin: number; edu: string; tipo: string; soloFav: boolean; categoria: string; }
const FILTRO_VACIO: FiltroVals = { skills: [], expMin: 0, edu: "", tipo: "ambos", soloFav: false, categoria: "" };

export function VacanteDetailPage() {
  const { vacId = "" } = useParams();
  const [searchParams] = useSearchParams(); // `?tab=1` permite enlazar directo al Marketplace
  const { vacantes, candidatos, formadores, actions } = useData();
  const { toast } = useDemo();
  const navigate = useNavigate();
  const v = vacantes.find((x) => x.id === vacId);

  const [tab, setTab] = useState<number | null>(null);
  const [perfil, setPerfil] = useState<{ c: Candidato; match: number } | null>(null);
  const [invitando, setInvitando] = useState<Candidato | null>(null);
  /** Sucesor al que se va a seleccionar sin proceso. Se confirma antes: el salto es irreversible. */
  const [seleccionarSucesor, setSeleccionarSucesor] = useState<Candidato | null>(null);
  const [selEnt, setSelEnt] = useState<number[]>([]);
  // Assessment: se convoca para UN candidato, así que guarda su cid, no una lista.
  const [assessment, setAssessment] = useState<number | null>(null);
  const [agenda, setAgenda] = useState(false);
  const [entrevistando, setEntrevistando] = useState<{ c: Candidato; p: PipelineEntry; externa: boolean } | null>(null);
  const [confirmSel, setConfirmSel] = useState<{ cid: number; c: Candidato } | null>(null);
  const [verVideoIA, setVerVideoIA] = useState<{ c: Candidato; p: PipelineEntry } | null>(null);
  const [verEnt, setVerEnt] = useState<{ c: Candidato; p: PipelineEntry } | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [fOpen, setFOpen] = useState(false);
  const [fVals, setFVals] = useState<FiltroVals>(FILTRO_VACIO);
  const [verArch, setVerArch] = useState(false);
  const [catCand, setCatCand] = useState<Candidato | null>(null);
  const [shareCand, setShareCand] = useState<Candidato | null>(null);
  const [solicitar, setSolicitar] = useState(false);
  const [firma, setFirma] = useState("");
  /** Bloquea los botones del trámite de transferencia mientras la petición está en vuelo. */
  const [enviandoMov, setEnviandoMov] = useState(false);

  /**
   * Envoltorio de los pasos del trámite de movilidad. Se comparte entre los dos botones porque el
   * manejo de error es idéntico: el backend rechaza con un mensaje ya redactado para el formador
   * (que falta la validación previa, que el proceso no está en el estado correcto), y lo único
   * sensato es enseñárselo tal cual.
   */
  const correrMovilidad = async (accion: () => Promise<unknown>, aviso: string) => {
    setEnviandoMov(true);
    try {
      await accion();
      toast(aviso);
    } catch (e) {
      toast("No se pudo avanzar el trámite: " + (e as Error).message);
    } finally {
      setEnviandoMov(false);
    }
  };

  if (!v) return <p>Cargando vacante…</p>;
  const tabQuery = Number(searchParams.get("tab"));
  const tabActual = tab ?? (Number.isInteger(tabQuery) && searchParams.has("tab") ? tabQuery : tabInicial(v));
  const setTabActual = (i: number) => setTab(i);

  const cand = (cid: number | string): Candidato | undefined => candidatos.find((c) => c.id === Number(cid));
  const f = formadores.find((x) => x.id === v.formadorId);
  const favs = f?.favoritosCands ?? [];
  const cats = f?.categorias ?? [];
  const archivados = v.archivados ?? [];
  const filtroSkills = [...new Set([...(v.req.hardSkills || []), ...(v.req.softSkills || [])])];

  const pasaFiltro = (c: Candidato): boolean => {
    if (fVals.tipo !== "ambos" && c.tipo !== (fVals.tipo === "internos" ? "interno" : "externo")) return false;
    if (fVals.expMin && c.exp < Number(fVals.expMin)) return false;
    if (fVals.edu && EDUCACION.indexOf(c.edu as (typeof EDUCACION)[number]) < EDUCACION.indexOf(fVals.edu as (typeof EDUCACION)[number])) return false;
    if (fVals.skills.length && !fVals.skills.every((s) => c.hard.includes(s) || c.soft.includes(s))) return false;
    if (fVals.soloFav && !favs.includes(c.id)) return false;
    if (fVals.categoria && !cats.find((cat) => cat.nombre === fVals.categoria)?.cids.includes(c.id)) return false;
    return true;
  };
  const fActivo = fVals.skills.length > 0 || Number(fVals.expMin) > 0 || !!fVals.edu || fVals.tipo !== "ambos" || fVals.soloFav || !!fVals.categoria;
  const enCategoria = (cid: number) => cats.some((c) => c.cids.includes(cid));

  const pipe = Object.entries(v.pipeline).map(([cid, p]) => ({ cid: Number(cid), p, c: cand(cid)! }));
  const evaluados = pipe
    .filter((x) => ["evaluado", "slots_enviados", "agendado", "entrevistado", "seleccionado", "docs_completos", "oferta_enviada", "oferta_aceptada", "contratado"].includes(x.p.estado))
    .sort((a, b) => (b.p.matchIA || b.p.match) - (a.p.matchIA || a.p.match));
  const agendados = pipe.filter((x) => x.p.estado === "agendado");
  const entrevistados = pipe.filter((x) => ["entrevistado", "seleccionado", "docs_completos", "oferta_enviada", "oferta_aceptada", "contratado"].includes(x.p.estado));
  /**
   * Entrevistas adicionales solicitadas que aún no se realizan, en toda la vacante.
   * Hasta que sean cero no se elige finalista: la gracia de pedir más opiniones es tenerlas todas.
   */
  const extrasPendientes = pipe.reduce(
    (n, { p }) => n + (p.entrevistasExtra ?? []).filter((e) => e.estado !== "realizada").length,
    0,
  );
  const entrevistasHist = pipe.filter((x) => x.p.entrevista && ["entrevistado", "seleccionado", "docs_completos", "oferta_enviada", "oferta_aceptada", "contratado", "descartado"].includes(x.p.estado));
  const seleccionado = pipe.find((x) => ["seleccionado", "docs_completos", "oferta_enviada", "oferta_aceptada", "contratado"].includes(x.p.estado));
  const contratado = pipe.find((x) => x.p.estado === "contratado");
  const abierta = v.estado === "abierta" || v.estado === "cerrada";

  const SimBtn = ({ cid, label }: { cid: number; label?: string }) => (
    <button className="btn sm" style={{ background: "var(--ai-soft)", color: "var(--ai)", border: "1px dashed #C7CBF5" }}
      onClick={() => { void actions.simular(v.id, cid); toast("Acción del candidato simulada (modo demo)"); }}>
      <Zap size={12} /> {label || "Simular respuesta del candidato"}
    </button>
  );

  /** Mini-chips de requisitos/filtros aprobados por tipo de candidato (4.1). Jorge Luis (id 2): ⚠ en buró. */
  const FiltroChecks = ({ c }: { c: Candidato }) => {
    const buroWarn = c.id === 2;
    // "Línea de crédito" y "Pruebas universales" son validaciones de externos: un interno ya las
    // tiene resueltas por ser empleado.
    const items: [string, boolean][] = c.tipo === "interno"
      ? [["Comportamiento ejemplar", false], ["Antigüedad", false], ["Desempeño", false]]
      : [["PLD", false], ["Listas azules", false], ["Círculo de crédito", buroWarn], ["Reingreso", false],
         ["Línea de crédito", false], ["Pruebas universales", false]];
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
        {items.map(([l, warn]) => (
          <span key={l} className={"chip " + (warn ? "gold" : "ok")} style={{ fontSize: 10.5 }}>
            {warn ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />} {l}
          </span>
        ))}
        {buroWarn && c.tipo === "externo" && (
          <button className="btn ghost sm" onClick={() => toast("Solicitud de liberación enviada (simulado)")}>Pedir liberación</button>
        )}
      </div>
    );
  };

  const poolCard = ({ cid, match, c, p }: PoolRow, archivado: boolean, esSucesor = false) => (
    <div className="trow" key={cid} style={archivado ? { opacity: 0.7 } : {}}>
      <MatchRing v={match} />
      <Avatar nombre={c.nombre} />
      <div className="trow-body" style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 14 }}>{c.nombre}</b> <Chip tone={c.tipo === "interno" ? "gold" : ""}>{c.tipo}</Chip>
        {/* El semáforo, pegado al tipo: solo los internos lo tienen y así se leen juntos.
            OCULTO por CSS (`.semaforo-pool` en styles/base.css), no borrado: se pidió quitarlo de
            esta fila pero puede volver a hacer falta. Para restaurarlo, borra esa regla. */}
        {nivelMovilidad(c) && (
          <span className="semaforo-pool">
            <Chip tone={nivelMovilidad(c)!.tono}>{nivelMovilidad(c)!.etiqueta}</Chip>
          </span>
        )}
        {favs.includes(cid) && <Chip tone="bad"><Heart size={11} /> Favorito</Chip>}
        <div style={{ fontSize: 12.5, color: "var(--gray)" }}>{c.puesto} · {c.exp} años · {c.ciudad}</div>
        <div className="tagpick" style={{ marginTop: 5 }}>{c.esp.slice(0, 2).map((e) => <span key={e} className="chip">{e}</span>)}{c.hard.slice(0, 2).map((e) => <span key={e} className="chip">{e}</span>)}</div>
        {cats.filter((cat) => cat.cids.includes(cid)).map((cat) => <span key={cat.nombre} className="chip gold" style={{ marginTop: 5, marginRight: 5 }}><FolderPlus size={11} /> {cat.nombre}</span>)}
        {p && <div style={{ marginTop: 6 }}><EstadoChip estado={p.estado} /></div>}
      </div>
      <div className="trow-acts" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        {archivado ? (
          <button className="btn ghost sm" onClick={() => { void actions.archivarCand(v.id, cid); toast("Candidato restaurado al Marketplace de talento"); }}><ArchiveRestore size={13} /> Restaurar</button>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn ghost sm" onClick={() => setPerfil({ c, match })}><User size={13} /> Ver perfil</button>
              <button className="btn ghost sm" onClick={() => descargarCV(c)}><Download size={13} /> CV</button>
              {/* Al sucesor se le ofrecen DOS caminos, y son distintos a propósito: invitarlo lo
                  mete al proceso normal —compite, se le entrevista—, mientras que seleccionarlo
                  reconoce que la decisión ya estaba tomada al designarlo y se salta los pasos
                  intermedios. Al resto del Marketplace solo se le puede invitar. */}
              {!p && (procesoActivoEnOtra(vacantes, cid, v.id)
                ? <span className="chip" title="El candidato ya participa en otro proceso de selección"><AlertCircle size={11} /> En otro proceso</span>
                : <>
                    <button className="btn gold sm" onClick={() => setInvitando(c)}><Send size={13} /> Invitar</button>
                    {esSucesor && (
                      <button className="btn dark sm" onClick={() => setSeleccionarSucesor(c)}>
                        <UserCheck size={13} /> Seleccionar
                      </button>
                    )}
                  </>)}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={"iconact fav" + (favs.includes(cid) ? " on" : "")} title="Marcar como favorito" onClick={() => void actions.toggleFavCand(v.formadorId, cid)}><Heart size={15} /></button>
              <button className={"iconact" + (enCategoria(cid) ? " on" : "")} title="Categorizar" onClick={() => setCatCand(c)}><FolderPlus size={15} /></button>
              <button className="iconact" title="Compartir con otro formador" onClick={() => setShareCand(c)}><Share2 size={15} /></button>
              <button className="iconact" title="Archivar de esta vacante" onClick={() => { void actions.archivarCand(v.id, cid); toast("Candidato archivado de esta vacante"); }}><Archive size={15} /></button>
            </div>
            {p && ["invitado", "postulado", "filtros_ok"].includes(p.estado) && <SimBtn cid={cid} />}
          </>
        )}
      </div>
    </div>
  );

  const BANDAS = [
    { label: "Candidatos ideales", desc: "90% o más de compatibilidad", col: "var(--ok)", test: (m: number) => m >= 90 },
    { label: "Candidatos adecuados", desc: "70% – 89% de compatibilidad", col: "#3E9B5F", test: (m: number) => m >= 70 && m < 90 },
    { label: "Candidatos adicionales", desc: "menos de 70%", col: "#8B5E34", test: (m: number) => m < 70 },
  ];
  const toggleSkill = (s: string) => setFVals((x) => ({ ...x, skills: x.skills.includes(s) ? x.skills.filter((y) => y !== s) : [...x.skills, s] }));

  const poolAll: PoolRow[] = (v.pool || []).map(({ cid, match }) => ({ cid, match, c: cand(cid)!, p: v.pipeline[cid] }));
  const poolArch = poolAll.filter((x) => archivados.includes(x.cid));

  /**
   * Sucesor designado de la posición. Se muestra AUNQUE no esté en el pool: designarlo es una
   * decisión del formador, no un resultado del matcher, así que un match por debajo del umbral no
   * puede hacerlo desaparecer. Si no está en el pool, su porcentaje se calcula aquí con el mismo
   * `matchScore` que usa el backend.
   */
  const sucesor: PoolRow | null = (() => {
    if (v.sucesorCid == null || archivados.includes(v.sucesorCid)) return null;
    const c = cand(v.sucesorCid);
    if (!c) return null;
    // Respeta los filtros como cualquier otra fila: si el formador filtra por externos, el
    // sucesor (que siempre es interno) desaparece igual que el resto.
    if (!pasaFiltro(c)) return null;
    const enPool = poolAll.find((x) => x.cid === v.sucesorCid);
    return enPool ?? { cid: c.id, match: matchScore(c, v.req), c, p: v.pipeline[c.id] };
  })();

  // Fuera de las bandas: ya se pinta arriba y no debe salir dos veces.
  const poolVis = poolAll.filter(
    (x) => !archivados.includes(x.cid) && x.cid !== sucesor?.cid && pasaFiltro(x.c),
  );

  return (
    <div>
      <Link className="crumb" to="/formador" style={{ display: "inline-block", marginBottom: 12 }}>← Volver a mis vacantes</Link>

      <div className={"card" + (v.estado === "cerrada" ? " ok" : "")} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 19 }}>{v.req.titulo}</h2>
              <Chip>{v.id}</Chip>
              {v.req.tipoVacante === "Confidencial" && <Chip tone="gold" icon={ShieldCheck}>Confidencial</Chip>}
              {v.estado === "asignada" && <Chip tone="gold">Pendiente de tu aprobación</Chip>}
              {v.estado === "cambios" && <Chip>Esperando cambios del admin</Chip>}
              {v.estado === "abierta" && (candidatoElegido(v) ? <Chip tone="ok" icon={CheckCircle2}>Candidato elegido</Chip> : <Chip tone="ok">Búsqueda activa</Chip>)}
              {v.estado === "cerrada" && <Chip tone="ok" icon={CheckCircle2}>Cubierta</Chip>}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <Chip icon={MapPin}>{v.req.ubicacionTrabajo} · {v.req.modalidad}</Chip>
              <Chip>{money(v.req.sueldo ?? Math.round((v.req.salarioMin + v.req.salarioMax) / 2 / 500) * 500)} /mes</Chip>
              <Chip icon={Clock}>{v.req.horario}</Chip>
            </div>
          </div>
          <Chip icon={Clock} tone={v.estado === "cerrada" ? "ok" : "gold"}>{diasActivaLabel(v)}</Chip>
        </div>
      </div>

      <div style={{ margin: "0 0 16px" }}><FasesBar v={v} activo={tabActual} onSub={setTabActual} /></div>

      {/*
        El descriptivo de solo lectura se sustituye por el asistente de edición y publicación, que
        es donde de verdad se trabaja la vacante. Publicada, se entra viendo el anuncio actual con
        la opción de editarlo; sin publicar, por la pestaña de perfil.
      */}
      {tabActual === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 34 }}>
          <FileText size={26} color="var(--gold-dark)" style={{ marginBottom: 8 }} />
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>
            {abierta ? "Tu publicación está activa" : "Revisa y publica esta vacante"}
          </h3>
          <p className="help" style={{ maxWidth: 460, margin: "0 auto 16px" }}>
            {abierta
              ? "Puedes ver cómo se ve la publicación actual y editarla; al actualizarla se recalcula el Marketplace si cambiaron las habilidades."
              : "Verifica el perfil, la compensación, los beneficios y las herramientas para publicarla."}
          </p>
          <button className="btn gold" onClick={() => navigate(`/formador/vacante/${v.id}/revisar`)}>
            {abierta ? "Ver y editar la publicación" : "Ir al asistente de la vacante"}
          </button>
        </div>
      )}

      {tabActual === 1 && abierta && (
        <div>
          <div className="aibox" style={{ marginBottom: 14 }}>
            <div className="hd"><Sparkles size={15} /> Marketplace de talento</div>
            <p style={{ fontSize: 12.5 }}>Se evaluaron <b>{candidatos.length} perfiles</b> del marketplace (internos y externos). Se muestran <b>{(v.pool || []).length} compatibles</b> ordenados por match; los perfiles sin relación se descartaron automáticamente.</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <button className={"btn sm " + (fActivo ? "gold" : "ghost")} onClick={() => setFOpen((o) => !o)}><Filter size={13} /> Filtrar{fActivo ? " · activos" : ""}</button>
            <span className="help">{poolVis.length} de {poolAll.length - poolArch.length} candidato(s){fActivo ? " tras filtros" : ""}</span>
            <div style={{ flex: 1 }} />
            {poolArch.length > 0 && <button className="btn ghost sm" onClick={() => setVerArch((a) => !a)}><Archive size={13} /> {verArch ? "Ocultar" : "Ver"} archivados ({poolArch.length})</button>}
            <button className="btn gold sm" onClick={() => setSolicitar(true)}><Plus size={13} /> Solicitar búsqueda</button>
          </div>

          {fOpen && (
            <div className="filtpanel">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <b style={{ fontSize: 13.5 }}><Filter size={14} style={{ verticalAlign: -2 }} /> Filtrar candidatos del Marketplace de talento</b>
                <div style={{ flex: 1 }} />
                <button className="btn ghost sm" onClick={() => setFVals(FILTRO_VACIO)}>Limpiar filtros</button>
              </div>
              {filtroSkills.length > 0 && (
                <div className="field">
                  <label>Habilidades y herramientas de la vacante</label>
                  <div className="tagpick">{filtroSkills.map((s) => <button key={s} className={"tag" + (fVals.skills.includes(s) ? " on" : "")} onClick={() => toggleSkill(s)}>{s}</button>)}</div>
                </div>
              )}
              <div className="grid3">
                <div className="field"><label>Años de experiencia (mínimo)</label>
                  <select value={fVals.expMin} onChange={(e) => setFVals((x) => ({ ...x, expMin: Number(e.target.value) }))}>
                    {[0, 1, 2, 3, 5, 8, 10].map((n) => <option key={n} value={n}>{n === 0 ? "Cualquiera" : n + "+ años"}</option>)}
                  </select></div>
                <div className="field"><label>Nivel de estudios (mínimo)</label>
                  <select value={fVals.edu} onChange={(e) => setFVals((x) => ({ ...x, edu: e.target.value }))}>
                    <option value="">Cualquiera</option>{EDUCACION.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
                  </select></div>
                <div className="field"><label>Tipo de candidato</label>
                  <select value={fVals.tipo} onChange={(e) => setFVals((x) => ({ ...x, tipo: e.target.value }))}>
                    <option value="ambos">Ambos</option><option value="internos">Internos</option><option value="externos">Externos</option>
                  </select></div>
              </div>
              <div className="grid2" style={{ marginTop: 4 }}>
                <div className="field" style={{ marginBottom: 0 }}><label>Guardados</label>
                  <button type="button" className={"tag" + (fVals.soloFav ? " on" : "")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => setFVals((x) => ({ ...x, soloFav: !x.soloFav }))}>
                    <Heart size={12} fill={fVals.soloFav ? "currentColor" : "none"} /> Solo favoritos ({favs.length})
                  </button></div>
                {cats.length > 0 && (
                  <div className="field" style={{ marginBottom: 0 }}><label>Categoría</label>
                    <select value={fVals.categoria} onChange={(e) => setFVals((x) => ({ ...x, categoria: e.target.value }))}>
                      <option value="">Todas</option>{cats.map((c) => <option key={c.nombre} value={c.nombre}>{c.nombre} ({c.cids.length})</option>)}
                    </select></div>
                )}
              </div>
            </div>
          )}

          {poolVis.length === 0 && !sucesor ? (
            <div className="card" style={{ textAlign: "center", padding: "36px 24px" }}>
              {fActivo ? (
                <>
                  <Filter size={26} color="var(--gray)" style={{ marginBottom: 8 }} />
                  <p style={{ color: "var(--gray)" }}>Ningún candidato coincide con los filtros seleccionados.</p>
                  <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setFVals(FILTRO_VACIO)}>Limpiar filtros</button>
                </>
              ) : (
                <>
                  <Users size={30} color="var(--gold-dark)" style={{ marginBottom: 10 }} />
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>No hay candidatos compatibles disponibles</h3>
                  <p style={{ color: "var(--gray)", maxWidth: 440, margin: "0 auto 16px" }}>Solicita a nuestro equipo de reclutamiento que busque talento a la medida de esta vacante.</p>
                  <button className="btn gold" onClick={() => setSolicitar(true)}><Users size={16} /> Solicitar búsqueda</button>
                </>
              )}
            </div>
          ) : (
            <>
            {/* El sucesor encabeza el Marketplace: es la persona que el formador ya había decidido
                que cubriría esta posición, y verla después de un ranking la enterraría. */}
            {sucesor && (
              <div>
                <div className="band-div">
                  <b style={{ color: "var(--gold-dark)" }}>Candidato sucesor</b>
                  <span className="cnt">· designado para cubrir esta posición</span>
                  <div className="ln" style={{ background: "var(--gold)" }} />
                </div>
                {poolCard(sucesor, false, true)}
              </div>
            )}
            {BANDAS.map((b) => {
              const grupo = poolVis.filter((x) => b.test(x.match));
              if (!grupo.length) return null;
              return (
                <div key={b.label}>
                  <div className="band-div">
                    <b style={{ color: b.col }}>{b.label}</b>
                    <span className="cnt">· {b.desc} · {grupo.length}</span>
                    <div className="ln" style={{ background: b.col }} />
                  </div>
                  {grupo.map((x) => poolCard(x, false))}
                </div>
              );
            })}
            </>
          )}

          {verArch && poolArch.length > 0 && (
            <div>
              <div className="band-div"><b style={{ color: "var(--gray)" }}>Archivados</b><span className="cnt">· ocultos del pool · {poolArch.length}</span><div className="ln" style={{ background: "var(--gray)" }} /></div>
              {poolArch.map((x) => poolCard(x, true))}
            </div>
          )}
        </div>
      )}

      {tabActual === 1 && !abierta && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}>
          <Users size={26} style={{ marginBottom: 8 }} />
          <p>Todavía no publicas esta vacante, así que su Marketplace de talento aún no existe.</p>
          <p className="help">Revisa el perfil, la compensación, los beneficios y las herramientas para publicarla.</p>
          <Link className="btn gold sm" to={`/formador/vacante/${v.id}/revisar`} style={{ marginTop: 14 }}>
            Revisar y publicar la vacante
          </Link>
        </div>
      )}

      {tabActual === 2 && abierta && (
        <div>
          {evaluados.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}>
              <Video size={26} style={{ marginBottom: 8 }} /><p>Aún no hay candidatos evaluados. Cuando los invitados completen sus documentos, los filtros automáticos y la video-entrevista con IA, aparecerán aquí ranqueados.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Star size={16} color="var(--gold-dark)" /><b>Ranking de candidatos</b>
                <span className="help">Ranking recalculado por la IA tras filtros (buró, empleos previos, PLD) y video-entrevista. Puedes invitar a entrevista a un máximo de 3 candidatos a la vez.</span>
              </div>
              {evaluados.map(({ cid, p, c }, i) => (
                <div className="trow" key={cid} style={i < 3 ? { borderColor: "var(--gold)", background: "#FFFDF6" } : {}}>
                  {i < 3 && <span className="chip gold" style={{ minWidth: 52, justifyContent: "center" }}>Top {i + 1}</span>}
                  <MatchRing v={p.matchIA || p.match} />
                  <Avatar nombre={c.nombre} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{c.nombre}</b> <Chip tone={c.tipo === "interno" ? "gold" : ""}>{c.tipo === "interno" ? "Interno" : "Externo"}</Chip>
                    <div style={{ fontSize: 12.5, color: "var(--gray)" }}>{c.puesto} · {c.ciudad}</div>
                    <div style={{ marginTop: 6 }}><EstadoChip estado={p.estado} /></div>
                  </div>
                  <div className="trow-acts" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <FiltroChecks c={c} />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button className="btn ghost sm" onClick={() => setPerfil({ c, match: p.matchIA || p.match })}>Ver detalles</button>
                      <button className="btn ai sm" onClick={() => setVerVideoIA({ c, p })}><Video size={13} /> Ver entrevista IA</button>
                      <button className="btn ghost sm" onClick={() => descargarCV(c)}><Download size={13} /> CV</button>
                      {p.estado === "evaluado" && (
                        <button className={"btn sm " + (selEnt.includes(cid) ? "dark" : "gold")}
                          disabled={!selEnt.includes(cid) && selEnt.length >= 3}
                          title={!selEnt.includes(cid) && selEnt.length >= 3 ? "Límite alcanzado: máximo 3 candidatos por ronda de entrevistas" : ""}
                          onClick={() => setSelEnt((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : s.length < 3 ? [...s, cid] : s))}>
                          {selEnt.includes(cid) ? "Quitar de la lista" : <><Calendar size={13} /> Invitar a entrevista</>}
                        </button>
                      )}
                    </div>
                    {p.estado === "slots_enviados" && <SimBtn cid={cid} label="Simular confirmación de horario" />}
                  </div>
                </div>
              ))}
              {selEnt.length > 0 && (
                <div style={{ position: "sticky", bottom: 16, marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {selEnt.length >= 3 && <span className="chip gold"><AlertCircle size={11} /> Límite alcanzado: máximo 3 candidatos por ronda de entrevistas</span>}
                  <button className="btn dark" onClick={() => setAgenda(true)}><Calendar size={15} /> Agendar entrevista con {selEnt.length} candidato(s)</button>
                  {/* Alternativa a la entrevista uno a uno. Es para un solo candidato: la prueba y
                      su equipo evaluador se arman por persona. */}
                  <button className="btn ghost" disabled={selEnt.length !== 1}
                    title={selEnt.length === 1 ? "Convocar una prueba práctica evaluada por varios formadores" : "Elige un solo candidato para convocar un assessment"}
                    onClick={() => setAssessment(selEnt[0])}>
                    <ClipboardCheck size={15} /> Assessment center
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tabActual === 3 && abierta && (
        <div>
          {agendados.length === 0 && entrevistasHist.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}>
              <Calendar size={26} style={{ marginBottom: 8 }} /><p>No hay entrevistas agendadas todavía. Invita candidatos desde la pestaña "Ranking".</p>
            </div>
          )}
          {agendados.map(({ cid, p, c }) => (
            <div className="trow" key={cid}>
              <Avatar nombre={c.nombre} />
              <div style={{ flex: 1 }}>
                <b>{c.nombre}</b>
                <div style={{ fontSize: 12.5, color: "var(--gray)", marginTop: 2 }}><CalendarCheck size={12} style={{ verticalAlign: -2 }} /> {p.slotElegido} · {p.modalidadEnt}</div>
                {p.modalidadEnt === "Presencial" ? (
                  <div style={{ fontSize: 12, color: "var(--ink2)", marginTop: 2, lineHeight: 1.6 }}>
                    <div><MapPin size={11} style={{ verticalAlign: -1 }} /> {v.req.sede || v.req.ubicacionTrabajo}</div>
                    <a href={mapsUrl(v.req.sede || v.req.ubicacionTrabajo)} target="_blank" rel="noreferrer" style={{ color: "var(--ai)", fontWeight: 600 }}><Link2 size={11} style={{ verticalAlign: -1 }} /> Ver en Google Maps</a>
                    <span style={{ marginLeft: 8 }}>Folio: <b>{folioCita(v.id, cid)}</b></span>
                  </div>
                ) : (
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12, color: "var(--ai)", fontWeight: 600 }}><Link2 size={11} style={{ verticalAlign: -1 }} /> Unirse a la reunión de Teams (simulado)</a>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.modalidadEnt === "Presencial" ? (
                  <button className="btn gold sm" onClick={() => setEntrevistando({ c, p, externa: true })}>Registrar entrevista presencial</button>
                ) : (
                  <button className="btn ai sm" onClick={() => setEntrevistando({ c, p, externa: false })}><Video size={13} /> Iniciar entrevista</button>
                )}
              </div>
            </div>
          ))}
          {entrevistasHist.map(({ cid, p, c }) => (
            <div className="trow" key={cid}>
              <MatchRing v={p.matchFinal ?? 0} />
              <Avatar nombre={c.nombre} />
              <div style={{ flex: 1 }}>
                <b>{c.nombre}</b> <EstadoChip estado={p.estado} />
                <div style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 5, background: "var(--bg)", borderRadius: 8, padding: "8px 10px" }}>
                  {p.entrevista?.calificacion ? <span style={{ float: "right", fontSize: 12, color: "var(--gold-dark)", marginLeft: 10 }} title={"Evaluación: " + evalLabel(p.entrevista.calificacion)}><span style={{ fontSize: 16, verticalAlign: -3 }}>{evalEmoji(p.entrevista.calificacion)}</span> {evalLabel(p.entrevista.calificacion)}</span> : null}
                  <b style={{ fontSize: 11, color: "var(--ai)" }}><Sparkles size={11} style={{ verticalAlign: -1 }} /> RESUMEN IA:</b> {p.entrevista?.resumen}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 4 }}><b style={{ fontSize: 11, color: "var(--gold-dark)" }}>TU FEEDBACK:</b> {p.entrevista?.feedback}</div>
              </div>
            </div>
          ))}

          {/* Entrevistas que este formador puede pedir a otros compañeros para el mismo candidato. */}
          {(agendados.length > 0 || entrevistasHist.length > 0) && (
            <EntrevistasExtra
              v={v}
              filas={[...agendados, ...entrevistasHist].map(({ c, p }) => ({ c, p }))}
              formadores={formadores}
              onSolicitar={(cid, fid) => {
                void actions.solicitarEntrevistaExtra(v.id, cid, fid)
                  .then(() => toast("Entrevista solicitada · el formador fue notificado"))
                  .catch((e: Error) => toast(e.message));
              }}
              onCancelar={(cid, fid) => {
                void actions.cancelarEntrevistaExtra(v.id, cid, fid)
                  .then(() => toast("Entrevista cancelada"))
                  .catch((e: Error) => toast(e.message));
              }}
            />
          )}
        </div>
      )}

      {tabActual === 4 && abierta && (
        <div>
          {!seleccionado && entrevistados.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}><ClipboardList size={26} style={{ marginBottom: 8 }} /><p>Cuando tengas candidatos entrevistados podrás elegir aquí a tu candidato ideal.</p></div>
          )}
          {!seleccionado && entrevistados.map(({ cid, p, c }) => (
            <div className="trow" key={cid}>
              <MatchRing v={p.matchFinal ?? 0} /><Avatar nombre={c.nombre} />
              <div style={{ flex: 1 }}><b>{c.nombre}</b><div style={{ fontSize: 12.5, color: "var(--gray)" }}>{c.puesto} · Entrevistado el {p.entrevista?.fecha}</div></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button className="btn ghost sm" onClick={() => setPerfil({ c, match: p.matchFinal ?? p.match })}><User size={13} /> Ver perfil</button>
                <button className="btn ghost sm" onClick={() => setVerEnt({ c, p })}><Video size={13} /> Ver entrevista</button>
                {/* No se elige finalista mientras quede alguna entrevista solicitada sin realizar. */}
                <button className="btn gold" disabled={extrasPendientes > 0}
                  title={extrasPendientes > 0
                    ? `Faltan ${extrasPendientes} entrevista(s) adicionales por realizar`
                    : undefined}
                  onClick={() => setConfirmSel({ cid, c })}><CheckCircle2 size={15} /> Seleccionar como candidato ideal</button>
              </div>
            </div>
          ))}
          {seleccionado && (
            <div className="card">
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <Avatar nombre={seleccionado.c.nombre} />
                <div style={{ flex: 1 }}><b style={{ fontSize: 15 }}>{seleccionado.c.nombre}</b> <Chip tone="ok" icon={CheckCircle2}>Candidato seleccionado</Chip>
                  <div style={{ fontSize: 12.5, color: "var(--gray)" }}>{seleccionado.c.tipo === "interno"
                    ? "Se notificó al colaborador. Al ser interno pasa directo a su carta oferta, sin subir documentación. Los demás candidatos fueron notificados y canalizados a otras vacantes compatibles."
                    : "Se notificó al candidato con la felicitación y el checklist de documentos. Los demás candidatos fueron notificados y canalizados a otras vacantes compatibles."}</div></div>
                {seleccionado.p.estado === "seleccionado" && seleccionado.c.tipo === "externo" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <button className="btn gold sm" onClick={() => { void actions.recordarDocs(v.id, seleccionado.cid); toast("Recordatorio enviado a " + seleccionado.c.nombre.split(" ")[0]); }}><Bell size={13} /> Enviar recordatorio de documentos</button>
                    <span className="chip ok"><Bell size={11} /> Auto recordatorios cada 24 horas — activado</span>
                    <SimBtn cid={seleccionado.cid} label="Simular carga de documentos" />
                  </div>
                )}
              </div>
              {seleccionado.c.tipo === "interno" ? (
                <div className="chip ok"><CheckCircle2 size={12} /> Colaborador interno · su expediente ya está en la empresa, no sube documentación</div>
              ) : (
              <>
              <label>Checklist de documentación del candidato (PDF · máx. 1 MB c/u)</label>
              {[["ine", "Identificación oficial (INE)"], ["curp", "CURP"], ["rfc", "Constancia de situación fiscal (RFC)"], ["domicilio", "Comprobante de domicilio"], ["estudios", "Comprobante de estudios"]].map(([k, l]) => (
                <div key={k} className={"check-item" + (seleccionado.p.docsContrato[k] ? " done" : "")}>
                  {seleccionado.p.docsContrato[k] ? <CheckCircle2 size={18} color="var(--ok)" /> : <Clock size={18} color="var(--gray)" />}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{l}</div>
                  <span className="help">{seleccionado.p.docsContrato[k] ? "Recibido y validado" : "Pendiente del candidato"}</span>
                </div>
              ))}
              {v.req.examenMedico && (
                <div className={"check-item" + (seleccionado.p.medico?.validado ? " done" : "")} style={{ alignItems: "flex-start" }}>
                  {seleccionado.p.medico?.validado ? <CheckCircle2 size={18} color="var(--ok)" /> : <ShieldCheck size={18} color={seleccionado.p.medico ? "var(--warn)" : "var(--gray)"} />}
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>Examen médico</div>
                    {seleccionado.p.medico
                      ? <div className="help">{seleccionado.p.medico.sucursal} · {seleccionado.p.medico.fecha} · {seleccionado.p.medico.validado ? "resultado validado" : "en espera de tu validación"}</div>
                      : <div className="help">El candidato aún no agenda su examen médico.</div>}
                  </div>
                  {seleccionado.p.medico && !seleccionado.p.medico.validado &&
                    <button className="btn gold sm" onClick={() => { void actions.validarMedico(v.id, seleccionado.cid); toast("Examen médico validado · se notificó al candidato"); }}><CheckCircle2 size={13} /> Validar resultado positivo del examen</button>}
                </div>
              )}
              {seleccionado.p.estado !== "seleccionado" && <div className="chip ok" style={{ marginTop: 12 }}><CheckCircle2 size={12} /> Documentación completa — continúa a la carta oferta</div>}
              </>
              )}
            </div>
          )}
        </div>
      )}

      {tabActual === 5 && abierta && (
        <div className="card">
          {!seleccionado && <p style={{ color: "var(--gray)", textAlign: "center", padding: 30 }}>Primero selecciona a tu candidato ideal.</p>}
          {seleccionado && seleccionado.p.estado === "seleccionado" && seleccionado.c.tipo === "externo" && <p style={{ color: "var(--gray)", textAlign: "center", padding: 30 }}>Esperando a que {seleccionado.c.nombre.split(" ")[0]} complete su documentación para habilitar la carta oferta.</p>}
          {/* Al interno se le puede ofrecer ya en "seleccionado": no pasa por documentación, su
              expediente ya está en la empresa. La guardia del backend lo permite igual. */}
          {seleccionado && (seleccionado.p.estado === "docs_completos"
            || (seleccionado.p.estado === "seleccionado" && seleccionado.c.tipo === "interno")) && (
            <>
              <h3 style={{ marginBottom: 14 }}>Preparar carta oferta · {seleccionado.c.nombre}</h3>
              <OfertaTool v={v} cand={seleccionado.c} onSend={(m, fch, u) => { void actions.enviarOferta(v.id, seleccionado.cid, m, fch, u); toast("Carta oferta enviada al candidato"); }} />
            </>
          )}
          {seleccionado && seleccionado.p.estado === "oferta_enviada" && (
            <div style={{ textAlign: "center", padding: 26 }}>
              <Send size={26} color="var(--gold-dark)" style={{ marginBottom: 8 }} />
              <h3>Carta oferta enviada</h3>
              <p style={{ color: "var(--gray)", fontSize: 13, margin: "6px 0 14px" }}>
                {money(seleccionado.p.oferta?.monto ?? 0)} /mes
                {seleccionado.c.tipo === "interno" ? " · fecha de ingreso por acordar" : ` · ingreso el ${seleccionado.p.oferta?.fecha}`}.
                {" "}Te notificaremos cuando {seleccionado.c.nombre.split(" ")[0]} responda.
              </p>
              <SimBtn cid={seleccionado.cid} label="Simular aceptación de oferta" />
            </div>
          )}
          {/* En un movimiento interno el formador YA NO FIRMA: la etapa de contratación desaparece
              de su lado y en su lugar acompaña el trámite de transferencia. Los dos últimos pasos
              los cierra el propio colaborador, y con eso el proceso queda contratado. */}
          {seleccionado && seleccionado.p.estado === "oferta_aceptada" && seleccionado.c.tipo === "interno" && (
            <PasosMovilidad
              cand={seleccionado.c} p={seleccionado.p} enviando={enviandoMov}
              formadorActual={formadores.find((f) => f.id === seleccionado.c.formadorId)?.nombre}
              onAvanzar={() => void correrMovilidad(
                () => actions.avanzarTransferencia(v.id, seleccionado.cid),
                "Validación de documentos completada",
              )}
              onDefinir={(fecha, sede) => void correrMovilidad(
                () => actions.definirIngreso(v.id, seleccionado.cid, fecha, sede),
                "Fecha de ingreso y sede confirmadas",
              )}
            />
          )}
          {seleccionado && seleccionado.p.estado === "oferta_aceptada" && seleccionado.c.tipo === "externo" && (
            <div>
              <h3 style={{ marginBottom: 4 }}>Firma del contrato · {seleccionado.c.nombre}</h3>
              <p className="help" style={{ marginBottom: 14 }}>
                {seleccionado.c.nombre.split(" ")[0]} aceptó la oferta ({money(seleccionado.p.oferta?.monto ?? 0)} /mes · ingreso {seleccionado.p.oferta?.fecha}).{" "}
                Para firmar necesitas su cuenta de nómina registrada.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
                <button className="btn ghost sm" onClick={() => toast("Kit de contratación enviado (Mintrace · simulado)")}><Send size={13} /> Enviar kit de contratación (Mintrace)</button>
                {seleccionado.p.cuentaBanco
                  ? <span className="chip ok"><CheckCircle2 size={11} /> Cuenta de nómina registrada ••••{String(seleccionado.p.cuentaBanco).slice(-4)}</span>
                  : <><span className="chip gold"><Clock size={11} /> Esperando apertura de cuenta del candidato</span><SimBtn cid={seleccionado.cid} label="Simular apertura de cuenta" /></>}
              </div>
              <div className="field" style={{ maxWidth: 420 }}>
                <label>Ingresar firma del candidato (nombre completo) *</label>
                <input value={firma} onChange={(e) => setFirma(e.target.value)} placeholder={seleccionado.c.nombre} style={{ fontStyle: "italic" }} />
                <div className="help">La firma capturada queda asociada al contrato (simulado).</div>
              </div>
              <button className="btn gold"
                disabled={!seleccionado.p.cuentaBanco || !firma.trim()}
                onClick={() => { void actions.firmarContrato(v.id, seleccionado.cid); setFirma(""); setTabActual(6); toast("Contrato firmado · contratación completada 🎉"); }}>
                <FileSignature size={15} /> Firmar contrato
              </button>
              {seleccionado.p.cuentaBanco && !firma.trim() && (
                <div className="help" style={{ marginTop: 6 }}>Captura el nombre completo del candidato como firma para habilitar el botón.</div>
              )}
            </div>
          )}
          {contratado && (
            <div>
              <div className="chip ok" style={{ marginBottom: 10 }}>
                <CheckCircle2 size={12} />{" "}
                {contratado.c.tipo === "interno"
                  ? "Movilidad completada — ve a la pestaña Contratación"
                  : "Contrato firmado — ve a la pestaña Contratación"}
              </div>
              <div className="grid3">
                <div className="stat"><b style={{ fontSize: 18 }}>{contratado.p.numEmpleado}</b><span>Número de empleado</span></div>
                <div className="stat"><b style={{ fontSize: 15 }}>{contratado.p.numEmpleado}@elektra.com.mx</b><span>Correo corporativo</span></div>
                <div className="stat"><b style={{ fontSize: 15, color: "var(--ok)" }}>Okta ✓</b><span>Accesos lógicos confirmados</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {tabActual === 6 && abierta && (
        contratado ? <Celebracion cand={contratado.c} p={contratado.p} v={v} /> :
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray)" }}><PartyPopper size={26} style={{ marginBottom: 8 }} /><p>Aquí verás la pantalla de cierre cuando firmes el contrato de tu candidato (pestaña Carta oferta).</p></div>
      )}

      {abierta && (
        <div className="paso-nav">
          <button className="btn ghost sm" disabled={tabActual <= 0} onClick={() => setTabActual(Math.max(0, tabActual - 1))}>
            <ChevronLeft size={14} /> Anterior
          </button>
          <button className="btn ghost sm" disabled={tabActual >= 6} onClick={() => setTabActual(Math.min(6, tabActual + 1))}>
            Siguiente paso <ChevronRight size={14} />
          </button>
        </div>
      )}

      {buscando && <BusquedaIAOverlay onDone={() => { void actions.aprobarVacante(v.id); setBuscando(false); setTabActual(1); toast("Vacante aprobada · la IA generó tu Marketplace de talento"); }} />}
      {catCand && <CategorizarModal cand={catCand} cats={cats}
        onToggle={(nombre) => void actions.toggleCategoria(v.formadorId, nombre, catCand.id)}
        onCrear={(nombre) => void actions.crearCategoria(v.formadorId, nombre)}
        onClose={() => setCatCand(null)} />}
      {shareCand && <CompartirModal cand={shareCand}
        onEnviar={(dest) => { toast("Perfil de " + shareCand.nombre.split(" ")[0] + " compartido con " + dest + " (simulado)"); setShareCand(null); }}
        onClose={() => setShareCand(null)} />}
      {solicitar && <SolicitarMasModal v={v}
        onConfirmar={(multi) => { void actions.solicitarMas(v.id, multi); setSolicitar(false); toast("Solicitud enviada · recibirás candidatos en los próximos días"); }}
        onClose={() => setSolicitar(false)} />}
      {perfil && <PerfilModal cand={perfil.c} match={perfil.match} req={v.req} onClose={() => setPerfil(null)}
        formadores={formadores}
        fav={favs.includes(perfil.c.id)} enCat={enCategoria(perfil.c.id)} archivado={archivados.includes(perfil.c.id)}
        onFav={() => void actions.toggleFavCand(v.formadorId, perfil.c.id)}
        onCat={() => setCatCand(perfil.c)}
        onArchivar={() => { const era = archivados.includes(perfil.c.id); void actions.archivarCand(v.id, perfil.c.id); toast(era ? "Candidato restaurado al Marketplace de talento" : "Candidato archivado de esta vacante"); }}
        onCompartir={() => { setShareCand(perfil.c); setPerfil(null); }}
        extra={!v.pipeline[perfil.c.id] && abierta && <button className="btn gold" onClick={() => { setInvitando(perfil.c); setPerfil(null); }}><Send size={15} /> Invitar a postularse</button>} />}
      {invitando && <InvitarModal cand={invitando} v={v} onClose={() => setInvitando(null)}
        onSend={(msg) => { void actions.invitar(v.id, invitando.id, msg); setInvitando(null); toast("Invitación enviada a " + invitando.nombre.split(" ")[0]); }} />}
      {/* Se confirma porque no hay vuelta atrás cómoda: cierra el proceso de todos los demás
          candidatos y deja a este a un paso de la carta oferta. */}
      {seleccionarSucesor && (
        <ConfirmarModal
          titulo={`Seleccionar a ${seleccionarSucesor.nombre.split(" ")[0]} sin proceso`}
          mensaje={`${seleccionarSucesor.nombre} pasa directo a esperar su carta oferta: no habrá entrevistas, ` +
            "ranking ni documentación. El proceso del resto de candidatos de esta vacante se cierra."}
          confirmar="Seleccionar sucesor"
          cancelar="Cancelar"
          onCerrar={() => setSeleccionarSucesor(null)}
          onConfirmar={() => {
            const nombre = seleccionarSucesor.nombre.split(" ")[0];
            void correrMovilidad(
              () => actions.seleccionarSucesor(v.id, seleccionarSucesor.id),
              `${nombre} fue seleccionado · prepara su carta oferta`,
            );
            setSeleccionarSucesor(null);
            setTabActual(5);
          }} />
      )}
      {assessment != null && cand(assessment) && (
        <AssessmentModal cand={cand(assessment)!} formadores={formadores} formadorVacante={v.formadorId}
          onClose={() => setAssessment(null)}
          onSend={(ev, slots, mod, proyecto) => {
            void actions.crearAssessment(v.id, assessment, ev, slots, mod, proyecto);
            setAssessment(null); setSelEnt([]);
            toast("Assessment convocado · el candidato elegirá uno de los 3 horarios");
          }} />
      )}
      {agenda && <AgendaModal cands={selEnt.map((id) => cand(id)!).filter(Boolean)} onClose={() => setAgenda(false)}
        onSend={(slots, mod) => { void actions.enviarSlots(v.id, selEnt, slots, mod); setAgenda(false); setSelEnt([]); toast("Opciones de horario enviadas a los candidatos"); }} />}
      {verVideoIA && <VideoIAResumenModal cand={verVideoIA.c} v={v} match={verVideoIA.p.matchIA || verVideoIA.p.match} onClose={() => setVerVideoIA(null)} />}
      {verEnt && <VerEntrevistaModal cand={verEnt.c} p={verEnt.p} onClose={() => setVerEnt(null)} />}
      {entrevistando && <EntrevistaModal cand={entrevistando.c} v={v} p={entrevistando.p} externa={entrevistando.externa} onClose={() => setEntrevistando(null)}
        onSave={(data) => { void actions.registrarEntrevista(v.id, entrevistando.c.id, data); setEntrevistando(null); toast("Entrevista guardada · ranking actualizado por la IA"); }} />}
      {confirmSel && (
        <ConfirmSelModal v={v} confirmSel={confirmSel} entrevistados={entrevistados}
          onConfirm={() => { void actions.seleccionar(v.id, confirmSel.cid); setConfirmSel(null); setTabActual(4); toast("Candidato seleccionado · notificaciones enviadas"); }}
          onClose={() => setConfirmSel(null)} />
      )}
    </div>
  );
}

function ConfirmSelModal({ v, confirmSel, entrevistados, onConfirm, onClose }: {
  v: Vacante; confirmSel: { cid: number; c: Candidato };
  entrevistados: { cid: number; p: PipelineEntry; c: Candidato }[];
  onConfirm: () => void; onClose: () => void;
}) {
  const rk = [...entrevistados].sort((a, b) => (b.p.matchFinal || 0) - (a.p.matchFinal || 0));
  const pos = rk.findIndex((x) => x.cid === confirmSel.cid) + 1;
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3 style={{ marginBottom: 8 }}>¿Confirmas tu decisión?</h3>
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>Estás por elegir al candidato <b>{confirmSel.c.nombre}</b>, con ranking <b>#{pos}</b>, como candidato ideal para "{v.req.titulo}", y continuarás con la contratación. Se le enviará la felicitación con el checklist de documentos. <b>Los demás candidatos entrevistados permanecerán en el proceso durante 72 horas</b> y, de no ser seleccionados, serán descartados automáticamente y sugeridos a vacantes similares.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn gold" onClick={onConfirm}><CheckCircle2 size={15} /> Sí, continuar con la contratación</button>
          <button className="btn ghost" onClick={onClose}>Volver</button>
        </div>
      </div>
    </div>
  );
}
