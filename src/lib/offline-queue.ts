import { supabase } from "@/integrations/supabase/client";

const KEY = "pending_demandas_v1";

export type PendingDemanda = {
  localId: string;
  createdAt: number;
  payload: {
    site_id: string | null;
    site_nome: string;
    local_id: string | null;
    local_nome: string;
    tag_equipamento: string;
    descricao: string;
    situacao_atual: string;
    solicitante: string;
  };
  fotoBase64?: string;
  fotoName?: string;
};

export function readQueue(): PendingDemanda[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeQueue(items: PendingDemanda[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("pending-demandas-changed"));
}

export function enqueue(item: PendingDemanda) {
  const q = readQueue();
  q.push(item);
  writeQueue(q);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function sendDemanda(item: PendingDemanda) {
  let foto_url: string | null = null;
  if (item.fotoBase64) {
    const blob = await dataUrlToBlob(item.fotoBase64);
    const ext = (item.fotoName?.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await supabase.storage.from("demandas-fotos").upload(path, blob, {
      contentType: blob.type || "image/jpeg",
    });
    if (up.error) throw up.error;
    const { data: signed } = await supabase.storage
      .from("demandas-fotos")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    foto_url = signed?.signedUrl ?? null;
  }
  const { error } = await supabase.from("demandas").insert({
    ...item.payload,
    situacao_atual: item.payload.situacao_atual as any,
    foto_url,
  });
  if (error) throw error;
}

export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  const q = readQueue();
  if (q.length === 0) return { sent: 0, failed: 0 };
  const remaining: PendingDemanda[] = [];
  let sent = 0;
  let failed = 0;
  for (const item of q) {
    try {
      await sendDemanda(item);
      sent++;
    } catch (e) {
      console.error("Falha ao enviar demanda pendente", e);
      failed++;
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return { sent, failed };
}
