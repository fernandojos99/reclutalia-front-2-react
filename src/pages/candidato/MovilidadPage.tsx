/**
 * Colaborador · MOVILIDAD. Solo existe para candidatos internos: un externo no se mueve dentro del
 * grupo porque todavía no está dentro.
 *
 * Tres secciones en un navegador superior: Ficha de talento · Agente de movilidad · Ranking de
 * vacantes. El chat del agente llega en la Fase 3; aquí ya funciona el plan de desarrollo, que es
 * dato de la ficha y no depende del agente.
 */
import { useState } from "react";
import { Calendar, FileText, MapPin } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { EstadoChip } from "../../components/common/EstadoChip";
import { InfoTip } from "../../components/common/InfoTip";
import { MatchRing } from "../../components/common/MatchRing";
import { FichaTalento } from "../../components/movilidad/FichaTalento";
import { PlanDesarrolloPanel } from "../../components/movilidad/PlanDesarrolloPanel";
import { DetalleVacanteModal, AplicarModal } from "../../components/candidato/buscarModals";
import { money } from "../../utils/format";
import { procesoActivoEnOtra } from "../../utils/pipeline";
import { rankingVacantes } from "../../utils/movilidad";
import { UMBRAL_AFINIDAD } from "../../constants/catalogos";
import type { Candidato, Vacante } from "../../types/models/domain";

const SECCIONES = ["Ficha de talento", "Agente de movilidad", "Ranking de vacantes"] as const;

const MANUAL_AGENTE = `El agente de movilidad te acompaña a dar tu siguiente paso dentro del grupo.

Qué hace:
· Te propone puestos a los que podrías llegar según tu ficha de talento.
· Arma un plan de desarrollo con las habilidades que te faltan, lo que pide el puesto y los cursos con los que puedes conseguirlas.
· Lleva la cuenta de tu avance conforme vas marcando lo que completas.
· Te avisa de las vacantes internas más afines a tu perfil.

Qué no hace: no decide tu semáforo de movilidad ni te postula sin que se lo pidas.`;

/** Tarjeta de vacante del ranking, con el mismo formato que las del Marketplace. */
function TarjetaVacante({ v, afinidad, onDetalle }: { v: Vacante; afinidad: number; onDetalle: () => void }) {
  const desc = v.req.descripcion.length > 110 ? v.req.descripcion.slice(0, 110).trimEnd() + "…" : v.req.descripcion;
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 14.5 }}>{v.req.titulo}</b>
          <div className="tagpick" style={{ marginTop: 6 }}>
            <Chip>{v.req.area}</Chip>
            <Chip icon={MapPin}>{v.req.ubicacionTrabajo} · {v.req.modalidad}</Chip>
          </div>
        </div>
        <MatchRing v={afinidad} />
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>{desc}</div>
      {!v.req.sueldoOculto && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-dark)" }}>
          {money(v.req.sueldo ?? Math.round((v.req.salarioMin + v.req.salarioMax) / 2 / 500) * 500)} /mes
        </div>
      )}
      <div className="help" style={{ marginTop: -4, display: "flex", alignItems: "center", gap: 4 }}>
        <Calendar size={11} /> Publicada el {v.creada}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: "auto", flexWrap: "wrap" }}>
        <button className="btn dark sm" onClick={onDetalle}><FileText size={13} /> Ver detalles</button>
        {afinidad >= UMBRAL_AFINIDAD && <Chip tone="ok">Alta afinidad</Chip>}
      </div>
    </div>
  );
}

/** Vacantes en las que el colaborador ya tiene un proceso, separadas por si siguen vivas. */
function HistorialVacantes({ cand, vacantes, onDetalle }: {
  cand: Candidato; vacantes: Vacante[]; onDetalle: (id: string) => void;
}) {
  const TERMINALES = ["descartado", "filtrado", "rechazado", "contratado"];
  const mios = vacantes.filter((v) => v.pipeline[cand.id]);
  const activas = mios.filter((v) => !TERMINALES.includes(v.pipeline[cand.id].estado));
  const cerradas = mios.filter((v) => TERMINALES.includes(v.pipeline[cand.id].estado));

  const Bloque = ({ titulo, lista, vacio }: { titulo: string; lista: Vacante[]; vacio: string }) => (
    <div style={{ marginTop: 18 }}>
      <label>{titulo}</label>
      {lista.length ? (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 6 }}>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id}>
                    <td><b>{v.req.titulo}</b><div className="help">{v.id} · {v.req.area}</div></td>
                    <td><EstadoChip estado={v.pipeline[cand.id].estado} candView /></td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn ghost sm" onClick={() => onDetalle(v.id)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="help" style={{ marginTop: 6 }}>{vacio}</div>
      )}
    </div>
  );

  return (
    <>
      <Bloque titulo="Procesos activos o por concluir" lista={activas} vacio="No tienes procesos en curso." />
      <Bloque titulo="Procesos cerrados" lista={cerradas} vacio="Todavía no tienes procesos concluidos." />
    </>
  );
}

