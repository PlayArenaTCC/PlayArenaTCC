import {
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  MapPin,
  Search,
  Shield,
  User,
  Users,
} from 'lucide-react'

export const userNav = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'buscar', label: 'Buscar', icon: Search },
  { id: 'minhas-reservas', label: 'Minhas Reservas', icon: CalendarDays },
  { id: 'mapa', label: 'Mapa', icon: MapPin },
]

export const ownerNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'espacos', label: 'Meus Espacos', icon: Building2 },
  { id: 'reservas', label: 'Reservas', icon: CalendarDays },
  { id: 'perfil', label: 'Perfil', icon: User },
]

export const adminNav = [
  { id: 'dashboard', label: 'Painel Admin', icon: Shield },
  { id: 'espacos', label: 'Espacos', icon: Building2 },
  { id: 'reservas', label: 'Reservas', icon: CalendarDays },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
]
