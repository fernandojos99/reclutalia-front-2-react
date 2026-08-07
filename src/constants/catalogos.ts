/**
 * Catálogos estáticos necesarios de forma síncrona por componentes/helpers (fases, pipeline).
 * Los catálogos "de datos" (áreas, skills, etc.) se cargan del backend vía useCatalogos;
 * estos son de estructura y no cambian, por eso se mantienen aquí (espejo de constants/catalogs).
 */
export const FASES = [
  { nombre: "Búsqueda", subs: ["Descriptivo", "Marketplace de talento"] },
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
  radio: "Radio de búsqueda", espRequeridas: "Especialidades",
  areasConocimiento: "Área de conocimiento", hardSkills: "Habilidades técnicas",
  softSkills: "Habilidades blandas", aptitudes: "Aptitudes", edad: "Rango de edad",
  turno: "Turno", sueldo: "Sueldo", modalidad: "Modalidad", dias: "Días de trabajo",
  horario: "Horario", salario: "Rango salarial", examenMedico: "Examen médico",
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

export const DIRECCION_CORP = "Av. Insurgentes Sur 3579, Tlalpan, 14000 Ciudad de México, CDMX";
