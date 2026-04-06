'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Banknote, CreditCard, ShieldAlert, BadgeCheck, FileBox, RefreshCw, Loader2, Download } from 'lucide-react'

// Agrégation de données pour l'audit financier par agent de guichet (Conducteur ou Guichetier identifié plus tard)
export default function CashClosurePage() {
  const supabase = createClient()
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function fetchFinancials() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) return

        const { data: profile } = await supabase.from('users').select('company_id').eq('id', authData.user.id).single()
        if (profile?.company_id) {
          setCompanyId(profile.company_id)
          
          // Récupère uniquement les billets vendus aujourd'hui 
          // Note : en prod, un filtre sur booked_at est mieux
          const { data: rawBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('company_id', profile.company_id)

          const todayBookings = (rawBookings || []).filter((b: any) => 
            new Date(b.booked_at).toISOString().startsWith(today)
          )
          
          setTickets(todayBookings)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFinancials()
  }, [today])

  if (isLoading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
  }

  // Calculs monétaires complexes (Tolérance Zéro)
  const totalRevenue = tickets.reduce((acc, t) => acc + (t.price_ticket || 0), 0)
  
  const cashTickets = tickets.filter(t => t.payment_method === 'Espèces')
  const expectedCash = cashTickets.reduce((acc, t) => acc + (t.price_ticket || 0), 0)
  
  const mobileTickets = tickets.filter(t => t.payment_method !== 'Espèces')
  const expectedMobile = mobileTickets.reduce((acc, t) => acc + (t.price_ticket || 0), 0)
  
  const fraudFlags = tickets.filter(t => t.is_fraud_flag)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clôture de Caisse</h1>
          <p className="text-muted-foreground mt-1">Audit financier de la journée du {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Actualiser</Button>
          <Button className="bg-slate-900 text-white shadow-lg shadow-slate-900/20"><Download className="w-4 h-4 mr-2" /> Rapport PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
         {/* Totalisation des fonds (7 cols) */}
         <Card className="col-span-1 md:col-span-12 lg:col-span-7 border-border/50 shadow-xl bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="border-b border-border/50 pb-6">
               <CardTitle className="flex justify-between items-center text-xl">
                 Bilan Financier Global
                 <span className="text-4xl font-black text-primary">{totalRevenue.toLocaleString('fr-FR')} F</span>
               </CardTitle>
               <CardDescription>Représente {tickets.length} billet(s) émis légalement aujourd'hui.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="bg-background border border-border/50 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Banknote className="w-20 h-20" /></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Argent Espèces Attendu</p>
                  <p className="text-3xl font-black text-emerald-500">{expectedCash.toLocaleString('fr-FR')} F</p>
                  <p className="text-sm font-medium text-emerald-500/80 mt-2">{cashTickets.length} transaction(s)</p>
               </div>
               
               <div className="bg-background border border-border/50 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><CreditCard className="w-20 h-20" /></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Dépôts Mobile Money</p>
                  <p className="text-3xl font-black text-blue-500">{expectedMobile.toLocaleString('fr-FR')} F</p>
                  <p className="text-sm font-medium text-blue-500/80 mt-2">{mobileTickets.length} transaction(s)</p>
               </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/50 p-6">
               <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <FileBox className="w-6 h-6 text-slate-500" />
                     <div>
                        <p className="font-bold text-sm">Fin de Quittance</p>
                        <p className="text-xs text-muted-foreground">La caisse doit être vérifiée avant la validation finale.</p>
                     </div>
                  </div>
                  <Button className="font-bold bg-emerald-500 hover:bg-emerald-600 text-white">Validation du Coffre</Button>
               </div>
            </CardFooter>
         </Card>

         {/* Colonne de Sécurité & Fraudes (5 cols) */}
         <Card className="col-span-1 md:col-span-12 lg:col-span-5 border-border/50 shadow-lg flex flex-col">
            <CardHeader className={`${fraudFlags.length > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'} rounded-t-xl transition-colors`}>
               <CardTitle className={`flex items-center gap-2 ${fraudFlags.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {fraudFlags.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <BadgeCheck className="w-5 h-5" />}
                  Audit des Fraudes (Guichet)
               </CardTitle>
               <CardDescription>Analyse des rendus de monnaie suspects.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
               {fraudFlags.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                     <BadgeCheck className="w-16 h-16 text-emerald-400 mb-4 opacity-30" />
                     <p className="font-bold text-emerald-500">Comptabilité Parfaite</p>
                     <p className="text-sm text-muted-foreground mt-2">Aucune erreur de monnaie signalée par l'algorithme aujourd'hui.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     <div className="bg-red-500/10 text-red-500 font-bold p-3 rounded-lg text-sm flex items-center gap-2 border border-red-500/20">
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        {fraudFlags.length} alerte(s) de recouvrement ! Le guichetier a encaissé moins que la valeur de ces billets.
                     </div>
                     <div className="space-y-3 h-[250px] overflow-y-auto pr-2">
                        {fraudFlags.map(f => (
                           <div key={f.id} className="p-3 border border-red-200/20 bg-background rounded-lg hover:border-red-500/50 transition-colors">
                              <p className="font-bold text-sm">{f.passenger_name}</p>
                              <div className="flex justify-between items-center mt-2 text-xs">
                                 <span className="text-muted-foreground">Valeur Billet: <strong className="text-foreground">{f.price_ticket} F</strong></span>
                                 <span className="text-red-500 font-bold">Reçu: {f.amount_received} F</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
