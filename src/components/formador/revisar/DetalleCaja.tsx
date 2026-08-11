/**
 * "Detalle de caja": todo lo que el descriptivo trae cargado para la posición, en un panel lateral.
 *
 * Sustituye a los cuatro bloques que antes había que confirmar uno a uno antes de poder publicar
 * (Perfil, Compensación, Beneficios, Herramientas). Aquí es consulta, no un trámite: se abre solo
 * si el formador quiere verlo y se cierra sin dejar nada pendiente.
 *
 * El título usa `req.titulo` —el que puso el administrador— y NO `tituloPublicacion`, que es el
 * nombre comercial del anuncio.
 *
 * Nada de esto vive en el modelo: se deriva de `constants/paqueteVacante` igual que antes.
 */
import { useEffect, useState, type ReactNode } from "react";
import {
  Network, Banknote, User, Pencil, MessageSquare, CheckCircle2, Search, Clock,
} from "lucide-react";
import { Modal } from "../../common/Modal";
import { Chip } from "../../common/Chip";
import { InfoTip } from "../../common/InfoTip";
import { useData } from "../../../store/DataProvider";
import { useDemo } from "../../../contexts/DemoContext";
import { useBot } from "../../../contexts/BotContext";
import { herramientas, COMISION_SEMANAL } from "../../../constants/paqueteVacante";
import { money } from "../../../utils/format";
import type { Solicitud, Vacante } from "../../../types/models/domain";

interface Props {
  v: Vacante;
  onCerrar: () => void;
}

/**
 * Bloque del panel. Fuera del componente para que React no lo remonte en cada render: dentro,
 * cada cambio de estado cerraría los `InfoTip` que viven en su interior.
 */
function Seccion({ titulo, desc, children }: { titulo: string; desc: string; children: ReactNode }) {
  return (
    <section className="dcaja-sec">
      <h4>{titulo}</h4>
      <p className="help">{desc}</p>
      {children}
    </section>
  );
}

