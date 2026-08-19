/**
 * Tabla del equipo del formador, con el mismo formato que el Marketplace de talento del
 * administrador.
 *
 * El **estatus** y la **acción recomendada** se calculan aquí y ahora (`utils/movilidad.ts`), no se
 * leen de ningún campo guardado: el proceso del colaborador avanza también fuera de esta pantalla,
 * así que un valor almacenado se desincronizaría en cuanto alguien actuara por otro camino.
 *
 * Es una tabla ancha a propósito. Cada columna lleva su `minWidth` para que no se aplaste el
 * contenido, y el scroll horizontal lo pone `.table-wrap`.
 */
import { Crown, HandHeart, Share2 } from "lucide-react";
import { Chip } from "../common/Chip";
import { InfoTip } from "../common/InfoTip";
import {
  accionRecomendada, antiguedad, estatusHonesteles, estatusMovilidad, haceCuanto,
  nivelDesempeno, nivelMovilidad, vacantesAfines, TONO_ACCION, type EstadoMovilidad,
} from "../../utils/movilidad";
import type { Candidato, Vacante } from "../../types/models/domain";

/** Tono del estatus: lo que pide atención en rojo, lo que ya está en marcha en verde. */
const TONO_ESTATUS: Record<EstadoMovilidad, string> = {
  Inactivo: "bad",
  Actualizado: "",
  "En búsqueda": "gold",
  "En proceso": "gold",
  Seleccionado: "ok",
  Contratado: "ok",
};

/** Qué significa cada estatus. Se muestra al pulsar el "?" de la columna. */
const QUE_SIGNIFICA: Record<EstadoMovilidad, string> = {
  Inactivo: "No ha actualizado su ficha de talento en más de 6 meses.",
  Actualizado: "Tiene su ficha al día, pero todavía no ha empezado a buscar.",
  "En búsqueda": "Está explorando su siguiente puesto con el agente de movilidad.",
  "En proceso": "Se postuló y ya pasó su primera entrevista con IA. Desde aquí no puede postularse a otras vacantes.",
  Seleccionado: "Fue elegido como candidato ideal en una vacante.",
  Contratado: "Aceptó su carta oferta y está en proceso de transferencia.",
};

/** Celda de tags con un pie pequeño; se usa en áreas de experiencia y habilidades. */
function Tags({ items, pie, vacio }: { items: string[]; pie?: string; vacio: string }) {
  if (!items.length) return <span className="help">{vacio}</span>;
  return (
    <>
      <div className="tagpick">{items.map((t) => <Chip key={t}>{t}</Chip>)}</div>
      {pie && <div className="help" style={{ marginTop: 4 }}>{pie}</div>}
    </>
  );
}

interface Props {
  equipo: Candidato[];
  vacantes: Vacante[];
  onVerPerfil: (c: Candidato) => void;
  onRecomendar: (c: Candidato) => void;
  onAgradecer: (c: Candidato) => void;
  onSucesor: (c: Candidato) => void;
}

