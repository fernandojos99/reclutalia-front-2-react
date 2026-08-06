/**
 * Organigrama del equipo del formador: él encabeza el árbol y de él cuelgan sus posiciones.
 * Si la posición ya tiene candidato elegido muestra a la persona; si no, sale como "Disponible"
 * con el acceso al proceso o a la revisión del perfil.
 *
 * Todo se DERIVA de las vacantes reales (`useData()`), no hay estado ni endpoint nuevo.
 * Los conectores del árbol son pseudo-elementos CSS (ver `.org-*` en base.css), sin SVG.
 */
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Users } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { Avatar } from "../common/Avatar";
import { Chip } from "../common/Chip";
import { matchScore } from "../../utils/match";
import { fotoDe, numeroEmpleado } from "../../constants/personas";
import type { Candidato, Formador, Vacante } from "../../types/models/domain";

/** Estados del pipeline en los que la posición ya se considera ocupada por esa persona. */
const OCUPADA = ["seleccionado", "docs_completos", "oferta_enviada", "oferta_aceptada", "contratado"];

/** Umbral del pool en el backend (`buildPool`): un candidato es viable a partir de 28. */
const MATCH_MIN = 28;

/** Número de empleado del formador que encabeza el organigrama (dato de demo). */
const NUM_EMPLEADO_FORMADOR = "112687";

export function PlantillaCards({ vacantes, formador }: { vacantes: Vacante[]; formador?: Formador }) {
  const { candidatos } = useData();
  const navigate = useNavigate();

  /** Persona que ocupa la posición, si la hay. */
  const ocupante = (v: Vacante): Candidato | undefined => {
    const cid = Object.entries(v.pipeline || {}).find(([, p]) => OCUPADA.includes(p.estado))?.[0];
    return cid ? candidatos.find((c) => c.id === Number(cid)) : undefined;
  };

  /**
   * Candidatos viables. Si la vacante ya se publicó, la cifra es el pool real que armó el backend
   * (aunque venga vacío) para que coincida con lo que se ve al entrar al Marketplace. Si todavía
   * no se publica no hay Marketplace, así que se ESTIMA aquí con el mismo `matchScore` y el mismo
   * umbral que `buildPool` (espejo front↔back) y se etiqueta como estimación.
   */
  const viables = (v: Vacante): { n: number; estimado: boolean } =>
    v.estado === "abierta" || v.estado === "cerrada"
      ? { n: v.pool?.length ?? 0, estimado: false }
      : { n: candidatos.filter((c) => matchScore(c, v.req) >= MATCH_MIN).length, estimado: true };

  if (!vacantes.length) return null;

  return (
    <div className="org">
      {formador && (
        <div className="org-jefe">
          <div className="plant-card org-card-jefe">
            <div className="plant-nom">
              <Avatar nombre={formador.nombre} foto={fotoDe(formador.id)} />
              <div style={{ minWidth: 0 }}>
                <b>{formador.nombre}</b>
                <div className="org-num">No. {NUM_EMPLEADO_FORMADOR}</div>
              </div>
            </div>
            <div>
              <div className="plant-puesto">{formador.area}</div>
              <div className="org-posicion">{formador.puesto}</div>
            </div>
          </div>
        </div>
      )}

      <div className={"org-hijos" + (formador ? " con-jefe" : "")}>
        {vacantes.map((v) => {
          const persona = ocupante(v);
          const { n, estimado } = persona ? { n: 0, estimado: false } : viables(v);
          return (
            <div className="org-rama" key={v.id}>
              <div
                className={"plant-card" + (persona ? "" : " libre")}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/formador/vacante/${v.id}/revisar`)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/formador/vacante/${v.id}/revisar`); }}
              >
                <div className="plant-nom">
                  {persona ? (
                    <>
                      <Avatar nombre={persona.nombre} foto={persona.foto ?? fotoDe(persona.id)} />
                      <div style={{ minWidth: 0 }}>
                        <b>{persona.nombre}</b>
                        <div className="org-num">No. {numeroEmpleado(persona.id)}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Chip tone="gold">Disponible</Chip>
                      {/* Etiqueta siempre visible: la acción de la tarjeta no debe depender del hover. */}
                      <span className="plant-ajustar">Ajustar perfil <ChevronRight size={14} /></span>
                    </>
                  )}
                </div>

                <div className="plant-puesto">{v.req.titulo}</div>

                {persona ? (
                  <div className="plant-viables cubierta">
                    <CheckCircle2 size={14} /> Posición cubierta
                  </div>
                ) : n > 0 ? (
                  <button
                    type="button"
                    className="plant-viables"
                    title={estimado
                      ? "Estimación sobre el marketplace; el definitivo se arma al publicar la vacante"
                      : "Ir a la etapa actual del proceso"}
                    // Sin `?tab=`, VacanteDetailPage resuelve el tab con `tabInicial(v)` y aterriza en
                    // la etapa viva del proceso. La estimación sí va al Marketplace: aún no hay proceso.
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(estimado ? `/formador/vacante/${v.id}?tab=1` : `/formador/vacante/${v.id}`);
                    }}
                  >
                    <Users size={14} />
                    {estimado ? `~${n} compatibles estimados` : "Continuar proceso"}
                  </button>
                ) : (
                  <div className="plant-viables vacio">
                    <Users size={14} /> Sin candidatos por ahora
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
