/**
 * Selector de habilidades duras y blandas. Extraído de `PasoPerfil` para que el editor de la
 * publicación ofrezca exactamente la misma vista y no haya dos maneras de tocar lo mismo.
 *
 * Las opciones las recorta `skillsSugeridas()` a lo que va acorde al puesto (simulación
 * determinista de la IA), con el catálogo completo detrás de un botón hoy oculto.
 */
import { useState } from "react";
import { TagPicker } from "../../ui/uploads";
import { HARD_SKILLS, SOFT_SKILLS } from "../../../constants/catalogos";
import { skillsSugeridas } from "../../../utils/perfilIA";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  onCambiarReq: (r: Requisito) => void;
}

export function SkillsEditor({ req, onCambiarReq }: Props) {
  const [todas, setTodas] = useState(false); // ver el catálogo completo en vez del recorte de la IA
  const sugeridas = skillsSugeridas(req);

  return (
    <>
      <div className="field">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ marginBottom: 0 }}>Habilidades duras / técnicas</label>
          {/* Oculto a propósito con `.oculto` (ver base.css). La lógica sigue viva: para
              recuperarlo basta con quitar esa clase. */}
          <button type="button" className="btn ghost sm oculto" style={{ marginLeft: "auto" }} onClick={() => setTodas((t) => !t)}>
            {todas ? "Ver solo las sugeridas" : "Ver catálogo completo"}
          </button>
        </div>
        <TagPicker options={todas ? HARD_SKILLS : sugeridas.hard} value={req.hardSkills}
          onChange={(nv) => onCambiarReq({ ...req, hardSkills: nv })} addNew />
      </div>
      <div className="field">
        <label>Habilidades blandas</label>
        <TagPicker options={todas ? SOFT_SKILLS : sugeridas.soft} value={req.softSkills}
          onChange={(nv) => onCambiarReq({ ...req, softSkills: nv })} addNew />
      </div>
    </>
  );
}
