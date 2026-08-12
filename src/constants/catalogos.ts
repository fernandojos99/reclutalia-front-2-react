/**
 * Catálogos estáticos necesarios de forma síncrona por componentes/helpers (fases, pipeline).
 * Los catálogos "de datos" (áreas, skills, etc.) se cargan del backend vía useCatalogos;
 * estos son de estructura y no cambian, por eso se mantienen aquí (espejo de constants/catalogs).
 */
/* ─────────────── Movilidad interna (espejo de constants/catalogs.ts) ─────────────── */

/** Semáforo de elegibilidad. `tono` es la clase de `Chip`, para pintarlo igual en todas las vistas. */
export const MOVILIDAD = [
  { nivel: "alta", etiqueta: "Movilidad alta", corto: "Alta", tono: "ok" },
  { nivel: "media", etiqueta: "Movilidad media", corto: "Media", tono: "gold" },
  { nivel: "baja", etiqueta: "Movilidad baja", corto: "Baja", tono: "bad" },
] as const;

/** Desempeño en el puesto actual. */
export const DESEMPENO = [
  { nivel: "alto", etiqueta: "Alto", tono: "ok" },
  { nivel: "medio", etiqueta: "Medio", tono: "gold" },
  { nivel: "bajo", etiqueta: "Bajo", tono: "bad" },
] as const;

export const TIPOS_CURSO = ["curso", "certificado", "licencia"] as const;

/** Estatus del colaborador en su movilidad. Se DERIVA del proceso, no se guarda. */
export const ESTADOS_MOVILIDAD = [
  "Inactivo", "Actualizado", "En búsqueda", "En proceso", "Seleccionado", "Contratado",
] as const;

/** Acción recomendada al formador. También derivada; ver `utils/movilidad.ts`. */
export const ACCIONES_RECOMENDADAS = [
  "Transferir", "Promover", "Formar", "Desvincular", "Agradecer", "Sin acción",
] as const;

/** Afinidad a partir de la cual una vacante cuenta como oportunidad real. */
export const UMBRAL_AFINIDAD = 70;

/** Días sin tocar la ficha a partir de los cuales el colaborador cuenta como "Inactivo". */
export const DIAS_PERFIL_INACTIVO = 30;

export const FASES = [
  { nombre: "Búsqueda", subs: ["Publicación", "Marketplace de talento"] },
  { nombre: "Selección", subs: ["Ranking", "Entrevistas", "Selección y documentos"] },
  { nombre: "Contratación", subs: ["Carta oferta", "Contratación"] },
] as const;

export const PIPE = [
  "Invitado", "Postulado", "Filtros OK", "Video-IA", "Ranqueado", "Entrevista agendada",
  "Entrevistado", "Seleccionado", "Documentación", "Oferta", "Apertura de cuenta", "Contratado",
] as const;

export const PIPE_IDX: Record<string, number> = {
  invitado: 0, postulado: 1, filtros_ok: 2, video_ia: 3, evaluado: 4, slots_enviados: 5,
  agendado: 5, entrevistado: 6, seleccionado: 7, docs_completos: 8, oferta_enviada: 9,
  oferta_aceptada: 10, contratado: 11, descartado: -1, filtrado: -1, rechazado: -1,
};

export const CAMPOS_DESC: Record<string, string> = {
  titulo: "Título del puesto", descripcion: "Descripción", area: "Área",
  nivelPuesto: "Nivel del puesto", numVacantes: "Número de posiciones",
  ubicacionTrabajo: "Ubicación del trabajo", sede: "Sede", unidadNegocio: "Unidad de Negocio",
  tipoVacante: "Tipo de vacante", anosExp: "Años de experiencia", educacion: "Nivel de estudios",
  radio: "Radio de búsqueda", espRequeridas: "Áreas de experiencia",
  areasConocimiento: "Área de conocimiento", hardSkills: "Habilidades técnicas",
  softSkills: "Habilidades blandas", aptitudes: "Aptitudes", edad: "Rango de edad",
  turno: "Turno", sueldo: "Sueldo", modalidad: "Modalidad", dias: "Días de trabajo",
  horario: "Horario", salario: "Rango salarial", examenMedico: "Examen médico",
  // No son campos del descriptivo, pero sí de las solicitudes al administrador (ver `Solicitud`).
  formadorId: "Formador asignado", centroCostos: "Centro de costos",
};

/** Niveles de estudios ordenados (para el filtro "estudios mínimos" del pool). */
export const EDUCACION = [
  "Secundaria", "Bachillerato", "Técnico Superior", "Licenciatura", "Maestría", "Doctorado",
] as const;

/** Áreas de conocimiento / profesiones comunes (para `req.areasConocimiento`, máx. 3). */
export const PROFESIONES = [
  "Ingeniería de Software", "Administración de Empresas", "Contaduría", "Derecho", "Psicología",
  "Mercadotecnia", "Ingeniería Industrial", "Medicina", "Enfermería", "Arquitectura",
  "Diseño Gráfico", "Comunicación", "Economía", "Finanzas", "Recursos Humanos",
  "Comercio Internacional", "Sistemas Computacionales", "Gastronomía", "Turismo", "Educación",
  "Ventas", "Logística", "Actuaría", "Ingeniería Civil", "Química",
] as const;

