/** Pantalla 4 · Conoce y verifica las herramientas de trabajo (dependen del puesto). */
import { Desplegable } from "../../common/Desplegable";
import { AccionesPaso } from "./AccionesPaso";
import { herramientas } from "../../../constants/paqueteVacante";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  hecho: boolean;
  bloqueado?: boolean;
  onConfirmar: () => void;
}

export function PasoHerramientas({ req, hecho, bloqueado, onConfirmar }: Props) {
  return (
    <div>
      <p className="help" style={{ marginTop: 0, marginBottom: 12 }}>
        Herramientas que se entregan el primer día para <b>{req.titulo}</b>. Si falta alguna, avísale al
        administrador antes de publicar.
      </p>
      {herramientas(req).map((h) => (
        <Desplegable key={h.titulo} titulo={h.titulo} icono={h.icono} extra={h.extra} detalle={<p>{h.detalle}</p>} />
      ))}
      <AccionesPaso hecho={hecho} bloqueado={bloqueado} onConfirmar={onConfirmar} />
    </div>
  );
}
