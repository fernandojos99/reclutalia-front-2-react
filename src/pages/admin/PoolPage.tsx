/** Admin · Marketplace de talento: tabla de candidatos + alta/edición (port fiel). */
import { useState } from "react";
import { Search, Plus, Edit3, Download } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { CandidatoForm } from "../../components/admin/CandidatoForm";
import { MOVILIDAD } from "../../constants/catalogos";
import { descargarCV } from "../../utils/descargarCV";
import type { Candidato } from "../../types/models/domain";

export function PoolPage() {
  const { candidatos, actions } = useData();
  const { toast } = useDemo();
  const [q, setQ] = useState("");
  // undefined = cerrado; null = alta; Candidato = edición
  const [editC, setEditC] = useState<Candidato | null | undefined>(undefined);

  // Defensivo: algún campo array podría venir mal formado desde la BD; nunca debe tumbar la vista.
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v : v == null ? [] : [String(v)]);
  /** Entrada del catálogo de movilidad del candidato, o undefined si no aplica (externos). */
  const mov = (c: Candidato) => MOVILIDAD.find((m) => m.nivel === c.movilidad);
  const filtrados = candidatos.filter((c) =>
    (`${c.nombre ?? ""} ${c.area ?? ""} ${arr(c.esp).join()} ${arr(c.hard).join()}`).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: 12, color: "var(--gray)" }} />
          <input placeholder="Buscar por nombre, área o skill…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <button className="btn gold" onClick={() => setEditC(null)}><Plus size={15} /> Subir candidato</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
        <table className="table">
          <thead><tr><th>CANDIDATO</th><th>ÁREA</th><th>ESPECIALIDADES</th><th>CIUDAD</th><th>TIPO</th><th>MOVILIDAD</th><th></th></tr></thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id}>
                <td><b>{c.nombre}</b><div className="help">{c.puesto}</div></td>
                <td>{c.area}<div className="help">{c.exp} años de experiencia</div></td>
                <td>{arr(c.esp).slice(0, 2).join(", ")}</td>
                <td>{c.ciudad}</td>
                <td><Chip tone={c.tipo === "interno" ? "gold" : ""}>{c.tipo}</Chip></td>
                {/* Semáforo de elegibilidad. Solo los internos tienen movilidad: un externo no se
                    "mueve" dentro del grupo, todavía no está dentro. */}
                <td>{mov(c) ? <Chip tone={mov(c)!.tono}>{mov(c)!.corto}</Chip> : <span className="help">—</span>}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn ghost sm" onClick={() => setEditC(c)}><Edit3 size={12} /> Editar</button>{" "}
                  <button className="btn ghost sm" onClick={() => descargarCV(c)}><Download size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {editC !== undefined && (
        <CandidatoForm inicial={editC} onClose={() => setEditC(undefined)}
          onSave={(c) => { void actions.guardarCandidato(c); setEditC(undefined); toast("Perfil guardado en el inventario"); }} />
      )}
    </div>
  );
}