export function DetalleCaja({ v, onCerrar }: Props) {
  const { formadores, actions } = useData();
  const { toast } = useDemo();
  const { abrir: abrirBot } = useBot();
  const [editando, setEditando] = useState<null | "formador" | "centroCostos">(null);

  // Escape cierra el panel, como en el resto de superposiciones del sitio.
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  const req = v.req;
  const formador = formadores.find((f) => f.id === v.formadorId);
  const pendiente = (tipo: Solicitud["tipo"]) =>
    (v.solicitudes ?? []).some((s) => s.estado === "pendiente" && s.tipo === tipo);
  const val = (s: string) => s?.trim() || "—";

  /** Lápiz de edición, o el aviso de que ya hay una solicitud viva sobre ese campo. */
  const lapiz = (tipo: "formador" | "centroCostos", titulo: string) =>
    pendiente(tipo) ? (
      <Chip icon={Clock}>En revisión</Chip>
    ) : (
      <button type="button" className="dcaja-lapiz" title={titulo} aria-label={titulo}
        onClick={() => setEditando(tipo)}>
        <Pencil size={13} />
      </button>
    );

  return (
    <>
      <div className="dcaja-fondo" onClick={onCerrar} />
      <aside className="dcaja" role="dialog" aria-label={`${req.titulo} — Detalle de caja`}>
        <header className="dcaja-head">
          <h3>{req.titulo} — Detalle de caja</h3>
          <p className="help">Atributos cargados del descriptivo y atributos de la posición.</p>
        </header>

        <div className="dcaja-cuerpo">
          <Seccion
            titulo="Organización"
            desc="Revisa tu estructura y centro de costos; si algo no cuadra, solicita un ajuste antes de publicar tu vacante."
          >
            <div className="dcaja-dato">
              <Network size={16} />
              <div><label>ID de vacante</label><b>{v.id}</b></div>
            </div>
            <div className="dcaja-dato">
              <User size={16} />
              <div>
                <label>Formador asignado</label>
                <b>{formador?.nombre ?? v.formadorId}</b>
              </div>
              {lapiz("formador", "Modificar formador asignado")}
            </div>
            <div className="dcaja-dato">
              <Banknote size={16} />
              <div><label>Centro de costos</label><b>{val(req.centroCostos)}</b></div>
              {lapiz("centroCostos", "Modificar centro de costos")}
            </div>
          </Seccion>

          <Seccion
            titulo="Paquete de Compensación"
            desc="Información proveniente de Compensalia. Si requieres algún ajuste, solicítalo en el chat de soporte para su aprobación."
          >
            <div className="dcaja-rango">
              {money(req.salarioMin)} – {money(req.salarioMax)} <span>mensual bruto autorizado</span>
            </div>
            <ul className="ofrece-lista">
              <li>
                <CheckCircle2 size={14} />
                <span>Prestaciones de ley</span>
                <InfoTip etiqueta="Ver detalle de las prestaciones">
                  Aguinaldo de 30 días (contra los 15 de la LFT), prima vacacional del 40 % y días de
                  vacaciones acumulables por antigüedad. Aplican desde el alta y se prorratean si el
                  ingreso ocurre durante el año.
                </InfoTip>
              </li>
              <li>
                <CheckCircle2 size={14} />
                <span>Comisiones semanales · {money(COMISION_SEMANAL)}</span>
                <InfoTip etiqueta="Ver detalle de las comisiones">
                  Comisión de {money(COMISION_SEMANAL)} por semana ligada al cumplimiento de las metas
                  de la posición. Se deposita junto con el pago semanal y no es acumulable entre periodos.
                </InfoTip>
              </li>
            </ul>
          </Seccion>

          <Seccion titulo="Beneficios" desc="Beneficios incluidos">
            <ul className="ofrece-lista">
              <li>
                <CheckCircle2 size={14} /><span>Seguro de vida</span>
                <InfoTip etiqueta="Ver detalle del seguro de vida">
                  Póliza colectiva por 24 meses de sueldo, con cobertura por muerte accidental e
                  invalidez total y permanente. Designas beneficiarios al ingresar.
                </InfoTip>
              </li>
              <li>
                <CheckCircle2 size={14} /><span>IMSS</span>
                <InfoTip etiqueta="Ver detalle del IMSS">
                  Alta ante el IMSS con el salario real desde el primer día, con INFONAVIT y AFORE.
                  Contrato por tiempo indeterminado tras el periodo de prueba.
                </InfoTip>
              </li>
              <li>
                <CheckCircle2 size={14} /><span>Beneficios financieros</span>
                <InfoTip etiqueta="Ver detalle de los beneficios financieros">
                  Adelanto de nómina, tarjeta de crédito, descuentos desde el 10 % en Elektra y
                  Salinas &amp; Rocha, crédito personal con tasa preferencial, cambio de divisas,
                  cuentas de inversión y caja de ahorro.
                </InfoTip>
              </li>
            </ul>
          </Seccion>

          <Seccion
            titulo="Herramientas"
            desc="Estas son las herramientas de trabajo, accesos lógicos y software aprobados para la vacante."
          >
            <ul className="ofrece-lista">
              {herramientas(req).map((h) => (
                <li key={h.titulo}>
                  <CheckCircle2 size={14} />
                  <span>{h.titulo}{h.extra ? ` · ${h.extra}` : ""}</span>
                  <InfoTip etiqueta={`Ver detalle de ${h.titulo}`}>{h.detalle}</InfoTip>
                </li>
              ))}
            </ul>
          </Seccion>
        </div>

        <footer className="dcaja-pie">
          <button type="button" className="btn ghost" onClick={onCerrar}>Volver</button>
          <button type="button" className="btn gold" onClick={() => { abrirBot(); onCerrar(); }}>
            <MessageSquare size={15} /> Contactar soporte
          </button>
        </footer>
      </aside>

      {editando === "formador" && (
        <ModificarFormador
          actual={v.formadorId}
          onCerrar={() => setEditando(null)}
          onConfirmar={async (fid) => {
            try {
              await actions.crearSolicitud(v.id, "formador", fid);
              toast("Solicitud enviada al administrador · la vacante no se podrá publicar hasta que la resuelva");
              setEditando(null);
            } catch (e) {
              toast("No se pudo enviar la solicitud: " + (e as Error).message);
            }
          }}
        />
      )}

      {editando === "centroCostos" && (
        <ModificarCentroCostos
          actual={req.centroCostos}
          onCerrar={() => setEditando(null)}
          onConfirmar={async (cc) => {
            try {
              await actions.crearSolicitud(v.id, "centroCostos", cc);
              toast("Solicitud enviada al administrador · la vacante no se podrá publicar hasta que la resuelva");
              setEditando(null);
            } catch (e) {
              toast("No se pudo enviar la solicitud: " + (e as Error).message);
            }
          }}
        />
      )}
    </>
  );
}

