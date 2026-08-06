/**
 * Pantalla 1 · Verifica el perfil.
 * Nombre de la vacante, formador asignado, el MRFN desplegable y el "Perfil del candidato".
 *
 * El botón Editar abre las habilidades (duras y blandas) más experiencia, ubicación y turno;
 * quedan fuera a propósito el área de conocimiento, las especialidades y las aptitudes a evaluar.
 * Las opciones de habilidades las recorta `skillsSugeridas()` a lo que va acorde al puesto
 * (simulación determinista de la IA), con acceso al catálogo entero a un clic.
 */
import { useState } from "react";
import { Compass, ListChecks, Ban, Target, User, Edit3, X } from "lucide-react";
import { Desplegable } from "../../common/Desplegable";
import { Chip } from "../../common/Chip";
import { OrganizacionCard } from "../OrganizacionCard";
import { TagPicker } from "../../ui/uploads";
import { AccionesPaso } from "./AccionesPaso";
import { PerfilResumen } from "./PerfilResumen";
import { mrfn } from "../../../constants/paqueteVacante";
import { HARD_SKILLS, SOFT_SKILLS, CIUDADES, TURNOS } from "../../../constants/catalogos";
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
  /** Se llama con el texto de la solicitud de ajustes al marco organizacional de la vacante. */
  onSolicitarAjustes: (texto: string) => void;
}

export function PasoPerfil({
  v, req, formadorNombre, bloqueado, hecho, destacados, onCambiarReq, onConfirmar, onSolicitarAjustes,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [todas, setTodas] = useState(false); // ver el catálogo completo en vez del recorte de la IA
  const m = mrfn(req);
  const sugeridas = skillsSugeridas(req);

  return (
    <div>
      <div className="grid2" style={{ marginBottom: 4 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Puesto</label>
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

      <OrganizacionCard req={req} onSolicitar={onSolicitarAjustes} />

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
          <div className="grid2">
            <div className="field">
              <label>Años de experiencia</label>
              <input type="number" min="0" value={req.anosExp} disabled={req.expNoRelevante}
                onChange={(e) => onCambiarReq({ ...req, anosExp: +e.target.value })} />
              <label className="chk-inline">
                <input type="checkbox" checked={req.expNoRelevante}
                  onChange={(e) => onCambiarReq({ ...req, expNoRelevante: e.target.checked })} /> No relevante
              </label>
            </div>
            <div className="field">
              <label>Ubicación del trabajo</label>
              <select value={req.ubicacionTrabajo} onChange={(e) => onCambiarReq({ ...req, ubicacionTrabajo: e.target.value })}>
                {CIUDADES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Turno</label>
            <div className="tagpick">
              {TURNOS.map((t) => (
                <button type="button" key={t} className={"tag" + (req.turno === t ? " on" : "")}
                  onClick={() => onCambiarReq({ ...req, turno: t })}>{t}</button>
              ))}
            </div>
          </div>
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
