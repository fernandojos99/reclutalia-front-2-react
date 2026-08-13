/** Modal para invitar a un candidato a postularse (portado del `InvitarModal`). */
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Modal } from "../common/Modal";
import { Chip } from "../common/Chip";
import { nivelMovilidad } from "../../utils/movilidad";
import type { Candidato, Vacante } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  v: Vacante;
  onSend: (msg: string) => void;
  onClose: () => void;
}

/** Genera (simulado, determinista) un mensaje personalizado según el perfil del candidato. */
function mensajeIA(cand: Candidato, v: Vacante): string {
  const nombre = cand.nombre.split(" ")[0];
  const skills = [...(cand.esp ?? []), ...(cand.hard ?? [])].slice(0, 2);
  const skillTxt = skills.length ? ` Tu experiencia en ${skills.join(" y ")} destaca para este rol.` : "";
  const plantillas = [
    `Hola ${nombre}, revisé tu trayectoria como ${cand.puesto} y la veo muy alineada con la vacante «${v.req.titulo}» (${v.req.modalidad}, ${v.req.ubicacionTrabajo}).${skillTxt} Me encantaría invitarte a postularte. ¡Saludos!`,
    `¡Hola ${nombre}! Tu perfil de ${cand.puesto} llamó nuestra atención para «${v.req.titulo}».${skillTxt} Creo que sería un gran siguiente paso en tu carrera; ¿te gustaría postularte?`,
    `Hola ${nombre}, buscamos a alguien con tu perfil de ${cand.puesto} para «${v.req.titulo}» en ${v.req.ubicacionTrabajo} (${v.req.modalidad}).${skillTxt} Nos encantaría contar contigo en el proceso.`,
  ];
  return plantillas[cand.id % plantillas.length];
}

export function InvitarModal({ cand, v, onSend, onClose }: Props) {
  const def = `Hola ${cand.nombre.split(" ")[0]}, revisé tu perfil y creo que encaja muy bien con la vacante "${v.req.titulo}" (${v.req.modalidad}, ${v.req.ubicacionTrabajo}). Me encantaría invitarte a postularte. ¡Saludos!`;
  const [msg, setMsg] = useState(def);
  const [gen, setGen] = useState(false);
  const mov = nivelMovilidad(cand);

  const generar = () => {
    setGen(true);
    window.setTimeout(() => { setMsg(mensajeIA(cand, v)); setGen(false); }, 1400);
  };

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 4 }}>Invitar a postularse</h3>
      <p className="help" style={{ marginBottom: 8 }}>{cand.nombre} recibirá una notificación con tu mensaje en su cuenta, por correo y en WhatsApp.</p>
      {/* Semáforo del colaborador antes de mandar la invitación: si su movilidad es baja, conviene
          saberlo ahora y no después. Los externos no tienen semáforo. */}
      {mov && (
        <div className="tagpick" style={{ marginBottom: 12 }}>
          <Chip tone={mov.tono}>{mov.etiqueta}</Chip>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button className="btn sm" style={{ background: "var(--ai-soft)", color: "var(--ai)", border: "1px solid #C7CBF5" }} onClick={generar} disabled={gen}>
          <Sparkles size={13} /> {gen ? "Generando…" : "Generar mensaje"}
        </button>
      </div>
      <textarea rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} disabled={gen}
        style={gen ? { opacity: 0.6 } : undefined} />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn gold" onClick={() => onSend(msg)} disabled={gen}><Send size={15} /> Enviar invitación</button>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}
