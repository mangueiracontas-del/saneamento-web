import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { DemandaForm } from "@/components/DemandaForm";
import { SituacaoBadge, StatusBadge } from "@/components/Badges";
import { FiltersBar, applyFilters, emptyFilters, type Filters } from "@/components/FiltersBar";
import { exportDemandasToExcel } from "@/lib/excel";
import { readQueue, flushQueue } from "@/lib/offline-queue";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Demandas — Saneamento e SPCI" },
      { name: "description", content: "Acompanhamento de todas as demandas de manutenção." },
    ],
  }),
  component: Index,
});

function Index() {
  const [demandas, setDemandas] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showForm, setShowForm] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(true);

  async function load() {
    const [{ data: d }, { data: s }, { data: l }] = await Promise.all([
      supabase.from("demandas").select("*").order("data_abertura", { ascending: false }),
      supabase.from("sites").select("id,nome").order("nome"),
      supabase.from("locais").select("id,nome,site_id").order("nome"),
    ]);
    setDemandas(d || []);
    setSites(s || []);
    setLocais(l || []);
  }

  useEffect(() => {
    load();
    const refreshQueue = () => setPendingCount(readQueue().length);
    refreshQueue();
    const onOnline = async () => {
      setOnline(true);
      await flushQueue();
      refreshQueue();
      load();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("pending-demandas-changed", refreshQueue);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("pending-demandas-changed", refreshQueue);
    };
  }, []);

  const filtered = useMemo(() => applyFilters(demandas, filters), [demandas, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl space-y-4 p-4">
        {(!online || pendingCount > 0) && (
          <div className="rounded-lg border border-prioritario/40 bg-prioritario/10 px-4 py-2 text-sm">
            {!online && "Sem conexão com a internet. "}
            {pendingCount > 0 && `${pendingCount} demanda(s) aguardando envio.`}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Demandas registradas <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span></h1>
          <div className="flex gap-2">
            <button onClick={() => exportDemandasToExcel(filtered)} disabled={filtered.length === 0} className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50">
              Exportar Excel
            </button>
            <button onClick={() => setShowForm((v) => !v)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {showForm ? "Fechar" : "Nova demanda"}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-base font-semibold">Nova demanda</h2>
            <DemandaForm onSaved={() => { setShowForm(false); load(); }} />
          </div>
        )}

        <FiltersBar filters={filters} onChange={setFilters} sites={sites} locais={locais} />

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Site / Local</th>
                <th className="px-3 py-2">TAG</th>
                <th className="px-3 py-2">Situação</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Solicitante</th>
                <th className="px-3 py-2">Foto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t hover:bg-secondary/40">
                  <td className="px-3 py-2 font-mono">#{d.numero}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(d.data_abertura).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{d.site_nome}</div>
                    <div className="text-xs text-muted-foreground">{d.local_nome}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{d.tag_equipamento}</td>
                  <td className="px-3 py-2"><SituacaoBadge value={d.situacao_atual} /></td>
                  <td className="px-3 py-2"><StatusBadge value={d.status} /></td>
                  <td className="px-3 py-2 font-mono">{d.prioridade || "—"}</td>
                  <td className="px-3 py-2">{d.solicitante}</td>
                  <td className="px-3 py-2">
                    {d.foto_url ? <a href={d.foto_url} target="_blank" rel="noreferrer"><img src={d.foto_url} alt="" className="h-10 w-10 rounded object-cover" /></a> : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-sm text-muted-foreground">Nenhuma demanda encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
