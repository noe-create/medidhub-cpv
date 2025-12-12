

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import {
  LayoutDashboard,
  LogOut,
  Users,
  User,
  Building,
  Clock,
  HeartPulse,
  ClipboardCheck,
  BookText,
  AreaChart,
  UserCog,
  KeyRound,
  MessageSquareQuote,
  DollarSign,
  ShieldCheck,
  UsersRound,
  Stethoscope,
  Calendar,
  Building2,
  Briefcase,
  BookHeart,
  Syringe,
  GraduationCap,
  Database,
  Palette,
  CalendarDays
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { User as UserType } from '@/lib/types';
import { logout } from '@/actions/auth-actions';
import { ThemeToggle } from './theme-toggle';
import { ChangePasswordForm } from './change-password-form';
import { Logo } from './logo';

interface MenuItem {
  href: string;
  icon: React.ReactNode;
  title: string;
  permission: string;
  subItems?: MenuItem[];
  group?: string;
}

const allMenuOptions: MenuItem[] = [
  { href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 text-sky-600 fill-sky-100 dark:text-sky-400 dark:fill-sky-900" />, title: 'Panel', permission: '*', group: 'Inicio' },

  { href: '/dashboard/sala-de-espera', icon: <Clock className="h-5 w-5 text-indigo-600 fill-indigo-100 dark:text-indigo-400 dark:fill-indigo-900" />, title: 'Sala de espera', permission: 'waitlist.view', group: 'Atención' },
  { href: '/dashboard/consulta', icon: <Stethoscope className="h-5 w-5 text-blue-600 fill-blue-100 dark:text-blue-400 dark:fill-blue-900" />, title: 'Consulta', permission: 'consultation.perform', group: 'Atención' },
  { href: '/dashboard/hce', icon: <HeartPulse className="h-5 w-5 text-rose-600 fill-rose-100 dark:text-rose-400 dark:fill-rose-900" />, title: 'Historia Clínica', permission: 'hce.view', group: 'Atención' },
  { href: '/dashboard/bitacora', icon: <Syringe className="h-5 w-5 text-cyan-600 fill-cyan-100 dark:text-cyan-400 dark:fill-cyan-900" />, title: 'Bitácora Tratamiento', permission: 'treatmentlog.manage', group: 'Atención' },

  { href: '/dashboard/personas', icon: <User className="h-5 w-5 text-emerald-600 fill-emerald-100 dark:text-emerald-400 dark:fill-emerald-900" />, title: 'Personas', permission: 'people.manage', group: 'Admisión' },
  { href: '/dashboard/lista-pacientes', icon: <Users className="h-5 w-5 text-teal-600 fill-teal-100 dark:text-teal-400 dark:fill-teal-900" />, title: 'Lista de Pacientes', permission: 'patientlist.view', group: 'Admisión' },
  { href: '/dashboard/pacientes', icon: <ShieldCheck className="h-5 w-5 text-violet-600 fill-violet-100 dark:text-violet-400 dark:fill-violet-900" />, title: 'Titulares', permission: 'titulars.manage', group: 'Admisión' },
  { href: '/dashboard/beneficiarios', icon: <UsersRound className="h-5 w-5 text-pink-600 fill-pink-100 dark:text-pink-400 dark:fill-pink-900" />, title: 'Beneficiarios', permission: 'beneficiaries.manage', group: 'Admisión' },

  { href: '/dashboard/empresas', icon: <Building2 className="h-5 w-5 text-slate-600 fill-slate-100 dark:text-slate-400 dark:fill-slate-900" />, title: 'Empresas', permission: 'companies.manage', group: 'Parametrización' },
  { href: '/dashboard/cie10', icon: <BookText className="h-5 w-5 text-orange-600 fill-orange-100 dark:text-orange-400 dark:fill-orange-900" />, title: 'Catálogo CIE-10', permission: 'cie10.manage', group: 'Parametrización' },
  { href: '/dashboard/doctores', icon: <GraduationCap className="h-5 w-5 text-blue-600 fill-blue-100 dark:text-blue-400 dark:fill-blue-900" />, title: 'Doctores', permission: 'specialties.manage', group: 'Parametrización' },
  { href: '/dashboard/apariencia', icon: <Palette className="h-5 w-5 text-fuchsia-600 fill-fuchsia-100 dark:text-fuchsia-400 dark:fill-fuchsia-900" />, title: 'Apariencia', permission: 'settings.manage', group: 'Parametrización' },


  { href: '/dashboard/reportes', icon: <AreaChart className="h-5 w-5 text-purple-600 fill-purple-100 dark:text-purple-400 dark:fill-purple-900" />, title: 'Reportes', permission: 'reports.view', group: 'Analítica' },
  { href: '/dashboard/reporte-pacientes', icon: <ClipboardCheck className="h-5 w-5 text-violet-600 fill-violet-100 dark:text-violet-400 dark:fill-violet-900" />, title: 'Reporte de Pacientes', permission: 'reports.view', group: 'Analítica' },

  { href: '/dashboard/usuarios', icon: <UserCog className="h-5 w-5 text-red-600 fill-red-100 dark:text-red-400 dark:fill-red-900" />, title: 'Usuarios', permission: 'users.manage', group: 'Seguridad' },
  { href: '/dashboard/seguridad/roles', icon: <KeyRound className="h-5 w-5 text-amber-600 fill-amber-100 dark:text-amber-400 dark:fill-amber-900" />, title: 'Roles', permission: 'roles.manage', group: 'Seguridad' },
  { href: '/dashboard/db-explorer', icon: <Database className="h-5 w-5 text-slate-600 fill-slate-100 dark:text-slate-400 dark:fill-slate-900" />, title: 'Explorador DB', permission: 'database.view', group: 'Seguridad' },
];

const menuGroups = ['Inicio', 'Atención', 'Admisión', 'Parametrización', 'Analítica', 'Seguridad'];

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


  return (
    <UserContext.Provider value={userWithPermissions}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-2 group-data-[collapsible=icon]:p-2">
            <Link href="/dashboard" className="flex items-center justify-center">
              <Logo className="h-auto w-32 flex-shrink-0" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {groupedMenu.map((group) => (
                <SidebarGroup key={group.name}>
                  <SidebarGroupLabel className="group-data-[collapsible=icon]:justify-center">
                    {group.name}
                  </SidebarGroupLabel>
                  {group.items.map(option => (
                    <SidebarMenuItem key={option.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(option.href)}
                        tooltip={option.title}
                      >
                        <Link href={option.href}>
                          {option.icon}
                          <span>{option.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroup>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="min-h-svh flex-1 flex-col bg-secondary peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
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
                        <User className="h-5 w-5 text-muted-foreground" />
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
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Cambiar Contraseña</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={logout}>
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          {children}
        </main>
      </SidebarProvider>

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
    </UserContext.Provider>
  );
}
