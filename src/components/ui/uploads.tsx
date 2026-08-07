/** Componentes de subida y captura (portados de App.jsx): UploadPDF, UploadFoto, TagPicker, TagInput. */
import { useRef, useState } from "react";
import { CheckCircle2, FileText, AlertCircle, Upload, User, Plus, X, Eye } from "lucide-react";

/**
 * Abre una vista simulada del documento en una pestaña nueva.
 * Los archivos no se guardan: de `docsContrato` solo se conserva el NOMBRE, así que no hay PDF que
 * servir. Se genera una página con los datos que sí tenemos.
 */
function verDocumentoSimulado(label: string, nombre: string): void {
  const html = `<!doctype html><meta charset="utf-8"><title>${label}</title>
<body style="font-family:system-ui;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#F3F1EA">
<div style="background:#fff;padding:40px 48px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.12);max-width:520px;text-align:center">
<div style="font-size:11px;letter-spacing:.08em;color:#8A8578;text-transform:uppercase">Documento en expediente</div>
<h1 style="font-size:22px;margin:10px 0 6px">${label}</h1>
<p style="color:#5B564C;font-size:14px;margin:0 0 18px">${nombre}</p>
<p style="color:#8A8578;font-size:12.5px;line-height:1.6;margin:0">Vista simulada. En el prototipo los archivos no se almacenan, solo su nombre.</p>
</div></body>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function UploadPDF({ label, value, onDone, onDelete, actual, onUsarActual }: {
  label: string; value: string | null; onDone: (name: string) => void; onDelete?: () => void;
  /** Documento que la persona ya tiene en su expediente (candidatos internos). */
  actual?: string | null;
  /** Reutilizar el del expediente en vez de subir uno nuevo. */
  onUsarActual?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setErr("Solo se permiten archivos PDF."); return; }
    if (f.size > 1024 * 1024) { setErr("El archivo supera el límite de 1 MB."); return; }
    setErr(""); onDone(f.name);
  };
  // Con expediente previo y sin documento confirmado aún, se ofrece actualizarlo o reutilizarlo.
  const conExpediente = !!actual && !value;
  return (
    <div className={"check-item" + (value ? " done" : "")}>
      {value ? <CheckCircle2 size={20} color="var(--ok)" /> : <FileText size={20} color="var(--gray)" />}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div className="help">
          {value ? `Cargado: ${value}` : conExpediente ? `En tu expediente: ${actual}` : "PDF · máximo 1 MB"}
        </div>
        {err && <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 3 }}><AlertCircle size={11} style={{ verticalAlign: -1 }} /> {err}</div>}
      </div>
      <input type="file" accept="application/pdf" ref={ref} style={{ display: "none" }} onChange={pick} />
      {conExpediente && (
        <>
          <button className="btn ghost sm" onClick={() => ref.current?.click()}><Upload size={13} /> Actualizar</button>
          <button className="btn ghost sm" title="Ver el documento actual"
            onClick={() => verDocumentoSimulado(label, actual!)}><Eye size={13} /></button>
          {onUsarActual && <button className="btn ghost sm" onClick={onUsarActual}>Usar actual</button>}
        </>
      )}
      {!value && !conExpediente && <button className="btn ghost sm" onClick={() => ref.current?.click()}><Upload size={13} /> Subir archivo</button>}
      {value && <button className="btn ghost sm" onClick={() => ref.current?.click()}>Reemplazar</button>}
      {value && onDelete && <button className="btn ghost sm" onClick={() => { setErr(""); onDelete(); }}>Eliminar</button>}
    </div>
  );
}

export function UploadFoto({ value, nombre, onDone }: {
  value: string | null; nombre?: string; onDone: (v: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) { setErr("Solo se permiten imágenes JPG o PNG."); return; }
    if (f.size > 2 * 1024 * 1024) { setErr("La imagen supera el límite de 2 MB."); return; }
    setErr("");
    const r = new FileReader();
    r.onload = () => onDone(r.result as string);
    r.readAsDataURL(f);
  };
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      {value ? <img className="fotoprev" src={value} alt={nombre || "Foto de perfil"} /> : <div className="fotoprev"><User size={26} /></div>}
      <div>
        <input type="file" accept="image/png,image/jpeg" ref={ref} style={{ display: "none" }} onChange={pick} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn ghost sm" onClick={() => ref.current?.click()}><Upload size={13} /> {value ? "Cambiar foto" : "Subir foto"}</button>
          {value && <button className="btn ghost sm" onClick={() => { setErr(""); onDone(null); }}>Quitar</button>}
        </div>
        <div className="help">JPG o PNG · máximo 2 MB</div>
        {err && <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 3 }}><AlertCircle size={11} style={{ verticalAlign: -1 }} /> {err}</div>}
      </div>
    </div>
  );
}

export function TagPicker({ options, value, onChange, addNew }: {
  options: readonly string[]; value: string[]; onChange: (v: string[]) => void; addNew?: boolean;
}) {
  const [nuevo, setNuevo] = useState("");
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div>
      <div className="tagpick">
        {options.map((o) => <button type="button" key={o} className={"tag" + (value.includes(o) ? " on" : "")} onClick={() => toggle(o)}>{o}</button>)}
      </div>
      {/* El layout de `.tag-add` va en la clase, NO inline: un `style` inline ganaría siempre a la
          regla de `base.css` que hoy oculta este bloque. */}
      {addNew && (
        <div className="tag-add">
          <input placeholder="Agregar otra opción…" value={nuevo} onChange={(e) => setNuevo(e.target.value)} style={{ maxWidth: 260 }} />
          <button type="button" className="btn ghost sm" onClick={() => { if (nuevo.trim()) { onChange([...value, nuevo.trim()]); setNuevo(""); } }}><Plus size={13} /> Agregar</button>
        </div>
      )}
    </div>
  );
}

export function TagInput({ value, onChange, max = 10, placeholder, help }: {
  value: string[]; onChange: (v: string[]) => void; max?: number; placeholder?: string; help?: string;
}) {
  const [nuevo, setNuevo] = useState("");
  const lleno = value.length >= max;
  const add = () => {
    const t = nuevo.trim();
    if (!t) return;
    if (value.includes(t) || lleno) { setNuevo(""); return; }
    onChange([...value, t]); setNuevo("");
  };
  return (
    <div>
      {value.length > 0 && (
        <div className="taginput">
          {value.map((t) => (
            <span key={t} className="tagx">{t}
              <button type="button" title="Quitar" onClick={() => onChange(value.filter((x) => x !== t))}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: value.length > 0 ? 8 : 0 }}>
        <input placeholder={placeholder || "Escribe y presiona Enter…"} value={nuevo} disabled={lleno}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} style={{ maxWidth: 320 }} />
        <button type="button" className="btn ghost sm" disabled={lleno || !nuevo.trim()} onClick={add}><Plus size={13} /> Agregar</button>
      </div>
      {help && <div className="help">{help}</div>}
      {lleno && <div className="help">Máximo {max} elementos.</div>}
    </div>
  );
}
