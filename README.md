# home-yield.app — Assessor Financeiro Pessoal

<div align="center">

![home-yield.app](https://img.shields.io/badge/home-yield.app-Assessor%20Financeiro-10b981?style=for-the-badge)

**Onde outros veem faturas, o Yield vê rendimento.**

</div>

## Funcionalidades

- **Dashboard Mensal** — visão completa de receitas, despesas, saldo e investimentos, navegável mês a mês
- **OCR de Faturas com IA** — envie imagem ou PDF da fatura; o Claude extrai, categoriza e importa todas as transações automaticamente
- **Consultor IA** — análise real dos seus gastos com Claude Sonnet, diagnóstico personalizado e recomendações práticas
- **Módulo de Metas** — crie metas financeiras (reserva, viagem, imóvel, etc.), registre aportes e acompanhe o progresso com cálculo automático do aporte mensal necessário
- **Gestão de Transações** — lançamentos manuais com categorias customizáveis
- **Módulo de Renda** — registre salário, pró-labore, comissões e outras receitas por mês
- **Investimentos** — acompanhe seu patrimônio investido
- **Alertas de Gargalo** — identifica categorias acima de 30% da renda

## Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS 4
- **Backend**: Supabase (Auth + Database + Storage)
- **IA**: Anthropic Claude Sonnet 4.6 (OCR de faturas + Consultor)
- **Gráficos**: Recharts
- **Animações**: Framer Motion

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/AndreAssaiante/money-lens.git
cd money-lens
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local`:

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 3. Configure o Supabase

Execute as migrações SQL no painel do Supabase:

```sql
-- Tabela de metas
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  category text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline date,
  color text default '#10b981',
  icon text default '⭐',
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals on delete cascade not null,
  user_id uuid references auth.users not null,
  amount numeric not null,
  contribution_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table goals enable row level security;
alter table goal_contributions enable row level security;
create policy "users own goals" on goals for all using (auth.uid() = user_id);
create policy "users own contributions" on goal_contributions for all using (auth.uid() = user_id);
```

Crie também um bucket **`invoices`** (público) no Storage.

### 4. Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Adicione as variáveis de ambiente acima no painel da Vercel
3. Deploy automático a cada push na branch `main`

## Rotas

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação |
| `/register` | Cadastro |
| `/dashboard` | Dashboard principal com navegação mensal |
| `/dashboard/transactions` | Transações |
| `/dashboard/invoices` | Upload de faturas com OCR |
| `/dashboard/categories` | Categorias customizadas |
| `/dashboard/incomes` | Rendas mensais |
| `/dashboard/investments` | Investimentos |
| `/dashboard/goals` | Metas financeiras |
| `/dashboard/cards` | Configuração de cartões |
| `/dashboard/consultant` | Consultor IA com Claude |

## Licença

MIT
