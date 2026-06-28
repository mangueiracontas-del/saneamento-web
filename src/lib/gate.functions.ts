import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";

type Role = "planejamento" | "manutencao";
type GateSession = { roles?: Record<Role, boolean> };

const DEFAULT_PASSWORDS: Record<Role, string> = {
  planejamento: "planejar123",
  manutencao: "manter123",
};

function sessionConfig() {
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

async function ensureHash(role: Role): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_passwords")
    .select("password_hash")
    .eq("role", role)
    .maybeSingle();
  const hash = data?.password_hash ?? "";
  // bcrypt hashes start with $2; if not valid, reseed default
  if (!hash.startsWith("$2")) {
    const fresh = await bcrypt.hash(DEFAULT_PASSWORDS[role], 10);
    await supabaseAdmin
      .from("app_passwords")
      .upsert({ role, password_hash: fresh, updated_at: new Date().toISOString() });
    return fresh;
  }
  return hash;
}

export const getCurrentRoles = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  return {
    planejamento: !!session.data.roles?.planejamento,
    manutencao: !!session.data.roles?.manutencao,
  };
});

export const loginRole = createServerFn({ method: "POST" })
  .inputValidator((d: { role: Role; password: string }) => d)
  .handler(async ({ data }) => {
    if (data.role !== "planejamento" && data.role !== "manutencao") {
      return { ok: false as const };
    }
    const hash = await ensureHash(data.role);
    const ok = await bcrypt.compare(data.password, hash);
    if (!ok) return { ok: false as const };
    const session = await useSession<GateSession>(sessionConfig());
    const roles = { ...(session.data.roles ?? { planejamento: false, manutencao: false }) };
    roles[data.role] = true;
    await session.update({ roles });
    return { ok: true as const };
  });

export const logoutRole = createServerFn({ method: "POST" })
  .inputValidator((d: { role: Role }) => d)
  .handler(async ({ data }) => {
    const session = await useSession<GateSession>(sessionConfig());
    const roles = { ...(session.data.roles ?? { planejamento: false, manutencao: false }) };
    roles[data.role] = false;
    await session.update({ roles });
    return { ok: true };
  });

export const changeRolePassword = createServerFn({ method: "POST" })
  .inputValidator((d: { role: Role; currentPassword: string; newPassword: string }) => d)
  .handler(async ({ data }) => {
    if (data.newPassword.length < 4) return { ok: false as const, error: "Senha muito curta" };
    const session = await useSession<GateSession>(sessionConfig());
    if (!session.data.roles?.[data.role]) return { ok: false as const, error: "Não autorizado" };
    const hash = await ensureHash(data.role);
    const ok = await bcrypt.compare(data.currentPassword, hash);
    if (!ok) return { ok: false as const, error: "Senha atual incorreta" };
    const fresh = await bcrypt.hash(data.newPassword, 10);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("app_passwords")
      .upsert({ role: data.role, password_hash: fresh, updated_at: new Date().toISOString() });
    return { ok: true as const };
  });
