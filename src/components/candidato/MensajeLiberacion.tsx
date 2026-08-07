/**
 * Sustituye a la apertura de cuenta de nómina cuando el candidato es INTERNO: ya es empleado, así
 * que no hay cuenta que abrir. En su lugar puede dejarle un mensaje de aviso y agradecimiento a su
 * formador actual, que es quien pierde la posición.
 *
 * Es opcional a propósito; el paso no bloquea la contratación.
 */
import { useState } from "react";
import { Send, Sparkles, CheckCircle2 } from "lucide-react";
import type { Candidato, PipelineEntry, Vacante } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  v: Vacante;
  p: PipelineEntry;
  formadorActual?: string;
  onEnviar: (mensaje: string) => void;
}

export function MensajeLiberacion({ cand, v, p, formadorActual, onEnviar }: Props) {
  const [texto, setTexto] = useState("");
  const [generando, setGenerando] = useState(false);

  /** Borrador simulado: se arma con datos reales del proceso, sin llamar a ningún modelo. */
  const generar = () => {
    setGenerando(true);
    window.setTimeout(() => {
      setTexto(
        `Hola${formadorActual ? " " + formadorActual.split(" ")[0] : ""}:\n\n` +
        `Quiero avisarte que acepté una oferta interna para la posición de ${v.req.titulo}, ` +
        `y estaré liberando mi puesto de ${cand.puesto} el ${p.oferta?.fecha}.\n\n` +
        `Te agradezco mucho el acompañamiento y todo lo que aprendí en el equipo. ` +
        `Quedo a tus órdenes para coordinar el traspaso y dejar todo en orden antes de mi salida.\n\n` +
        `Un abrazo,\n${cand.nombre}`,
      );
      setGenerando(false);
    }, 1200);
  };

  if (p.mensajeLiberacion) {
    return (
      <div className="card" style={{ borderColor: "var(--ok)" }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>
          <CheckCircle2 size={16} style={{ verticalAlign: -3, color: "var(--ok)" }} /> Mensaje enviado
        </h3>
        <p className="help" style={{ marginBottom: 10 }}>
          Tu formador actual ya recibió tu mensaje.
        </p>
        <p className="pub-nota" style={{ whiteSpace: "pre-wrap" }}>{p.mensajeLiberacion}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderColor: "var(--gold)" }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>
        <Send size={16} style={{ verticalAlign: -3 }} /> Avisa a tu formador actual
      </h3>
      <p className="help" style={{ marginBottom: 12 }}>
        Este mensaje es <b>opcional</b>. También te recomendamos agendar una reunión con
        {formadorActual ? ` ${formadorActual}` : " tu formador actual"} para coordinar la liberación
        y el traspaso de tu puesto.
      </p>

      <div className="field">
        <label>Tu mensaje</label>
        <textarea rows={8} value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe aquí tu mensaje de aviso y agradecimiento…" />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn gold" disabled={!texto.trim()} onClick={() => onEnviar(texto.trim())}>
          <Send size={15} /> Enviar mensaje
        </button>
        <button className="btn ai" disabled={generando} onClick={generar}>
          <Sparkles size={15} /> {generando ? "Generando…" : "Generar con IA"}
        </button>
      </div>
    </div>
  );
}
