import { useSession } from "@tanstack/react-start/server";

export type GateRole = "planejamento" | "manutencao";
export type GateSession = { roles?: Record<GateRole, boolean> };

export function gateSessionConfig() {
  return {
    password: process.env.SESSION_SECRET!,
    name: "saneamento-spci-gate",
    maxAge: 60 * 60 * 24 * 14,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function requireRole(allowed: GateRole | GateRole[]): Promise<GateRole> {
  const session = await useSession<GateSession>(gateSessionConfig());
  const list = Array.isArray(allowed) ? allowed : [allowed];
  const active = list.find((r) => session.data.roles?.[r]);
  if (!active) throw new Error("Não autorizado");
  return active;
}
