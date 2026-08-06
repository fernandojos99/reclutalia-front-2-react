/**
 * Tooltip informativo: un icono de "i" que revela un detalle al pasar el cursor.
 * Sustituye a los desplegables del asistente, donde el detalle es texto de referencia que casi
 * nunca hay que editar y no compensaba un clic.
 *
 * El hover no existe en pantallas táctiles, así que el disparador es doble: puntero de ratón
 * (enter/leave) en escritorio y toque (click) en táctil, con cierre al tocar fuera o con Escape.
 * También responde al foco de teclado, porque es un `<button>` real.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Info, type LucideIcon } from "lucide-react";

interface Props {
  /** Contenido del tooltip (lo que antes era `detalle` del Desplegable). */
  children: ReactNode;
  /** Texto accesible del disparador; por defecto describe la acción de forma genérica. */
  etiqueta?: string;
}

export function InfoTip({ children, etiqueta = "Ver detalle" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  // Cierre en táctil: cualquier toque fuera del tooltip lo baja. Escape sirve en ambos modos.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <span className="infotip" ref={ref}>
      <button
        type="button"
        className={"infotip-btn" + (abierto ? " on" : "")}
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-describedby={abierto ? id : undefined}
        // Solo el ratón abre al entrar; en táctil el pointerenter llega junto al toque y
        // provocaría que el click posterior lo cerrara de inmediato.
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setAbierto(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setAbierto(false); }}
        onClick={() => setAbierto((a) => !a)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
      >
        <Info size={15} />
      </button>
      {abierto && <span className="infotip-panel" id={id} role="tooltip">{children}</span>}
    </span>
  );
}

/**
 * Fila de un concepto del asistente: reemplaza a `Desplegable` conservando su misma forma
 * (icono · título · extra) pero con el detalle detrás de un `InfoTip` en vez de un acordeón.
 */
export function FilaInfo({ titulo, icono: Icono, extra, detalle }: {
  titulo: ReactNode;
  icono?: LucideIcon;
  extra?: ReactNode;
  detalle: ReactNode;
}) {
  return (
    <div className="fila-info">
      {Icono && <Icono size={15} className="fila-info-ico" />}
      <b>{titulo}</b>
      {extra !== undefined && <span className="fila-info-extra">{extra}</span>}
      <InfoTip etiqueta={typeof titulo === "string" ? `Ver detalle de ${titulo}` : "Ver detalle"}>
        {detalle}
      </InfoTip>
    </div>
  );
}
