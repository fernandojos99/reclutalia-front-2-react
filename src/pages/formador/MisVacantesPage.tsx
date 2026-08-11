/**
 * Inicio del formador: stats + una sola vista a la vez, alternada con el botón de la cabecera.
 * Arranca en "Plantilla de tu equipo" (lo que se consulta a diario) y el avance de las vacantes
 * queda detrás del toggle "Progreso".
 *
 * Las dos vistas NO listan lo mismo a propósito: la plantilla es la foto del equipo vivo (lo que
 * sigue a tu cargo), mientras que progreso es el histórico completo, cerradas incluidas, para poder
 * entrar a revisar un proceso que ya terminó.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ListChecks, Users } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { FasesBar } from "../../components/common/FasesBar";
import { PlantillaCards } from "../../components/formador/PlantillaCards";
import { candidatoElegido } from "../../utils/fases";
import { diasActivaLabel } from "../../utils/format";
import type { Vacante } from "../../types/models/domain";

/**
 * Vista elegida la última vez. Vive en el módulo, no en el componente: la página se desmonta al
 * entrar a una vacante y volver, y el toggle debe recordar dónde estabas. Se pierde al refrescar,
 * que es justo el alcance pedido — por eso no usa localStorage.
 */
let vistaRecordada: "plantilla" | "progreso" = "plantilla";

/** Tamaño de la plantilla del equipo. Dato de demo: no se deriva de las vacantes. */
const PLANTILLA_TOTAL = 10;

/** Pendientes por cubrir: las que todavía no salieron a buscar candidatos. */
const esAsignada = (v: Vacante) => v.estado === "asignada" || v.estado === "cambios";
/** Publicadas y buscando candidatos. */
const esPublicada = (v: Vacante) => v.estado === "abierta";

type Filtro = "todas" | "asignadas" | "publicadas";

export function MisVacantesPage() {
  const { formadorId } = useDemo();
  const { vacantes, formadores, loading } = useData();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [vista, setVistaState] = useState<"plantilla" | "progreso">(vistaRecordada);
  const setVista = (v: "plantilla" | "progreso") => { vistaRecordada = v; setVistaState(v); };

  if (loading) return <p>Cargando…</p>;

  const mias = vacantes.filter((v) => v.formadorId === formadorId);
  const formador = formadores.find((f) => f.id === formadorId);
  const asignadas = mias.filter(esAsignada);
  const publicadas = mias.filter(esPublicada);

  const enPlantilla = vista === "plantilla";
  // La plantilla es el equipo vivo: una posición cerrada ya está cubierta y no cuelga del árbol.
  const base = enPlantilla ? mias.filter((v) => v.estado !== "cerrada") : mias;
  const listadas = filtro === "asignadas" ? base.filter(esAsignada)
    : filtro === "publicadas" ? base.filter(esPublicada)
      : base;

  const titulo = enPlantilla
    ? "Plantilla de tu equipo"
    : filtro === "asignadas" ? "Vacantes asignadas pendientes por cubrir"
      : filtro === "publicadas" ? "Vacantes publicadas y buscando candidatos"
        : "Tus vacantes y su avance en el proceso";

  /** Las cajas alternan su filtro; volver a pulsar la activa lo quita. */
  const alternar = (f: Filtro) => setFiltro((x) => (x === f ? "todas" : f));

  return (
    <div>
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="stat"><b>{PLANTILLA_TOTAL}</b><span>Plantilla total</span></div>
        <div
          className={"stat" + (filtro === "asignadas" ? " stat-on" : "")}
          onClick={() => alternar("asignadas")}
          style={{ cursor: "pointer" }}
          title="Ver solo las vacantes pendientes por cubrir"
        >
          <b>{asignadas.length}</b><span>Vacantes asignadas</span>
        </div>
        <div
          className={"stat" + (filtro === "publicadas" ? " stat-on" : "")}
          onClick={() => alternar("publicadas")}
          style={{ cursor: "pointer" }}
          title="Ver solo las vacantes publicadas y buscando candidatos"
        >
          <b style={{ color: publicadas.length ? "var(--ok)" : "inherit" }}>{publicadas.length}</b>
          <span>Vacantes publicadas</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 15 }}>{titulo}</h3>
        {enPlantilla && filtro === "todas" && <span className="help" style={{ margin: 0 }}>Toca una posición para revisarla y publicarla.</span>}
        {filtro !== "todas" && <button className="btn ghost sm" onClick={() => setFiltro("todas")}>Ver todas</button>}
        <button
          className="btn ghost sm"
          style={{ marginLeft: "auto" }}
          onClick={() => setVista(enPlantilla ? "progreso" : "plantilla")}
          title={enPlantilla ? "Ver el avance de tus vacantes" : "Ver la plantilla de tu equipo"}
        >
          {enPlantilla ? <><ListChecks size={13} /> Progreso</> : <><Users size={13} /> Plantilla</>}
        </button>
      </div>

      {enPlantilla ? (
        listadas.length ? (
          <PlantillaCards vacantes={listadas} formador={formador} />
        ) : (
          <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
            {filtro === "todas" ? "El administrador aún no te asigna vacantes." : "Ninguna vacante coincide con ese filtro."}
          </div>
        )
      ) : (
        <>
          {listadas.map((v) => {
            const enProceso = Object.keys(v.pipeline).length;
            return (
              <div className={"card" + (v.estado === "cerrada" ? " ok" : "")} key={v.id} style={{ marginBottom: 14, cursor: "pointer" }}
                onClick={() => navigate(`/formador/vacante/${v.id}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 15 }}>{v.req.tituloPublicacion || v.req.titulo}</b><Chip>{v.id}</Chip>
                  {v.estado === "asignada" && <Chip tone="gold" icon={AlertCircle}>Requiere tu revisión</Chip>}
                  {v.estado === "cambios" && <Chip icon={Clock}>Esperando al admin</Chip>}
                  {v.estado === "abierta" && (candidatoElegido(v) ? <Chip tone="ok" icon={CheckCircle2}>Candidato elegido</Chip> : <Chip tone="ok">Búsqueda activa</Chip>)}
                  {v.estado === "cerrada" && <Chip tone="ok" icon={CheckCircle2}>Cubierta</Chip>}
                  <span style={{ marginLeft: "auto" }} className="help">{enProceso ? enProceso + " candidato(s) en proceso" : ""}</span>
                  <Chip icon={Clock}>{diasActivaLabel(v)}</Chip>
                  <ChevronRight size={16} color="var(--gray)" />
                </div>
                <div style={{ marginTop: 14 }}><FasesBar v={v} timeline /></div>
              </div>
            );
          })}
          {!listadas.length && (
            <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
              {filtro === "todas" ? "El administrador aún no te asigna vacantes." : "Ninguna vacante coincide con ese filtro."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
