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
import { Compass, ListChecks, Ban, Target, Edit3, X } from "lucide-react";
import { Desplegable } from "../../common/Desplegable";
import { OrganizacionCard } from "../OrganizacionCard";
import { SkillsEditor } from "./SkillsEditor";
import { AccionesPaso } from "./AccionesPaso";
import { PerfilResumen } from "./PerfilResumen";
import { mrfn } from "../../../constants/paqueteVacante";
import { CIUDADES, DIAS, TURNOS, TURNO_PERSONALIZADO } from "../../../constants/catalogos";
import type { Requisito, Vacante } from "../../../types/models/domain";

/** El horario vive como un solo string ("9:00 – 18:00"); estos dos lo parten y lo rearman. */
const horaDe = (horario: string, i: 0 | 1): string => {
  const partes = (horario || "").split("–").map((s) => s.trim());
  const h = partes[i] ?? "";
  return /^\d{1,2}:\d{2}$/.test(h) ? h.padStart(5, "0") : "";
};
const unirHorario = (entrada: string, salida: string): string =>
  entrada && salida ? `${entrada} – ${salida}` : entrada || salida;

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
  const m = mrfn(req);

  return (
    <div>
      <OrganizacionCard req={req} vacId={v.id} formadorNombre={formadorNombre}
        onSolicitar={onSolicitarAjustes} />

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

          {/* Los campos de horario solo existen si se eligió el turno a medida. */}
          {req.turno === TURNO_PERSONALIZADO && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="grid2">
                <div className="field">
                  <label>Hora de entrada</label>
                  <input type="time" value={horaDe(req.horario, 0)}
                    onChange={(e) => onCambiarReq({ ...req, horario: unirHorario(e.target.value, horaDe(req.horario, 1)) })} />
                </div>
                <div className="field">
                  <label>Hora de salida</label>
                  <input type="time" value={horaDe(req.horario, 1)}
                    onChange={(e) => onCambiarReq({ ...req, horario: unirHorario(horaDe(req.horario, 0), e.target.value) })} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Días de trabajo</label>
                <div className="tagpick">
                  {DIAS.map((d) => (
                    <button type="button" key={d} className={"tag" + (req.dias.includes(d) ? " on" : "")}
                      onClick={() => onCambiarReq({
                        ...req,
                        dias: req.dias.includes(d) ? req.dias.filter((x) => x !== d) : [...req.dias, d],
                      })}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SkillsEditor req={req} onCambiarReq={onCambiarReq} />
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
