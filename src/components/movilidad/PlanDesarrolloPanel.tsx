/**
 * Plan de desarrollo hacia el puesto de interés: marco con el puesto objetivo, índice de avance y
 * la lista de habilidades con palomita.
 *
 * El índice de avance NO es el semáforo de elegibilidad. El semáforo es un dato que decide el
 * administrador (`cand.movilidad`); esto es la completitud del plan, y son dos cosas distintas a
 * propósito — se pintan con la misma escala de color solo para que se lean rápido.
 */
import { Check, Target } from "lucide-react";
import { Chip } from "../common/Chip";
import { avancePlan } from "../../utils/movilidad";
import type { Candidato, HabilidadPlan } from "../../types/models/domain";

/** Color del avance por banda, con la misma escala que el semáforo. */
const tonoAvance = (pct: number): string => (pct >= 70 ? "ok" : pct >= 40 ? "gold" : "bad");

interface Props {
  cand: Candidato;
  /** Marca o desmarca una habilidad. Sin esto la lista queda de solo lectura. */
  onToggle?: (indice: number) => void;
  guardando?: boolean;
}

export function PlanDesarrolloPanel({ cand, onToggle, guardando = false }: Props) {
  const plan = cand.planDesarrollo;

  if (!plan) {
    return (
      <div className="card">
        <label>Plan de desarrollo</label>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 6, color: "var(--ink2)" }}>
          Todavía no tienes un plan de desarrollo. Cuéntale al agente de movilidad a qué puesto te
          gustaría llegar y te armará uno con las habilidades que te faltan, lo que pide el puesto y
          los cursos con los que puedes conseguirlas.
        </p>
      </div>
    );
  }

  const { hechas, total, pct } = avancePlan(cand);

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Índice de avance, a la izquierda como pide el documento. */}
        <div style={{ textAlign: "center", minWidth: 88 }}>
          <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{pct}%</div>
          <Chip tone={tonoAvance(pct)}>{hechas} de {total}</Chip>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Puesto de interés</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            <Target size={16} color="var(--gold-dark)" /> {plan.puestoObjetivo}
          </div>
          <div className="help" style={{ marginTop: 4 }}>Plan generado el {plan.generado}</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Habilidades por desarrollar</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          {plan.habilidades.map((h: HabilidadPlan, i: number) => (
            <button
              key={h.nombre}
              type="button"
              disabled={!onToggle || guardando}
              onClick={() => onToggle?.(i)}
              title={onToggle ? (h.hecha ? "Marcar como pendiente" : "Marcar como completada") : undefined}
              style={{
                display: "flex", gap: 9, alignItems: "flex-start", textAlign: "left",
                background: "none", border: "none", padding: "4px 0",
                cursor: onToggle && !guardando ? "pointer" : "default", width: "100%",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid " + (h.hecha ? "var(--ok)" : "var(--line)"),
                  background: h.hecha ? "var(--ok-soft)" : "var(--paper)",
                  color: "var(--ok)",
                }}
              >
                {h.hecha && <Check size={12} strokeWidth={3} />}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                <b style={{ textDecoration: h.hecha ? "line-through" : "none", color: h.hecha ? "var(--gray)" : "var(--ink)" }}>
                  {h.nombre}
                </b>
                {h.como && <div className="help">{h.como}</div>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {plan.necesidades.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label>Necesidades del puesto</label>
          <div className="tagpick" style={{ marginTop: 6 }}>
            {plan.necesidades.map((n) => <Chip key={n}>{n}</Chip>)}
          </div>
        </div>
      )}

      {plan.cursosSugeridos.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label>Cursos y certificados sugeridos</label>
          <div className="tagpick" style={{ marginTop: 6 }}>
            {plan.cursosSugeridos.map((c) => <Chip key={c} tone="gold">{c}</Chip>)}
          </div>
        </div>
      )}
    </div>
  );
}
