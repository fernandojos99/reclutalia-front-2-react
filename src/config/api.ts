/** Configuración del cliente HTTP. Apunta al backend Express desplegado en Vercel. */

// ⚠️ TEMPORAL — desarrollo full-local contra el Express de :4000.
// ANTES DE COMMITEAR: descomentar la de producción y comentar esta.
export const API_BASE_URL = "http://localhost:4000/api";
// export const API_BASE_URL = "https://reclutalia-backend-2-node-express.vercel.app/api";
