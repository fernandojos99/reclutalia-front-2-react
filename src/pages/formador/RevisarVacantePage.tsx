/**
 * Asistente "Revisar vacante" (/formador/vacante/:vacId/revisar).
 *
 * Cuatro bloques de verificación + "Editar con voz" + la publicación. En ESCRITORIO son listas
 * desplegables (acordeón); en CELULAR son tabs de una sola palabra. La estructura cambia de verdad
 * según el dispositivo, por eso hace falta `useIsMobile()` y no basta con una media query.
 *
 * "Continuar a publicación" se esconde mientras se está dictando: solo reaparece cuando el
 * dictado ya generó su vista previa (pantalla 7 de `EditarVoz`).
 *
 * Las ediciones viven en un borrador local (`draft`) y solo se persisten al publicar:
 * `editarVacante` (si hubo cambios) + `aprobarVacante`, que es lo que construye el Marketplace.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronDown, CheckCircle2, Clock, MapPin, Mic, Rocket, Users } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Chip } from "../../components/common/Chip";
import { CambiosResumen } from "../../components/common/CambiosResumen";
import { PasoPerfil } from "../../components/formador/revisar/PasoPerfil";
import { PasoCompensacion } from "../../components/formador/revisar/PasoCompensacion";
import { PasoBeneficios } from "../../components/formador/revisar/PasoBeneficios";
import { PasoHerramientas } from "../../components/formador/revisar/PasoHerramientas";
import { PasoPublicacion } from "../../components/formador/revisar/PasoPublicacion";
import { EditarVoz } from "../../components/formador/revisar/EditarVoz";
import { sueldoMensual } from "../../constants/paqueteVacante";
import { money } from "../../utils/format";
import type { Requisito } from "../../types/models/domain";

/** Los 4 bloques a verificar. `tab` es la etiqueta de una palabra que se usa en móvil. */
const BLOQUES = [
  { tab: "Perfil", titulo: "Verifica el perfil" },
  { tab: "Compensación", titulo: "Paquete de compensación" },
  { tab: "Beneficios", titulo: "Conoce y verifica los beneficios" },
  { tab: "Herramientas", titulo: "Conoce y verifica las herramientas" },
];
// Índices de los dos bloques que NO son pasos confirmables (van fuera de BLOQUES, que define
// la longitud de `confirmados`).
const VOZ = 4;
const PUBLICACION = 5;

