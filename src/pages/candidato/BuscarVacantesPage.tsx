/** "Buscar vacantes" del candidato — port fiel de `BuscarVacantes` (filtros, orden, favoritos). */
import { useState } from "react";
import { MapPin, Heart, FileText, Calendar, AlertCircle } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { Chip } from "../../components/common/Chip";
import { MatchRing } from "../../components/common/MatchRing";
import { EstadoChip } from "../../components/common/EstadoChip";
import { DetalleVacanteModal, AplicarModal } from "../../components/candidato/buscarModals";
import { money, fechaVal } from "../../utils/format";
import { matchScore } from "../../utils/match";
import { procesoActivoEnOtra } from "../../utils/pipeline";
import { AREAS, CIUDADES } from "../../constants/catalogos";

const SUELDOS: Record<string, [number, number]> = {
  todos: [0, Infinity], s1: [0, 15000], s2: [15000, 25000], s3: [25000, Infinity],
};

export function BuscarVacantesPage() {
  const { vacantes, candidatos, actions } = useData();
  const { candId, toast } = useDemo();
  const cand = candidatos.find((c) => c.id === candId);

  const [fCiudad, setFCiudad] = useState("todas");
  const [fArea, setFArea] = useState("todas");
  const [fSueldo, setFSueldo] = useState("todos");
  const [orden, setOrden] = useState("match");
  const [asc, setAsc] = useState(false);
  const [soloFav, setSoloFav] = useState(false);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [aplicarA, setAplicarA] = useState<string | null>(null);

  if (!cand) return <p>Cargando…</p>;
  const favoritos = cand.favoritos ?? [];
  const enProceso = procesoActivoEnOtra(vacantes, cand.id);

  const lista = vacantes
    .filter((v) => v.estado === "abierta" && v.req.tipoVacante !== "Confidencial")
    .filter((v) => fCiudad === "todas" || v.req.ubicacionTrabajo === fCiudad)
    .filter((v) => fArea === "todas" || v.req.area === fArea)
    .filter((v) => { const [a, b] = SUELDOS[fSueldo]; return v.req.salarioMax >= a && v.req.salarioMin <= b; })
    .filter((v) => !soloFav || favoritos.includes(v.id))
    .map((v) => ({ v, match: matchScore(cand, v.req) }))
    .sort((x, y) => {
      const d = orden === "titulo" ? x.v.req.titulo.localeCompare(y.v.req.titulo, "es")
        : orden === "fecha" ? fechaVal(x.v.creada) - fechaVal(y.v.creada)
          : orden === "sueldo" ? x.v.req.salarioMax - y.v.req.salarioMax
            : x.match - y.match;
      return asc ? d : -d;
    });

  const toggleFav = (vid: string) => void actions.toggleFavVacante(cand.id, vid);
  const vDet = detalle ? vacantes.find((v) => v.id === detalle) : null;
  const vApl = aplicarA ? vacantes.find((v) => v.id === aplicarA) : null;

  return (
    <div>
      {enProceso && (
        <div className="card" style={{ marginBottom: 16, background: "var(--gold-soft)", borderColor: "#F0D9A5", display: "flex", gap: 10, alignItems: "center" }}>
          <AlertCircle size={18} color="var(--gold-dark)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>Ya tienes un proceso de selección activo. Podrás postularte a otra vacante cuando ese proceso concluya.</div>
        </div>
      )}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filtros-bar" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 130 }}><label>Ubicación</label>
            <select value={fCiudad} onChange={(e) => setFCiudad(e.target.value)}><option value="todas">Todas</option>{CIUDADES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field" style={{ marginBottom: 0, minWidth: 150 }}><label>Área</label>
            <select value={fArea} onChange={(e) => setFArea(e.target.value)}><option value="todas">Todas</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></div>
          <div className="field" style={{ marginBottom: 0, minWidth: 160 }}><label>Rango de sueldo</label>
            <select value={fSueldo} onChange={(e) => setFSueldo(e.target.value)}>
              <option value="todos">Todos</option><option value="s1">Hasta $15,000</option><option value="s2">$15,000 – $25,000</option><option value="s3">Más de $25,000</option>
            </select></div>
          <div className="field" style={{ marginBottom: 0, minWidth: 170 }}><label>Ordenar por</label>
            <select value={orden} onChange={(e) => { setOrden(e.target.value); setAsc(e.target.value === "titulo"); }}>
              <option value="match">Compatibilidad</option><option value="fecha">Tiempo de publicación</option><option value="titulo">Título (A–Z)</option><option value="sueldo">Sueldo</option>
            </select></div>
          <button className="btn ghost sm" onClick={() => setAsc((a) => !a)} title="Cambiar dirección del ordenamiento">{asc ? "↑ Ascendente" : "↓ Descendente"}</button>
          <button className={"tag" + (soloFav ? " on" : "")} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setSoloFav((f) => !f)}>
            <Heart size={12} fill={soloFav ? "currentColor" : "none"} /> Mis vacantes guardadas ({favoritos.length})
          </button>
        </div>
      </div>

      {!lista.length ? (
        <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
          {soloFav ? "Aún no tienes vacantes guardadas. Usa el corazón de cada tarjeta para guardarlas."
            : "No hay vacantes abiertas que coincidan con tus filtros. Ajusta los filtros o vuelve a intentarlo más tarde."}
        </div>
      ) : (
        <div className="vac-grid">
          {lista.map(({ v, match }) => {
            const p = v.pipeline[cand.id];
            const fav = favoritos.includes(v.id);
            return (
              <div className="card" key={v.id} style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 14.5 }}>{v.req.titulo}</b>
                    <div className="tagpick" style={{ marginTop: 6 }}>
                      <Chip>{v.req.area}</Chip>
                      <Chip icon={MapPin}>{v.req.ubicacionTrabajo} · {v.req.modalidad}</Chip>
                    </div>
                  </div>
                  <MatchRing v={match} />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>{v.req.descripcion.length > 110 ? v.req.descripcion.slice(0, 110).trimEnd() + "…" : v.req.descripcion}</div>
                {!v.req.sueldoOculto && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-dark)" }}>{money(v.req.sueldo ?? Math.round((v.req.salarioMin + v.req.salarioMax) / 2 / 500) * 500)} /mes</div>
                )}
                <div className="help" style={{ marginTop: -4, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} /> Publicada el {v.creada}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: "auto", flexWrap: "wrap" }}>
                  <button className="btn dark sm" onClick={() => setDetalle(v.id)}><FileText size={13} /> Ver detalles</button>
                  {p && <EstadoChip estado={p.estado} candView />}
                  <button className={"heart" + (fav ? " on" : "")} style={{ marginLeft: "auto" }} title={fav ? "Quitar de mis vacantes guardadas" : "Guardar vacante"} onClick={() => toggleFav(v.id)}>
                    <Heart size={15} fill={fav ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vDet && <DetalleVacanteModal v={vDet} cand={cand} p={vDet.pipeline[cand.id]} bloqueado={enProceso}
        onAplicar={() => { setAplicarA(vDet.id); setDetalle(null); }} onClose={() => setDetalle(null)} />}
      {vApl && <AplicarModal cand={cand} v={vApl}
        onSend={(msg) => { void actions.postularDirecto(vApl.id, cand.id, msg); setAplicarA(null); toast("¡Postulación enviada!"); }}
        onClose={() => setAplicarA(null)} />}
    </div>
  );
}
