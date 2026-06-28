export const SITUACOES = [
  { value: "critico", label: "Sistema parado — Crítico", badge: "bg-critico text-critico-foreground" },
  { value: "prioritario", label: "Sistema parcialmente parado — Prioritário", badge: "bg-prioritario text-prioritario-foreground" },
  { value: "moderado", label: "Sistema com Restrição — Moderado", badge: "bg-moderado text-moderado-foreground" },
  { value: "leve", label: "Sistema operando — Leve", badge: "bg-leve text-leve-foreground" },
] as const;

export type SituacaoValue = (typeof SITUACOES)[number]["value"];

export const STATUSES = [
  { value: "aberta", label: "Aberta", badge: "bg-muted text-foreground" },
  { value: "aceita", label: "Aceita", badge: "bg-accent/20 text-accent-foreground border border-accent/40" },
  { value: "direcionada", label: "Direcionada", badge: "bg-primary/15 text-primary border border-primary/30" },
  { value: "em_andamento", label: "Em andamento", badge: "bg-prioritario/30 text-prioritario-foreground" },
  { value: "concluida", label: "Concluída", badge: "bg-leve/40 text-leve-foreground" },
  { value: "cancelada", label: "Cancelada", badge: "bg-destructive/15 text-destructive border border-destructive/30" },
] as const;

export type StatusValue = (typeof STATUSES)[number]["value"];

export const EQUIPES = [
  { value: "corretiva", label: "Manutenção Corretiva" },
  { value: "preventiva", label: "Manutenção Preventiva" },
  { value: "inspecao", label: "Inspeção" },
  { value: "pcm", label: "PCM" },
] as const;

export type EquipeValue = (typeof EQUIPES)[number]["value"];

export function situacaoLabel(v: string | null | undefined) {
  return SITUACOES.find((s) => s.value === v)?.label ?? v ?? "";
}
export function statusLabel(v: string | null | undefined) {
  return STATUSES.find((s) => s.value === v)?.label ?? v ?? "";
}
export function equipeLabel(v: string | null | undefined) {
  return EQUIPES.find((s) => s.value === v)?.label ?? v ?? "";
}

export function prioridadeNum(p: string | null | undefined): number {
  if (!p) return 9999;
  const m = /^P?(\d+)/i.exec(p);
  return m ? Number(m[1]) : 9999;
}
