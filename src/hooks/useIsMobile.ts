/**
 * ¿El viewport es de teléfono? Único hook responsive del proyecto.
 * Las media queries de `base.css` bastan para cambiar ESTILOS, pero el asistente
 * "Revisar vacante" cambia la ESTRUCTURA (acordeones en escritorio vs. tabs en móvil)
 * y eso solo se puede decidir en JS.
 */
import { useEffect, useState } from "react";

export function useIsMobile(bp = 760): boolean {
  const query = `(max-width:${bp}px)`;
  const [movil, setMovil] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMovil(mq.matches);
    onChange(); // por si el ancho cambió entre el render inicial y el efecto
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return movil;
}
