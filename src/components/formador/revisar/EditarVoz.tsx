/**
 * Editar con voz, en dos pantallas.
 *
 *  5 · "Cuéntanos qué estás buscando" — micrófono grande. La grabación es SIMULADA (no hay
 *      MediaRecorder ni Web Speech): tras la animación se vuelca `TRANSCRIPT_DEMO`, que queda
 *      editable en el textarea. Mismo enfoque que el dictado de `EntrevistaModal`.
 *  6 · Procesado, mientras `interpretarTranscript()` acomoda el texto en los campos. Al terminar
 *      aplica la propuesta y devuelve el control: la pestaña "Editar" ya es la vista previa, así
 *      que no hace falta una pantalla intermedia que la duplique.
 *
 * El texto dictado NO vive aquí: lo guarda la página, para que sobreviva a cambiar de pestaña.
 */
import { useEffect, useState } from "react";
import { Mic, Square, Loader2, ArrowRight } from "lucide-react";
import { TRANSCRIPT_DEMO, interpretarTranscript } from "../../../utils/perfilIA";
import type { Requisito } from "../../../types/models/domain";

const MSGS_PROCESO = [
  "Transcribiendo lo que dictaste…",
  "Identificando experiencia, ubicación y turno…",
  "Cruzando habilidades con el catálogo…",
  "Armando la vista previa de la publicación…",
];

interface Props {
  req: Requisito;
  /** Texto dictado; lo custodia la página para que no se pierda al cambiar de pestaña. */
  texto: string;
  onTexto: (t: string) => void;
  /** Devuelve el requisito ya fusionado y los nombres de campo que cambiaron. */
  onAplicar: (r: Requisito, campos: string[]) => void;
  /** Sale del dictado sin aplicar nada: lleva al anuncio tal cual está el borrador. */
  onOmitir: () => void;
}

export function EditarVoz({ req, texto, onTexto, onAplicar, onOmitir }: Props) {
  const [paso, setPaso] = useState<5 | 6>(5);
  const [grabando, setGrabando] = useState(false);
  const [msg, setMsg] = useState(0);

  // Grabación simulada: 2.5 s de animación y luego el transcript enlatado.
  useEffect(() => {
    if (!grabando) return;
    const t = window.setTimeout(() => {
      onTexto((texto ? texto + " " : "") + TRANSCRIPT_DEMO);
      setGrabando(false);
    }, 2500);
    return () => window.clearTimeout(t);
    // `texto` se lee dentro pero no debe reiniciar el temporizador de la grabación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grabando]);

  // Pantalla 6: mensajes rotando y, al terminar, la propuesta se aplica y se sale del dictado.
  useEffect(() => {
    if (paso !== 6) return;
    const iv = window.setInterval(() => setMsg((i) => (i + 1) % MSGS_PROCESO.length), 1200);
    const fin = window.setTimeout(() => {
      const cambios = interpretarTranscript(texto);
      onAplicar({ ...req, ...cambios }, Object.keys(cambios));
    }, 3600);
    return () => { window.clearInterval(iv); window.clearTimeout(fin); };
    // Solo debe dispararse al entrar en la pantalla 6; `req`/`texto` se leen en ese instante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  // ── Pantalla 5 ──
  if (paso === 5) {
    return (
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Cuéntanos qué estás buscando</h3>
        <p className="help" style={{ marginTop: 0 }}>
          Describe con tus palabras al candidato ideal.
        </p>

        <div className="voz-wrap">
          <button type="button" className={"mic-big" + (grabando ? " rec" : "")} disabled={grabando}
            title={grabando ? "Grabando…" : "Toca para grabar"} onClick={() => setGrabando(true)}>
            {grabando ? <Square size={34} fill="currentColor" /> : <Mic size={42} />}
          </button>
          {grabando ? (
            <>
              <div className="voz-ondas">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />
                ))}
              </div>
              <b style={{ fontSize: 13, color: "var(--ai)" }}>Escuchando…</b>
            </>
          ) : (
            <span className="help" style={{ margin: 0 }}>
              {texto ? "Listo. Revisa el texto y ajústalo si hace falta." : "Toca el micrófono para empezar a grabar."}
            </span>
          )}
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Lo que dictaste (puedes editarlo)</label>
          <textarea rows={7} value={texto} onChange={(e) => onTexto(e.target.value)}
            placeholder="Aquí aparecerá lo que dictes; también puedes escribirlo a mano." />
        </div>

        <div className="paso-acciones">
          <button type="button" className="btn gold" disabled={!texto.trim() || grabando} onClick={() => { setMsg(0); setPaso(6); }}>
            Continuar
          </button>
          <button type="button" className="btn ghost" onClick={onOmitir}>
            Omitir dictado <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla 6 ── (al terminar sale sola hacia la pestaña "Editar")
  return (
    <div>
      <div className="proc-wrap">
        <Loader2 size={46} className="ai-spin" />
        <h3 style={{ fontSize: 16, color: "var(--ai)" }}>Generando vista previa de tu publicación</h3>
        <div className="ai-search-msg">{MSGS_PROCESO[msg]}</div>
        <div className="mini-pipe" style={{ width: 200 }}>
          {MSGS_PROCESO.map((_, k) => <i key={k} className={k <= msg ? "f" : ""} />)}
        </div>
      </div>
    </div>
  );
}
