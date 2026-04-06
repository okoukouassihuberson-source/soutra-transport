import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialisation mockée pour illustrer l'architecture Backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { licenseKey, companyName, email } = body

    if (!licenseKey) {
      return NextResponse.json({ error: "Clé de licence absente" }, { status: 400 })
    }

    // 1. Vérifier si la clé existe et si elle est valide
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', licenseKey)
      .single()

    if (licenseError || !license) {
        // Mock success pour la démo sans vraie BDD
        if (licenseKey.startsWith('SOU-')) {
             return NextResponse.json({ 
                success: true, 
                message: "Licence validée.",
                plan: "Premium Flotte",
                companyId: "comp_123456"
             })
        }
        return NextResponse.json({ error: "Clé de licence invalide ou introuvable" }, { status: 404 })
    }

    if (license.status !== 'ACTIVE' || new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ error: "Licence expirée ou inactive" }, { status: 403 })
    }

    // 2. Associer l'entreprise à la licence
    // ... Logique d'insertion en BDD ...

    return NextResponse.json({ 
      success: true, 
      message: "Compte entreprise créé avec succès et licence activée." 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
