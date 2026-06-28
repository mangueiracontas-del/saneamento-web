import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITUACOES } from "@/lib/situacao";
import { enqueue, flushQueue, sendDemanda } from "@/lib/offline-queue";

type Site = { id: string; nome: string };
type Local = { id: string; nome: string; site_id: string };

export function DemandaForm({ onSaved }: { onSaved?: () => void }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [siteId, setSiteId] = useState("");
  const [localId, setLocalId] = useState("");
  const [tag, setTag] = useState("");
  const [descricao, setDescricao] = useState("");
  const [situacao, setSituacao] = useState<string>("moderado");
  const [solicitante, setSolicitante] = useState("");
  const [foto, setFoto] = useState<{ base64: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("sites").select("id,nome").order("nome");
      const { data: l } = await supabase.from("locais").select("id,nome,site_id").order("nome");
      setSites(s || []);
      setLocais(l || []);
    })();
  }, []);

  const locaisDoSite = locais.filter((l) => l.site_id === siteId);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return setFoto(null);
    const reader = new FileReader();
    reader.onload = () => setFoto({ base64: reader.result as string, name: f.name });
    reader.readAsDataURL(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!siteId || !localId || !tag || !descricao || !solicitante) {
      setMsg("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    const site = sites.find((s) => s.id === siteId);
    const local = locais.find((l) => l.id === localId);
    const payload = {
      site_id: siteId,
      site_nome: site?.nome ?? "",
      local_id: localId,
      local_nome: local?.nome ?? "",
      tag_equipamento: tag,
      descricao,
      situacao_atual: situacao,
      solicitante,
    };
    const pending = {
      localId: `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      payload,
      fotoBase64: foto?.base64,
      fotoName: foto?.name,
    };
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueue(pending);
        setMsg("Sem conexão. Demanda salva localmente e será enviada quando voltar online.");
      } else {
        await sendDemanda(pending);
        setMsg("Demanda registrada com sucesso!");
      }
      setTag(""); setDescricao(""); setSolicitante(""); setFoto(null); setSiteId(""); setLocalId(""); setSituacao("moderado");
      onSaved?.();
      await flushQueue();
    } catch (err: any) {
      enqueue(pending);
      setMsg("Não foi possível enviar agora. Salvamos localmente e tentaremos novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Solicitante *</label>
        <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Site *</label>
        <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={siteId} onChange={(e) => { setSiteId(e.target.value); setLocalId(""); }}>
          <option value="">Selecione…</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        {sites.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Nenhum site cadastrado. Peça ao Planejamento para cadastrar.</p>}
      </div>
      <div>
        <label className="text-sm font-medium">Local *</label>
        <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={localId} onChange={(e) => setLocalId(e.target.value)} disabled={!siteId}>
          <option value="">Selecione…</option>
          {locaisDoSite.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">TAG do equipamento *</label>
        <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={tag} onChange={(e) => setTag(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Situação atual *</label>
        <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
          {SITUACOES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Descrição detalhada da falha *</label>
        <textarea className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium">Foto</label>
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="mt-1 block w-full text-sm" />
        {foto && <img src={foto.base64} alt="" className="mt-2 h-32 rounded-md border object-cover" />}
      </div>
      {msg && <div className="md:col-span-2 rounded-md bg-secondary px-3 py-2 text-sm">{msg}</div>}
      <div className="md:col-span-2">
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Salvando..." : "Registrar demanda"}
        </button>
      </div>
    </form>
  );
}
