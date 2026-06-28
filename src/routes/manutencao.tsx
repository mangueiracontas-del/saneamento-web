import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { SituacaoBadge, StatusBadge } from "@/components/Badges";
import { FiltersBar, applyFilters, emptyFilters, type Filters } from "@/components/FiltersBar";
import { DemandaEditor } from "@/components/DemandaEditor";
import { RoleToolbar } from "@/components/RoleTools";
import { getCurrentRoles } from "@/lib/gate.functions";
import { prioridadeNum, equipeLabel } from "@/lib/situacao";

export const Route = createFileRoute("/manutencao")({
  loader: async () => {
    const roles = await getCurrentRoles();
    return { authorized: roles.manutencao };
  },
  component: Page,
});

function Page() {
  const { authorized } = Route.useLoaderData();
  const navigate = useNavigate();
  useEffect(() => { if (!authorized) navigate({ to: "/login/$role", params: { role: "manutencao" } }); }, [authorized]);

  const [demandas, setDemandas] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const [{ data: d }, { data: s }, { data: l }] = await Promise.all([
      supabase.from("demandas").select("*"),
      supabase.from("sites").select("id,nome").order("nome"),
      supabase.from("locais").select("id,nome,site_id").order("nome"),
    ]);
    setDemandas(d || []); setSites(s || []); setLocais(l || []);
  }
  useEffect(() => { if (authorized) load(); }, [authorized]);

  // Sort: data ASC, then prioridade ASC (P0 first)
  const sorted = useMemo(() => {
    return [...demandas].sort((a, b) => {
      const da = new Date(a.data_abertura).getTime();
      const db = new Date(b.data_abertura).getTime();
      if (da !== db) return da - db;
      return prioridadeNum(a.prioridade) - prioridadeNum(b.prioridade);
    });
  }, [demandas]);
  const filtered = useMemo(() => applyFilters(sorted, filters), [sorted, filters]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Painel — Manutenção</h1>
          <RoleToolbar role="manutencao" onLogout={() => navigate({ to: "/" })} />
        </div>

        <p className="text-xs text-muted-foreground">Ordenação automática: data de abertura (mais antiga primeiro), depois prioridade (P0 antes de P1…).</p>

        <FiltersBar filters={filters} onChange={setFilters} sites={sites} locais={locais} />

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Prio.</th>
                <th className="px-3 py-2">Site / Local</th>
                <th className="px-3 py-2">TAG</th>
                <th className="px-3 py-2">Situação</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Equipe</th>
                <th className="px-3 py-2">Solicitante</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t hover:bg-secondary/40">
                  <td className="px-3 py-2 font-mono">#{d.numero}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(d.data_abertura).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2 font-mono">{d.prioridade || "—"}</td>
                  <td className="px-3 py-2"><div className="font-medium">{d.site_nome}</div><div className="text-xs text-muted-foreground">{d.local_nome}</div></td>
                  <td className="px-3 py-2 font-mono text-xs">{d.tag_equipamento}</td>
                  <td className="px-3 py-2"><SituacaoBadge value={d.situacao_atual} /></td>
                  <td className="px-3 py-2"><StatusBadge value={d.status} /></td>
                  <td className="px-3 py-2 text-xs">{equipeLabel(d.equipe_destino) || "—"}</td>
                  <td className="px-3 py-2">{d.solicitante}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setEditing(d)} className="rounded-md border px-2 py-1 text-xs hover:bg-secondary">Abrir</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-sm text-muted-foreground">Nenhuma demanda.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
      {editing && <DemandaEditor demanda={editing} role="manutencao" onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
