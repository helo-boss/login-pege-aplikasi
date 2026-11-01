import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const reference = typeof body.reference === 'string' ? body.reference.trim() : ''

    if (!reference || reference.length > 120) {
      return NextResponse.json({ ok: false, error: 'Kode referensi tidak valid.' }, { status: 400 })
    }
    if (email.length > 160) {
      return NextResponse.json({ ok: false, error: 'Email terlalu panjang.' }, { status: 400 })
    }

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) {
      return NextResponse.json({ ok: false, error: 'Konfigurasi Telegram belum tersedia.' }, { status: 503 })
    }

    const text = ['Formulir live tracking baru', `Kode referensi: ${reference}`, `Email: ${email || 'Tidak diisi'}`].join('\n')
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      cache: 'no-store',
    })

    if (!telegramResponse.ok) {
      return NextResponse.json({ ok: false, error: 'Pesan Telegram gagal dikirim.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Permintaan tidak dapat diproses.' }, { status: 400 })
  }
}
