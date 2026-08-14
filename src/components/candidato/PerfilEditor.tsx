/** Editor del perfil del propio candidato — port fiel de `PerfilEditor` (pestañas perfil/documentos). */
import { useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Modal } from "../common/Modal";
import { UploadPDF, UploadFoto, TagInput } from "../ui/uploads";
import { EDUCACION, TIPOS_CURSO } from "../../constants/catalogos";
import type { Candidato, DocsPerfil } from "../../types/models/domain";

const INTERESES = ["Emplearme", "Crecer mi puesto", "Cambiar de área"];

export function PerfilEditor({ cand, onSave, onClose, tabInicial = 0 }: {
  cand: Candidato; onSave: (c: Candidato) => void; onClose: () => void;
  /** Pestaña en la que abre: 0 perfil · 1 cursos y puestos · 2 documentos. */
  tabInicial?: number;
}) {
  const [c, setC] = useState<Candidato>(() => ({
    ...cand,
    esp: [...(cand.esp ?? [])], hard: [...(cand.hard ?? [])], soft: [...(cand.soft ?? [])],
    experiencia: (cand.experiencia ?? []).map((x) => ({ ...x })),
    educacion: (cand.educacion ?? []).map((x) => ({ ...x })),
    intereses: [...(cand.intereses ?? [])],
    cursos: (cand.cursos ?? []).map((x) => ({ ...x })),
    puestosInteres: [...(cand.puestosInteres ?? [])],
    docsPerfil: {
      ine: cand.docsPerfil?.ine ?? null, curp: cand.docsPerfil?.curp ?? null,
      rfc: cand.docsPerfil?.rfc ?? null, domicilio: cand.docsPerfil?.domicilio ?? null,
      estudios: cand.docsPerfil?.estudios ?? null, cv: cand.docsPerfil?.cv ?? null,
      certificaciones: [...(cand.docsPerfil?.certificaciones ?? [])],
    },
  }));
  const [tab, setTab] = useState(tabInicial);
  const set = <K extends keyof Candidato>(k: K, v: Candidato[K]) => setC((x) => ({ ...x, [k]: v }));
  const setDoc = <K extends keyof DocsPerfil>(k: K, v: DocsPerfil[K]) => setC((x) => ({ ...x, docsPerfil: { ...x.docsPerfil, [k]: v } }));

  const addExp = () => set("experiencia", [...c.experiencia, { puesto: "", empresa: "", inicio: "", fin: "" }]);
  const setExp = (i: number, k: string, v: string) => set("experiencia", c.experiencia.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const delExp = (i: number) => set("experiencia", c.experiencia.filter((_, j) => j !== i));
  const addEdu = () => set("educacion", [...c.educacion, { institucion: "", titulo: "", inicio: "", fin: "" }]);
  const setEdu = (i: number, k: string, v: string) => set("educacion", c.educacion.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const delEdu = (i: number) => set("educacion", c.educacion.filter((_, j) => j !== i));
  const toggleInt = (o: string) => set("intereses", c.intereses.includes(o) ? c.intereses.filter((x) => x !== o) : [...c.intereses, o]);
  // Cursos, certificados y licencias (pestaña de movilidad interna).
  const cursos = c.cursos ?? [];
  const addCurso = () => set("cursos", [...cursos, { nombre: "", tipo: "curso" as const, fecha: "", institucion: "" }]);
  const setCurso = (i: number, k: string, v: string) =>
    set("cursos", cursos.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const delCurso = (i: number) => set("cursos", cursos.filter((_, j) => j !== i));

  const setCert = (i: number, n: string) => setDoc("certificaciones", c.docsPerfil.certificaciones.map((x, j) => (j === i ? n : x)));
  const addCert = (n: string) => { if (n) setDoc("certificaciones", [...c.docsPerfil.certificaciones, n]); };
  const delCert = (i: number) => setDoc("certificaciones", c.docsPerfil.certificaciones.filter((_, j) => j !== i));

  return (
    <Modal onClose={onClose} wide>
      <h3 style={{ marginBottom: 14 }}>Editar perfil</h3>
      <div className="tabs">
        <button className={"tab" + (tab === 0 ? " on" : "")} onClick={() => setTab(0)}>Mi perfil</button>
        {/* Solo tiene sentido para el colaborador interno: son los datos de su ficha de talento. */}
        {c.tipo === "interno" && (
          <button className={"tab" + (tab === 1 ? " on" : "")} onClick={() => setTab(1)}>Cursos y puestos</button>
        )}
        <button className={"tab" + (tab === 2 ? " on" : "")} onClick={() => setTab(2)}>Mis documentos</button>
      </div>

      {tab === 0 && (
        <>
          <div className="field"><UploadFoto value={c.foto} nombre={c.nombre} onDone={(v) => set("foto", v)} /></div>
          <div className="field"><label>Nombre completo</label><input value={c.nombre} onChange={(e) => set("nombre", e.target.value)} />
            <div className="help">Debe ser tu nombre tal como aparece en tu identificación oficial.</div></div>
          <div className="field"><label>Título</label><input value={c.puesto} onChange={(e) => set("puesto", e.target.value)} placeholder="Ejecutivo de ventas | Marketing | Estrategia E-commerce" /></div>
          <div className="field"><label>Descripción</label><textarea rows={3} value={c.resumen} onChange={(e) => set("resumen", e.target.value)} placeholder="Un párrafo describiéndote profesionalmente." /></div>
          <div className="grid2">
            <div className="field"><label>Correo</label><input value={c.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="field"><label>Contacto</label><input value={c.tel} onChange={(e) => set("tel", e.target.value)} /></div>
          </div>

          <div className="field">
            <label>Experiencia</label>
            {c.experiencia.map((e, i) => (
              <div className="trow" key={i} style={{ flexWrap: "wrap" }}>
                <input placeholder="Puesto" value={e.puesto} onChange={(ev) => setExp(i, "puesto", ev.target.value)} style={{ flex: "1 1 170px" }} />
                <input placeholder="Empresa" value={e.empresa} onChange={(ev) => setExp(i, "empresa", ev.target.value)} style={{ flex: "1 1 150px" }} />
                <input type="month" value={e.inicio} onChange={(ev) => setExp(i, "inicio", ev.target.value)} style={{ flex: "0 1 140px" }} title="Inicio" />
                <input type="month" value={e.fin} onChange={(ev) => setExp(i, "fin", ev.target.value)} style={{ flex: "0 1 140px" }} title="Fin (vacío = actual)" />
                <button className="btn ghost sm" onClick={() => delExp(i)} title="Eliminar"><X size={13} /></button>
              </div>
            ))}
            <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={addExp}><Plus size={13} /> Agregar experiencia</button>
          </div>

          <div className="field">
            <label>Educación</label>
            {c.educacion.map((e, i) => (
              <div className="trow" key={i} style={{ flexWrap: "wrap" }}>
                <input placeholder="Institución" value={e.institucion} onChange={(ev) => setEdu(i, "institucion", ev.target.value)} style={{ flex: "1 1 170px" }} />
                <input placeholder="Título / grado" value={e.titulo} onChange={(ev) => setEdu(i, "titulo", ev.target.value)} style={{ flex: "1 1 150px" }} />
                <input type="month" value={e.inicio} onChange={(ev) => setEdu(i, "inicio", ev.target.value)} style={{ flex: "0 1 140px" }} title="Inicio" />
                <input type="month" value={e.fin} onChange={(ev) => setEdu(i, "fin", ev.target.value)} style={{ flex: "0 1 140px" }} title="Fin" />
                <button className="btn ghost sm" onClick={() => delEdu(i)} title="Eliminar"><X size={13} /></button>
              </div>
            ))}
            <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={addEdu}><Plus size={13} /> Agregar educación</button>
          </div>

          <div className="field" style={{ maxWidth: 340 }}>
            <label>Nivel máximo de estudios</label>
            <select value={c.edu} onChange={(e) => set("edu", e.target.value)}>{EDUCACION.map((a) => <option key={a}>{a}</option>)}</select>
          </div>

          <div className="field"><label>Habilidades</label>
            <TagInput value={c.soft} onChange={(v) => set("soft", v)} max={10} placeholder="Ej. Negociación, liderazgo…" help="Máx. 10. Ejemplos: negociación, liderazgo, análisis de datos, comunicación efectiva." /></div>
          <div className="field"><label>Herramientas</label>
            <TagInput value={c.hard} onChange={(v) => set("hard", v)} max={10} placeholder="Ej. Excel, Power BI…" help="Máx. 10. Ejemplos: Excel, Office, Power BI, ChatGPT, Salesforce, SAP." /></div>

          <div className="field"><label>Intereses</label>
            <div className="tagpick">{INTERESES.map((o) => <button type="button" key={o} className={"tag" + (c.intereses.includes(o) ? " on" : "")} onClick={() => toggleInt(o)}>{o}</button>)}</div>
          </div>
        </>
      )}

      {/* Cursos y puestos de interés: lo que el colaborador puede mantener de su ficha de talento.
          El resto de la ficha —semáforo, desempeño, actas— no se edita aquí a propósito: no son
          suyos, los deciden el administrador y su formador. */}
      {tab === 1 && (
        <>
          <p className="help" style={{ marginBottom: 12 }}>
            Esto es lo que aparece en tu ficha de talento y lo que el agente de movilidad usa para
            proponerte puestos y armar tu plan.
          </p>

          <div className="field">
            <label>Cursos, certificados y licencias</label>
            {!cursos.length && <div className="help">Todavía no has registrado ninguno.</div>}
            {cursos.map((cu, i) => (
              <div key={i} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <input placeholder="Nombre" value={cu.nombre} onChange={(e) => setCurso(i, "nombre", e.target.value)} style={{ flex: "1 1 200px" }} />
                <select value={cu.tipo} onChange={(e) => setCurso(i, "tipo", e.target.value)} style={{ flex: "0 1 130px" }}>
                  {TIPOS_CURSO.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                </select>
                <input placeholder="Institución" value={cu.institucion ?? ""} onChange={(e) => setCurso(i, "institucion", e.target.value)} style={{ flex: "1 1 160px" }} />
                <input placeholder="14 mar 2025" value={cu.fecha} onChange={(e) => setCurso(i, "fecha", e.target.value)} style={{ flex: "0 1 130px" }} title="Fecha de obtención; déjalo vacío si sigue en curso" />
                <button className="btn ghost sm" onClick={() => delCurso(i)} title="Eliminar"><X size={13} /></button>
              </div>
            ))}
            <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={addCurso}><Plus size={13} /> Agregar curso</button>
          </div>

          <div className="field">
            <label>Puestos de interés</label>
            <TagInput value={c.puestosInteres ?? []} onChange={(v) => set("puestosInteres", v)} max={6}
              placeholder="Ej. Coordinador de call center…"
              help="Máx. 6. También puedes añadirlos con el corazón de cada vacante en tu ranking." />
          </div>
        </>
      )}

      {tab === 2 && (
        <>
          <p className="help" style={{ marginBottom: 12 }}>Repositorio personal de documentos reutilizables. Se aprovecharán al aplicar a vacantes. Solo PDF · máximo 1 MB por archivo.</p>
          <label>Identidad</label>
          <div style={{ marginTop: 6 }}>
            <UploadPDF label="Identificación oficial (INE)" value={c.docsPerfil.ine} onDone={(n) => setDoc("ine", n)} onDelete={() => setDoc("ine", null)} />
            <UploadPDF label="CURP" value={c.docsPerfil.curp} onDone={(n) => setDoc("curp", n)} onDelete={() => setDoc("curp", null)} />
            <UploadPDF label="Constancia de situación fiscal (RFC)" value={c.docsPerfil.rfc} onDone={(n) => setDoc("rfc", n)} onDelete={() => setDoc("rfc", null)} />
          </div>
          <label style={{ marginTop: 16, display: "block" }}>Domicilio</label>
          <div style={{ marginTop: 6 }}>
            <UploadPDF label="Comprobante de domicilio" value={c.docsPerfil.domicilio} onDone={(n) => setDoc("domicilio", n)} onDelete={() => setDoc("domicilio", null)} />
          </div>
          <label style={{ marginTop: 16, display: "block" }}>Formación</label>
          <div style={{ marginTop: 6 }}>
            <UploadPDF label="Comprobante de estudios / título" value={c.docsPerfil.estudios} onDone={(n) => setDoc("estudios", n)} onDelete={() => setDoc("estudios", null)} />
            {c.docsPerfil.certificaciones.map((n, i) => (
              <UploadPDF key={i} label={`Certificación ${i + 1}`} value={n} onDone={(nm) => setCert(i, nm)} onDelete={() => delCert(i)} />
            ))}
            <UploadPDF label="Agregar diplomado o certificación" value={null} onDone={(n) => addCert(n)} />
          </div>
          <label style={{ marginTop: 16, display: "block" }}>CV</label>
          <div style={{ marginTop: 6 }}>
            <UploadPDF label="Currículum actualizado" value={c.docsPerfil.cv} onDone={(n) => setDoc("cv", n)} onDelete={() => setDoc("cv", null)} />
          </div>
        </>
      )}

      <button className="btn gold" style={{ marginTop: 20 }} onClick={() => onSave(c)}><CheckCircle2 size={15} /> Guardar cambios</button>
    </Modal>
  );
}
