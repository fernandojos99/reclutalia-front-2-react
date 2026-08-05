/**
 * Bloque "Perfil del candidato" en solo lectura. Es el mismo contenido que muestra
 * `VistaDescriptivo`, extraído aquí para reutilizarlo en el asistente y en la vista previa
 * de la publicación.
 *
 * `destacados` marca con un chip los campos que acaba de proponer el dictado por voz.
 */
import type { ReactNode } from "react";
import { Chip } from "../../common/Chip";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  /** Nombres de campo de `Requisito` a resaltar (los que cambió la voz). */
  destacados?: string[];
}

export function PerfilResumen({ req, destacados = [] }: Props) {
  const nuevo = (campo: string) => (destacados.includes(campo) ? <Chip tone="ai">Nuevo</Chip> : null);

  const Fila = ({ campo, l, c }: { campo: string; l: string; c: ReactNode }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>{l} {nuevo(campo)}</label>
      <div style={{ fontSize: 13.5 }}>{c}</div>
    </div>
  );

  const tags = (xs: string[], tone = "") =>
    xs.length ? <div className="tagpick">{xs.map((e) => <span key={e} className={"chip " + tone}>{e}</span>)}</div> : <span className="help">—</span>;

  return (
    <div className="grid2">
      <div>
        {req.areasConocimiento.length > 0 && (
          <Fila campo="areasConocimiento" l="Área de conocimiento" c={tags(req.areasConocimiento, "gold")} />
        )}
        <Fila campo="espRequeridas" l="Especialidades" c={tags(req.espRequeridas, "gold")} />
        <Fila campo="hardSkills" l="Habilidades técnicas" c={tags(req.hardSkills)} />
        <Fila campo="softSkills" l="Habilidades blandas" c={tags(req.softSkills)} />
        {req.aptitudes.length > 0 && <Fila campo="aptitudes" l="Aptitudes a evaluar" c={tags(req.aptitudes)} />}
      </div>
      <div>
        <div className="grid2">
          <Fila campo="anosExp" l="Experiencia mínima" c={req.expNoRelevante ? "No relevante" : `${req.anosExp} años`} />
          <Fila campo="educacion" l="Nivel de estudios" c={req.educacion} />
          <Fila campo="ubicacionTrabajo" l="Ubicación" c={req.ubicacionTrabajo} />
          <Fila campo="modalidad" l="Modalidad" c={req.modalidad} />
          <Fila campo="turno" l="Turno" c={req.turno || "Turno Mixto"} />
          {req.sede && <Fila campo="sede" l="Sede" c={`${req.tipoSede} · ${req.sede}`} />}
        </div>
      </div>
    </div>
  );
}
