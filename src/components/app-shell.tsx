'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import {
  LogOut,
  ChevronDown,
  Clock,
  LayoutDashboard,
  Users,
  UsersRound,
  CalendarDays,
  Activity,
  Briefcase,
  Calculator,
  Building2,
  UserCog,
  Beaker,
  FileText,
  Settings,
  KeySquare,
  Search,
  FileClock
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { User as UserType } from '@/lib/types';
import { logout } from '@/actions/auth-actions';
import { ThemeToggle } from './theme-toggle';
import { ChangePasswordForm } from './change-password-form';
import { Logo } from './logo';
import { PageCard } from '@/components/ui/page-card';

interface MenuItem {
  href: string;
  icon: string | React.ElementType;
  title: string;
  permission: string;
  subItems?: MenuItem[];
  group?: string;
}

const allMenuOptions: MenuItem[] = [
  { href: '/dashboard', icon: 'solar:widget-3-bold-duotone', title: 'Panel Principal', permission: '*', group: 'Principal' },

  { href: '/dashboard/sala-de-espera', icon: 'solar:clock-circle-bold-duotone', title: 'Sala de Espera', permission: 'waitlist.view', group: 'Atención Médica' },
  { href: '/dashboard/consulta', icon: 'solar:stethoscope-bold-duotone', title: 'Nueva Consulta', permission: 'consultation.perform', group: 'Atención Médica' },
  { href: '/dashboard/consultas', icon: 'solar:clipboard-list-bold-duotone', title: 'Historial de Consultas', permission: 'consultation.perform', group: 'Atención Médica' },
  { href: '/dashboard/hce', icon: 'solar:heart-pulse-bold-duotone', title: 'Historia Clínica (HCE)', permission: 'hce.view', group: 'Atención Médica' },
  { href: '/dashboard/bitacora', icon: 'solar:syringe-bold-duotone', title: 'Bitácora de Tratamiento', permission: 'treatmentlog.manage', group: 'Atención Médica' },
  { href: '/dashboard/recipe-blanco', icon: 'solar:printer-minimalistic-bold-duotone', title: 'Formatos en Blanco', permission: 'blankformats.print', group: 'Atención Médica' },

  { href: '/dashboard/buscador-pacientes', icon: Search, title: 'Buscador de Pacientes', permission: 'directory.search', group: 'Pacientes' },
  { href: '/dashboard/pacientes', icon: 'solar:shield-user-bold-duotone', title: 'Gestión de Titulares', permission: 'titulars.manage', group: 'Pacientes' },
  { href: '/dashboard/beneficiarios', icon: 'solar:users-group-two-rounded-bold-duotone', title: 'Gestión de Beneficiarios', permission: 'beneficiaries.manage', group: 'Pacientes' },
  { href: '/dashboard/personas', icon: 'solar:user-bold-duotone', title: 'Directorio de Personas', permission: 'people.manage', group: 'Pacientes' },
  { href: '/dashboard/historial-medico', icon: FileClock, title: 'Archivo Médico', permission: 'medicalhistory.view', group: 'Pacientes' },

  { href: '/dashboard/salud-ocupacional', icon: 'solar:mask-h-bold-duotone', title: 'Medicina Ocupacional', permission: 'superuser.only', group: 'Salud Ocupacional' },
  { href: '/dashboard/reintegros', icon: 'solar:document-medicine-bold-duotone', title: 'Evaluaciones (Reintegro)', permission: 'consultation.perform', group: 'Salud Ocupacional' },

  { href: '/dashboard/reportes', icon: 'solar:chart-2-bold-duotone', title: 'Estadísticas Generales', permission: 'reports.view', group: 'Reportes y Analítica' },
  { href: '/dashboard/reporte-pacientes', icon: 'solar:clipboard-check-bold-duotone', title: 'Reporte Detallado', permission: 'reports.view', group: 'Reportes y Analítica' },

  { href: '/dashboard/cie10', icon: 'solar:notebook-bold-duotone', title: 'Catálogo CIE-10', permission: 'cie10.manage', group: 'Configuración' },
  { href: '/dashboard/servicios', icon: 'solar:server-square-bold-duotone', title: 'Servicios Médicos', permission: 'settings.manage', group: 'Configuración' },
  { href: '/dashboard/especialidades', icon: 'solar:diploma-bold-duotone', title: 'Especialidades', permission: 'specialties.manage', group: 'Configuración' },
  { href: '/dashboard/doctores', icon: 'solar:users-group-rounded-bold-duotone', title: 'Médicos y Especialistas', permission: 'specialties.manage', group: 'Configuración' },
  { href: '/dashboard/empresas', icon: 'solar:city-bold-duotone', title: 'Empresas Afiliadas', permission: 'companies.manage', group: 'Configuración' },
  { href: '/dashboard/puestos', icon: 'solar:case-minimalistic-bold-duotone', title: 'Puestos de Trabajo', permission: 'jobpositions.manage', group: 'Configuración' },

  { href: '/dashboard/usuarios', icon: 'solar:user-rounded-bold-duotone', title: 'Gestión de Usuarios', permission: 'users.manage', group: 'Sistema' },
  { href: '/dashboard/seguridad/roles', icon: 'solar:key-minimalistic-bold-duotone', title: 'Permisos y Roles', permission: 'roles.manage', group: 'Sistema' },
  { href: '/dashboard/db-explorer', icon: 'solar:database-bold-duotone', title: 'Mantenimiento DB', permission: 'database.view', group: 'Sistema' },
  { href: '/dashboard/apariencia', icon: 'solar:palette-bold-duotone', title: 'Personalización', permission: 'settings.manage', group: 'Sistema' },
  { href: '/dashboard/informacion', icon: 'solar:info-circle-bold-duotone', title: 'Acerca del Sistema', permission: '*', group: 'Sistema' },
];

