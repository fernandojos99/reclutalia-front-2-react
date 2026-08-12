/**
 * Tabla del equipo del formador, con el mismo formato que el Marketplace de talento del
 * administrador.
 *
 * El **estatus** y la **acción recomendada** se calculan aquí y ahora (`utils/movilidad.ts`), no se
 * leen de ningún campo guardado: el proceso del colaborador avanza también fuera de esta pantalla,
 * así que un valor almacenado se desincronizaría en cuanto alguien actuara por otro camino.
 */
import { Chip } from "../common/Chip";
import {
  accionRecomendada, antiguedad, avancePlan, estatusMovilidad, haceCuanto,
  nivelDesempeno, nivelMovilidad, rankingVacantes, TONO_ACCION,
} from "../../utils/movilidad";
import { UMBRAL_AFINIDAD } from "../../constants/catalogos";
import type { Candidato, Vacante } from "../../types/models/domain";

/** Tono del estatus: lo que pide atención en rojo, lo que ya está en marcha en verde. */
const TONO_ESTATUS: Record<string, string> = {
  Inactivo: "bad",
  Actualizado: "",
  "En búsqueda": "gold",
  "En proceso": "gold",
  Seleccionado: "ok",
  Contratado: "ok",
};

interface Props {
  equipo: Candidato[];
  vacantes: Vacante[];
  onVerPerfil: (c: Candidato) => void;
}

export function TablaEquipo({ equipo, vacantes, onVerPerfil }: Props) {
  if (!equipo.length) {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
        Todavía no tienes colaboradores internos a tu cargo.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>NOMBRE</th><th>PUESTO</th><th>ESPECIALIDADES</th><th>DESEMPEÑO</th>
              <th>HABILIDADES</th><th>INTERÉS</th><th>SEMÁFORO</th><th>ESTATUS</th>
              <th>ACCIÓN RECOMENDADA</th><th>ÚLTIMA ACTUALIZACIÓN</th><th></th>
            </tr>
          </thead>
          <tbody>
            {equipo.map((c) => {
              const mov = nivelMovilidad(c);
              const des = nivelDesempeno(c);
              const estatus = estatusMovilidad(c, vacantes);
              const accion = accionRecomendada(c, vacantes);
              const plan = avancePlan(c);
              const mejor = rankingVacantes(c, vacantes)[0];
              const intereses = c.puestosInteres ?? [];

              return (
                <tr key={c.id}>
                  <td>
                    <b>{c.nombre}</b>
                    <div className="help">{c.departamento ?? c.area}</div>
                  </td>
                  <td>
                    {c.puesto}
                    <div className="help">{antiguedad(c) || "sin antigüedad registrada"}</div>
                  </td>
                  <td>
                    {c.esp.slice(0, 2).join(", ") || "—"}
                    <div className="help">{c.exp} años de experiencia</div>
                  </td>
                  <td>{des ? <Chip tone={des.tono}>{des.etiqueta}</Chip> : <span className="help">—</span>}</td>
                  {/* "Habilidades" no venía definida en el documento: se muestran las técnicas y,
                      si hay plan, cuánto lleva cubierto de él. */}
                  <td>
                    {c.hard.slice(0, 2).join(", ") || "—"}
                    <div className="help">
                      {plan.total ? `${plan.hechas} de ${plan.total} del plan` : "sin plan"}
                    </div>
                  </td>
                  <td>
                    {intereses.length ? intereses[0] : <span className="help">Sin definir</span>}
                    {intereses.length > 1 && <div className="help">y {intereses.length - 1} más</div>}
                  </td>
                  <td>{mov ? <Chip tone={mov.tono}>{mov.corto}</Chip> : <span className="help">—</span>}</td>
                  <td><Chip tone={TONO_ESTATUS[estatus] ?? ""}>{estatus}</Chip></td>
                  <td>
                    <Chip tone={TONO_ACCION[accion]}>{accion}</Chip>
                    {mejor && mejor.afinidad >= UMBRAL_AFINIDAD && (
                      <div className="help">{mejor.afinidad}% en {mejor.v.req.titulo}</div>
                    )}
                  </td>
                  <td>
                    {haceCuanto(c.perfilActualizado)}
                    <div className="help">{c.perfilActualizado ?? "—"}</div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn ghost sm" onClick={() => onVerPerfil(c)}>Ver perfil</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