export function RevisarVacantePage() {
  const { vacId = "" } = useParams();
  const { vacantes, formadores, actions } = useData();
  const { toast } = useDemo();
  const navigate = useNavigate();
  const movil = useIsMobile();

  const v = vacantes.find((x) => x.id === vacId);

  const [draft, setDraft] = useState<Requisito | null>(null);
  const [abierto, setAbierto] = useState(0);
  const [confirmados, setConfirmados] = useState([false, false, false, false]);
  const [vozPaso, setVozPaso] = useState<5 | 6 | 7>(5);
  const [destacados, setDestacados] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);

  // El borrador arranca con el requisito real en cuanto llegan los datos.
  useEffect(() => { if (v && !draft) setDraft(v.req); }, [v, draft]);

  if (!v || !draft) return <p>Cargando vacante…</p>;

  const formador = formadores.find((f) => f.id === v.formadorId);
  const publicada = v.estado === "abierta" || v.estado === "cerrada";
  // Con cambios pendientes ante el admin no se toca nada: se resolverían en falso.
  const bloqueado = v.estado === "cambios";
  const listos = confirmados.every(Boolean);

  const confirmar = (i: number) => {
    setConfirmados((c) => c.map((x, k) => (k === i ? true : x)));
    // Tras el último paso se salta a publicación: el índice siguiente ya es el bloque de voz,
    // que es opcional y no debe interponerse al terminar de verificar.
    setAbierto(i + 1 === BLOQUES.length ? PUBLICACION : i + 1);
  };

  const publicar = async () => {
    if (publicada) { navigate(`/formador/vacante/${v.id}?tab=1`); return; }
    setPublicando(true);
    try {
      if (JSON.stringify(draft) !== JSON.stringify(v.req)) await actions.editarVacante(v.id, draft);
      await actions.aprobarVacante(v.id);
      toast("Vacante publicada · se está armando tu Marketplace de talento");
      navigate(`/formador/vacante/${v.id}?tab=1`);
    } catch (e) {
      toast("No se pudo publicar: " + (e as Error).message);
      setPublicando(false);
    }
  };

  /** Contenido de cada bloque. Se llama como función (no como componente) para no remontar. */
  const cuerpo = (i: number) => {
    if (i === 0) {
      return (
        <PasoPerfil
          v={v} req={draft} formadorNombre={formador?.nombre ?? v.formadorId}
          bloqueado={bloqueado} hecho={confirmados[0]} destacados={destacados}
          onCambiarReq={setDraft}
          onConfirmar={() => confirmar(0)}
          onEditarVoz={() => irA(VOZ)}
        />
      );
    }
    if (i === 1) return <PasoCompensacion req={draft} hecho={confirmados[1]} bloqueado={bloqueado} onConfirmar={() => confirmar(1)} />;
    if (i === 2) return <PasoBeneficios hecho={confirmados[2]} bloqueado={bloqueado} onConfirmar={() => confirmar(2)} />;
    if (i === 3) return <PasoHerramientas req={draft} hecho={confirmados[3]} bloqueado={bloqueado} onConfirmar={() => confirmar(3)} />;
    if (i === VOZ) {
      return (
        <EditarVoz
          req={draft}
          onPaso={setVozPaso}
          onAplicar={(r, campos) => {
            setDestacados(campos);
            setDraft(r);
            setAbierto(0);
            toast("Publicación actualizada con lo que dictaste");
          }}
          onCancelar={() => irA(-1)}
        />
      );
    }
    return (
      <PasoPublicacion
        req={draft} destacados={destacados}
        acciones={
          <>
            <button type="button" className="btn gold" disabled={publicando || bloqueado} onClick={() => void publicar()}>
              {publicada ? <Users size={16} /> : <Rocket size={16} />}{" "}
              {publicada ? "Ver el Marketplace de talento" : publicando ? "Publicando…" : "Publicar vacante"}
            </button>
            <Link className="btn ghost" to={`/formador/vacante/${v.id}`}>Ver el proceso completo</Link>
          </>
        }
      />
    );
  };

  const header = (
    <>
      <Link className="crumb" to="/formador" style={{ display: "inline-block", marginBottom: 12 }}>← Volver a mis vacantes</Link>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 18 }}>{draft.titulo}</h2>
          <Chip>{v.id}</Chip>
          {publicada
            ? <Chip tone="ok" icon={CheckCircle2}>Ya publicada</Chip>
            : <Chip tone="gold">Pendiente de publicar</Chip>}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <Chip icon={MapPin}>{draft.ubicacionTrabajo} · {draft.modalidad}</Chip>
          <Chip icon={Clock}>{draft.turno || "Turno Mixto"}</Chip>
          <Chip>{money(sueldoMensual(draft))} /mes</Chip>
        </div>
      </div>
      {bloqueado && (
        <div className="card" style={{ background: "var(--gold-soft)", borderColor: "#F0D9A5", marginBottom: 16 }}>
          <b style={{ fontSize: 13.5 }}><Clock size={14} style={{ verticalAlign: -2 }} /> Cambios enviados al administrador</b>
          <CambiosResumen cambios={v.cambios} />
          <p className="help">Mientras el administrador no los resuelva, esta vacante no se puede editar ni publicar.</p>
        </div>
      )}
    </>
  );

  // Mientras se dicta o se procesa, la publicación no se ofrece: espera a la vista previa (paso 7).
  const puedePublicar = listos && (abierto !== VOZ || vozPaso === 7);

  /**
   * Único punto para cambiar de bloque/tab. Al ENTRAR a voz hay que resetear `vozPaso` aquí y no
   * esperar al efecto de `EditarVoz`: si no, el bloque de publicación seguiría visible un render
   * con el 7 viejo y parpadearía.
   */
  const irA = (i: number) => {
    if (i === VOZ) setVozPaso(5);
    setAbierto(i);
  };
  /** Igual que `irA`, pero plegando el bloque si ya estaba abierto (acordeón de escritorio). */
  const alternarA = (i: number) => irA(abierto === i ? -1 : i);

  const tituloBloque = (i: number) =>
    i === VOZ ? "Editar con voz" : i === PUBLICACION ? "Publicación" : BLOQUES[i].titulo;

  // ── Celular: tabs de una palabra ──
  if (movil) {
    const tabs = [...BLOQUES.map((b) => b.tab), "Voz", "Publicación"];
    // En escritorio se puede colapsar todo (abierto = -1); al pasar a móvil hay que elegir un tab.
    const tab = abierto >= 0 && abierto <= PUBLICACION ? abierto : 0;
    return (
      <div>
        {header}
        <div className="tabs">
          {tabs.map((t, i) => (
            <button key={t} className={"tab" + (tab === i ? " on" : "")}
              disabled={i === PUBLICACION && !puedePublicar}
              onClick={() => irA(i)}>
              {i < BLOQUES.length && confirmados[i] ? "✓ " : ""}{t}
            </button>
          ))}
        </div>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>{tituloBloque(tab)}</h3>
        {cuerpo(tab)}
      </div>
    );
  }

  // ── Navegador: listas desplegables ──
  return (
    <div>
      {header}
      {BLOQUES.map((b, i) => (
        <div className={"rev-bloque" + (abierto === i ? " abierto" : "") + (confirmados[i] ? " hecho" : "")} key={b.tab}>
          <button type="button" className="rev-hd" aria-expanded={abierto === i}
            onClick={() => alternarA(i)}>
            <span className="rev-n">{confirmados[i] ? <CheckCircle2 size={13} /> : i + 1}</span>
            <b>{b.titulo}</b>
            {confirmados[i] && <Chip tone="ok">Confirmado</Chip>}
            <ChevronDown size={17} className="desp-chev" style={abierto === i ? { transform: "rotate(180deg)" } : undefined} />
          </button>
          {abierto === i && <div className="rev-body">{cuerpo(i)}</div>}
        </div>
      ))}

      <div className={"rev-bloque" + (abierto === VOZ ? " abierto" : "")} style={{ marginTop: 12 }}>
        <button type="button" className="rev-hd" aria-expanded={abierto === VOZ}
          onClick={() => alternarA(VOZ)}>
          <span className="rev-n"><Mic size={12} /></span>
          <b>Editar con voz</b>
          <ChevronDown size={17} className="desp-chev" style={abierto === VOZ ? { transform: "rotate(180deg)" } : undefined} />
        </button>
        {abierto === VOZ && <div className="rev-body">{cuerpo(VOZ)}</div>}
      </div>

      {puedePublicar && (
        <div className={"rev-bloque" + (abierto === PUBLICACION ? " abierto" : "")} style={{ marginTop: 12 }}>
          <button type="button" className="rev-hd" aria-expanded={abierto === PUBLICACION}
            onClick={() => alternarA(PUBLICACION)}>
            <span className="rev-n"><Rocket size={12} /></span>
            <b>Continuar a publicación</b>
            <ChevronDown size={17} className="desp-chev" style={abierto === PUBLICACION ? { transform: "rotate(180deg)" } : undefined} />
          </button>
          {abierto === PUBLICACION && <div className="rev-body">{cuerpo(PUBLICACION)}</div>}
        </div>
      )}
    </div>
  );
}