export function TablaEquipo({ equipo, vacantes, onVerPerfil, onRecomendar, onAgradecer, onSucesor }: Props) {
  /** Posición de la que este colaborador ya es sucesor, si la hay. Solo puede serlo de una. */
  const sucesorDe = (c: Candidato) => vacantes.find((v) => v.sucesorCid === c.id);

  if (!equipo.length) {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
        Ningún colaborador coincide con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="table-wrap">
        <table className="table" style={{ minWidth: 1680 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 190 }}>NOMBRE</th>
              <th style={{ minWidth: 180 }}>PUESTO</th>
              <th style={{ minWidth: 210 }}>ÁREA DE EXPERIENCIA</th>
              <th style={{ minWidth: 110 }}>DESEMPEÑO</th>
              <th style={{ minWidth: 260 }}>HABILIDADES</th>
              <th style={{ minWidth: 170 }}>INTERÉS</th>
              <th style={{ minWidth: 110 }}>SEMÁFORO</th>
              <th style={{ minWidth: 110 }}>ACTAS</th>
              <th style={{ minWidth: 120 }}>VACANTES AFINES</th>
              <th style={{ minWidth: 150 }}>
                ESTATUS{" "}
                <InfoTip etiqueta="Qué significa cada estatus">
                  <b style={{ display: "block", marginBottom: 6 }}>Estatus del colaborador</b>
                  {(Object.keys(QUE_SIGNIFICA) as EstadoMovilidad[]).map((e) => (
                    <div key={e} style={{ marginBottom: 5, lineHeight: 1.45 }}>
                      <b>{e}</b> — {QUE_SIGNIFICA[e]}
                    </div>
                  ))}
                </InfoTip>
              </th>
              <th style={{ minWidth: 150 }}>ACCIÓN RECOMENDADA</th>
              <th style={{ minWidth: 140 }}>ÚLTIMA ACTUALIZACIÓN</th>
              <th style={{ minWidth: 210 }}></th>
            </tr>
          </thead>
          <tbody>
            {equipo.map((c) => {
              const mov = nivelMovilidad(c);
              const des = nivelDesempeno(c);
              const estatus = estatusMovilidad(c, vacantes);
              const accion = accionRecomendada(c, vacantes);
              const honesteles = estatusHonesteles(c);
              const afines = vacantesAfines(c, vacantes);
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
                  <td><Tags items={c.esp} pie={`${c.exp} años de experiencia`} vacio="Sin áreas registradas" /></td>
                  <td>{des ? <Chip tone={des.tono}>{des.etiqueta}</Chip> : <span className="help">—</span>}</td>
                  <td><Tags items={[...c.hard, ...c.soft]} vacio="Sin habilidades registradas" /></td>
                  <td>
                    {intereses.length ? intereses[0] : <span className="help">Sin definir</span>}
                    {intereses.length > 1 && <div className="help">y {intereses.length - 1} más</div>}
                  </td>
                  <td>{mov ? <Chip tone={mov.tono}>{mov.corto}</Chip> : <span className="help">—</span>}</td>
                  {/* Honesteles: en la tabla basta el recuento; los motivos están en la ficha. */}
                  <td>
                    {honesteles
                      ? <Chip tone={honesteles.tono}>{honesteles.n ? honesteles.n : honesteles.tono === "gold" ? "En revisión" : "Ninguna"}</Chip>
                      : <span className="help">—</span>}
                  </td>
                  <td>
                    {afines
                      ? <Chip tone="ok">{afines}</Chip>
                      : <span className="help">Ninguna</span>}
                    <div className="help">con más del 70%</div>
                  </td>
                  <td><Chip tone={TONO_ESTATUS[estatus]}>{estatus}</Chip></td>
                  <td><Chip tone={TONO_ACCION[accion]}>{accion}</Chip></td>
                  <td>
                    {c.perfilActualizado ?? "—"}
                    <div className="help">{haceCuanto(c.perfilActualizado)}</div>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn ghost sm" onClick={() => onVerPerfil(c)}>Ver perfil</button>{" "}
                    <button className="btn ghost sm" title="Compartir este perfil con otro formador"
                      onClick={() => onRecomendar(c)}><Share2 size={12} /> Recomendar</button>{" "}
                    {/* El botón se pinta en dorado cuando ya es sucesor de algo, para no tener que
                        abrir la ventana solo para averiguarlo. */}
                    <button className={"btn sm " + (sucesorDe(c) ? "gold" : "ghost")}
                      title={sucesorDe(c)
                        ? `Sucesor de "${sucesorDe(c)!.req.titulo}"`
                        : "Designar como sucesor de una posición"}
                      onClick={() => onSucesor(c)}><Crown size={12} /> Sucesor</button>
                    {/* Solo cuando ya se va: es el momento de cerrar bien con él. */}
                    {estatus === "Contratado" && (
                      <>
                        {" "}
                        <button className="btn gold sm" onClick={() => onAgradecer(c)}>
                          <HandHeart size={12} /> Agradecer
                        </button>
                      </>
                    )}
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
