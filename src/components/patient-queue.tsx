

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Baby,
  FilePenLine,
  HeartPulse,
  Stethoscope,
  Clock as ClockIcon,
  PlayCircle,
  MoreHorizontal,
  XCircle,
  ClipboardCheck,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Patient, ServiceType, PatientStatus, User, Consultation } from '@/lib/types';
import { ManagePatientDialog } from './manage-patient-sheet';
import { WaitTimeStopwatch } from './wait-time-stopwatch';
import { ScrollArea } from './ui/scroll-area';
import { updatePatientStatus } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { calculateAge } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RescheduleForm } from './reschedule-form';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const serviceInfo: Record<ServiceType, { icon: React.ReactNode, title: string, colorClass: string, gradientClass: string }> = {
  'medicina familiar': {
    icon: <HeartPulse className="h-5 w-5 text-rose-500 dark:text-neon-rose fill-rose-100 dark:fill-rose-500/20" />,
    title: 'Medicina Familiar',
    colorClass: 'text-rose-500 dark:text-rose-400',
    gradientClass: 'from-rose-500 to-rose-600'
  },
  'consulta pediatrica': {
    icon: <Baby className="h-5 w-5 text-sky-500 dark:text-neon-blue fill-sky-100 dark:fill-sky-500/20" />,
    title: 'Consulta Pediátrica',
    colorClass: 'text-sky-500 dark:text-sky-400',
    gradientClass: 'from-sky-500 to-sky-600'
  },
  'servicio de enfermeria': {
    icon: <Stethoscope className="h-5 w-5 text-emerald-500 dark:text-neon-emerald fill-emerald-100 dark:fill-emerald-500/20" />,
    title: 'Servicio de Enfermería',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    gradientClass: 'from-emerald-500 to-emerald-600'
  },
};

const statusInfo: Record<PatientStatus, { label: string; color: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'Esperando': { label: 'Esperando', color: 'border-l-yellow-500 shadow-yellow-500/10', badgeVariant: 'secondary' },
  'En Consulta': { label: 'En Consulta', color: 'border-l-blue-500 shadow-blue-500/10', badgeVariant: 'default' },
  'En Tratamiento': { label: 'En Tratamiento', color: 'border-l-purple-500 shadow-purple-500/10', badgeVariant: 'secondary' },
  'Ausente': { label: 'Ausente', color: 'border-l-gray-400', badgeVariant: 'secondary' },
  'Pospuesto': { label: 'Pospuesto', color: 'border-l-orange-500', badgeVariant: 'secondary' },
  'Reevaluacion': { label: 'Reevaluación', color: 'border-l-cyan-500', badgeVariant: 'secondary' },
  'Cancelado': { label: 'Cancelado', color: 'border-l-red-500', badgeVariant: 'destructive' },
  'Completado': { label: 'Completado', color: 'border-l-green-500', badgeVariant: 'secondary' },
};

interface PatientQueueProps {
  user: User | null;
  patients: Patient[];
  onListRefresh: () => void;
}

