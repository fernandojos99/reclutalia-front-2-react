/**
 * Bot flotante de Radar de Candidatos. Dos modos:
 *   - "FAQ": preguntas frecuentes (respuestas locales, sin costo).
 *   - "Agente": chat en vivo con el agente IA del backend (DeepSeek) vía SSE, reutilizando el
 *     componente compartido <AgentChat/> (el mismo que usa la vista integrada de chat). El agente
 *     usa tools que consumen los servicios del backend según el perfil (admin/formador/candidato).
 *
 * El panel es redimensionable (arrastrando borde izquierdo, superior y esquina sup-izquierda).
 */
import { useCallback, useRef, useState } from "react";
import { Bot, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDemo } from "../../contexts/DemoContext";
import { useBot } from "../../contexts/BotContext";
import { getSessionId } from "../../services/agenteService";
import { AgentChat, type Mensaje } from "../agente/AgentChat";
import asistente from "../../assets/asistente.png";

const BOT_FAQ = [
  { q: "¿Qué es el Marketplace de talento?", a: "Es el marketplace de candidatos internos y externos preregistrados. Al aprobar tu vacante, la IA busca, filtra y ranquea automáticamente los perfiles más compatibles." },
  { q: "¿Cómo funciona el ranking con IA?", a: "El agente de IA compara especialidades, habilidades, experiencia y ubicación contra tu vacante y asigna un match de 0 a 100%. Se actualiza tras la video-entrevista y la entrevista contigo." },
  { q: "¿Qué documentos sube el candidato?", a: "Para filtros iniciales: constancias de empleos previos y el examen psicométrico (válido 6 meses). Para contratación: INE, CURP, RFC, comprobante de domicilio, comprobante de estudios y su cuenta bancaria para nómina. Solo PDF, máximo 1 MB por archivo." },
  { q: "¿Puedo cambiar la vacante que me asignaron?", a: "Sí. Antes de aprobarla puedes proponer cambios al administrador desde la pestaña Descriptivo; el administrador los confirma o rechaza." },
  { q: "¿Cómo agendo entrevistas?", a: "Al invitar candidatos a entrevista conectas tu calendario de Outlook/Teams (simulado) y propones 3 horarios; el candidato confirma uno y ambos reciben el enlace de Teams." },
];

type Modo = "faq" | "agente";
type Dir = "left" | "top" | "corner";

const MIN_W = 300, MIN_H = 340;

export function BotSoporte() {
  const { rol, formadorId, candId } = useDemo();
  // La apertura vive en BotContext: otros componentes (el botón de chat del asistente) la abren.
  const { abierto: open, alternar } = useBot();
  const [modo, setModo] = useState<Modo>("faq");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [botSession] = useState(getSessionId);

  // ── Redimensionado del panel ──
  const [size, setSize] = useState({ w: 360, h: 520 });
  const dragRef = useRef<{ dir: Dir; x: number; y: number; w: number; h: number } | null>(null);

  const onResizeMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const maxW = window.innerWidth - 44;
    const maxH = window.innerHeight - 108;
    let w = d.w, h = d.h;
    if (d.dir === "left" || d.dir === "corner") w = d.w + (d.x - e.clientX);
    if (d.dir === "top" || d.dir === "corner") h = d.h + (d.y - e.clientY);
    setSize({
      w: Math.max(MIN_W, Math.min(maxW, w)),
      h: Math.max(MIN_H, Math.min(maxH, h)),
    });
  }, []);

  const onResizeEnd = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeEnd);
    document.body.style.userSelect = "";
  }, [onResizeMove]);

  const onResizeStart = (dir: Dir) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { dir, x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeEnd);
  };

  const [faqMsgs, setFaqMsgs] = useState<Mensaje[]>([
    { de: "bot", t: "¡Hola! Soy tu asistente de Radar de Candidatos. Elige una pregunta frecuente o cambia a 'Agente IA' para pedirme acciones sobre el sistema." },
  ]);
  const askFaq = (f: { q: string; a: string }) => {
    setFaqMsgs((m) => [...m, { de: "yo", t: f.q }, { de: "bot", t: f.a }]);
    queueMicrotask(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight));
  };

  const bienvenida: Mensaje = {
    de: "bot",
    t: `Soy tu agente IA. Estás como **${rol}**. Puedo consultar y operar el sistema por ti: pídeme, por ejemplo, *"lista mis vacantes"* o *"muéstrame los candidatos del Marketplace de talento"*.`,
  };

  return (
    <>
      {open && (
        <div className="botpanel" style={{ width: size.w, height: size.h, maxWidth: "calc(100vw - 44px)", maxHeight: "calc(100vh - 108px)" }}>
          {/* Handles de redimensionado (panel anclado abajo-derecha → crece hacia arriba/izquierda) */}
          <div onPointerDown={onResizeStart("top")} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, cursor: "ns-resize", zIndex: 3 }} />
          <div onPointerDown={onResizeStart("left")} style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 6, cursor: "ew-resize", zIndex: 3 }} />
          <div onPointerDown={onResizeStart("corner")} title="Arrastra para redimensionar" style={{ position: "absolute", top: 0, left: 0, width: 15, height: 15, cursor: "nwse-resize", zIndex: 4 }} />

          <div style={{ background: "var(--ink)", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 9 }}>
            <Bot size={18} color="var(--gold)" />
            <b style={{ fontSize: 13.5 }}>Asistente Radar de Candidatos</b>
            <span className="chip ai" style={{ marginLeft: "auto" }}>{modo === "faq" ? "FAQ" : "Agente IA"}</span>
          </div>

          {/* Selector de modo */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
            <button className="btn ghost sm" style={{ flex: 1, borderRadius: 0, fontWeight: modo === "faq" ? 700 : 400 }} onClick={() => setModo("faq")}>Preguntas</button>
            <button className="btn ghost sm" style={{ flex: 1, borderRadius: 0, fontWeight: modo === "agente" ? 700 : 400, display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }} onClick={() => setModo("agente")}>
              <Sparkles size={13} /> Agente IA
            </button>
          </div>

          {/* Modo FAQ (respuestas locales) */}
          <div style={{ flex: 1, minHeight: 0, flexDirection: "column", display: modo === "faq" ? "flex" : "none" }}>
            <div ref={scrollRef} style={{ padding: 14, overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {faqMsgs.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.de === "yo" ? "flex-end" : "flex-start",
                  background: m.de === "bot" ? "var(--bg)" : "var(--gold-soft)",
                  border: "1px solid var(--line)", borderRadius: 12, padding: "8px 12px",
                  fontSize: 12.5, maxWidth: "92%",
                }}>
                  {m.de === "bot" ? (
                    <div className="chat-md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.t}</ReactMarkdown></div>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.t}</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 6 }}>
              {BOT_FAQ.map((f, i) => (
                <button key={i} className="btn ghost sm" style={{ justifyContent: "flex-start", textAlign: "left" }} onClick={() => askFaq(f)}>
                  {f.q}
                </button>
              ))}
            </div>
          </div>

          {/* Modo Agente (chat en vivo, componente compartido). Se mantiene montado para conservar el hilo. */}
          <div style={{ flex: 1, minHeight: 0, flexDirection: "column", display: modo === "agente" ? "flex" : "none" }}>
            <AgentChat sessionId={botSession} identidad={{ rol, formadorId, candId }} initial={[bienvenida]} />
          </div>
        </div>
      )}
      <button className="botfab" onClick={alternar} title="Bot interactivo de apoyo y soporte">
        {open ? <X size={22} /> : <img src={asistente} alt="Asistente" className="botfab-img" />}
      </button>
    </>
  );
}
