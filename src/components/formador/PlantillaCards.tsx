/**
 * Organigrama del equipo del formador: él encabeza el árbol y de él cuelgan sus posiciones.
 * Si la posición ya tiene candidato elegido muestra a la persona; si no, sale como "Disponible"
 * con el acceso al proceso o a la revisión del perfil.
 *
 * Todo se DERIVA de las vacantes reales (`useData()`), no hay estado ni endpoint nuevo.
 * Los conectores del árbol son pseudo-elementos CSS (ver `.org-*` en base.css), sin SVG.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Clock, Users, Minus, Plus, RotateCcw, PauseCircle, FileText, ChevronUp, ChevronDown,
} from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Avatar } from "../common/Avatar";
import { Chip } from "../common/Chip";
import { Modal } from "../common/Modal";
import { BusquedaIAOverlay } from "./poolModals";
import { matchScore } from "../../utils/match";
import { diasActivaLabel } from "../../utils/format";
import { fotoDe, numeroEmpleado } from "../../constants/personas";
import type { Candidato, Formador, Vacante } from "../../types/models/domain";

/**
 * Estados en los que la posición ya se considera CUBIERTA.
 *
 * Solo `contratado`: mientras la contratación siga en curso (seleccionado, documentos, oferta) la
 * posición todavía puede caerse, así que la tarjeta debe seguir invitando a continuar el proceso
 * y no adelantar el nombre ni la foto de alguien que aún no ha firmado.
 */
const OCUPADA = ["contratado"];

/** Umbral del pool en el backend (`buildPool`): un candidato es viable a partir de 28. */
const MATCH_MIN = 28;

/** Número de empleado del formador que encabeza el organigrama (dato de demo). */
const NUM_EMPLEADO_FORMADOR = "112687";

const ZOOM_MIN = 0.6, ZOOM_MAX = 1.6, ZOOM_PASO = 0.1;

