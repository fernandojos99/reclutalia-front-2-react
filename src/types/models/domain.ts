/**
 * Modelos de dominio del lado del cliente. Espejo de `backend/src/types/domain.ts`.
 * (Se mantienen dos copias por simplicidad — KISS. Si crece, extraer un paquete `shared/`.)
 */
export type RolNotificacion = "formador" | "admin" | "candidato";

export interface DestinatarioNotificacion {
  tipo: RolNotificacion;
  id: string | number;
}

export interface Notificacion {
  id: string;
  para: DestinatarioNotificacion;
  titulo: string;
  msg: string;
  vacId: string;
  fecha: string;
  leida: boolean;
}

export interface Requisito {
  titulo: string;
  area: string;
  descripcion: string;
  nivelPuesto: string;
  anosExp: number;
  educacion: string;
  /** Especialidades (fusión de requeridas + opcionales, máx. 5). */
  espRequeridas: string[];
  /** Áreas de conocimiento / profesiones (catálogo PROFESIONES, máx. 3). */
  areasConocimiento: string[];
  hardSkills: string[];
  softSkills: string[];
  aptitudes: string[];
  ubicacionTrabajo: string;
  modalidad: string;
  ubicacionCandidato: string;
  radioKm: number;
  salarioMin: number;
  salarioMax: number;
  /** Sueldo mensual único que se muestra en el descriptivo (default: punto medio del rango). */
  sueldo?: number;
  /** Turno de trabajo (Matutino / Vespertino / Mixto); sustituye visualmente a horario/días. */
  turno: string;
  horario: string;
  dias: string[];
  numVacantes: number;
  examenMedico: boolean;
  tipoSede: string;
  sede: string;
  unidadNegocio: string;
  /** Departamento al que cuelga la posición. */
  departamento: string;
  /** Centro de costos contra el que se presupuesta (6 dígitos). */
  centroCostos: string;
  /** Oculta el sueldo en lo que se publica hacia fuera (candidatos). */
  sueldoOculto: boolean;
  /** Relanza la búsqueda de candidatos cada vez que la posición se libera. */
  busquedaAutomatica: boolean;
  /** Posición en pausa: no se recluta, aunque la vacante siga viva. */
  pausada: boolean;
  tipoVacante: string;
  puedeSerSuperior: boolean;
  ubicacionNoRelevante: boolean;
  expNoRelevante: boolean;
  edadMin: number;
  edadMax: number;
  edadNoRelevante: boolean;
}

export interface PoolItem {
  cid: number;
  match: number;
}

export interface Entrevista {
  resumen: string;
  feedback: string;
  externa: boolean;
  calificacion: number;
  fecha: string;
}

export interface Oferta {
  monto: number;
  fecha: string;
  ubicacion: string;
}

export interface Medico {
  estado?: string;
  ciudad?: string;
  municipio?: string;
  sucursal?: string;
  fecha?: string;
  validado: boolean;
}

export interface PipelineEntry {
  estado: string;
  match: number;
  mensaje?: string;
  docsFiltro: { constancias?: string[] };
  docsContrato: Record<string, string>;
  historial: string[];
  autorizaFiltros?: boolean;
  matchIA?: number;
  matchFinal?: number;
  slots?: string[];
  slotElegido?: string;
  modalidadEnt?: string;
  teams?: string;
  entrevista?: Entrevista;
  oferta?: Oferta;
  medico?: Medico;
  cuentaBanco?: string;
  numEmpleado?: string;
  motivoRechazo?: string;
  /** Módulos de inducción/capacitación completados por el candidato (visibles para el formador). */
  capacitacion?: string[];
}

export type Cambios = string | Record<string, string> | null;

export interface Vacante {
  id: string;
  estado: string;
  formadorId: string;
  creada: string;
  /** Timestamp de creación (ms) para calcular "días activa". */
  creadaTs?: number;
  req: Requisito;
  pipeline: Record<string, PipelineEntry>;
  historial: string[];
  cambios: Cambios;
  /** Requisito propuesto por el formador, pendiente de que el admin lo confirme o rechace. */
  cambiosReq?: Requisito | null;
  /** Estado de la vacante antes de solicitar la edición (para restaurarlo al resolver). */
  cambiosDesde?: string;
  archivados: number[];
  pool?: PoolItem[];
}

export interface CategoriaFormador {
  nombre: string;
  cids: number[];
}

export interface Formador {
  id: string;
  nombre: string;
  puesto: string;
  area: string;
  favoritosCands: number[];
  categorias: CategoriaFormador[];
}

export interface ExperienciaItem {
  puesto: string;
  empresa: string;
  inicio: string;
  fin: string;
}

export interface EducacionItem {
  institucion: string;
  titulo: string;
  inicio: string;
  fin: string;
}

export interface DocsPerfil {
  ine: string | null;
  curp: string | null;
  rfc: string | null;
  domicilio: string | null;
  estudios: string | null;
  certificaciones: string[];
  cv: string | null;
}

export interface Candidato {
  id: number;
  nombre: string;
  tipo: "interno" | "externo";
  area: string;
  puesto: string;
  nivel: string;
  exp: number;
  edu: string;
  ciudad: string;
  modalidad: string;
  salario: number;
  esp: string[];
  hard: string[];
  soft: string[];
  resumen: string;
  email: string;
  tel: string;
  foto: string | null;
  experiencia: ExperienciaItem[];
  educacion: EducacionItem[];
  intereses: string[];
  favoritos: string[];
  psicometrico: { fecha: string; ts: number } | null;
  docsPerfil: DocsPerfil;
}
