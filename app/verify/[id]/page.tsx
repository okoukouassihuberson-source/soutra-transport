import { CheckCircle2, AlertCircle, Building, Users, Tag, Clock } from 'lucide-react'

export default function VerifyTicketPage({ params }: { params: { id: string } }) {
  // Mock d'une validation : tout ID factice ayant 4 caractères (ex: 1042) est considéré "Valide"
  const isValid = params.id.length >= 4 

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
       <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative ${isValid ? 'bg-background' : 'bg-red-50'}`}>
          {/* Header */}
          <div className={`p-8 text-center text-white ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`}>
             {isValid ? (
               <CheckCircle2 className="w-16 h-16 mx-auto mb-4 animate-bounce" />
             ) : (
               <AlertCircle className="w-16 h-16 mx-auto mb-4" />
             )}
             <h1 className="text-2xl font-black uppercase tracking-widest">{isValid ? 'Valide' : 'Invalide'}</h1>
             <p className="opacity-80 mt-1">Ticket {params.id}</p>
          </div>

          {/* Corps du billet simulé */}
          {isValid && (
            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /> <span className="font-semibold text-sm">Compagnie Auth & Émettrice</span></div>
                  <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-xs">Standard</span>
               </div>
               
               <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Users className="w-4 h-4"/> Passager</p>
                    <p className="text-lg font-bold">Koffi Yao</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Tag className="w-4 h-4"/> Siège</p>
                       <p className="text-2xl font-black text-primary">12A</p>
                     </div>
                     <div>
                       <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Clock className="w-4 h-4"/> Départ</p>
                       <p className="text-lg font-bold">14:30</p>
                     </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm">
                     <p className="font-semibold text-muted-foreground">Infos Voyage</p>
                     <ul className="mt-2 space-y-1 text-xs">
                        <li className="flex justify-between"><span>Ligne :</span> <strong>Abidjan - Bouaké</strong></li>
                        <li className="flex justify-between"><span>Car (Bus) :</span> <strong>1245 AB 01</strong></li>
                        <li className="flex justify-between"><span>Chauffeur :</span> <strong>Amadou K.</strong></li>
                     </ul>
                  </div>
               </div>
            </div>
          )}

          {!isValid && (
            <div className="p-8 text-center text-red-600 font-medium">
               Ce ticket n&apos;existe pas ou a déjà été scanné à une autre borne. Entrée refusée.
            </div>
          )}
       </div>
    </div>
  )
}
