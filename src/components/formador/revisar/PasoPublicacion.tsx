/**
 * Pantallas 4a y 7 · Publicación.
 * Es la pantalla 1 vuelta anuncio: mismo contenido (MRFN + perfil) pero en solo lectura y con
 * el resumen del paquete que se acaba de verificar. Las acciones del pie las inyecta quien la usa
 * (publicar, o aplicar/descartar lo que propuso el dictado por voz).
 */
import type { ReactNode } from "react";
import { MapPin, Clock, CheckCircle2, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chip } from "../../common/Chip";
import { PerfilResumen } from "./PerfilResumen";
import { bonos, herramientas, sueldoMensual, BENEFICIOS } from "../../../constants/paqueteVacante";
import { money } from "../../../utils/format";
import type { Requisito } from "../../../types/models/domain";

/**
 * Encabezados en negrita del markdown de `descripcion` que sí se muestran. El resto
 * ("Perfil ideal del candidato", "Oferta de valor", el cierre) lo repiten más abajo los
 * bloques Requisitos y Lo que ofrecemos, así que se recortan aquí.
 */
const SECCIONES_DESC = ["Objetivo del puesto", "Funciones principales"];

/** Corta la descripción en el primer encabezado `**…**` que no esté en la lista permitida. */
function recortarDescripcion(md: string): string {
  const lineas = md.split("\n");
  const corte = lineas.findIndex((l) => {
    const m = l.trim().match(/^\*\*(.+?)\*\*$/);
    return m ? !SECCIONES_DESC.includes(m[1].trim()) : false;
  });
  // Sin encabezados reconocibles (descripción con otra estructura): se respeta íntegra.
  return corte === -1 ? md : lineas.slice(0, corte).join("\n").trimEnd();
}

interface Props {
  req: Requisito;
  /** Campos que resaltar como recién propuestos (dictado por voz). */
  destacados?: string[];
  acciones: ReactNode;
}

export function PasoPublicacion({ req, destacados, acciones }: Props) {
  /** Un grupo de "Lo que ofrecemos": subtítulo + puntos con palomita. */
  const grupo = (titulo: string, items: string[]) => (
    <div className="ofrece-grupo">
      <div className="ofrece-sub">{titulo}</div>
      <ul className="ofrece-lista">
        {items.map((x) => (
          <li key={x}><CheckCircle2 size={14} />{x}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <div className="pub-hero">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <h2>{req.titulo}</h2>
          {req.tipoVacante === "Confidencial" && <Chip tone="gold" icon={ShieldCheck}>Confidencial</Chip>}
        </div>
        <div className="pub-sueldo">{money(sueldoMensual(req))} <span style={{ fontSize: 13, fontWeight: 600, color: "#C9C9C9" }}>mensual bruto</span></div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <Chip icon={MapPin}>{req.ubicacionTrabajo} · {req.modalidad}</Chip>
          <Chip icon={Clock}>{req.turno || "Turno Mixto"}</Chip>
          <Chip>{req.expNoRelevante ? "Experiencia no relevante" : `${req.anosExp}+ años de experiencia`}</Chip>
          <Chip>{req.educacion}</Chip>
          {req.numVacantes > 1 && <Chip>{req.numVacantes} posiciones</Chip>}
        </div>
      </div>

      {req.descripcion && (
        <>
          <div className="rev-titulin">Descripción</div>
          <div className="desc-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{recortarDescripcion(req.descripcion)}</ReactMarkdown>
          </div>
        </>
      )}

      <div className="rev-titulin">Requisitos</div>
      <PerfilResumen req={req} destacados={destacados} sinCondiciones />

      <div className="rev-titulin">Lo que ofrecemos</div>
      {grupo("Compensaciones y bonos", bonos(req).map((b) => b.titulo))}
      {grupo("Beneficios", BENEFICIOS.map((b) => b.titulo))}
      {grupo("Herramientas de trabajo", herramientas(req).map((h) => h.titulo))}

      <div className="paso-acciones">{acciones}</div>
    </div>
  );
}
