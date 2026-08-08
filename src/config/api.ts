/**
 * Configuración del cliente HTTP.
 *
 * Por defecto apunta al backend Express desplegado en Vercel, así que un despliegue sin variables
 * de entorno funciona igual que siempre. Para desarrollo full-local basta con crear un `.env` en
 * este repo (ya está en `.gitignore`) con:
 *
 *     VITE_API_URL=http://localhost:4000/api
 *
 * Antes se editaba esta constante a mano, y bastaba un despiste para desplegar el front apuntando
 * a `localhost` y dejar producción sin backend.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://reclutalia-backend-2-node-express.vercel.app/api";
