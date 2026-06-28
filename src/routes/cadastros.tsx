import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { RoleToolbar, SitesManager } from "@/components/RoleTools";
import { getCurrentRoles } from "@/lib/gate.functions";

export const Route = createFileRoute("/cadastros")({
  loader: async () => {
    const roles = await getCurrentRoles();
    return { authorized: roles.planejamento };
  },
  component: Page,
});

function Page() {
  const { authorized } = Route.useLoaderData();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authorized) navigate({ to: "/login/$role", params: { role: "planejamento" } });
  }, [authorized]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Cadastros</h1>
            <p className="text-sm text-muted-foreground">Gerencie os sites e seus locais. Estes itens ficam disponíveis no formulário de demandas.</p>
          </div>
          <RoleToolbar role="planejamento" onLogout={() => navigate({ to: "/" })} />
        </div>

        <SitesManager defaultOpen />
      </main>
    </div>
  );
}
