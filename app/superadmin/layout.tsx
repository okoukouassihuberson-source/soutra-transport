'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Building2, Key, TrendingUp, Shield, LogOut, ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { title: 'Vue d\'ensemble', href: '/superadmin', icon: TrendingUp },
  { title: 'Compagnies', href: '/superadmin/companies', icon: Building2 },
  { title: 'Licences', href: '/superadmin/licenses', icon: Key },
  { title: 'Sécurité', href: '/superadmin/security', icon: Shield },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Persistance de session légère (sessionStorage)
  useEffect(() => {
    const auth = sessionStorage.getItem('soutra_superadmin')
    if (auth === 'authenticated') setIsAuthenticated(true)
  }, [])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'soutra-admin-2026') {
      setIsAuthenticated(true)
      sessionStorage.setItem('soutra_superadmin', 'authenticated')
    } else {
      setError('Mot de passe incorrect.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('soutra_superadmin')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Soutra Services</h1>
            <p className="text-slate-400 mt-1 text-sm">Panneau Administrateur Éditeur</p>
          </div>
          <form onSubmit={handleAuth} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            {error && <p className="text-red-400 text-sm font-medium bg-red-400/10 p-3 rounded-lg">{error}</p>}
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">Mot de passe Opérateur</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••••••" required
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 font-bold">
              Accéder au Panneau de Contrôle
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 p-4 fixed h-full z-30">
        <div className="mb-8 p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Soutra Services</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <Icon className="w-4 h-4" />
                {item.title}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 pt-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium w-full rounded-xl hover:bg-red-400/10">
            <LogOut className="w-4 h-4" /> Verrouiller le Panneau
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)}>
          <aside className="w-72 h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <p className="font-black text-white">Super Admin</p>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                      isActive ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}>
                    <Icon className="w-4 h-4" />{item.title}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Contenu Principal */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-widest">
            {navItems.find(n => n.href === pathname)?.title || 'Panneau'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-bold">Connecté · Soutra Services</span>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
