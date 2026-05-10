/**
 * POST /api/ocr
 *
 * x402-gated OCR endpoint. Body: { image: string } where image can be:
 *   - A path under /public (e.g. "/sample-screenshot.png") — resolved against origin
 *   - A data URL (e.g. "data:image/png;base64,...") — passed straight through
 *   - An absolute http(s) URL — passed through
 *
 * Calls gpt-4o vision and returns { text, confidence }.
 * Without (or with an unconfirmed) X-Payment-Tx header, returns 402.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { verifyPaymentSignature, SETTLEMENT_NETWORK } from '@/lib/x402'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAYMENT_AMOUNT_USDC = 0.003
const PAYMENT_RECIPIENT = process.env.GATEWAY_WALLET_PUBLIC_KEY ?? ''

const MAX_BODY_BYTES = 6 * 1024 * 1024 // 6 MB

interface OcrBody {
  image?: unknown
}

async function resolveImageUrl(image: string, origin: string): Promise<string | null> {
  if (image.startsWith('data:image/')) return image
  if (image.startsWith('https://')) return image
  // For http:// (incl. localhost) and /public paths, fetch server-side and inline
  // as a base64 data URL — OpenAI's vision endpoint can't reach localhost or
  // unauthenticated http origins from its own infrastructure.
  let absolute: string
  if (image.startsWith('/')) absolute = `${origin}${image}`
  else if (image.startsWith('http://')) absolute = image
  else return null
  try {
    const res = await fetch(absolute)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get('content-type') ?? 'image/png'
    return `data:${ct};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const paymentSig = request.headers.get('X-Payment-Tx')
    const verification = await verifyPaymentSignature(paymentSig)
    if (!verification.ok) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          code: 'PAYMENT_REQUIRED',
          reason: verification.reason,
          payment: {
            amount: PAYMENT_AMOUNT_USDC,
            currency: 'USDC',
            network: SETTLEMENT_NETWORK,
            recipient: PAYMENT_RECIPIENT,
          },
        },
        { status: 402 },
      )
    }

    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Payload too large (max 6 MB)', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 },
      )
    }

    let body: OcrBody
    try {
      body = (await request.json()) as OcrBody
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_BODY' },
        { status: 400 },
      )
    }

    if (typeof body.image !== 'string' || body.image.length === 0) {
      return NextResponse.json(
        { error: 'Missing field: image', code: 'MISSING_IMAGE' },
        { status: 400 },
      )
    }

    const imageUrl = await resolveImageUrl(body.image, request.nextUrl.origin)
    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'image must be a /public path, data URL, or http(s) URL',
          code: 'INVALID_IMAGE',
        },
        { status: 400 },
      )
    }

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Extract every visible piece of text from the provided image. Return strict JSON: { "text": string, "confidence": number between 0 and 1 }. If no text is present, return { "text": "", "confidence": 0 }.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract text from this image.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    let parsed: { text?: unknown; confidence?: unknown } = {}
    if (raw) {
      try {
        parsed = JSON.parse(raw)
      } catch {
        // fall through with empty parsed
      }
    }
    const text = typeof parsed.text === 'string' ? parsed.text : ''
    const confidence =
      typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0

    return NextResponse.json(
      { text, confidence },
      { headers: { 'X-Payment-Tx': paymentSig ?? '' } },
    )
  } catch (err) {
    console.error('[/api/ocr]', err)
    const message = err instanceof Error ? err.message : 'OCR failed'
    return NextResponse.json(
      { error: message, code: 'OCR_ERROR' },
      { status: 500 },
    )
  }
}
