import { createServerFn } from "@tanstack/react-start";

function name(v: unknown, max = 120): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error("Nome obrigatório");
  return s.slice(0, max);
}

export const createSite = createServerFn({ method: "POST" })
  .inputValidator((d: { nome: string }) => d)
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/lib/gate.server");
    await requireRole("planejamento");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").insert({ nome: name(data.nome) });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSite = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/lib/gate.server");
    await requireRole("planejamento");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createLocal = createServerFn({ method: "POST" })
  .inputValidator((d: { site_id: string; nome: string }) => d)
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/lib/gate.server");
    await requireRole("planejamento");
    if (!data.site_id) throw new Error("Site obrigatório");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("locais")
      .insert({ site_id: data.site_id, nome: name(data.nome) });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLocal = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/lib/gate.server");
    await requireRole("planejamento");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("locais").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
