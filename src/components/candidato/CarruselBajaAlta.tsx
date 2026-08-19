/**
 * Proceso de baja y alta del colaborador, como carrusel de pantallas.
 *
 * En producción esto son capturas del sistema de RH por el que el colaborador pasa realmente. Aquí
 * las láminas se **dibujan en SVG**, no se cargan como imágenes: el prototipo no tiene esas
 * capturas, y un carrusel con marcos vacíos no demuestra nada. Dibujadas se lee lo que hace cada
 * pantalla, pesan cero y se sustituyen por fotos reales cambiando solo el array `LAMINAS`.
 *
 * El botón de cerrar el trámite aparece **solo en la última**: es lo que obliga a pasar por todas y
 * a que el gesto final signifique "ya vi el proceso completo".
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Modal } from "../common/Modal";

interface Props {
  /** Fecha de ingreso ya acordada; se pinta dentro de la lámina del alta. */
  fecha: string;
  /** Sede ya acordada. */
  sede: string;
  puestoNuevo: string;
  puestoActual: string;
  enviando: boolean;
  onFinalizar: () => void;
  onClose: () => void;
}

/** Paleta tomada de los tokens del tema, en literal: el SVG no hereda `var()` en `fill`. */
const TINTA = "#3D3D3D";
const LINEA = "#E5E2DA";
const ORO = "#FFB81C";
const VERDE = "#1E7A3C";
const GRIS = "#8C8C8C";

/** Ventana de aplicación: la cáscara que se repite en las cuatro láminas. */
function Ventana({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 420 250" width="100%" role="img" aria-label={titulo}>
      <rect x="1" y="1" width="418" height="248" rx="10" fill="#FFFFFF" stroke={LINEA} strokeWidth="2" />
      <rect x="1" y="1" width="418" height="30" rx="10" fill="#F6F5F1" />
      <rect x="1" y="24" width="418" height="7" fill="#F6F5F1" />
      <circle cx="18" cy="16" r="4" fill="#E0685E" />
      <circle cx="32" cy="16" r="4" fill={ORO} />
      <circle cx="46" cy="16" r="4" fill="#7FBA00" />
      <text x="62" y="20" fontSize="10.5" fontWeight="700" fill={TINTA}>{titulo}</text>
      {children}
    </svg>
  );
}

/** Renglón de formulario: etiqueta arriba, caja con valor debajo. */
function Campo({ x, y, w, etiqueta, valor }: { x: number; y: number; w: number; etiqueta: string; valor: string }) {
  return (
    <>
      <text x={x} y={y} fontSize="8" fill={GRIS}>{etiqueta}</text>
      <rect x={x} y={y + 6} width={w} height="20" rx="4" fill="#FFFFFF" stroke={LINEA} />
      <text x={x + 7} y={y + 20} fontSize="9" fill={TINTA}>{valor}</text>
    </>
  );
}

