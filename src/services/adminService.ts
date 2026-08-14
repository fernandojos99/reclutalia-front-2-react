/**
 * Acciones administrativas de la demo. Las dos son destructivas y ninguna pide token: se quitó a
 * propósito para que funcionen en local sin configurar un secreto.
 *
 *   - `resetSeed`  → devuelve la base al estado de `seed.ts`, como recién instalada.
 *   - `borrarTodo` → conserva formadores, candidatos y vacantes, y borra todo el trámite.
 */
import { API_BASE_URL } from "../config/api";

async function postAdmin(ruta: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/${ruta}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data && (data.message as string)) || `Error HTTP ${res.status}`);
  }
}

export const adminService = {
  resetSeed: () => postAdmin("reset-seed"),
  borrarTodo: () => postAdmin("borrar-todo"),
};
