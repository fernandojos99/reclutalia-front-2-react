/**
 * Proponer 3 horarios de entrevista.
 *
 * El bloque de "conectar calendario + elegir 3 horarios" está extraído en `SelectorHorarios` porque
 * el Assessment center necesita exactamente el mismo gesto: no son dos calendarios distintos, es el
 * mismo con otro destinatario.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Link2, Calendar, CheckCircle2, Send } from "lucide-react";
import { Modal } from "../common/Modal";
import type { Candidato } from "../../types/models/domain";

interface Props {
  cands: Candidato[];
  onSend: (slots: string[], modalidad: string) => void;
  onClose: () => void;
}

interface SelectorProps {
  /** Contenido del botón de envío; el texto cambia según quién recibe las opciones. */
  etiquetaEnviar: ReactNode;
  onSend: (slots: string[], modalidad: string) => void;
  onClose: () => void;
  /** Se pinta entre la modalidad y la rejilla de horarios (evaluadores del assessment). */
  children?: ReactNode;
  /** Bloquea el envío aunque los 3 horarios estén elegidos. */
  bloqueado?: boolean;
}

/**
 * Gate simulado de calendario + rejilla de 12 horarios (3 días hábiles × 4 horas), de los que hay
 * que elegir exactamente 3. No hay OAuth ni Graph: "Conectar" solo abre la rejilla.
 */
export function SelectorHorarios({ etiquetaEnviar, onSend, onClose, children, bloqueado = false }: SelectorProps) {
  const [conectado, setConectado] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [modalidad, setModalidad] = useState("Virtual (Teams)");

  const dias = useMemo(() => {
    const out: Date[] = [];
    const d = new Date();
    while (out.length < 3) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
    }
    return out;
  }, []);
  const horas = ["10:00", "12:00", "16:00", "17:30"];
  const slots = dias.flatMap((d) => horas.map((h) => d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) + " · " + h));
  const toggle = (s: string) => setSel((x) => (x.includes(s) ? x.filter((y) => y !== s) : x.length < 3 ? [...x, s] : x));

  if (!conectado) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "34px 20px" }}>
        <Link2 size={28} color="var(--ai)" style={{ marginBottom: 10 }} />
        <h3 style={{ fontSize: 15, marginBottom: 6 }}>Conecta tu calendario corporativo</h3>
        <p className="help" style={{ marginBottom: 16 }}>Vincula Outlook / Teams para ver tu disponibilidad real y generar las reuniones automáticamente.</p>
        <button className="btn ai" onClick={() => setConectado(true)}><Calendar size={15} /> Conectar Outlook / Teams</button>
        <div className="help" style={{ marginTop: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 5 }}>
          <svg viewBox="0 0 24 24" width={13} height={13} fill="#25D366" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
          </svg>
          Las opciones y recordatorios se enviarán por Whatsapp al candidato.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="chip ok" style={{ marginBottom: 12 }}><CheckCircle2 size={12} /> Calendario de Outlook sincronizado · mostrando tus espacios libres</div>
      <div className="field">
        <label>Modalidad de la sesión</label>
        <div className="tagpick">{["Virtual (Teams)", "Presencial"].map((m) => <button key={m} className={"tag" + (modalidad === m ? " on" : "")} onClick={() => setModalidad(m)}>{m}</button>)}</div>
      </div>
      {children}
      <label>Elige 3 horarios disponibles ({sel.length}/3)</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 6 }}>
        {slots.map((s) => <button key={s} className={"slotbtn" + (sel.includes(s) ? " on" : "")} onClick={() => toggle(s)}>{s}</button>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="btn gold" disabled={sel.length !== 3 || bloqueado} onClick={() => onSend(sel, modalidad)}><Send size={15} /> {etiquetaEnviar}</button>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
      </div>
    </>
  );
}

export function AgendaModal({ cands, onSend, onClose }: Props) {
  return (
    <Modal onClose={onClose} wide>
      <h3>Agendar entrevista</h3>
      <p className="help" style={{ marginBottom: 14 }}>Propón <b>3 horarios</b> a {cands.map((c) => c.nombre.split(" ")[0]).join(", ")}. Cada candidato confirmará el que le acomode.</p>
      <SelectorHorarios
        etiquetaEnviar={`Enviar opciones a ${cands.length} candidato(s)`}
        onSend={onSend} onClose={onClose} />
    </Modal>
  );
}
