import { useEffect, useRef } from 'react'
import { LogOut, X } from 'lucide-react'
import { Profile } from '../services/profiles.service'
import { helpNavigation, primaryNavigation } from './app-navigation'

type Props = {
  open: boolean
  profiles: Profile[]
  activeId: string | null
  currentPath: string
  onClose: () => void
  onChooseProfile: (id: string) => void
  onNavigate: (path: string) => void
  onLogout: () => void
}

export function MobileNav({ open, profiles, activeId, currentPath, onClose, onChooseProfile, onNavigate, onLogout }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    closeButton.current?.focus()
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown) }
  }, [open, onClose])
  if (!open) return null
  const HelpIcon = helpNavigation.icon
  const visit = (path: string) => { onNavigate(path); onClose() }
  const logout = () => { onClose(); onLogout() }
  return <div className="mobile-nav-layer" role="presentation"><button className="mobile-nav-scrim" aria-label="Cerrar menú" onClick={onClose}/><aside className="mobile-nav" role="dialog" aria-modal="true" aria-label="Navegación principal"><div className="mobile-nav-top"><div className="brand"><span className="knight">♞</span><span>CHESS<span className="muted">/</span>PROFILE</span></div><button ref={closeButton} className="icon" aria-label="Cerrar menú" onClick={onClose}><X size={22}/></button></div><div className="profile-switcher"><span className="eyebrow">PERFIL ACTIVO</span><select className="active-profile select-reset" value={activeId ?? ''} onChange={event => onChooseProfile(event.target.value)}><option value="" disabled>Selecciona un perfil</option>{profiles.map(profile => <option value={profile.id} key={profile.id}>{profile.display_name}</option>)}</select></div><nav>{primaryNavigation.map(({ label, path, icon: Icon }) => <button key={path} className={currentPath === path ? 'selected' : ''} onClick={() => visit(path)}><Icon size={18}/>{label}</button>)}</nav><div className="sidebar-bottom"><button className={currentPath === helpNavigation.path ? 'selected' : ''} onClick={() => visit(helpNavigation.path)}><HelpIcon size={18}/>{helpNavigation.label}</button><button onClick={logout}><LogOut size={18}/>Cerrar sesión</button></div></aside></div>
}
