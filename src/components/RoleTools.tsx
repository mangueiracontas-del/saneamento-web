import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { changeRolePassword, logoutRole } from "@/lib/gate.functions";

export function RoleToolbar({ role, onLogout }: { role: "planejamento" | "manutencao"; onLogout: () => void }) {
  const logout = useServerFn(logoutRole);
  const change = useServerFn(changeRolePassword);
  const [openPwd, setOpenPwd] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function doLogout() {
    await logout({ data: { role } });
    onLogout();
  }
  async function changePwd(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = await change({ data: { role, currentPassword: current, newPassword: next } });
    if (r.ok) { setMsg("Senha alterada."); setCurrent(""); setNext(""); setTimeout(() => setOpenPwd(false), 800); }
    else setMsg(r.error || "Erro");
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setOpenPwd((v) => !v)} className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-secondary">Trocar senha</button>
      <button onClick={doLogout} className="rounded-md border bg-card px-3 py-2 text-sm hover:bg-secondary">Sair</button>
      {openPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenPwd(false)}>
          <form onSubmit={changePwd} className="w-full max-w-sm space-y-3 rounded-lg bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Trocar senha — {role}</h3>
            <input type="password" placeholder="Senha atual" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <input type="password" placeholder="Nova senha" value={next} onChange={(e) => setNext(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            {msg && <div className="text-sm">{msg}</div>}
            <button type="submit" className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Alterar</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function SitesManager() {
  const [sites, setSites] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [newSite, setNewSite] = useState("");
  const [newLocal, setNewLocal] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  async function load() {
    const [{ data: s }, { data: l }] = await Promise.all([
      __import_supabase().then((sb) => sb.from("sites").select("id,nome").order("nome")),
      __import_supabase().then((sb) => sb.from("locais").select("id,nome,site_id").order("nome")),
    ]);
    setSites(s || []);
    setLocais(l || []);
  }
  useEffect(() => { if (open) load(); }, [open]);

  async function addSite() {
    if (!newSite.trim()) return;
    const sb = await __import_supabase();
    await sb.from("sites").insert({ nome: newSite.trim() });
    setNewSite("");
    load();
  }
  async function addLocal(siteId: string) {
    const v = (newLocal[siteId] || "").trim();
    if (!v) return;
    const sb = await __import_supabase();
    await sb.from("locais").insert({ site_id: siteId, nome: v });
    setNewLocal((s) => ({ ...s, [siteId]: "" }));
    load();
  }
  async function delSite(id: string) {
    if (!confirm("Excluir este site e todos os seus locais?")) return;
    const sb = await __import_supabase();
    await sb.from("sites").delete().eq("id", id);
    load();
  }
  async function delLocal(id: string) {
    const sb = await __import_supabase();
    await sb.from("locais").delete().eq("id", id);
    load();
  }

  return (
    <div className="rounded-lg border bg-card">
      <button onClick={() => setOpen((v) => !v)} className="w-full px-4 py-3 text-left text-sm font-semibold">
        {open ? "▾" : "▸"} Sites e Locais
      </button>
      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="flex gap-2">
            <input value={newSite} onChange={(e) => setNewSite(e.target.value)} placeholder="Novo site" className="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
            <button onClick={addSite} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Adicionar site</button>
          </div>
          <div className="space-y-3">
            {sites.map((s) => {
              const ls = locais.filter((l) => l.site_id === s.id);
              return (
                <div key={s.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{s.nome}</div>
                    <button onClick={() => delSite(s.id)} className="text-xs text-destructive">excluir</button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {ls.map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-sm">
                        <span>• {l.nome}</span>
                        <button onClick={() => delLocal(l.id)} className="text-xs text-destructive">excluir</button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <input value={newLocal[s.id] || ""} onChange={(e) => setNewLocal((v) => ({ ...v, [s.id]: e.target.value }))} placeholder="Novo local" className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" />
                    <button onClick={() => addLocal(s.id)} className="rounded-md border px-2 py-1 text-xs">Adicionar local</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

async function __import_supabase() {
  const m = await import("@/integrations/supabase/client");
  return m.supabase;
}
