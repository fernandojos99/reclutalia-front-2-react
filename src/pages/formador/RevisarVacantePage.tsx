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
import { CheckCircle2, Clock, PauseCircle, PlayCircle, Rocket, Users } from "lucide-react";
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
import { CAMPOS_VOZ } from "../../utils/perfilIA";
import type { Requisito } from "../../types/models/domain";

/** Los 4 bloques a verificar. `tab` es la etiqueta de una palabra de la barra de navegación. */
const BLOQUES = [
  { tab: "Perfil", titulo: "Verificar perfil de puesto" },
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
  /** Sub-estado de la sección de publicación: se entra por la voz y se sale a editar el anuncio. */
  const [fase, setFase] = useState<"voz" | "editar" | "final">("voz");
  const [abierto, setAbierto] = useState(0);
  const [confirmados, setConfirmados] = useState([false, false, false, false]);
  const [destacados, setDestacados] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);
  /** El dictado vive aquí, no en `EditarVoz`: así sobrevive a cambiar de pestaña. */
  const [textoVoz, setTextoVoz] = useState("");
  const [pausando, setPausando] = useState(false);

  /**
   * El borrador arranca con el requisito real en cuanto llegan los datos.
   *
   * Si la vacante YA se publicó, sus cuatro bloques entran como confirmados: obligar a repasarlos
   * uno por uno solo para volver a donde ya estabas no aporta nada. `estado` ya persiste ese hecho
   * (`abierta`/`cerrada`), así que no hace falta ningún campo extra. Solo se siembra la primera
   * vez, al llegar la vacante — después manda lo que el formador vaya confirmando.
   */
  useEffect(() => {
    if (!v || draft) return;
    setDraft(v.req);
    if (v.estado === "abierta" || v.estado === "cerrada") {
      setConfirmados([true, true, true, true]);
      setFase("editar"); // ya hay contenido: se entra a ajustarlo, no a dictarlo de cero
    }
  }, [v, draft]);

  if (!v || !draft) return <p>Cargando vacante…</p>;

  const formador = formadores.find((f) => f.id === v.formadorId);
  const publicada = v.estado === "abierta" || v.estado === "cerrada";
  // Con cambios pendientes ante el admin no se toca nada: se resolverían en falso.
  const bloqueado = v.estado === "cambios";
  const listos = confirmados.every(Boolean);

  /**
   * Pausar guarda YA, sin esperar a publicar (el backend lo permite: `editar()` no mira el estado).
   *
   * Se manda `v.req`, no `draft`: partir de lo ya persistido evita que pausar arrastre a la base
   * las ediciones a medias que el formador tenga abiertas en el asistente. El `draft` se actualiza
   * aparte para que el flag siga ahí al publicar.
   */
  const alternarPausa = async () => {
    const pausada = !draft.pausada;
    setPausando(true);
    try {
      await actions.editarVacante(v.id, { ...v.req, pausada });
      setDraft((d) => (d ? { ...d, pausada } : d));
      toast(pausada ? "Vacante pausada · no se reclutará hasta reanudarla" : "Vacante reanudada");
    } catch (e) {
      toast("No se pudo cambiar la pausa: " + (e as Error).message);
    } finally {
      setPausando(false);
    }
  };

  /**
   * Entrar a publicar arranca por la voz, aunque en una visita previa se llegara al anuncio.
   * Excepción: una vacante ya publicada entra directo a "Editar" — su contenido existe, no hay
   * nada que dictar de cero.
   */
  const irAPublicacion = () => { setFase(publicada ? "editar" : "voz"); setSeccion("publicacion"); };

  const confirmar = (i: number) => {
    setConfirmados((c) => c.map((x, k) => (k === i ? true : x)));
    // Confirmado el último bloque, ya no queda nada que verificar: se pasa a publicar.
    if (i + 1 === BLOQUES.length) irAPublicacion();
    else setAbierto(i + 1);
  };

  const publicar = async () => {
    // Ya publicada: se guarda la actualización y se vuelve al Marketplace, que se rearma solo si
    // cambiaron las habilidades (el ranking depende de ellas).
    if (publicada) {
      if (JSON.stringify(draft) !== JSON.stringify(v.req)) {
        setPublicando(true);
        try {
          await actions.editarVacante(v.id, draft);
          toast("Publicación actualizada · se recalculó el Marketplace");
        } catch (e) {
          toast("No se pudo actualizar: " + (e as Error).message);
          setPublicando(false);
          return;
        }
      }
      navigate(`/formador/vacante/${v.id}?tab=1`);
      return;
    }
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

  /** Acciones al pie del anuncio. Van en las dos sub-pestañas: publicar no debe exigir cambiar de tab. */
  const accionesPublicacion = (
    <>
      <button type="button" className="btn gold" disabled={publicando || bloqueado} onClick={() => void publicar()}>
        {publicada ? <Users size={16} /> : <Rocket size={16} />}{" "}
        {publicada ? "Ver el Marketplace de talento" : publicando ? "Publicando…" : "Publicar vacante"}
      </button>
    </>
  );

  /**
   * Sección "Publicación": dictar, editar el anuncio y verlo como el candidato.
   *
   * Las tres pestañas se pintan SIEMPRE, también durante el dictado. Antes vivían fuera de la
   * rama de voz, así que dictando no había forma de llegar a "Editar" salvo aplicar o descartar
   * — y con un dictado del que no se reconoce ningún campo, "Aplicar" está deshabilitado.
   */
  const cuerpoPublicacion = () => (
    <>
      <div className="tabs">
        <button className={"tab" + (fase === "voz" ? " on" : "")} onClick={() => setFase("voz")}>Voz</button>
        <button className={"tab" + (fase === "editar" ? " on" : "")} onClick={() => setFase("editar")}>Editar</button>
        <button className={"tab" + (fase === "final" ? " on" : "")} onClick={() => setFase("final")}>Vista final</button>
      </div>

      {fase === "voz" ? (
        <EditarVoz
          req={draft}
          texto={textoVoz}
          onTexto={setTextoVoz}
          onAplicar={(r, campos) => {
            setDestacados(campos);
            setDraft(r);
            setFase("editar");
            toast(campos.length
              ? `Se acomodaron ${campos.length} campo(s) con lo que dictaste: ${campos.map((c) => CAMPOS_VOZ[c] ?? c).join(", ")}`
              : "No se reconoció ningún campo en el dictado; puedes intentarlo con más detalle");
          }}
          onOmitir={() => setFase("editar")}
        />
      ) : fase === "editar" ? (
        <PasoPublicacion req={draft} destacados={destacados} acciones={accionesPublicacion}
          editable onCambiarReq={setDraft} />
      ) : (
        <>
          <p className="help" style={{ marginTop: 0, marginBottom: 16 }}>Así verá el anuncio el candidato.</p>
          <PasoPublicacion req={draft} destacados={destacados} acciones={accionesPublicacion} />
        </>
      )}
    </>
  );

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
          {draft.pausada && <Chip icon={PauseCircle}>Pausada</Chip>}
          <button
            type="button"
            className={"btn sm " + (draft.pausada ? "gold" : "ghost")}
            style={{ marginLeft: "auto" }}
            // Con cambios pendientes ante el admin, `editar()` los resolvería en silencio.
            disabled={pausando || bloqueado}
            title={bloqueado ? "Hay cambios pendientes de resolver por el administrador" : undefined}
            onClick={() => void alternarPausa()}
          >
            {draft.pausada ? <><PlayCircle size={14} /> Reanudar vacante</> : <><PauseCircle size={14} /> Pausar vacante</>}
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
