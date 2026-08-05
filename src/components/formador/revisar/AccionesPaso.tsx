/**
 * Pie de cada bloque del asistente: el botón de confirmar (destacado) y, a su lado, el botón
 * con ícono de chat, que abre el bot flotante para resolver dudas sin salir del asistente.
 */
import { CheckCircle2, MessageSquare } from "lucide-react";
import { useBot } from "../../../contexts/BotContext";

interface Props {
  hecho: boolean;
  bloqueado?: boolean;
  label?: string;
  onConfirmar: () => void;
}

export function AccionesPaso({ hecho, bloqueado, label = "Confirmar", onConfirmar }: Props) {
  const { abrir } = useBot();
  return (
    <div className="paso-acciones">
      <button type="button" className={"btn " + (hecho ? "ok" : "gold")} disabled={bloqueado} onClick={onConfirmar}>
        <CheckCircle2 size={16} /> {hecho ? "Confirmado" : label}
      </button>
      <button type="button" className="btn ghost btn-chat" onClick={abrir} title="Resolver dudas con el asistente">
        <MessageSquare size={16} />
      </button>
    </div>
  );
}
