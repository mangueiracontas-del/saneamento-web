import { SITUACOES, STATUSES, situacaoLabel, statusLabel } from "@/lib/situacao";

export function SituacaoBadge({ value }: { value: string | null | undefined }) {
  const s = SITUACOES.find((x) => x.value === value);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.badge ?? "bg-muted"}`}>
      {situacaoLabel(value)}
    </span>
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const s = STATUSES.find((x) => x.value === value);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.badge ?? "bg-muted"}`}>
      {statusLabel(value)}
    </span>
  );
}
