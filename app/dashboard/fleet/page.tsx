'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bus, Map, Plus, Search, ShieldCheck, Cog, Loader2, AlertCircle, X } from 'lucide-react'

export default function FleetPage() {
  const supabase = createClient()
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newCar, setNewCar] = useState({ plate: '', model: '', capacity: 50 })

  // Chargement en Temps Réel des Données Cloud
  useEffect(() => {
    async function loadAuthorizedData() {
      try {
         const { data: authData } = await supabase.auth.getUser()
         if (!authData.user) {
             throw new Error("Vous n'êtes pas authentifié ou la session a expiré.")
         }

         const { data: profile } = await supabase.from('users').select('company_id').eq('id', authData.user.id).single()
         if (profile?.company_id) {
             setCompanyId(profile.company_id)
         } else {
             throw new Error("Aucune entreprise rattachée à cette session.")
         }

         // Fetch la vraie liste de véhicules de l'entreprise
         const { data: fleet, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
         if (error) throw error

         setVehicles(fleet || [])
      } catch (err: any) {
         setErrorMsg(err.message)
      } finally {
         setIsPageLoading(false)
      }
    }

    loadAuthorizedData()
  }, [])

  const handleAddVehicle = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!companyId) return
      setIsSaving(true)
      setErrorMsg("")

      try {
          const { data, error } = await supabase.from('vehicles').insert([{
              company_id: companyId,
              plate: newCar.plate,
              model: newCar.model,
              capacity: newCar.capacity,
              status: 'active'
          }]).select()

          if (error) throw error
          
          if (data && data[0]) {
             setVehicles([data[0], ...vehicles])
             setIsModalOpen(false)
             setNewCar({ plate: '', model: '', capacity: 50 })
          }
      } catch (err: any) {
          setErrorMsg("Erreur lors de l'enregistrement de ce car (Plaque déjà existante ?)")
      } finally {
          setIsSaving(false)
      }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flotte & GPS</h1>
          <p className="text-muted-foreground mt-1">Supervisez l'état, la capacité et la position de vos bus.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Mettre un Car en Ligne
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Cartographie fictive (UX design) */}
      <Card className="border-border/50 shadow-lg overflow-hidden relative h-64 bg-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://maps.wikimedia.org/osm-intl/12/2034/1990.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 text-center">
           <Map className="w-16 h-16 text-white/50 mx-auto mb-2 animate-pulse" />
           <h3 className="text-xl font-bold text-white tracking-widest">MAP MODULE</h3>
           <p className="text-white/70 text-sm mt-1">API GPS en attente d'activation</p>
        </div>
        
        {/* Mock des bus */}
        {!isPageLoading && vehicles.length > 0 && (
           <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_#2563eb] animate-ping" />
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {isPageLoading ? (
               <div className="col-span-1 md:col-span-2 xl:col-span-3 py-20 flex flex-col items-center justify-center text-muted-foreground animate-pulse border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                   <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                   <p className="font-bold tracking-widest uppercase">Téléchargement Côté Serveur...</p>
               </div>
           ) : vehicles.length === 0 ? (
               <div className="col-span-1 md:col-span-2 xl:col-span-3 py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                   <p className="font-bold text-lg mb-1">C'est Silencieux Ici</p>
                   <p className="text-sm">Votre base de flotte Supabase ne contient encore aucun véhicule.</p>
               </div>
           ) : (
              vehicles.map((v) => (
                <Card key={v.id} className="border-border/50 shadow-md hover:shadow-xl transition-all group overflow-hidden">
                   <CardHeader className="bg-muted/10 border-b border-border/30 pb-4 relative">
                      <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <CardTitle className="flex items-center gap-2"><Bus className="w-5 h-5 text-primary" /> {v.model}</CardTitle>
                      <CardDescription className="uppercase mt-2 font-mono tracking-widest text-foreground font-black bg-muted/50 inline-block px-2 py-1 rounded">
                         {v.plate}
                      </CardDescription>
                   </CardHeader>
                   <CardContent className="pt-4 pb-0 grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-xs uppercase text-muted-foreground font-bold tracking-widest">Capacité</p>
                         <p className="font-black text-xl">{v.capacity} Places</p>
                      </div>
                      <div>
                         <p className="text-xs uppercase text-muted-foreground font-bold tracking-widest">Condition</p>
                         <div className="flex items-center gap-1 text-emerald-500 mt-1">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="font-bold text-sm">Opérationnel</span>
                         </div>
                      </div>
                   </CardContent>
                   <CardFooter className="pt-6 border-t border-border/10">
                      <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground"><Cog className="w-4 h-4 mr-2" /> Carnet d'entretien</Button>
                   </CardFooter>
                </Card>
              ))
           )}
      </div>

       {/* Pop-up Modale Ajout de Car */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <Card className="w-full max-w-md shadow-2xl border-border/50 border-primary/20">
               <CardHeader className="flex flex-row justify-between items-center border-b border-border/50 bg-muted/10">
                  <div>
                    <CardTitle>Enregistrer un Véhicule</CardTitle>
                    <CardDescription>La base de données validera l'immatriculation.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                     <X className="w-5 h-5" />
                  </Button>
               </CardHeader>
               <CardContent className="pt-6">
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                     <div className="space-y-2">
                       <Label className="uppercase text-xs font-bold tracking-widest">Plaque d'Immatriculation</Label>
                       <Input value={newCar.plate} onChange={e => setNewCar({...newCar, plate: e.target.value.toUpperCase()})} required placeholder="1234 AB 01" className="font-mono uppercase font-bold" />
                     </div>
                     <div className="space-y-2">
                       <Label className="uppercase text-xs font-bold tracking-widest">Catégorie / Modèle</Label>
                       <Input value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} required placeholder="Ex: Grand Bus (Yutong, Mercedes...)" />
                     </div>
                     
                     <div className="space-y-2">
                        <Label className="uppercase text-xs font-bold tracking-widest">Capacité Assise Nette (Passagers)</Label>
                        <Input 
                           type="number" min={4} max={120} 
                           value={newCar.capacity} onChange={e => setNewCar({...newCar, capacity: parseInt(e.target.value) || 0})}
                           required className="font-bold text-xl h-12"
                        />
                     </div>
                     
                     <Button type="submit" className="w-full mt-4 bg-primary hover:bg-primary/90 h-10 font-bold" disabled={isSaving || !companyId}>
                         {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Écriture Cloud...</> : "Mettre en Circulation"}
                     </Button>
                  </form>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  )
}
