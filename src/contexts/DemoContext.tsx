/**
 * Estado "demo" transversal (equivale a los useState del App original): rol activo,
 * formador/candidato seleccionados, tema y toast. La app real luego lo sustituirá por auth.
 *
 * El perfil (rol/formadorId/candId/tema) se PERSISTE en localStorage para que sobreviva a un
 * recarga completa de la página: al cambiar de vista se recarga a propósito (para resetear el
 * asistente de IA), y la persistencia evita que el perfil vuelva a los valores por defecto.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Rol = "formador" | "admin" | "candidato";

/**
 * Qué clase de candidato se está viendo. Va SEPARADO de `Rol` a propósito.
 *
 * El rol de dominio sigue siendo "candidato" —es lo que entienden el backend y el agente, cuyo zod
 * solo acepta admin/formador/candidato— y esto es una distinción de la capa de demo: el selector
 * ofrece "Colaborador interno" y "Candidato externo" como si fueran vistas distintas, pero por
 * dentro son el mismo rol con gente distinta. Meterlo en `Rol` habría obligado a tocar la decena de
 * sitios que comprueban `rol === "candidato"` y a traducirlo antes de cada llamada.
 */
export type TipoCandidato = "interno" | "externo";

interface DemoState {
  rol: Rol;
  setRol: (r: Rol) => void;
  /** Solo tiene efecto cuando `rol === "candidato"`: filtra el selector de personas. */
  tipoCand: TipoCandidato;
  setTipoCand: (t: TipoCandidato) => void;
  formadorId: string;
  setFormadorId: (id: string) => void;
  candId: number;
  setCandId: (id: number) => void;
  tema: string;
  setTema: (t: string) => void;
  toastMsg: string;
  toast: (m: string) => void;
}

const DemoContext = createContext<DemoState | null>(null);

/** Claves de persistencia del perfil demo. */
const K = {
  rol: "rk_rol", tipoCand: "rk_tipoCand", formadorId: "rk_formadorId",
  candId: "rk_candId", tema: "rk_tema",
} as const;

const leer = (clave: string, fallback: string): string => {
  try { return localStorage.getItem(clave) ?? fallback; } catch { return fallback; }
};
const guardar = (clave: string, valor: string): void => {
  try { localStorage.setItem(clave, valor); } catch { /* modo privado, etc. */ }
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [rol, setRolState] = useState<Rol>(() => leer(K.rol, "formador") as Rol);
  const [tipoCand, setTipoCandState] = useState<TipoCandidato>(() => leer(K.tipoCand, "externo") as TipoCandidato);
  const [formadorId, setFormadorIdState] = useState<string>(() => leer(K.formadorId, "F1"));
  const [candId, setCandIdState] = useState<number>(() => Number(leer(K.candId, "1")));
  const [tema, setTemaState] = useState<string>(() => leer(K.tema, "clasico"));
  const [toastMsg, setToastMsg] = useState<string>("");

  // Cada setter persiste de forma SÍNCRONA para que el valor sobreviva a una recarga inmediata.
  const setRol = useCallback((r: Rol) => { guardar(K.rol, r); setRolState(r); }, []);
  const setTipoCand = useCallback((t: TipoCandidato) => { guardar(K.tipoCand, t); setTipoCandState(t); }, []);
  const setFormadorId = useCallback((id: string) => { guardar(K.formadorId, id); setFormadorIdState(id); }, []);
  const setCandId = useCallback((id: number) => { guardar(K.candId, String(id)); setCandIdState(id); }, []);
  const setTema = useCallback((t: string) => { guardar(K.tema, t); setTemaState(t); }, []);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    window.setTimeout(() => setToastMsg(""), 2600);
  }, []);

  return (
    <DemoContext.Provider
      value={{ rol, setRol, tipoCand, setTipoCand, formadorId, setFormadorId, candId, setCandId, tema, setTema, toastMsg, toast }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo debe usarse dentro de <DemoProvider>");
  return ctx;
}
