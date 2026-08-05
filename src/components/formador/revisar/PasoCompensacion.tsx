/** Pantalla 2 · Paquete de compensación: sueldo, bonos, prestaciones y otros. */
import { Banknote } from "lucide-react";
import { Desplegable } from "../../common/Desplegable";
import { AccionesPaso } from "./AccionesPaso";
import { bonos, sueldoMensual, PRESTACIONES, OTROS } from "../../../constants/paqueteVacante";
import { money } from "../../../utils/format";
import type { Requisito } from "../../../types/models/domain";

interface Props {
  req: Requisito;
  hecho: boolean;
  bloqueado?: boolean;
  onConfirmar: () => void;
}

export function PasoCompensacion({ req, hecho, bloqueado, onConfirmar }: Props) {
  const s = sueldoMensual(req);
  return (
    <div>
      <div className="aibox" style={{ marginBottom: 16 }}>
        <div className="hd"><Banknote size={15} /> Verifica la compensación de la caja</div>
      </div>

      <div className="rev-titulin">Sueldo</div>
      <div className="card" style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <b style={{ fontSize: 26, color: "var(--gold-dark)", letterSpacing: "-0.02em" }}>{money(s)}</b>
        <span className="help" style={{ margin: 0 }}>mensual bruto</span>
        <span className="help" style={{ margin: 0, marginLeft: "auto" }}>
          Rango autorizado: {money(req.salarioMin)} – {money(req.salarioMax)}
        </span>
      </div>

      <div className="rev-titulin">Compensaciones y bonos</div>
      {bonos(req).map((b) => <Desplegable key={b.titulo} titulo={b.titulo} extra={b.extra} detalle={<p>{b.detalle}</p>} />)}

      <div className="rev-titulin">Prestaciones</div>
      {PRESTACIONES.map((p) => <Desplegable key={p.titulo} titulo={p.titulo} extra={p.extra} detalle={<p>{p.detalle}</p>} />)}

      <div className="rev-titulin">Otros</div>
      {OTROS.map((o) => <Desplegable key={o.titulo} titulo={o.titulo} extra={o.extra} detalle={<p>{o.detalle}</p>} />)}

      <AccionesPaso hecho={hecho} bloqueado={bloqueado} onConfirmar={onConfirmar} />
    </div>
  );
}
