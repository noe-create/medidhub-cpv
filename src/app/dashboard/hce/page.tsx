'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { PatientHistory } from '@/components/patient-history';
import { HceSearch } from '@/components/hce-search';
import { FileText, Telescope } from 'lucide-react';

export default function HcePage() {
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            Historia Clínica Electrónica
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Consulte y actualice el historial médico completo de los pacientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Buscar Paciente</CardTitle>
            <CardDescription>
              Busque por nombre o cédula para ver el historial clínico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HceSearch onPersonaSelect={setSelectedPersona} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedPersona ? (
            <Card>
              <CardHeader>
                <CardTitle>Historial Completo de: {selectedPersona.nombreCompleto}</CardTitle>
                <CardDescription>Cédula: {selectedPersona.cedula}</CardDescription>
              </CardHeader>
              <CardContent>
                <PatientHistory personaId={selectedPersona.id} />
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 p-8 text-center">
              <Telescope className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Seleccione un paciente</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use el buscador para encontrar a un paciente y ver su información clínica.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
