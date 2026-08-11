/**
 * "Explicar con IA": el formador dicta al candidato ideal y la IA reescribe el objetivo del puesto
 * y las funciones principales.
 *
 * La grabación es SIMULADA (no hay MediaRecorder ni Web Speech), igual que el resto del demo, y el
 * resultado sale de `mrfn(req)` — determinista, como exige el proyecto: el mismo puesto produce
 * siempre los mismos bullets.
 *
 * Sustituye a la antigua pestaña "Voz" del asistente, que era una pantalla completa con transcript
 * editable. Aquí solo hay título, descripción y micrófono.
 */
import { useEffect, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Modal } from "../../common/Modal";
import { mrfn } from "../../../constants/paqueteVacante";
import type { Requisito } from "../../../types/models/domain";

const MSGS_PROCESO = [
  "Transcribiendo lo que dictaste…",
  "Identificando responsabilidades y alcance…",
  "Redactando el objetivo del puesto…",
  "Ordenando las funciones principales…",
];

const MS_GRABANDO = 2500;
const MS_PROCESO = 3600;

interface Props {
  req: Requisito;
  /** Bullets ya redactados para cada apartado. */
  onAplicar: (objetivo: string[], funciones: string[]) => void;
  onCerrar: () => void;
}

export function ExplicarIAModal({ req, onAplicar, onCerrar }: Props) {
  const [fase, setFase] = useState<"inicio" | "grabando" | "procesando">("inicio");
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    if (fase !== "grabando") return;
    const t = window.setTimeout(() => { setMsg(0); setFase("procesando"); }, MS_GRABANDO);
    return () => window.clearTimeout(t);
  }, [fase]);

  useEffect(() => {
    if (fase !== "procesando") return;
    const iv = window.setInterval(() => setMsg((i) => (i + 1) % MSGS_PROCESO.length), 1200);
    const fin = window.setTimeout(() => {
      const { mandato, funciones } = mrfn(req);
      onAplicar([mandato], funciones);
    }, MS_PROCESO);
    return () => { window.clearInterval(iv); window.clearTimeout(fin); };
    // Solo debe dispararse al entrar en la fase; `req` se lee en ese instante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  return (
    <Modal onClose={onCerrar}>
      {fase === "procesando" ? (
        <div className="proc-wrap">
          <Loader2 size={46} className="ai-spin" />
          <h3 style={{ fontSize: 16, color: "var(--ai)" }}>Redactando tu publicación</h3>
          <div className="ai-search-msg">{MSGS_PROCESO[msg]}</div>
          <div className="mini-pipe" style={{ width: 200 }}>
            {MSGS_PROCESO.map((_, k) => <i key={k} className={k <= msg ? "f" : ""} />)}
          </div>
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Cuéntanos qué estás buscando</h3>
          <p className="help" style={{ marginTop: 0 }}>
            Describe con tus palabras al candidato ideal. Con eso, la IA redactará el objetivo del
            puesto y las funciones principales.
          </p>

          <div className="voz-wrap">
            <button type="button" className={"mic-big" + (fase === "grabando" ? " rec" : "")}
              disabled={fase === "grabando"}
              title={fase === "grabando" ? "Grabando…" : "Toca para grabar"}
              onClick={() => setFase("grabando")}>
              {fase === "grabando" ? <Square size={34} fill="currentColor" /> : <Mic size={42} />}
            </button>
            {fase === "grabando" ? (
              <>
                <div className="voz-ondas">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />
                  ))}
                </div>
                <b style={{ fontSize: 13, color: "var(--ai)" }}>Escuchando…</b>
              </>
            ) : (
              <span className="help" style={{ margin: 0 }}>Toca el micrófono para empezar a grabar.</span>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
