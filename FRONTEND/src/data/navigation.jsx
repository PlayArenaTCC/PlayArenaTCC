import {
  Building2,
  CalendarDays,
  FileText,
  Home,
  LifeBuoy,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  Shield,
  User,
  UserPlus,
  Users,
} from 'lucide-react'

export const userNav = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'buscar', label: 'Buscar', icon: Search },
  { id: 'minhas-reservas', label: 'Minhas Reservas', icon: CalendarDays },
  { id: 'mapa', label: 'Mapa', icon: MapPin },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
]

export const ownerNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'espacos', label: 'Meus Espaços', icon: Building2 },
  { id: 'reservas', label: 'Reservas', icon: CalendarDays },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
  { id: 'perfil', label: 'Perfil', icon: User },
]

export const adminNav = [
  { id: 'dashboard', label: 'Painel Admin', icon: Shield },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'espacos', label: 'Espaços', icon: Building2 },
  { id: 'reservas', label: 'Reservas', icon: CalendarDays },
  { id: 'administradores', label: 'Administradores', icon: UserPlus },
  { id: 'usuarios', label: 'Usuários', icon: Users },
]
