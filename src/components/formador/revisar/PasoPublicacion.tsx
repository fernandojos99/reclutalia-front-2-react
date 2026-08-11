/**
 * El anuncio de la vacante: es la PRIMERA pantalla del proceso y se edita sobre sí misma.
 *
 * Antes había que confirmar cuatro bloques y pasar por el dictado para llegar aquí, y la edición
 * vivía en una pestaña aparte que duplicaba la estructura. Ahora cada sección tiene su botón de
 * lápiz y guarda por separado: lo que se ve editando es exactamente lo que verá el candidato.
 *
 * Como cada sección guarda sola, cancelar con cambios sin guardar los perdería en silencio; de ahí
 * la confirmación de `ConfirmarModal`.
 */
import { useState, type ReactNode } from "react";
import {
  MapPin, Clock, CheckCircle2, ShieldCheck, Sparkles, Plus, Trash2, Pencil, List, Mic, Loader2, X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chip } from "../../common/Chip";
import { ConfirmarModal } from "../../common/ConfirmarModal";
import { PerfilResumen } from "./PerfilResumen";
import { SkillsEditor } from "./SkillsEditor";
import { ExplicarIAModal } from "./ExplicarIAModal";
import { sueldoMensual, OFRECEMOS } from "../../../constants/paqueteVacante";
import {
  recortarDescripcion, leerObjetivo, escribirObjetivo, leerFunciones, escribirFunciones,
} from "../../../utils/publicacion";
import { titulosSugeridos } from "../../../utils/tituloIA";
import { disciplinaDeTitulo } from "../../../utils/perfilIA";
import {
  CIUDADES, DISCIPLINAS, DISCIPLINA_DE_AREA, MODALIDADES, TIPOS_VACANTE, TURNOS,
  TURNO_PERSONALIZADO, type Disciplina,
} from "../../../constants/catalogos";
import { money } from "../../../utils/format";
import type { Requisito } from "../../../types/models/domain";

/** Secciones que se pueden editar por separado. Solo una a la vez. */
type Seccion = "hero" | "perfil" | "requisitos";

/** Duración de la animación de "Generar y guardar" (simulación, como el resto del demo). */
const MS_GENERANDO = 1900;

/**
 * Lista de bullets editables. Reemplaza al alta/baja de funciones de una en una.
 *
 * Va FUERA del componente a propósito: definida dentro, React la trataría como un tipo nuevo en
 * cada render y remontaría los `textarea`, con lo que el foco se perdería en cada tecla.
 */
function Bullets({ label, items, onChange }: { label: string; items: string[]; onChange: (xs: string[]) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      {items.map((x, i) => (
        <div className="fn-fila" key={i}>
          <textarea rows={2} value={x} onChange={(e) => onChange(items.map((y, k) => (k === i ? e.target.value : y)))} />
          <button type="button" className="btn ghost sm" title="Quitar"
            onClick={() => onChange(items.filter((_, k) => k !== i))}><Trash2 size={13} /></button>
        </div>
      ))}
      <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => onChange([...items, ""])}>
        <Plus size={13} /> Añadir
      </button>
    </div>
  );
}

interface Props {
  req: Requisito;
  /** Campos que resaltar como recién propuestos (dictado por voz). */
  destacados?: string[];
  acciones: ReactNode;
  /** Persiste la sección editada. Debe resolver antes de que se cierre la edición. */
  onGuardar: (r: Requisito) => Promise<void>;
  onAbrirDetalle: () => void;
  /** Pide al backend que la IA clasifique el puesto. Devuelve la disciplina, o nada si falló. */
  onClasificar?: () => Promise<string | undefined>;
  /** Con cambios pendientes ante el admin no se edita nada: se resolverían en falso. */
  bloqueado?: boolean;
}

/** Etiqueta válida o nada: lo que venga de la red o de la BD no se cree sin comprobar. */
const comoDisciplina = (x?: string): Disciplina | undefined => DISCIPLINAS.find((d) => d === x);

