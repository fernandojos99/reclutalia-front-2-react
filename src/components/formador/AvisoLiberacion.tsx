/**
 * Aviso al formador de que un colaborador suyo aceptó una oferta interna y liberará su puesto.
 *
 * Se muestra UNA sola vez por caso: el "ya lo vi" se recuerda en `localStorage` con la clave del
 * par vacante-candidato. Sin eso, el popup saltaría en cada carga de la app y sería insufrible.
 * La notificación equivalente sigue en el centro de notificaciones para poder consultarla después.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserMinus, ChevronDown, Pencil, Users } from "lucide-react";
import { Modal } from "../common/Modal";
import type { Candidato, Vacante } from "../../types/models/domain";

const CLAVE = "reclutalia_avisos_liberacion";

const vistos = (): string[] => {
  try { return JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as string[]; } catch { return []; }
};
const marcarVisto = (k: string): void => {
  try { localStorage.setItem(CLAVE, JSON.stringify([...new Set([...vistos(), k])])); } catch { /* almacenamiento no disponible */ }
};

/** Primer caso sin avisar para este formador, o null si no hay ninguno. */
export function buscarLiberacion(vacantes: Vacante[], candidatos: Candidato[], formadorId: string):
  { v: Vacante; c: Candidato; fecha: string; mensaje?: string; clave: string } | null {
  const ya = vistos();
  for (const v of vacantes) {
    for (const [cid, p] of Object.entries(v.pipeline || {})) {
      if (!["oferta_aceptada", "contratado"].includes(p.estado)) continue;
      const c = candidatos.find((x) => x.id === Number(cid));
      // Solo interesa si el que se va dependía de ESTE formador, y no de quien lo contrata.
      if (!c || c.tipo !== "interno" || c.formadorId !== formadorId || v.formadorId === formadorId) continue;
      const clave = `${v.id}·${cid}`;
      if (ya.includes(clave)) continue;
      return { v, c, fecha: p.oferta?.fecha ?? "la fecha acordada", mensaje: p.mensajeLiberacion, clave };
    }
  }
  return null;
}

interface Props {
  caso: NonNullable<ReturnType<typeof buscarLiberacion>>;
  onClose: () => void;
}

export function AvisoLiberacion({ caso, onClose }: Props) {
  const navigate = useNavigate();
  const [verMensaje, setVerMensaje] = useState(false);

  const cerrar = () => { marcarVisto(caso.clave); onClose(); };

  return (
    <Modal onClose={cerrar}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <UserMinus size={20} color="var(--gold-dark)" />
        <h3>Se libera una posición de tu equipo</h3>
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
        <b>{caso.c.nombre}</b> aceptó una oferta interna para <b>{caso.v.req.titulo}</b> y liberará
        su puesto de <b>{caso.c.puesto}</b> el <b>{caso.fecha}</b>.
      </p>

      {caso.mensaje && (
        <div className={"desp" + (verMensaje ? " on" : "")} style={{ marginTop: 12 }}>
          <button type="button" className="desp-hd" aria-expanded={verMensaje}
            onClick={() => setVerMensaje((x) => !x)}>
            <b>Te dejó un mensaje</b>
            <ChevronDown size={16} className="desp-chev" />
          </button>
          {verMensaje && (
            <div className="desp-body"><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{caso.mensaje}</p></div>
          )}
        </div>
      )}

      <div className="paso-acciones">
        <button className="btn gold" onClick={() => { cerrar(); navigate(`/formador/vacante/${caso.v.id}/revisar`); }}>
          <Pencil size={15} /> Revisar vacante
        </button>
        <button className="btn ghost" onClick={() => { cerrar(); navigate(`/formador/vacante/${caso.v.id}?tab=1`); }}>
          <Users size={15} /> Buscar candidatos
        </button>
      </div>
    </Modal>
  );
}
