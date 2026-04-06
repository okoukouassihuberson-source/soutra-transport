'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, Smartphone, Printer, ShieldAlert, CheckCircle2, Navigation, MessageCircle, ExternalLink, Loader2 } from 'lucide-react'

const paymentMethods = [
  { id: 'especes', name: 'Espèces', color: 'bg-emerald-500' },
  { id: 'wave', name: 'Wave', color: 'bg-blue-500' },
  { id: 'orange', name: 'Orange Money', color: 'bg-orange-500' },
  { id: 'mtn', name: 'MTN MoMo', color: 'bg-yellow-500' },
  { id: 'moov', name: 'Moov Money', color: 'bg-indigo-500' }
]

// Mock de 50 sièges standard, dont certains déjà pris aléatoirement
const MOCK_TOTAL_SEATS = 50;
const INITIAL_OCCUPIED = [3, 4, 12, 13, 22, 23, 24, 45, 46, 50];

export default function POSPage() {
  const [selectedRoute, setSelectedRoute] = useState("Abidjan - Bouaké")
  const [ticketPrice, setTicketPrice] = useState(5000)
  
  // Nouveaux états de saisie
  const [passengerName, setPassengerName] = useState('')
  const [passengerPhone, setPassengerPhone] = useState('')
  const [selectedCar, setSelectedCar] = useState('1245 AB 01')
  const [selectedDriver, setSelectedDriver] = useState('Amadou Konaté')
  const [selectedConductor, setSelectedConductor] = useState('Kouamé Serge')

  // Gestion WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sending' | 'sent' | 'manual'>('idle')
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null)
  const [generatedQR, setGeneratedQR] = useState<string>('')

  // Auth Supabase
  const supabase = createClient()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('users').select('company_id').eq('id', data.user.id).single()
          .then(({ data: p }) => { if (p?.company_id) setCompanyId(p.company_id) })
      }
    })
  }, [])
  
  const [amountReceived, setAmountReceived] = useState<number | ''>('')
  const [change, setChange] = useState(0)
  const [payment, setPayment] = useState('especes')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Gestion intelligente de la Grille des Sièges !
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>(INITIAL_OCCUPIED)
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)

  // Calcul automatique monnaie Ivoirienne
  useEffect(() => {
     if (typeof amountReceived === 'number') {
        setChange(amountReceived - ticketPrice)
     } else {
        setChange(0)
     }
  }, [amountReceived, ticketPrice])

  const handlePrint = async () => {
    setIsProcessing(true)
    setWhatsappStatus('idle')
    setWhatsappLink(null)
    setBookingError('')

    // Créer le vrai billet dans Supabase
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          passengerName,
          passengerPhone,
          seatNumber: selectedSeat,
          priceTicket: ticketPrice,
          amountReceived: payment === 'especes' ? amountReceived : ticketPrice,
          paymentMethod: paymentMethods.find(m => m.id === payment)?.name || 'Espèces',
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du billet.')
      setGeneratedQR(data.booking?.qrCode || '')
    } catch (err: any) {
      setBookingError(err.message)
      setIsProcessing(false)
      return
    }
    setIsProcessing(false)
    setShowSuccess(true)

    // Envoi WhatsApp si un numéro a été saisi
    if (passengerPhone.trim()) {
      setWhatsappStatus('sending')
      try {
        const res = await fetch('/api/notifications/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passengerPhone,
            passengerName,
            ticketId: generatedQR,
            seatNumber: selectedSeat,
            route: selectedRoute,
            carPlate: selectedCar,
            price: ticketPrice,
            departureTime: '14:30',
            companyName: 'Soutra Transport'
          })
        })
        const data = await res.json()
        if (data.degradedMode && data.whatsappLink) {
          setWhatsappStatus('manual')
          setWhatsappLink(data.whatsappLink)
        } else if (data.success) {
          setWhatsappStatus('sent')
        } else {
          setWhatsappStatus('manual')
        }
      } catch {
        setWhatsappStatus('manual')
      }
    }

    // Mise à jour des sièges après 4 secondes
    setTimeout(() => {
      if (selectedSeat) setOccupiedSeats(prev => [...prev, selectedSeat])
      setShowSuccess(false)
      setAmountReceived('')
      setPassengerName('')
      setPassengerPhone('')
      setSelectedSeat(null)
      setWhatsappStatus('idle')
      setWhatsappLink(null)
    }, 6000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-6">
         <h1 className="text-3xl font-bold tracking-tight">Guichet d&apos;Émission Automatisé</h1>
         <p className="text-sm text-muted-foreground mt-1">Créez un titre de transport sans risque de surréservation.</p>
      </div>

      {bookingError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{bookingError}</p>
        </div>
      )}

      {showSuccess ? (
         <Card className="border-emerald-500/50 bg-emerald-500/5 shadow-2xl flex flex-col items-center justify-center p-8 text-center min-h-[500px] gap-5">
             <CheckCircle2 className="w-20 h-20 text-emerald-500 animate-bounce" />
             <div>
               <h2 className="text-2xl font-bold text-emerald-500 mb-2">Billet Émis !</h2>
               <p className="font-bold text-lg">{passengerName} — Siège N°{selectedSeat}</p>
               <p className="text-sm text-muted-foreground mt-1 font-mono">{generatedQR}</p>
             </div>

             {/* Statut WhatsApp en temps réel */}
             <div className={`w-full max-w-sm rounded-xl p-4 border ${
               whatsappStatus === 'sent' ? 'bg-emerald-500/10 border-emerald-500/30' :
               whatsappStatus === 'sending' ? 'bg-blue-500/10 border-blue-500/30' :
               whatsappStatus === 'manual' ? 'bg-amber-500/10 border-amber-500/30' :
               passengerPhone ? 'bg-muted/30 border-border/50' : 'bg-muted/20 border-border/30'
             }`}>
               <div className="flex items-center gap-3">
                 {whatsappStatus === 'sending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />}
                 {whatsappStatus === 'sent' && <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                 {whatsappStatus === 'manual' && <MessageCircle className="w-5 h-5 text-amber-500 shrink-0" />}
                 {whatsappStatus === 'idle' && <MessageCircle className="w-5 h-5 text-muted-foreground shrink-0" />}
                 <div className="text-left">
                   <p className="font-bold text-sm">
                     {whatsappStatus === 'sending' && 'Envoi WhatsApp en cours...'}
                     {whatsappStatus === 'sent' && 'Billet envoyé sur WhatsApp !'}
                     {whatsappStatus === 'manual' && 'Envoi Manuel Requis'}
                     {whatsappStatus === 'idle' && (passengerPhone ? `Notification: ${passengerPhone}` : 'Aucun numéro WhatsApp fourni')}
                   </p>
                   {whatsappStatus === 'manual' && whatsappLink && (
                     <a href={whatsappLink} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs mt-1 hover:underline">
                       Ouvrir WhatsApp Web <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                 </div>
               </div>
             </div>

             {payment === 'especes' && typeof amountReceived === 'number' && change > 0 && (
                <div className="bg-emerald-500/20 px-8 py-4 rounded-xl border border-emerald-500/30">
                   <p className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Monnaie à Rendre</p>
                   <p className="text-4xl font-extrabold text-foreground mt-1">{change} FCFA</p>
                </div>
             )}
         </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Colonne 1: Assignations du Personnel et Passager (3 cols) */}
         <Card className="col-span-1 lg:col-span-3 border-border/50 shadow-lg h-full">
            <CardHeader className="bg-muted/30 border-b border-border/50">
               <CardTitle className="text-lg">Infos Opérationnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6 flex-1">
               <div className="space-y-4 border-b border-border/50 pb-5">
                 <div className="space-y-2">
                   <Label className="text-xs uppercase tracking-widest text-primary font-black">Nom Légal du Passager <span className="text-red-500">*</span></Label>
                   <Input 
                     value={passengerName}
                     onChange={e => setPassengerName(e.target.value)}
                     placeholder="Ex: Koffi Marc"
                     className="font-black text-lg bg-primary/10 border-primary/20 h-14" 
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                     <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                     WhatsApp (Envoi Auto du Billet)
                   </Label>
                   <div className="relative">
                     <span className="absolute left-3 top-3 text-sm font-bold text-muted-foreground">+225</span>
                     <Input 
                       value={passengerPhone}
                       onChange={e => setPassengerPhone(e.target.value)}
                       placeholder="01 02 03 04 05"
                       type="tel"
                       className="pl-14 font-mono h-11" 
                     />
                   </div>
                   <p className="text-xs text-muted-foreground">Facultatif — Le code QR sera transmis automatiquement.</p>
                 </div>
               </div>
               
               <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Affectation (Car Sélectionné)</Label>
                  <select 
                    value={selectedCar} onChange={e => setSelectedCar(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                     <option value="1245 AB 01">Car 1245 AB 01 (Abj → Bké)</option>
                     <option value="8890 CD 01">Car 8890 CD 01 (S.P. → Abj)</option>
                     <option value="3322 XZ 01">Car 3322 XZ 01 (Yam → Abj)</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Chauffeur assigné</Label>
                  <select 
                    value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                     <option value="Amadou Konaté">Amadou Konaté</option>
                     <option value="Yao François">Yao François</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Convoyeur / Chef de bord</Label>
                  <select 
                    value={selectedConductor} onChange={e => setSelectedConductor(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                     <option value="Kouamé Serge">Kouamé Serge</option>
                     <option value="Sanogo Moussa">Sanogo Moussa</option>
                  </select>
               </div>
            </CardContent>
         </Card>

         {/* Colonne 2: Plan Matriciel du Car (Seating Module) (4 cols) */}
         <Card className="col-span-1 lg:col-span-4 border-border/50 shadow-2xl h-full flex flex-col bg-slate-900 border-none overflow-hidden relative">
            <CardHeader className="bg-slate-950 pb-4 z-10">
               <CardTitle className="text-lg text-slate-100 flex items-center justify-between">
                  Plan de Cabine (Intérieur)
                  <Navigation className="w-5 h-5 text-slate-600" />
               </CardTitle>
               <CardDescription className="text-slate-400">Section Avant → Section Arrière. Allée au centre.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:40px_40px] z-10 overflow-auto">
               <div className="flex flex-col gap-3">
                  {/* Génération algorithmique des sièges par rangées (style 2 - allée - 2) */}
                  {Array.from({ length: Math.ceil(MOCK_TOTAL_SEATS / 4) }).map((_, rowIndex) => {
                     const isLastRowLine = rowIndex === Math.ceil(MOCK_TOTAL_SEATS / 4) - 1;
                     return (
                        <div key={rowIndex} className="flex justify-center gap-2">
                           {/* Sièges Gauche (A, B) */}
                           <SeatNumber num={rowIndex * 4 + 1} occupiedSeats={occupiedSeats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} />
                           <SeatNumber num={rowIndex * 4 + 2} occupiedSeats={occupiedSeats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} />
                           
                           {/* L'Allée Centrale (Vide sauf pour le tout dernier rang qui est souvent complet de 5 sièges) */}
                           <div className={`w-8 ${isLastRowLine ? '' : 'mx-4'}`}>
                              {isLastRowLine && <SeatNumber num={MOCK_TOTAL_SEATS - 2} occupiedSeats={occupiedSeats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} />}
                           </div>

                           {/* Sièges Droite (C, D) */}
                           <SeatNumber num={rowIndex * 4 + 3 - (isLastRowLine ? 1 : 0)} occupiedSeats={occupiedSeats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} />
                           <SeatNumber num={rowIndex * 4 + 4 - (isLastRowLine ? 1 : 0)} occupiedSeats={occupiedSeats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} />
                        </div>
                     )
                  })}
               </div>
            </CardContent>
            {/* Legendes du Plan */}
            <CardFooter className="bg-slate-950 p-4 shrink-0 flex justify-center gap-4 text-xs font-bold uppercase tracking-widest z-10">
               <div className="flex items-center gap-2 text-slate-400"><div className="w-3 h-3 rounded bg-slate-800" /> Libre</div>
               <div className="flex items-center gap-2 text-red-500"><div className="w-3 h-3 rounded bg-red-900" /> Pris</div>
               <div className="flex items-center gap-2 text-emerald-500"><div className="w-3 h-3 rounded bg-emerald-500" /> Choisi</div>
            </CardFooter>
         </Card>

         {/* Colonne 3: Caisse et Facturation Finale (5 cols) */}
         <Card className="col-span-1 lg:col-span-5 border-border/50 shadow-xl h-full flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
               <CardTitle className="text-lg flex justify-between items-center">
                  <span>Guichet de Paiement {selectedSeat ? `- Place ${selectedSeat}` : ''}</span>
                  <span className="text-2xl text-primary font-black">{ticketPrice} F</span>
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 flex-1">
               <div className="space-y-3">
               <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Moyen de Paiement <span className="text-red-500">*</span></Label>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.map(method => (
                     <Button 
                     key={method.id}
                     variant={payment === method.id ? 'default' : 'outline'}
                     className={`h-11 w-full justify-start ${payment === method.id ? method.color + ' text-white hover:' + method.color + '/90' : 'hover:bg-muted'}`}
                     onClick={() => {
                           setPayment(method.id)
                           if (method.id !== 'especes') {
                              setAmountReceived(ticketPrice) // Mobile money est toujours exact
                           } else {
                              setAmountReceived('') // Reset
                           }
                     }}
                     >
                        {method.id === 'especes' ? <Banknote className="w-4 h-4 shrink-0 ml-1 mr-2" /> : <Smartphone className="w-4 h-4 shrink-0 ml-1 mr-2" />}
                        <span className="truncate">{method.name}</span>
                     </Button>
                  ))}
               </div>
               </div>

               {/* Saisie d'espèces (Intelligent) */}
               {payment === 'especes' && (
                  <div className="space-y-4 p-4 bg-background border border-border/50 rounded-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                     <div className="space-y-2 relative z-10">
                       <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Argent cash reçu du client (FCFA)</Label>
                       <Input 
                          type="number" 
                          className="h-14 text-2xl font-bold bg-muted/50 focus-visible:ring-emerald-500" 
                          placeholder="Saisissez la valeur du billet..."
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value === '' ? '' : parseInt(e.target.value))}
                       />
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
                        {[ticketPrice, 10000, 5000, 2000].map((val, idx) => (
                           <Button key={`${val}-${idx}`} variant="secondary" size="sm" onClick={() => setAmountReceived(val)} className="hover:bg-emerald-500 hover:text-white transition-colors">
                           {val} F
                           </Button>
                        ))}
                     </div>

                     {typeof amountReceived === 'number' && amountReceived < ticketPrice && amountReceived > 0 && (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium mt-2 bg-red-500/10 p-2 rounded">
                           <ShieldAlert className="w-4 h-4 shrink-0" /> Erreur: Le client n'a pas donné assez d'espèces.
                        </div>
                     )}

                     {typeof amountReceived === 'number' && amountReceived >= ticketPrice && (
                        <div className="flex items-center justify-between mt-4 border-t border-border/50 pt-4 relative z-10">
                           <span className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Somme à Rendre :</span>
                           <span className={`text-3xl font-black ${change > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                           {change} FCFA
                           </span>
                        </div>
                     )}
                  </div>
               )}
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border/50 p-6">
               <Button 
                  className={`w-full h-16 text-lg font-bold shadow-xl active:scale-95 transition-all ${!selectedSeat ? 'bg-secondary text-secondary-foreground hover:bg-secondary' : 'bg-primary hover:bg-primary/90'}`}
                  disabled={
                     (payment === 'especes' && (typeof amountReceived !== 'number' || amountReceived < ticketPrice)) || 
                     !passengerName.trim() ||
                     !selectedSeat
                  }
                  onClick={handlePrint}
               >
                  {isProcessing ? "Construction du Ticket..." : !selectedSeat ? "Sélectionnez d'abord un Siège au plan" : "Émettre le Billet Officiel"}
                  {!isProcessing && selectedSeat && <Printer className="w-6 h-6 ml-3" />}
               </Button>
            </CardFooter>
         </Card>
      </div>
      )}
    </div>
  )
}

// Composant Visuel de numérotation de série de Chaise pour le Guichet
function SeatNumber({ num, occupiedSeats, selectedSeat, setSelectedSeat }: { num: number, occupiedSeats: number[], selectedSeat: number | null, setSelectedSeat: (val: number) => void }) {
   if (num > MOCK_TOTAL_SEATS) return null;
   const isOccupied = occupiedSeats.includes(num);
   const isSelected = selectedSeat === num;

   return (
      <button 
         disabled={isOccupied}
         onClick={() => setSelectedSeat(num)}
         className={`w-12 h-14 rounded-t-xl rounded-b-md flex flex-col items-center justify-center font-bold font-mono transition-all
            ${isOccupied 
               ? 'bg-red-950/40 text-red-700/50 cursor-not-allowed border-t-4 border-red-900/50' 
               : isSelected 
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border-t-4 border-emerald-300 scale-110 z-20' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 border-t-2 border-slate-600'
            }
         `}
      >
         <span className="text-xs opacity-50 block mb-1">N°</span>
         {num}
      </button>
   )
}
