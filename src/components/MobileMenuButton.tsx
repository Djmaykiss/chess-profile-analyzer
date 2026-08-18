import { Menu } from 'lucide-react'

export function MobileMenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button className="icon mobile-menu-button" aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} aria-expanded={open} onClick={onClick}><Menu size={22}/></button>
}
