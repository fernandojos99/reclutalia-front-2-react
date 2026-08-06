/**
 * Inicio del formador: stats + una sola vista a la vez, alternada con el botón de la cabecera.
 * Arranca en "Plantilla de tu equipo" (lo que se consulta a diario) y el avance de las vacantes
 * queda detrás del toggle "Progreso".
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ListChecks, Users } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { FasesBar } from "../../components/common/FasesBar";
import { PlantillaCards } from "../../components/formador/PlantillaCards";
import { OrganizacionCard } from "../../components/formador/OrganizacionCard";
import { candidatoElegido } from "../../utils/fases";
import { diasActivaLabel } from "../../utils/format";
import { PIPE_IDX } from "../../constants/catalogos";

export function MisVacantesPage() {
  const { formadorId, toast } = useDemo();
  const { vacantes, formadores, loading } = useData();
  const navigate = useNavigate();
  const [soloCompletadas, setSoloCompletadas] = useState(false);
  const [vista, setVista] = useState<"plantilla" | "progreso">("plantilla");

  if (loading) return <p>Cargando…</p>;

  const mias = vacantes.filter((v) => v.formadorId === formadorId);
  const formador = formadores.find((f) => f.id === formadorId);
  const completadas = mias.filter((v) => v.estado === "cerrada").length;
  const activos = mias.reduce(
    (a, v) => a + Object.values(v.pipeline).filter((p) => (PIPE_IDX[p.estado] ?? -1) >= 0 && p.estado !== "contratado").length,
    0,
  );
  const listadas = mias.filter((v) => !soloCompletadas || v.estado === "cerrada");

  const enPlantilla = vista === "plantilla";
  const titulo = enPlantilla
    ? "Plantilla de tu equipo"
    : soloCompletadas ? "Histórico de vacantes completadas" : "Tus vacantes y su avance en el proceso";

  // El histórico de completadas filtra la LISTA de vacantes: si se pide desde la plantilla,
  // hay que saltar a la vista de progreso o el clic no tendría ningún efecto visible.
  const verCompletadas = () => { setSoloCompletadas((s) => !s); setVista("progreso"); };

  return (
    <div>
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="stat"><b>{mias.filter((v) => v.estado !== "cerrada").length}</b><span>Vacantes activas a tu cargo</span></div>
        <div className="stat"><b>{activos}</b><span>Candidatos en proceso</span></div>
        <div
          className={"stat" + (soloCompletadas ? " stat-on" : "")}
          onClick={completadas ? verCompletadas : undefined}
          style={{ cursor: completadas ? "pointer" : "default" }}
          title={completadas ? "Ver histórico de vacantes completadas" : undefined}
        >
          <b style={{ color: completadas ? "var(--ok)" : "inherit" }}>{completadas}</b><span>Vacantes completadas</span>
        </div>
      </div>

      {formador && (
        <OrganizacionCard
          formador={formador}
          vacantes={mias}
          onSolicitar={() => toast("Solicitud de ajustes enviada al administrador")}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 15 }}>{titulo}</h3>
        {enPlantilla && <span className="help" style={{ margin: 0 }}>Toca una posición para revisarla y publicarla.</span>}
        {!enPlantilla && soloCompletadas && <button className="btn ghost sm" onClick={() => setSoloCompletadas(false)}>Ver todas</button>}
        <button
          className="btn ghost sm"
          style={{ marginLeft: "auto" }}
          onClick={() => setVista((v) => (v === "plantilla" ? "progreso" : "plantilla"))}
          title={enPlantilla ? "Ver el avance de tus vacantes" : "Ver la plantilla de tu equipo"}
        >
          {enPlantilla ? <><ListChecks size={13} /> Progreso</> : <><Users size={13} /> Plantilla</>}
        </button>
      </div>

      {enPlantilla ? (
        mias.length ? (
          <PlantillaCards vacantes={mias} />
        ) : (
          <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
            El administrador aún no te asigna vacantes.
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
                  <b style={{ fontSize: 15 }}>{v.req.titulo}</b><Chip>{v.id}</Chip>
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
              {soloCompletadas ? "Aún no tienes vacantes completadas." : "El administrador aún no te asigna vacantes."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
