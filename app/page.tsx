import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Bus, Map, QrCode, ShieldCheck, BarChart3, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-500/10 via-transparent to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Navbar */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-center items-center gap-2">
          <Bus className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">Soutra Transport</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Fonctionnalités</Link>
          <Link href="#solutions" className="hover:text-primary transition-colors">Solutions</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Tarifs</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex">Connexion</Button>
          </Link>
          <Link href="/register">
            <Button className="rounded-full shadow-lg shadow-primary/20">Créer un compte</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center z-10 w-full">
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4 animate-in fade-in slide-in-from-bottom-3">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            La révolution du transport interurbain
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
            Gérez votre flotte et vos réservations <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">sans effort.</span>
          </h1>
          <p className="text-xl text-muted-foreground w-full max-w-2xl">
            La plateforme SaaS ultime pour les compagnies de transport en Côte d&apos;Ivoire.
            Billetterie par QR code, suivi GPS en temps réel et analyse de rentabilité dans un seul outil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20 group">
                Commencer l&apos;essai gratuit
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg font-semibold bg-background/50 backdrop-blur-md">
                Espace Client
              </Button>
            </Link>
          </div>
        </section>

        {/* Dashboard Preview mockup */}
        <section className="w-full max-w-6xl mx-auto px-6 pb-24">
          <div className="rounded-2xl border border-border/50 bg-background/40 backdrop-blur-xl p-2 md:p-4 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="rounded-xl border border-border/50 bg-card overflow-hidden aspect-[16/9] flex flex-col">
                <div className="h-12 border-b border-border/50 flex flex-row items-center px-4 gap-2 bg-muted/20">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex items-center justify-center bg-muted/10 p-8">
                  {/* Abstract representation of dashboard */}
                  <div className="w-full h-full border border-dashed border-border rounded-lg flex flex-col gap-4 p-6">
                    <div className="h-8 w-1/4 bg-border/40 rounded animate-pulse" />
                     <div className="flex gap-4">
                       <div className="h-24 flex-1 bg-primary/10 rounded border border-primary/20 animate-pulse" />
                       <div className="h-24 flex-1 bg-indigo-500/10 rounded border border-indigo-500/20 animate-pulse" />
                       <div className="h-24 flex-1 bg-emerald-500/10 rounded border border-emerald-500/20 animate-pulse" />
                     </div>
                     <div className="flex-1 flex gap-4 mt-4">
                       <div className="flex-1 bg-card border rounded flex flex-col justify-end p-4 gap-2">
                           <div className="h-1/2 w-8 bg-primary/40 rounded-t" />
                           <div className="h-3/4 w-8 bg-primary/60 rounded-t" />
                           <div className="h-full w-8 bg-primary rounded-t" />
                       </div>
                       <div className="w-1/3 bg-card border rounded flex flex-col p-4 gap-3">
                           <div className="h-4 w-full bg-border/40 rounded" />
                           <div className="h-4 w-5/6 bg-border/40 rounded" />
                           <div className="h-4 w-4/6 bg-border/40 rounded" />
                       </div>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted/20 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Conçu pour l&apos;excellence</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                De l&apos;édition du billet à l&apos;arrivée au terminus, chaque étape est maîtrisée.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<QrCode className="w-8 h-8 text-primary" />}
                title="Billetterie Digitale QR"
                description="Plus de tickets en papier perdus. Chaque passager reçoit un QR code unique scannable à l'embarquement pour éviter les fraudes."
              />
              <FeatureCard 
                icon={<Map className="w-8 h-8 text-indigo-400" />}
                title="Suivi GPS Flotte"
                description="Visualisez en temps réel l'avancée de vos bus. Anticipez les retards et optimisez les alertes."
              />
              <FeatureCard 
                icon={<Users className="w-8 h-8 text-emerald-400" />}
                title="Gestion des Chauffeurs"
                description="Suivez les plannings, les temps de repos et obtenez un reporting détaillé sur les performances."
              />
              <FeatureCard 
                icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
                title="Statistiques Avancées"
                description="Tableaux de bord des ventes, remplissage et marges par trajet avec export (CSV, PDF)."
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-8 h-8 text-rose-400" />}
                title="Sécurité & Licences"
                description="Un espace 100% sécurisé et isolé pour chaque entreprise avec protection contre la fraude."
              />
               <FeatureCard 
                icon={<Bus className="w-8 h-8 text-amber-400" />}
                title="Optimisation des Rotations"
                description="Algorithmes pour maximiser le taux de remplissage et gérer efficacement les correspondances."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-4">
          <Bus className="w-8 h-8 opacity-50" />
          <p>© 2026 Soutra Transport. Un produit Soutra Services.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-background/50 border-border/40 p-8 hover:bg-muted/20 transition-all duration-300 hover:-translate-y-2 group">
      <div className="mb-6 p-4 bg-muted/30 rounded-2xl inline-flex group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </Card>
  )
}
