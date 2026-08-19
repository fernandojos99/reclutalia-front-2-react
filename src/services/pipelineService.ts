/**
 * Service del pipeline del candidato dentro de una vacante. Todas devuelven la vacante actualizada.
 * Espeja los endpoints de `backend/src/routes/vacanteRoutes.ts`.
 */
import { apiClient } from "../lib/apiClient";
import type { Vacante } from "../types/models/domain";

const base = (vacId: string, cid: number) => `/vacantes/${vacId}/pipeline/${cid}`;

export interface EntrevistaPayload {
  resumen: string;
  feedback: string;
  externa: boolean;
  calificacion: number;
}

export interface MedicoPayload {
  estado: string;
  ciudad: string;
  municipio: string;
  sucursal: string;
  fecha: string;
}

export const pipelineService = {
  invitar: (v: string, cid: number, mensaje: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/invitar`, { mensaje }),
  aplicar: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/aplicar`),
  rechazar: (v: string, cid: number, motivo: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/rechazar`, { motivo }),
  postularDirecto: (v: string, cid: number, mensaje: string) =>
    apiClient.post<Vacante>(`/vacantes/${v}/postular/${cid}`, { mensaje }),
  docsFiltro: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/filtros`),
  videoIA: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/video-ia`),
  enviarSlots: (v: string, cids: number[], slots: string[], modalidad: string) =>
    apiClient.post<Vacante>(`/vacantes/${v}/slots`, { cids, slots, modalidad }),
  /** Convoca el Assessment center: los mismos 3 horarios valen para todos los evaluadores. */
  crearAssessment: (v: string, cid: number, evaluadores: string[], slots: string[], modalidad: string, proyecto: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/assessment`, { evaluadores, slots, modalidad, proyecto }),
  confirmarSlot: (v: string, cid: number, slot: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/confirmar-slot`, { slot }),
  registrarEntrevista: (v: string, cid: number, datos: EntrevistaPayload) =>
    apiClient.post<Vacante>(`${base(v, cid)}/entrevista`, datos),
  seleccionar: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/seleccionar`),
  agendarMedico: (v: string, cid: number, datos: MedicoPayload) =>
    apiClient.post<Vacante>(`${base(v, cid)}/medico`, datos),
  validarMedico: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/medico/validar`),
  recordarDocs: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/recordar-docs`),
  setDocContrato: (v: string, cid: number, key: string, value: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/doc-contrato`, { key, value }),
  enviarMensajeLiberacion: (v: string, cid: number, mensaje: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/mensaje-liberacion`, { mensaje }),
  setCuentaBanco: (v: string, cid: number, cuenta: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/cuenta`, { cuenta }),
  solicitarCambioFecha: (v: string, cid: number, fecha: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/oferta/fecha`, { fecha }),
  marcarCapacitacion: (v: string, cid: number, modulo: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/capacitacion`, { modulo }),
  docsContrato: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/docs-contrato`),
  enviarOferta: (v: string, cid: number, monto: number, fecha: string, ubicacion?: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/oferta`, { monto, fecha, ubicacion }),
  firmarContrato: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/firmar`),
  aceptarOferta: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/oferta/aceptar`),
  simular: (v: string, cid: number) =>
    apiClient.post<Vacante>(`${base(v, cid)}/simular`),
  archivar: (v: string, cid: number) =>
    apiClient.post<Vacante>(`/vacantes/${v}/archivar/${cid}`),
  solicitarMas: (v: string, multiposting: boolean) =>
    apiClient.post<Vacante>(`/vacantes/${v}/solicitar-mas`, { multiposting }),
  retrocederEtapa: (v: string) =>
    apiClient.post<Vacante>(`/vacantes/${v}/reset-etapa`),
};
