import { useState } from "react";
import { SITUACOES, STATUSES } from "@/lib/situacao";

export type Filters = {
  dataDe: string;
  dataAte: string;
  site: string;
  local: string;
  prioridade: string;
  status: string;
  solicitante: string;
};

export const emptyFilters: Filters = {
  dataDe: "", dataAte: "", site: "", local: "", prioridade: "", status: "", solicitante: "",
};

export function FiltersBar({
  filters, onChange, sites, locais,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  sites: { id: string; nome: string }[];
  locais: { id: string; nome: string; site_id: string }[];
}) {
  const [open, setOpen] = useState(false);
  const locaisDoSite = filters.site ? locais.filter((l) => l.site_id === filters.site) : locais;
  function set<K extends keyof Filters>(k: K, v: string) {
    onChange({ ...filters, [k]: v });
  }
  const hasFilters = Object.values(filters).some((v) => v !== "");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-secondary"
        >
          {open ? "Ocultar filtros" : "Filtros"}
        </button>
        {hasFilters && (
          <button
            onClick={() => onChange(emptyFilters)}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
      </div>
      {open && (
        <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs text-muted-foreground">Data de</label>
            <input type="date" value={filters.dataDe} onChange={(e) => set("dataDe", e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Data até</label>
            <input type="date" value={filters.dataAte} onChange={(e) => set("dataAte", e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Site</label>
            <select value={filters.site} onChange={(e) => { set("site", e.target.value); set("local", ""); }} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              <option value="">Todos</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Local</label>
            <select value={filters.local} onChange={(e) => set("local", e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              <option value="">Todos</option>
              {locaisDoSite.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Situação</label>
            <select value={filters.prioridade} onChange={(e) => set("prioridade", e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              <option value="">Todas</option>
              {SITUACOES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <select value={filters.status} onChange={(e) => set("status", e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              <option value="">Todos</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs text-muted-foreground">Solicitante</label>
            <input value={filters.solicitante} onChange={(e) => set("solicitante", e.target.value)} placeholder="Buscar por nome…" className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}

export function applyFilters<T extends Record<string, any>>(rows: T[], f: Filters): T[] {
  return rows.filter((d) => {
    if (f.dataDe && new Date(d.data_abertura) < new Date(f.dataDe)) return false;
    if (f.dataAte) {
      const end = new Date(f.dataAte);
      end.setHours(23, 59, 59, 999);
      if (new Date(d.data_abertura) > end) return false;
    }
    if (f.site && d.site_id !== f.site) return false;
    if (f.local && d.local_id !== f.local) return false;
    if (f.prioridade && d.situacao_atual !== f.prioridade) return false;
    if (f.status && d.status !== f.status) return false;
    if (f.solicitante && !(d.solicitante || "").toLowerCase().includes(f.solicitante.toLowerCase())) return false;
    return true;
  });
}