export function MovilidadPage() {
  const { candidatos, vacantes, actions } = useData();
  const { candId, toast } = useDemo();
  const [sec, setSec] = useState(0);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [aplicarA, setAplicarA] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cand = candidatos.find((c) => c.id === candId);
  if (!cand) return <p>Cargando…</p>;

  // La ruta solo se ofrece a internos, pero se puede llegar escribiendo la URL.
  if (cand.tipo !== "interno") {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
        La movilidad interna es para colaboradores del grupo. Tu perfil está registrado como externo.
      </div>
    );
  }

  /**
   * Marca o desmarca una habilidad del plan. Se manda el candidato COMPLETO a propósito:
   * `guardarCandidato` reemplaza el objeto entero en vez de hacer merge, así que enviar solo el
   * plan borraría el resto de la ficha.
   */
  const alternarHabilidad = async (i: number) => {
    if (!cand.planDesarrollo) return;
    const habilidades = cand.planDesarrollo.habilidades.map(
      (h, j) => (j === i ? { ...h, hecha: !h.hecha } : h),
    );
    setGuardando(true);
    try {
      await actions.guardarCandidato({ ...cand, planDesarrollo: { ...cand.planDesarrollo, habilidades } });
    } catch (e) {
      toast("No se pudo guardar: " + (e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const ranking = rankingVacantes(cand, vacantes);
  const enProceso = procesoActivoEnOtra(vacantes, cand.id);
  const vDet = detalle ? vacantes.find((v) => v.id === detalle) : null;
  const vApl = aplicarA ? vacantes.find((v) => v.id === aplicarA) : null;

  return (
    <div>
      <div className="tabs">
        {SECCIONES.map((s, i) => (
          <button key={s} className={"tab" + (sec === i ? " on" : "")} onClick={() => setSec(i)}>{s}</button>
        ))}
      </div>

      {sec === 0 && <FichaTalento cand={cand} />}

      {sec === 1 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <h3 style={{ fontSize: 16 }}>Tu plan de desarrollo</h3>
            {/* Manual del agente. `InfoTip` abre al pulsar, no al pasar por encima: el documento
                pedía hover, pero en móvil no existe y ya arreglamos este componente justamente
                para que no hiciera falta pulsar dos veces. */}
            <InfoTip etiqueta="Ver el manual del agente de movilidad">
              <b style={{ display: "block", marginBottom: 6 }}>Manual del agente de movilidad</b>
              <div style={{ whiteSpace: "pre-line", lineHeight: 1.55 }}>{MANUAL_AGENTE}</div>
            </InfoTip>
          </div>
          <PlanDesarrolloPanel cand={cand} onToggle={alternarHabilidad} guardando={guardando} />
          <div className="card" style={{ marginTop: 16, color: "var(--gray)", fontSize: 13, lineHeight: 1.6 }}>
            El chat con el agente de movilidad, para identificar puestos nuevos y generar un plan
            desde cero, llega en la siguiente entrega.
          </div>
        </>
      )}

      {sec === 2 && (
        <>
          <label>Vacantes ideales para tu perfil</label>
          {ranking.length ? (
            <div className="vac-grid" style={{ marginTop: 6 }}>
              {ranking.map(({ v, afinidad }) => (
                <TarjetaVacante key={v.id} v={v} afinidad={afinidad} onDetalle={() => setDetalle(v.id)} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36, marginTop: 6 }}>
              Ahora mismo no hay vacantes abiertas. En cuanto se publique alguna aparecerá aquí ordenada por afinidad.
            </div>
          )}
          <HistorialVacantes cand={cand} vacantes={vacantes} onDetalle={setDetalle} />
        </>
      )}

      {/* Mismo camino de postulación que "Buscar vacantes": si no, el botón de aplicar del detalle
          no haría nada. `bloqueado` respeta la regla de un solo proceso activo a la vez. */}
      {vDet && (
        <DetalleVacanteModal v={vDet} cand={cand} p={vDet.pipeline[cand.id]} bloqueado={enProceso}
          onAplicar={() => { setAplicarA(vDet.id); setDetalle(null); }} onClose={() => setDetalle(null)} />
      )}
      {vApl && (
        <AplicarModal cand={cand} v={vApl}
          onSend={(msg) => { void actions.postularDirecto(vApl.id, cand.id, msg); setAplicarA(null); toast("¡Postulación enviada!"); }}
          onClose={() => setAplicarA(null)} />
      )}
    </div>
  );
}
