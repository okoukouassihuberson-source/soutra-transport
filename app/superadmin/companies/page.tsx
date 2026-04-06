export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, CheckCircle2, XCircle, Users, Bus } from 'lucide-react'
import Link from 'next/link'

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function getAllCompanies() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from('companies')
    .select(`
      id, name, email, phone, address, rccm, ncc, logo_url, is_active, created_at,
      licenses ( key, plan, status, expires_at ),
      conductors ( count ),
      vehicles ( count )
    `)
    .order('created_at', { ascending: false })

  return data || []
}

export default async function CompaniesPage() {
  const companies = await getAllCompanies()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white">Gestion des Compagnies</h1>
          <p className="text-slate-400 mt-1">{companies.length} entreprise(s) dans le système</p>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-lg text-slate-400">Aucune compagnie enregistrée</p>
          <p className="text-sm mt-2">Les nouvelles inscriptions apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company: any) => {
            const license = company.licenses?.[0]
            const vehicleCount = company.vehicles?.[0]?.count ?? '—'
            const conductorCount = company.conductors?.[0]?.count ?? '—'

            return (
              <div key={company.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Logo + Infos */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
                      {company.logo_url
                        ? <img src={company.logo_url} alt="" className="w-full h-full object-contain" />
                        : <span className="text-2xl font-black text-slate-400">{company.name?.charAt(0)}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-white font-black text-lg">{company.name}</h2>
                        {company.is_active ? (
                          <span className="bg-emerald-400/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-400/20">ACTIF</span>
                        ) : (
                          <span className="bg-red-400/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-400/20">SUSPENDU</span>
                        )}
                        {license && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            license.plan === 'enterprise' ? 'bg-violet-400/10 text-violet-400 border-violet-400/20'
                            : license.plan === 'premium' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                            : 'bg-slate-400/10 text-slate-400 border-slate-400/20'
                          }`}>{license.plan?.toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{company.email} · {company.phone || 'N/A'}</p>
                      {company.address && <p className="text-slate-500 text-xs mt-1">{company.address}</p>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 md:gap-8 text-center shrink-0">
                    <div>
                      <p className="text-2xl font-black text-white">{vehicleCount}</p>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1"><Bus className="w-3 h-3" /> Cars</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{conductorCount}</p>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1"><Users className="w-3 h-3" /> Agents</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Expire</p>
                      <p className="text-sm font-bold text-white">{license?.expires_at ? new Date(license.expires_at).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Pied de Carte */}
                <div className="border-t border-slate-800 px-6 py-3 bg-slate-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {company.rccm && <span>RCCM: <strong className="text-slate-400 font-mono">{company.rccm}</strong></span>}
                    {company.ncc && <span>NCC: <strong className="text-slate-400 font-mono">{company.ncc}</strong></span>}
                    <span>Inscrit le {new Date(company.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex gap-2">
                    <SuspendButton companyId={company.id} isActive={company.is_active} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Action bouton Suspendre / Réactiver (Client Component)
function SuspendButton({ companyId, isActive }: { companyId: string; isActive: boolean }) {
  return isActive ? (
    <form action={async () => {
      'use server'
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await sb.from('companies').update({ is_active: false }).eq('id', companyId)
      await sb.from('licenses').update({ status: 'SUSPENDED' }).eq('company_id', companyId)
    }}>
      <button type="submit" className="flex items-center gap-2 bg-red-400/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-400/20 transition-colors">
        <XCircle className="w-3.5 h-3.5" /> Suspendre
      </button>
    </form>
  ) : (
    <form action={async () => {
      'use server'
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await sb.from('companies').update({ is_active: true }).eq('id', companyId)
      await sb.from('licenses').update({ status: 'ACTIVE' }).eq('company_id', companyId)
    }}>
      <button type="submit" className="flex items-center gap-2 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400/20 transition-colors">
        <CheckCircle2 className="w-3.5 h-3.5" /> Réactiver
      </button>
    </form>
  )
}
