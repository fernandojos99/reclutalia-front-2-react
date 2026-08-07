/**
 * Service de las entrevistas adicionales que el formador dueño de la vacante pide a otros
 * formadores. Espeja los endpoints de `backend/src/routes/vacanteRoutes.ts` y el de bandeja
 * `GET /formadores/:fid/entrevistas-asignadas`.
 */
import { apiClient } from "../lib/apiClient";
import type { EntrevistaExtra, Vacante } from "../types/models/domain";
import type { EntrevistaPayload } from "./pipelineService";

const base = (vacId: string, cid: number) => `/vacantes/${vacId}/pipeline/${cid}/entrevistas-extra`;

/** Una entrevista asignada, con el contexto que necesita la bandeja del formador invitado. */
export interface EntrevistaAsignada {
  vacId: string;
  vacTitulo: string;
  cid: number;
  candidato: string;
  solicitante: string;
  extra: EntrevistaExtra;
}

export const entrevistaExtraService = {
  solicitar: (v: string, cid: number, formadorId: string) =>
    apiClient.post<Vacante>(base(v, cid), { formadorId }),
  cancelar: (v: string, cid: number, fid: string) =>
    apiClient.delete<Vacante>(`${base(v, cid)}/${fid}`),
  enviarSlots: (v: string, cid: number, fid: string, slots: string[], modalidad: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/${fid}/slots`, { slots, modalidad }),
  confirmarSlot: (v: string, cid: number, fid: string, slot: string) =>
    apiClient.post<Vacante>(`${base(v, cid)}/${fid}/confirmar-slot`, { slot }),
  registrar: (v: string, cid: number, fid: string, datos: EntrevistaPayload) =>
    apiClient.post<Vacante>(`${base(v, cid)}/${fid}/registrar`, datos),
  asignadasA: (fid: string) =>
    apiClient.get<EntrevistaAsignada[]>(`/formadores/${fid}/entrevistas-asignadas`),
};
