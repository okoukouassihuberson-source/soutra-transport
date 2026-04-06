export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Building2, Key, TrendingUp, Users, AlertTriangle, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function getSuperAdminStats() {
  const supabaseAdmin = getSupabaseAdmin()
  const [
    { count: totalCompanies },
    { count: activeCompanies },
    { count: totalLicenses },
    { count: totalBookings },
    { data: recentCompanies }
  ] = await Promise.all([
    supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('companies').select('name, email, created_at').order('created_at', { ascending: false }).limit(5)
  ])

  return { totalCompanies, activeCompanies, totalLicenses, totalBookings, recentCompanies }
}

export default async function SuperAdminOverview() {
  const stats = await getSuperAdminStats()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white">Vue d&apos;ensemble</h1>
        <p className="text-slate-400 mt-1">Tableau de bord de contrôle de l&apos;éditeur SaaS</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Building2 className="w-5 h-5 text-blue-400" />} label="Compagnies Totales" value={String(stats.totalCompanies || 0)} bg="bg-blue-400/10" />
        <StatCard icon={<Activity className="w-5 h-5 text-emerald-400" />} label="Compagnies Actives" value={String(stats.activeCompanies || 0)} bg="bg-emerald-400/10" />
        <StatCard icon={<Key className="w-5 h-5 text-violet-400" />} label="Licences Actives" value={String(stats.totalLicenses || 0)} bg="bg-violet-400/10" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-400" />} label="Billets Émis (Cumul)" value={(stats.totalBookings || 0).toLocaleString('fr-FR').replace(/,/g, ' ')} bg="bg-amber-400/10" />
      </div>

      {/* Nouvelles inscriptions récentes */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" /> Dernières Compagnies Inscrites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats.recentCompanies?.length ? (
            <p className="text-slate-500 italic text-sm py-4 text-center">Aucune compagnie encore inscrite.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCompanies.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-sm">
                      {c.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{c.name}</p>
                      <p className="text-slate-500 text-xs">{c.email}</p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors`}>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>{icon}</div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  )
}
