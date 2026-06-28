import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground font-bold">
            S
          </div>
          <div>
            <div className="text-base font-bold leading-tight">Saneamento e SPCI</div>
            <div className="text-[11px] uppercase tracking-wider opacity-80">Gestão de Demandas de Manutenção</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-2 hover:bg-white/10">Demandas</Link>
          <Link to="/cadastros" className="rounded-md px-3 py-2 hover:bg-white/10">Cadastros</Link>
          <Link to="/planejamento" className="rounded-md px-3 py-2 hover:bg-white/10">Planejamento</Link>
          <Link to="/manutencao" className="rounded-md px-3 py-2 hover:bg-white/10">Manutenção</Link>
        </nav>
      </div>
    </header>
  );
}
