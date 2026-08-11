/**
 * Confirmación de una acción que descarta trabajo del usuario.
 *
 * Existe porque cada sección editable del anuncio guarda por separado: cerrar una con cambios sin
 * guardar los pierde sin más aviso, y eso es justo lo que hay que preguntar antes.
 */
import { Modal } from "./Modal";

interface Props {
  titulo: string;
  mensaje: string;
  /** Texto del botón que confirma la pérdida. */
  confirmar?: string;
  cancelar?: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export function ConfirmarModal({
  titulo, mensaje, confirmar = "Descartar cambios", cancelar = "Seguir editando", onConfirmar, onCerrar,
}: Props) {
  return (
    <Modal onClose={onCerrar}>
      <h3 style={{ fontSize: 16, marginBottom: 6 }}>{titulo}</h3>
      <p className="help" style={{ marginTop: 0 }}>{mensaje}</p>
      <div className="paso-acciones">
        <button type="button" className="btn gold" onClick={onConfirmar}>{confirmar}</button>
        <button type="button" className="btn ghost" onClick={onCerrar}>{cancelar}</button>
      </div>
    </Modal>
  );
}
