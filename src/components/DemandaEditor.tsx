import { useState } from "react";
import { deleteDemanda, updateDemanda } from "@/lib/demandas.functions";
import { EQUIPES, STATUSES, equipeLabel } from "@/lib/situacao";

export function DemandaEditor({
  demanda,
  role,
  onClose,
  onSaved,
}: {
  demanda: any;
  role: "planejamento" | "manutencao";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prioridade, setPrioridade] = useState<string>(demanda.prioridade ?? "");
  const [equipe, setEquipe] = useState<string>(demanda.equipe_destino ?? "");
  const [status, setStatus] = useState<string>(demanda.status);
  const [analise, setAnalise] = useState<string>(demanda.analise_resolucao ?? "");
  const [saving, setSaving] = useState(false);

  const concluida = demanda.status === "concluida" || demanda.status === "cancelada";

  async function save() {
    setSaving(true);
    const patch: any = { prioridade: prioridade || null, status, analise_resolucao: analise || null };
    if (role === "planejamento") {
      patch.equipe_destino = equipe || null;
    }
    if (status === "concluida" && !demanda.concluida_em) patch.concluida_em = new Date().toISOString();
    try {
      await updateDemanda({ data: { id: demanda.id, patch } });
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function aceitar() {
    setSaving(true);
    const patch: any = {
      aceita_por: role,
      aceita_em: new Date().toISOString(),
      status: role === "manutencao" ? "em_andamento" : "aceita",
    };
    if (prioridade) patch.prioridade = prioridade;
    if (role === "planejamento" && equipe) { patch.equipe_destino = equipe; patch.status = "direcionada"; }
    try {
      await updateDemanda({ data: { id: demanda.id, patch } });
      setStatus(patch.status);
      onSaved();
    } catch (e: any) {
      alert(e?.message || "Erro ao aceitar");
    } finally {
      setSaving(false);
    }
  }

  async function excluir() {
    if (!confirm(`Excluir demanda #${demanda.numero}?`)) return;
    try {
      await deleteDemanda({ data: { id: demanda.id } });
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Erro ao excluir");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">Demanda #{demanda.numero}</h3>
            <p className="text-xs text-muted-foreground">{new Date(demanda.data_abertura).toLocaleString("pt-BR")} · {demanda.solicitante}</p>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm hover:bg-secondary">✕</button>
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          <div><span className="text-muted-foreground">Site/Local:</span> {demanda.site_nome} — {demanda.local_nome}</div>
          <div><span className="text-muted-foreground">TAG:</span> <span className="font-mono">{demanda.tag_equipamento}</span></div>
          <div><span className="text-muted-foreground">Descrição:</span> <div className="whitespace-pre-wrap rounded-md bg-secondary p-2">{demanda.descricao}</div></div>
          {demanda.foto_url && <img src={demanda.foto_url} alt="" className="max-h-64 rounded-md border object-contain" />}
        </div>

        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
          {role === "planejamento" && (
            <div>
              <label className="text-xs text-muted-foreground">Direcionar para</label>
              <select disabled={concluida} value={equipe} onChange={(e) => setEquipe(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">—</option>
                {EQUIPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Prioridade (P0, P1, P2…)</label>
            <input disabled={concluida} value={prioridade} onChange={(e) => setPrioridade(e.target.value.toUpperCase())} placeholder="P0" className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {role === "planejamento" && demanda.equipe_destino && (
            <div className="text-sm"><span className="text-muted-foreground">Equipe atual:</span> {equipeLabel(demanda.equipe_destino)}</div>
          )}
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Análise / Resolução</label>
            <textarea rows={4} value={analise} onChange={(e) => setAnalise(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <div className="flex gap-2">
            {demanda.status === "aberta" && (
              <button onClick={aceitar} disabled={saving} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
                Aceitar como {role}
              </button>
            )}
            {role === "planejamento" && (
              <button onClick={excluir} className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md border px-3 py-2 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
