/** Inicio del formador (port fiel de `FormadorHome`): stats + vacantes con timeline de fases. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { FasesBar } from "../../components/common/FasesBar";
import { PlantillaCards } from "../../components/formador/PlantillaCards";
import { candidatoElegido } from "../../utils/fases";
import { diasActivaLabel } from "../../utils/format";
import { PIPE_IDX } from "../../constants/catalogos";

export function MisVacantesPage() {
  const { formadorId } = useDemo();
  const { vacantes, loading } = useData();
  const navigate = useNavigate();
  const [soloCompletadas, setSoloCompletadas] = useState(false);

  if (loading) return <p>Cargando…</p>;

  const mias = vacantes.filter((v) => v.formadorId === formadorId);
  const completadas = mias.filter((v) => v.estado === "cerrada").length;
  const activos = mias.reduce(
    (a, v) => a + Object.values(v.pipeline).filter((p) => (PIPE_IDX[p.estado] ?? -1) >= 0 && p.estado !== "contratado").length,
    0,
  );
  const listadas = mias.filter((v) => !soloCompletadas || v.estado === "cerrada");

  return (
    <div>
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="stat"><b>{mias.filter((v) => v.estado !== "cerrada").length}</b><span>Vacantes activas a tu cargo</span></div>
        <div className="stat"><b>{activos}</b><span>Candidatos en proceso</span></div>
        <div
          className={"stat" + (soloCompletadas ? " stat-on" : "")}
          onClick={completadas ? () => setSoloCompletadas((s) => !s) : undefined}
          style={{ cursor: completadas ? "pointer" : "default" }}
          title={completadas ? "Ver histórico de vacantes completadas" : undefined}
        >
          <b style={{ color: completadas ? "var(--ok)" : "inherit" }}>{completadas}</b><span>Vacantes completadas</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 15 }}>{soloCompletadas ? "Histórico de vacantes completadas" : "Tus vacantes y su avance en el proceso"}</h3>
        {soloCompletadas && <button className="btn ghost sm" onClick={() => setSoloCompletadas(false)}>Ver todas</button>}
      </div>

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

      {mias.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 12px", flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15 }}>Plantilla de tu equipo</h3>
            <span className="help" style={{ margin: 0 }}>Toca una posición para revisarla y publicarla.</span>
          </div>
          <PlantillaCards vacantes={mias} />
        </>
      )}
    </div>
  );
}
