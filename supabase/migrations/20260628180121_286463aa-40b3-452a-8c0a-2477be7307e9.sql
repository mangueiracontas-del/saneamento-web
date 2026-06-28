
-- demandas: drop public UPDATE/DELETE policies
DROP POLICY IF EXISTS "demandas public delete" ON public.demandas;
DROP POLICY IF EXISTS "demandas public update" ON public.demandas;

-- sites: drop public write policies (SELECT remains)
DROP POLICY IF EXISTS "sites public insert" ON public.sites;
DROP POLICY IF EXISTS "sites public update" ON public.sites;
DROP POLICY IF EXISTS "sites public delete" ON public.sites;

-- locais: same
DROP POLICY IF EXISTS "locais public insert" ON public.locais;
DROP POLICY IF EXISTS "locais public update" ON public.locais;
DROP POLICY IF EXISTS "locais public delete" ON public.locais;

-- app_passwords: revoke all public grants, keep service_role only
REVOKE ALL ON public.app_passwords FROM anon;
REVOKE ALL ON public.app_passwords FROM authenticated;
REVOKE ALL ON public.app_passwords FROM PUBLIC;
GRANT ALL ON public.app_passwords TO service_role;

-- Storage: drop any existing policies on demandas-fotos bucket; only service_role accesses it
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        COALESCE(qual, '') LIKE '%demandas-fotos%'
        OR COALESCE(with_check, '') LIKE '%demandas-fotos%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;
