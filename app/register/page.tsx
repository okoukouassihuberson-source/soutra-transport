'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Bus, Key, Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    
    const formData = new FormData(e.currentTarget)
    const payload = {
       companyName: formData.get('companyName'),
       email: formData.get('email'),
       password: formData.get('password'),
       licenseKey: formData.get('licenseKey'),
    }

    try {
       // On appelle l'API d'inscription qui demande des privilèges Service Role
       const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
       })
       const data = await res.json()

       if (!res.ok) {
          setErrorMsg(data.error || "Une erreur est survenue lors de l'activation")
          setIsLoading(false)
          return
       }

       // Si l'API backend réussit la création globale, on se connecte directement sur le client Supabase
       const { error: loginError } = await supabase.auth.signInWithPassword({
          email: payload.email as string,
          password: payload.password as string,
       })

       if (loginError) throw loginError;

       setSuccess(true)
       setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
       }, 2000)

    } catch (err: any) {
       setErrorMsg("L'activation a échoué. Veuillez vérifier vos informations.")
       setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Bus className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Soutra Transport</span>
          </Link>
        </div>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
            <CardDescription className="text-sm">
              Saisissez la clé de licence fournie par l&apos;équipe technique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                 <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}
            {success ? (
               <div className="flex flex-col items-center justify-center py-8 text-emerald-500">
                  <CheckCircle2 className="w-16 h-16 mb-4 animate-bounce" />
                  <p className="font-bold text-xl text-center">Compte actif !</p>
                  <p className="text-sm mt-2 text-center text-muted-foreground">Redirection vers le Dashboard...</p>
               </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de la compagnie</Label>
                    <Input id="companyName" name="companyName" placeholder="Ex: UTB Transports" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email administrateur</Label>
                    <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="admin@compagnie.ci" required className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2 pt-2">
                    <Label htmlFor="licenseKey" className="text-primary font-semibold">Clé de Licence Officielle</Label>
                    <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-primary" />
                    <Input 
                        id="licenseKey" 
                        name="licenseKey"
                        placeholder="SOU-XXXX-XXXX-XXXX" 
                        required 
                        className="pl-10 uppercase font-mono tracking-widest border-primary/50 focus-visible:ring-primary" 
                    />
                    </div>
                </div>
                
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activation en cours...
                    </>
                    ) : (
                    "Valider et Activer"
                    )}
                </Button>
                </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6 pb-6">
            <p className="text-sm text-muted-foreground">
              Déjà une entreprise cliente ?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
