/** Alta/edición de candidato del marketplace — port fiel de `CandidatoForm`. */
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { TagPicker, UploadPDF } from "../ui/uploads";
import { AREAS, EDUCACION, CIUDADES, ESPECIALIDADES, HARD_SKILLS, SOFT_SKILLS, MOVILIDAD, DESEMPENO } from "../../constants/catalogos";
import type { Candidato } from "../../types/models/domain";

/** Candidato nuevo con defaults (los campos de perfil se rellenan al guardar en backend). */
function candidatoVacio(): Candidato {
  return {
    id: 0, nombre: "", tipo: "externo", area: AREAS[0], puesto: "", nivel: "Junior", exp: 1,
    edu: "Licenciatura titulado", ciudad: "CDMX", modalidad: "Presencial", salario: 15000,
    esp: [], hard: [], soft: [], resumen: "", email: "", tel: "", foto: null,
    experiencia: [], educacion: [], intereses: [], favoritos: [], psicometrico: null,
    docsPerfil: { ine: null, curp: null, rfc: null, domicilio: null, estudios: null, certificaciones: [], cv: null },
  };
}

export function CandidatoForm({ inicial, onSave, onClose }: {
  inicial: Candidato | null; onSave: (c: Candidato) => void; onClose: () => void;
}) {
  const [c, setC] = useState<Candidato>(inicial || candidatoVacio());
  const set = <K extends keyof Candidato>(k: K, v: Candidato[K]) => setC((x) => ({ ...x, [k]: v }));
  const valido = c.nombre.trim() && c.puesto.trim() && c.esp.length;

  return (
    <Modal onClose={onClose} wide>
      <h3 style={{ marginBottom: 14 }}>{inicial ? "Editar perfil de candidato" : "Subir nuevo candidato al marketplace"}</h3>
      <div className="grid3">
        <div className="field"><label>Nombre completo *</label><input value={c.nombre} onChange={(e) => set("nombre", e.target.value)} /></div>
        <div className="field"><label>Puesto actual *</label><input value={c.puesto} onChange={(e) => set("puesto", e.target.value)} /></div>
        <div className="field"><label>Tipo</label><select value={c.tipo} onChange={(e) => set("tipo", e.target.value as Candidato["tipo"])}><option value="externo">Externo</option><option value="interno">Interno</option></select></div>
        <div className="field"><label>Área</label><select value={c.area} onChange={(e) => set("area", e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></div>
        <div className="field"><label>Años de experiencia</label><input type="number" value={c.exp} onChange={(e) => set("exp", +e.target.value)} /></div>
        <div className="field"><label>Estudios</label><select value={c.edu} onChange={(e) => set("edu", e.target.value)}>{EDUCACION.map((a) => <option key={a}>{a}</option>)}</select></div>
        <div className="field"><label>Ciudad</label><select value={c.ciudad} onChange={(e) => set("ciudad", e.target.value)}>{CIUDADES.map((a) => <option key={a}>{a}</option>)}</select></div>
        <div className="field"><label>Expectativa salarial</label><input type="number" value={c.salario} onChange={(e) => set("salario", +e.target.value)} /></div>
      </div>

      {/* Movilidad interna: solo aplica a internos, así que los campos aparecen al marcar el tipo.
          El semáforo es un DATO que decide el administrador, no un cálculo del sistema. */}
      {c.tipo === "interno" && (
        <div className="grid3">
          <div className="field">
            <label>Semáforo de movilidad</label>
            <select value={c.movilidad ?? ""} onChange={(e) => set("movilidad", (e.target.value || undefined) as Candidato["movilidad"])}>
              <option value="">Sin definir</option>
              {MOVILIDAD.map((m) => <option key={m.nivel} value={m.nivel}>{m.etiqueta}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Desempeño</label>
            <select value={c.desempeno ?? ""} onChange={(e) => set("desempeno", (e.target.value || undefined) as Candidato["desempeno"])}>
              <option value="">Sin definir</option>
              {DESEMPENO.map((d) => <option key={d.nivel} value={d.nivel}>{d.etiqueta}</option>)}
            </select>
          </div>
          <div className="field">
            <label>En el puesto desde</label>
            <input placeholder="01 mar 2023" value={c.antiguedadDesde ?? ""} onChange={(e) => set("antiguedadDesde", e.target.value)} />
          </div>
        </div>
      )}
      <div className="field"><label>Especialidades *</label><TagPicker options={ESPECIALIDADES} value={c.esp} onChange={(v) => set("esp", v)} addNew /></div>
      <div className="field"><label>Habilidades técnicas</label><TagPicker options={HARD_SKILLS} value={c.hard} onChange={(v) => set("hard", v)} addNew /></div>
      <div className="field"><label>Habilidades blandas</label><TagPicker options={SOFT_SKILLS} value={c.soft} onChange={(v) => set("soft", v)} /></div>
      <div className="field"><label>Resumen profesional</label><textarea rows={2} value={c.resumen} onChange={(e) => set("resumen", e.target.value)} /></div>
      <div className="field"><UploadPDF label="CV del candidato (opcional)" value={c.docsPerfil.cv} onDone={(n) => setC((x) => ({ ...x, docsPerfil: { ...x.docsPerfil, cv: n } }))} /></div>
      <button className="btn gold" disabled={!valido} onClick={() => onSave(c)}><CheckCircle2 size={15} /> Guardar candidato</button>
    </Modal>
  );
}
