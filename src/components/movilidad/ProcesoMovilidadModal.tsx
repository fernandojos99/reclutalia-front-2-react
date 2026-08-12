/**
 * ETAPA 1 · Ventana que se abre desde el aviso de un nuevo proceso de movilidad.
 *
 * Muestra las tres cosas que pide el documento: el colaborador en proceso, el puesto que va a quedar
 * por cubrir y las fichas de talento con mejor afinidad y semáforo verde.
 */
import { ArrowRight, Briefcase } from "lucide-react";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";
import { Chip } from "../common/Chip";
import { MatchRing } from "../common/MatchRing";
import { antiguedad, candidatosParaCubrir, nivelMovilidad } from "../../utils/movilidad";
import type { Candidato, Vacante } from "../../types/models/domain";

interface Props {
  /** Colaborador que inició el proceso de movilidad. */
  cand: Candidato;
  /** Vacante hacia la que se mueve, si sigue existiendo. */
  vacante?: Vacante;
  candidatos: Candidato[];
  onVerFicha: (c: Candidato) => void;
  onClose: () => void;
}

export function ProcesoMovilidadModal({ cand, vacante, candidatos, onVerFicha, onClose }: Props) {
  const sucesores = candidatosParaCubrir(cand, candidatos);

  return (
    <Modal onClose={onClose} wide>
      <h3 style={{ fontSize: 17, marginBottom: 12 }}>Proceso de movilidad en tu equipo</h3>

      {/* Quién se mueve y hacia dónde. */}
      <div className="card" style={{ margin: 0, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Avatar nombre={cand.nombre} foto={cand.foto} />
        <div style={{ flex: 1, minWidth: 170 }}>
          <b>{cand.nombre}</b>
          <div className="help">{cand.puesto}{antiguedad(cand) ? ` · ${antiguedad(cand)} en el puesto` : ""}</div>
        </div>
        <ArrowRight size={18} color="var(--gray)" />
        <div style={{ flex: 1, minWidth: 170 }}>
          <b>{vacante ? vacante.req.titulo : "Vacante no disponible"}</b>
          <div className="help">{vacante ? `${vacante.id} · ${vacante.req.area}` : "El proceso ya no apunta a una vacante activa."}</div>
        </div>
      </div>

      {/* El puesto que quedará libre: es lo que el formador tiene que prever. */}
      <div style={{ marginTop: 18 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Briefcase size={13} /> Puesto por cubrir si el proceso concluye
        </label>
        <div className="card" style={{ margin: "6px 0 0" }}>
          <b style={{ fontSize: 15 }}>{cand.puesto}</b>
          <div className="help">{cand.departamento ?? cand.area} · {cand.ciudad}</div>
          <div className="tagpick" style={{ marginTop: 8 }}>
            {cand.esp.map((e) => <Chip key={e} tone="gold">{e}</Chip>)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <label>Fichas de talento con mejor afinidad y movilidad alta</label>
        {sucesores.length ? (
          <div style={{ marginTop: 6 }}>
            {sucesores.map(({ c, afinidad }) => {
              const mov = nivelMovilidad(c);
              return (
                <div key={c.id} className="card" style={{ margin: "0 0 8px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <MatchRing v={afinidad} size={44} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <b>{c.nombre}</b>
                    <div className="help">{c.puesto} · {c.departamento ?? c.area}</div>
                  </div>
                  {mov && <Chip tone={mov.tono}>{mov.corto}</Chip>}
                  <button className="btn ghost sm" onClick={() => { onVerFicha(c); onClose(); }}>Ver ficha</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="help" style={{ marginTop: 6 }}>
            No hay colaboradores con semáforo verde que puedan cubrir este puesto. Conviene abrir una
            vacante preventiva.
          </div>
        )}
      </div>
    </Modal>
  );
}
