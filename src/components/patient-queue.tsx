

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

const serviceInfo: Record<ServiceType, { icon: React.ReactNode, title: string }> = {
  'medicina familiar': { icon: <HeartPulse className="h-5 w-5 text-rose-500 fill-rose-100" />, title: 'Medicina Familiar' },
  'consulta pediatrica': { icon: <Baby className="h-5 w-5 text-sky-500 fill-sky-100" />, title: 'Consulta Pediátrica' },
  'servicio de enfermeria': { icon: <Stethoscope className="h-5 w-5 text-blue-500 fill-blue-100" />, title: 'Servicio de Enfermería' },
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
      if (user.specialty === 'medico familiar') {
        return allServices.filter(s => s === 'medicina familiar');
      }
      if (user.specialty === 'medico pediatra') {
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
          <Card key={service} className="flex flex-col bg-card border shadow-lg overflow-hidden group">
            {/* Gradient Header Lne */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-80" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-5 border-b bg-secondary/20">
              <CardTitle className="text-lg font-bold capitalize flex items-center gap-2.5 text-foreground">
                <div className="p-1.5 bg-background rounded-md shadow-sm">
                  {serviceInfo[service].icon}
                </div>
                {serviceInfo[service].title}
              </CardTitle>
              <Badge variant="outline" className="text-sm font-semibold px-2.5 py-0.5 bg-background">{groupedPatients[service]?.length || 0}</Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-secondary/5">
              <ScrollArea className="h-96 w-full p-4">
                <div className="space-y-3">
                  {(!groupedPatients[service] || groupedPatients[service].length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground pt-14 space-y-2 opacity-60">
                      <ClockIcon className="h-8 w-8 mb-1" />
                      <p>No hay pacientes.</p>
                    </div>
                  ) : (
                    groupedPatients[service].map((patient) => {
                      const age = calculateAge(new Date(patient.fechaNacimiento));
                      const statusData = statusInfo[patient.status];
                      return (
                        <div key={patient.id} className={`flex flex-col gap-2 p-3.5 rounded-xl border-l-[5px] ${statusData.color} bg-background shadow hover:shadow-md transition-shadow duration-200`}>
                          <div className="flex justify-between items-start">
                            <div className='flex-1 overflow-hidden pr-2'>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-base truncate leading-tight text-foreground">{patient.name}</p>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {patient.accountType} &bull; {patient.kind === 'titular' ? 'Titular' : 'Beneficiario'}
                              </p>
                            </div>
                            <Badge variant={statusData.badgeVariant} className="capitalize shrink-0 shadow-sm">
                              {statusData.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Baby className="h-3.5 w-3.5" />
                            <span>{age} años</span>
                            <span className="mx-1 text-border">|</span>
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>{new Date(patient.checkInTime).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="mt-1">
                            <WaitTimeStopwatch startTime={new Date(patient.checkInTime)} />
                          </div>

                          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
                            <div className="flex-1">
                              {(user?.role.id === 'superuser' || user?.role.id === 'doctor') &&
                                (patient.status === 'Esperando' || patient.status === 'En Consulta' || patient.status === 'Reevaluacion') && (
                                  <Button
                                    onClick={() => handleStartOrContinueConsultation(patient)}
                                    size="sm"
                                    className="w-full h-8 text-xs font-semibold shadow-sm"
                                    variant={patient.status === 'En Consulta' ? 'secondary' : 'default'}
                                  >
                                    {patient.status === 'En Consulta' ? (
                                      <><FilePenLine className="mr-1.5 h-3.5 w-3.5" /> Continuar</>
                                    ) : (
                                      <><PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Atender</>
                                    )}
                                  </Button>
                                )}
                            </div>
                            {canManageStatus && (
                              <div className="ml-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {statusOptionsForRole.filter(s => s !== patient.status).map(status => (
                                      <DropdownMenuItem
                                        key={status}
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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
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
            </CardContent>
          </Card>
        ))}
        {totalPatientsInQueue === 0 && (
          <div className={`col-span-1 ${gridColsClass} flex flex-col items-center justify-center h-96 text-center text-muted-foreground bg-card/50 rounded-xl border-2 border-dashed`}>
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold">Sala de Espera Despejada</h3>
            <p className="text-sm mt-1 max-w-xs mx-auto">No hay pacientes esperando atención en este momento.</p>
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
