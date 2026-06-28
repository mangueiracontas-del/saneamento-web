## Saneamento e SPCI — App de Demandas de Manutenção

### Stack
- TanStack Start + React + Tailwind (já scaffoldado)
- Lovable Cloud (Postgres + Storage para fotos)
- GitHub: você conecta pelo menu **+ → GitHub → Conectar projeto** ao final (sync bidirecional automático)

### Banco de dados (migration)

Tabelas em `public`:

- `sites` — `id uuid pk`, `nome text unique`, `created_at`. Cadastrados pelo Planejamento.
- `locais` — `id uuid pk`, `site_id fk sites`, `nome text`, `created_at`. (Site + Local pré-cadastrados → dropdowns.)
- `demandas` — campos:
  - `id uuid pk`
  - `numero bigserial unique` (ID sequencial visível, ex.: #1, #2)
  - `data_abertura timestamptz default now()`
  - `site_id fk`, `local_id fk`, `tag_equipamento text`, `descricao text`
  - `situacao_atual` (enum: `critico`, `prioritario`, `moderado`, `leve`)
  - `foto_url text` (em Storage)
  - `solicitante text`
  - `status` (enum: `aberta`, `aceita`, `direcionada`, `em_andamento`, `concluida`, `cancelada`) default `aberta`
  - `equipe_destino` (enum: `corretiva`, `preventiva`, `inspecao`, `pcm`) nullable
  - `prioridade text` (ex.: P0…PN) nullable
  - `analise_resolucao text` nullable
  - `aceita_por` (enum: `planejamento`, `manutencao`) nullable
  - `aceita_em timestamptz` nullable
  - `concluida_em timestamptz` nullable
  - `updated_at timestamptz`
- `app_passwords` — `role text pk` ('planejamento'|'manutencao'), `password_hash text`, `updated_at`. Permite trocar a senha pela própria UI.

RLS:
- Acesso público total à pagina principal exige `SELECT` e `INSERT` anônimos em `demandas`, `sites`, `locais`. `UPDATE/DELETE` apenas via server functions autorizadas pelo cookie de gate (service-role no servidor).
- `app_passwords` sem acesso do cliente — só server functions.

Storage:
- Bucket público `demandas-fotos` para upload das fotos (URLs públicas para listagem).

### Autenticação (gate por senha compartilhada)

- Cookie de sessão criptografado (`useSession` do TanStack Start) com `SESSION_SECRET` gerado automaticamente.
- Server functions: `loginRole({ role, password })`, `logoutRole()`, `changeRolePassword({ role, currentPassword, newPassword })`, `getCurrentRole()`.
- Hash bcrypt (`bcryptjs`) das senhas em `app_passwords`. Seed inicial: senha `planejar123` para planejamento e `manter123` para manutenção (você troca pela UI no primeiro acesso).
- Comparação timing-safe; falhas genéricas.

### Rotas

- `/` — pública. Lista de demandas com filtros (data, site, local, prioridade, status, solicitante) + botão "Nova demanda" + "Exportar Excel". Cards mostram número, status, foto miniatura, situação, prioridade.
- `/nova` — formulário público de nova demanda (modal ou página). Quando offline, salva em IndexedDB e mostra badge "pendente de envio".
- `/login/planejamento` e `/login/manutencao` — formulário de senha.
- `/planejamento` — gated. Tabela completa, ações: aceitar, direcionar (equipe), definir prioridade (P0…PN), excluir, trocar senha, gerenciar sites e locais.
- `/manutencao` — gated. Lista ordenada por **data depois prioridade**. Ações: aceitar (status → em andamento automaticamente), ajustar prioridade, registrar análise/resolução, concluir, trocar senha.

### Offline-first (cadastro de demanda)

- `localStorage` como fila simples (`pendingDemandas`).
- Listener `online` faz flush automático: envia cada demanda pendente via server function.
- Banner persistente quando há itens na fila.
- Fotos pendentes ficam armazenadas como base64 no localStorage até o sync.

### Export Excel

- Biblioteca `xlsx` (SheetJS).
- Botão na pagina principal exporta resultado filtrado em `.xlsx` com cabeçalhos legíveis (Número, Data, Site, Local, TAG, Descrição, Situação, Status, Equipe, Prioridade, Solicitante, Análise/Resolução).

### Design

- Tema corporativo industrial: azul-petróleo escuro como `primary`, alerta laranja/vermelho para situação crítica, verde para leve.
- Badges coloridos por situação e por status.
- Tabela densa para uso em desktop; cards empilhados em mobile.
- Header com nome "Saneamento e SPCI" e links discretos para "Planejamento" e "Manutenção".

### Arquivos principais a criar

```text
supabase/migrations/<ts>_init.sql        — schema + RLS + GRANTs + seed senhas
src/lib/gate.functions.ts                — login/logout/troca senha/getCurrentRole
src/lib/demandas.functions.ts            — listar/criar/atualizar/excluir
src/lib/sites.functions.ts               — CRUD sites/locais
src/lib/excel.ts                         — export xlsx
src/lib/offline-queue.ts                 — fila localStorage + flush
src/lib/situacao.ts                      — labels, cores, enums compartilhados
src/routes/index.tsx                     — pública: lista + filtros + export
src/routes/nova.tsx                      — formulário de nova demanda
src/routes/login.$role.tsx               — login Planejamento/Manutenção
src/routes/planejamento.tsx              — área Planejamento
src/routes/manutencao.tsx                — área Manutenção
src/components/demandas/*                — DemandaCard, DemandaForm, FiltersBar, StatusBadge…
src/styles.css                           — tokens semânticos
```

### Secrets

- `SESSION_SECRET` (gerado, 64 chars) — assinar o cookie de gate.
- Senhas padrão ficam no banco (hash) — você troca pela UI.

### Limitações conhecidas (assumidas)

- Senha compartilhada por perfil = qualquer pessoa com a senha entra (sem auditoria por usuário). Você confirmou esta escolha.
- "Hospedagem" no GitHub = sincronização do código (conectar pelo botão GitHub). A execução continua no Lovable (botão Publicar para gerar URL pública). Se quiser hospedar em outro provedor depois, o código está no seu repo.

Confirma para eu construir tudo?