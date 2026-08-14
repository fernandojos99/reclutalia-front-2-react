/**
 * "Mis procesos" del candidato — port fiel de `CandidatoHome`. Usa useData()/actions.
 * La autorización de la etapa de filtros es estado local (no la ve el formador); documentos de
 * contratación, cuenta y médico se persisten vía actions.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, MapPin, Send, Video, Sparkles, CheckCircle2, ClipboardCheck, ShieldCheck,
  CalendarCheck, Link2, Landmark, ExternalLink, QrCode, Edit3, Clock, FileSignature, PartyPopper,
  Download, Search, MessageSquare,
} from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { MiniPipe } from "../../components/common/MiniPipe";
import { QRDemo } from "../../components/common/QRDemo";
import { Modal } from "../../components/common/Modal";
import { UploadPDF } from "../../components/ui/uploads";
import {
  VideoIAModal, MedicoAgendar, PostulacionForm, RechazarInvitacionModal,
} from "../../components/candidato/procesoModals";
import { PerfilEditor } from "../../components/candidato/PerfilEditor";
import { OfertaInterna } from "../../components/candidato/OfertaInterna";
import { MensajeLiberacion } from "../../components/candidato/MensajeLiberacion";
import { CapacitacionModulo } from "../../components/common/CapacitacionModulo";
import {
  mapsUrl, psicoVigente, psicoVigenteHasta, abrirAperturaCuenta, folioCita,
} from "../../utils/format";
import { DIRECCION_CORP } from "../../constants/catalogos";
import { slotTomado } from "../../utils/pipeline";
import type { Vacante } from "../../types/models/domain";

const CONTRATO_KEYS: [string, string][] = [
  ["ine", "Identificación oficial (INE)"], ["curp", "CURP"],
  ["rfc", "Constancia de situación fiscal (RFC)"], ["domicilio", "Comprobante de domicilio"],
  ["estudios", "Comprobante de estudios"],
];

/**
 * Documentos que se le piden a este candidato.
 *
 * Al interno no se le pide el CURP: la empresa ya lo tiene en su expediente. Tiene que filtrarse
 * aquí y no solo al pintar la lista, porque de esta misma función sale la comprobación de
 * "documentación completa"; si el CURP siguiera contando, un interno nunca podría terminarla.
 */
const docsDe = (tipo: string): [string, string][] =>
  CONTRATO_KEYS.filter(([k]) => !(tipo === "interno" && k === "curp"));
const esCerrado = (est: string) => ["contratado", "descartado", "filtrado", "rechazado"].includes(est);

interface FiltroLocal { autoriza: boolean; }

