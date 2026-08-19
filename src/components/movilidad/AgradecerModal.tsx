/**
 * Cierre del formador cuando pierde a un colaborador que se mueve a otra vacante.
 *
 * Los dos textos NO tienen el mismo destinatario, y la ventana lo dice claramente para que nadie se
 * equivoque de campo:
 *   - **Mensaje de agradecimiento** → le llega al colaborador como notificación. Lo lee él.
 *   - **Resumen de desempeño** → se guarda en su historial de puestos y solo lo ven otros
 *     formadores. El colaborador no lo lee nunca.
 */
import { useState } from "react";
import { Eye, EyeOff, HandHeart } from "lucide-react";
import { Chip } from "../common/Chip";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";
import type { Candidato } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  onEnviar: (mensaje: string, resumen: string, habilidades: string[]) => void;
  onClose: () => void;
  enviando?: boolean;
}

export function AgradecerModal({ cand, onEnviar, onClose, enviando = false }: Props) {
  const nombre = cand.nombre.split(" ")[0];
  const [mensaje, setMensaje] = useState(
    `${nombre}, gracias por todo lo que aportaste al equipo. Te deseamos mucho éxito en tu nueva etapa dentro del grupo.`,
  );
  const [resumen, setResumen] = useState("");
  const [habilidades, setHabilidades] = useState<string[]>([]);

  // Se eligen de lo que ya tiene en su perfil: destacar algo que no está en su ficha no ayudaría a
  // nadie a encontrarlo después.
  const suyas = [...cand.esp, ...cand.hard, ...cand.soft];
  const alternar = (h: string) =>
    setHabilidades((x) => (x.includes(h) ? x.filter((y) => y !== h) : [...x, h]));

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <Avatar nombre={cand.nombre} foto={cand.foto} />
        <div>
          <h3 style={{ fontSize: 17 }}>Agradecer y cerrar</h3>
          <div className="help">{cand.nombre} · {cand.puesto}</div>
        </div>
      </div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={13} /> Mensaje de agradecimiento · lo recibe {nombre}
        </label>
        <textarea rows={4} value={mensaje} disabled={enviando}
          onChange={(e) => setMensaje(e.target.value)} />
        <div className="help">Le llegará como notificación en su cuenta.</div>
      </div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <EyeOff size={13} /> Resumen de su desempeño · {nombre} NO lo ve
        </label>
        <textarea rows={4} value={resumen} disabled={enviando}
          placeholder="Cómo se desempeñó en el puesto que deja, qué destacarías y qué conviene reforzar."
          onChange={(e) => setResumen(e.target.value)} />
        <div className="help">
          Queda en su historial de puestos y solo lo pueden leer otros formadores. Es opcional.
        </div>
      </div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <EyeOff size={13} /> Habilidades y áreas de experiencia que destacó · {nombre} NO las ve
        </label>
        <div className="tagpick">
          {suyas.map((h) => (
            <button key={h} type="button" disabled={enviando}
              onClick={() => alternar(h)}
              style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}>
              <Chip tone={habilidades.includes(h) ? "ok" : ""}>{h}</Chip>
            </button>
          ))}
        </div>
        <div className="help">
          Quedan junto al resumen en su historial de puestos y las leen los formadores que valoren
          su perfil más adelante. Es opcional.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="btn gold" disabled={enviando || !mensaje.trim()}
          onClick={() => onEnviar(mensaje, resumen, habilidades)}>
          <HandHeart size={15} /> {enviando ? "Enviando…" : "Enviar y cerrar"}
        </button>
        <button className="btn ghost" disabled={enviando} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}
