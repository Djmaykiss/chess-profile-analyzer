import { BarChart3, BookOpen, CircleHelp, CircleUserRound, Crown, LayoutDashboard, Search, Settings, Swords, type LucideIcon } from 'lucide-react'

export type NavigationItem = { label: string; path: string; icon: LucideIcon }

export const primaryNavigation: NavigationItem[] = [
  { label: 'Resumen', path: '/', icon: LayoutDashboard },
  { label: 'Perfiles', path: '/profiles', icon: CircleUserRound },
  { label: 'Cuentas', path: '/accounts', icon: Swords },
  { label: 'Partidas', path: '/games', icon: Search },
  { label: 'Estadísticas', path: '/statistics', icon: BarChart3 },
  { label: 'Aperturas', path: '/openings', icon: Crown },
  { label: 'Dossier', path: '/dossier', icon: BookOpen },
  { label: 'Configuración', path: '/settings', icon: Settings },
]

export const helpNavigation: NavigationItem = { label: 'Ayuda', path: '/help', icon: CircleHelp }
