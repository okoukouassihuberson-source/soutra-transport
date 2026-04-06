'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus, UserCheck, UserX, UserMinus, X, Loader2, AlertCircle } from 'lucide-react'

export default function DriversPage() {
  const supabase = createClient()
  
  const [drivers, setDrivers] = useState<any[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', type: 'Chauffeur', license: 'B' })

  // Chargement en Temps Réel des Données Cloud
  useEffect(() => {
    async function loadAuthorizedData() {
      try {
         const { data: authData } = await supabase.auth.getUser()
         if (!authData.user) {
             throw new Error("Vous n'êtes pas authentifié ou la session a expiré.")
         }

         // Fetch le tenant de cet utilisateur
         const { data: profile } = await supabase.from('users').select('company_id').eq('id', authData.user.id).single()
         if (profile?.company_id) {
             setCompanyId(profile.company_id)
         } else {
             throw new Error("Aucune entreprise rattachée à cette session.")
         }

         // Fetch la vraie liste de l'entreprise
         const { data: personnel, error } = await supabase.from('conductors').select('*').order('created_at', { ascending: false })
         if (error) throw error

         setDrivers(personnel || [])
      } catch (err: any) {
         setErrorMsg(err.message)
      } finally {
         setIsPageLoading(false)
      }
    }

    loadAuthorizedData()
  }, [])

  const handleAddDriver = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!companyId) return
      setIsSaving(true)
      setErrorMsg("")

      try {
          const { data, error } = await supabase.from('conductors').insert([{
              company_id: companyId,
              full_name: newDriver.name,
              phone: newDriver.phone,
              // Note: L'architecture SQL basique ne stocke pas le 'type' pour l'instant, on mettra à jour cela plus tard si besoin
              status: 'active',
              rating: 5.0
          }]).select()

          if (error) throw error
          
          if (data && data[0]) {
             setDrivers([data[0], ...drivers]) // On rajoute visuellement au tableau le nouveau driver avec son ID Supabase UUID !
             setIsModalOpen(false)
             setNewDriver({ name: '', phone: '', type: 'Chauffeur', license: 'B' })
          }
      } catch (err: any) {
          setErrorMsg("Erreur lors de l'enregistrement en base de données.")
      } finally {
          setIsSaving(false)
      }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Personnel</h1>
          <p className="text-muted-foreground mt-1">Données synchronisées en temps réel avec le serveur.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 active:scale-95 duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Membre (Équipe)
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
               <CardTitle>Liste du Personnel Opérationnel</CardTitle>
               <CardDescription>Tous vos agents inscrits dans la base de données cloud.</CardDescription>
             </div>
             <div className="relative w-64 hidden sm:block">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Rechercher par nom..." className="pl-9 h-9" />
             </div>
          </div>
        </CardHeader>
        <CardContent>
           {isPageLoading ? (
               <div className="py-20 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                   <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                   <p className="font-bold tracking-widest uppercase">Connexion Supabase en cours...</p>
               </div>
           ) : drivers.length === 0 ? (
               <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                   <p className="font-bold text-lg mb-1">Aucun Agent Enregistré</p>
                   <p className="text-sm">Votre base de données Supabase est vide. Veuillez en créer un.</p>
               </div>
           ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                        <tr>
                           <th className="px-4 py-3 font-medium">ID (Cloud Auth)</th>
                           <th className="px-4 py-3 font-medium">Identité de l'Agent</th>
                           <th className="px-4 py-3 font-medium">Contact</th>
                           <th className="px-4 py-3 font-medium">Évaluation</th>
                           <th className="px-4 py-3 font-medium">Statut Actif</th>
                        </tr>
                     </thead>
                     <tbody>
                        {drivers.map((driver) => (
                           <tr key={driver.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-4 font-mono text-xs text-muted-foreground">...{driver.id.slice(-8)}</td>
                              <td className="px-4 py-4 font-bold">{driver.full_name}</td>
                              <td className="px-4 py-4 tracking-wider">{driver.phone}</td>
                              <td className="px-4 py-4 font-medium text-amber-500 font-black">{driver.rating}/5.0</td>
                              <td className="px-4 py-4">
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                   driver.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                   driver.status === 'off' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                                   'bg-red-500/10 text-red-500 border-red-500/20'
                                 }`}>
                                   {driver.status === 'active' && <UserCheck className="w-3.5 h-3.5" />}
                                   {(driver.status === 'off' || driver.status === 'suspended') && <UserX className="w-3.5 h-3.5" />}
                                   {driver.status.toUpperCase()}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
           )}
        </CardContent>
      </Card>

      {/* Pop-up Modale Ajout de Personnel */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <Card className="w-full max-w-md shadow-2xl border-border/50 border-primary/20">
               <CardHeader className="flex flex-row justify-between items-center border-b border-border/50 bg-muted/10">
                  <div>
                    <CardTitle>Ajouter un nouveau membre</CardTitle>
                    <CardDescription>Cet utilisateur sera injecté dans Supabase.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                     <X className="w-5 h-5" />
                  </Button>
               </CardHeader>
               <CardContent className="pt-6">
                  <form onSubmit={handleAddDriver} className="space-y-4">
                     <div className="space-y-2">
                       <Label>Nom & Prénoms</Label>
                       <Input value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} required placeholder="Ex: Soumahoro Abou" />
                     </div>
                     <div className="space-y-2">
                       <Label>Contact Téléphonique</Label>
                       <Input value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} required placeholder="01 02 03 04 05" />
                     </div>
                     
                     <div className="space-y-2">
                        <Label>Rôle Opérationnel</Label>
                        <select 
                           value={newDriver.type} onChange={e => setNewDriver({...newDriver, type: e.target.value})}
                           className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                           <option>Chauffeur</option>
                           <option>Convoyeur</option>
                        </select>
                     </div>
                     
                     <Button type="submit" className="w-full mt-4 bg-primary hover:bg-primary/90" disabled={isSaving || !companyId}>
                         {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement Cloud...</> : "Sauvegarder le profil (Supabase)"}
                     </Button>
                  </form>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  )
}
