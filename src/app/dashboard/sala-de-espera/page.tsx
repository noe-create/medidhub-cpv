
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { PatientQueue } from '@/components/patient-queue';
import { PatientCheckinForm, type RegistrationData } from '@/components/patient-checkin-form';
import { PlusCircle, RefreshCw } from 'lucide-react';
import type { Patient, User as Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addPatientToWaitlist, getAccountTypeByTitularId, getWaitlist } from '@/actions/patient-actions';
import { useUser } from '@/components/app-shell';
import { RealTimeClock } from '@/components/real-time-clock';


export default function SalaDeEsperaPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [patientQueue, setPatientQueue] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const user = useUser();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const waitlistData = await getWaitlist();
      setPatientQueue(waitlistData);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al cargar datos',
        description: 'No se pudieron obtener los datos de la sala de espera. Intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // Poll every 30 seconds (optimized)

    return () => clearInterval(intervalId);
  }, [fetchData]);


  const handleSearchCheckin = async (data: RegistrationData) => {
    try {
      let accountType: any = 'Privado';

      if (data.searchResult.titularInfo) {
        accountType = await getAccountTypeByTitularId(data.searchResult.titularInfo.id) || 'Privado';
      } else if (data.searchResult.beneficiarioDe && data.searchResult.beneficiarioDe.length > 0) {
        const titularId = data.searchResult.beneficiarioDe[0].titularId;
        accountType = await getAccountTypeByTitularId(titularId) || 'Privado';
      }

      await addPatientToWaitlist({
        personaId: data.searchResult.persona.id,
        name: data.searchResult.persona.nombreCompleto!,
        kind: data.searchResult.titularInfo ? 'titular' : 'beneficiario',
        serviceType: data.serviceType,
        accountType: accountType,
        status: 'Esperando',
        checkInTime: new Date(),
        genero: data.searchResult.persona.genero,
        fechaNacimiento: data.searchResult.persona.fechaNacimiento,
        isReintegro: !!data.isReintegro
      });

      toast({
        variant: 'success',
        title: '¡Paciente Registrado!',
        description: `${data.searchResult.persona.nombreCompleto} ha sido añadido a la cola.`,
      });
      fetchData(); // Re-fetch immediately
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error al registrar paciente:", error);
      toast({
        title: 'Error al registrar',
        description: (error as Error).message || 'No se pudo añadir el paciente a la cola.',
        variant: 'destructive',
      });
    }
  };


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-blue-600 to-blue-500 p-8 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Decorative background elements could be added here if desired, but keeping it clean for now */}
        <div className="relative z-10">
          <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-white/80" />
            Sala de Espera
          </h2>
          <p className="text-blue-100 mt-2 font-medium text-lg">Gestione la cola de atención en tiempo real.</p>
          <div className="mt-6">
            <RealTimeClock />
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button variant="ghost" size="icon" onClick={fetchData} disabled={isLoading} className="text-white hover:bg-card/20 rounded-xl h-12 w-12">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-extrabold rounded-xl h-12 px-6 shadow-sm border-0">
                <PlusCircle className="mr-2 h-5 w-5" />
                Registrar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Paciente en Cola</DialogTitle>
                <DialogDescription>
                  Busque una persona existente que ya tenga un rol de titular o beneficiario para añadirla a la cola de espera.
                </DialogDescription>
              </DialogHeader>
              <PatientCheckinForm onSubmitted={handleSearchCheckin} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <PatientQueue user={user} patients={patientQueue} onListRefresh={fetchData} />
    </>
  );
}
