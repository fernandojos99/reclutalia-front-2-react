/**
 * Formador · Movilidad interna. Dos secciones: la tabla de la plantilla y el estatus de equipo.
 *
 * El equipo son los candidatos INTERNOS cuyo `formadorId` es el del formador activo: la relación ya
 * existía en los datos, no hizo falta inventar nada.
 */
import { useState } from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useData } from "../../store/DataProvider";
import { useDemo } from "../../contexts/DemoContext";
import { PerfilModal } from "../../components/candidato/PerfilModal";
import { TablaEquipo } from "../../components/movilidad/TablaEquipo";
import { EstatusEquipo } from "../../components/movilidad/EstatusEquipo";
import { ProcesoMovilidadModal } from "../../components/movilidad/ProcesoMovilidadModal";
import { enMovilidad } from "../../utils/movilidad";
import type { Candidato } from "../../types/models/domain";

const SECCIONES = ["Mi plantilla", "Estatus de equipo"] as const;

export function MovilidadInternaPage() {
  const { candidatos, vacantes, formadores } = useData();
  const { formadorId } = useDemo();
  const [sec, setSec] = useState(0);
  const [perfil, setPerfil] = useState<Candidato | null>(null);
  const [proceso, setProceso] = useState<Candidato | null>(null);

  const equipo = candidatos.filter((c) => c.tipo === "interno" && c.formadorId === formadorId);
  const enProcesoMovilidad = enMovilidad(equipo);
  const vacanteDe = (c: Candidato) => vacantes.find((v) => v.id === c.movilidadActivaVacId);

  return (
    <div>
      {/* ETAPA 1: aviso de los procesos de movilidad abiertos. Al pulsarlo se abre la ventana con el
          puesto que quedaría por cubrir y las fichas que podrían cubrirlo. */}
      {enProcesoMovilidad.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setProceso(c)}
          className="card"
          style={{
            display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left",
            marginBottom: 12, background: "var(--gold-soft)", borderColor: "#F0D9A5", cursor: "pointer",
          }}
        >
          <AlertCircle size={18} color="var(--gold-dark)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, flex: 1 }}>
            <b>{c.nombre}</b> inició un proceso de movilidad
            {vacanteDe(c) ? ` hacia "${vacanteDe(c)!.req.titulo}"` : ""}. Revisa quién podría cubrir su puesto.
          </div>
          <ChevronRight size={16} color="var(--gold-dark)" />
        </button>
      ))}

      <div className="tabs">
        {SECCIONES.map((s, i) => (
          <button key={s} className={"tab" + (sec === i ? " on" : "")} onClick={() => setSec(i)}>{s}</button>
        ))}
      </div>

      {sec === 0
        ? <TablaEquipo equipo={equipo} vacantes={vacantes} onVerPerfil={setPerfil} />
        : <EstatusEquipo equipo={equipo} vacantes={vacantes} onVerFicha={setPerfil} />}

      {/* `PerfilModal` ya trae la pestaña "Ficha de talento" con el historial, que solo se ve desde
          la vista del formador. Por eso se reusa en vez de hacer otra ventana. */}
      {proceso && (
        <ProcesoMovilidadModal
          cand={proceso}
          vacante={vacanteDe(proceso)}
          candidatos={candidatos}
          onVerFicha={setPerfil}
          onClose={() => setProceso(null)}
        />
      )}

      {perfil && (
        <PerfilModal
          cand={perfil}
          onClose={() => setPerfil(null)}
          formadores={formadores}
          formadorActual={formadorId}
        />
      )}
    </div>
  );
}
