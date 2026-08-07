/**
 * El anuncio de la vacante, en sus dos modos.
 *
 * Es UN solo componente a propósito: las pestañas "Editar" y "Vista final" deben tener la misma
 * estructura, el mismo orden y los mismos textos; lo único que cambia es que en modo `editable`
 * cada sección expone su control. Mantenerlas como dos árboles distintos garantizaba que se
 * separasen a la primera de cambio.
 *
 * Las acciones del pie las inyecta quien lo usa (publicar, o aplicar/descartar el dictado).
 */
import type { ReactNode } from "react";
import { MapPin, Clock, CheckCircle2, ShieldCheck, Sparkles, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Chip } from "../../common/Chip";
import { PerfilResumen } from "./PerfilResumen";
import { SkillsEditor } from "./SkillsEditor";
import { bonos, sueldoMensual, BENEFICIOS } from "../../../constants/paqueteVacante";
import { recortarDescripcion, leerFunciones, escribirFunciones, tieneFunciones } from "../../../utils/publicacion";
import { titulosSugeridos } from "../../../utils/tituloIA";
import { TIPOS_VACANTE, TURNO_PERSONALIZADO } from "../../../constants/catalogos";
import { money } from "../../../utils/format";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  /** Campos que resaltar como recién propuestos (dictado por voz). */
  destacados?: string[];
  acciones: ReactNode;
  /** Muestra los controles de edición sobre la misma estructura. */
  editable?: boolean;
  /** Obligatorio si `editable`. */
  onCambiarReq?: (r: Requisito) => void;
}

