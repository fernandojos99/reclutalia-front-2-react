/**
 * Comentarios que los formadores dejaron sobre un colaborador al despedirlo de cada puesto.
 *
 * Son datos REALES, no simulación: salen de `historialPuestos`, donde los escribe el botón
 * "Agradecer" del módulo de movilidad. Antes este archivo inventaba notas deterministas porque no
 * había dónde leerlas; ahora las hay, y el resumen que el formador escribe por fin se lee en algún
 * sitio.
 *
 * Solo lo ven otros formadores. El backend borra `resumen`, `resumenPor` y `habilidades` de la
 * ficha que alimenta al agente, que es quien habla con el propio colaborador.
 */
import { useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Chip } from "../common/Chip";
import type { Candidato, Formador, HistorialPuesto } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  formadores: Formador[];
}

/** Año de salida del puesto. Las fechas son texto es-MX ("31 ene 2024"), no ISO. */
function anoSalida(hasta: string): string {
  const m = hasta.match(/\b(\d{4})\b/);
  return m ? m[1] : hasta;
}

export function ComentariosCandidato({ cand, formadores }: Props) {
  const [abierto, setAbierto] = useState<string | null>(null);

  // Solo los puestos que alguien cerró dejando constancia. Un puesto sin resumen no es un comentario.
  const conComentario = (cand.historialPuestos ?? []).filter(
    (h: HistorialPuesto) => !!h.resumen?.trim() || !!h.habilidades?.length,
  );

  if (!conComentario.length) {
    return (
      <p className="help" style={{ margin: 0 }}>
        Ningún formador ha dejado comentarios sobre {cand.nombre.split(" ")[0]}. Aparecerán aquí
        cuando alguien cierre uno de sus puestos desde "Agradecer".
      </p>
    );
  }

  const nombreDe = (fid?: string): string =>
    formadores.find((f) => f.id === fid)?.nombre ?? fid ?? "Formador anterior";

  return (
    <div>
      <p className="help" style={{ marginTop: 0 }}>
        Lo que sus formadores escribieron al cerrar cada puesto. Solo lo ven otros formadores;
        {" "}{cand.nombre.split(" ")[0]} no lo lee.
      </p>
      {conComentario.map((h) => {
        const clave = `${h.puesto}·${h.desde}`;
        const on = abierto === clave;
        return (
          <div className={"desp" + (on ? " on" : "")} key={clave}>
            <button type="button" className="desp-hd" aria-expanded={on}
              onClick={() => setAbierto(on ? null : clave)}>
              <MessageSquare size={15} className="desp-ico" />
              <b>{h.puesto}</b>
              <span className="desp-extra">
                Salió en {anoSalida(h.hasta)} · {nombreDe(h.resumenPor)}
              </span>
              <ChevronDown size={16} className="desp-chev" />
            </button>
            {on && (
              <div className="desp-body">
                {h.resumen && <p style={{ margin: 0 }}>{h.resumen}</p>}
                {!!h.habilidades?.length && (
                  <div style={{ marginTop: h.resumen ? 12 : 0 }}>
                    <label>Lo que destacó de su perfil</label>
                    <div className="tagpick">
                      {h.habilidades.map((s) => <Chip key={s} tone="ok">{s}</Chip>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
