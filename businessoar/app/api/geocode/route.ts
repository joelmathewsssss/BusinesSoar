import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  // Nominatim usage: include a real User-Agent / Referer identifying your app.
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '5')

  const res = await fetch(url.toString(), {
    headers: {
      // Change this to your project name/email if you have one
      'User-Agent': 'BusinessSoar/1.0 (school project)',
      'Accept': 'application/json',
    },
    // Basic caching to reduce repeated calls
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 200 })
  }

  const data = (await res.json()) as any[]

  const results = data.map((item) => ({
    display_name: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
  }))

  return NextResponse.json({ results })
}
