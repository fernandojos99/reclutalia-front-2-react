/**
 * Designación de sucesor: a qué posición del formador queda apuntado un colaborador.
 *
 * No es una asignación administrativa sino una declaración de intención, y por eso la ventana
 * explica antes que nada qué provoca: cuando esa vacante entre en búsqueda, este perfil encabezará
 * el Marketplace. Sin esa frase, el formador no tiene forma de saber para qué sirve el botón.
 */
import { useState } from "react";
import { Crown, Trash2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";
import type { Candidato, Vacante } from "../../types/models/domain";

interface Props {
  cand: Candidato;
  /** Vacantes que gestiona este formador; son las únicas que puede asignar. */
  vacantes: Vacante[];
  onAsignar: (vacId: string) => void;
  onQuitar: (vacId: string) => void;
  onClose: () => void;
  guardando?: boolean;
}

export function SucesorModal({ cand, vacantes, onAsignar, onQuitar, onClose, guardando = false }: Props) {
  const nombre = cand.nombre.split(" ")[0];
  // La posición de la que ya es sucesor, si la hay: un colaborador solo puede serlo de una.
  const actual = vacantes.find((v) => v.sucesorCid === cand.id);
  const [sel, setSel] = useState(actual?.id ?? "");

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <Avatar nombre={cand.nombre} foto={cand.foto} />
        <div>
          <h3 style={{ fontSize: 17 }}>Designar como sucesor</h3>
          <div className="help">{cand.nombre} · {cand.puesto}</div>
        </div>
      </div>

      <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 14 }}>
        Al designar a {nombre} como sucesor de una posición, su perfil aparecerá <b>destacado al
        inicio del Marketplace</b> cada vez que esa vacante esté en proceso de búsqueda, antes que
        el resto de candidatos. Se le notificará que fue elegido.
      </p>

      {vacantes.length === 0 ? (
        <p className="help" style={{ marginBottom: 14 }}>
          Todavía no gestionas ninguna vacante a la que puedas asignarlo.
        </p>
      ) : (
        <div className="field">
          <label>Posición de la que será sucesor</label>
          <select value={sel} onChange={(e) => setSel(e.target.value)} disabled={guardando}>
            <option value="">Selecciona una posición…</option>
            {vacantes.map((v) => (
              <option key={v.id} value={v.id}>{v.req.titulo} · {v.id}</option>
            ))}
          </select>
          <div className="help">
            {actual
              ? `Hoy es sucesor de "${actual.req.titulo}". Elegir otra posición lo mueve: solo puede serlo de una.`
              : "Un colaborador puede ser sucesor de una sola posición a la vez."}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn gold" disabled={guardando || !sel || sel === actual?.id}
          onClick={() => onAsignar(sel)}>
          <Crown size={15} /> {guardando ? "Guardando…" : "Designar sucesor"}
        </button>
        {actual && (
          <button className="btn ghost" disabled={guardando} onClick={() => onQuitar(actual.id)}>
            <Trash2 size={14} /> Quitar de "{actual.req.titulo}"
          </button>
        )}
        <button className="btn ghost" disabled={guardando} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}
