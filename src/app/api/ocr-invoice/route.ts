import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ExtractedTransaction {
  description: string
  amount: number
  date: string | null
  installments: string | null
}

export interface OCRResult {
  transactions: ExtractedTransaction[]
  total: number
  invoiceMonth: string | null
  invoiceYear: string | null
  cardLastDigits: string | null
  rawText: string
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'

    const isImage = mimeType.startsWith('image/')
    const isPDF = mimeType === 'application/pdf'

    if (!isImage && !isPDF) {
      return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG, ou PDF.' }, { status: 400 })
    }

    const prompt = `Você é um sistema especializado em extrair dados de faturas de cartão de crédito brasileiras.

Analise a imagem/documento fornecido e extraia TODAS as transações listadas.

Retorne os dados EXCLUSIVAMENTE no seguinte formato JSON (sem explicações adicionais):

{
  "invoiceMonth": "MM",
  "invoiceYear": "YYYY",
  "cardLastDigits": "XXXX",
  "transactions": [
    {
      "description": "Nome do estabelecimento ou serviço",
      "amount": 99.90,
      "date": "DD/MM/YYYY",
      "installments": "1/3"
    }
  ],
  "total": 999.90
}

Regras importantes:
- description: nome do estabelecimento, sem abreviações quando possível
- amount: valor numérico em reais (positivo, sem R$ ou vírgula — use ponto decimal)
- date: data da compra no formato DD/MM/YYYY, ou null se não encontrar
- installments: parcela no formato "atual/total" (ex: "2/6"), ou null se não for parcelado
- total: soma de todas as transações extraídas
- invoiceMonth e invoiceYear: mês e ano da fatura (não da compra)
- cardLastDigits: últimos 4 dígitos do cartão, ou null se não encontrar
- Ignore linhas de pagamento, créditos, e ajustes — apenas despesas
- Se não conseguir ler algum dado, use null para aquele campo`

    let message: Anthropic.Message

    if (isImage) {
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      })
    } else {
      // PDF: envia como documento
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              } as Anthropic.DocumentBlockParam,
              { type: 'text', text: prompt },
            ],
          },
        ],
      })
    }

    const rawText = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    // Extrair JSON da resposta
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Não foi possível extrair dados da fatura', rawText }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const result: OCRResult = {
      transactions: parsed.transactions ?? [],
      total: parsed.total ?? 0,
      invoiceMonth: parsed.invoiceMonth ?? null,
      invoiceYear: parsed.invoiceYear ?? null,
      cardLastDigits: parsed.cardLastDigits ?? null,
      rawText,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json({ error: 'Erro ao processar fatura' }, { status: 500 })
  }
}
