/**
 * Bloque "Requisitos" del anuncio, en solo lectura.
 *
 * Las condiciones del puesto (experiencia, estudios, ubicación, modalidad, turno y sede) NO salen
 * aquí: ya están en los chips de la caja oscura y repetirlas solo alargaba la lectura.
 *
 * Todos los chips van en el gris neutro por defecto. Antes las áreas de conocimiento y las de
 * experiencia iban en dorado, lo que las hacía parecer más importantes que las habilidades.
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

  const tags = (xs: string[]) =>
    xs.length ? <div className="tagpick">{xs.map((e) => <span key={e} className="chip">{e}</span>)}</div> : <span className="help">—</span>;

  return (
    <div>
      {req.areasConocimiento.length > 0 && (
        <Fila campo="areasConocimiento" l="Áreas de conocimiento" c={tags(req.areasConocimiento)} />
      )}
      {/* `espRequeridas` conserva su nombre en el dominio; solo cambia la etiqueta visible. */}
      <Fila campo="espRequeridas" l="Áreas de experiencia" c={tags(req.espRequeridas)} />
      <Fila campo="hardSkills" l="Habilidades técnicas" c={tags(req.hardSkills)} />
      <Fila campo="softSkills" l="Habilidades blandas" c={tags(req.softSkills)} />
    </div>
  );
}