export function MisProcesosPage() {
  const { vacantes, candidatos, formadores, actions } = useData();
  const { candId, toast } = useDemo();
  const navigate = useNavigate();
  const cand = candidatos.find((c) => c.id === candId);

  const [videoV, setVideoV] = useState<Vacante | null>(null);
  const [confirmOferta, setConfirmOferta] = useState<Vacante | null>(null);
  const [feedbackDe, setFeedbackDe] = useState<Vacante | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "activos" | "cerrados">("todos");
  const [qrDe, setQrDe] = useState<string | null>(null);
  const [fechaDe, setFechaDe] = useState<Vacante | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [rechazarDe, setRechazarDe] = useState<Vacante | null>(null);
  const [filtrosLoc, setFiltrosLoc] = useState<Record<string, FiltroLocal>>({});
  const [editarPerfil, setEditarPerfil] = useState(false);

  if (!cand) return <p>Cargando…</p>;
  const onBuscar = () => navigate("/candidato/buscar");

  const procesos = vacantes.filter((v) => v.pipeline[cand.id]);
  const cont = {
    todos: procesos.length,
    activos: procesos.filter((v) => !esCerrado(v.pipeline[cand.id].estado)).length,
    cerrados: procesos.filter((v) => esCerrado(v.pipeline[cand.id].estado)).length,
  };
  const visibles = procesos.filter((v) => {
    if (filtro === "todos") return true;
    const cerrado = esCerrado(v.pipeline[cand.id].estado);
    return filtro === "cerrados" ? cerrado : !cerrado;
  });

  const getLoc = (vid: string): FiltroLocal => filtrosLoc[vid] ?? { autoriza: false };
  const setLoc = (vid: string, patch: Partial<FiltroLocal>) =>
    setFiltrosLoc((m) => ({ ...m, [vid]: { ...getLoc(vid), ...patch } }));

  // La cuenta de nómina se genera sola al abrir el enlace o cerrar el QR (no hay captura manual).
  const genCuentaNum = () => "012180" + String(100_000_000_000 + cand.id * 7_654_321).slice(-12);
  const generarCuenta = (vid: string) => {
    const proc = vacantes.find((x) => x.id === vid)?.pipeline[cand.id];
    if (proc?.cuentaBanco) return;
    void actions.setCuentaBanco(vid, cand.id, genCuentaNum());
    toast("Cuenta de nómina generada · esperando la firma de tu contrato");
  };

  if (!procesos.length) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 44, color: "var(--gray)" }}>
        <Briefcase size={26} style={{ marginBottom: 8 }} />
        <p>Aún no tienes procesos activos. Cuando te inviten a una vacante, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="tagpick" style={{ marginBottom: 16 }}>
        <button className={"tag" + (filtro === "todos" ? " on" : "")} onClick={() => setFiltro("todos")}>Todos ({cont.todos})</button>
        <button className={"tag" + (filtro === "activos" ? " on" : "")} onClick={() => setFiltro("activos")}>Activos ({cont.activos})</button>
        <button className={"tag" + (filtro === "cerrados" ? " on" : "")} onClick={() => setFiltro("cerrados")}>Cerrados ({cont.cerrados})</button>
      </div>
      {!visibles.length && (
        <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
          {filtro === "activos" ? "No tienes procesos activos en este momento." : filtro === "cerrados" ? "Aún no tienes procesos cerrados." : "No hay procesos para mostrar."}
        </div>
      )}
      {visibles.map((v) => {
        const p = v.pipeline[cand.id];
        const loc = getLoc(v.id);
        const filtroDocsOk = psicoVigente(cand.psicometrico) && loc.autoriza;
        const medicoOk = !v.req.examenMedico || !!(p.medico && p.medico.validado);
        const contratoOk = docsDe(cand.tipo).every(([k]) => p.docsContrato[k]) && medicoOk;

        return (
          <div className={"card" + (p.estado === "contratado" ? " ok" : "")} key={v.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ fontSize: 15 }}>{v.req.titulo}</b>
              <Chip icon={MapPin}>{v.req.ubicacionTrabajo} · {v.req.modalidad}</Chip>
            </div>
            {!["descartado", "filtrado", "rechazado"].includes(p.estado) &&
              <div style={{ margin: "10px 0 14px", maxWidth: 560 }}><MiniPipe estado={p.estado} /></div>}

            {p.estado === "invitado" && (
              <>
                <div className="aibox" style={{ marginBottom: 12 }}>
                  <div className="hd"><Send size={14} /> Mensaje para ti</div>
                  <p style={{ fontSize: 13 }}>"{p.mensaje}"</p>
                </div>
                <PostulacionForm v={v}
                  onAplicar={() => { void actions.aplicar(v.id, cand.id); toast("¡Postulación enviada!"); }}
                  onRechazar={() => setRechazarDe(v)} />
              </>
            )}

            {["postulado", "filtros_ok"].includes(p.estado) && (
              <>
                <label>Valida que tus datos estén correctos.</label>
                <div className="help" style={{ marginTop: -2, marginBottom: 8 }}>Revisa y actualiza tu información de perfil antes de continuar con tu postulación.</div>
                <button className="btn ghost sm" style={{ marginBottom: 14 }} onClick={() => setEditarPerfil(true)}><Edit3 size={13} /> Editar mi perfil</button>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink2)", margin: "4px 0 6px" }}>Evaluación</div>
                {psicoVigente(cand.psicometrico) ? (
                  <div className="check-item done">
                    <ClipboardCheck size={20} color="var(--ok)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Evaluación completada</div>
                      <div className="help">Resultado válido para otras vacantes durante 6 meses · vigente hasta {psicoVigenteHasta(cand.psicometrico)}.</div>
                    </div>
                  </div>
                ) : (
                  <div className="check-item">
                    <ClipboardCheck size={20} color="var(--gray)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Evaluación</div>
                      <div className="help">Al completarlo, tu resultado será válido para otras aplicaciones de vacantes durante 6 meses.</div>
                    </div>
                    {p.estado === "postulado" && <button className="btn ai sm" onClick={() => { void actions.completarPsicometrico(cand.id); toast("Evaluación completada"); }}><ClipboardCheck size={13} /> Realizar evaluación</button>}
                  </div>
                )}

                {p.estado === "postulado" && (
                  <>
                    <label className="check-item" style={{ marginTop: 12, cursor: "pointer", fontWeight: 400, alignItems: "flex-start" }}>
                      <input type="checkbox" style={{ width: "auto", marginTop: 2, marginRight: 8 }} checked={loc.autoriza}
                        onChange={(e) => setLoc(v.id, { autoriza: e.target.checked })} />
                      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>Al postularme acepto que mis datos personales son tratados conforme a lo establecido en el Aviso de Privacidad.</span>
                    </label>
                    <button className="btn dark" style={{ marginTop: 12 }} disabled={!filtroDocsOk}
                      onClick={() => { void actions.docsFiltro(v.id, cand.id); toast("Filtros automáticos aprobados"); }}>
                      <ShieldCheck size={15} /> Enviar a validación automática
                    </button>
                    {!filtroDocsOk && <div className="help" style={{ marginTop: 6 }}>Para continuar: completa la evaluación y marca la autorización.</div>}
                  </>
                )}

                {p.estado === "filtros_ok" && (
                  <div style={{ marginTop: 14 }}>
                    <div className="trow">
                      <Video size={20} color="var(--ai)" />
                      <div style={{ flex: 1, fontSize: 13 }}><b>Te invitamos a esta primera video-entrevista.</b> Responde 5 preguntas en videollamada para generar tu ranking.</div>
                      <button className="btn ai" onClick={() => setVideoV(v)}><Video size={14} /> Iniciar ahora</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {p.estado === "evaluado" && <div className="chip ai"><Sparkles size={12} /> Video-entrevista completada · Te notificaremos de los siguientes pasos.</div>}

            {p.estado === "slots_enviados" && (
              <>
                <label>Te invitamos a entrevista ({p.modalidadEnt}). Elige uno de los 3 horarios:</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 6 }}>
                  {(p.slots ?? []).map((s) => {
                    const tomado = slotTomado(v, s, cand.id);
                    return tomado
                      ? <button key={s} className="slotbtn" disabled style={{ opacity: 0.55, cursor: "not-allowed" }}>{s}<div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--bad)", marginTop: 2 }}>No disponible</div></button>
                      : <button key={s} className="slotbtn" onClick={() => { void actions.confirmarSlot(v.id, cand.id, s); toast("Horario confirmado · reunión de Teams generada"); }}>{s}</button>;
                  })}
                </div>
                {(p.slots ?? []).some((s) => slotTomado(v, s, cand.id)) && <div className="help" style={{ marginTop: 6 }}>Los horarios marcados como "No disponible" ya fueron confirmados por otro candidato de esta vacante.</div>}
              </>
            )}

            {p.estado === "agendado" && (
              <div className="trow">
                <CalendarCheck size={20} color="var(--ok)" />
                <div style={{ flex: 1, fontSize: 13 }}><b>Entrevista confirmada:</b> {p.slotElegido} · {p.modalidadEnt}
                  {p.modalidadEnt === "Presencial" ? (
                    <div style={{ marginTop: 4, lineHeight: 1.6 }}>
                      <div><MapPin size={12} style={{ verticalAlign: -2 }} /> {v.req.sede || v.req.ubicacionTrabajo}</div>
                      <div><a href={mapsUrl(v.req.sede || v.req.ubicacionTrabajo)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--ai)", fontWeight: 600 }}><Link2 size={11} style={{ verticalAlign: -1 }} /> Ver ubicación en Google Maps (simulado)</a></div>
                      <div>Folio de acceso: <b>{folioCita(v.id, cand.id)}</b> · recuerda llevar tu identificación oficial.</div>
                    </div>
                  ) : (
                    <div><a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12, color: "var(--ai)", fontWeight: 600 }}><Link2 size={11} style={{ verticalAlign: -1 }} /> Enlace a la reunión de Teams (simulado)</a></div>
                  )}
                </div>
              </div>
            )}

            {p.estado === "entrevistado" && <Chip tone="gold">Entrevista realizada · estamos revisando tu candidatura</Chip>}

            {["seleccionado", "docs_completos"].includes(p.estado) && (
              <>
                <div className="card" style={{ background: "var(--gold-soft)", borderColor: "#F0D9A5", marginBottom: 12 }}>
                  <b>🎉 ¡Felicidades, {cand.nombre.split(" ")[0]}! Fuiste seleccionado(a).</b>
                  <p style={{ fontSize: 12.5, marginTop: 4 }}>Siguiente paso: sube tu documentación para preparar tu contratación. <b>Solo PDF · máximo 1 MB por archivo.</b></p>
                </div>
                {docsDe(cand.tipo).map(([k, l]) => {
                  // El interno ya es empleado: TODOS sus documentos están en expediente y puede
                  // reutilizarlos o actualizarlos, el CURP incluido. Antes se excluía por no
                  // cambiar nunca, pero era el único documento sin "Usar actual" y la asimetría
                  // hacía pensar que faltaba subirlo.
                  const enPerfil = (cand.docsPerfil as unknown as Record<string, string | null>)[k];
                  const delExpediente = cand.tipo === "interno" ? enPerfil ?? `${l}.pdf` : null;
                  return (
                    <UploadPDF key={k} label={l} value={p.docsContrato[k] ?? null}
                      actual={delExpediente}
                      onUsarActual={delExpediente
                        ? () => { void actions.setDocContrato(v.id, cand.id, k, delExpediente); }
                        : undefined}
                      onDone={(n) => { void actions.setDocContrato(v.id, cand.id, k, n); }} />
                  );
                })}


                {v.req.examenMedico && (
                  <div style={{ marginTop: 9 }}>
                    {p.medico && p.medico.validado ? (
                      <div className="check-item done" style={{ alignItems: "flex-start" }}>
                        <CheckCircle2 size={20} color="var(--ok)" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>Examen médico validado</div>
                          <div className="help">{p.medico.sucursal} · {p.medico.fecha} · resultado validado.</div>
                        </div>
                      </div>
                    ) : p.medico ? (
                      <div className="check-item" style={{ alignItems: "flex-start", borderStyle: "solid", background: "var(--gold-soft)", borderColor: "#F0D9A5" }}>
                        <Clock size={20} color="var(--warn)" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--warn)" }}>Examen médico agendado — en espera de validación</div>
                          <div className="help">{p.medico.sucursal} · {p.medico.fecha}. Preséntate a tu cita; validaremos el resultado del examen.</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: "1px dashed var(--line)", borderRadius: 11, padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Examen médico</div>
                        {p.estado === "seleccionado"
                          ? <MedicoAgendar onAgendar={(datos) => { void actions.agendarMedico(v.id, cand.id, datos); toast("Examen médico agendado"); }} />
                          : <div className="help" style={{ marginTop: 4 }}>Pendiente de agendar.</div>}
                      </div>
                    )}
                  </div>
                )}

                {contratoOk && p.estado === "seleccionado" && (
                  <button className="btn gold" style={{ marginTop: 12 }} onClick={() => { void actions.docsContratoListos(v.id, cand.id); toast("Documentación enviada correctamente"); }}>
                    <CheckCircle2 size={15} /> Enviar documentación completa
                  </button>
                )}
                {!contratoOk && p.estado === "seleccionado" && <div className="help" style={{ marginTop: 8 }}>Completa todos los documentos{v.req.examenMedico ? " y aprueba tu examen médico" : ""} para poder enviar tu documentación. Tu cuenta de nómina se abre después de aceptar la oferta.</div>}
                {p.estado === "docs_completos" && <div className="chip ok" style={{ marginTop: 10 }}><CheckCircle2 size={12} /> Documentación validada · espera tu carta oferta</div>}
              </>
            )}

            {/* El interno ve una carta distinta: compara contra lo que deja atrás. */}
            {p.estado === "oferta_enviada" && cand.tipo === "interno" && (
              <OfertaInterna cand={cand} v={v} p={p} onAceptar={() => setConfirmOferta(v)} />
            )}

            {p.estado === "oferta_enviada" && cand.tipo === "externo" && (
              <div className="card" style={{ borderColor: "var(--gold)" }}>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}><FileSignature size={16} style={{ verticalAlign: -3 }} /> Tu carta oferta</h3>
                <div style={{ marginBottom: 12 }}>
                  <label>Puesto</label><b style={{ fontSize: 13.5 }}>{v.req.titulo}</b>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Ubicación donde debes presentarte</label>
                  <div style={{ fontSize: 13.5 }}>{p.oferta?.ubicacion || DIRECCION_CORP}</div>
                  <a className="btn ghost sm" style={{ marginTop: 6 }} href={mapsUrl(p.oferta?.ubicacion)} target="_blank" rel="noreferrer"><MapPin size={13} /> Ver en Google Maps</a>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn gold" onClick={() => setConfirmOferta(v)}><CheckCircle2 size={15} /> Aceptar oferta</button>
                  <button className="btn ghost"><Download size={14} /> Descargar carta oferta</button>
                </div>
              </div>
            )}

            {/* El interno ya cobra en la empresa: no hay cuenta que abrir, sino un aviso que dar. */}
            {p.estado === "oferta_aceptada" && cand.tipo === "interno" && (
              <MensajeLiberacion
                cand={cand} v={v} p={p}
                formadorActual={formadores.find((f) => f.id === cand.formadorId)?.nombre}
                onEnviar={(msg) => {
                  void actions.enviarMensajeLiberacion(v.id, cand.id, msg);
                  toast("Mensaje enviado a tu formador actual");
                }}
              />
            )}

            {p.estado === "oferta_aceptada" && cand.tipo === "externo" && (
              <div className="card" style={{ borderColor: "var(--gold)" }}>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}><Landmark size={16} style={{ verticalAlign: -3 }} /> Apertura de tu cuenta de nómina</h3>
                <p className="help" style={{ marginBottom: 12 }}>Aceptaste la oferta. Penúltimo paso: abre tu cuenta de nómina desde el enlace o el QR; se generará automáticamente para formalizar tu contrato.</p>
                <div className={"check-item" + (p.cuentaBanco ? " done" : "")} style={{ alignItems: "flex-start" }}>
                  {p.cuentaBanco ? <CheckCircle2 size={20} color="var(--ok)" /> : <Landmark size={20} color="var(--gray)" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Cuenta bancaria para nómina</div>
                    <div className="help">{p.cuentaBanco ? `Cuenta generada: ••••${String(p.cuentaBanco).slice(-4)} · esperando la firma de tu contrato.` : "Abre tu cuenta de nómina desde el enlace o el QR; se generará automáticamente."}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <button className="btn ghost sm" onClick={() => { abrirAperturaCuenta(); generarCuenta(v.id); }}><ExternalLink size={13} /> Abrir apertura de cuenta</button>
                      <button className="btn ghost sm" onClick={() => setQrDe(v.id)}><QrCode size={13} /> Ver QR</button>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div className="grid2">
                    <div>
                      <label>Fecha de ingreso</label><b style={{ fontSize: 13.5 }}>{p.oferta?.fecha}</b>
                      <div style={{ marginTop: 8 }}>
                        <button className="btn ghost sm" onClick={() => { setNuevaFecha(""); setFechaDe(v); }}><CalendarCheck size={13} /> Solicitar cambio de fecha</button>
                      </div>
                    </div>
                    <div><label>Te presentas en</label><div style={{ fontSize: 13 }}>{p.oferta?.ubicacion || DIRECCION_CORP}</div></div>
                  </div>
                </div>
                <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.6, background: "var(--gold-soft)", border: "1px solid #F0D9A5", borderRadius: 10, padding: "10px 14px", color: "var(--ink2)" }}>
                  Tu contrato se firmará el día de tu fecha de ingreso, preséntate con tu identificación oficial a la ubicación mencionada para concluir tu proceso. ¡Mucho éxito!
                </div>
              </div>
            )}

            {p.estado === "contratado" && (
              <>
              <div className="celebrate">
                <PartyPopper size={38} color="var(--gold)" style={{ marginBottom: 10 }} />
                <h2 style={{ fontSize: 21 }}>¡Bienvenido(a) al equipo, {cand.nombre.split(" ")[0]}!</h2>
                <p style={{ color: "#C9C9C9", margin: "6px 0 16px" }}>{v.req.titulo} · Ingreso: {p.oferta?.fecha}</p>
                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,184,28,0.4)", borderRadius: 12, padding: "12px 26px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#C9C9C9" }}>Tu número de empleado</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.18em", color: "var(--gold)" }}>{p.numEmpleado}</div>
                  <div style={{ fontSize: 12, color: "#C9C9C9", marginTop: 10 }}>Tu correo corporativo</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}>{p.numEmpleado}@elektra.com.mx</div>
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6 }}>✓ Accesos lógicos (Okta) confirmados</div>
                  <div style={{ fontSize: 12, color: "#C9C9C9", marginTop: 10 }}>Preséntate en</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginTop: 2, maxWidth: 300 }}>{p.oferta?.ubicacion || DIRECCION_CORP}</div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
                  <a className="btn gold sm" href={mapsUrl(p.oferta?.ubicacion)} target="_blank" rel="noreferrer"><MapPin size={13} /> Ver en Google Maps</a>
                  <button className="btn gold sm"><Download size={13} /> Kit de inducción</button>
                  <button className="btn gold sm"><Download size={13} /> Guía de tu primer día</button>
                </div>
              </div>
              <CapacitacionModulo titulo="Inducción al puesto" completados={p.capacitacion ?? []}
                onVer={(m) => { void actions.marcarCapacitacion(v.id, cand.id, m); toast("Material completado: " + m); }} />
              </>
            )}

            {p.estado === "rechazado" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, color: "var(--gray)", marginBottom: 10 }}>Rechazaste esta invitación. Ya no participas en este proceso.</div>
                <button className="btn gold sm" onClick={onBuscar}><Search size={13} /> Ver más vacantes</button>
              </div>
            )}

            {["descartado", "filtrado"].includes(p.estado) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ background: "var(--bad-soft)", border: "1px solid #F0C4C1", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, fontWeight: 600, color: "var(--bad)", marginBottom: 10 }}>La vacante concluyó, gracias por aplicar.</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn ghost sm" onClick={() => setFeedbackDe(v)}><MessageSquare size={13} /> Ver mi feedback</button>
                  <button className="btn gold sm" onClick={onBuscar}><Search size={13} /> Ver más vacantes</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {feedbackDe && (
        <Modal onClose={() => setFeedbackDe(null)}>
          <h3 style={{ marginBottom: 4 }}>Feedback de tu proceso</h3>
          <p className="help" style={{ marginBottom: 14 }}>{feedbackDe.req.titulo}</p>
          {feedbackDe.pipeline[cand.id]?.entrevista?.feedback
            ? <div className="trow"><MessageSquare size={18} color="var(--gold-dark)" /><div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.6 }}>"{feedbackDe.pipeline[cand.id].entrevista?.feedback}"</div></div>
            : <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>Gracias por participar en este proceso. En esta ocasión no fue posible continuar, pero tu perfil seguirá siendo considerado por la IA para futuras vacantes compatibles con tu experiencia.</p>}
          <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setFeedbackDe(null)}>Cerrar</button>
        </Modal>
      )}
      {rechazarDe && <RechazarInvitacionModal v={rechazarDe} onClose={() => setRechazarDe(null)}
        onRechazar={(motivo) => { void actions.rechazar(rechazarDe.id, cand.id, motivo); setRechazarDe(null); toast("Invitación rechazada"); }} />}
      {videoV && <VideoIAModal cand={cand} v={videoV} onClose={() => setVideoV(null)}
        onDone={() => { void actions.videoIA(videoV.id, cand.id); setVideoV(null); toast("Video-entrevista enviada · tu ranking fue actualizado"); }} />}
      {confirmOferta && (
        <Modal onClose={() => setConfirmOferta(null)}>
          <h3 style={{ marginBottom: 8 }}>Aceptar oferta</h3>
          <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>Al confirmar, aceptas la carta oferta de "{confirmOferta.req.titulo}", generando tu contrato para firmar el mismo día de tu fecha de ingreso.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn gold" onClick={() => { void actions.aceptarOferta(confirmOferta.id, cand.id); setConfirmOferta(null); toast("¡Oferta aceptada!"); }}><FileSignature size={15} /> Aceptar oferta</button>
            <button className="btn ghost" onClick={() => setConfirmOferta(null)}>Rechazar la oferta</button>
          </div>
        </Modal>
      )}
      {qrDe && (
        <Modal onClose={() => { generarCuenta(qrDe); setQrDe(null); }}>
          <h3 style={{ marginBottom: 6 }}>Apertura de cuenta por QR</h3>
          <p className="help" style={{ marginBottom: 16 }}>Escanea este código con la app del banco para iniciar la apertura de tu cuenta de nómina (simulado). Al cerrar, tu cuenta quedará generada.</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><QRDemo /></div>
          <button className="btn gold" onClick={() => { generarCuenta(qrDe); setQrDe(null); }}>Ya realicé la apertura</button>
        </Modal>
      )}
      {fechaDe && (
        <Modal onClose={() => setFechaDe(null)}>
          <h3 style={{ marginBottom: 8 }}>Solicitar cambio de fecha de ingreso</h3>
          <p className="help" style={{ marginBottom: 12 }}>Elige la nueva fecha en la que podrías presentarte a tu ingreso para "{fechaDe.req.titulo}".</p>
          <label>Nueva fecha de ingreso</label>
          <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn gold" disabled={!nuevaFecha} onClick={() => { void actions.solicitarCambioFecha(fechaDe.id, cand.id, nuevaFecha); setFechaDe(null); toast("Solicitud de cambio de fecha enviada"); }}><CalendarCheck size={15} /> Solicitar cambio</button>
            <button className="btn ghost" onClick={() => setFechaDe(null)}>Cancelar</button>
          </div>
        </Modal>
      )}
      {editarPerfil && (
        <PerfilEditor cand={cand} onClose={() => setEditarPerfil(false)}
          onSave={(c) => { void actions.guardarCandidato(c); setEditarPerfil(false); toast("Perfil actualizado"); }} />
      )}
    </div>
  );
}
