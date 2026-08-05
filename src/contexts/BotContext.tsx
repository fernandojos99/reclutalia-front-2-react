/**
 * Apertura del bot flotante (`BotSoporte`), izada a contexto.
 *
 * El panel vivía con un `useState` local, así que nadie más podía abrirlo. Los botones con ícono
 * de chat del asistente "Revisar vacante" (`AccionesPaso`) sí necesitan hacerlo, y están dentro
 * del `<Outlet/>`, lejos del bot. El provider se monta en `AppShell`, que es el ancestro común.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface BotCtx {
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  alternar: () => void;
}

const Ctx = createContext<BotCtx | null>(null);

export function BotProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);

  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);
  const alternar = useCallback(() => setAbierto((a) => !a), []);

  const value = useMemo(() => ({ abierto, abrir, cerrar, alternar }), [abierto, abrir, cerrar, alternar]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBot(): BotCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBot() debe usarse dentro de <BotProvider>");
  return ctx;
}