/**
 * Búsqueda de formador por nombre o número.
 *
 * El filtrado es en cliente porque `GET /api/formadores` devuelve la lista completa y no admite
 * `?q=`; con el volumen del demo no compensa tocar el endpoint.
 */
function ModificarFormador({ actual, onCerrar, onConfirmar }: {
  actual: string;
  onCerrar: () => void;
  onConfirmar: (fid: string) => void | Promise<void>;
}) {
  const { formadores } = useData();
  const [q, setQ] = useState("");
  const [elegido, setElegido] = useState("");
  const [enviando, setEnviando] = useState(false);

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const lista = formadores.filter(
    (f) => f.id !== actual && (!q.trim() || norm(f.nombre).includes(norm(q)) || norm(f.id).includes(norm(q))),
  );

  return (
    <Modal onClose={onCerrar}>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>Modificar formador asignado</h3>
      <p className="help" style={{ marginTop: 0 }}>
        Asigna esta vacante al formador correcto. Esto debe de ser aprobado por el administrador y no
        se podrá publicar la vacante hasta que concluya esta solicitud.
      </p>

      <div className="field">
        <label>Buscar por nombre o número</label>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--gray)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 30 }}
            placeholder="p. ej. Mónica, o F3" />
        </div>
      </div>

      <div className="dcaja-lista">
        {lista.map((f) => (
          <button type="button" key={f.id} className={"dcaja-opt" + (elegido === f.id ? " on" : "")}
            onClick={() => setElegido(f.id)}>
            <b>{f.nombre}</b>
            <span className="help">{f.id} · {f.puesto} · {f.area}</span>
          </button>
        ))}
        {!lista.length && <p className="help">Ningún formador coincide con la búsqueda.</p>}
      </div>

      <div className="paso-acciones">
        <button type="button" className="btn gold" disabled={!elegido || enviando}
          onClick={() => { setEnviando(true); void Promise.resolve(onConfirmar(elegido)).finally(() => setEnviando(false)); }}>
          {enviando ? "Enviando…" : "Confirmar"}
        </button>
        <button type="button" className="btn ghost" onClick={onCerrar}>Cancelar</button>
      </div>
    </Modal>
  );
}

function ModificarCentroCostos({ actual, onCerrar, onConfirmar }: {
  actual: string;
  onCerrar: () => void;
  onConfirmar: (cc: string) => void | Promise<void>;
}) {
  const [cc, setCc] = useState("");
  const [enviando, setEnviando] = useState(false);
  // El backend exige 6 dígitos; validarlo aquí evita el viaje y explica el formato antes de fallar.
  const valido = /^\d{6}$/.test(cc) && cc !== actual;

  return (
    <Modal onClose={onCerrar}>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>Modificar centro de costos</h3>
      <p className="help" style={{ marginTop: 0 }}>
        Asigna el centro de costos correcto a esta vacante. Este debe de ser aprobado por el
        administrador y no se podrá publicar la vacante hasta que concluya esta solicitud.
      </p>

      <div className="field">
        <label>Nuevo centro de costos <span className="help">· 6 dígitos</span></label>
        <input value={cc} inputMode="numeric" maxLength={6} placeholder={actual || "514028"}
          onChange={(e) => setCc(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        {cc && !valido && (
          <div className="pub-edit-hint">
            {cc === actual ? "La vacante ya tiene ese centro de costos." : "Deben ser exactamente 6 dígitos."}
          </div>
        )}
      </div>

      <div className="paso-acciones">
        <button type="button" className="btn gold" disabled={!valido || enviando}
          onClick={() => { setEnviando(true); void Promise.resolve(onConfirmar(cc)).finally(() => setEnviando(false)); }}>
          {enviando ? "Enviando…" : "Confirmar"}
        </button>
        <button type="button" className="btn ghost" onClick={onCerrar}>Cancelar</button>
      </div>
    </Modal>
  );
}
