/**
 * Pantallas 5, 6 y 7 · Editar con voz.
 *
 *  5 · "Cuéntanos qué estás buscando" — micrófono grande. La grabación es SIMULADA (no hay
 *      MediaRecorder ni Web Speech): tras la animación se vuelca `TRANSCRIPT_DEMO`, que queda
 *      editable en el textarea. Mismo enfoque que el dictado de `EntrevistaModal`.
 *  6 · "Generando vista previa de tu publicación" — indicador de proceso mientras
 *      `interpretarTranscript()` acomoda el texto en los campos del requisito.
 *  7 · "Publicación (a la medida)" — la publicación ya renderizada, con los campos que cambiaron
 *      marcados, para aplicarla o descartarla.
 */
import { useEffect, useState } from "react";
import { Mic, Square, Loader2, CheckCircle2, X, Sparkles } from "lucide-react";
import { PasoPublicacion } from "./PasoPublicacion";
import { TRANSCRIPT_DEMO, CAMPOS_VOZ, interpretarTranscript } from "../../../utils/perfilIA";
import type { Requisito } from "../../../types/models/domain";

const MSGS_PROCESO = [
  "Transcribiendo lo que dictaste…",
  "Identificando experiencia, ubicación y turno…",
  "Cruzando habilidades con el catálogo…",
  "Armando la vista previa de la publicación…",
];

interface Props {
  req: Requisito;
  /** Devuelve el requisito ya fusionado y los nombres de campo que cambiaron. */
  onAplicar: (r: Requisito, campos: string[]) => void;
  onCancelar: () => void;
  /** Avisa en qué pantalla va el dictado: el asistente oculta "Continuar a publicación" hasta la 7. */
  onPaso?: (p: 5 | 6 | 7) => void;
}

export function EditarVoz({ req, onAplicar, onCancelar, onPaso }: Props) {
  const [paso, setPaso] = useState<5 | 6 | 7>(5);
  const [grabando, setGrabando] = useState(false);
  const [texto, setTexto] = useState("");
  const [propuesta, setPropuesta] = useState<Partial<Requisito> | null>(null);
  const [msg, setMsg] = useState(0);

  // El asistente necesita saber en qué pantalla vamos para decidir si ya puede ofrecer publicar.
  useEffect(() => { onPaso?.(paso); }, [paso, onPaso]);

  // Grabación simulada: 2.5 s de animación y luego el transcript enlatado.
  useEffect(() => {
    if (!grabando) return;
    const t = window.setTimeout(() => {
      setTexto((prev) => (prev ? prev + " " : "") + TRANSCRIPT_DEMO);
      setGrabando(false);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [grabando]);

  // Pantalla 6: mensajes rotando mientras se interpreta el dictado.
  useEffect(() => {
    if (paso !== 6) return;
    const iv = window.setInterval(() => setMsg((i) => (i + 1) % MSGS_PROCESO.length), 1200);
    const fin = window.setTimeout(() => {
      setPropuesta(interpretarTranscript(texto));
      setPaso(7);
    }, 3600);
    return () => { window.clearInterval(iv); window.clearTimeout(fin); };
  }, [paso, texto]);

  // ── Pantalla 5 ──
  if (paso === 5) {
    return (
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Cuéntanos qué estás buscando</h3>
        <p className="help" style={{ marginTop: 0 }}>
          Describe con tus palabras el perfil de esta vacante: experiencia, habilidades, turno, ubicación y sueldo.
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
          <textarea rows={7} value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Aquí aparecerá lo que dictes; también puedes escribirlo a mano." />
        </div>

        <div className="paso-acciones">
          <button type="button" className="btn gold" disabled={!texto.trim() || grabando} onClick={() => { setMsg(0); setPaso(6); }}>
            Continuar
          </button>
          <button type="button" className="btn ghost" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    );
  }

  // ── Pantalla 6 ──
  if (paso === 6) {
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

  // ── Pantalla 7 ──
  const cambios = propuesta ?? {};
  const campos = Object.keys(cambios);
  const reqFinal: Requisito = { ...req, ...cambios };

  return (
    <div>
      <div className="aibox" style={{ marginBottom: 14 }}>
        <div className="hd"><Sparkles size={15} /> Publicación (a la medida)</div>
        <p style={{ fontSize: 12.5 }}>
          {campos.length
            ? <>Se acomodaron <b>{campos.length} campo(s)</b> con lo que dictaste: {campos.map((c) => CAMPOS_VOZ[c] ?? c).join(", ")}. Revísalos antes de aplicarlos.</>
            : <>No se reconoció ningún campo en el dictado. Puedes volver e intentarlo con más detalle.</>}
        </p>
      </div>

      <PasoPublicacion
        req={reqFinal}
        destacados={campos}
        acciones={
          <>
            <button type="button" className="btn gold" disabled={!campos.length} onClick={() => onAplicar(reqFinal, campos)}>
              <CheckCircle2 size={16} /> Aplicar a la publicación
            </button>
            <button type="button" className="btn ghost" onClick={() => { setPropuesta(null); setPaso(5); }}>
              Volver a dictar
            </button>
            <button type="button" className="btn ghost" onClick={onCancelar}><X size={15} /> Descartar</button>
          </>
        }
      />
    </div>
  );
}
