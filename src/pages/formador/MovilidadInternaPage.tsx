/**
 * Formador · Movilidad interna. Una sola pantalla, de arriba abajo:
 *
 *   1. Recomendación de IA — cuántas vacantes conviene activar para no quedarse corto de plantilla.
 *   2. Métricas que además filtran la tabla al pulsarlas.
 *   3. La tabla del equipo.
 *
 * El equipo son los candidatos INTERNOS cuyo `formadorId` es el del formador activo: la relación ya
 * existía en los datos, no hizo falta inventar nada.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { PerfilModal } from "../../components/candidato/PerfilModal";
import { CompartirModal } from "../../components/formador/poolModals";
import { TablaEquipo } from "../../components/movilidad/TablaEquipo";
import { AgradecerModal } from "../../components/movilidad/AgradecerModal";
import { ProcesoMovilidadModal } from "../../components/movilidad/ProcesoMovilidadModal";
import { agradecerColaborador, barrerInactivos } from "../../services/movilidadAgenteService";
import {
  accionRecomendada, enMovilidad, estatusMovilidad,
  type AccionRecomendada, type EstadoMovilidad,
} from "../../utils/movilidad";
import { ACCIONES_RECOMENDADAS, ESTADOS_MOVILIDAD } from "../../constants/catalogos";
import type { Candidato } from "../../types/models/domain";

/** Filtro activo: se guarda qué se pulsó y de qué columna, porque los dos grupos son excluyentes. */
type Filtro = { tipo: "estatus"; valor: EstadoMovilidad } | { tipo: "accion"; valor: AccionRecomendada } | null;

function Metrica({ etiqueta, n, activo, onClick }: {
  etiqueta: string; n: number; activo: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!n && !activo}
      className={"tag" + (activo ? " on" : "")}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: !n && !activo ? 0.45 : 1 }}
      title={n ? `Filtrar por "${etiqueta}"` : "Nadie en este estado"}
    >
      {etiqueta} <b>{n}</b>
      {activo && <X size={11} />}
    </button>
  );
}

