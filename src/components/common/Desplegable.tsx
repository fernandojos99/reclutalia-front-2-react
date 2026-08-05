/**
 * Ítem desplegable genérico: cabecera clicable con flecha invertida (v) que muestra el detalle.
 * Es la pieza que se repite en todo el asistente "Revisar vacante" (MRFN, bonos, prestaciones,
 * beneficios y herramientas). Mismo gesto de chevron que `FasesBar`, pero reutilizable.
 */
import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

interface Props {
  titulo: ReactNode;
  /** Ícono a la izquierda del título (los beneficios lo usan). */
  icono?: LucideIcon;
  /** Nodo a la derecha del título, antes del chevron (p. ej. el monto de un bono). */
  extra?: ReactNode;
  detalle: ReactNode;
  defaultOpen?: boolean;
}

export function Desplegable({ titulo, icono: Icono, extra, detalle, defaultOpen = false }: Props) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <div className={"desp" + (abierto ? " on" : "")}>
      <button type="button" className="desp-hd" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        {Icono && <Icono size={15} className="desp-ico" />}
        <b>{titulo}</b>
        {extra !== undefined && <span className="desp-extra">{extra}</span>}
        <ChevronDown size={16} className="desp-chev" />
      </button>
      {abierto && <div className="desp-body">{detalle}</div>}
    </div>
  );
}
