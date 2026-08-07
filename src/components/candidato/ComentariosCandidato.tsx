/**
 * Comentarios que otros formadores dejaron sobre un candidato: notas de perfil, reingresos y
 * apuntes de procesos anteriores.
 *
 * Los textos son simulación determinista derivada del candidato y del formador — el mismo par da
 * siempre el mismo comentario, como exige el proyecto. Cuando existan notas reales, este archivo
 * es el único punto a reemplazar.
 */
import { useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import type { Candidato, Formador } from "../../types/models/domain";

/** Plantillas de nota. Se elige una por par candidato-formador, sin azar. */
const NOTAS = [
  (c: Candidato) => `Participó en un proceso anterior para una posición de ${c.area}. Buen manejo técnico y disposición para aprender; se quedó en terna final. Recomendable volver a considerarlo.`,
  (c: Candidato) => `Entrevisté a ${c.nombre.split(" ")[0]} hace unos meses. Comunicación clara y expectativas de sueldo razonables para su nivel. No avanzó por disponibilidad de horario, no por perfil.`,
  (c: Candidato) => `Reingreso: ya colaboró con nosotros en ${c.area}. Salida en buenos términos, sin incidencias. Su expediente está limpio y puede reingresar sin restricción.`,
  (c: Candidato) => `Perfil sólido en ${c.esp[0] ?? c.area}. En la entrevista mostró iniciativa y buen trato con el equipo; conviene validar su experiencia en herramientas específicas del puesto.`,
];

/** Índice estable a partir del par candidato-formador. */
function idx(cid: number, fid: string, mod: number): number {
  let h = 7919;
  const sem = `${cid}·${fid}`;
  for (let i = 0; i < sem.length; i++) h = (h * 31 + sem.charCodeAt(i)) % 100_000;
  return h % mod;
}

interface Props {
  cand: Candidato;
  formadores: Formador[];
  /** Formador que está mirando: no tiene sentido leer su propia nota aquí. */
  excluir?: string;
}

export function ComentariosCandidato({ cand, formadores, excluir }: Props) {
  const [abierto, setAbierto] = useState<string | null>(null);

  // Dos o tres formadores han opinado, de forma estable para el mismo candidato.
  const opinan = formadores
    .filter((f) => f.id !== excluir)
    .filter((f) => idx(cand.id, f.id, 10) < 6);

  if (!opinan.length) {
    return <p className="help" style={{ margin: 0 }}>Ningún formador ha dejado comentarios sobre este candidato.</p>;
  }

  return (
    <div>
      <p className="help" style={{ marginTop: 0 }}>
        Notas de otros formadores sobre {cand.nombre.split(" ")[0]}: detalle de perfil, reingresos y
        apuntes de procesos anteriores.
      </p>
      {opinan.map((f) => {
        const on = abierto === f.id;
        return (
          <div className={"desp" + (on ? " on" : "")} key={f.id}>
            <button type="button" className="desp-hd" aria-expanded={on}
              onClick={() => setAbierto(on ? null : f.id)}>
              <MessageSquare size={15} className="desp-ico" />
              <b>{f.nombre}</b>
              <span className="desp-extra">{f.puesto}</span>
              <ChevronDown size={16} className="desp-chev" />
            </button>
            {on && (
              <div className="desp-body">
                <p style={{ margin: 0 }}>{NOTAS[idx(cand.id, f.id, NOTAS.length)](cand)}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
