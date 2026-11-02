import { NextResponse } from 'next/server'

const MAX_MESSAGE_LENGTH = 500
const MAX_MESSAGES = 50

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

async function redis(command: string[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Redis belum dikonfigurasi.')

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Penyimpanan chat tidak tersedia.')
  return response.json() as Promise<{ result: unknown }>
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = clean(searchParams.get('reference'), 120)
  if (!reference) return NextResponse.json({ ok: false, error: 'Kode referensi diperlukan.' }, { status: 400 })

  try {
    const result = await redis(['LRANGE', `live-chat:${reference}`, '0', String(MAX_MESSAGES - 1)])
    const messages = Array.isArray(result.result) ? result.result.map((item) => JSON.parse(String(item))) : []
    return NextResponse.json({ ok: true, messages: messages.reverse() })
  } catch {
    return NextResponse.json({ ok: false, error: 'Percakapan belum dapat dimuat.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const reference = clean(body.reference, 120)
    const text = clean(body.text, MAX_MESSAGE_LENGTH)
    const sender = body.sender === 'admin' ? 'admin' : 'customer'

    if (!reference || !text) return NextResponse.json({ ok: false, error: 'Pesan tidak boleh kosong.' }, { status: 400 })

    const message = JSON.stringify({ id: crypto.randomUUID(), text, sender, createdAt: new Date().toISOString() })
    await redis(['LPUSH', `live-chat:${reference}`, message])
    await redis(['LTRIM', `live-chat:${reference}`, '0', String(MAX_MESSAGES - 1)])
    return NextResponse.json({ ok: true, message: JSON.parse(message) })
  } catch {
    return NextResponse.json({ ok: false, error: 'Pesan belum dapat dikirim.' }, { status: 503 })
  }
}