export function PatientQueue({ user, patients, onListRefresh }: PatientQueueProps) {
  // ... (hooks and logic same as before)
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [patientToReschedule, setPatientToReschedule] = React.useState<Patient | null>(null);

  if (!user) {
    return null;
  }

  const canManageStatus = ['superuser', 'administrator', 'asistencial', 'doctor', 'enfermera'].includes(user.role.id);

  const statusOptionsForRole = React.useMemo(() => {
    if (!user) return [];
    const baseOptions: PatientStatus[] = ['Ausente', 'Pospuesto', 'Reevaluacion'];

    if (user.role.id === 'asistencial' || user.role.id === 'administrator') {
      return ['Esperando', ...baseOptions];
    }

    if (user.role.id === 'enfermera') {
      return ['Esperando', 'En Tratamiento', ...baseOptions];
    }

    // doctor, superuser
    return ['Esperando', 'En Tratamiento', ...baseOptions];
  }, [user]);

  const selectedPatient = React.useMemo(
    () => (patients || []).find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedPatientId(null);
    }
  }

  const handleChangeStatus = async (patientId: string, status: PatientStatus) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    try {
      await updatePatientStatus(patientId, status);

      const toastOptions: {
        variant: 'default' | 'destructive' | 'success' | 'info',
        title: string,
        description: string
      } = {
        variant: 'default',
        title: 'Estado Actualizado',
        description: `El estado de ${patient.name} es ahora "${statusInfo[status].label}".`
      };

      if (status === 'Cancelado') {
        toastOptions.variant = 'destructive';
        toastOptions.title = 'Cita Cancelada';
      }

      toast(toastOptions);
      onListRefresh();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar el estado.", variant: 'destructive' });
    }
  };

  const handleOpenRescheduleDialog = (patient: Patient) => {
    setPatientToReschedule(patient);
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (newDateTime: Date) => {
    if (!patientToReschedule) return;
    try {
      await updatePatientStatus(patientToReschedule.id, 'Pospuesto', newDateTime);
      toast({
        variant: 'info',
        title: 'Cita Pospuesta',
        description: `La cita de ${patientToReschedule.name} ha sido reprogramada.`,
      });
      onListRefresh();
      setIsRescheduleOpen(false);
      setPatientToReschedule(null);
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      toast({ title: 'Error', description: error.message || 'No se pudo reprogramar la cita.', variant: 'destructive' });
    }
  };

  const handleStartOrContinueConsultation = async (patient: Patient) => {
    if (patient.status === 'Esperando' || patient.status === 'Reevaluacion') {
      try {
        await updatePatientStatus(patient.id, 'En Consulta');
        toast({
          variant: 'info',
          title: 'Paciente en Consulta',
          description: `${patient.name} ha sido llamado.`,
        });
        onListRefresh();
      } catch (error) {
        console.error("Error updating status:", error);
        toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: 'destructive' });
        return;
      }
    }
    setSelectedPatientId(patient.id);
    setIsSheetOpen(true);
  };

  const handleConsultationComplete = (consultation: Consultation) => {
    toast({
      variant: 'success',
      title: 'Consulta Completada',
      description: `La consulta de ${selectedPatient?.name} ha sido finalizada con éxito.`
    });
    onListRefresh();
    setIsSheetOpen(false);
    setSelectedPatientId(null);
  };

  const visibleServices = React.useMemo(() => {
    const allServices = Object.keys(serviceInfo) as ServiceType[];

    if (user.role.id === 'doctor' && user.specialty) {
      if ((user.specialty as unknown as string) === 'medico familiar') {
        return allServices.filter(s => s === 'medicina familiar');
      }
      if ((user.specialty as unknown as string) === 'medico pediatra') {
        return allServices.filter(s => s === 'consulta pediatrica');
      }
    }

    if (user.role.id === 'enfermera') {
      return allServices.filter((s) => s === 'servicio de enfermeria');
    }

    // For superuser, admin, and assistant, show all services
    if (['superuser', 'asistencial', 'administrator'].includes(user.role.id)) {
      return allServices;
    }

    // Default for doctors without a specific mapped specialty
    return [];

  }, [user]);

  const groupedPatients = React.useMemo(() => {
    return (visibleServices || []).reduce((acc, service) => {
      acc[service] = (patients || []).filter(p => p.serviceType === service);
      return acc;
    }, {} as Record<ServiceType, Patient[]>);
  }, [visibleServices, patients]);

  const gridColsClass = React.useMemo(() => {
    const count = visibleServices.length;
    if (count === 1) {
      return 'md:grid-cols-1';
    }
    if (count === 2) {
      return 'md:grid-cols-2';
    }
    if (count === 3) {
      return 'md:grid-cols-3';
    }
    return 'lg:grid-cols-4 md:grid-cols-2'; // For 4 services
  }, [visibleServices]);

  const totalPatientsInQueue = (patients || []).length;

  return (
    <>
      <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
        {(visibleServices || []).map((service) => (
          <div key={service} className="flex flex-col bg-muted/30 rounded-3xl border border-border/50 overflow-hidden h-[calc(100vh-22rem)] min-h-[500px]">
            {/* Premium Header with Gradient */}
            <div className={cn(
              "flex flex-row items-center justify-between pb-4 pt-5 px-6 dark:bg-gradient-to-b dark:from-white/5 dark:to-transparent",
              "border-b border-border/10 mb-2"
            )}>
              <h3 className="text-lg font-extrabold capitalize flex items-center gap-3 text-foreground/90">
                <div className={cn(
                  "p-2.5 rounded-xl shadow-lg border border-border/50 bg-card transition-transform group-hover:scale-110",
                  "dark:bg-muted/50 dark:backdrop-blur-sm"
                )}>
                  {serviceInfo[service].icon}
                </div>
                <span className="tracking-tight">{serviceInfo[service].title}</span>
              </h3>
              <Badge variant="secondary" className={cn(
                "text-sm font-black px-3.5 py-1 rounded-full shadow-sm border-border/50",
                "bg-card text-muted-foreground dark:bg-primary/10 dark:text-primary dark:border-primary/20"
              )}>
                {groupedPatients[service]?.length || 0}
              </Badge>
            </div>

            <ScrollArea className="flex-1 w-full px-4 pb-4">
              <div className="space-y-3 pb-2">
                {(!groupedPatients[service] || groupedPatients[service].length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground pt-20 space-y-3 opacity-80">
                    <div className="bg-card p-3 rounded-full shadow-sm">
                      <ClockIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">No hay pacientes</p>
                  </div>
                ) : (
                  groupedPatients[service].map((patient) => {
                    const age = calculateAge(new Date(patient.fechaNacimiento));
                    const statusData = statusInfo[patient.status];
                    return (
                      <div key={patient.id} className="group relative flex flex-col gap-3 p-5 rounded-2xl bg-card shadow-md border border-border/50 hover:shadow-xl hover:border-primary/40 dark:hover:bg-muted/30 transition-all duration-300">
                        {/* Status Accent Bar for dark mode */}
                        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${statusInfo[patient.status].color.includes('yellow') ? 'from-amber-400 to-amber-600' : statusInfo[patient.status].color.includes('blue') ? 'from-blue-400 to-blue-600' : 'from-slate-400 to-slate-600'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                        <div className="flex justify-between items-start gap-3 pl-2">
                          <div className='flex-1 overflow-hidden'>
                            <p className="font-black text-xl truncate leading-tight text-foreground tracking-tight group-hover:text-primary transition-colors">{patient.name}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded bg-muted/50",
                                patient.kind === 'titular' ? 'text-primary' : 'text-muted-foreground'
                              )}>{patient.kind}</span>
                              <span className="text-muted/30">•</span>
                              <span className="px-2 py-0.5 rounded bg-muted/50">{patient.accountType}</span>
                              {patient.isReintegro && (
                                <>
                                  <span className="text-muted/30">•</span>
                                  <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-black animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]">REINTEGRO</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant={statusData.badgeVariant} className={cn(
                            "capitalize shrink-0 font-bold px-3 py-1.5 rounded-lg border-2",
                            patient.status === 'En Consulta' && "bg-blue-500/10 text-blue-500 border-blue-500/20 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]",
                            patient.status === 'Esperando' && "bg-amber-500/10 text-amber-500 border-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
                            patient.status === 'En Tratamiento' && "bg-purple-500/10 text-purple-500 border-purple-500/20 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          )}>
                            {statusData.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium bg-muted/30 p-2 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <Baby className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{age} años</span>
                          </div>
                          <div className="w-px h-3 bg-border"></div>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{new Date(patient.checkInTime).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="mt-1">
                          <WaitTimeStopwatch startTime={new Date(patient.checkInTime)} />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <div className="flex-1">
                            {(user?.role.id === 'superuser' || user?.role.id === 'doctor') &&
                              (patient.status === 'Esperando' || patient.status === 'En Consulta' || patient.status === 'Reevaluacion') && (
                                <Button
                                  onClick={() => handleStartOrContinueConsultation(patient)}
                                  size="sm"
                                  className={`w-full h-10 rounded-xl font-bold shadow-sm transition-all ${patient.status === 'En Consulta'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                    }`}
                                >
                                  {patient.status === 'En Consulta' ? (
                                    <><FilePenLine className="mr-2 h-4 w-4" /> Continuar</>
                                  ) : (
                                    <><PlayCircle className="mr-2 h-4 w-4" /> Atender</>
                                  )}
                                </Button>
                              )}
                          </div>
                          {canManageStatus && (
                            <div className="">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted text-muted-foreground">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 rounded-xl p-2 bg-card border-border">
                                  <DropdownMenuLabel className="ml-2 text-xs text-muted-foreground uppercase tracking-widest">Acciones</DropdownMenuLabel>
                                  {statusOptionsForRole.filter(s => s !== patient.status).map(status => (
                                    <DropdownMenuItem
                                      key={status}
                                      className="rounded-lg p-2.5 cursor-pointer"
                                      onSelect={() => {
                                        if (status === 'Pospuesto') {
                                          handleOpenRescheduleDialog(patient);
                                        } else {
                                          handleChangeStatus(patient.id, status as PatientStatus);
                                        }
                                      }}
                                    >
                                      {statusInfo[status as PatientStatus].label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive rounded-lg p-2.5 cursor-pointer bg-red-50 focus:bg-red-100"
                                    onSelect={() => handleChangeStatus(patient.id, 'Cancelado')}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    <span>Cancelar Cita</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
        {totalPatientsInQueue === 0 && (
          <div className={`col-span-1 ${gridColsClass} flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed border-border`}>
            <div className="bg-card p-6 rounded-full shadow-sm mb-4">
              <ClipboardCheck className="h-12 w-12 text-primary/20" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground">Sala de Espera Despejada</h3>
            <p className="text-sm mt-2 max-w-xs mx-auto text-muted-foreground">No hay pacientes esperando atención en este momento. Puede registrar un nuevo paciente arriba.</p>
          </div>
        )}
      </div>

      {selectedPatient && (
        <ManagePatientDialog
          patient={selectedPatient}
          isOpen={isSheetOpen}
          onOpenChange={handleSheetOpenChange}
          onConsultationComplete={handleConsultationComplete}
        />
      )}

      {patientToReschedule && (
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprogramar Cita</DialogTitle>
              <DialogDescription>
                Seleccione la nueva fecha y hora para {patientToReschedule.name}.
              </DialogDescription>
            </DialogHeader>
            <RescheduleForm onSubmit={handleRescheduleSubmit} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