export function MovilidadInternaPage() {
  const { candidatos, vacantes, formadores, reload } = useData();
  const { formadorId, toast } = useDemo();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Candidato | null>(null);
  const [proceso, setProceso] = useState<Candidato | null>(null);
  const [recomendar, setRecomendar] = useState<Candidato | null>(null);
  const [agradecer, setAgradecer] = useState<Candidato | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>(null);

  const equipo = useMemo(
    () => candidatos.filter((c) => c.tipo === "interno" && c.formadorId === formadorId),
    [candidatos, formadorId],
  );

  /**
   * "Inactivo" es el único estatus al que se llega sin que nadie haga nada, solo por el paso del
   * tiempo, así que ningún evento del backend puede detectarlo: se comprueba al abrir la pantalla.
   */
  useEffect(() => {
    if (formadorId) void barrerInactivos(formadorId);
  }, [formadorId]);

  const estatusDe = (c: Candidato) => estatusMovilidad(c, vacantes);
  const accionDe = (c: Candidato) => accionRecomendada(c, vacantes);

  const cuentaEstatus = (e: EstadoMovilidad) => equipo.filter((c) => estatusDe(c) === e).length;
  const cuentaAccion = (a: AccionRecomendada) => equipo.filter((c) => accionDe(c) === a).length;

  const filtrado = equipo.filter((c) =>
    !filtro || (filtro.tipo === "estatus" ? estatusDe(c) === filtro.valor : accionDe(c) === filtro.valor));

  /**
   * Vacantes que conviene ir activando: quien ya está en movimiento (dejará su puesto) más quien
   * tiene recomendación de desvincular. Es la cuenta de huecos que el formador va a tener.
   */
  const enMovimiento = equipo.filter((c) => ["En proceso", "Seleccionado", "Contratado"].includes(estatusDe(c)));
  const aDesvincular = equipo.filter((c) => accionDe(c) === "Desvincular");
  const preventivas = enMovimiento.length + aDesvincular.length;

  const enProcesoMovilidad = enMovilidad(equipo);
  const vacanteDe = (c: Candidato) => vacantes.find((v) => v.id === c.movilidadActivaVacId);

  const alternar = (f: NonNullable<Filtro>) =>
    setFiltro((actual) =>
      actual && actual.tipo === f.tipo && actual.valor === f.valor ? null : f);

  const enviarAgradecimiento = async (mensaje: string, resumen: string) => {
    if (!agradecer) return;
    setEnviando(true);
    try {
      await agradecerColaborador(agradecer.id, formadorId, mensaje, resumen);
      await reload();
      setAgradecer(null);
      toast("Mensaje enviado y resumen guardado en su historial");
    } catch (e) {
      toast("No se pudo enviar: " + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (!equipo.length) {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
        Todavía no tienes colaboradores internos a tu cargo.
      </div>
    );
  }

  return (
    <div>
      {/* Avisos de procesos abiertos: al pulsarlos se abre la ventana de sucesión. */}
      {enProcesoMovilidad.map((c) => (
        <button key={c.id} type="button" onClick={() => setProceso(c)} className="card"
          style={{
            display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left",
            marginBottom: 12, background: "var(--gold-soft)", borderColor: "#F0D9A5", cursor: "pointer",
          }}>
          <AlertCircle size={18} color="var(--gold-dark)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, flex: 1 }}>
            <b>{c.nombre}</b> está en un proceso de movilidad
            {vacanteDe(c) ? ` hacia "${vacanteDe(c)!.req.titulo}"` : ""}. Revisa quién podría cubrir su puesto.
          </div>
          <ChevronRight size={16} color="var(--gold-dark)" />
        </button>
      ))}

      {/* 1 · Recomendación de IA */}
      <div className="card" style={{ marginBottom: 14, background: "var(--ai-soft)", borderColor: "#C7CBF5" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Sparkles size={18} color="var(--ai)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <b style={{ fontSize: 14 }}>
              {preventivas
                ? `Conviene activar ${preventivas} ${preventivas === 1 ? "vacante preventiva" : "vacantes preventivas"} pronto`
                : "Tu plantilla está estable"}
            </b>
            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.55, marginTop: 4 }}>
              {preventivas ? (
                <>
                  {enMovimiento.length > 0 && `${enMovimiento.length} ${enMovimiento.length === 1 ? "colaborador está" : "colaboradores están"} en un proceso de movilidad`}
                  {enMovimiento.length > 0 && aDesvincular.length > 0 && " y "}
                  {aDesvincular.length > 0 && `${aDesvincular.length} ${aDesvincular.length === 1 ? "tiene" : "tienen"} recomendación de desvinculación`}
                  . Adelántate abriendo las posiciones antes de que queden los huecos.
                </>
              ) : (
                "Nadie de tu equipo está en un proceso de salida ni tiene recomendación de desvinculación."
              )}
            </div>
          </div>
          <button className="btn dark sm" onClick={() => navigate("/formador")}>
            Revisar vacantes preventivas
          </button>
        </div>
      </div>

      {/* 2 · Métricas que filtran */}
      <div className="card" style={{ marginBottom: 14 }}>
        <label>Estatus del equipo</label>
        <div className="tagpick" style={{ marginTop: 6 }}>
          {ESTADOS_MOVILIDAD.map((e) => (
            <Metrica key={e} etiqueta={e} n={cuentaEstatus(e)}
              activo={filtro?.tipo === "estatus" && filtro.valor === e}
              onClick={() => alternar({ tipo: "estatus", valor: e })} />
          ))}
        </div>
        <label style={{ marginTop: 14, display: "block" }}>Acción recomendada</label>
        <div className="tagpick" style={{ marginTop: 6 }}>
          {ACCIONES_RECOMENDADAS.map((a) => (
            <Metrica key={a} etiqueta={a} n={cuentaAccion(a)}
              activo={filtro?.tipo === "accion" && filtro.valor === a}
              onClick={() => alternar({ tipo: "accion", valor: a })} />
          ))}
        </div>
        {filtro && (
          <div className="help" style={{ marginTop: 10 }}>
            Mostrando {filtrado.length} de {equipo.length} colaboradores · pulsa de nuevo el filtro para quitarlo.
          </div>
        )}
      </div>

      {/* 3 · La tabla */}
      <TablaEquipo equipo={filtrado} vacantes={vacantes}
        onVerPerfil={setPerfil} onRecomendar={setRecomendar} onAgradecer={setAgradecer} />

      {proceso && (
        <ProcesoMovilidadModal cand={proceso} vacante={vacanteDe(proceso)} candidatos={candidatos}
          onVerFicha={setPerfil} onClose={() => setProceso(null)} />
      )}
      {perfil && (
        <PerfilModal cand={perfil} onClose={() => setPerfil(null)}
          formadores={formadores} formadorActual={formadorId} />
      )}
      {recomendar && (
        <CompartirModal cand={recomendar}
          onEnviar={(dest) => { toast(`Perfil de ${recomendar.nombre.split(" ")[0]} compartido con ${dest} (simulado)`); setRecomendar(null); }}
          onClose={() => setRecomendar(null)} />
      )}
      {agradecer && (
        <AgradecerModal cand={agradecer} enviando={enviando}
          onEnviar={(m, r) => { void enviarAgradecimiento(m, r); }}
          onClose={() => { if (!enviando) setAgradecer(null); }} />
      )}
    </div>
  );
}
