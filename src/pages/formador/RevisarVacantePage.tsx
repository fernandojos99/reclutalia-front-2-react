/**
 * Asistente "Revisar vacante" (/formador/vacante/:vacId/revisar).
 *
 * Dos secciones de primer nivel:
 *   · "Vacante"     — los 4 bloques a verificar, navegados con tabs de una sola palabra.
 *   · "Publicación" — primero el dictado por voz y después el anuncio listo para publicar.
 *
 * La sección de publicación está bajo llave hasta confirmar los 4 bloques: es lo que impide
 * publicar sin haber revisado. Al entrar siempre se arranca por la voz.
 *
 * Los mismos tabs sirven en escritorio y en celular (`.tabs` ya hace scroll horizontal cuando no
 * caben), así que aquí no hace falta distinguir el dispositivo.
 *
 * Las ediciones viven en un borrador local (`draft`) y solo se persisten al publicar:
 * `editarVacante` (si hubo cambios) + `aprobarVacante`, que es lo que construye el Marketplace.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, Mic, Rocket, Users } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
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

/** Los 4 bloques a verificar. `tab` es la etiqueta de una palabra de la barra de navegación. */
const BLOQUES = [
  { tab: "Perfil", titulo: "Verifica el perfil" },
  { tab: "Compensación", titulo: "Paquete de compensación" },
  { tab: "Beneficios", titulo: "Conoce y verifica los beneficios" },
  { tab: "Herramientas", titulo: "Conoce y verifica las herramientas" },
];

export function RevisarVacantePage() {
  const { vacId = "" } = useParams();
  const { vacantes, formadores, actions } = useData();
  const { toast } = useDemo();
  const navigate = useNavigate();

  const v = vacantes.find((x) => x.id === vacId);

  const [draft, setDraft] = useState<Requisito | null>(null);
  const [seccion, setSeccion] = useState<"vacante" | "publicacion">("vacante");
  /** Sub-estado de la sección de publicación: se entra siempre por la voz. */
  const [fase, setFase] = useState<"voz" | "anuncio">("voz");
  const [abierto, setAbierto] = useState(0);
  const [confirmados, setConfirmados] = useState([false, false, false, false]);
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

  /** Entrar a publicar siempre arranca por la voz, aunque en una visita previa se llegara al anuncio. */
  const irAPublicacion = () => { setFase("voz"); setSeccion("publicacion"); };

  const confirmar = (i: number) => {
    setConfirmados((c) => c.map((x, k) => (k === i ? true : x)));
    // Confirmado el último bloque, ya no queda nada que verificar: se pasa a publicar.
    if (i + 1 === BLOQUES.length) irAPublicacion();
    else setAbierto(i + 1);
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

  /** Contenido de cada bloque a verificar. Se llama como función (no como componente) para no remontar. */
  const cuerpo = (i: number) => {
    if (i === 0) {
      return (
        <PasoPerfil
          v={v} req={draft} formadorNombre={formador?.nombre ?? v.formadorId}
          bloqueado={bloqueado} hecho={confirmados[0]} destacados={destacados}
          onCambiarReq={setDraft}
          onConfirmar={() => confirmar(0)}
          onSolicitarAjustes={() => toast("Solicitud de ajustes enviada al administrador")}
        />
      );
    }
    if (i === 1) return <PasoCompensacion req={draft} hecho={confirmados[1]} bloqueado={bloqueado} onConfirmar={() => confirmar(1)} />;
    if (i === 2) return <PasoBeneficios hecho={confirmados[2]} bloqueado={bloqueado} onConfirmar={() => confirmar(2)} />;
    return <PasoHerramientas req={draft} hecho={confirmados[3]} bloqueado={bloqueado} onConfirmar={() => confirmar(3)} />;
  };

  /** Sección "Publicación": el dictado primero, el anuncio después. */
  const cuerpoPublicacion = () => {
    if (fase === "voz") {
      return (
        <EditarVoz
          req={draft}
          onAplicar={(r, campos) => {
            setDestacados(campos);
            setDraft(r);
            setFase("anuncio");
            toast("Publicación actualizada con lo que dictaste");
          }}
          onOmitir={() => setFase("anuncio")}
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
            <button type="button" className="btn ghost" onClick={() => setFase("voz")}>
              <Mic size={15} /> Volver a dictar
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

  const hechos = confirmados.filter(Boolean).length;
  const enVacante = seccion === "vacante";
  const tab = abierto >= 0 && abierto < BLOQUES.length ? abierto : 0;

  return (
    <div>
      {header}

      <div className="sec-tabs">
        <button type="button" className={"sec-tab" + (enVacante ? " on" : "")}
          onClick={() => setSeccion("vacante")}>
          Vacante
          {hechos > 0 && <span className="sec-tab-n">✓ {hechos}/{BLOQUES.length}</span>}
        </button>
        <button type="button" className={"sec-tab" + (!enVacante ? " on" : "")}
          disabled={!listos}
          title={listos ? undefined : `Confirma los ${BLOQUES.length} bloques de la vacante para poder publicar (van ${hechos})`}
          onClick={irAPublicacion}>
          Publicación
        </button>
      </div>

      {enVacante ? (
        <>
          <div className="tabs">
            {BLOQUES.map((b, i) => (
              <button key={b.tab} className={"tab" + (tab === i ? " on" : "")} onClick={() => setAbierto(i)}>
                {confirmados[i] ? "✓ " : ""}{b.tab}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15 }}>{BLOQUES[tab].titulo}</h3>
            {confirmados[tab] && <Chip tone="ok" icon={CheckCircle2}>Confirmado</Chip>}
          </div>
          {cuerpo(tab)}
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15 }}>{fase === "voz" ? "Editar con voz" : "Publicación"}</h3>
          </div>
          {cuerpoPublicacion()}
        </>
      )}
    </div>
  );
}
