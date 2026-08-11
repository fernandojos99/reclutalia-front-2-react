/**
 * Editor de la sección "Requisitos" del anuncio: áreas de conocimiento, áreas de experiencia y
 * habilidades técnicas y blandas.
 *
 * Las dos listas de áreas salen ya acotadas a la **disciplina del puesto**, que resuelve quien
 * monta este componente (ver la cadena en `PasoPublicacion`). Antes había aquí una fila de chips
 * para filtrar a mano; el trabajo de clasificar no es del formador.
 *
 * Las habilidades NO se filtran por disciplina: `skillsSugeridas()` ya las cruza con el área y el
 * título y deja entre 4 y 9 de 25, un recorte MÁS estrecho del que daría la disciplina (que para
 * "Tecnología y Datos" dejaría 11). Filtrarlas otra vez sería ampliar la lista, no reducirla.
 * Lo que sí comparten con las áreas es el escape: las cuatro tienen su "Ver todas".
 *
 * "Áreas de experiencia" es solo la etiqueta visible: el campo del dominio sigue siendo
 * `espRequeridas` y no se renombra.
 */
import { useState } from "react";
import { TagPicker } from "../../ui/uploads";
import {
  ESPECIALIDADES, PROFESIONES, HARD_SKILLS, SOFT_SKILLS,
  DISC_ESPECIALIDADES, DISC_PROFESIONES, type Disciplina,
} from "../../../constants/catalogos";
import { porDisciplina, skillsSugeridas } from "../../../utils/perfilIA";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  onCambiarReq: (r: Requisito) => void;
  /** Disciplina ya resuelta. Sin ella se muestra el catálogo completo, que es mejor que nada. */
  disciplina?: Disciplina;
  /** La clasificación está en camino (el backend le está preguntando al modelo). */
  clasificando?: boolean;
}

/** Topes del dominio: los impone `requisitoSchema` (zod) y `coercionarReq()` en el backend. */
const MAX_AREAS = 3;
const MAX_ESP = 5;

export function SkillsEditor({ req, onCambiarReq, disciplina, clasificando = false }: Props) {
  /** Escape para cuando el recorte no acierta: abre el catálogo completo de ese campo. */
  const [todasAreas, setTodasAreas] = useState(false);
  const [todasEsp, setTodasEsp] = useState(false);
  const [todasHard, setTodasHard] = useState(false);
  const [todasSoft, setTodasSoft] = useState(false);

  const sugeridas = skillsSugeridas(req);

  const areas = !disciplina || todasAreas
    ? PROFESIONES
    : porDisciplina(PROFESIONES, DISC_PROFESIONES, disciplina, req.areasConocimiento);
  const esp = !disciplina || todasEsp
    ? ESPECIALIDADES
    : porDisciplina(ESPECIALIDADES, DISC_ESPECIALIDADES, disciplina, req.espRequeridas);

  /**
   * Enlace discreto para ampliar al catálogo completo y volver.
   *
   * `volverA` nombra el recorte al que se regresa, y es null cuando no hay ninguno —caso de las
   * áreas sin disciplina resuelta, que ya muestran todo y no tienen a dónde volver.
   */
  const verTodas = (activo: boolean, set: (v: boolean) => void, volverA: string | null) =>
    volverA ? (
      <button type="button" className="linkish" onClick={() => set(!activo)}>
        {activo ? `Ver solo ${volverA}` : "Ver todas"}
      </button>
    ) : null;

  return (
    <>
      {clasificando && (
        <p className="help" style={{ marginTop: 0 }}>Clasificando el puesto…</p>
      )}

      <div className="field">
        <label>Áreas de conocimiento <span className="help">· máx. {MAX_AREAS}</span></label>
        <TagPicker options={areas} value={req.areasConocimiento}
          onChange={(nv) => onCambiarReq({ ...req, areasConocimiento: nv.slice(0, MAX_AREAS) })} />
        {verTodas(todasAreas, setTodasAreas, disciplina ? `lo de ${disciplina}` : null)}
      </div>
      <div className="field">
        <label>Áreas de experiencia <span className="help">· máx. {MAX_ESP}</span></label>
        <TagPicker options={esp} value={req.espRequeridas}
          onChange={(nv) => onCambiarReq({ ...req, espRequeridas: nv.slice(0, MAX_ESP) })} />
        {verTodas(todasEsp, setTodasEsp, disciplina ? `lo de ${disciplina}` : null)}
      </div>
      <div className="field">
        <label>Habilidades técnicas</label>
        <TagPicker options={todasHard ? HARD_SKILLS : sugeridas.hard} value={req.hardSkills}
          onChange={(nv) => onCambiarReq({ ...req, hardSkills: nv })} addNew />
        {verTodas(todasHard, setTodasHard, "las sugeridas para el puesto")}
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Habilidades blandas</label>
        <TagPicker options={todasSoft ? SOFT_SKILLS : sugeridas.soft} value={req.softSkills}
          onChange={(nv) => onCambiarReq({ ...req, softSkills: nv })} addNew />
        {verTodas(todasSoft, setTodasSoft, "las sugeridas para el puesto")}
      </div>
    </>
  );
}