/** Turnos de trabajo (para `req.turno`). */
/** "Turno personalizado" abre los campos de horario y días (`req.horario` / `req.dias`). */
export const TURNOS = ["Turno Matutino", "Turno Vespertino", "Turno Mixto", "Turno personalizado"] as const;
export const TURNO_PERSONALIZADO = "Turno personalizado";

export const AREAS = [
  "Tecnología", "Datos y Analítica", "Ventas", "Marketing", "Finanzas",
  "Recursos Humanos", "Operaciones", "Atención a Clientes", "Legal", "Producto",
] as const;

export const NIVELES = ["Practicante", "Junior", "Senior", "Gerente", "Directivo"] as const;

export const CIUDADES = ["CDMX", "Monterrey", "Guadalajara", "Puebla", "Querétaro", "Tijuana", "Mérida", "Toluca", "León"] as const;

/** Sucursales médicas simuladas (examen médico condicional). */
export const SUCURSALES_MEDICAS = [
  { nombre: "Clínica Salud Integral · Centro", dir: "Av. Juárez 120, Col. Centro" },
  { nombre: "Laboratorios BienestarMx · Sur", dir: "Calz. de Tlalpan 2100, Col. Country Club" },
  { nombre: "Centro Médico Empresarial · Norte", dir: "Av. Instituto Politécnico Nacional 1550, Col. Lindavista" },
  { nombre: "Unidad de Diagnóstico · Poniente", dir: "Av. Observatorio 340, Col. Daniel Garza" },
  { nombre: "Clínica Ejecutiva · Reforma", dir: "Paseo de la Reforma 450, Col. Juárez" },
] as const;

export const MODALIDADES = ["Presencial", "Híbrido", "Remoto"] as const;
export const TIPOS_SEDE = ["Corporativo", "Sucursal"] as const;
export const SEDES: Record<string, string[]> = {
  Corporativo: ["Corporativo Insurgentes Sur (CDMX)", "Corporativo Reforma 222 (CDMX)", "Corporativo Santa Fe (CDMX)", "Corporativo Valle Oriente (MTY)", "Corporativo Providencia (GDL)"],
  Sucursal: ["Sucursal Centro Histórico (CDMX)", "Sucursal Coapa (CDMX)", "Sucursal Cumbres (MTY)", "Sucursal Chapultepec (GDL)", "Sucursal Angelópolis (PUE)"],
};
export const TIPOS_VACANTE = ["Estándar", "Preventiva", "Proactiva", "Confidencial"] as const;
export const ESPECIALIDADES = [
  "Ventas B2C", "Ventas B2B", "Desarrollo Frontend", "Desarrollo Backend", "Ciencia de Datos",
  "Business Intelligence", "Marketing Digital", "CRM y Fidelización", "Contabilidad",
  "Planeación Financiera", "Atracción de Talento", "Capacitación", "Logística",
  "Cadena de Suministro", "Servicio al Cliente", "Cobranza", "Derecho Corporativo",
  "Cumplimiento (Compliance)", "Gestión de Producto", "UX/UI", "Ciberseguridad", "Infraestructura TI",
] as const;
export const HARD_SKILLS = [
  "Excel avanzado", "SQL", "Python", "Power BI", "Tableau", "React", "Node.js", "SAP",
  "Salesforce", "CRM", "Google Ads", "Meta Ads", "SEO", "Contabilidad NIF", "Modelado financiero",
  "Nómina", "LMS", "Zendesk", "AutoCAD", "Scrum", "Figma", "Redes Cisco", "Inglés avanzado",
  "Negociación comercial", "Prospección en frío",
] as const;
export const SOFT_SKILLS = [
  "Comunicación efectiva", "Liderazgo", "Trabajo en equipo", "Orientación a resultados",
  "Adaptabilidad", "Pensamiento analítico", "Empatía", "Negociación", "Atención al detalle",
  "Gestión del tiempo", "Resolución de conflictos", "Proactividad",
] as const;
export const APTITUDES = [
  "Razonamiento numérico", "Razonamiento verbal", "Razonamiento lógico", "Atención al detalle",
  "Orientación al servicio", "Liderazgo de equipos", "Tolerancia a la presión", "Creatividad",
] as const;
export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Disciplinas — agrupan los catálogos del editor de Requisitos
//
// Sin esto, editar Requisitos mostraba los cuatro catálogos enteros de golpe (25 profesiones + 22
// especialidades + 25 hard + 12 soft) para elegir un puñado. La clasificación es ESTÁTICA a
// propósito: es instantánea, funciona sin red y da siempre el mismo resultado, como exige el resto
// del proyecto.
//
// La pertenencia es MÚLTIPLE porque muchos valores son legítimamente de más de una disciplina
// (`SAP` es de administración y de operaciones). Un valor SIN entrada en el mapa es transversal y
// se muestra con cualquier filtro: es el caso de "Excel avanzado" o "Comunicación efectiva", que
// caben en todas y meterlos en un cajón de sastre sería mentir.
// ─────────────────────────────────────────────────────────────────────────────