const menuGroups = ['Principal', 'Atención Médica', 'Pacientes', 'Salud Ocupacional', 'Reportes y Analítica', 'Configuración', 'Sistema'];

// Helper to get theme colors based on group for Dark Mode "Neon" look
const getGroupTheme = (group: string | undefined) => {
  switch (group) {
    case 'Principal': return {
      gradient: 'from-blue-400 via-blue-600 to-indigo-700',
      darkActiveBg: 'dark:data-[active=true]:bg-blue-500/10 dark:data-[active=true]:border-blue-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      darkHoverBg: 'dark:hover:bg-blue-500/5',
      darkText: 'dark:text-blue-300 dark:font-black',
      darkIcon: 'text-blue-100 dark:text-neon-blue drop-shadow-blue',
      darkIconBg: 'dark:bg-blue-500/20'
    };
    case 'Atención Médica': return {
      gradient: 'from-cyan-400 via-cyan-600 to-blue-700',
      darkActiveBg: 'dark:data-[active=true]:bg-cyan-500/10 dark:data-[active=true]:border-cyan-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      darkHoverBg: 'dark:hover:bg-cyan-500/5',
      darkText: 'dark:text-cyan-300 dark:font-black',
      darkIcon: 'text-cyan-100 dark:text-cyan-400 drop-shadow-glow',
      darkIconBg: 'dark:bg-cyan-500/20'
    };
    case 'Pacientes': return {
      gradient: 'from-emerald-400 via-emerald-600 to-teal-800',
      darkActiveBg: 'dark:data-[active=true]:bg-emerald-500/10 dark:data-[active=true]:border-emerald-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      darkHoverBg: 'dark:hover:bg-emerald-500/5',
      darkText: 'dark:text-emerald-300 dark:font-black',
      darkIcon: 'text-emerald-100 dark:text-neon-emerald drop-shadow-emerald',
      darkIconBg: 'dark:bg-emerald-500/20'
    };
    case 'Salud Ocupacional': return {
      gradient: 'from-amber-400 via-orange-500 to-red-600',
      darkActiveBg: 'dark:data-[active=true]:bg-amber-500/10 dark:data-[active=true]:border-amber-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      darkHoverBg: 'dark:hover:bg-amber-500/5',
      darkText: 'dark:text-amber-300 dark:font-black',
      darkIcon: 'text-amber-100 dark:text-amber-400 drop-shadow-glow',
      darkIconBg: 'dark:bg-amber-500/20'
    };
    case 'Configuración': return {
      gradient: 'from-violet-400 via-purple-600 to-indigo-800',
      darkActiveBg: 'dark:data-[active=true]:bg-purple-500/10 dark:data-[active=true]:border-purple-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      darkHoverBg: 'dark:hover:bg-purple-500/5',
      darkText: 'dark:text-purple-300 dark:font-black',
      darkIcon: 'text-purple-100 dark:text-neon-purple drop-shadow-purple',
      darkIconBg: 'dark:bg-purple-500/20'
    };
    case 'Reportes y Analítica': return {
      gradient: 'from-fuchsia-400 via-pink-600 to-rose-800',
      darkActiveBg: 'dark:data-[active=true]:bg-pink-500/10 dark:data-[active=true]:border-pink-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(236,72,153,0.15)]',
      darkHoverBg: 'dark:hover:bg-pink-500/5',
      darkText: 'dark:text-pink-300 dark:font-black',
      darkIcon: 'text-pink-100 dark:text-neon-rose drop-shadow-rose',
      darkIconBg: 'dark:bg-pink-500/20'
    };
    case 'Sistema': return {
      gradient: 'from-rose-400 via-red-600 to-orange-800',
      darkActiveBg: 'dark:data-[active=true]:bg-red-500/10 dark:data-[active=true]:border-red-400/30 dark:data-[active=true]:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      darkHoverBg: 'dark:hover:bg-red-500/5',
      darkText: 'dark:text-red-300 dark:font-black',
      darkIcon: 'text-red-100 dark:text-neon-rose drop-shadow-rose',
      darkIconBg: 'dark:bg-red-500/20'
    };
    default: return {
      gradient: 'from-slate-400 to-slate-700',
      darkActiveBg: 'dark:data-[active=true]:bg-slate-500/10 dark:data-[active=true]:border-slate-400/30',
      darkHoverBg: 'dark:hover:bg-slate-500/5',
      darkText: 'dark:text-slate-300 dark:font-black',
      darkIcon: 'dark:text-slate-200',
      darkIconBg: 'dark:bg-slate-500/20'
    };
  }
};

