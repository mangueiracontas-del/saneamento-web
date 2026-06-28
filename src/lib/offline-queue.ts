import { createDemanda, uploadFotoDemanda } from "@/lib/demandas.functions";

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

export async function sendDemanda(item: PendingDemanda) {
  let foto_url: string | null = null;
  if (item.fotoBase64) {
    const r = await uploadFotoDemanda({ data: { base64: item.fotoBase64, name: item.fotoName } });
    foto_url = r.signedUrl;
  }
  await createDemanda({ data: { ...item.payload, foto_url } });
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
