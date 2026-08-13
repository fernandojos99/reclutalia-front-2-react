/**
 * Ficha de talento de un colaborador interno.
 *
 * La usan dos vistas distintas y por eso recibe `vistaFormador`, que gobierna todo lo que el
 * colaborador NO debe ver de sí mismo en esta pantalla:
 *   - el **historial** de puestos, postulaciones y ascensos,
 *   - el **desempeño**, que es la evaluación que hace su jefe sobre él,
 *   - el **detalle de las actas** de Honesteles; el estatus sí lo ve.
 */
import { Award, BadgeCheck, Building2, CalendarClock, GraduationCap, ShieldCheck, Target } from "lucide-react";
import { Avatar } from "../common/Avatar";
import { Chip } from "../common/Chip";
import { antiguedad, estatusHonesteles, haceCuanto, nivelMovilidad, nivelDesempeno } from "../../utils/movilidad";
import type { Candidato, CursoItem, HistorialPuesto } from "../../types/models/domain";

const ICONO_CURSO = { curso: GraduationCap, certificado: BadgeCheck, licencia: Award } as const;

const MOTIVO: Record<HistorialPuesto["motivo"], string> = {
  ingreso: "Ingreso",
  ascenso: "Ascenso",
  movilidad: "Movilidad interna",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <label>{titulo}</label>
      {children}
    </div>
  );
}

function Cursos({ cursos }: { cursos: CursoItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
      {cursos.map((c, i) => {
        const Icono = ICONO_CURSO[c.tipo] ?? GraduationCap;
        return (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
            <Icono size={14} style={{ marginTop: 2, flexShrink: 0, color: "var(--gold-dark)" }} />
            <div>
              <b>{c.nombre}</b>
              <div className="help">
                {c.institucion ? `${c.institucion} · ` : ""}
                {/* En la semilla hay una certificación en curso, sin fecha: se marca como tal. */}
                {c.fecha && c.fecha !== "—" ? c.fecha : "En curso"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FichaTalento({ cand, vistaFormador = false }: { cand: Candidato; vistaFormador?: boolean }) {
  const mov = nivelMovilidad(cand);
  const des = nivelDesempeno(cand);
  const anos = antiguedad(cand);
  const cursos = cand.cursos ?? [];
  const intereses = cand.puestosInteres ?? [];
  const historial = cand.historialPuestos ?? [];
  const honesteles = estatusHonesteles(cand);
  const actas = cand.honesteles?.actas ?? [];

  return (
    <div className="card">
      {/* Cabecera: nombre, puesto y antigüedad en descendente; el semáforo arriba a la derecha. */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Avatar nombre={cand.nombre} foto={cand.foto} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18 }}>{cand.nombre}</h3>
          <div style={{ color: "var(--gold-dark)", fontSize: 14, fontWeight: 700, marginTop: 1 }}>{cand.puesto}</div>
          {anos && (
            <div className="help" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <CalendarClock size={12} /> {anos} en el puesto
              {cand.antiguedadDesde ? ` · desde ${cand.antiguedadDesde}` : ""}
            </div>
          )}
          <div className="tagpick" style={{ marginTop: 8 }}>
            <Chip icon={Building2}>{cand.departamento ?? cand.area}</Chip>
            {/* El desempeño es la evaluación de su jefe: el colaborador no la ve aquí. */}
            {vistaFormador && des && <Chip tone={des.tono}>Desempeño {des.etiqueta.toLowerCase()}</Chip>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {mov
            ? <Chip tone={mov.tono}>{mov.etiqueta}</Chip>
            : <Chip>Movilidad sin definir</Chip>}
          <div className="help" style={{ marginTop: 6 }}>
            Ficha actualizada {haceCuanto(cand.perfilActualizado)}
          </div>
        </div>
      </div>

      <Seccion titulo="Habilidades">
        <div className="tagpick" style={{ marginTop: 6 }}>
          {[...cand.esp, ...cand.hard, ...cand.soft].length
            ? [...cand.esp, ...cand.hard].map((h) => <Chip key={h} tone="gold">{h}</Chip>)
            : <span className="help">Todavía no hay habilidades registradas.</span>}
          {cand.soft.map((s) => <Chip key={s}>{s}</Chip>)}
        </div>
      </Seccion>

      <Seccion titulo="Cursos, certificados y licencias">
        {cursos.length
          ? <Cursos cursos={cursos} />
          : <div className="help" style={{ marginTop: 6 }}>Todavía no hay cursos registrados.</div>}
      </Seccion>

      <Seccion titulo="Puestos de interés">
        {intereses.length ? (
          <div className="tagpick" style={{ marginTop: 6 }}>
            {intereses.map((p) => <Chip key={p} icon={Target}>{p}</Chip>)}
          </div>
        ) : (
          <div className="help" style={{ marginTop: 6 }}>
            Aún no has definido a qué puesto te gustaría moverte. El agente de movilidad puede ayudarte a elegirlo.
          </div>
        )}
      </Seccion>

      {/* Honesteles: el estatus lo ven los dos; los motivos de cada acta, solo el formador. */}
      <Seccion titulo="Honesteles · actas administrativas">
        {honesteles ? (
          <div style={{ marginTop: 6 }}>
            <Chip tone={honesteles.tono} icon={ShieldCheck}>{honesteles.etiqueta}</Chip>
            <div className="help" style={{ marginTop: 5 }}>
              Sincronizado el {cand.honesteles!.actualizado}
            </div>
            {vistaFormador && actas.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {actas.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 13, marginTop: 5 }}>
                    <span style={{ color: "var(--gray)" }}>•</span>
                    <div>
                      <b>{a.motivo}</b>
                      <div className="help">
                        <Chip tone={a.tipo === "grave" ? "bad" : ""}>{a.tipo}</Chip> · {a.fecha}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="help" style={{ marginTop: 6 }}>Sin expediente sincronizado con Honesteles.</div>
        )}
      </Seccion>

      {/* Solo para el formador: el colaborador no ve su propio historial en esta pantalla. */}
      {vistaFormador && (
        <Seccion titulo="Historial de puestos">
          {historial.length ? (
            <div style={{ marginTop: 6 }}>
              {historial.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 13, marginTop: 5 }}>
                  <span style={{ color: "var(--gray)" }}>•</span>
                  <div>
                    <b>{h.puesto}</b>
                    <span className="help"> · {MOTIVO[h.motivo]}</span>
                    <div className="help">{h.desde} – {h.hasta || "Actual"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="help" style={{ marginTop: 6 }}>Sin movimientos registrados.</div>
          )}
        </Seccion>
      )}
    </div>
  );
}
