'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, FileText, UploadCloud, Building2, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [licenseKey, setLicenseKey] = useState('...')
  const [licensePlan, setLicensePlan] = useState('PREMIUM')

  const [form, setForm] = useState({
    name: '',
    address: '',
    rccm: '',
    ncc: '',
    email: '',
    phone: '',
    logo_url: ''
  })

  // Charger les informations de l'entreprise depuis Supabase
  useEffect(() => {
    async function loadCompanyProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) throw new Error("Non authentifié")

        const { data: profile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', authData.user.id)
          .single()

        if (!profile?.company_id) throw new Error("Aucune entreprise rattachée")
        setCompanyId(profile.company_id)

        // Charger les données de la compagnie
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (error) throw error

        setForm({
          name: company.name || '',
          address: company.address || '',
          rccm: company.rccm || '',
          ncc: company.ncc || '',
          email: company.email || '',
          phone: company.phone || '',
          logo_url: company.logo_url || ''
        })

        // Charger la licence
        const { data: license } = await supabase
          .from('licenses')
          .select('key, plan')
          .eq('company_id', profile.company_id)
          .single()

        if (license) {
          setLicenseKey(license.key)
          setLicensePlan(license.plan?.toUpperCase() || 'PREMIUM')
        }

      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanyProfile()
  }, [])

  // Upload du Logo vers Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

    setIsUploadingLogo(true)
    setErrorMsg('')

    try {
      const ext = file.name.split('.').pop()
      const filePath = `logos/${companyId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, logo_url: publicUrlData.publicUrl }))
    } catch (err: any) {
      setErrorMsg("Erreur upload logo : " + err.message)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setIsSaving(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: form.name,
          address: form.address,
          rccm: form.rccm,
          ncc: form.ncc,
          email: form.email,
          phone: form.phone,
          logo_url: form.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId)

      if (error) throw error

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err: any) {
      setErrorMsg("Erreur sauvegarde : " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil & Informations Légales</h1>
        <p className="text-muted-foreground mt-1">
          Ces informations apparaissent sur l&apos;entête de tous vos billets et rapports officiels.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <Card className="border-border/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Dossier Officiel de l&apos;Entreprise
            </CardTitle>
            <CardDescription>Informations légales obligatoires — enregistrées dans Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Section Logo */}
            <div className="flex items-center gap-6 p-5 border border-border/50 rounded-xl bg-muted/10">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden bg-background shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold mb-1">Logo de la Compagnie <span className="text-red-500">*</span></p>
                <p className="text-sm text-muted-foreground mb-3">Format PNG ou JPG — Utilisé sur les billets et rapports.</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo
                    ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Upload...</>
                    : <><UploadCloud className="w-3.5 h-3.5 mr-2" /> {form.logo_url ? 'Changer le Logo' : 'Importer le Logo'}</>
                  }
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  Raison Sociale <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required className="h-12 font-bold"
                  placeholder="Ex: UTB Transports SARL"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  Siège Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  required className="h-12"
                  placeholder="Ex: Abidjan, Adjamé Liberté"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  N° RCCM <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.rccm}
                  onChange={e => setForm({ ...form, rccm: e.target.value.toUpperCase() })}
                  required className="h-12 uppercase tracking-wider font-mono text-sm"
                  placeholder="CI-ABJ-2023-B-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  N° Compte Contribuable (NCC) <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.ncc}
                  onChange={e => setForm({ ...form, ncc: e.target.value.toUpperCase() })}
                  required className="h-12 uppercase tracking-wider font-mono text-sm"
                  placeholder="00012345Z"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  Email Officiel <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required className="h-12"
                  placeholder="contact@compagnie.ci"
                />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required className="h-12"
                  placeholder="+225 01 02 03 04 05"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 p-6 flex justify-end">
            <Button type="submit" className="h-12 px-8 font-bold text-md min-w-48" disabled={isSaving}>
              {isSaving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                : isSaved
                  ? <><CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" /> Profil Sauvegardé</>
                  : "Mettre à Jour le Profil"
              }
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Bloc Licence (Lecture Seule) */}
      <Card className="border-border/50 bg-background overflow-hidden">
        <div className="p-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" /> Contrat de Licence SaaS
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Votre accès au logiciel d&apos;exploitation Soutra.</p>
          <div className="mt-4 flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Clé Active</p>
              <p className="text-xl font-mono tracking-widest font-black mt-1">{licenseKey}</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 font-bold px-3 py-1.5 rounded text-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {licensePlan}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
