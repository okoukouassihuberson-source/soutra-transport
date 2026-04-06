import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// On utilise le Service Role pour bypasser la RLS car le compte courant n'est pas encore identifié
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const getSupabaseAdmin = () => createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const { companyName, email, password, licenseKey } = await request.json()

    if (!licenseKey || !companyName || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 })
    }

    // 1. Validation de la Clé de Licence
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('key', licenseKey)
      .single()

    if (licenseError || !license) {
        return NextResponse.json({ error: "Clé de licence invalide ou introuvable." }, { status: 404 })
    }

    if (license.company_id !== null) {
        return NextResponse.json({ error: "Cette clé de licence est déjà utilisée par une autre entreprise." }, { status: 403 })
    }

    if (license.status !== 'ACTIVE') {
      return NextResponse.json({ error: "Cette licence n'est plus active." }, { status: 403 })
    }

    // 2. Création de l'Utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // On valide directement pour ce flux SaaS
    })

    if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || "Erreur de création de compte." }, { status: 400 })
    }

    // 3. Création de l'Entreprise (Tenant)
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([{ name: companyName, email: email }])
      .select('id')
      .single()

    if (companyError || !company) {
      // Rollback (idéalement) : Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Erreur lors de la création de la compagnie." }, { status: 500 })
    }

    // 4. Assignation de la licence à la compagnie
    await supabaseAdmin
      .from('licenses')
      .update({ company_id: company.id })
      .eq('id', license.id)

    // 5. Création du profil utilisateur (Admin) dans la table `users`
    await supabaseAdmin
      .from('users')
      .insert([{ 
        id: authData.user.id, 
        company_id: company.id, 
        role: 'admin', 
        full_name: 'Administrateur' 
      }])

    return NextResponse.json({ 
      success: true, 
      message: "Entreprise configurée avec succès ! Vous pouvez vous connecter." 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