export const DISCIPLINAS = [
  "Tecnología y Datos", "Administración y Finanzas", "Comercial y Marketing",
  "Operaciones e Ingeniería", "Salud y Bienestar", "Humanidades y Diseño",
] as const;

export type Disciplina = (typeof DISCIPLINAS)[number];

/**
 * Disciplina a la que pertenece cada área funcional (`AREAS`) de la vacante.
 *
 * Sirve para que "Sugeridas para el puesto" no se quede en dos o tres opciones: además de lo que
 * `PERFIL_POR_AREA` marca para el área, ofrece lo de su disciplina.
 */
export const DISCIPLINA_DE_AREA: Record<string, Disciplina> = {
  "Tecnología": "Tecnología y Datos",
  "Datos y Analítica": "Tecnología y Datos",
  "Producto": "Tecnología y Datos",
  "Finanzas": "Administración y Finanzas",
  "Recursos Humanos": "Administración y Finanzas",
  "Ventas": "Comercial y Marketing",
  "Marketing": "Comercial y Marketing",
  "Atención a Clientes": "Comercial y Marketing",
  "Operaciones": "Operaciones e Ingeniería",
  "Legal": "Humanidades y Diseño",
};

/** Áreas de conocimiento (`PROFESIONES`) por disciplina. */
export const DISC_PROFESIONES: Record<string, Disciplina[]> = {
  "Ingeniería de Software": ["Tecnología y Datos"],
  "Sistemas Computacionales": ["Tecnología y Datos"],
  "Actuaría": ["Tecnología y Datos", "Administración y Finanzas"],
  "Administración de Empresas": ["Administración y Finanzas"],
  "Contaduría": ["Administración y Finanzas"],
  "Economía": ["Administración y Finanzas"],
  "Finanzas": ["Administración y Finanzas"],
  "Recursos Humanos": ["Administración y Finanzas"],
  "Mercadotecnia": ["Comercial y Marketing"],
  "Ventas": ["Comercial y Marketing"],
  "Comercio Internacional": ["Comercial y Marketing", "Operaciones e Ingeniería"],
  "Turismo": ["Comercial y Marketing"],
  "Ingeniería Industrial": ["Operaciones e Ingeniería"],
  "Ingeniería Civil": ["Operaciones e Ingeniería"],
  "Arquitectura": ["Operaciones e Ingeniería", "Humanidades y Diseño"],
  "Química": ["Operaciones e Ingeniería", "Salud y Bienestar"],
  "Logística": ["Operaciones e Ingeniería"],
  "Gastronomía": ["Operaciones e Ingeniería"],
  "Medicina": ["Salud y Bienestar"],
  "Enfermería": ["Salud y Bienestar"],
  "Psicología": ["Salud y Bienestar", "Administración y Finanzas"],
  "Derecho": ["Humanidades y Diseño"],
  "Comunicación": ["Humanidades y Diseño", "Comercial y Marketing"],
  "Diseño Gráfico": ["Humanidades y Diseño"],
  "Educación": ["Humanidades y Diseño"],
};

/** Áreas de experiencia (`ESPECIALIDADES`) por disciplina. */
export const DISC_ESPECIALIDADES: Record<string, Disciplina[]> = {
  "Desarrollo Frontend": ["Tecnología y Datos"],
  "Desarrollo Backend": ["Tecnología y Datos"],
  "Ciencia de Datos": ["Tecnología y Datos"],
  "Business Intelligence": ["Tecnología y Datos", "Administración y Finanzas"],
  "Ciberseguridad": ["Tecnología y Datos"],
  "Infraestructura TI": ["Tecnología y Datos"],
  "Gestión de Producto": ["Tecnología y Datos"],
  "UX/UI": ["Tecnología y Datos", "Humanidades y Diseño"],
  "Contabilidad": ["Administración y Finanzas"],
  "Planeación Financiera": ["Administración y Finanzas"],
  "Cobranza": ["Administración y Finanzas"],
  "Atracción de Talento": ["Administración y Finanzas"],
  "Capacitación": ["Administración y Finanzas", "Humanidades y Diseño"],
  "Ventas B2C": ["Comercial y Marketing"],
  "Ventas B2B": ["Comercial y Marketing"],
  "Marketing Digital": ["Comercial y Marketing"],
  "CRM y Fidelización": ["Comercial y Marketing"],
  "Logística": ["Operaciones e Ingeniería"],
  "Cadena de Suministro": ["Operaciones e Ingeniería"],
  "Servicio al Cliente": ["Operaciones e Ingeniería", "Comercial y Marketing"],
  "Derecho Corporativo": ["Humanidades y Diseño"],
  "Cumplimiento (Compliance)": ["Humanidades y Diseño", "Administración y Finanzas"],
};

// Las habilidades técnicas y blandas NO se agrupan por disciplina: `skillsSugeridas()` ya las
// cruza con el área y el título y deja entre 4 y 8, un número que no necesita filtro.

export const DIRECCION_CORP = "Av. Insurgentes Sur 3579, Tlalpan, 14000 Ciudad de México, CDMX";
