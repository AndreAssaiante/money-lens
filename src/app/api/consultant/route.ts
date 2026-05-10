import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ConsultantPayload {
  totalIncome: number
  totalExpenses: number
  balance: number
  expensesByCategory: { name: string; total: number; percentage: number }[]
  topCategories: { name: string; total: number }[]
  goals: { name: string; target_amount: number; current_amount: number; deadline: string | null }[]
  month: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ConsultantPayload = await req.json()

    const {
      totalIncome,
      totalExpenses,
      balance,
      expensesByCategory,
      topCategories,
      goals,
      month,
    } = body

    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0'
    const expenseRate = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : '0'

    const categoryBreakdown = expensesByCategory
      .map(c => `- ${c.name}: R$ ${c.total.toFixed(2)} (${c.percentage.toFixed(0)}% das despesas)`)
      .join('\n')

    const goalsSection =
      goals.length > 0
        ? goals
            .map(
              g =>
                `- ${g.name}: acumulado R$ ${g.current_amount.toFixed(2)} de R$ ${g.target_amount.toFixed(2)}${g.deadline ? `, prazo: ${g.deadline}` : ''}`
            )
            .join('\n')
        : 'Nenhuma meta definida ainda.'

    const prompt = `Você é um consultor financeiro pessoal especializado, direto e empático. Analise os dados financeiros do mês de ${month} e forneça uma análise personalizada em português brasileiro.

## Dados Financeiros — ${month}

**Resumo:**
- Receita total: R$ ${totalIncome.toFixed(2)}
- Despesas totais: R$ ${totalExpenses.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Taxa de poupança: ${savingsRate}%
- Comprometimento da renda: ${expenseRate}%

**Gastos por categoria:**
${categoryBreakdown || 'Nenhum gasto registrado.'}

**Metas financeiras:**
${goalsSection}

## Sua tarefa

Gere uma análise financeira completa com:

1. **Diagnóstico rápido** (2-3 frases): avalie a saúde financeira do mês de forma direta.

2. **Pontos de atenção** (liste até 3): identifique gastos excessivos, categorias acima do ideal, ou padrões preocupantes. Use dados concretos.

3. **Oportunidades de melhora** (liste até 3): sugestões práticas e acionáveis para reduzir gastos ou aumentar a poupança. Seja específico com valores.

4. **Análise de metas**: comente sobre o progresso das metas e se o ritmo atual é suficiente para atingi-las no prazo.

5. **Recomendação prioritária**: uma única ação que, se tomada agora, teria o maior impacto positivo.

Use linguagem clara, direta e motivadora. Evite jargões. Baseie TUDO nos dados fornecidos — não invente dados que não estão aqui. Se não houver metas, sugira criar uma reserva de emergência como primeira meta.

Formate a resposta em Markdown, com seções claramente delimitadas por ## e listas com -.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ analysis: text })
  } catch (err) {
    console.error('Consultant API error:', err)
    return NextResponse.json({ error: 'Erro ao gerar análise' }, { status: 500 })
  }
}
