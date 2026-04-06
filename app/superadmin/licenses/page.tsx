'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Key, Plus, Copy, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'

const PLANS = [
  { id: 'starter', label: 'Starter', price: '25 000 F / mois', color: 'border-slate-600', features: ['1 guichetier', '3 cars max', 'Support email'] },
  { id: 'premium', label: 'Premium', price: '65 000 F / mois', color: 'border-primary', features: ['5 guichetiers + mobile', '15 cars', 'WhatsApp QR inclus', 'Support prioritaire'] },
  { id: 'enterprise', label: 'Enterprise', price: '150 000 F / mois', color: 'border-violet-500', features: ['Agents illimités', 'Flotte illimitée', 'API dédiée', 'Onboarding inclus'] },
]

const DURATIONS = [
  { days: 30, label: '1 mois' },
  { days: 90, label: '3 mois' },
  { days: 180, label: '6 mois' },
  { days: 365, label: '1 an' },
]

// Mock de licences existantes (à remplacer par un appel Supabase)
const MOCK_LICENSES = [
  { key: 'SOU-DEMO-2026', plan: 'PREMIUM', status: 'ACTIVE', company: 'UTB Transports', expires: '2027-01-15' },
  { key: 'SOU-A1B2-C3D4', plan: 'STARTER', status: 'ACTIVE', company: 'Ligne Verte CI', expires: '2026-08-20' },
  { key: 'SOU-XXXX-YYYY', plan: 'ENTERPRISE', status: 'SUSPENDED', company: 'STIF Bouaké', expires: '2026-11-10' },
]

export default function LicensesPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [selectedDuration, setSelectedDuration] = useState(365)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateKey = async () => {
    setIsGenerating(true)
    setNewKey(null)
    await new Promise(r => setTimeout(r, 1000))
    const seg = () => Math.random().toString(16).substring(2, 6).toUpperCase()
    setNewKey(`SOU-${seg()}-${seg()}-${seg()}`)
    setIsGenerating(false)
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white">Gestion des Licences</h1>
        <p className="text-slate-400 mt-1">Générez et contrôlez les accès à votre logiciel SaaS</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Générateur */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Nouvelle Licence</h2>
              <p className="text-slate-500 text-sm">Créez une clé d'activation pour un nouveau transporteur.</p>
            </div>

            {/* Choix du Plan */}
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Plan Tarifaire</p>
              {PLANS.map(plan => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPlan === plan.id ? plan.color + ' bg-slate-800' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-white font-bold">{plan.label}</span>
                    <span className="text-primary text-xs font-bold">{plan.price}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {plan.features.map(f => <li key={f} className="text-slate-400 text-xs flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />{f}</li>)}
                  </ul>
                </button>
              ))}
            </div>

            {/* Durée */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Durée d&apos;Accès</p>
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map(d => (
                  <button key={d.days} onClick={() => setSelectedDuration(d.days)}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedDuration === d.days ? 'border-primary bg-primary/10 text-primary' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={generateKey} disabled={isGenerating} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</> : <><Plus className="w-4 h-4 mr-2" /> Générer la Clé SOU-</>}
            </Button>

            {newKey && (
              <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4 animate-in fade-in zoom-in duration-300">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Clé prête
                </p>
                <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-2 border border-slate-800">
                  <code className="font-mono font-black text-white flex-1 text-sm tracking-widest">{newKey}</code>
                  <button onClick={() => copyKey(newKey)} className="text-slate-400 hover:text-emerald-400 transition-colors p-1">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-slate-400">
                  <span>Plan : <strong className="capitalize text-white">{selectedPlan}</strong></span>
                  <span>Durée : <strong className="text-white">{DURATIONS.find(d => d.days === selectedDuration)?.label}</strong></span>
                </div>
                <p className="text-amber-400 text-xs mt-2 font-medium">⚠️ Copiez cette clé maintenant, elle ne sera plus affichée.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tableau des Licences Existantes */}
        <div className="xl:col-span-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-white font-bold text-lg">Licences Actives</h2>
              <p className="text-slate-500 text-sm mt-1">Toutes les clés distribuées à vos clients.</p>
            </div>
            <div className="divide-y divide-slate-800">
              {MOCK_LICENSES.map(lic => (
                <div key={lic.key} className="p-5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <code className="font-mono font-black text-white text-sm tracking-widest">{lic.key}</code>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lic.plan === 'ENTERPRISE' ? 'bg-violet-400/10 text-violet-400' :
                          lic.plan === 'PREMIUM' ? 'bg-amber-400/10 text-amber-400' :
                          'bg-slate-400/10 text-slate-400'
                        }`}>{lic.plan}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lic.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                        }`}>{lic.status}</span>
                      </div>
                      <p className="text-slate-400 text-sm">{lic.company}</p>
                      <p className="text-slate-600 text-xs mt-1">Expire le {new Date(lic.expires).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => copyKey(lic.key)} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-400/10">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {lic.status === 'ACTIVE' && (
                        <button className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
