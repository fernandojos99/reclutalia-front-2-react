/**
 * "Revisar publicación" (/formador/vacante/:vacId/revisar).
 *
 * Es la PRIMERA pantalla del proceso: se entra directo a la vista previa del anuncio, sin nada que
 * pre-aprobar. Antes había dos secciones ("Vacante" y "Publicación") y cuatro bloques que confirmar
 * uno a uno para desbloquear la publicación; todo ese contenido vive ahora en el panel lateral
 * "Detalle de caja", como consulta y no como trámite.
 *
 * Cada sección del anuncio guarda por su cuenta (`PasoPublicacion` → `onGuardar`), así que aquí ya
 * no hay borrador global: lo que se ve en pantalla es lo que está persistido.
 */
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, PauseCircle, PlayCircle, Rocket, Users } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { CambiosResumen } from "../../components/common/CambiosResumen";
import { PasoPublicacion } from "../../components/formador/revisar/PasoPublicacion";
import { DetalleCaja } from "../../components/formador/revisar/DetalleCaja";
import { BusquedaIAOverlay } from "../../components/formador/poolModals";
import { CAMPOS_DESC } from "../../constants/catalogos";
import type { Requisito } from "../../types/models/domain";

export function RevisarVacantePage() {
  const { vacId = "" } = useParams();
  const { vacantes, actions } = useData();
  const { toast } = useDemo();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [pausando, setPausando] = useState(false);

  const v = vacantes.find((x) => x.id === vacId);
  if (!v) return <p>Cargando vacante…</p>;

  const req = v.req;
  const publicada = v.estado === "abierta" || v.estado === "cerrada";
  // Con cambios pendientes ante el admin no se toca nada: se resolverían en falso.
  const bloqueado = v.estado === "cambios";
  const solicitudes = (v.solicitudes ?? []).filter((s) => s.estado === "pendiente");

  /**
   * Pausar guarda YA, sin esperar a publicar (el backend lo permite: `editar()` no mira el estado).
   */
  const alternarPausa = async () => {
    const pausada = !req.pausada;
    setPausando(true);
    try {
      await actions.editarVacante(v.id, { ...req, pausada });
      toast(pausada ? "Vacante pausada · no se reclutará hasta reanudarla" : "Vacante reanudada");
    } catch (e) {
      toast("No se pudo cambiar la pausa: " + (e as Error).message);
    } finally {
      setPausando(false);
    }
  };

  const guardarSeccion = async (r: Requisito) => {
    try {
      await actions.editarVacante(v.id, r);
      toast(publicada ? "Publicación actualizada · se recalculó el Marketplace" : "Cambios guardados");
    } catch (e) {
      toast("No se pudo guardar: " + (e as Error).message);
      throw e; // que la sección no se cierre como si hubiera guardado
    }
  };

  /** Publicar arranca la animación; el alta real ocurre en `onDone`, al terminarla. */
  const publicar = () => {
    if (publicada) { navigate(`/formador/vacante/${v.id}?tab=1`); return; }
    setPublicando(true);
    setBuscando(true);
  };

  const acciones = (
    <button type="button" className="btn gold"
      disabled={publicando || bloqueado || solicitudes.length > 0}
      title={solicitudes.length ? "Hay solicitudes pendientes de aprobación del administrador" : undefined}
      onClick={publicar}>
      {publicada ? <Users size={16} /> : <Rocket size={16} />}{" "}
      {publicada ? "Ver el Marketplace de talento" : publicando ? "Publicando…" : "Publicar y buscar candidatos"}
    </button>
  );

  return (
    <div>
      <Link className="crumb" to="/formador" style={{ display: "inline-block", marginBottom: 12 }}>← Volver a mis vacantes</Link>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 18 }}>{req.tituloPublicacion || req.titulo}</h2>
          <Chip>{v.id}</Chip>
          {publicada
            ? <Chip tone="ok" icon={CheckCircle2}>Ya publicada</Chip>
            : <Chip tone="gold">Pendiente de publicar</Chip>}
          {req.pausada && <Chip icon={PauseCircle}>Pausada</Chip>}
          <button
            type="button"
            className={"btn sm " + (req.pausada ? "gold" : "ghost")}
            style={{ marginLeft: "auto" }}
            disabled={pausando || bloqueado}
            title={bloqueado ? "Hay cambios pendientes de resolver por el administrador" : undefined}
            onClick={() => void alternarPausa()}
          >
            {req.pausada ? <><PlayCircle size={14} /> Reanudar vacante</> : <><PauseCircle size={14} /> Pausar vacante</>}
          </button>
        </div>
      </div>

      {bloqueado && (
        <div className="card" style={{ background: "var(--gold-soft)", borderColor: "#F0D9A5", marginBottom: 16 }}>
          <b style={{ fontSize: 13.5 }}><Clock size={14} style={{ verticalAlign: -2 }} /> Cambios enviados al administrador</b>
          <CambiosResumen cambios={v.cambios} />
          <p className="help">Mientras el administrador no los resuelva, esta vacante no se puede editar ni publicar.</p>
        </div>
      )}

      {solicitudes.length > 0 && (
        <div className="card" style={{ background: "var(--gold-soft)", borderColor: "#F0D9A5", marginBottom: 16 }}>
          <b style={{ fontSize: 13.5 }}><Clock size={14} style={{ verticalAlign: -2 }} /> Solicitudes esperando al administrador</b>
          <ul className="ofrece-lista" style={{ marginTop: 8 }}>
            {solicitudes.map((s) => (
              <li key={s.id}>
                <Clock size={14} />
                <span>{CAMPOS_DESC[s.tipo === "formador" ? "formadorId" : "centroCostos"]}: «{s.valorPrevio}» → «{s.valor}»</span>
              </li>
            ))}
          </ul>
          <p className="help">La vacante no se puede publicar hasta que concluyan.</p>
        </div>
      )}

      <PasoPublicacion
        req={req}
        acciones={acciones}
        bloqueado={bloqueado}
        onGuardar={guardarSeccion}
        onAbrirDetalle={() => setDetalle(true)}
      />

      {detalle && <DetalleCaja v={v} onCerrar={() => setDetalle(false)} />}

      {buscando && (
        <BusquedaIAOverlay
          onDone={() => {
            setBuscando(false);
            void (async () => {
              try {
                await actions.aprobarVacante(v.id);
                toast("Vacante publicada · la IA armó tu Marketplace de talento");
                navigate(`/formador/vacante/${v.id}?tab=1`);
              } catch (e) {
                toast("No se pudo publicar: " + (e as Error).message);
                setPublicando(false);
              }
            })();
          }}
        />
      )}
    </div>
  );
}
