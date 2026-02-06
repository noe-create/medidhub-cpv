
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import type { PacienteConInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getListaPacientes } from '@/actions/patient-actions';
import { Loader2, Users, ClipboardList } from 'lucide-react';
import { calculateAge } from '@/lib/utils';

export function PatientListView() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [pacientes, setPacientes] = React.useState<PacienteConInfo[]>([]);

  const refreshPacientes = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
    try {
      const data = await getListaPacientes(currentSearch);
      setPacientes(data);
    } catch (error) {
      console.error("Error al buscar pacientes:", error);
      toast({ title: 'Error', description: 'No se pudieron cargar los pacientes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  React.useEffect(() => {
    const timer = setTimeout(async () => {
      await refreshPacientes(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, refreshPacientes]);

  return (
    <>
      <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" />
              Directorio de Pacientes
            </h2>
            <p className="text-muted-foreground mt-1">Listado completo de pacientes con historial clínico.</p>
          </div>
          <div className="relative w-full md:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <Input
              placeholder="Buscar por nombre, cédula o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-full bg-muted/50 border-border focus:bg-card focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : pacientes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-foreground/90 font-extrabold">Nombre Completo</TableHead>
                <TableHead className="text-foreground/90 font-extrabold">Cédula</TableHead>
                <TableHead className="text-foreground/90 font-extrabold">Edad</TableHead>
                <TableHead className="text-foreground/90 font-extrabold">Roles</TableHead>
                <TableHead className="text-foreground/90 font-extrabold">Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.id} className="hover:bg-blue-50/30 border-border/50">
                  <TableCell className="font-extrabold text-foreground">{paciente.nombreCompleto}</TableCell>
                  <TableCell className="text-foreground/80 font-medium">{paciente.cedula}</TableCell>
                  <TableCell className="text-foreground/80">{calculateAge(new Date(paciente.fechaNacimiento))} años</TableCell>
                  <TableCell>
                    {paciente.roles.map(role => (
                      <Badge key={role} variant="outline" className="mr-1 bg-violet-50 text-violet-700 border-violet-200 rounded-lg px-2 py-0.5">{role}</Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{paciente.email || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center bg-blue-50/50 rounded-3xl border border-blue-100/50">
            <div className="bg-card p-6 rounded-full shadow-lg shadow-primary/10 dark:shadow-none mb-6">
              <Users className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-2">No se encontraron pacientes</h3>
            <p className="text-muted-foreground max-w-sm">Parece que ningún paciente tiene un historial clínico aún.</p>
          </div>
        )}
      </div>
    </>
  );
}
