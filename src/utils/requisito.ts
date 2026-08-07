/** Fabrica un descriptivo con defaults (equivale a `mkReq` del original). */
import { AREAS } from "../constants/catalogos";
import type { Requisito } from "../types/models/domain";

export function crearRequisito(overrides: Partial<Requisito> = {}): Requisito {
  return {
    titulo: "", area: AREAS[0], descripcion: "", nivelPuesto: "Junior", anosExp: 1,
    educacion: "Licenciatura", espRequeridas: [], areasConocimiento: [], hardSkills: [],
    softSkills: [], aptitudes: [], turno: "Turno Mixto", ubicacionTrabajo: "CDMX", modalidad: "Presencial",
    ubicacionCandidato: "CDMX", radioKm: 25, salarioMin: 10_000, salarioMax: 20_000,
    horario: "9:00 – 18:00", dias: ["Lun", "Mar", "Mié", "Jue", "Vie"], numVacantes: 1,
    examenMedico: false, tipoSede: "Corporativo", sede: "", unidadNegocio: "",
    departamento: "", centroCostos: "", sueldoOculto: false, busquedaAutomatica: false, pausada: false,
    tipoVacante: "Estándar",
    puedeSerSuperior: false, ubicacionNoRelevante: false, expNoRelevante: false,
    edadMin: 18, edadMax: 65, edadNoRelevante: false, ...overrides,
  };
}
