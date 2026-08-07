/**
 * Bandeja del formador INVITADO: las entrevistas que otros formadores le pidieron realizar.
 *
 * Reutiliza los mismos modales que el formador principal (`AgendaModal` para proponer horarios y
 * `EntrevistaModal` para registrar el resultado), porque el proceso es el mismo; lo único que
 * cambia es quién lo ejecuta y contra qué endpoints.
 *
 * Se agrupa por vacante: a un formador pueden pedirle entrevistar a varios candidatos de la misma
 * vacante y también de vacantes distintas.
 */
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, Clock, Video, MapPin, Briefcase } from "lucide-react";
import { useDemo } from "../../contexts/DemoContext";
import { useData } from "../../store/DataProvider";
import { Chip } from "../../components/common/Chip";
import { AgendaModal } from "../../components/formador/AgendaModal";
import { EntrevistaModal, evalEmoji, evalLabel } from "../../components/formador/EntrevistaModal";
import { entrevistaExtraService, type EntrevistaAsignada } from "../../services/entrevistaExtraService";
import type { Candidato, PipelineEntry, Vacante } from "../../types/models/domain";

/** Entrevistas que aún no ha terminado este formador: alimenta el contador del menú. */
export const pendientesDe = (xs: EntrevistaAsignada[]): number =>
  xs.filter((x) => x.extra.estado !== "realizada").length;

export function EntrevistasAsignadasPage() {
  const { formadorId, toast } = useDemo();
  const { vacantes, candidatos, reload } = useData();
  const [items, setItems] = useState<EntrevistaAsignada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [agendando, setAgendando] = useState<EntrevistaAsignada | null>(null);
  const [registrando, setRegistrando] = useState<EntrevistaAsignada | null>(null);

  const cargar = useCallback(async () => {
    try {
      setItems(await entrevistaExtraService.asignadasA(formadorId));
    } finally {
      setCargando(false);
    }
  }, [formadorId]);

  useEffect(() => { void cargar(); }, [cargar]);

  if (cargando) return <p>Cargando entrevistas…</p>;

  if (!items.length) {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: 40 }}>
        <Briefcase size={26} style={{ marginBottom: 8 }} />
        <p style={{ margin: 0 }}>Nadie te ha solicitado entrevistas por ahora.</p>
      </div>
    );
  }

  // Agrupado por vacante, como pide el flujo: varias personas de la misma vacante van juntas.
  const porVacante = new Map<string, EntrevistaAsignada[]>();
  for (const x of items) {
    const lista = porVacante.get(x.vacId) ?? [];
    lista.push(x);
    porVacante.set(x.vacId, lista);
  }

  const buscarVacante = (id: string): Vacante | undefined => vacantes.find((v) => v.id === id);
  const buscarCandidato = (cid: number): Candidato | undefined => candidatos.find((c) => c.id === cid);

  const trasAccion = async (msg: string) => { await cargar(); await reload(); toast(msg); };

  return (
    <div>
      <p className="help" style={{ marginTop: 0 }}>
        Entrevistas que otros formadores te pidieron realizar. Agenda tu horario y registra tu
        evaluación; el formador responsable de la vacante verá tu resumen y tu feedback.
      </p>

      {[...porVacante.entries()].map(([vacId, lista]) => (
        <div key={vacId} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15 }}>{lista[0].vacTitulo}</h3>
            <Chip>{vacId}</Chip>
            <span className="help" style={{ margin: 0 }}>Solicitadas por {lista[0].solicitante}</span>
          </div>

          {lista.map((x) => {
            const e = x.extra;
            return (
              <div className="card" key={x.cid} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 14 }}>{x.candidato}</b>
                  {e.estado === "notificado" && <Chip icon={Clock}>Pendiente de agendar</Chip>}
                  {e.estado === "agendada" && <Chip tone="gold" icon={CalendarCheck}>{e.slotElegido}</Chip>}
                  {e.estado === "realizada" && e.entrevista && (
                    <Chip tone="ok" icon={CheckCircle2}>
                      {evalEmoji(e.entrevista.calificacion)} {evalLabel(e.entrevista.calificacion)}
                    </Chip>
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {e.estado === "notificado" && (
                      <button className="btn gold sm" onClick={() => setAgendando(x)}>
                        <CalendarCheck size={13} /> Proponer horarios
                      </button>
                    )}
                    {e.estado === "agendada" && (
                      <>
                        {e.modalidadEnt === "Presencial"
                          ? <button className="btn ghost sm" onClick={() => setRegistrando(x)}><MapPin size={13} /> Registrar presencial</button>
                          : <a className="btn ghost sm" href={e.teams} target="_blank" rel="noreferrer"><Video size={13} /> Entrar a Teams</a>}
                        <button className="btn gold sm" onClick={() => setRegistrando(x)}>Registrar entrevista</button>
                      </>
                    )}
                  </div>
                </div>

                {e.estado === "agendada" && e.modalidadEnt && (
                  <p className="help" style={{ margin: "8px 0 0" }}>{e.modalidadEnt} · {e.slotElegido}</p>
                )}
                {e.estado === "realizada" && e.entrevista && (
                  <p className="help" style={{ margin: "8px 0 0" }}>Registrada el {e.entrevista.fecha}</p>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {agendando && buscarCandidato(agendando.cid) && (
        <AgendaModal
          cands={[buscarCandidato(agendando.cid)!]}
          onClose={() => setAgendando(null)}
          onSend={(slots, mod) => {
            void entrevistaExtraService
              .enviarSlots(agendando.vacId, agendando.cid, formadorId, slots, mod)
              .then(() => trasAccion("Horarios enviados al candidato"));
            setAgendando(null);
          }}
        />
      )}

      {registrando && buscarCandidato(registrando.cid) && buscarVacante(registrando.vacId) && (
        <EntrevistaModal
          cand={buscarCandidato(registrando.cid)!}
          v={buscarVacante(registrando.vacId)!}
          p={(buscarVacante(registrando.vacId)!.pipeline[registrando.cid] ?? {}) as PipelineEntry}
          externa={registrando.extra.modalidadEnt === "Presencial"}
          onClose={() => setRegistrando(null)}
          onSave={(datos) => {
            void entrevistaExtraService
              .registrar(registrando.vacId, registrando.cid, formadorId, datos)
              .then(() => trasAccion("Entrevista registrada · el formador responsable ya puede verla"));
            setRegistrando(null);
          }}
        />
      )}
    </div>
  );
}
