/**
 * Capa de datos que reemplaza al `db` + `run(ACT...)` del App original.
 * Carga las 4 colecciones (candidatos, vacantes, formadores, notificaciones) y expone `actions`
 * que llaman a los services HTTP y actualizan el estado local con la entidad devuelta. Así los
 * componentes portados leen de `db` y disparan `actions.*` casi igual que antes.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { vacanteService } from "../services/vacanteService";
import { pipelineService, type EntrevistaPayload, type MedicoPayload } from "../services/pipelineService";
import { entrevistaExtraService } from "../services/entrevistaExtraService";
import { candidatoService } from "../services/candidatoService";
import { formadorService } from "../services/formadorService";
import { notificacionService } from "../services/notificacionService";
import type { Candidato, Formador, Notificacion, Vacante, Requisito, Cambios, TipoSolicitud } from "../types/models/domain";

interface Db {
  candidatos: Candidato[];
  vacantes: Vacante[];
  formadores: Formador[];
  notificaciones: Notificacion[];
}

interface DataContextValue extends Db {
  loading: boolean;
  reload: () => Promise<void>;
  reloadNotificaciones: () => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;
  actions: Actions;
}

interface Actions {
  aprobarVacante: (vacId: string) => Promise<Vacante>;
  solicitarCambios: (vacId: string, cambios: Cambios) => Promise<Vacante>;
  solicitarEdicion: (vacId: string, req: Requisito, resumen: Record<string, string>) => Promise<Vacante>;
  resolverEdicion: (vacId: string, aprobar: boolean, nota?: string) => Promise<Vacante>;
  editarVacante: (vacId: string, req: Requisito, rechazados?: string[], nota?: string) => Promise<Vacante>;
  crearVacante: (req: Requisito, formadorId: string) => Promise<Vacante>;
  solicitarMas: (vacId: string, multiposting: boolean) => Promise<Vacante>;
  /** Clasifica el puesto en una disciplina (acota los catálogos del editor de Requisitos). */
  clasificarVacante: (vacId: string) => Promise<Vacante>;
  /** Solicitudes al admin desde "Detalle de caja" (formador asignado, centro de costos). */
  crearSolicitud: (vacId: string, tipo: TipoSolicitud, valor: string) => Promise<Vacante>;
  resolverSolicitud: (vacId: string, solId: string, aprobar: boolean, nota?: string) => Promise<Vacante>;
  invitar: (vacId: string, cid: number, mensaje: string) => Promise<Vacante>;
  aplicar: (vacId: string, cid: number) => Promise<Vacante>;
  rechazar: (vacId: string, cid: number, motivo: string) => Promise<Vacante>;
  postularDirecto: (vacId: string, cid: number, mensaje: string) => Promise<Vacante>;
  docsFiltro: (vacId: string, cid: number) => Promise<Vacante>;
  videoIA: (vacId: string, cid: number) => Promise<Vacante>;
  enviarSlots: (vacId: string, cids: number[], slots: string[], modalidad: string) => Promise<Vacante>;
  confirmarSlot: (vacId: string, cid: number, slot: string) => Promise<Vacante>;
  registrarEntrevista: (vacId: string, cid: number, datos: EntrevistaPayload) => Promise<Vacante>;
  seleccionar: (vacId: string, cid: number) => Promise<Vacante>;
  enviarMensajeLiberacion: (vacId: string, cid: number, mensaje: string) => Promise<Vacante>;
  // Entrevistas adicionales pedidas a otros formadores.
  solicitarEntrevistaExtra: (vacId: string, cid: number, formadorId: string) => Promise<Vacante>;
  cancelarEntrevistaExtra: (vacId: string, cid: number, formadorId: string) => Promise<Vacante>;
  enviarSlotsExtra: (vacId: string, cid: number, fid: string, slots: string[], modalidad: string) => Promise<Vacante>;
  confirmarSlotExtra: (vacId: string, cid: number, fid: string, slot: string) => Promise<Vacante>;
  registrarEntrevistaExtra: (vacId: string, cid: number, fid: string, datos: EntrevistaPayload) => Promise<Vacante>;
  agendarMedico: (vacId: string, cid: number, datos: MedicoPayload) => Promise<Vacante>;
  validarMedico: (vacId: string, cid: number) => Promise<Vacante>;
  recordarDocs: (vacId: string, cid: number) => Promise<Vacante>;
  setDocContrato: (vacId: string, cid: number, key: string, value: string) => Promise<Vacante>;
  setCuentaBanco: (vacId: string, cid: number, cuenta: string) => Promise<Vacante>;
  solicitarCambioFecha: (vacId: string, cid: number, fecha: string) => Promise<Vacante>;
  marcarCapacitacion: (vacId: string, cid: number, modulo: string) => Promise<Vacante>;
  docsContratoListos: (vacId: string, cid: number) => Promise<Vacante>;
  enviarOferta: (vacId: string, cid: number, monto: number, fecha: string, ubicacion?: string) => Promise<Vacante>;
  aceptarOferta: (vacId: string, cid: number) => Promise<Vacante>;
  firmarContrato: (vacId: string, cid: number) => Promise<Vacante>;
  simular: (vacId: string, cid: number) => Promise<Vacante>;
  resetearEtapa: (vacId: string) => Promise<Vacante>;
  archivarCand: (vacId: string, cid: number) => Promise<Vacante>;
  toggleFavCand: (formadorId: string, cid: number) => Promise<Formador>;
  crearCategoria: (formadorId: string, nombre: string) => Promise<Formador>;
  toggleCategoria: (formadorId: string, nombre: string, cid: number) => Promise<Formador>;
  guardarCandidato: (candidato: Candidato) => Promise<Candidato>;
  completarPsicometrico: (cid: number) => Promise<Candidato>;
  toggleFavVacante: (cid: number, vacId: string) => Promise<Candidato>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [formadores, setFormadores] = useState<Formador[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadNotificaciones = useCallback(async () => {
    setNotificaciones(await notificacionService.listarTodas());
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const [c, v, f, n] = await Promise.all([
      candidatoService.listar(),
      vacanteService.listar(),
      formadorService.listar(),
      notificacionService.listarTodas(),
    ]);
    setCandidatos(c);
    setVacantes(v);
    setFormadores(f);
    setNotificaciones(n);
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const upsertVacante = useCallback((nv: Vacante) => {
    setVacantes((vs) => vs.map((v) => (v.id === nv.id ? nv : v)));
  }, []);
  const upsertFormador = useCallback((nf: Formador) => {
    setFormadores((fs) => fs.map((f) => (f.id === nf.id ? nf : f)));
  }, []);
  const upsertCandidato = useCallback((nc: Candidato) => {
    setCandidatos((cs) => cs.map((c) => (c.id === nc.id ? nc : c)));
  }, []);

  /** Ejecuta una acción que devuelve una vacante: la aplica al estado y refresca notificaciones. */
  const runVac = useCallback(
    async (accion: () => Promise<Vacante>): Promise<Vacante> => {
      const nv = await accion();
      if (vacantes.some((v) => v.id === nv.id)) upsertVacante(nv);
      else setVacantes((vs) => [nv, ...vs]);
      await reloadNotificaciones();
      return nv;
    },
    [vacantes, upsertVacante, reloadNotificaciones],
  );

  const runForm = useCallback(
    async (accion: () => Promise<Formador>): Promise<Formador> => {
      const nf = await accion();
      upsertFormador(nf);
      return nf;
    },
    [upsertFormador],
  );

  const actions: Actions = {
    aprobarVacante: (id) => runVac(() => vacanteService.aprobar(id)),
    solicitarCambios: (id, c) => runVac(() => vacanteService.solicitarCambios(id, c)),
    solicitarEdicion: (id, req, resumen) => runVac(() => vacanteService.solicitarEdicion(id, req, resumen)),
    resolverEdicion: (id, aprobar, nota) => runVac(() => vacanteService.resolverEdicion(id, aprobar, nota)),
    editarVacante: (id, req, rech, nota) => runVac(() => vacanteService.editar(id, req, rech, nota)),
    crearVacante: (req, fid) => runVac(() => vacanteService.crear(req, fid)),
    solicitarMas: (id, mp) => runVac(() => vacanteService.solicitarMasCandidatos(id, mp)),
    clasificarVacante: (id) => runVac(() => vacanteService.clasificar(id)),
    crearSolicitud: (id, tipo, valor) => runVac(() => vacanteService.crearSolicitud(id, tipo, valor)),
    resolverSolicitud: (id, sid, ap, nota) => runVac(() => vacanteService.resolverSolicitud(id, sid, ap, nota)),
    invitar: (id, cid, m) => runVac(() => pipelineService.invitar(id, cid, m)),
    aplicar: (id, cid) => runVac(() => pipelineService.aplicar(id, cid)),
    rechazar: (id, cid, mo) => runVac(() => pipelineService.rechazar(id, cid, mo)),
    postularDirecto: (id, cid, m) => runVac(() => pipelineService.postularDirecto(id, cid, m)),
    docsFiltro: (id, cid) => runVac(() => pipelineService.docsFiltro(id, cid)),
    videoIA: (id, cid) => runVac(() => pipelineService.videoIA(id, cid)),
    enviarSlots: (id, cids, slots, mod) => runVac(() => pipelineService.enviarSlots(id, cids, slots, mod)),
    confirmarSlot: (id, cid, s) => runVac(() => pipelineService.confirmarSlot(id, cid, s)),
    registrarEntrevista: (id, cid, d) => runVac(() => pipelineService.registrarEntrevista(id, cid, d)),
    seleccionar: (id, cid) => runVac(() => pipelineService.seleccionar(id, cid)),
    enviarMensajeLiberacion: (id, cid, m) => runVac(() => pipelineService.enviarMensajeLiberacion(id, cid, m)),
    solicitarEntrevistaExtra: (id, cid, fid) => runVac(() => entrevistaExtraService.solicitar(id, cid, fid)),
    cancelarEntrevistaExtra: (id, cid, fid) => runVac(() => entrevistaExtraService.cancelar(id, cid, fid)),
    enviarSlotsExtra: (id, cid, fid, slots, mod) => runVac(() => entrevistaExtraService.enviarSlots(id, cid, fid, slots, mod)),
    confirmarSlotExtra: (id, cid, fid, slot) => runVac(() => entrevistaExtraService.confirmarSlot(id, cid, fid, slot)),
    registrarEntrevistaExtra: (id, cid, fid, d) => runVac(() => entrevistaExtraService.registrar(id, cid, fid, d)),
    agendarMedico: (id, cid, d) => runVac(() => pipelineService.agendarMedico(id, cid, d)),
    validarMedico: (id, cid) => runVac(() => pipelineService.validarMedico(id, cid)),
    recordarDocs: (id, cid) => runVac(() => pipelineService.recordarDocs(id, cid)),
    setDocContrato: (id, cid, key, value) => runVac(() => pipelineService.setDocContrato(id, cid, key, value)),
    setCuentaBanco: (id, cid, cuenta) => runVac(() => pipelineService.setCuentaBanco(id, cid, cuenta)),
    solicitarCambioFecha: (id, cid, fecha) => runVac(() => pipelineService.solicitarCambioFecha(id, cid, fecha)),
    marcarCapacitacion: (id, cid, modulo) => runVac(() => pipelineService.marcarCapacitacion(id, cid, modulo)),
    docsContratoListos: (id, cid) => runVac(() => pipelineService.docsContrato(id, cid)),
    enviarOferta: (id, cid, monto, fecha, ubic) => runVac(() => pipelineService.enviarOferta(id, cid, monto, fecha, ubic)),
    aceptarOferta: (id, cid) => runVac(() => pipelineService.aceptarOferta(id, cid)),
    firmarContrato: (id, cid) => runVac(() => pipelineService.firmarContrato(id, cid)),
    simular: (id, cid) => runVac(() => pipelineService.simular(id, cid)),
    resetearEtapa: (id) => runVac(() => pipelineService.retrocederEtapa(id)),
    archivarCand: (id, cid) => runVac(() => pipelineService.archivar(id, cid)),
    toggleFavCand: (fid, cid) => runForm(() => formadorService.toggleFavorito(fid, cid)),
    crearCategoria: (fid, n) => runForm(() => formadorService.crearCategoria(fid, n)),
    toggleCategoria: (fid, n, cid) => runForm(() => formadorService.toggleCategoria(fid, n, cid)),
    guardarCandidato: async (c) => { const nc = await candidatoService.guardar(c); upsertCandidato(nc); return nc; },
    completarPsicometrico: async (cid) => { const nc = await candidatoService.completarPsicometrico(cid); upsertCandidato(nc); return nc; },
    toggleFavVacante: async (cid, vacId) => { const nc = await candidatoService.toggleFavVacante(cid, vacId); upsertCandidato(nc); return nc; },
  };

  const marcarLeida = useCallback(async (id: string) => {
    await notificacionService.marcarLeida(id);
    await reloadNotificaciones();
  }, [reloadNotificaciones]);

  return (
    <DataContext.Provider value={{ candidatos, vacantes, formadores, notificaciones, loading, reload, reloadNotificaciones, marcarLeida, actions }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