export function PasoPublicacion({
  req, destacados, acciones, onGuardar, onAbrirDetalle, onClasificar, bloqueado = false,
}: Props) {
  const [editando, setEditando] = useState<Seccion | null>(null);
  const [borrador, setBorrador] = useState<Requisito | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [explicando, setExplicando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  /**
   * El sueldo se teclea como texto, aparte del borrador.
   *
   * Hace falta porque escribir un importe pasa por estados intermedios inválidos ("1", "12", "120"):
   * si el input leyera del borrador y este solo aceptara valores dentro del rango, cada tecla
   * revertiría lo escrito.
   */
  const [sueldoTxt, setSueldoTxt] = useState("");
  /** Disciplina que devolvió la IA en esta sesión; `req.disciplina` ya la trae si se guardó antes. */
  const [discIA, setDiscIA] = useState<Disciplina | undefined>();
  const [clasificando, setClasificando] = useState(false);
  const [preguntado, setPreguntado] = useState(false);

  // El borrador es una copia completa del requisito, así que las secciones que no se están
  // editando se pintan igual desde él y la vista previa refleja los cambios al vuelo.
  const r = borrador ?? req;
  const sucio = borrador !== null && JSON.stringify(borrador) !== JSON.stringify(req);
  const objetivo = leerObjetivo(r.descripcion);
  const funciones = leerFunciones(r.descripcion);

  // Solo bloquea al editar la caja oscura; en las otras secciones el sueldo ni se toca.
  const sueldoValido = editando !== "hero"
    || (/^\d+$/.test(sueldoTxt) && Number(sueldoTxt) >= req.salarioMin && Number(sueldoTxt) <= req.salarioMax);

  /**
   * Disciplina del puesto, por orden de coste: diccionario de títulos (gratis) → lo que la IA ya
   * clasificó y quedó guardado → lo que acaba de contestar → el área funcional como respaldo.
   * Si nada responde, `SkillsEditor` enseña el catálogo completo.
   */
  const disciplina: Disciplina | undefined =
    disciplinaDeTitulo(req.titulo)
    ?? comoDisciplina(req.disciplina)
    ?? discIA
    ?? comoDisciplina(DISCIPLINA_DE_AREA[req.area]);

  /** Solo se molesta al modelo si ni el título ni la BD dan la respuesta, y una única vez. */
  const asegurarDisciplina = async () => {
    if (preguntado || !onClasificar) return;
    if (disciplinaDeTitulo(req.titulo) || comoDisciplina(req.disciplina)) return;
    setPreguntado(true);
    setClasificando(true);
    try {
      setDiscIA(comoDisciplina(await onClasificar()));
    } finally {
      setClasificando(false);
    }
  };

  const abrir = (s: Seccion) => {
    setBorrador({ ...req });
    setSueldoTxt(String(sueldoMensual(req)));
    setEditando(s);
    if (s === "requisitos") void asegurarDisciplina();
  };
  const cerrar = () => { setEditando(null); setBorrador(null); setConfirmando(false); };
  const pedirCancelar = () => (sucio ? setConfirmando(true) : cerrar());
  const cambiar = (cambios: Partial<Requisito>) => setBorrador((b) => (b ? { ...b, ...cambios } : b));

  const guardar = async () => {
    if (!borrador) return;
    setGuardando(true);
    try {
      await onGuardar(borrador);
      cerrar();
    } finally {
      setGuardando(false);
      setGenerando(false);
    }
  };

  // "Generar y guardar": la IA simula que mejora y valida la redacción antes de persistir.
  const generarYGuardar = () => {
    setGenerando(true);
    window.setTimeout(() => void guardar(), MS_GENERANDO);
  };

  /** Cabecera de sección con su botón de lápiz. Es una función, no un componente: no monta nada. */
  const cabecera = (titulo: string, sec: Seccion) => (
    <div className="pub-sec-head">
      <h4 className="pub-h">{titulo}</h4>
      {editando === null && !bloqueado && (
        <button type="button" className="btn ghost sm" onClick={() => abrir(sec)}>
          <Pencil size={13} /> Editar
        </button>
      )}
    </div>
  );

  const accionesSeccion = (extra?: ReactNode) => (
    <div className="paso-acciones">
      {extra}
      <button type="button" className="btn ghost" disabled={guardando || generando} onClick={pedirCancelar}>
        Cancelar
      </button>
    </div>
  );

  return (
    <div>
      <div className="pub-hero">
        <div className="pub-hero-acciones">
          <button type="button" className="btn ghost sm" disabled={bloqueado || (editando !== null && editando !== "hero")}
            onClick={() => (editando === "hero" ? pedirCancelar() : abrir("hero"))}>
            {editando === "hero" ? <><X size={13} /> Cerrar</> : <><Pencil size={13} /> Editar</>}
          </button>
          <button type="button" className="btn ghost sm" onClick={onAbrirDetalle}>
            <List size={13} /> Detalles de caja
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <h2>{r.tituloPublicacion || r.titulo}</h2>
          {r.tipoVacante === "Confidencial" && <Chip tone="gold" icon={ShieldCheck}>Confidencial</Chip>}
        </div>

        {/* El sueldo se puede ocultar: esto es lo que ve el candidato. */}
        {!r.sueldoOculto && (
          <div className="pub-sueldo">{money(sueldoMensual(r))} <span style={{ fontSize: 13, fontWeight: 600, color: "#C9C9C9" }}>mensual bruto</span></div>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <Chip icon={MapPin}>{r.ubicacionTrabajo} · {r.modalidad}</Chip>
          <Chip icon={Clock}>{r.turno || "Turno Mixto"}</Chip>
          {r.turno === TURNO_PERSONALIZADO && r.horario && <Chip icon={Clock}>{r.horario}</Chip>}
          {r.turno === TURNO_PERSONALIZADO && r.dias.length > 0 && <Chip>{r.dias.join(" · ")}</Chip>}
          <Chip>{r.expNoRelevante ? "Experiencia no relevante" : `${r.anosExp}+ años de experiencia`}</Chip>
        </div>

        {editando === "hero" && (
          <div className="pub-edit-hero">
            <div className="field">
              <label>Título de la publicación</label>
              {/* El original del administrador siempre encabeza la lista y nunca se pierde:
                  vive en `titulo`, mientras que aquí se escribe `tituloPublicacion`. */}
              <select value={r.tituloPublicacion || req.titulo}
                onChange={(e) => cambiar({ tituloPublicacion: e.target.value })}>
                <option value={req.titulo}>{req.titulo}</option>
                {titulosSugeridos(req.titulo, req.area).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="pub-edit-hint"><Sparkles size={12} /> Opciones sugeridas por IA</div>
            </div>

            <div className="field">
              <label>Sueldo mensual bruto</label>
              {/* Texto y no número acotado: antes se recortaba al rango en cada tecla, así que
                  borrar un cero de "12000" daba "1200", caía bajo el mínimo y saltaba a él. Era
                  imposible teclear un importe nuevo. Ahora se respeta lo escrito y solo se avisa;
                  el rango lo defiende "Guardar", que se deshabilita mientras no cuadre. */}
              <input type="text" inputMode="numeric" value={sueldoTxt}
                className={sueldoValido ? undefined : "input-err"}
                aria-invalid={!sueldoValido}
                onChange={(e) => {
                  const txt = e.target.value.replace(/[^\d]/g, "");
                  setSueldoTxt(txt);
                  const n = Number(txt);
                  if (txt && n >= r.salarioMin && n <= r.salarioMax) cambiar({ sueldo: n });
                }} />
              <div className={"pub-edit-hint" + (sueldoValido ? "" : " err")}>
                {sueldoValido
                  ? `Rango aprobado: ${money(r.salarioMin)} – ${money(r.salarioMax)}`
                  : `Fuera del rango aprobado (${money(r.salarioMin)} – ${money(r.salarioMax)})`}
              </div>
            </div>

            <div className="field">
              <label>Experiencia mínima</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input type="number" min={0} max={40} step={1} style={{ maxWidth: 110 }}
                  value={r.anosExp} disabled={r.expNoRelevante}
                  onChange={(e) => cambiar({ anosExp: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} />
                <span className="pub-edit-hint" style={{ margin: 0 }}>años</span>
                <label className="chk-inline pub-auto" style={{ marginLeft: 4 }}>
                  <input type="checkbox" checked={r.expNoRelevante}
                    onChange={(e) => cambiar({ expNoRelevante: e.target.checked })} />
                  {" "}La experiencia no es relevante para este puesto
                </label>
              </div>
            </div>

            <div className="field">
              <label>Tipo de vacante</label>
              <div className="tagpick">
                {TIPOS_VACANTE.map((t) => (
                  <button type="button" key={t} className={"tag" + (r.tipoVacante === t ? " on" : "")}
                    // Al salir de "Confidencial" el sueldo vuelve a mostrarse: ocultarlo solo tiene
                    // sentido en ese tipo, y dejarlo oculto sería un ajuste invisible.
                    onClick={() => cambiar({ tipoVacante: t, ...(t === "Confidencial" ? {} : { sueldoOculto: false }) })}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {r.tipoVacante === "Confidencial" && (
              <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ marginBottom: 0 }}>Visibilidad del sueldo</label>
                <button type="button" role="switch" aria-checked={!r.sueldoOculto}
                  className={"switch" + (r.sueldoOculto ? "" : " on")}
                  onClick={() => cambiar({ sueldoOculto: !r.sueldoOculto })}><i /></button>
                <span className="pub-edit-hint" style={{ margin: 0 }}>
                  {r.sueldoOculto ? "Oculto para los candidatos" : "Visible para los candidatos"}
                </span>
              </div>
            )}

            <div className="grid2">
              <div className="field">
                <label>Ciudad</label>
                <select value={r.ubicacionTrabajo} onChange={(e) => cambiar({ ubicacionTrabajo: e.target.value })}>
                  {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Modalidad</label>
                <select value={r.modalidad} onChange={(e) => cambiar({ modalidad: e.target.value })}>
                  {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Turno</label>
              <select value={r.turno || "Turno Mixto"} onChange={(e) => cambiar({ turno: e.target.value })}>
                {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {r.turno === TURNO_PERSONALIZADO && (
              <div className="field">
                <label>Horario</label>
                <input value={r.horario} placeholder="09:00 a 18:00"
                  onChange={(e) => cambiar({ horario: e.target.value })} />
              </div>
            )}

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="chk-inline pub-auto">
                <input type="checkbox" checked={r.busquedaAutomatica}
                  onChange={(e) => cambiar({ busquedaAutomatica: e.target.checked })} />
                {" "}Buscar candidatos automáticamente con esta publicación cada vez que se libere la vacante.
              </label>
            </div>

            {accionesSeccion(
              <button type="button" className="btn gold" disabled={guardando || !sueldoValido}
                title={sueldoValido ? undefined : "El sueldo está fuera del rango aprobado"}
                onClick={() => void guardar()}>
                {guardando ? "Guardando…" : "Guardar"}
              </button>,
            )}
          </div>
        )}
      </div>

      {/* Las tres secciones van pegadas, formando un bloque continuo. */}
      <div className="pub-bloques">
        <section className="pub-bloque">
          {cabecera("Perfil", "perfil")}
          {generando ? (
            <div className="proc-wrap">
              <Loader2 size={40} className="ai-spin" />
              <div className="ai-search-msg">La IA está mejorando y validando tu descripción…</div>
            </div>
          ) : editando === "perfil" ? (
            <>
              <Bullets label="Objetivo del puesto" items={objetivo}
                onChange={(xs) => cambiar({ descripcion: escribirObjetivo(r.descripcion, xs) })} />
              <Bullets label="Funciones principales" items={funciones}
                onChange={(xs) => cambiar({ descripcion: escribirFunciones(r.descripcion, xs) })} />
              {accionesSeccion(
                <>
                  <button type="button" className="btn ai" disabled={guardando} onClick={generarYGuardar}>
                    <Sparkles size={15} /> {guardando ? "Guardando…" : "Generar y guardar"}
                  </button>
                  <button type="button" className="btn ai-soft" onClick={() => setExplicando(true)}>
                    <Mic size={15} /> Explicar con IA
                  </button>
                </>,
              )}
            </>
          ) : (
            r.descripcion && (
              <div className="desc-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{recortarDescripcion(r.descripcion)}</ReactMarkdown>
              </div>
            )
          )}
        </section>

        <section className="pub-bloque">
          {cabecera("Requisitos", "requisitos")}
          {editando === "requisitos" ? (
            <>
              <SkillsEditor req={r} onCambiarReq={(nr) => setBorrador(nr)}
                disciplina={disciplina} clasificando={clasificando} />
              {accionesSeccion(
                <button type="button" className="btn gold" disabled={guardando} onClick={() => void guardar()}>
                  {guardando ? "Guardando…" : "Guardar"}
                </button>,
              )}
            </>
          ) : (
            <PerfilResumen req={r} destacados={destacados} />
          )}
        </section>

        <section className="pub-bloque">
          <h4 className="pub-h">Lo que ofrecemos</h4>
          <ul className="ofrece-lista">
            {OFRECEMOS.map((x) => (
              <li key={x.titulo}>
                <CheckCircle2 size={14} />
                <span><b>{x.titulo}</b>{x.detalle ? `: ${x.detalle}` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="paso-acciones">{acciones}</div>

      {explicando && borrador && (
        <ExplicarIAModal
          req={borrador}
          onCerrar={() => setExplicando(false)}
          onAplicar={(obj, fns) => {
            // Se encadenan las dos escrituras sobre el mismo markdown, no sobre `r.descripcion`,
            // o la segunda pisaría a la primera.
            const md = escribirFunciones(escribirObjetivo(borrador.descripcion, obj), fns);
            cambiar({ descripcion: md });
            setExplicando(false);
          }}
        />
      )}

      {confirmando && (
        <ConfirmarModal
          titulo="¿Cancelar la edición?"
          mensaje="Hiciste cambios que aún no se han guardado. Si cancelas ahora, se perderán."
          onConfirmar={cerrar}
          onCerrar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}
