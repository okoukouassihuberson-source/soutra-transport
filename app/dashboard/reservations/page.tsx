'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, QrCode, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function ReservationsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedQR, setSelectedQR] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadBookings() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) throw new Error("Non authentifié")

        const { data: bookingsList, error } = await supabase
          .from('bookings')
          .select(`
            id, passenger_name, passenger_phone, seat_number,
            qr_code, status, booked_at, price_ticket, payment_method,
            trips (
              departure_at,
              routes ( origin, destination, price_fcfa ),
              vehicles ( plate, model )
            )
          `)
          .order('booked_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setBookings(bookingsList || [])
      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadBookings()
  }, [])

  const filtered = bookings.filter(b =>
    b.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.qr_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const verifyUrl = (qrCode: string) =>
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${qrCode}`

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Réservations & Billetterie</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? 'Chargement...' : `${bookings.length} billet(s) émis — Données en temps réel.`}
          </p>
        </div>
        <Link href="/dashboard/pos">
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Nouveau Billet (Guichet)
          </Button>
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Liste des Billets Émis</CardTitle>
              <CardDescription>Cliquez sur le QR pour agrandir et scanner.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher passager ou code..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p className="font-bold tracking-widest uppercase text-sm">Connexion Supabase...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
              <p className="font-bold text-lg mb-2">Aucun Billet Trouvé</p>
              <p className="text-sm mb-4">
                {searchTerm ? 'Aucun résultat pour cette recherche.' : 'Commencez à émettre des billets depuis le Guichet POS.'}
              </p>
              <Link href="/dashboard/pos">
                <Button size="sm">Ouvrir le Guichet</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">QR / Code</th>
                    <th className="px-4 py-3 font-medium">Passager</th>
                    <th className="px-4 py-3 font-medium">Trajet</th>
                    <th className="px-4 py-3 font-medium">Siège</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Paiement</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedQR(b)}
                          className="p-1 bg-white rounded hover:scale-110 transition-transform"
                          title="Agrandir le QR Code"
                        >
                          <QRCodeSVG value={verifyUrl(b.qr_code)} size={40} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{b.passenger_name}</p>
                        <p className="text-xs text-muted-foreground">{b.passenger_phone || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {b.trips?.routes
                          ? `${b.trips.routes.origin} → ${b.trips.routes.destination}`
                          : <span className="text-muted-foreground italic">Non assigné</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary font-black px-2 py-1 rounded text-sm">
                          {b.seat_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {b.price_ticket?.toLocaleString('fr-FR') || '—'} F
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                          {b.payment_method || 'Espèces'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : b.status === 'used' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {b.status === 'confirmed' && <CheckCircle2 className="w-3 h-3" />}
                          {b.status === 'used' && <Clock className="w-3 h-3" />}
                          {b.status === 'confirmed' ? 'Confirmé' : b.status === 'used' ? 'Utilisé' : 'Annulé'}
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

      {/* Pop-up QR Code Agrandi */}
      {selectedQR && (
        <div
          className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedQR(null)}
        >
          <Card className="w-full max-w-xs border-border/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">{selectedQR.passenger_name}</CardTitle>
              <CardDescription>Siège N° {selectedQR.seat_number}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className="p-4 bg-white rounded-2xl shadow-inner">
                <QRCodeSVG value={verifyUrl(selectedQR.qr_code)} size={200} />
              </div>
            </CardContent>
            <CardContent className="pt-0 pb-6 text-center">
              <p className="font-mono text-sm font-bold text-muted-foreground">{selectedQR.qr_code}</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setSelectedQR(null)}>Fermer</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