interface UserContextValue extends UserType {
  permissions: string[];
  name: string;
}
const UserContext = React.createContext<UserContextValue | null>(null);

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un AppShell');
  }
  return context;
}

export function AppShell({ children, user, permissions }: { children: React.ReactNode, user: UserType, permissions: string[] }) {
  const pathname = usePathname();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  if (!user.name) {
    user.name = user.username;
  }
  const userWithPermissions = { ...user, permissions } as UserContextValue;

  const hasPermission = (permission: string) => {
    if (permission === '*') return true;
    if (user.role.name === 'Superusuario') return true;
    return permissions.includes(permission);
  };

  const visibleMenuOptions = allMenuOptions.filter(opt => hasPermission(opt.permission));

  const groupedMenu = menuGroups.map(group => ({
    name: group,
    items: visibleMenuOptions.filter(item => item.group === group),
  })).filter(group => group.items.length > 0);

  const isDashboardHome = pathname === '/dashboard';

  return (
    <UserContext.Provider value={userWithPermissions}>
      <SidebarProvider>
        <Sidebar collapsible="icon" className="border-none bg-transparent ml-4 my-4 h-[calc(100vh-2rem)] rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/20 dark:shadow-none dark:bg-slate-950/20 dark:backdrop-blur-2xl dark:border dark:border-white/5 dark:mesh-gradient data-[state=expanded]:w-72 data-[state=collapsed]:w-[90px] transition-all duration-500 ease-in-out z-20">
          <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
            <Link href="/dashboard" className="flex items-center justify-center py-6">
              <Logo className="h-auto w-36 flex-shrink-0 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:overflow-hidden transition-all dark:text-foreground drop-shadow-glow" />
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenu>
              {groupedMenu.map((group) => (
                <Collapsible key={group.name} defaultOpen className="group/collapsible">
                  <SidebarGroup>
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground/80 dark:text-muted-foreground dark:hover:text-muted-foreground/60 transition-colors mb-1">
                        {group.name}
                        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarMenu>
                        {group.items.map(option => {
                          const isActive = pathname.startsWith(option.href);
                          const theme = getGroupTheme(option.group);

                          return (
                            <SidebarMenuItem key={option.href} className="mb-1">
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={option.title}
                                className={cn(
                                  "h-auto py-2 hover:bg-muted/50 dark:hover:bg-muted/30 data-[active=true]:bg-muted dark:data-[active=true]:border-primary/20 rounded-xl transition-all duration-200 border border-transparent",
                                  theme.darkActiveBg,
                                  theme.darkHoverBg
                                )}
                              >
                                <Link href={option.href} prefetch={true} className="flex items-center gap-3 w-full">
                                  <div className={`
                                    flex items-center justify-center p-2 rounded-xl shadow-sm transition-all duration-300
                                    bg-gradient-to-br ${theme.gradient}
                                    dark:bg-none ${theme.darkIconBg}
                                    ${isActive ? 'scale-110 shadow-md ring-2 ring-white/50 dark:ring-0' : 'opacity-90 grayscale-[0.3] hover:grayscale-0 hover:scale-105 dark:grayscale-0 dark:opacity-100'}
                                  `}>
                                    {typeof option.icon === 'string' ? (
                                      <Icon icon={option.icon as string} className={`h-5 w-5 ${theme.darkIcon}`} />
                                    ) : (
                                      <option.icon className={`h-5 w-5 ${theme.darkIcon}`} />
                                    )}
                                  </div>
                                  <span className={cn(
                                    "font-medium text-sm transition-colors",
                                    isActive ? `text-foreground font-bold ${theme.darkText}` : "text-foreground/80 group-hover:text-foreground dark:text-muted-foreground/80 dark:group-hover:text-slate-200"
                                  )}>{option.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm transition-all duration-300 ease-in-out">
          <header className="relative z-10 flex h-14 items-center gap-4 bg-transparent px-4 sm:px-6 pt-4">
            <SidebarTrigger />
            <div className="flex-1">
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="flex h-full w-full items-center justify-center bg-muted">
                        <Icon icon="solar:user-bold-duotone" className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.username} ({user.role.name})
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsChangePasswordOpen(true)}>
                    <Icon icon="solar:key-minimalistic-bold-duotone" className="mr-2 h-4 w-4" />
                    <span>Cambiar Contraseña</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={logout}>
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full text-left">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {isDashboardHome ? (
            children
          ) : (
            <div className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
              <PageCard className="h-full min-h-[calc(100vh-8rem)]">
                {children}
              </PageCard>
            </div>
          )}
        </main>
      </SidebarProvider >

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Para proteger su cuenta, introduzca su contraseña actual y luego la nueva.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onFinished={() => setIsChangePasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </UserContext.Provider >
  );
}
