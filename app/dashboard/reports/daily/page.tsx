'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Building, Printer, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DailyReportPDF() {
  const date = new(Date)().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Lance automatiquement la modale d'impression au chargement si possible
  useEffect(() => {
     // Optionnel: window.print()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center print:p-0 print:bg-white text-slate-900">
       
       <div className="w-full max-w-4xl flex justify-between mb-6 print:hidden">
         <Link href="/dashboard/cash">
            <Button variant="outline"><ChevronLeft className="w-4 h-4 mr-2" /> Retour à la Caisse</Button>
         </Link>
         <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700">
            <Printer className="w-4 h-4 mr-2" /> Sauvegarder en PDF
         </Button>
       </div>

       {/* Cadre A4 (Optimisé Imprimante/PDF) */}
       <div className="w-full max-w-4xl bg-white shadow-2xl print:shadow-none p-12 rounded-xl print:rounded-none">
          
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
             <div>
                <p className="text-sm font-bold tracking-widest text-slate-500 uppercase">Rapport Quotidien d'Activité</p>
                <h1 className="text-4xl font-black text-slate-900 mt-2">Bilan Journalier</h1>
                <p className="text-lg mt-2 text-slate-600 capitalize">{date}</p>
             </div>
             <div className="text-right flex flex-col items-end">
                <div className="p-3 bg-slate-900 text-white rounded-lg inline-flex mb-3">
                   <Building className="w-8 h-8" />
                </div>
                <h2 className="font-bold text-xl">Soutra Transport (Compagnie)</h2>
                <p className="text-sm text-slate-500">Gare d'Adjamé - Abidjan</p>
                <p className="text-sm text-slate-500 font-mono mt-1">RCCM: CI-ABJ-2026-B-XXXX</p>
             </div>
          </div>

          {/* Somme Globale */}
          <div className="grid grid-cols-2 gap-8 mb-10">
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <p className="text-sm tracking-widest uppercase font-bold text-slate-500 mb-1">Recettes Globales</p>
                <p className="text-4xl font-black text-slate-900">2 070 000 FCFA</p>
                <p className="text-sm font-medium text-emerald-600 mt-2">+14% vs Hier</p>
             </div>
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500">Total Espèces</p>
                  <p className="text-xl font-bold text-slate-800">1 450 000 F</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-blue-500">Mobile Money</p>
                  <p className="text-xl font-bold text-blue-600">620 000 F</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                  <p className="text-xs uppercase font-bold text-red-500">Écarts de Caisse Repérés</p>
                  <p className="text-lg font-bold text-red-600">- 15 000 F</p>
                </div>
             </div>
          </div>

          <div className="mb-10">
             <h3 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4">Répartition par Modes de Paiement</h3>
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 font-medium">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Espèces</span>
                <span className="font-bold">1 450 000 F</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-100 p-4 font-medium">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Wave</span>
                <span className="font-bold">450 000 F</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-100 p-4 font-medium">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Orange Money</span>
                <span className="font-bold">120 000 F</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-100 p-4 font-medium">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> MTN MoMo</span>
                <span className="font-bold">50 000 F</span>
             </div>
          </div>

          <div className="mb-10 page-break-inside-avoid">
             <h3 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4">Détail par Car & Chauffeur</h3>
             <table className="w-full text-left text-sm">
                <thead>
                   <tr className="bg-slate-100 text-slate-500 uppercase">
                      <th className="p-3 font-bold">Immatriculation</th>
                      <th className="p-3 font-bold">Chauffeur</th>
                      <th className="p-3 font-bold">Convoyeur</th>
                      <th className="p-3 font-bold">Passagers</th>
                      <th className="p-3 font-bold">Recette</th>
                      <th className="p-3 font-bold">Écart</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                   <tr>
                      <td className="p-3 font-bold text-slate-900">1245 AB 01</td>
                      <td className="p-3">Yao François</td>
                      <td className="p-3">Amadou K.</td>
                      <td className="p-3">48 / 50</td>
                      <td className="p-3">960 000 F</td>
                      <td className="p-3 text-red-500 font-bold">-15 000 F</td>
                   </tr>
                   <tr>
                      <td className="p-3 font-bold text-slate-900">8890 CD 01</td>
                      <td className="p-3">Traoré Drissa</td>
                      <td className="p-3">Kouamé S.</td>
                      <td className="p-3">45 / 50</td>
                      <td className="p-3">900 000 F</td>
                      <td className="p-3 text-emerald-500">Parfait</td>
                   </tr>
                   <tr>
                      <td className="p-3 font-bold text-slate-900">Guichet Sédentaire</td>
                      <td className="p-3 text-slate-400">N/A</td>
                      <td className="p-3">Siriki B.</td>
                      <td className="p-3">N/A</td>
                      <td className="p-3">530 000 F</td>
                      <td className="p-3 text-emerald-500">Parfait</td>
                   </tr>
                </tbody>
             </table>
          </div>

          <div className="mt-16 pt-8 border-t-2 border-slate-200 grid grid-cols-2 text-center">
             <div>
                <p className="font-bold text-slate-500">Signature du Chef de Gare</p>
                <div className="h-24"></div>
             </div>
             <div>
                <p className="font-bold text-slate-500">Validation Comptable</p>
                <div className="h-24"></div>
             </div>
          </div>
       </div>
    </div>
  )
}
