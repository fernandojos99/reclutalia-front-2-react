/** Ruteo con react-router. "/" es la landing (sin AppShell); las rutas por rol van dentro del AppShell. */
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LandingPage } from "../landing/LandingPage";
import { MisVacantesPage } from "../pages/formador/MisVacantesPage";
import { VacanteDetailPage } from "../pages/formador/VacanteDetailPage";
import { RevisarVacantePage } from "../pages/formador/RevisarVacantePage";
import { EntrevistasAsignadasPage } from "../pages/formador/EntrevistasAsignadasPage";
import { AdminVacantesPage } from "../pages/admin/VacantesPage";
import { NuevaVacantePage } from "../pages/admin/NuevaVacantePage";
import { PoolPage } from "../pages/admin/PoolPage";
import { MisProcesosPage } from "../pages/candidato/MisProcesosPage";
import { BuscarVacantesPage } from "../pages/candidato/BuscarVacantesPage";
import { NotificacionesPage } from "../pages/NotificacionesPage";
import { ChatPage } from "../pages/ChatPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Landing promocional (pública, sin el layout de la plataforma). */}
      <Route path="/" element={<LandingPage />} />

      <Route element={<AppShell />}>
        <Route path="/formador" element={<MisVacantesPage />} />
        <Route path="/formador/vacante/:vacId" element={<VacanteDetailPage />} />
        <Route path="/formador/vacante/:vacId/revisar" element={<RevisarVacantePage />} />
        <Route path="/formador/entrevistas" element={<EntrevistasAsignadasPage />} />
        <Route path="/formador/notificaciones" element={<NotificacionesPage />} />
        <Route path="/formador/chat" element={<ChatPage />} />

        <Route path="/admin" element={<AdminVacantesPage />} />
        <Route path="/admin/nueva" element={<NuevaVacantePage />} />
        <Route path="/admin/pool" element={<PoolPage />} />
        <Route path="/admin/notificaciones" element={<NotificacionesPage />} />
        <Route path="/admin/chat" element={<ChatPage />} />

        <Route path="/candidato" element={<MisProcesosPage />} />
        <Route path="/candidato/buscar" element={<BuscarVacantesPage />} />
        <Route path="/candidato/notificaciones" element={<NotificacionesPage />} />
        <Route path="/candidato/chat" element={<ChatPage />} />

        <Route path="*" element={<Navigate to="/formador" replace />} />
      </Route>
    </Routes>
  );
}