export function PasoPublicacion({ req, destacados, acciones, editable = false, onCambiarReq }: Props) {
  const [nuevaFn, setNuevaFn] = useState("");
  const cambiar = (r: Requisito) => onCambiarReq?.(r);

  const funciones = leerFunciones(req.descripcion);
  const hayFunciones = tieneFunciones(req.descripcion);
  const guardarFns = (fs: string[]) => cambiar({ ...req, descripcion: escribirFunciones(req.descripcion, fs) });

  /** "Lo que ofrecemos": los conceptos que se publican, con palomita. Sin el sueldo. */
  const ofrecidos = [
    ...bonos(req).filter((b) => b.titulo !== "Sueldo").map((b) => b.titulo),
    ...BENEFICIOS.map((b) => b.titulo),
  ];

  return (
    <div>
      <div className="pub-hero">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <h2>{req.titulo}</h2>
          {req.tipoVacante === "Confidencial" && <Chip tone="gold" icon={ShieldCheck}>Confidencial</Chip>}
        </div>

        {editable && (
          <div className="pub-edit-hero">
            <label>Título de la vacante</label>
            <select value={req.titulo} onChange={(e) => cambiar({ ...req, titulo: e.target.value })}>
              <option value={req.titulo}>{req.titulo}</option>
              {titulosSugeridos(req.titulo, req.area).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="pub-edit-hint"><Sparkles size={12} /> Opciones sugeridas por IA</div>
          </div>
        )}

        {/* El sueldo se puede ocultar: esto es lo que ve el candidato. */}
        {!req.sueldoOculto && (
          <div className="pub-sueldo">{money(sueldoMensual(req))} <span style={{ fontSize: 13, fontWeight: 600, color: "#C9C9C9" }}>mensual bruto</span></div>
        )}
        {editable && (
          <div className="pub-edit-hero" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ marginBottom: 0 }}>Visibilidad del sueldo</label>
            <button type="button" role="switch" aria-checked={!req.sueldoOculto}
              className={"switch" + (req.sueldoOculto ? "" : " on")}
              onClick={() => cambiar({ ...req, sueldoOculto: !req.sueldoOculto })}><i /></button>
            <span className="pub-edit-hint" style={{ margin: 0 }}>
              {req.sueldoOculto ? "Oculto para los candidatos" : "Visible para los candidatos"}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <Chip icon={MapPin}>{req.ubicacionTrabajo} · {req.modalidad}</Chip>
          <Chip icon={Clock}>{req.turno || "Turno Mixto"}</Chip>
          {req.turno === TURNO_PERSONALIZADO && req.horario && <Chip icon={Clock}>{req.horario}</Chip>}
          {req.turno === TURNO_PERSONALIZADO && req.dias.length > 0 && <Chip>{req.dias.join(" · ")}</Chip>}
          <Chip>{req.expNoRelevante ? "Experiencia no relevante" : `${req.anosExp}+ años de experiencia`}</Chip>
          <Chip>{req.educacion}</Chip>
          {req.numVacantes > 1 && <Chip>{req.numVacantes} posiciones</Chip>}
        </div>
      </div>

      {/* Las tres secciones van pegadas, formando un bloque continuo. */}
      <div className="pub-bloques">
        <section className="pub-bloque">
          <h4 className="pub-h">Perfil</h4>
          {editable ? (
            <>
              <label>Funciones principales</label>
              {/* Sin sección todavía (vacante recién creada): `escribirFunciones` la crea con la
                  primera que se añada, así que aquí solo hay que avisar, no bloquear. */}
              {!hayFunciones && (
                <p className="pub-nota" style={{ marginBottom: 10 }}>
                  Esta vacante aún no tiene funciones. La primera que añadas creará la sección.
                </p>
              )}
              {funciones.map((f, i) => (
                <div className="fn-fila" key={i}>
                  <textarea rows={2} value={f}
                    onChange={(e) => guardarFns(funciones.map((x, k) => (k === i ? e.target.value : x)))} />
                  <button type="button" className="btn ghost sm" title="Quitar esta función"
                    onClick={() => guardarFns(funciones.filter((_, k) => k !== i))}><Trash2 size={13} /></button>
                </div>
              ))}
              <div className="fn-fila" style={{ marginTop: 10 }}>
                <textarea rows={2} value={nuevaFn} placeholder="Escribe una función nueva…"
                  onChange={(e) => setNuevaFn(e.target.value)} />
                <button type="button" className="btn ghost sm" disabled={!nuevaFn.trim()}
                  onClick={() => { guardarFns([...funciones, nuevaFn.trim()]); setNuevaFn(""); }}>
                  <Plus size={13} /> Añadir
                </button>
              </div>
            </>
          ) : (
            req.descripcion && (
              <div className="desc-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{recortarDescripcion(req.descripcion)}</ReactMarkdown>
              </div>
            )
          )}
        </section>

        <section className="pub-bloque">
          <h4 className="pub-h">Requisitos</h4>
          {editable
            ? <SkillsEditor req={req} onCambiarReq={cambiar} />
            : <PerfilResumen req={req} destacados={destacados} sinCondiciones />}
        </section>

        <section className="pub-bloque">
          <h4 className="pub-h">Lo que ofrecemos</h4>
          <div className="ofrece-grupo">
            <div className="ofrece-sub">Compensaciones, bonos y beneficios</div>
            <ul className="ofrece-lista">
              {ofrecidos.map((x) => <li key={x}><CheckCircle2 size={14} />{x}</li>)}
            </ul>
          </div>
        </section>
      </div>

      {editable && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="field">
            <label>Tipo de vacante</label>
            <div className="tagpick">
              {TIPOS_VACANTE.map((t) => (
                <button type="button" key={t} className={"tag" + (req.tipoVacante === t ? " on" : "")}
                  onClick={() => cambiar({ ...req, tipoVacante: t })}>{t}</button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Búsqueda automática</label>
            <label className="chk-inline pub-auto">
              <input type="checkbox" checked={req.busquedaAutomatica}
                onChange={(e) => cambiar({ ...req, busquedaAutomatica: e.target.checked })} />
              {" "}Buscar candidatos automáticamente cada vez que se libere vacante
            </label>
          </div>
        </div>
      )}

      <div className="paso-acciones">{acciones}</div>
    </div>
  );
}
