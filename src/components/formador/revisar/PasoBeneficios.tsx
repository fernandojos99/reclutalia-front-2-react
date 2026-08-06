/** Pantalla 3 · Conoce y verifica los beneficios (seguro de vida, médico, fondo de ahorros e IMSS). */
import { FilaInfo } from "../../common/InfoTip";
import { AccionesPaso } from "./AccionesPaso";
import { BENEFICIOS } from "../../../constants/paqueteVacante";

interface Props {
  hecho: boolean;
  bloqueado?: boolean;
  onConfirmar: () => void;
}

export function PasoBeneficios({ hecho, bloqueado, onConfirmar }: Props) {
  return (
    <div>
      <p className="help" style={{ marginTop: 0, marginBottom: 12 }}>
        Estos son los beneficios que se le ofrecerán a la persona que ocupe la posición. Pasa el cursor por
        la ⓘ de cada uno para ver la cobertura y desde cuándo aplica.
      </p>
      {BENEFICIOS.map((b) => (
        <FilaInfo key={b.titulo} titulo={b.titulo} icono={b.icono} extra={b.extra} detalle={<p>{b.detalle}</p>} />
      ))}
      <AccionesPaso hecho={hecho} bloqueado={bloqueado} onConfirmar={onConfirmar} />
    </div>
  );
}
