/**
 * Editor de la sección "Requisitos" del anuncio: áreas de conocimiento, áreas de experiencia y
 * habilidades técnicas y blandas.
 *
 * Las habilidades las recorta `skillsSugeridas()` a lo que va acorde al puesto (simulación
 * determinista de la IA), con el catálogo completo detrás de un botón hoy oculto. Las áreas se
 * muestran enteras con lo predeterminado del puesto al frente (`areasSugeridas()`).
 *
 * "Áreas de experiencia" es solo la etiqueta visible: el campo del dominio sigue siendo
 * `espRequeridas` y no se renombra.
 */
import { useState } from "react";
import { TagPicker } from "../../ui/uploads";
import { HARD_SKILLS, SOFT_SKILLS } from "../../../constants/catalogos";
import { areasSugeridas, skillsSugeridas } from "../../../utils/perfilIA";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  onCambiarReq: (r: Requisito) => void;
}

/** Topes del dominio: los impone `requisitoSchema` (zod) y `coercionarReq()` en el backend. */
const MAX_AREAS = 3;
const MAX_ESP = 5;

export function SkillsEditor({ req, onCambiarReq }: Props) {
  const [todas, setTodas] = useState(false); // ver el catálogo completo en vez del recorte de la IA
  const sugeridas = skillsSugeridas(req);
  const areas = areasSugeridas(req);

  return (
    <>
      <div className="field">
        <label>Áreas de conocimiento <span className="help">· máx. {MAX_AREAS}</span></label>
        <TagPicker options={areas.areas} value={req.areasConocimiento}
          onChange={(nv) => onCambiarReq({ ...req, areasConocimiento: nv.slice(0, MAX_AREAS) })} />
      </div>
      <div className="field">
        <label>Áreas de experiencia <span className="help">· máx. {MAX_ESP}</span></label>
        <TagPicker options={areas.esp} value={req.espRequeridas}
          onChange={(nv) => onCambiarReq({ ...req, espRequeridas: nv.slice(0, MAX_ESP) })} />
      </div>
      <div className="field">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ marginBottom: 0 }}>Habilidades técnicas</label>
          {/* Oculto a propósito con `.oculto` (ver base.css). La lógica sigue viva: para
              recuperarlo basta con quitar esa clase. */}
          <button type="button" className="btn ghost sm oculto" style={{ marginLeft: "auto" }} onClick={() => setTodas((t) => !t)}>
            {todas ? "Ver solo las sugeridas" : "Ver catálogo completo"}
          </button>
        </div>
        <TagPicker options={todas ? HARD_SKILLS : sugeridas.hard} value={req.hardSkills}
          onChange={(nv) => onCambiarReq({ ...req, hardSkills: nv })} addNew />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Habilidades blandas</label>
        <TagPicker options={todas ? SOFT_SKILLS : sugeridas.soft} value={req.softSkills}
          onChange={(nv) => onCambiarReq({ ...req, softSkills: nv })} addNew />
      </div>
    </>
  );
}
