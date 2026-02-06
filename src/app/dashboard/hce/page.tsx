'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { PatientHistory } from '@/components/patient-history';
import { HceSearch } from '@/components/hce-search';
import { FileText, Telescope, Search, Clock, ChevronRight, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HcePage() {
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  // Dummy data for "Recent Results" to populate the empty space
  const recentPatients = [
    { name: "Maria Gonzalez", id: "1", date: "Hace 2 horas" },
    { name: "Carlos Perez", id: "2", date: "Hace 1 día" },
    { name: "Ana Rodriguez", id: "3", date: "Hace 2 días" },
  ];

  return (
    <div className="flex h-[85vh] bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
      {/* Left Sidebar: Search & List */}
      <div className="w-[35%] min-w-[350px] bg-muted/50 border-r border-border/50 flex flex-col">
        <div className="p-8 pb-4">
          <h2 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Paciente
          </h2>
          <HceSearch onPersonaSelect={setSelectedPersona} />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-4 px-2">Resultados Recientes</h3>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2 pb-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="group flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50 hover:bg-card hover:shadow-sm hover:border-blue-100 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-extrabold text-sm">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/90 group-hover:text-blue-700 transition-colors">{patient.name}</p>
                      <p className="text-xs text-muted-foreground/80 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {patient.date}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-blue-400" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Content: Workspace */}
      <div className="flex-1 bg-card flex flex-col overflow-hidden relative">
        {!selectedPersona ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-500">
            <div className="h-48 w-48 bg-blue-50/50 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-blue-100/20 rounded-full animate-pulse"></div>
              <Telescope className="h-20 w-20 text-blue-200" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-2">Seleccione un Paciente</h3>
            <p className="text-muted-foreground max-w-md text-lg">
              Use el buscador de la izquierda para encontrar a un paciente por nombre o cédula y visualizar su historia clínica completa.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Internal Header */}
            <div className="px-8 py-6 border-b border-border/50 bg-card z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    Historia Clínica
                  </h2>
                  <p className="text-muted-foreground mt-1 text-lg">
                    Expediente de <span className="font-semibold text-foreground/90">{selectedPersona.nombreCompleto}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border border-border/50">
                  <User className="h-5 w-5 text-muted-foreground/80" />
                  <span className="text-sm font-medium text-foreground/80">{selectedPersona.cedula}</span>
                </div>
              </div>
            </div>

            {/* Main Content Scroll Info */}
            <div className="flex-1 overflow-hidden bg-card">
              <PatientHistory personaId={selectedPersona.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
