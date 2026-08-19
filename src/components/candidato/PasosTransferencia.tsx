/**
 * Estatus del trámite de transferencia de un colaborador interno, en 4 pasos conectados.
 *
 * No es el pipeline: el pipeline ya terminó para él en cuanto aceptó la oferta. Esto es lo que
 * ocurre después, dentro de la empresa, y por eso tiene sus propias etapas y su propio ritmo (de 2
 * a 4 semanas). Reutiliza las clases `.ftl` de `MiniPipe` para que se lea igual que el resto.
 */
import { Check } from "lucide-react";

const PASOS = [
  "Validación de documentos",
  "Confirmación de movimiento",
  "Entrega de puesto",
  "Firma e ingreso a puesto nuevo",
];

/** `actual` es el índice del paso en curso; los anteriores se dan por completados. */
export function PasosTransferencia({ actual = 0 }: { actual?: number }) {
  return (
    <div className="ftl">
      {PASOS.map((et, i) => {
        const done = i < actual;
        const now = i === actual;
        return (
          <div key={et} className={"ftl-step" + (done ? " done" : "") + (now ? " now" : "")}>
            <div className="ftl-node">{done ? <Check size={14} /> : i + 1}</div>
            <div className="ftl-label">{et}</div>
          </div>
        );
      })}
    </div>
  );
}
