import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Génère une clé de licence unique au format SOU-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
  const segment = () => randomBytes(2).toString('hex').toUpperCase()
  return `SOU-${segment()}-${segment()}-${segment()}`
}

// GET : Liste toutes les compagnies + licences (pour le Super Admin)
export async function GET(request: Request) {
  const authHeader = request.headers.get('x-superadmin-token')
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { data: companies } = await supabaseAdmin.from('companies').select('*, licenses(key, plan, status, expires_at, created_at)').order('created_at', { ascending: false })
  return NextResponse.json({ companies })
}

// POST : Générer une nouvelle licence pour une compagnie (ou sans compagnie = licence vierge)
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-superadmin-token')
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { plan, expiresInDays, companyId } = await request.json()
  const key = generateLicenseKey()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 365))

  const { data, error } = await supabaseAdmin.from('licenses').insert([{
    key,
    plan: plan || 'premium',
    status: 'ACTIVE',
    company_id: companyId || null,
    expires_at: expiresAt.toISOString(),
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, license: data })
}

// PATCH : Suspendre ou Réactiver une licence compagnie
export async function PATCH(request: Request) {
  const authHeader = request.headers.get('x-superadmin-token')
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { licenseId, status } = await request.json()
  const { error } = await supabaseAdmin.from('licenses').update({ status }).eq('id', licenseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
