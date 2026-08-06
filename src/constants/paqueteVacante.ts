/**
 * Paquete de la vacante: MRFN, bonos, prestaciones, beneficios y herramientas.
 *
 * Nada de esto vive en el modelo de dominio (`Requisito` no los tiene): se DERIVA de forma
 * determinista del propio requisito, igual que el resto de simulaciones del demo. Si algún día
 * el backend los persiste, este archivo es el único punto a reemplazar.
 */
import {
  Car, Laptop, MonitorCog, AppWindow, HeartPulse, Stethoscope, PiggyBank, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { money } from "../utils/format";
import type { Requisito } from "../types/models/domain";

export interface Item {
  titulo: string;
  /** Nodo derecho de la cabecera (monto, cobertura…). Opcional. */
  extra?: string;
  detalle: string;
  icono?: LucideIcon;
}

// ─────────────────────────────────────────────────────────────────────────────
// MRFN — Mandato, Responsabilidades, Funciones y No funciones
// ─────────────────────────────────────────────────────────────────────────────

export interface MRFN {
  mandato: string;
  responsabilidades: string[];
  funciones: string[];
  noFunciones: string[];
}

export function mrfn(req: Requisito): MRFN {
  const equipo = req.numVacantes > 1 ? `${req.numVacantes} posiciones` : "la posición";
  return {
    mandato:
      `Garantizar la operación de ${req.area} en ${req.ubicacionTrabajo} desde ${equipo} de ` +
      `${req.titulo}, cumpliendo los estándares de servicio, los controles internos y las metas ` +
      `del trimestre, con un mínimo de ${req.expNoRelevante ? "experiencia no determinante" : `${req.anosExp} año(s) de experiencia`}.`,
    responsabilidades: [
      `Responder por los indicadores de ${req.area} asignados a la posición.`,
      "Cumplir y hacer cumplir las políticas internas y la normatividad aplicable.",
      "Escalar oportunamente cualquier riesgo, incidencia o desviación detectada.",
      `Mantener la comunicación con las áreas que dependen de ${req.area}.`,
      "Documentar la operación diaria conforme al procedimiento vigente.",
    ],
    funciones: [
      `Ejecutar las actividades diarias propias de ${req.titulo}.`,
      `Operar las herramientas y sistemas asignados (${(req.hardSkills.slice(0, 3).join(", ") || "los del área")}).`,
      "Elaborar los reportes de cierre en tiempo y forma.",
      "Atender las solicitudes de su cadena de mando y de las áreas cliente.",
      "Participar en las capacitaciones y certificaciones del puesto.",
    ],
    noFunciones: [
      "Autorizar excepciones a política sin el visto bueno de su jefe directo.",
      "Contratar, desvincular o negociar condiciones laborales de terceros.",
      "Comprometer recursos o presupuesto fuera de su nivel de autorización.",
      "Representar a la empresa ante autoridades sin designación expresa.",
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Compensación
// ─────────────────────────────────────────────────────────────────────────────

/** Sueldo mensual que se muestra: el explícito o el punto medio del rango (misma fórmula que el descriptivo). */
export const sueldoMensual = (req: Requisito): number =>
  req.sueldo ?? Math.round((req.salarioMin + req.salarioMax) / 2 / 500) * 500;

/**
 * Conceptos del paquete de compensación, escalados sobre el sueldo de la vacante.
 * Los montos se derivan con porcentajes fijos: mismo requisito ⇒ mismo resultado (el proyecto
 * prohíbe la aleatoriedad real).
 */
export function bonos(req: Requisito): Item[] {
  const s = sueldoMensual(req);
  return [
    {
      titulo: "Sueldo",
      extra: `${money(s)} /mes`,
      detalle:
        `Sueldo mensual bruto de la posición. El rango autorizado del puesto va de ` +
        `${money(req.salarioMin)} a ${money(req.salarioMax)}; el monto final se define al emitir la carta oferta.`,
    },
    {
      titulo: "Prestaciones",
      extra: "de ley y superiores",
      detalle:
        "Aguinaldo de 30 días (contra los 15 de la LFT), prima vacacional del 40 % y meses de abono " +
        "acumulables por antigüedad. Aplican desde el alta y se prorratean si el ingreso ocurre durante el año.",
    },
    {
      titulo: "Compensación variable",
      extra: `hasta ${money(Math.round((s * 0.18) / 100) * 100)} /mes`,
      detalle:
        "Parte variable ligada al cumplimiento de las metas individuales y del área. Se calcula sobre el " +
        "resultado mensual y se deposita con la segunda quincena del mes siguiente.",
    },
    {
      titulo: "Bono anual",
      extra: `hasta ${money(Math.round((s * 2) / 100) * 100)}`,
      detalle:
        "Bono por desempeño del ejercicio, equivalente hasta a dos sueldos mensuales. Se evalúa en enero " +
        "sobre el año cerrado y requiere haber cubierto el ejercicio completo en la posición.",
    },
    {
      titulo: "Vales de gasolina",
      extra: `${money(Math.round((s * 0.06) / 50) * 50)} /mes`,
      detalle:
        "Apoyo de combustible depositado en monedero electrónico el primer día hábil de cada mes. No es " +
        "acumulable entre periodos y se prorratea el mes de ingreso.",
    },
  ];
}

/** Prestaciones (listado con detalle desplegable). */
export const PRESTACIONES: Item[] = [
  {
    titulo: "Vacaciones superiores a la ley",
    extra: "16 días el primer año",
    detalle:
      "16 días hábiles desde el primer año cumplido (la ley marca 12) y un día adicional por cada año de " +
      "antigüedad hasta llegar a 24. Se programan con el jefe directo con dos semanas de anticipación.",
  },
  {
    titulo: "Prima vacacional",
    extra: "40 %",
    detalle:
      "40 % sobre los días de vacaciones que correspondan, contra el 25 % de ley. Se deposita en la " +
      "quincena en que inicia el periodo vacacional.",
  },
  {
    titulo: "Vales de despensa",
    extra: "10 % del sueldo",
    detalle:
      "Monedero electrónico con el 10 % del sueldo mensual, dentro del tope exento. Se dispersa el día 1 " +
      "de cada mes y es aceptado en las principales cadenas de autoservicio.",
  },
  {
    titulo: "Seguro de gastos médicos mayores",
    extra: "desde el día 1",
    detalle:
      "Cobertura para el colaborador desde su ingreso, con posibilidad de agregar cónyuge e hijos con " +
      "costo preferente. Suma asegurada de 2 millones y deducible reducido en red.",
  },
  {
    titulo: "Días económicos",
    extra: "3 al año",
    detalle:
      "Tres días con goce de sueldo al año para trámites personales, independientes de las vacaciones. " +
      "Se solicitan con 48 horas de anticipación y no son acumulables.",
  },
];

/** "Otros" del paquete: tres ítems genéricos. */
export const OTROS: Item[] = [
  {
    titulo: "Plan de carrera",
    detalle:
      "Ruta de crecimiento definida con tu jefe directo a 6, 12 y 24 meses, con evaluación semestral " +
      "y prioridad en las vacantes internas que se publiquen en el Marketplace de talento.",
  },
  {
    titulo: "Capacitación continua",
    detalle:
      "Acceso a la plataforma de cursos internos y a certificaciones externas pagadas por la empresa " +
      "cuando estén ligadas al puesto. Mínimo 40 horas de formación al año.",
  },
  {
    titulo: "Apoyos y descuentos para colaboradores",
    detalle:
      "Convenios con gimnasios, universidades y comercios, apoyo para lentes y descuentos en los " +
      "productos y servicios de la empresa.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Beneficios
// ─────────────────────────────────────────────────────────────────────────────

export const BENEFICIOS: Item[] = [
  {
    titulo: "Seguro de vida",
    icono: HeartPulse,
    extra: "24 meses de sueldo",
    detalle:
      "Póliza colectiva por 24 meses de sueldo, con cobertura por muerte accidental e invalidez total y " +
      "permanente. Designas beneficiarios al ingresar y puedes modificarlos cuando quieras.",
  },
  {
    titulo: "Seguro médico",
    icono: Stethoscope,
    extra: "red nacional",
    detalle:
      "Gastos médicos mayores con red de hospitales a nivel nacional, más consultas de medicina general " +
      "y telemedicina sin costo. Incluye check-up anual preventivo.",
  },
  {
    titulo: "Fondo de ahorros",
    icono: PiggyBank,
    extra: "aportación 1 a 1",
    detalle:
      "Ahorras vía nómina y la empresa aporta el mismo porcentaje. Puedes solicitar préstamos sobre tu " +
      "saldo con tasa preferente y se liquida en diciembre.",
  },
  {
    titulo: "IMSS",
    icono: ShieldCheck,
    extra: "alta desde el día 1",
    detalle:
      "Alta ante el IMSS con el salario real desde tu primer día, con INFONAVIT y AFORE. Contrato por " +
      "tiempo indeterminado tras el periodo de prueba.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Herramientas de trabajo (dependen del puesto)
// ─────────────────────────────────────────────────────────────────────────────

const SOFTWARE_POR_AREA: Record<string, string[]> = {
  Tecnología: ["Git y GitHub", "Jira", "Slack", "VS Code"],
  "Datos y Analítica": ["Power BI", "Excel", "Jira", "Slack"],
  Ventas: ["CRM corporativo", "Excel", "WhatsApp Business", "Slack"],
  Marketing: ["Meta Business Suite", "Google Ads", "Canva", "Slack"],
  Finanzas: ["SAP", "Excel", "Portal bancario", "Slack"],
  "Recursos Humanos": ["Sistema de nómina", "LMS interno", "Excel", "Slack"],
  Operaciones: ["SAP", "Excel", "Sistema de punto de venta", "Slack"],
  "Atención a Clientes": ["Zendesk", "CRM corporativo", "Sistema de punto de venta", "Slack"],
  Legal: ["Gestor documental", "Excel", "Firma electrónica", "Slack"],
  Producto: ["Figma", "Jira", "Amplitude", "Slack"],
};

/** ¿El puesto trae auto asignado? (comercial o de campo/ruta). */
const conAuto = (req: Requisito): boolean =>
  req.area === "Ventas" || /campo|ruta|foráne|foranea|visitador/i.test(req.titulo);

export function herramientas(req: Requisito): Item[] {
  const pesado = req.area === "Tecnología" || req.area === "Datos y Analítica" || req.area === "Producto";
  const software = [...new Set([...(SOFTWARE_POR_AREA[req.area] ?? ["Excel", "Slack", "Correo corporativo"]), ...req.hardSkills])];

  const items: Item[] = [
    {
      titulo: "Computadora",
      icono: Laptop,
      extra: pesado ? "Laptop 16 GB RAM" : "Laptop 8 GB RAM",
      detalle: pesado
        ? "Laptop de 14\" con 16 GB de RAM y SSD de 512 GB, monitor externo y diadema. Se entrega el primer " +
          "día contra resguardo y se renueva cada 3 años."
        : "Laptop de 14\" con 8 GB de RAM y SSD de 256 GB, más diadema. Se entrega el primer día contra " +
          "resguardo y se renueva cada 4 años.",
    },
    {
      titulo: "Sistema operativo",
      icono: MonitorCog,
      extra: pesado ? "Windows 11 Pro o macOS" : "Windows 11 Pro",
      detalle: pesado
        ? "Puedes elegir entre Windows 11 Pro y macOS según tu stack de trabajo. El equipo llega con el " +
          "antivirus corporativo, VPN y cifrado de disco ya configurados."
        : "Windows 11 Pro con la imagen corporativa: antivirus, VPN, cifrado de disco y las políticas de " +
          "seguridad de la empresa preinstaladas.",
    },
    {
      titulo: "Software y accesos",
      icono: AppWindow,
      extra: `${software.length} herramientas`,
      detalle:
        `Licencias y accesos que se dan de alta antes de tu primer día: ${software.join(", ")}. ` +
        "Cualquier alta adicional se solicita a Sistemas por el portal de servicios.",
    },
  ];

  if (conAuto(req)) {
    items.unshift({
      titulo: "Auto de la empresa",
      icono: Car,
      extra: "con gasolina y casetas",
      detalle:
        "Vehículo utilitario asignado con seguro de cobertura amplia, mantenimiento programado y tarjeta " +
        "de gasolina y casetas. Requiere licencia vigente y firmar el reglamento de uso.",
    });
  }
  return items;
}
