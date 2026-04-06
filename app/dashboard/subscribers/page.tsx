'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, UserPlus, RefreshCw, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SubscribersPage() {
  const supabase = createClient()
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    full_name: '', phone: '', route_id: '',
    monthly_price_fcfa: 100000, expires_in_days: 30
  })

  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) throw new Error("Non authentifié")

        const { data: profile } = await supabase
          .from('users').select('company_id').eq('id', authData.user.id).single()
        if (!profile?.company_id) throw new Error("Aucune entreprise")
        setCompanyId(profile.company_id)

        const [{ data: subs }, { data: routesList }] = await Promise.all([
          supabase.from('subscribers').select('*, routes(origin, destination)')
            .order('created_at', { ascending: false }),
          supabase.from('routes').select('id, origin, destination').order('origin')
        ])

        setSubscribers(subs || [])
        setRoutes(routesList || [])
      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return
    setIsSaving(true)
    setErrorMsg('')

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + form.expires_in_days)

      // Générer un numéro de carte unique
      const cardNumber = `AB-${Math.floor(Math.random() * 900 + 100)}`

      const { data, error } = await supabase.from('subscribers').insert([{
        company_id: companyId,
        card_number: cardNumber,
        full_name: form.full_name,
        phone: form.phone,
        route_id: form.route_id || null,
        monthly_price_fcfa: form.monthly_price_fcfa,
        expires_at: expiresAt.toISOString().split('T')[0],
        status: 'active'
      }]).select('*, routes(origin, destination)').single()

      if (error) throw error
      setSubscribers([data, ...subscribers])
      setIsModalOpen(false)
      setForm({ full_name: '', phone: '', route_id: '', monthly_price_fcfa: 100000, expires_in_days: 30 })
    } catch (err: any) {
      setErrorMsg("Erreur : " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRenew = async (subId: string) => {
    const sub = subscribers.find(s => s.id === subId)
    if (!sub) return
    const newExpiry = new Date(sub.expires_at)
    newExpiry.setDate(newExpiry.getDate() + 30)

    const { error } = await supabase.from('subscribers')
      .update({ expires_at: newExpiry.toISOString().split('T')[0], status: 'active' })
      .eq('id', subId)

    if (!error) {
      setSubscribers(subscribers.map(s =>
        s.id === subId ? { ...s, expires_at: newExpiry.toISOString().split('T')[0], status: 'active' } : s
      ))
    }
  }

  const filtered = subscribers.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.card_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalActive = subscribers.filter(s => s.status === 'active').length
  const monthlyRevenue = subscribers
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.monthly_price_fcfa || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Abonnés</h1>
          <p className="text-muted-foreground mt-1">Forfaits mensuels pour voyageurs réguliers.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <UserPlus className="w-4 h-4 mr-2" /> Nouvel Abonnement
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Abonnés Actifs</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-black">{totalActive}</div></CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Renouvellements du Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">
              {monthlyRevenue.toLocaleString('fr-FR').replace(/,/g, ' ')} F
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Abonnés Expirés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-500">
              {subscribers.filter(s => s.status === 'expired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Base de données Abonnés</CardTitle>
              <CardDescription>Cartes d'abonnement actives et historique.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un abonné..." className="pl-9 h-9"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm uppercase tracking-widest font-bold">Chargement Supabase...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground">
              <p className="font-bold">Aucun abonné trouvé</p>
              <p className="text-sm mt-1">{searchTerm ? 'Aucun résultat.' : 'Cliquez sur "Nouvel Abonnement" pour commencer.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Carte N°</th>
                    <th className="px-4 py-3 font-medium">Identité</th>
                    <th className="px-4 py-3 font-medium">Trajet Forfaitaire</th>
                    <th className="px-4 py-3 font-medium">Tarif / Mois</th>
                    <th className="px-4 py-3 font-medium">Expiration</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => (
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-muted-foreground">{sub.card_number}</td>
                      <td className="px-4 py-4 font-bold">
                        {sub.full_name}
                        <br /><span className="text-xs text-muted-foreground font-normal">{sub.phone}</span>
                      </td>
                      <td className="px-4 py-4">
                        {sub.routes ? `${sub.routes.origin} → ${sub.routes.destination}` : <span className="text-muted-foreground italic">Non défini</span>}
                      </td>
                      <td className="px-4 py-4 font-black">
                        {(sub.monthly_price_fcfa || 0).toLocaleString('fr-FR').replace(/,/g, ' ')} F
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{sub.expires_at}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          sub.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {sub.status === 'active' ? 'Actif' : 'Expiré'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="outline" size="sm" onClick={() => handleRenew(sub.id)}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Renouveler
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale Ajout Abonné */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-border/50">
            <CardHeader className="flex flex-row justify-between items-center border-b border-border/50 bg-muted/10">
              <div>
                <CardTitle>Nouveau Forfait Mensuel</CardTitle>
                <CardDescription>Créer une carte d'abonnement dans Supabase.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom Complet du Passager</Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="Ex: Bamba Issouf" />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone (WhatsApp)</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+225 01 02 03 04 05" />
                </div>
                <div className="space-y-2">
                  <Label>Ligne de Trajet Forfaitaire</Label>
                  <select value={form.route_id} onChange={e => setForm({ ...form, route_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">-- Aucune ligne spécifique --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tarif Mensuel (FCFA)</Label>
                    <Input type="number" value={form.monthly_price_fcfa}
                      onChange={e => setForm({ ...form, monthly_price_fcfa: parseInt(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée (jours)</Label>
                    <select value={form.expires_in_days} onChange={e => setForm({ ...form, expires_in_days: parseInt(e.target.value) })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value={30}>30 jours</option>
                      <option value={90}>90 jours</option>
                      <option value={180}>6 mois</option>
                      <option value={365}>1 an</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2 font-bold" disabled={isSaving || !companyId}>
                  {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</> : "Créer l'Abonnement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
