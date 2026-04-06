'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Bus, LayoutDashboard, LogOut, Map, Settings, Ticket, Users, Wallet, Receipt, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const sidebarNavItems = [
  { title: "Vue Globale", href: "/dashboard", icon: LayoutDashboard },
  { title: "Point de Vente", href: "/dashboard/pos", icon: Ticket },
  { title: "Abonnés Mensuels", href: "/dashboard/subscribers", icon: Star },
  { title: "Flotte & GPS", href: "/dashboard/fleet", icon: Map },
  { title: "Chauffeurs & Convoyeurs", href: "/dashboard/drivers", icon: Users },
  { title: "Clôtures de Caisse", href: "/dashboard/cash", icon: Wallet },
  { title: "Réservations", href: "/dashboard/reservations", icon: Receipt },
  { title: "Paramètres", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bus className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">UTB Transports</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {sidebarNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
               <Link key={item.href} href={item.href}>
                 <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                 }`}>
                   <Icon className="w-5 h-5" />
                   <span className="font-medium text-sm">{item.title}</span>
                 </div>
               </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border/40">
          <Link href="/">
             <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
               <LogOut className="mr-2 w-5 h-5" />
               Déconnexion
             </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-border/40 bg-card/50 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center md:hidden">
            <Bus className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center gap-4 ml-auto">
             <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             </Button>
             <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
               A
             </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
