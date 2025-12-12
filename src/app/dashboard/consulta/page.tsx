'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PatientQueue } from '@/components/patient-queue';
import { RefreshCw } from 'lucide-react';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getWaitlist } from '@/actions/patient-actions';
import { useUser } from '@/components/app-shell';

import { Activity } from 'lucide-react';

export default function ConsultaPage() {
  const [patientQueue, setPatientQueue] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const user = useUser();

  const fetchWaitlist = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWaitlist();
      setPatientQueue(data.map(p => ({ ...p, checkInTime: new Date(p.checkInTime) })));
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al cargar la sala de espera',
        description: 'No se pudieron obtener los datos de los pacientes. Intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchWaitlist();
    const intervalId = setInterval(fetchWaitlist, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [fetchWaitlist]);



  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Activity className="h-8 w-8 text-pink-600 dark:text-pink-400" />
            </div>
            Módulo de Consulta
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Gestión de pacientes en espera y atención médica en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchWaitlist} disabled={isLoading} className="bg-background/50 backdrop-blur-sm">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <PatientQueue user={user} patients={patientQueue} onListRefresh={fetchWaitlist} />
    </div>
  );
}
