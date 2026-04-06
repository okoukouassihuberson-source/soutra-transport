import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { BusFront, Tag, Users, ArrowUpRight, ShieldAlert, TrendingUp, Star } from 'lucide-react'

async function getDashboardData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return null

  const today = new Date().toISOString().split('T')[0]

  // Stats aujourd'hui
  const { data: todayStats } = await supabase
    .from('company_daily_stats')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('sale_date', today)
    .single()

  // Classement des véhicules
  const { data: vehicleRanking } = await supabase
    .from('vehicle_revenue_ranking')
    .select('*')
    .eq('company_id', profile.company_id)
    .limit(3)

  // Top conducteurs
  const { data: topConductors } = await supabase
    .from('conductors')
    .select('full_name, rating, status')
    .eq('company_id', profile.company_id)
    .order('rating', { ascending: false })
    .limit(3)

  // Total billets du mois
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const { count: monthlyTickets } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', profile.company_id)
    .gte('booked_at', startOfMonth.toISOString())

  return {
    companyName: (profile.companies as any)?.name || 'Votre Compagnie',
    todayRevenue: todayStats?.total_revenue || 0,
    todayTickets: todayStats?.total_tickets || 0,
    cashRevenue: todayStats?.cash_revenue || 0,
    mobileRevenue: todayStats?.mobile_revenue || 0,
    fraudAlerts: todayStats?.fraud_alerts || 0,
    monthlyTickets: monthlyTickets || 0,
    vehicleRanking: vehicleRanking || [],
    topConductors: topConductors || [],
  }
}

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/,/g, ' ')
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>Impossible de charger les données. Vérifiez votre connexion.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vue Globale d&apos;Exploitation</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, <strong>{data.companyName}</strong> — Données du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* KPIs Temps Réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI
          title="Recettes du Jour"
          value={`${formatFCFA(data.todayRevenue)} F`}
          description={`Espèces: ${formatFCFA(data.cashRevenue)} F | Mobile: ${formatFCFA(data.mobileRevenue)} F`}
          icon={<ArrowUpRight className="w-6 h-6 text-emerald-500" />}
          trend="up"
        />
        <KPI
          title="Billets Vendus Aujourd'hui"
          value={String(data.todayTickets)}
          description={`${data.monthlyTickets} billets ce mois-ci`}
          icon={<Tag className="w-6 h-6 text-primary" />}
          trend="up"
        />
        <KPI
          title="Mobile Money (Jour)"
          value={`${formatFCFA(data.mobileRevenue)} F`}
          description="Wave, Orange, MTN, Moov"
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          trend="up"
        />
        <KPI
          title="Alertes Fraude (Jour)"
          value={String(data.fraudAlerts)}
          description={data.fraudAlerts > 0 ? "Vérifiez les clôtures de caisse" : "Aucune anomalie détectée"}
          icon={<ShieldAlert className="w-6 h-6 text-red-500" />}
          trend={data.fraudAlerts > 0 ? "down" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Classement des Cars */}
        <div className="col-span-1 xl:col-span-2 bg-card border border-border/50 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <BusFront className="w-5 h-5 text-primary" /> Classement Rentabilité des Cars
          </h2>
          <p className="text-sm text-muted-foreground mb-5">Véhicules les plus rentables depuis le début.</p>

          {data.vehicleRanking.length === 0 ? (
            <p className="text-muted-foreground text-sm italic py-8 text-center border-2 border-dashed border-border/50 rounded-xl">
              Ajoutez des véhicules et des billets pour voir le classement.
            </p>
          ) : (
            <div className="space-y-4">
              {data.vehicleRanking.map((v: any, i: number) => (
                <div key={v.vehicle_id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
                      i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-300 text-slate-800' : 'bg-orange-400 text-white'
                    }`}>{i + 1}</div>
                    <div>
                      <p className="font-bold font-mono">{v.plate}</p>
                      <p className="text-xs text-muted-foreground">{v.model || 'Bus'} · {v.total_tickets || 0} billets</p>
                    </div>
                  </div>
                  <p className="font-black text-emerald-500 text-lg">
                    {formatFCFA(v.total_revenue || 0)} F
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Conducteurs */}
        <div className="col-span-1 bg-card border border-border/50 rounded-xl shadow-lg p-6 flex flex-col">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Top Personnel
          </h2>
          <p className="text-sm text-muted-foreground mb-5">Agents les mieux notés de votre réseau.</p>

          {data.topConductors.length === 0 ? (
            <p className="text-muted-foreground text-sm italic py-8 text-center border-2 border-dashed border-border/50 rounded-xl flex-1 flex items-center justify-center">
              Ajoutez des convoyeurs ou chauffeurs pour voir leurs scores.
            </p>
          ) : (
            <div className="space-y-3 flex-1">
              {data.topConductors.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-background border border-border/50 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                      {c.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-black text-sm">{c.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPI({ title, value, description, icon, trend }: {
  title: string; value: string; description: string;
  icon: React.ReactNode; trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-black">{value}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl">{icon}</div>
        </div>
        <p className={`text-sm mt-4 font-medium ${
          trend === 'up' ? 'text-emerald-500' :
          trend === 'down' ? 'text-red-500' :
          'text-muted-foreground'
        }`}>
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
