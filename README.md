# MoneyLens - Acessor Financeiro Pessoal

<div align="center">

![MoneyLens Logo](https://img.shields.io/badge/MoneyLens-Acessor%20Financeiro-6366f1?style=for-the-badge)

**Seu assessor financeiro pessoal inteligente**

</div>

## Funcionalidades

- **Dashboard Completo**: Visão geral dos seus gastos com gráficos comparativos
- **Upload de Faturas**: Envie imagens/PDFs das faturas do cartão
- **Categorização Automática**: IA categoriza seus gastos automaticamente
- **Consultor IA**: Sugestões personalizadas para "fechar torneiras"
- **Gestão de Investimentos**: Acompanhe seu patrimônio
- **Módulo de Renda**: Registre salário e outras receitas
- **Categorias Customizadas**: Crie suas próprias categorias com cores
- **Alertas de Gargalo**: Identifica quando você gasta demais em uma categoria

## Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Gráficos**: Recharts
- **Animações**: Framer Motion

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/money-lens.git
cd money-lens
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL de migração (fornecido separadamente)
3. Habilite autenticação por email
4. Crie um bucket "invoices" (público)

### 4. Deploy na Vercel

1. Conecte seu repositório GitHub à Vercel
2. Adicione as variáveis de ambiente
3. Deploy automático!

## Estrutura do Projeto

```
money-lens/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Páginas de autenticação
│   │   ├── (dashboard)/     # Páginas do dashboard
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/        # Contextos React
│   │   ├── lib/             # Utilitários e Supabase
│   │   └── types/           # Definições TypeScript
│   └── public/              # Arquivos estáticos
├── vercel.json             # Configuração Vercel
└── package.json
```

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Cadastro |
| `/dashboard` | Dashboard principal |
| `/dashboard/transactions` | Lista de transações |
| `/dashboard/invoices` | Upload de faturas |
| `/dashboard/categories` | Gestão de categorias |
| `/dashboard/incomes` | Módulo de renda |
| `/dashboard/investments` | Acompanhamento de investimentos |
| `/dashboard/cards` | Configurações dos cartões |
| `/dashboard/consultant` | Consultor IA |

## Licença

MIT License - Use livremente!
