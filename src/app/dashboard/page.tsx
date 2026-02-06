


'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Clock,
  Users,
  Building,
  HeartPulse,
  UsersRound,
  ClipboardCheck,
  BookText,
  AreaChart,
  UserCog,
  MessageSquareQuote,
  LayoutGrid,
  ShieldCheck,
  User,
  KeyRound,
  DollarSign,
  CalendarDays,
  Stethoscope,
  Palette,
  Briefcase,
  HardHat,
  ArrowRight
} from 'lucide-react';
import { useUser } from '@/components/app-shell';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/actions/dashboard-actions';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { cn } from '@/lib/utils';

interface MenuOption {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  permission: string;
  statKey?: string;
  variant?: 'default' | 'blue' | 'cyan' | 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'fuchsia' | 'violet';
  colSpan?: string;
}

const MenuCard = ({ option, stat }: { option: MenuOption, stat?: number | string }) => {
  const isSolid = option.variant && option.variant !== 'default';

  const variantStyles = {
    default: "bg-card hover:bg-muted/50 text-foreground border border-border/50 dark:hover:border-primary/30",
    blue: "bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 border-none shadow-blue-500/20 shadow-xl",
    cyan: "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white hover:from-cyan-500 hover:to-cyan-700 border-none shadow-cyan-500/20 shadow-xl",
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 border-none shadow-indigo-500/20 shadow-xl",
    purple: "bg-gradient-to-br from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 border-none shadow-purple-500/20 shadow-xl",
    emerald: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white hover:from-emerald-500 hover:to-emerald-700 border-none shadow-emerald-500/20 shadow-xl",
    amber: "bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 border-none shadow-amber-500/20 shadow-xl",
    rose: "bg-gradient-to-br from-rose-400 to-rose-600 text-white hover:from-rose-500 hover:to-rose-700 border-none shadow-rose-500/20 shadow-xl",
    fuchsia: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white hover:from-fuchsia-600 hover:to-fuchsia-800 border-none shadow-fuchsia-500/20 shadow-xl",
    violet: "bg-gradient-to-br from-violet-500 to-violet-700 text-white hover:from-violet-600 hover:to-violet-800 border-none shadow-violet-500/20 shadow-xl",
  };

  const currentStyle = variantStyles[option.variant || 'default'];

  return (
    <Link href={option.href} className={cn("group relative flex flex-col", option.colSpan || "col-span-1")}>
      <Card className={cn(
        "flex flex-col h-full shadow-lg shadow-primary/10 dark:shadow-none/10 rounded-3xl transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl dark:shadow-none",
        currentStyle
      )}>
        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between">
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-300",
              isSolid ? "bg-card/20 text-white" : "bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]"
            )}>
              {option.icon}
            </div>
            {stat !== undefined && (
              <div className={cn(
                "flex items-center justify-center min-w-[2.5rem] h-8 px-3 font-extrabold rounded-full text-sm backdrop-blur-sm",
                isSolid ? "bg-card/20 text-white" : "bg-gray-100 text-foreground/80"
              )}>
                {stat}
              </div>
            )}
          </div>
          <CardTitle className={cn("text-xl font-extrabold tracking-tight mt-4 transition-colors", isSolid ? "text-white" : "text-foreground group-hover:text-primary")}>
            {option.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end relative z-10">
          <p className={cn("text-sm", isSolid ? "text-blue-50" : "text-muted-foreground")}>
            {option.description}
          </p>
          {isSolid && (
            <ArrowRight className="absolute bottom-6 right-6 h-6 w-6 text-white/50 group-hover:text-white transition-colors" />
          )}
        </CardContent>

        {/* Decorative background blobs for solid cards */}
        {isSolid && (
          <>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-card/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/5 blur-2xl pointer-events-none" />
          </>
        )}
      </Card>
    </Link>
  );
};

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  const menuOptions: MenuOption[] = [
    {
      href: '/dashboard/consulta',
      icon: <Stethoscope className="h-6 w-6" />,
      title: 'Nueva Consulta',
      description: 'Iniciar atención médica.',
      permission: 'consultation.perform',
      statKey: 'inConsultation',
      variant: 'blue',
      colSpan: 'md:col-span-1 lg:col-span-1'
    },
    {
      href: '/dashboard/sala-de-espera',
      icon: <Clock className="h-6 w-6" />,
      title: 'Sala de Espera',
      description: 'Gestión de pacientes en cola.',
      permission: 'waitlist.manage',
      statKey: 'waitlist',
      variant: 'amber',
      colSpan: 'md:col-span-1 lg:col-span-1'
    },
    {
      href: '/dashboard/lista-pacientes',
      icon: <Users className="h-6 w-6" />,
      title: 'Pacientes',
      description: 'Directorio general de pacientes.',
      permission: 'patientlist.view',
      statKey: 'patients',
      variant: 'emerald',
      colSpan: 'md:col-span-1'
    },
    {
      href: '/dashboard/salud-ocupacional',
      icon: <HardHat className="h-6 w-6" />,
      title: 'Salud Ocupacional',
      description: 'Evaluaciones de empresas.',
      permission: 'consultation.perform',
      statKey: 'occupationalEvaluations',
      variant: 'cyan',
      colSpan: 'md:col-span-1'
    },
    {
      href: '/dashboard/hce',
      icon: <HeartPulse className="h-6 w-6" />,
      title: 'Historia Clínica',
      description: 'Búsqueda de historiales.',
      permission: 'hce.view',
      variant: 'rose'
    },
    {
      href: '/dashboard/pacientes',
      icon: <ShieldCheck className="h-6 w-6" />,
      title: 'Titulares',
      description: 'Gestión de titulares.',
      permission: 'titulars.manage',
      statKey: 'titulars',
      variant: 'blue'
    },
    {
      href: '/dashboard/beneficiarios',
      icon: <UsersRound className="h-6 w-6" />,
      title: 'Beneficiarios',
      description: 'Gestión de dependientes.',
      permission: 'beneficiaries.manage',
      statKey: 'beneficiaries',
      variant: 'indigo'
    },
    {
      href: '/dashboard/empresas',
      icon: <Building className="h-6 w-6" />,
      title: 'Empresas',
      description: 'Convenios corporativos.',
      permission: 'companies.manage',
      statKey: 'companies',
      variant: 'violet'
    },
    {
      href: '/dashboard/reportes',
      icon: <AreaChart className="h-6 w-6" />,
      title: 'Reportes',
      description: 'Analítica y estadísticas.',
      permission: 'reports.view',
      variant: 'fuchsia'
    },
    {
      href: '/dashboard/usuarios',
      icon: <UserCog className="h-6 w-6" />,
      title: 'Usuarios',
      description: 'Administración del sistema.',
      permission: 'users.manage',
      statKey: 'users',
      variant: 'indigo'
    },
    {
      href: '/dashboard/cie10',
      icon: <BookText className="h-6 w-6" />,
      title: 'CIE-10',
      description: 'Catálogo de diagnósticos.',
      permission: 'cie10.manage',
      variant: 'purple'
    },
    {
      href: '/dashboard/puestos',
      icon: <Briefcase className="h-6 w-6" />,
      title: 'Puestos',
      description: 'Perfiles de cargo.',
      permission: 'jobpositions.manage',
      variant: 'blue'
    },
    {
      href: '/dashboard/apariencia',
      icon: <Palette className="h-6 w-6" />,
      title: 'Apariencia',
      description: 'Personalización.',
      permission: 'settings.manage',
      variant: 'cyan'
    },
  ];

  const hasPermission = (permission: string) => {
    if (permission === '*') return true;
    if (user.role.name === 'Superusuario') return true;
    return user.permissions?.includes(permission);
  };

  const visibleMenuOptions = menuOptions.filter(
    option => hasPermission(option.permission)
  );

  const getWelcomeMessage = () => {
    const nameToShow = user.name || user.username;
    if (!user.genero) {
      return `Hola, ${nameToShow}`;
    }
    const welcome = user.genero === 'Femenino' ? 'Bienvenida' : 'Bienvenido';
    return `${welcome}, ${nameToShow}`;
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{getWelcomeMessage()}</h2>
          <p className="text-muted-foreground">Resumen de actividad y accesos directos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hero Section */}
        <DashboardHero />

        {/* Dynamic Bento Grid Items */}
        {visibleMenuOptions.map((option) => (
          <MenuCard
            key={option.href}
            option={option}
            stat={option.statKey ? stats[option.statKey] : undefined}
          />
        ))}

      </div>
    </div>
  );
}


