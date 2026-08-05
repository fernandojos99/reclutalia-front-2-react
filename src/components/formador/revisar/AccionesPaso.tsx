/**
 * Pie de cada bloque del asistente: el botón de confirmar (destacado) y, a su lado, el botón
 * con ícono de chat. El de chat todavía no hace nada — llevará a un asistente de dudas generales.
 */
import { CheckCircle2, MessageSquare } from "lucide-react";

interface Props {
  hecho: boolean;
  bloqueado?: boolean;
  label?: string;
  onConfirmar: () => void;
}

export function AccionesPaso({ hecho, bloqueado, label = "Confirmar", onConfirmar }: Props) {
  return (
    <div className="paso-acciones">
      <button type="button" className={"btn " + (hecho ? "ok" : "gold")} disabled={bloqueado} onClick={onConfirmar}>
        <CheckCircle2 size={16} /> {hecho ? "Confirmado" : label}
      </button>
      <button type="button" className="btn ghost btn-chat" title="Resolver dudas con el asistente (próximamente)">
        <MessageSquare size={16} />
      </button>
    </div>
  );
}
