import { LogOut } from 'lucide-react'
import { Profile } from '../services/profiles.service'
import { helpNavigation, primaryNavigation } from './app-navigation'

type Props = {
  profiles: Profile[]
  activeId: string | null
  currentPath: string
  onChooseProfile: (id: string) => void
  onNavigate: (path: string) => void
  onLogout: () => void
}

export function AppSidebar({ profiles, activeId, currentPath, onChooseProfile, onNavigate, onLogout }: Props) {
  const HelpIcon = helpNavigation.icon
  return <aside className="sidebar"><div className="brand"><span className="knight">♞</span><span>CHESS<span className="muted">/</span>PROFILE</span></div><div className="profile-switcher"><span className="eyebrow">PERFIL ACTIVO</span><select className="active-profile select-reset" value={activeId ?? ''} onChange={event => onChooseProfile(event.target.value)}><option value="" disabled>Selecciona un perfil</option>{profiles.map(profile => <option value={profile.id} key={profile.id}>{profile.display_name}</option>)}</select></div><nav>{primaryNavigation.map(({ label, path, icon: Icon }) => <button key={path} className={currentPath === path ? 'selected' : ''} onClick={() => onNavigate(path)}><Icon size={18}/>{label}</button>)}</nav><div className="sidebar-bottom"><button className={currentPath === helpNavigation.path ? 'selected' : ''} onClick={() => onNavigate(helpNavigation.path)}><HelpIcon size={18}/>{helpNavigation.label}</button><button onClick={onLogout}><LogOut size={18}/>Cerrar sesión</button></div></aside>
}
