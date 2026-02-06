
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from './ui/badge';
import type { BeneficiarioConTitular } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getAllBeneficiarios } from '@/actions/patient-actions';
import { Loader2, Users } from 'lucide-react';

export function BeneficiaryList() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [beneficiarios, setBeneficiarios] = React.useState<BeneficiarioConTitular[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await getAllBeneficiarios(search);
        setBeneficiarios(data);
      } catch (error) {
        console.error("Error al buscar beneficiarios:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar los beneficiarios.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, toast]);


  return (
    <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Todos los Beneficiarios
          </h2>
          <p className="text-muted-foreground mt-1">Gestión de beneficiarios y vinculación con titulares.</p>
        </div>
        <div className="relative w-full md:w-96">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <Input
            placeholder="Buscar por nombre, cédula o titular..."
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
      ) : beneficiarios.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-foreground/90 font-extrabold">Nombre Completo</TableHead>
              <TableHead className="text-foreground/90 font-extrabold">Cédula</TableHead>
              <TableHead className="text-foreground/90 font-extrabold">Fecha de Nacimiento</TableHead>
              <TableHead className="text-foreground/90 font-extrabold">Género</TableHead>
              <TableHead className="text-foreground/90 font-extrabold">Titular Asociado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beneficiarios.map((beneficiario) => (
              <TableRow key={beneficiario.id} className="hover:bg-blue-50/30 border-border/50">
                <TableCell className="font-extrabold text-foreground">{beneficiario.persona.nombreCompleto}</TableCell>
                <TableCell className="text-foreground/80 font-medium">{beneficiario.persona.cedula}</TableCell>
                <TableCell className="text-foreground/80">{format(beneficiario.persona.fechaNacimiento, 'PPP', { locale: es })}</TableCell>
                <TableCell className="text-foreground/80">{beneficiario.persona.genero}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-lg px-3 py-1 font-medium">{beneficiario.titularNombre}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 text-center bg-blue-50/50 rounded-3xl border border-blue-100/50">
          <div className="bg-card p-6 rounded-full shadow-lg shadow-primary/10 dark:shadow-none mb-6">
            <Users className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-foreground mb-2">No se encontraron beneficiarios</h3>
          <p className="text-muted-foreground max-w-sm">Pruebe a cambiar su búsqueda o añada beneficiarios a un titular.</p>
        </div>
      )}
    </div>
  );
}
