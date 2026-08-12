/**
 * Barra lateral: navegación por rol + selector demo de rol / formador / candidato / tema.
 * Portado del bloque `<aside className="side">` del App original. Usa react-router para navegar.
 */
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Bell, CalendarCheck, LayoutGrid, Plus, Users, Briefcase, Search, X, Radar, RotateCcw, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import { useDemo, type Rol } from "../../contexts/DemoContext";
import { useData } from "../../store/DataProvider";
import { resetSessionId } from "../../services/agenteService";
import { adminService } from "../../services/adminService";
import { Modal } from "../common/Modal";
import { THEMES } from "../../styles/themes";
import type { Formador, Candidato } from "../../types/models/domain";

interface SidebarProps {
  formadores: Formador[];
  candidatos: Candidato[];
  noLeidas: number;
  /** Entrevistas que le pidieron a este formador y aún no cierra. */
  entrevistasPendientes?: number;
  /** En móvil el sidebar es un drawer: `open` lo muestra, `onClose` lo cierra. */
  open?: boolean;
  onClose?: () => void;
}

interface ItemNav { to: string; icon: typeof Home; label: string; end?: boolean }

const navPorRol: Record<Rol, ItemNav[]> = {
  formador: [
    { to: "/formador", icon: Home, label: "Mis vacantes", end: true },
    { to: "/formador/entrevistas", icon: CalendarCheck, label: "Entrevistas asignadas" },
    { to: "/formador/movilidad", icon: TrendingUp, label: "Movilidad interna" },
    { to: "/formador/notificaciones", icon: Bell, label: "Notificaciones" },
  ],
  admin: [
    { to: "/admin", icon: LayoutGrid, label: "Vacantes", end: true },
    { to: "/admin/nueva", icon: Plus, label: "Nueva vacante" },
    { to: "/admin/pool", icon: Users, label: "Marketplace de talento" },
    { to: "/admin/notificaciones", icon: Bell, label: "Notificaciones" },
  ],
  candidato: [
    { to: "/candidato", icon: Briefcase, label: "Mis procesos", end: true },
    { to: "/candidato/buscar", icon: Search, label: "Buscar vacantes" },
    { to: "/candidato/notificaciones", icon: Bell, label: "Notificaciones" },
  ],
};

/**
 * Navegación del rol activo. MOVILIDAD solo aparece para candidatos INTERNOS: un externo no se
 * mueve dentro del grupo porque todavía no está dentro. Va después de "Buscar vacantes" para que
 * queden juntas las dos formas de encontrar un puesto.
 */
function navDe(rol: Rol, cand?: Candidato): ItemNav[] {
  const base = navPorRol[rol];
  if (rol !== "candidato" || cand?.tipo !== "interno") return base;
  const i = base.findIndex((x) => x.to === "/candidato/buscar");
  const movilidad: ItemNav = { to: "/candidato/movilidad", icon: TrendingUp, label: "Movilidad" };
  return [...base.slice(0, i + 1), movilidad, ...base.slice(i + 1)];
}