export function PlantillaCards({ vacantes, formador }: { vacantes: Vacante[]; formador?: Formador }) {
  const { candidatos, actions } = useData();
  const { toast } = useDemo();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);
  /** Vacante cuyo "¿Comenzar búsqueda?" está abierto. */
  const [preguntando, setPreguntando] = useState<Vacante | null>(null);
  /** Vacante que se está publicando con la animación de la IA. */
  const [buscando, setBuscando] = useState<Vacante | null>(null);

  const revisar = (v: Vacante) => navigate(`/formador/vacante/${v.id}/revisar`);

  const ajustar = (d: number) =>
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + d) * 10) / 10)));

  /** Persona que ocupa la posición, si la hay. */
  const ocupante = (v: Vacante): Candidato | undefined => {
    const cid = Object.entries(v.pipeline || {}).find(([, p]) => OCUPADA.includes(p.estado))?.[0];
    return cid ? candidatos.find((c) => c.id === Number(cid)) : undefined;
  };

  /**
   * Candidatos viables. Si la vacante ya se publicó, la cifra es el pool real que armó el backend
   * (aunque venga vacío) para que coincida con lo que se ve al entrar al Marketplace. Si todavía
   * no se publica no hay Marketplace, así que se ESTIMA aquí con el mismo `matchScore` y el mismo
   * umbral que `buildPool` (espejo front↔back) y se etiqueta como estimación.
   */
  const viables = (v: Vacante): { n: number; estimado: boolean } =>
    v.estado === "abierta" || v.estado === "cerrada"
      ? { n: v.pool?.length ?? 0, estimado: false }
      : { n: candidatos.filter((c) => matchScore(c, v.req) >= MATCH_MIN).length, estimado: true };

  if (!vacantes.length) return null;

  return (
    <div className="org-caja">
      <div className="org-barra">
        <b style={{ fontSize: 13.5 }}>Organigrama</b>
        <div className="org-zoom">
          <button type="button" className="btn ghost sm" title="Alejar"
            disabled={zoom <= ZOOM_MIN} onClick={() => ajustar(-ZOOM_PASO)}><Minus size={13} /></button>
          <span className="org-zoom-n">{Math.round(zoom * 100)}%</span>
          <button type="button" className="btn ghost sm" title="Acercar"
            disabled={zoom >= ZOOM_MAX} onClick={() => ajustar(ZOOM_PASO)}><Plus size={13} /></button>
          <button type="button" className="btn ghost sm" title="Restablecer"
            disabled={zoom === 1} onClick={() => setZoom(1)}><RotateCcw size={13} /></button>
        </div>
      </div>

      {/* `zoom` (y no `transform: scale`) porque sí participa en el layout: las barras de scroll
          internas salen correctas solas y el zoom queda confinado a este visor. */}
      <div className="org-visor">
        <div className="org" style={{ zoom }}>
          {/* Decorativas: insinúan que el organigrama sigue hacia arriba y hacia abajo. No hacen
              nada (ni clic ni foco), así que van como texto y no como botón. */}
          {formador && <div className="org-linea"><ChevronUp size={14} /> Ver línea superior</div>}
          {formador && (
        <div className="org-jefe">
          <div className="plant-card org-card-jefe">
            <div className="plant-nom">
              <Avatar nombre={formador.nombre} foto={fotoDe(formador.id)} />
              <div style={{ minWidth: 0 }}>
                <b>{formador.nombre}</b>
                <div className="org-num">No. {NUM_EMPLEADO_FORMADOR}</div>
              </div>
            </div>
            <div>
              <div className="plant-puesto">{formador.area}</div>
              <div className="org-posicion">{formador.puesto}</div>
            </div>
          </div>
        </div>
      )}

      <div className={"org-hijos" + (formador ? " con-jefe" : "")}>
        {vacantes.map((v) => {
          const persona = ocupante(v);
          const { n, estimado } = persona ? { n: 0, estimado: false } : viables(v);
          // Hay alguien elegido pero la contratación no ha terminado: ni disponible ni cubierta.
          const enProceso = !persona && Object.values(v.pipeline || {}).some((x) =>
            ["seleccionado", "docs_completos", "oferta_enviada", "oferta_aceptada"].includes(x.estado));
          // La pausa solo tiñe posiciones sin cubrir: una ya ocupada no está reclutando.
          const pausada = !persona && v.req.pausada;
          return (
            <div className="org-rama" key={v.id}>
              <div className={"plant-card" + (persona ? "" : " libre") + (pausada ? " pausada" : "")}>
                <div className="plant-nom">
                  {persona ? (
                    <>
                      <Avatar nombre={persona.nombre} foto={persona.foto ?? fotoDe(persona.id)} />
                      <div style={{ minWidth: 0 }}>
                        <b>{persona.nombre}</b>
                        <div className="org-num">No. {numeroEmpleado(persona.id)}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      {pausada ? <Chip icon={PauseCircle}>Pausada</Chip>
                        : enProceso ? <Chip tone="ai">En proceso</Chip>
                          : <Chip tone="gold">Disponible</Chip>}
                      {/* Antes aquí iba el enlace "Ajustar perfil", que ahora es un botón propio. */}
                      <span className="plant-ajustar"><Clock size={13} /> {diasActivaLabel(v)}</span>
                    </>
                  )}
                </div>

                <div className="plant-puesto">{v.req.tituloPublicacion || v.req.titulo}</div>

                {!persona && (
                  <button type="button" className="plant-revisar" onClick={() => revisar(v)}>
                    <FileText size={13} /> Revisar publicación
                  </button>
                )}

                {persona ? (
                  <div className="plant-viables cubierta">
                    <CheckCircle2 size={14} /> Posición cubierta
                  </div>
                ) : pausada ? (
                  <div className="plant-viables vacio">
                    <PauseCircle size={14} /> Búsqueda en pausa
                  </div>
                ) : n > 0 ? (
                  <button
                    type="button"
                    className={"plant-viables" + (enProceso ? " activo" : "")}
                    title={estimado
                      ? "Estimación sobre el marketplace; el definitivo se arma al publicar la vacante"
                      : "Ir a la etapa actual del proceso"}
                    // Sin publicar, primero se pregunta si quiere revisar el anuncio. Ya publicada,
                    // VacanteDetailPage resuelve el tab con `tabInicial(v)` y cae en la etapa viva.
                    onClick={() => (estimado ? setPreguntando(v) : navigate(`/formador/vacante/${v.id}`))}
                  >
                    <Users size={14} />
                    {estimado ? `Ver ${n} candidatos compatibles` : "Continuar proceso"}
                  </button>
                ) : (
                  <div className="plant-viables vacio">
                    <Users size={14} /> Sin candidatos por ahora
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
        <div className="org-linea"><ChevronDown size={14} /> Ver siguiente línea</div>
        </div>
      </div>

      {preguntando && (
        <Modal onClose={() => setPreguntando(null)}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>¿Comenzar búsqueda de candidatos?</h3>
          <p className="help" style={{ marginTop: 0 }}>
            Estás por comenzar la búsqueda de candidatos en el marketplace. ¿Quieres usar la
            publicación actual o prefieres revisarla antes?
          </p>
          <div className="paso-acciones">
            <button type="button" className="btn gold"
              onClick={() => { setBuscando(preguntando); setPreguntando(null); }}>
              <Users size={15} /> Continuar con actual
            </button>
            <button type="button" className="btn ghost" onClick={() => { revisar(preguntando); setPreguntando(null); }}>
              <FileText size={15} /> Revisar publicación
            </button>
          </div>
        </Modal>
      )}

      {buscando && (
        <BusquedaIAOverlay
          onDone={() => {
            const v = buscando;
            setBuscando(null);
            void (async () => {
              try {
                await actions.aprobarVacante(v.id);
                toast("Vacante publicada · la IA armó tu Marketplace de talento");
                navigate(`/formador/vacante/${v.id}?tab=1`);
              } catch (e) {
                toast("No se pudo publicar: " + (e as Error).message);
              }
            })();
          }}
        />
      )}
    </div>
  );
}
