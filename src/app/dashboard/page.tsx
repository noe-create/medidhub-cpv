

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
  Palette
} from 'lucide-react';
import { useUser } from '@/components/app-shell';

interface MenuOption {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  permission: string;
}

const menuOptions: MenuOption[] = [
  {
    href: '/dashboard/sala-de-espera',
    icon: <Clock className="h-6 w-6 text-blue-500" />,
    title: 'Sala de Espera',
    description: 'Gestione la cola de pacientes en tiempo real.',
    permission: 'waitlist.manage',
  },
  {
    href: '/dashboard/consulta',
    icon: <Stethoscope className="h-6 w-6 text-green-500" />,
    title: 'Consulta',
    description: 'Acceda al módulo de atención médica.',
    permission: 'consultation.perform',
  },
  {
    href: '/dashboard/personas',
    icon: <User className="h-6 w-6 text-cyan-500" />,
    title: 'Personas',
    description: 'Repositorio central de individuos del sistema.',
    permission: 'people.manage',
  },
  {
    href: '/dashboard/hce',
    icon: <HeartPulse className="h-6 w-6 text-red-500" />,
    title: 'Historia Clínica',
    description: 'Busque y consulte el historial de los pacientes.',
    permission: 'hce.view',
  },
  {
    href: '/dashboard/cie10',
    icon: <BookText className="h-6 w-6 text-indigo-500" />,
    title: 'Catálogo CIE-10',
    description: 'Gestione el catálogo de códigos de diagnóstico.',
    permission: 'cie10.manage',
  },
  {
    href: '/dashboard/lista-pacientes',
    icon: <Users className="h-6 w-6 text-sky-500" />,
    title: 'Lista de Pacientes',
    description: 'Consulte los pacientes con historial médico.',
    permission: 'patientlist.view',
  },
  {
    href: '/dashboard/pacientes',
    icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
    title: 'Gestión de Titulares',
    description: 'Administre los perfiles de los titulares.',
    permission: 'titulars.manage',
  },
  {
    href: '/dashboard/beneficiarios',
    icon: <UsersRound className="h-6 w-6 text-teal-500" />,
    title: 'Beneficiarios',
    description: 'Consulte la lista de todos los beneficiarios.',
    permission: 'beneficiaries.manage',
  },
  {
    href: '/dashboard/empresas',
    icon: <Building className="h-6 w-6 text-orange-500" />,
    title: 'Empresas',
    description: 'Gestione las empresas y convenios afiliados.',
    permission: 'companies.manage',
  },
  {
    href: '/dashboard/reportes',
    icon: <AreaChart className="h-6 w-6 text-purple-500" />,
    title: 'Reportes',
    description: 'Genere reportes de morbilidad y estadísticas.',
    permission: 'reports.view',
  },
  {
    href: '/dashboard/usuarios',
    icon: <UserCog className="h-6 w-6 text-pink-500" />,
    title: 'Gestión de Usuarios',
    description: 'Administre los usuarios y roles del sistema.',
    permission: 'users.manage',
  },
  {
    href: '/dashboard/apariencia',
    icon: <Palette className="h-6 w-6 text-yellow-500" />,
    title: 'Apariencia',
    description: 'Personalice las imágenes y colores del sistema.',
    permission: 'settings.manage',
  },
];

const MenuCard = ({ option }: { option: MenuOption }) => {
  return (
    <Link href={option.href} className="flex group">
      <Card className="flex flex-col w-full overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl border-none shadow-md bg-gradient-to-br from-card to-secondary/30 relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{option.title}</CardTitle>
            <div className="p-2.5 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
              {option.icon}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          <p className="text-sm text-muted-foreground">{option.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function DashboardPage() {
  const user = useUser();

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
      return `Bienvenido/a, ${nameToShow}`;
    }

    const welcome = user.genero === 'Femenino' ? 'Bienvenida' : 'Bienvenido';
    return `${welcome}, ${nameToShow}`;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">{getWelcomeMessage()}</h2>
          <p className="text-muted-foreground">Seleccione una opción para comenzar a trabajar.</p>
        </div>
      </div>
      <div className="grid gap-6 transition-all duration-300 ease-in-out md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleMenuOptions.map((option) => (
          <MenuCard key={option.href} option={option} />
        ))}
      </div>
    </div>
  );
}
