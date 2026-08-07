/**
 * Shell de la app: sidebar + topbar + contenido (Outlet) + toast + bot + inyección de temas.
 * Reemplaza al render raíz del `App` original. El `data-theme` sale del DemoContext y los datos
 * (para el badge de notificaciones y los selectores) del DataProvider.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BotSoporte } from "./BotSoporte";
import { AvisoLiberacion, buscarLiberacion } from "../formador/AvisoLiberacion";
import { PerfilEditor } from "../candidato/PerfilEditor";
import { useDemo } from "../../contexts/DemoContext";
import { BotProvider } from "../../contexts/BotContext";
import { useData } from "../../store/DataProvider";
import { buildThemeCss } from "../../styles/themes";

const ADMIN = { nombre: "Carlos Ruiz Delgado", puesto: "Administrador · Talento GS" };
const THEME_CSS = buildThemeCss();

function tituloPorRuta(pathname: string): string {
  if (pathname.endsWith("/chat")) return "Asistente IA";
  if (pathname === "/formador/entrevistas") return "Entrevistas asignadas";
  if (pathname.includes("/notificaciones")) return "Centro de notificaciones";
  if (pathname.endsWith("/revisar")) return "Revisar vacante";
  if (pathname.startsWith("/formador/vacante")) return "Detalle de vacante";
  if (pathname.startsWith("/formador")) return "Mis vacantes";
  if (pathname === "/admin/nueva") return "Nueva vacante";
  if (pathname === "/admin/pool") return "Marketplace de talento";
  if (pathname.startsWith("/admin")) return "Vacantes";
  if (pathname === "/candidato/buscar") return "Buscar vacantes";
  if (pathname.startsWith("/candidato")) return "Mis procesos";
  return "Radar de Candidatos";
}

export function AppShell() {
  const { rol, formadorId, candId, tema, toastMsg, toast } = useDemo();
  const { formadores, candidatos, vacantes, notificaciones, actions, reload, reloadNotificaciones } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [editPerfil, setEditPerfil] = useState(false);
  const [avisoCerrado, setAvisoCerrado] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // drawer del sidebar en móvil
  // Colapsar el sidebar en escritorio (persistido) para ver el contenido más extendido.
  const [sideCollapsed, setSideCollapsed] = useState(() => localStorage.getItem("reclutalia_side_collapsed") === "1");
  const toggleSide = () => setSideCollapsed((c) => {
    const n = !c;
    localStorage.setItem("reclutalia_side_collapsed", n ? "1" : "0");
    return n;
  });

  // Cerrar el drawer al cambiar de ruta (p.ej. tras tocar un ítem de navegación).
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Notificaciones "en vivo" (ligero, sin push SSE): refresco al navegar + polling suave cada 25 s.
  // Encaja en serverless (Vercel) y mantiene el badge/centro de notificaciones al día.
  useEffect(() => { void reloadNotificaciones(); }, [location.pathname, reloadNotificaciones]);
  useEffect(() => {
    const t = window.setInterval(() => { void reloadNotificaciones(); }, 25000);
    return () => window.clearInterval(t);
  }, [reloadNotificaciones]);

  // Al SALIR de la vista de chat (clic en el sidebar/navbar u otra navegación), re-hidratar los datos
  // para que la plataforma refleje lo que el agente/chat pudo cambiar.
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (prev.endsWith("/chat") && !location.pathname.endsWith("/chat")) {
      void reload();
      void reloadNotificaciones();
    }
  }, [location.pathname, reload, reloadNotificaciones]);

  const noLeidas = useMemo(() => {
    const para =
      rol === "formador" ? { tipo: "formador", id: formadorId }
        : rol === "candidato" ? { tipo: "candidato", id: candId }
          : { tipo: "admin", id: "A1" };
    return notificaciones.filter(
      (n) => n.para.tipo === para.tipo && String(n.para.id) === String(para.id) && !n.leida,
    ).length;
  }, [notificaciones, rol, formadorId, candId]);

  /**
   * Entrevistas que le pidieron a este formador y aún no cierra.
   * Se deriva de `vacantes`, que el store ya tiene, en vez de pedirlas al backend: así el contador
   * se actualiza solo con cada recarga y el shell no añade una petición propia.
   */
  const entrevistasPendientes = useMemo(() => {
    if (rol !== "formador") return 0;
    let n = 0;
    for (const v of vacantes) {
      for (const p of Object.values(v.pipeline || {})) {
        for (const e of p.entrevistasExtra ?? []) {
          if (e.formadorId === formadorId && e.estado !== "realizada") n++;
        }
      }
    }
    return n;
  }, [vacantes, rol, formadorId]);

  const avisoLiberacion = useMemo(
    () => (rol === "formador" ? buscarLiberacion(vacantes, candidatos, formadorId) : null),
    [rol, vacantes, candidatos, formadorId],
  );

  // Botón de la barra superior para alternar entre plataforma y chat integrado (todos los roles;
  // admin solo ve el tab de Mensajes, formador/candidato ven además el Asistente IA).
  const puedeChat = rol === "formador" || rol === "candidato" || rol === "admin";
  const rutaChat = `/${rol}/chat`;
  const enChat = location.pathname === rutaChat;
  // Al volver del chat a la plataforma, re-hidratar los datos (el agente pudo modificar el estado).
  const chatToggle = puedeChat
    ? {
        enChat,
        onToggle: () => {
          if (enChat) { void reload(); void reloadNotificaciones(); }
          navigate(enChat ? `/${rol}` : rutaChat);
        },
      }
    : undefined;

  const formador = formadores.find((f) => f.id === formadorId);
  const candidato = candidatos.find((c) => c.id === candId);
  const identidad =
    rol === "formador"
      ? { nombre: formador?.nombre ?? "Formador", subtitulo: formador?.puesto ?? "", foto: null as string | null }
      : rol === "candidato"
        ? { nombre: candidato?.nombre ?? "Candidato", subtitulo: "Candidato", foto: candidato?.foto ?? null }
        : { nombre: ADMIN.nombre, subtitulo: ADMIN.puesto, foto: null };

  return (
    <BotProvider>
    <div className={"rk" + (sideCollapsed ? " side-collapsed" : "") + (enChat ? " en-chat" : "")} data-theme={tema}>
      <style>{THEME_CSS}</style>
      <Sidebar formadores={formadores} candidatos={candidatos} noLeidas={noLeidas}
        entrevistasPendientes={entrevistasPendientes}
        open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main">
        <Topbar titulo={tituloPorRuta(location.pathname)} nombre={identidad.nombre}
          subtitulo={identidad.subtitulo} foto={identidad.foto} noLeidas={noLeidas}
          onMenu={() => setMenuOpen(true)}
          sideCollapsed={sideCollapsed} onToggleSide={toggleSide}
          onNotificaciones={() => navigate(`/${rol}/notificaciones`)}
          onEditarPerfil={rol === "candidato" && candidato ? () => setEditPerfil(true) : undefined}
          chat={chatToggle} />
        <div className="content">
          <Outlet />
        </div>
      </div>
      <BotSoporte />
      {/* Un colaborador del formador aceptó otra vacante: se avisa una sola vez al entrar. */}
      {avisoLiberacion && !avisoCerrado && (
        <AvisoLiberacion caso={avisoLiberacion} onClose={() => setAvisoCerrado(true)} />
      )}
      {editPerfil && candidato && (
        <PerfilEditor cand={candidato} onClose={() => setEditPerfil(false)}
          onSave={(c) => { void actions.guardarCandidato(c); setEditPerfil(false); toast("Perfil actualizado"); }} />
      )}
      {toastMsg && (
        <div className="toast">
          <CheckCircle2 size={15} color="var(--gold)" />
          {toastMsg}
        </div>
      )}
    </div>
    </BotProvider>
  );
}
