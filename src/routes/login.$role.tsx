import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loginRole } from "@/lib/gate.functions";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/login/$role")({
  component: LoginPage,
});

function LoginPage() {
  const { role } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const login = useServerFn(loginRole);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (role !== "planejamento" && role !== "manutencao") {
    return <div className="p-8">Perfil inválido.</div>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await login({ data: { role: role as "planejamento" | "manutencao", password } });
    if (r.ok) {
      await router.invalidate();
      await navigate({ to: role === "planejamento" ? "/planejamento" : "/manutencao", replace: true });
    } else {
      setErr("Senha incorreta.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-bold capitalize">Login — {role}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Senha padrão: <span className="font-mono">{role === "planejamento" ? "planejar123" : "manter123"}</span> (altere após o primeiro acesso).
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="password" autoFocus placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          {err && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
