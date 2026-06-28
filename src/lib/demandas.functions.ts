import { createServerFn } from "@tanstack/react-start";

const SITUACOES = ["critico", "prioritario", "moderado", "leve"] as const;
const STATUSES = ["aberta", "aceita", "direcionada", "em_andamento", "concluida", "cancelada"] as const;
const EQUIPES = ["corretiva", "preventiva", "inspecao", "pcm"] as const;

type Situacao = (typeof SITUACOES)[number];

function clampText(v: unknown, max: number): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error("Campo obrigatório vazio");
  return s.slice(0, max);
}
function optText(v: unknown, max: number): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

export const createDemanda = createServerFn({ method: "POST" })
  .inputValidator((d: {
    site_id: string | null;
    site_nome: string;
    local_id: string | null;
    local_nome: string;
    tag_equipamento: string;
    descricao: string;
    situacao_atual: string;
    solicitante: string;
    foto_url?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    if (!SITUACOES.includes(data.situacao_atual as Situacao)) {
      throw new Error("Situação inválida");
    }
    const payload = {
      site_id: data.site_id || null,
      site_nome: clampText(data.site_nome, 200),
      local_id: data.local_id || null,
      local_nome: clampText(data.local_nome, 200),
      tag_equipamento: clampText(data.tag_equipamento, 120),
      descricao: clampText(data.descricao, 4000),
      situacao_atual: data.situacao_atual as Situacao,
      solicitante: clampText(data.solicitante, 200),
      foto_url: optText(data.foto_url, 2000),
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("demandas")
      .insert(payload as any)
      .select("id, numero")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const uploadFotoDemanda = createServerFn({ method: "POST" })
  .inputValidator((d: { base64: string; name?: string }) => d)
  .handler(async ({ data }) => {
    if (!data.base64 || !data.base64.startsWith("data:")) throw new Error("Foto inválida");
    const m = data.base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error("Foto inválida");
    const contentType = m[1];
    if (!contentType.startsWith("image/")) throw new Error("Tipo de arquivo não permitido");
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > 8 * 1024 * 1024) throw new Error("Foto acima de 8MB");
    const extFromCt = contentType.split("/")[1]?.replace("+xml", "") || "jpg";
    const safeExt = /^[a-z0-9]+$/i.test(extFromCt) ? extFromCt.toLowerCase() : "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from("demandas-fotos").upload(path, buf, {
      contentType,
      upsert: false,
    });
    if (up.error) throw new Error(up.error.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("demandas-fotos")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (sErr) throw new Error(sErr.message);
    return { path, signedUrl: signed.signedUrl };
  });

export const updateDemanda = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id: string;
    patch: {
      prioridade?: string | null;
      status?: string;
      analise_resolucao?: string | null;
      equipe_destino?: string | null;
      aceita_por?: string;
      aceita_em?: string;
      concluida_em?: string;
    };
  }) => d)
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/lib/gate.server");
    const role = await requireRole(["planejamento", "manutencao"]);

    const allowed: Record<string, unknown> = {};
    const p = data.patch || {};
    if ("prioridade" in p) {
      const v = p.prioridade;
      if (v == null || v === "") allowed.prioridade = null;
      else {
        const s = String(v).trim().toUpperCase().slice(0, 8);
        if (!/^P\d{1,3}$/.test(s)) throw new Error("Prioridade inválida (use P0, P1, …)");
        allowed.prioridade = s;
      }
    }
    if ("status" in p && p.status) {
      if (!STATUSES.includes(p.status as any)) throw new Error("Status inválido");
      allowed.status = p.status;
    }
    if ("analise_resolucao" in p) {
      allowed.analise_resolucao = p.analise_resolucao
        ? String(p.analise_resolucao).slice(0, 8000)
        : null;
    }
    if ("equipe_destino" in p) {
      if (role !== "planejamento") throw new Error("Apenas planejamento pode direcionar");
      if (p.equipe_destino == null || p.equipe_destino === "") allowed.equipe_destino = null;
      else {
        if (!EQUIPES.includes(p.equipe_destino as any)) throw new Error("Equipe inválida");
        allowed.equipe_destino = p.equipe_destino;
      }
    }
    if (p.aceita_por) {
      if (p.aceita_por !== "planejamento" && p.aceita_por !== "manutencao")
        throw new Error("aceita_por inválido");
      allowed.aceita_por = p.aceita_por;
    }
    if (p.aceita_em) allowed.aceita_em = p.aceita_em;
    if (p.concluida_em) allowed.concluida_em = p.concluida_em;

    if (Object.keys(allowed).length === 0) return { ok: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demandas").update(allowed as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDemanda = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireRole } = await import("@/lib/gate.server");
    await requireRole("planejamento");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demandas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
