/**
 * Pantalla 1 · Verifica el perfil.
 * Nombre de la vacante, formador asignado, el MRFN desplegable y el "Perfil del candidato".
 *
 * El botón Editar abre SOLO las habilidades (duras y blandas): quedan fuera a propósito el área
 * de conocimiento, las especialidades y las aptitudes a evaluar. Las opciones que se ofrecen las
 * recorta `skillsSugeridas()` a lo que va acorde al puesto (simulación determinista de la IA).
 */
import { useState } from "react";
import { Compass, ListChecks, Ban, Target, User, Edit3, Sparkles, X } from "lucide-react";
import { Desplegable } from "../../common/Desplegable";
import { Chip } from "../../common/Chip";
import { TagPicker } from "../../ui/uploads";
import { AccionesPaso } from "./AccionesPaso";
import { PerfilResumen } from "./PerfilResumen";
import { mrfn } from "../../../constants/paqueteVacante";
import { HARD_SKILLS, SOFT_SKILLS } from "../../../constants/catalogos";
import { skillsSugeridas } from "../../../utils/perfilIA";
import type { Requisito, Vacante } from "../../../types/models/domain";

interface Props {
  v: Vacante;
  req: Requisito;
  formadorNombre: string;
  bloqueado: boolean;
  hecho: boolean;
  destacados?: string[];
  onCambiarReq: (r: Requisito) => void;
  onConfirmar: () => void;
}

export function PasoPerfil({
  v, req, formadorNombre, bloqueado, hecho, destacados, onCambiarReq, onConfirmar,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [todas, setTodas] = useState(false); // ver el catálogo completo en vez del recorte de la IA
  const m = mrfn(req);
  const sugeridas = skillsSugeridas(req);

  return (
    <div>
      <div className="grid2" style={{ marginBottom: 4 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Vacante</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <b style={{ fontSize: 15 }}>{req.titulo}</b><Chip>{v.id}</Chip>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Formador asignado</label>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5 }}>
            <User size={14} color="var(--gold-dark)" /> {formadorNombre}
          </div>
        </div>
      </div>

      <div className="rev-titulin">Mandato, responsabilidades y funciones</div>
      <Desplegable titulo="Mandato" icono={Compass} detalle={<p>{m.mandato}</p>} />
      <Desplegable titulo="Responsabilidades" icono={Target}
        detalle={<ul>{m.responsabilidades.map((x) => <li key={x}>{x}</li>)}</ul>} />
      <Desplegable titulo="Funciones" icono={ListChecks}
        detalle={<ul>{m.funciones.map((x) => <li key={x}>{x}</li>)}</ul>} />
      <Desplegable titulo="No funciones" icono={Ban}
        detalle={<ul>{m.noFunciones.map((x) => <li key={x}>{x}</li>)}</ul>} />

      <div className="rev-titulin">Perfil del candidato</div>
      {editando ? (
        <div>
          <div className="aibox" style={{ marginBottom: 14 }}>
            <div className="hd"><Sparkles size={15} /> Habilidades acordes al puesto</div>
            <p style={{ fontSize: 12.5 }}>
              Se analizó la vacante y se dejaron solo las habilidades que embonan con <b>{req.titulo}</b>{" "}
              ({req.area}). Puedes abrir el catálogo completo si necesitas alguna que no aparezca.
            </p>
            <button type="button" className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => setTodas((t) => !t)}>
              {todas ? "Ver solo las sugeridas" : "Ver catálogo completo"}
            </button>
          </div>
          <div className="field">
            <label>Habilidades duras / técnicas</label>
            <TagPicker options={todas ? HARD_SKILLS : sugeridas.hard} value={req.hardSkills}
              onChange={(nv) => onCambiarReq({ ...req, hardSkills: nv })} addNew />
          </div>
          <div className="field">
            <label>Habilidades blandas</label>
            <TagPicker options={todas ? SOFT_SKILLS : sugeridas.soft} value={req.softSkills}
              onChange={(nv) => onCambiarReq({ ...req, softSkills: nv })} addNew />
          </div>
          <button type="button" className="btn ghost sm" onClick={() => setEditando(false)}>
            <X size={13} /> Cerrar edición
          </button>
        </div>
      ) : (
        <PerfilResumen req={req} destacados={destacados} />
      )}

      {!editando && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <button type="button" className="btn ghost sm" disabled={bloqueado} onClick={() => setEditando(true)}>
            <Edit3 size={13} /> Editar
          </button>
        </div>
      )}

      <AccionesPaso hecho={hecho} bloqueado={bloqueado} onConfirmar={onConfirmar} />
    </div>
  );
}
