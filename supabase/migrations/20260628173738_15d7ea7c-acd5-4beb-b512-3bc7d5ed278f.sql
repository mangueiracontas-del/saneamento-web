
-- Enums
CREATE TYPE public.situacao_atual AS ENUM ('critico', 'prioritario', 'moderado', 'leve');
CREATE TYPE public.demanda_status AS ENUM ('aberta', 'aceita', 'direcionada', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE public.equipe_destino AS ENUM ('corretiva', 'preventiva', 'inspecao', 'pcm');
CREATE TYPE public.perfil_role AS ENUM ('planejamento', 'manutencao');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Sites
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO anon, authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sites public read" ON public.sites FOR SELECT USING (true);
CREATE POLICY "sites public insert" ON public.sites FOR INSERT WITH CHECK (true);
CREATE POLICY "sites public update" ON public.sites FOR UPDATE USING (true);
CREATE POLICY "sites public delete" ON public.sites FOR DELETE USING (true);
CREATE TRIGGER trg_sites_updated BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Locais
CREATE TABLE public.locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, nome)
);
CREATE INDEX idx_locais_site ON public.locais(site_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locais TO anon, authenticated;
GRANT ALL ON public.locais TO service_role;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locais public read" ON public.locais FOR SELECT USING (true);
CREATE POLICY "locais public insert" ON public.locais FOR INSERT WITH CHECK (true);
CREATE POLICY "locais public update" ON public.locais FOR UPDATE USING (true);
CREATE POLICY "locais public delete" ON public.locais FOR DELETE USING (true);
CREATE TRIGGER trg_locais_updated BEFORE UPDATE ON public.locais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Demandas
CREATE TABLE public.demandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero BIGSERIAL UNIQUE NOT NULL,
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  local_id UUID REFERENCES public.locais(id) ON DELETE SET NULL,
  site_nome TEXT,
  local_nome TEXT,
  tag_equipamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  situacao_atual public.situacao_atual NOT NULL,
  foto_url TEXT,
  solicitante TEXT NOT NULL,
  status public.demanda_status NOT NULL DEFAULT 'aberta',
  equipe_destino public.equipe_destino,
  prioridade TEXT,
  analise_resolucao TEXT,
  aceita_por public.perfil_role,
  aceita_em TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_demandas_status ON public.demandas(status);
CREATE INDEX idx_demandas_data ON public.demandas(data_abertura DESC);
CREATE INDEX idx_demandas_site ON public.demandas(site_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demandas TO anon, authenticated;
GRANT ALL ON public.demandas TO service_role;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demandas public read" ON public.demandas FOR SELECT USING (true);
CREATE POLICY "demandas public insert" ON public.demandas FOR INSERT WITH CHECK (true);
CREATE POLICY "demandas public update" ON public.demandas FOR UPDATE USING (true);
CREATE POLICY "demandas public delete" ON public.demandas FOR DELETE USING (true);
CREATE TRIGGER trg_demandas_updated BEFORE UPDATE ON public.demandas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- App passwords (server-only)
CREATE TABLE public.app_passwords (
  role public.perfil_role PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_passwords TO service_role;
ALTER TABLE public.app_passwords ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated → effectively locked. Only service_role can access.

-- Seed default passwords (bcrypt hashes)
-- 'planejar123'
INSERT INTO public.app_passwords (role, password_hash) VALUES
  ('planejamento', '$2b$10$E0vQ9eJ8H6TQbV4nPL2qZ.Z2Yhh0VvN4FZmYbWZQyzZ8JqPxX5W/G'),
  ('manutencao',   '$2b$10$E0vQ9eJ8H6TQbV4nPL2qZ.Z2Yhh0VvN4FZmYbWZQyzZ8JqPxX5W/G');
-- Hash placeholder will be replaced on first login attempt fallback; app also bootstraps defaults from server function if hash is invalid.
