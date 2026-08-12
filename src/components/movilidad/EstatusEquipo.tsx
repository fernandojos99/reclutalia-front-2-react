/**
 * Estatus de equipo: la foto del formador sobre su plantilla, con las advertencias que pide el
 * documento (cuota de movilidad, movimientos posibles, puestos emergentes y fichas sin actualizar).
 *
 * Todo se deriva de los datos del equipo. Nada de esto se guarda.
 */
import { AlertTriangle, ArrowUpRight, CalendarClock, Sparkles, TrendingUp, Users } from "lucide-react";
import { Chip } from "../common/Chip";
import {
  accionRecomendada, avancePlan, estatusMovilidad, haceCuanto, nivelMovilidad,
  perfilInactivo, rankingVacantes,
} from "../../utils/movilidad";
import { UMBRAL_AFINIDAD } from "../../constants/catalogos";
import type { Candidato, Vacante } from "../../types/models/domain";

interface Props {
  equipo: Candidato[];
  vacantes: Vacante[];
  onVerFicha: (c: Candidato) => void;
}

function Dato({ valor, etiqueta, tono }: { valor: string; etiqueta: string; tono?: string }) {
  return (
    <div className="card" style={{ margin: 0, textAlign: "center", padding: "16px 12px" }}>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: tono ? `var(--${tono})` : "inherit" }}>
        {valor}
      </div>
      <div className="help" style={{ marginTop: 4 }}>{etiqueta}</div>
    </div>
  );
}

function Aviso({ icono: Icono, titulo, children }: {
  icono: typeof Users; titulo: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icono size={13} /> {titulo}
      </label>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

/**
 * Puestos que conviene ir preparando. El documento enumeraba los insumos (temporalidad, habilidades,
 * estrategia, rotación, puestos clave) pero no qué mostrar: se sacan de los puestos de interés que
 * el propio equipo declara, porque son los puestos que van a quedar cubiertos o vacíos.
 */
function puestosEmergentes(equipo: Candidato[]) {
  const cuenta = new Map<string, number>();
  equipo.forEach((c) => (c.puestosInteres ?? []).forEach((p) => cuenta.set(p, (cuenta.get(p) ?? 0) + 1)));
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([puesto, n]) => ({ puesto, n }));
}

export function EstatusEquipo({ equipo, vacantes, onVerFicha }: Props) {
  if (!equipo.length) {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 36 }}>
        Todavía no tienes colaboradores internos a tu cargo.
      </div>
    );
  }

  // Cuota de movilidad: cuántos de tu equipo están en condiciones de moverse hoy.
  const conMovilidadAlta = equipo.filter((c) => c.movilidad === "alta");
  const cuota = Math.round((conMovilidadAlta.length / equipo.length) * 100);

  const enProceso = equipo.filter((c) => {
    const e = estatusMovilidad(c, vacantes);
    return e === "En proceso" || e === "Seleccionado" || e === "Contratado";
  });
  const desactualizados = equipo.filter(perfilInactivo);
  const conOportunidad = equipo
    .map((c) => ({ c, mejor: rankingVacantes(c, vacantes)[0] }))
    .filter((x) => x.mejor && x.mejor.afinidad >= UMBRAL_AFINIDAD);
  const emergentes = puestosEmergentes(equipo);

  return (
    <div>
      <div className="grid3" style={{ gap: 12 }}>
        <Dato valor={`${cuota}%`} etiqueta="Cuota de movilidad del equipo" tono={cuota >= 50 ? "ok" : undefined} />
        <Dato valor={String(enProceso.length)} etiqueta="Procesos de movilidad en curso" />
        <Dato valor={String(desactualizados.length)} etiqueta="Fichas sin actualizar"
          tono={desactualizados.length ? "bad" : undefined} />
      </div>
      <div className="help" style={{ marginTop: 8 }}>
        La cuota es la proporción de tu equipo con semáforo verde: {conMovilidadAlta.length} de {equipo.length} colaboradores.
      </div>

      <Aviso icono={TrendingUp} titulo="Movilidad de colaboradores">
        {conOportunidad.length ? (
          conOportunidad.map(({ c, mejor }) => (
            <div key={c.id} className="card" style={{ margin: "0 0 8px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <b>{c.nombre}</b>
                <div className="help">{c.puesto} · {accionRecomendada(c, vacantes)}</div>
              </div>
              <Chip tone="ok">{mejor.afinidad}% · {mejor.v.req.titulo}</Chip>
              {nivelMovilidad(c) && <Chip tone={nivelMovilidad(c)!.tono}>{nivelMovilidad(c)!.corto}</Chip>}
              <button className="btn ghost sm" onClick={() => onVerFicha(c)}>
                <ArrowUpRight size={12} /> Ver ficha
              </button>
            </div>
          ))
        ) : (
          <div className="help">
            Ahora mismo ninguna vacante abierta supera el {UMBRAL_AFINIDAD}% de afinidad con tu equipo.
          </div>
        )}
      </Aviso>

      <Aviso icono={Sparkles} titulo="Puestos emergentes o por desarrollar">
        {emergentes.length ? (
          <div className="tagpick">
            {emergentes.map(({ puesto, n }) => (
              <Chip key={puesto} tone="gold">
                {puesto} · {n} {n === 1 ? "interesado" : "interesados"}
              </Chip>
            ))}
          </div>
        ) : (
          <div className="help">
            Tu equipo aún no ha declarado puestos de interés. Cuando lo hagan, aquí verás hacia dónde
            se mueve la plantilla y qué puestos conviene ir preparando.
          </div>
        )}
      </Aviso>

      <Aviso icono={AlertTriangle} titulo="Fichas de talento sin actualizar">
        {desactualizados.length ? (
          desactualizados.map((c) => (
            <div key={c.id} className="card" style={{ margin: "0 0 8px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <b>{c.nombre}</b>
                <div className="help" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <CalendarClock size={11} /> Actualizada {haceCuanto(c.perfilActualizado)}
                </div>
              </div>
              <Chip tone="bad">Inactivo</Chip>
              <button className="btn ghost sm" onClick={() => onVerFicha(c)}>Ver ficha</button>
            </div>
          ))
        ) : (
          <div className="help">Todo tu equipo tiene la ficha al día.</div>
        )}
      </Aviso>

      <Aviso icono={Users} titulo="Postulaciones de tu plantilla">
        {enProceso.length ? (
          enProceso.map((c) => {
            const plan = avancePlan(c);
            return (
              <div key={c.id} className="card" style={{ margin: "0 0 8px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <b>{c.nombre}</b>
                  <div className="help">
                    {c.puesto}
                    {plan.total ? ` · plan ${plan.hechas}/${plan.total}` : ""}
                  </div>
                </div>
                <Chip tone="gold">{estatusMovilidad(c, vacantes)}</Chip>
                <button className="btn ghost sm" onClick={() => onVerFicha(c)}>Ver ficha</button>
              </div>
            );
          })
        ) : (
          <div className="help">Nadie de tu equipo tiene un proceso de movilidad en curso.</div>
        )}
      </Aviso>
    </div>
  );
}
