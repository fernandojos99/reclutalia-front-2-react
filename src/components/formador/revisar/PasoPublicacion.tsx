/**
 * Pantallas 4a y 7 · Publicación.
 * Es la pantalla 1 vuelta anuncio: mismo contenido (MRFN + perfil) pero en solo lectura y con
 * el resumen del paquete que se acaba de verificar. Las acciones del pie las inyecta quien la usa
 * (publicar, o aplicar/descartar lo que propuso el dictado por voz).
 */
import type { ReactNode } from "react";
import { MapPin, Clock, Compass, ListChecks, Ban, Target, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Desplegable } from "../../common/Desplegable";
import { Chip } from "../../common/Chip";
import { PerfilResumen } from "./PerfilResumen";
import { mrfn, bonos, herramientas, sueldoMensual, BENEFICIOS, PRESTACIONES } from "../../../constants/paqueteVacante";
import { money } from "../../../utils/format";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  /** Campos que resaltar como recién propuestos (dictado por voz). */
  destacados?: string[];
  acciones: ReactNode;
}

export function PasoPublicacion({ req, destacados, acciones }: Props) {
  const m = mrfn(req);
  const lista = (xs: string[]) => xs.join(" · ");

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
          <div className="desc-md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{req.descripcion}</ReactMarkdown></div>
        </>
      )}

      <div className="rev-titulin">Mandato, responsabilidades y funciones</div>
      <Desplegable titulo="Mandato" icono={Compass} detalle={<p>{m.mandato}</p>} />
      <Desplegable titulo="Responsabilidades" icono={Target}
        detalle={<ul>{m.responsabilidades.map((x) => <li key={x}>{x}</li>)}</ul>} />
      <Desplegable titulo="Funciones" icono={ListChecks}
        detalle={<ul>{m.funciones.map((x) => <li key={x}>{x}</li>)}</ul>} />
      <Desplegable titulo="No funciones" icono={Ban}
        detalle={<ul>{m.noFunciones.map((x) => <li key={x}>{x}</li>)}</ul>} />

      <div className="rev-titulin">Perfil del candidato</div>
      <PerfilResumen req={req} destacados={destacados} />

      <div className="rev-titulin">Lo que ofrecemos</div>
      <Desplegable titulo="Compensaciones y bonos" extra={`${bonos(req).length} conceptos`}
        detalle={<p>{lista(bonos(req).map((b) => b.titulo))}</p>} />
      <Desplegable titulo="Prestaciones" extra={`${PRESTACIONES.length} conceptos`}
        detalle={<p>{lista(PRESTACIONES.map((p) => p.titulo))}</p>} />
      <Desplegable titulo="Beneficios" extra={`${BENEFICIOS.length} conceptos`}
        detalle={<p>{lista(BENEFICIOS.map((b) => b.titulo))}</p>} />
      <Desplegable titulo="Herramientas de trabajo" extra={`${herramientas(req).length} conceptos`}
        detalle={<p>{lista(herramientas(req).map((h) => h.titulo))}</p>} />

      <div className="paso-acciones">{acciones}</div>
    </div>
  );
}
