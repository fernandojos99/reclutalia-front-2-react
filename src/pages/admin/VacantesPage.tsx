/** Admin · listado de vacantes + edición del descriptivo con nota al reenviar (port fiel). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShieldCheck, User, AlertCircle, CheckCircle2, Edit3, Send, X } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { FasesBar } from "../../components/common/FasesBar";
import { Modal } from "../../components/common/Modal";
import { CambiosResumen } from "../../components/common/CambiosResumen";
import { VacanteForm } from "../../components/admin/VacanteForm";
import { candidatoElegido } from "../../utils/fases";
import { CAMPOS_DESC } from "../../constants/catalogos";
import type { Requisito, Solicitud, Vacante } from "../../types/models/domain";

/** Etiqueta visible del campo que toca cada solicitud. */
const campoDe = (s: Solicitud) => CAMPOS_DESC[s.tipo === "formador" ? "formadorId" : "centroCostos"];

export function AdminVacantesPage() {
  const { vacantes, formadores, actions } = useData();
  const { toast } = useDemo();
  const navigate = useNavigate();
  const [editV, setEditV] = useState<Vacante | null>(null);
  const [confirmSave, setConfirmSave] = useState<{ req: Requisito; rech: string[] } | null>(null);
  const [nota, setNota] = useState("");
  const [resolver, setResolver] = useState<{ v: Vacante; aprobar: boolean } | null>(null);
  const [notaResolver, setNotaResolver] = useState("");
  const [solic, setSolic] = useState<{ v: Vacante; s: Solicitud; aprobar: boolean } | null>(null);
  const [notaSolic, setNotaSolic] = useState("");

  /** Nombre legible del valor propuesto: los formadores se guardan por id. */
  const legible = (s: Solicitud, valor: string) =>
    s.tipo === "formador" ? (formadores.find((f) => f.id === valor)?.nombre ?? valor) : valor;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn gold" onClick={() => navigate("/admin/nueva")}><Plus size={15} /> Nueva vacante</button>
      </div>
      {vacantes.map((v) => (
        <div className={"card" + (v.estado === "cerrada" ? " ok" : "")} key={v.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <b>{v.req.titulo}</b><Chip>{v.id}</Chip>
            {v.req.tipoVacante === "Confidencial" && <Chip tone="gold" icon={ShieldCheck}>Confidencial</Chip>}
            <Chip icon={User}>Formador: {formadores.find((f) => f.id === v.formadorId)?.nombre || "—"}</Chip>
            {v.estado === "asignada" && <Chip tone="gold">En revisión del formador</Chip>}
            {v.estado === "cambios" && <Chip tone="bad" icon={AlertCircle}>Cambios solicitados</Chip>}
            {v.estado === "abierta" && (candidatoElegido(v) ? <Chip tone="ok" icon={CheckCircle2}>Candidato elegido</Chip> : <Chip tone="ok">Búsqueda activa</Chip>)}
            {v.estado === "cerrada" && <Chip tone="ok" icon={CheckCircle2}>Cubierta</Chip>}
            <span style={{ marginLeft: "auto" }}>
              {v.estado === "asignada" && <button className="btn ghost sm" onClick={() => setEditV(v)}><Edit3 size={12} /> Editar descriptivo</button>}
            </span>
          </div>
          {v.estado === "cambios" && (
            <div className="card" style={{ marginTop: 10, background: "var(--gold-soft)", borderColor: "#F0D9A5", padding: "10px 14px", fontSize: 12.5 }}>
              <b>El formador propone estos cambios al descriptivo:</b>
              <CambiosResumen cambios={v.cambios} />
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn gold sm" onClick={() => { setNotaResolver(""); setResolver({ v, aprobar: true }); }}><CheckCircle2 size={13} /> Confirmar cambios</button>
                <button className="btn ghost sm" onClick={() => { setNotaResolver(""); setResolver({ v, aprobar: false }); }}><X size={13} /> Rechazar cambios</button>
              </div>
            </div>
          )}
          {(v.solicitudes ?? []).filter((s) => s.estado === "pendiente").map((s) => (
            <div className="card" key={s.id} style={{ marginTop: 10, background: "var(--gold-soft)", borderColor: "#F0D9A5", padding: "10px 14px", fontSize: 12.5 }}>
              <b>El formador solicita cambiar {campoDe(s)}:</b>
              <div className="help" style={{ marginTop: 4 }}>
                «{legible(s, s.valorPrevio)}» → «{legible(s, s.valor)}» · {s.creada}
              </div>
              <p className="help" style={{ margin: "6px 0 0" }}>La vacante no se puede publicar hasta que lo resuelvas.</p>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn gold sm" onClick={() => { setNotaSolic(""); setSolic({ v, s, aprobar: true }); }}><CheckCircle2 size={13} /> Aprobar</button>
                <button className="btn ghost sm" onClick={() => { setNotaSolic(""); setSolic({ v, s, aprobar: false }); }}><X size={13} /> Rechazar</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}><FasesBar v={v} compact /></div>
        </div>
      ))}

      {editV && (
        <Modal onClose={() => setEditV(null)} wide>
          <h3 style={{ marginBottom: 8 }}>Editar descriptivo · {editV.id}</h3>
          {editV.historial.length > 0 && (
            <div style={{ maxHeight: 110, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
              <label>Historial del descriptivo</label>
              {editV.historial.map((h, i) => <div key={i} className="help">• {h}</div>)}
            </div>
          )}
          <VacanteForm inicial={editV.req} cambios={editV.cambios} saveLabel="Guardar y reenviar al formador"
            onSave={(req, rech) => setConfirmSave({ req, rech })} />
        </Modal>
      )}

      {confirmSave && (
        <Modal onClose={() => setConfirmSave(null)}>
          <h3 style={{ marginBottom: 6 }}>Reenviar descriptivo al formador</h3>
          <p className="help" style={{ marginBottom: 14 }}>Si lo requieres, agrega una nota o comentario sobre los ajustes realizados o rechazados. Quedará registrada en el historial del descriptivo, visible para ti y para el formador.</p>
          <label>Nota o comentario (opcional)</label>
          <textarea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="p. ej. Ajusté el rango salarial al tabulador vigente; el radio de búsqueda no puede ampliarse por política interna…" />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn gold" onClick={() => { if (editV) void actions.editarVacante(editV.id, confirmSave.req, confirmSave.rech, nota.trim()); setConfirmSave(null); setEditV(null); setNota(""); toast("Descriptivo actualizado · el formador fue notificado"); }}><Send size={15} /> Guardar y reenviar</button>
            <button className="btn ghost" onClick={() => setConfirmSave(null)}>Volver al formulario</button>
          </div>
        </Modal>
      )}

      {resolver && (
        <Modal onClose={() => setResolver(null)}>
          <h3 style={{ marginBottom: 6 }}>{resolver.aprobar ? "Confirmar cambios del descriptivo" : "Rechazar cambios del descriptivo"}</h3>
          <p className="help" style={{ marginBottom: 12 }}>{resolver.v.req.titulo} · {resolver.v.id}</p>
          <div className="card" style={{ background: "var(--bg)", padding: "10px 14px", marginBottom: 12, fontSize: 12.5 }}>
            <b>El formador propone:</b>
            <CambiosResumen cambios={resolver.v.cambios} />
          </div>
          <label>Nota o comentario (opcional)</label>
          <textarea rows={3} value={notaResolver} onChange={(e) => setNotaResolver(e.target.value)}
            placeholder={resolver.aprobar ? "Comentario para el formador sobre los cambios aplicados…" : "Explica por qué no se aplican los cambios propuestos…"} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className={"btn " + (resolver.aprobar ? "gold" : "danger")}
              onClick={() => { const ap = resolver.aprobar; void actions.resolverEdicion(resolver.v.id, ap, notaResolver.trim()); setResolver(null); setNotaResolver(""); toast(ap ? "Cambios confirmados · el formador fue notificado" : "Cambios rechazados · el formador fue notificado"); }}>
              {resolver.aprobar ? <><CheckCircle2 size={15} /> Confirmar cambios</> : <><X size={15} /> Rechazar cambios</>}
            </button>
            <button className="btn ghost" onClick={() => setResolver(null)}>Cancelar</button>
          </div>
        </Modal>
      )}

      {solic && (
        <Modal onClose={() => setSolic(null)}>
          <h3 style={{ marginBottom: 6 }}>
            {solic.aprobar ? "Aprobar" : "Rechazar"} el cambio de {campoDe(solic.s).toLowerCase()}
          </h3>
          <p className="help" style={{ marginBottom: 12 }}>{solic.v.req.titulo} · {solic.v.id}</p>
          <div className="card" style={{ background: "var(--bg)", padding: "10px 14px", marginBottom: 12, fontSize: 12.5 }}>
            <b>{campoDe(solic.s)}</b>
            <div className="help" style={{ marginTop: 4 }}>
              «{legible(solic.s, solic.s.valorPrevio)}» → «{legible(solic.s, solic.s.valor)}»
            </div>
          </div>
          <label>Nota o comentario (opcional)</label>
          <textarea rows={3} value={notaSolic} onChange={(e) => setNotaSolic(e.target.value)}
            placeholder={solic.aprobar ? "Comentario para el formador…" : "Explica por qué no se aplica el cambio…"} />
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className={"btn " + (solic.aprobar ? "gold" : "danger")}
              onClick={() => {
                const { v, s, aprobar } = solic;
                void actions.resolverSolicitud(v.id, s.id, aprobar, notaSolic.trim());
                setSolic(null); setNotaSolic("");
                toast(aprobar ? "Solicitud aprobada · el formador fue notificado" : "Solicitud rechazada · el formador fue notificado");
              }}>
              {solic.aprobar ? <><CheckCircle2 size={15} /> Aprobar</> : <><X size={15} /> Rechazar</>}
            </button>
            <button className="btn ghost" onClick={() => setSolic(null)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