/** Palomita verde con su texto, para las listas de "ya está hecho". */
function Palomita({ x, y, texto }: { x: number; y: number; texto: string }) {
  return (
    <>
      <circle cx={x + 6} cy={y - 3} r="6" fill={VERDE} />
      <path d={`M ${x + 3} ${y - 3} l 2.2 2.4 l 3.8 -4.6`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={x + 18} y={y} fontSize="9.5" fill={TINTA}>{texto}</text>
    </>
  );
}

export function CarruselBajaAlta({ fecha, sede, puestoNuevo, puestoActual, enviando, onFinalizar, onClose }: Props) {
  const [i, setI] = useState(0);

  const LAMINAS = [
    {
      titulo: "Solicitud de baja",
      pie: "Se registra la baja de tu puesto actual. El motivo queda como movimiento interno, no como renuncia.",
      svg: (
        <Ventana titulo="Portal RH · Solicitud de baja">
          <Campo x={24} y={52} w={170} etiqueta="Puesto que dejas" valor={puestoActual} />
          <Campo x={24} y={96} w={170} etiqueta="Motivo" valor="Movimiento interno" />
          <Campo x={24} y={140} w={170} etiqueta="Último día en el puesto" valor={fecha || "por definir"} />
          <rect x={218} y={52} width="178" height="134" rx="6" fill="#F6F5F1" />
          <text x={230} y={70} fontSize="9" fontWeight="700" fill={TINTA}>Antes de continuar</text>
          <Palomita x={230} y={92} texto="Reunión de cierre agendada" />
          <Palomita x={230} y={116} texto="Actividades documentadas" />
          <Palomita x={230} y={140} texto="Herramientas entregadas" />
          <rect x={24} y={200} width="120" height="26" rx="6" fill={ORO} />
          <text x={50} y={217} fontSize="10" fontWeight="700" fill="#1A1A1A">Solicitar baja</text>
        </Ventana>
      ),
    },
    {
      titulo: "Entrega de activos",
      pie: "Devuelves lo que era del puesto anterior. Lo que sigues necesitando en el nuevo se traspasa, no se entrega.",
      svg: (
        <Ventana titulo="Portal RH · Entrega de activos">
          <text x={24} y={54} fontSize="9" fontWeight="700" fill={TINTA}>Activos asignados</text>
          {[
            ["Equipo de cómputo", "Se traspasa"],
            ["Credencial de acceso", "Se reemplaza"],
            ["Uniforme y gafete", "Se entrega"],
            ["Llaves de caja", "Se entrega"],
          ].map(([activo, accion], k) => (
            <g key={activo}>
              <rect x={24} y={64 + k * 30} width="372" height="24" rx="5" fill={k % 2 ? "#F6F5F1" : "#FFFFFF"} stroke={LINEA} />
              <text x={34} y={80 + k * 30} fontSize="9.5" fill={TINTA}>{activo}</text>
              <text x={300} y={80 + k * 30} fontSize="9" fill={GRIS}>{accion}</text>
            </g>
          ))}
          <rect x={24} y={200} width="150" height="26" rx="6" fill={ORO} />
          <text x={44} y={217} fontSize="10" fontWeight="700" fill="#1A1A1A">Confirmar entrega</text>
        </Ventana>
      ),
    },
    {
      titulo: "Alta en el nuevo puesto",
      pie: "Tu expediente se mueve al nuevo puesto con la fecha y la sede que ya se acordaron.",
      svg: (
        <Ventana titulo="Portal RH · Alta de puesto">
          <Campo x={24} y={52} w={170} etiqueta="Puesto nuevo" valor={puestoNuevo} />
          <Campo x={24} y={96} w={170} etiqueta="Fecha de ingreso" valor={fecha || "por definir"} />
          <Campo x={24} y={140} w={372} etiqueta="Sede" valor={sede || "por definir"} />
          <rect x={218} y={52} width="178" height="64" rx="6" fill="#E7F4EB" />
          <text x={230} y={72} fontSize="9" fontWeight="700" fill={VERDE}>Expediente validado</text>
          <text x={230} y={90} fontSize="8.5" fill={TINTA}>Tus documentos ya estaban</text>
          <text x={230} y={103} fontSize="8.5" fill={TINTA}>en la empresa: no se repiten.</text>
          <rect x={24} y={200} width="130" height="26" rx="6" fill={ORO} />
          <text x={48} y={217} fontSize="10" fontWeight="700" fill="#1A1A1A">Generar alta</text>
        </Ventana>
      ),
    },
    {
      titulo: "Firma del nuevo contrato",
      pie: "Firmas y con eso queda cerrado. Tu formador verá el proceso como finalizado.",
      svg: (
        <Ventana titulo="Portal RH · Firma electrónica">
          <rect x={24} y={48} width="200" height="150" rx="6" fill="#FFFFFF" stroke={LINEA} />
          {[62, 76, 90, 104, 118, 132].map((y, k) => (
            <rect key={y} x={36} y={y} width={k === 5 ? 100 : 176} height="5" rx="2.5" fill="#EFEDE7" />
          ))}
          <text x={36} y={162} fontSize="8" fill={GRIS}>Firma del colaborador</text>
          <path d="M 40 182 q 14 -14 26 0 t 26 -4 t 24 6" stroke={TINTA} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <line x1={36} y1={188} x2={212} y2={188} stroke={LINEA} strokeWidth="1.5" />
          <rect x={240} y={48} width="156" height="150" rx="6" fill="#F6F5F1" />
          <text x={252} y={68} fontSize="9" fontWeight="700" fill={TINTA}>Contrato</text>
          <text x={252} y={86} fontSize="8.5" fill={TINTA}>{puestoNuevo}</text>
          <text x={252} y={104} fontSize="8.5" fill={GRIS}>Ingreso: {fecha || "por definir"}</text>
          <Palomita x={252} y={132} texto="Identidad verificada" />
          <Palomita x={252} y={156} texto="Contrato generado" />
          <rect x={240} y={172} width="156" height="18" rx="4" fill="#E7F4EB" />
          <text x={252} y={185} fontSize="8.5" fontWeight="700" fill={VERDE}>Listo para firmar</text>
        </Ventana>
      ),
    },
  ];

  const ultima = i === LAMINAS.length - 1;
  const lamina = LAMINAS[i];

  return (
    <Modal onClose={onClose} wide>
      <h3 style={{ marginBottom: 4 }}>Proceso de baja y alta</h3>
      <p className="help" style={{ marginBottom: 12 }}>
        Paso {i + 1} de {LAMINAS.length} · {lamina.titulo}
      </p>

      <div style={{ background: "var(--bg)", borderRadius: "var(--r-3)", padding: 14 }}>
        {lamina.svg}
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink2)", margin: "12px 2px 0" }}>
        {lamina.pie}
      </p>

      {/* Los puntos también navegan: en móvil son el objetivo más fácil de acertar. */}
      <div style={{ display: "flex", justifyContent: "center", gap: 7, margin: "14px 0 12px" }}>
        {LAMINAS.map((l, k) => (
          <button key={l.titulo} className={"carr-punto" + (k === i ? " on" : "")}
            aria-label={`Ir al paso ${k + 1}: ${l.titulo}`} aria-current={k === i}
            onClick={() => setI(k)} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ChevronLeft size={15} /> Anterior
        </button>
        {ultima ? (
          <button className="btn gold" disabled={enviando} onClick={onFinalizar}>
            <CheckCircle2 size={15} /> Finalizar contratación
          </button>
        ) : (
          <button className="btn dark" onClick={() => setI(i + 1)}>
            Siguiente <ChevronRight size={15} />
          </button>
        )}
      </div>
    </Modal>
  );
}
