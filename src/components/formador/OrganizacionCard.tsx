/**
 * Marco de la plantilla en el inicio del formador: bajo qué organización cuelga el organigrama,
 * contra qué centro de costos se presupuesta y cómo pedir que se ajuste.
 *
 * El formador NO edita la estructura (la definen Compensaciones / estructura organizacional), así
 * que el único camino es "Solicitar ajustes": describe el cambio y le llega al administrador.
 */
import { useState } from "react";
import { Building2, Network, Banknote, Send, SlidersHorizontal } from "lucide-react";
import { Modal } from "../common/Modal";
import { marcoOrganizacional } from "../../constants/organizacion";
import type { Formador } from "../../types/models/domain";

interface Props {
  formador: Formador;
  /** Se llama con el texto de la solicitud al enviarla. */
  onSolicitar: (texto: string) => void;
}

function Dato({ icono: Icono, l, c }: { icono: typeof Network; l: string; c: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
      <Icono size={16} style={{ color: "var(--gold-dark)", flexShrink: 0, marginTop: 3 }} />
      <div style={{ minWidth: 0 }}>
        <label style={{ marginBottom: 2 }}>{l}</label>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c}</div>
      </div>
    </div>
  );
}

export function OrganizacionCard({ formador, onSolicitar }: Props) {
  const [pidiendo, setPidiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const org = marcoOrganizacional(formador);

  const enviar = () => {
    onSolicitar(texto.trim());
    setTexto("");
    setPidiendo(false);
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="org-grid">
          <Dato icono={Building2} l="Unidad de negocio" c={org.unidadNegocio} />
          <Dato icono={Network} l="Departamento" c={org.departamento} />
          <Dato icono={Banknote} l="Centro de costos" c={org.centroCostos} />
          <button type="button" className="btn ghost sm org-ajustes" onClick={() => setPidiendo(true)}>
            <SlidersHorizontal size={13} /> Solicitar ajustes
          </button>
        </div>
        <p className="help" style={{ margin: "12px 0 0" }}>
          Organigrama de {org.responsable} · {org.puesto}. Revisa tu estructura y centro de costos,
          si algo no cuadra , solicita un ajuntes antes de cubrir tus vacantes.
        </p>
      </div>

      {pidiendo && (
        <Modal onClose={() => setPidiendo(false)}>
          <h3 style={{ marginBottom: 4 }}>Solicitar ajustes a la organización</h3>
          <p className="help" style={{ marginBottom: 12 }}>
            {org.unidadNegocio} · {org.departamento} · CC {org.centroCostos}. Describe qué hay que
            corregir (posiciones, adscripción, centro de costos); el administrador lo revisará.
          </p>
          <div className="field">
            <label>¿Qué ajuste necesitas?</label>
            <textarea rows={5} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder="p. ej. La posición de Cajero Supervisor debería cargarse al CC de Sucursales, no al de Ventas." />
          </div>
          <div className="paso-acciones">
            <button type="button" className="btn gold" disabled={!texto.trim()} onClick={enviar}>
              <Send size={15} /> Enviar solicitud
            </button>
            <button type="button" className="btn ghost" onClick={() => setPidiendo(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </>
  );
}
