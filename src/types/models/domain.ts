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
  /**
   * Título comercial del anuncio, elegido por el formador entre las sugerencias.
   * `titulo` sigue siendo el que puso el administrador y es el que ve el "Detalle de caja".
   */
  tituloPublicacion?: string;
  /**
   * Disciplina del puesto (una de `DISCIPLINAS`), usada para acotar los catálogos del editor de
   * Requisitos. La resuelve el backend con la IA y se guarda para no volver a preguntar.
   */
  disciplina?: string;
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

/** Estado de una entrevista que el formador principal pidió a otro formador. */
export type EstadoEntrevistaExtra = "notificado" | "agendada" | "realizada";

/**
 * Entrevista adicional solicitada a otro formador para el mismo candidato.
 * Replica el ciclo de agendado del formador principal (slots → confirmación → registro): son
 * procesos paralelos e independientes, uno por entrevistador.
 */
export interface EntrevistaExtra {
  formadorId: string;
  estado: EstadoEntrevistaExtra;
  solicitada: string;
  slots?: string[];
  slotElegido?: string;
  modalidadEnt?: string;
  teams?: string;
  entrevista?: Entrevista;
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
  /** Entrevistas pedidas a otros formadores, además de la del formador principal. */
  entrevistasExtra?: EntrevistaExtra[];
  oferta?: Oferta;
  medico?: Medico;
  cuentaBanco?: string;
  /** Solo internos: mensaje de despedida que el candidato deja a su formador actual. */
  mensajeLiberacion?: string;
  numEmpleado?: string;
  motivoRechazo?: string;
  /** Módulos de inducción/capacitación completados por el candidato (visibles para el formador). */
  capacitacion?: string[];
}

export type Cambios = string | Record<string, string> | null;

/** Qué se puede pedir cambiar desde "Detalle de caja". Cada tipo aplica a un campo distinto. */
export type TipoSolicitud = "formador" | "centroCostos";

/**
 * Petición del formador que exige el visto bueno del administrador.
 *
 * Es un mecanismo aparte del flujo `cambios`/`cambiosReq`: aquel propone un `Requisito` entero y
 * deja la vacante en estado `cambios`, mientras que esto son ajustes puntuales que no bloquean la
 * edición del descriptivo — solo la publicación.
 */
export interface Solicitud {
  id: string;
  tipo: TipoSolicitud;
  /** Valor propuesto: id de formador ("F3") o centro de costos ("514028"). */
  valor: string;
  /** Valor vigente al solicitar, para que el admin vea el antes y el después. */
  valorPrevio: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  creada: string;
  /** Respuesta del administrador al resolverla. */
  nota?: string;
}

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
  /** Solicitudes al administrador (formador asignado, centro de costos). Las nuevas van al frente. */
  solicitudes?: Solicitud[];
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

/* ─────────────── Movilidad interna ───────────────
 * Espejo de `back/src/types/domain.ts`. Solo tiene sentido en candidatos `interno`.
 */

/** Semáforo de elegibilidad. Es un DATO que edita el administrador, no un cálculo. */
export type NivelMovilidad = "alta" | "media" | "baja";

/** Desempeño en el puesto actual. Sin `ñ`: ningún identificador del dominio la usa. */
export type NivelDesempeno = "alto" | "medio" | "bajo";

export interface CursoItem {
  nombre: string;
  tipo: "curso" | "certificado" | "licencia";
  /** Fecha de obtención en formato es-MX ("14 mar 2025"). */
  fecha: string;
  institucion?: string;
}

export interface HabilidadPlan {
  nombre: string;
  hecha: boolean;
  como?: string;
}

export interface PlanDesarrollo {
  puestoObjetivo: string;
  habilidades: HabilidadPlan[];
  necesidades: string[];
  cursosSugeridos: string[];
  generado: string;
}

export interface HistorialPuesto {
  puesto: string;
  desde: string;
  /** Vacío si es el puesto actual. */
  hasta: string;
  motivo: "ingreso" | "ascenso" | "movilidad";
}

/** Acta administrativa levantada en Honesteles. */
export interface ActaAdministrativa {
  motivo: string;
  tipo: "leve" | "grave";
  /** Fecha del acta en formato es-MX ("14 mar 2025"). */
  fecha: string;
}

/**
 * Expediente del colaborador en **Honesteles**, la plataforma de actas administrativas.
 *
 * No se guarda ningún "estatus": se DERIVA de `actas` y `enRevision` (ver `utils/movilidad.ts`).
 * Un estatus almacenado podría decir "sin actas" teniendo dos.
 */
export interface Honesteles {
  actas: ActaAdministrativa[];
  /** Hay un acta abierta sin resolver en la plataforma. */
  enRevision?: boolean;
  /** Última sincronización con Honesteles. */
  actualizado: string;
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
  /** Solo internos: lo que gana HOY. `salario` es su expectativa, no lo que percibe. */
  sueldoActual?: number;
  /** Solo internos: departamento en el que está adscrito hoy. */
  departamento?: string;
  /** Solo internos: formador del que depende hoy; es a quien se avisa si se va a otro puesto. */
  formadorId?: string;
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

  /* ── Movilidad interna: solo internos. Ver los tipos de arriba. ── */
  /** Semáforo de elegibilidad. Lo edita el administrador; NO se recalcula solo. */
  movilidad?: NivelMovilidad;
  desempeno?: NivelDesempeno;
  cursos?: CursoItem[];
  /** Puestos a los que le gustaría moverse, definidos por el propio colaborador. */
  puestosInteres?: string[];
  /** Inicio en el puesto ACTUAL, para la antigüedad de la ficha ("01 mar 2023"). */
  antiguedadDesde?: string;
  /** Última vez que tocó su ficha. Decide el estatus "Inactivo" (más de 1 mes). */
  perfilActualizado?: string;
  planDesarrollo?: PlanDesarrollo;
  historialPuestos?: HistorialPuesto[];
  /** Expediente en Honesteles. El colaborador ve el estatus; los motivos, solo su formador. */
  honesteles?: Honesteles;
  /** Vacante del proceso de movilidad en curso; mientras tenga valor no puede abrir otro. */
  movilidadActivaVacId?: string;
}
