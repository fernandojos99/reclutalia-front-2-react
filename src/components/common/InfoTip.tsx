/**
 * Tooltip informativo: un chevron que revela un detalle al pasar el cursor.
 * Sustituye a los desplegables del asistente, donde el detalle es texto de referencia que casi
 * nunca hay que editar y no compensaba un clic.
 *
 * El hover no existe en pantallas táctiles, así que el disparador es doble: puntero de ratón
 * (enter/leave) en escritorio y toque (click) en táctil, con cierre al tocar fuera o con Escape.
 * También responde al foco de teclado, porque es un `<button>` real.
 *
 * El panel se abre a la altura del disparador pero CENTRADO en el contenedor que lo alberga —el
 * panel lateral "Detalle de caja"— en vez de pegado al borde derecho. Eso no sale con CSS: centrar
 * respecto a otro elemento exige `position:fixed`, y con `fixed` se pierde el anclaje vertical que
 * daba `bottom:calc(100% + 8px)`. De ahí que se mida el botón al abrir.
 *
 * Sirve igual en escritorio y en móvil sin distinguir el dispositivo: como `.dcaja` ocupa todo el
 * ancho en pantallas estrechas, centrarse en él equivale allí a centrarse en la pantalla.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

/** Contenedor respecto al que se centra. Sin él (uso fuera del panel), se usa el viewport. */
const CONTENEDOR = ".dcaja";
/** Hueco entre el disparador y el panel. */
const SEPARACION = 8;
/** Por debajo de esto no cabe el panel encima y hay que volcarlo hacia abajo. */
const ALTO_MINIMO = 150;

interface Props {
  /** Contenido del tooltip (lo que antes era `detalle` del Desplegable). */
  children: ReactNode;
  /** Texto accesible del disparador; por defecto describe la acción de forma genérica. */
  etiqueta?: string;
}

/** Posición del panel: a la altura del disparador, centrado en su contenedor. */
interface Pos {
  top: number;
  /** Centro horizontal del contenedor, en píxeles de viewport. */
  left: number;
  /** Anclado por su borde inferior (encima del botón) o por el superior (volcado abajo). */
  arriba: boolean;
}

export function InfoTip({ children, etiqueta = "Ver detalle" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  /** Mide el disparador y el contenedor. Devuelve null solo si el nodo aún no está montado. */
  const medir = (): Pos | null => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return null;
    // El panel lateral si lo hay; si el tooltip vive fuera de él, la pantalla entera.
    const caja = ref.current?.closest(CONTENEDOR)?.getBoundingClientRect();
    const left = caja ? caja.left + caja.width / 2 : window.innerWidth / 2;
    return r.top < ALTO_MINIMO
      ? { top: r.bottom + SEPARACION, left, arriba: false }
      : { top: r.top - SEPARACION, left, arriba: true };
  };

  const abrir = () => { setPos(medir()); setAbierto(true); };
  const cerrar = () => setAbierto(false);

  // Cierre en táctil: cualquier toque fuera del tooltip lo baja. Escape sirve en ambos modos.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    // Con `position:fixed` el panel se queda flotando donde estaba al hacer scroll, y el cuerpo del
    // panel lateral tiene scroll propio. Cerrar sale más barato que recalcular en cada frame.
    const scroll = () => setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", esc);
    if (pos) window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [abierto, pos]);

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
        onPointerEnter={(e) => { if (e.pointerType === "mouse") abrir(); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") cerrar(); }}
        onClick={() => (abierto ? cerrar() : abrir())}
        onFocus={abrir}
        onBlur={cerrar}
      >
        {/* Chevron y no una "i": se lee como desplegable, que es lo que hace. Gira al abrirse. */}
        <ChevronDown size={15} />
      </button>
      {abierto && (
        <span
          className={"infotip-panel" + (pos ? " flotante" : "")}
          id={id}
          role="tooltip"
          style={pos
            ? { top: pos.top, left: pos.left, transform: `translate(-50%, ${pos.arriba ? "-100%" : "0"})` }
            : undefined}
        >
          {children}
        </span>
      )}
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