export function Sidebar({ formadores, candidatos, noLeidas, entrevistasPendientes = 0, open = false, onClose }: SidebarProps) {
  const { rol, setRol, formadorId, setFormadorId, candId, setCandId, tema, setTema, toast } = useDemo();
  const { actions, reload } = useData();
  const location = useLocation();
  const [confirmBorrar, setConfirmBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  // #22: retrocede una etapa el proceso de la vacante que el formador está viendo.
  const resetearEtapa = async () => {
    const m = location.pathname.match(/^\/formador\/vacante\/(.+)$/);
    if (!m) { toast("Abre una vacante para resetear su etapa."); onClose?.(); return; }
    try {
      await actions.resetearEtapa(m[1]);
      toast("Etapa del proceso retrocedida.");
    } catch (e) {
      toast((e as Error).message);
    }
    onClose?.();
  };

  // Reinicia toda la BD al seed (demo). Recarga los datos al terminar.
  const borrarTodo = async () => {
    setBorrando(true);
    try {
      await adminService.resetSeed();
      await reload();
      setConfirmBorrar(false);
      toast("Datos reiniciados al seed.");
    } catch (e) {
      toast("No se pudo reiniciar: " + (e as Error).message);
    } finally {
      setBorrando(false);
    }
    onClose?.();
  };

  // Al cambiar de perfil recargamos la página a propósito: así se resetea el asistente de IA
  // (estado del chat) y, olvidando el sessionId, también su memoria en el servidor.
  // El perfil se persiste en localStorage (DemoContext), por eso sobrevive a la recarga.
  const recargarConNuevoPerfil = (destino: string) => {
    resetSessionId();
    window.location.assign(destino);
  };

  const cambiarRol = (r: Rol) => {
    setRol(r);
    recargarConNuevoPerfil(`/${r}`);
  };

  const cambiarFormador = (id: string) => {
    setFormadorId(id);
    recargarConNuevoPerfil("/formador");
  };

  const cambiarCandidato = (id: number) => {
    setCandId(id);
    recargarConNuevoPerfil("/candidato");
  };

  return (
    <>
      {open && <div className="side-backdrop" onClick={onClose} />}
      <aside className={"side" + (open ? " open" : "")}>
      <div className="logo">
        <div className="mark"><Radar size={19} /></div>
        <div>
          <b>Radar</b>
          <span>DE CANDIDATOS</span>
        </div>
        <button className="iconbtn side-close" title="Cerrar menú" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {navDe(rol, candidatos.find((c) => c.id === candId)).map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onClose}
          className={({ isActive }) => "nav-item" + (isActive ? " on" : "")}>
          <Icon size={16} />
          {label}
          {label === "Entrevistas asignadas" && entrevistasPendientes > 0 && (
            <span className="chip gold" style={{ marginLeft: "auto" }}>{entrevistasPendientes}</span>
          )}
          {label === "Notificaciones" && noLeidas > 0 && (
            <span className="chip gold" style={{ marginLeft: "auto" }}>{noLeidas}</span>
          )}
        </NavLink>
      ))}

      {rol === "formador" && (
        <button className="nav-item" onClick={resetearEtapa} title="Retrocede una etapa el proceso de la vacante abierta">
          <RotateCcw size={16} /> Resetear etapa actual
        </button>
      )}

      <div className="rolebox">
        <p>VISTA DEMO — CAMBIAR ROL</p>
        <select value={rol} onChange={(e) => cambiarRol(e.target.value as Rol)}>
          <option value="formador">Formador de equipo</option>
          <option value="admin">Administrador</option>
          <option value="candidato">Candidato</option>
        </select>

        {rol === "formador" && (
          <select style={{ marginTop: 8 }} value={formadorId} onChange={(e) => cambiarFormador(e.target.value)}>
            {formadores.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        )}

        {rol === "candidato" && (
          <select style={{ marginTop: 8 }} value={candId} onChange={(e) => cambiarCandidato(Number(e.target.value))}>
            {candidatos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        )}

        <p style={{ marginTop: 12 }}>VISTA DEMO — CAMBIAR ESTILO</p>
        <select style={{ marginTop: 8 }} value={tema} onChange={(e) => setTema(e.target.value)}>
          {Object.values(THEMES).map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      {rol === "admin" && (
        <button className="nav-item danger-item" style={{ marginTop: 30 }} onClick={() => setConfirmBorrar(true)}>
          <Trash2 size={16} /> Borrar todo
        </button>
      )}
    </aside>

    {confirmBorrar && (
      <Modal onClose={() => { if (!borrando) setConfirmBorrar(false); }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingRight: 24 }}>
          <AlertTriangle size={20} color="var(--bad)" />
          <h3 style={{ fontSize: 17 }}>Borrar todo</h3>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>Va a regresar todos los datos a una seed que inicia la base de datos. ¿Estás seguro?</p>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn danger" disabled={borrando} onClick={borrarTodo}>
            <Trash2 size={15} /> {borrando ? "Borrando…" : "Sí, borrar"}
          </button>
          <button className="btn ghost" autoFocus disabled={borrando} onClick={() => setConfirmBorrar(false)}>Cancelar</button>
        </div>
      </Modal>
    )}
    </>
  );
}
