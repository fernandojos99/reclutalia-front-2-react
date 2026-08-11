/**
 * Service de vacantes: mapea cada acción a un endpoint HTTP del backend.
 * Toda la comunicación de vacantes pasa por aquí (nunca fetch en componentes).
 * Espeja el slice implementado en el backend (ver REFACTOR-PLAN.md §6).
 */
import { apiClient } from "../lib/apiClient";
import type { Requisito, Vacante, Cambios, TipoSolicitud } from "../types/models/domain";

export const vacanteService = {
  listar(formadorId?: string): Promise<Vacante[]> {
    const query = formadorId ? `?formadorId=${encodeURIComponent(formadorId)}` : "";
    return apiClient.get<Vacante[]>(`/vacantes${query}`);
  },

  obtener(vacId: string): Promise<Vacante> {
    return apiClient.get<Vacante>(`/vacantes/${vacId}`);
  },

  crear(req: Requisito, formadorId: string): Promise<Vacante> {
    return apiClient.post<Vacante>("/vacantes", { req, formadorId });
  },

  editar(vacId: string, req: Requisito, rechazados: string[] = [], nota = ""): Promise<Vacante> {
    return apiClient.patch<Vacante>(`/vacantes/${vacId}`, { req, rechazados, nota });
  },

  solicitarCambios(vacId: string, cambios: Cambios): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/cambios`, { cambios });
  },

  solicitarEdicion(vacId: string, req: Requisito, resumen: Record<string, string>): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/solicitar-edicion`, { req, resumen });
  },

  resolverEdicion(vacId: string, aprobar: boolean, nota = ""): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/resolver-edicion`, { aprobar, nota });
  },

  aprobar(vacId: string): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/aprobar`);
  },

  crearSolicitud(vacId: string, tipo: TipoSolicitud, valor: string): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/solicitudes`, { tipo, valor });
  },

  resolverSolicitud(vacId: string, solId: string, aprobar: boolean, nota = ""): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/solicitudes/${solId}/resolver`, { aprobar, nota });
  },

  solicitarMasCandidatos(vacId: string, multiposting: boolean): Promise<Vacante> {
    return apiClient.post<Vacante>(`/vacantes/${vacId}/solicitar-mas`, { multiposting });
  },
};
