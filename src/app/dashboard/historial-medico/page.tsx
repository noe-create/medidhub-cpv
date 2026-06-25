'use client';

import * as React from 'react';
import type { Persona } from '@/lib/types';
import { HceSearch } from '@/components/hce-search';
import { TimelineHistorial } from '@/components/timeline-historial';
import { Stethoscope, Search, User, FileClock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HistorialMedicoPage() {
    const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

    return (
        <div className="flex flex-col h-[85vh] bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/50 bg-slate-50/50">
                <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <FileClock className="h-8 w-8 text-primary" />
                        Historial Médico
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Línea de tiempo clínica de comprobación rápida
                    </p>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Search Viewer */}
                <div className="w-[35%] min-w-[350px] max-w-[400px] bg-white border-r border-border/50 flex flex-col p-6 shadow-sm z-10">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Buscar Paciente
                    </h2>
                    <HceSearch onPersonaSelect={setSelectedPersona} />

                    <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
                        <p>
                            Utiliza este módulo para leer instantáneamente el diagnóstico, síntomas, constantes vitales y tratamientos asignados de consultas previas sin descargar ningún archivo.
                        </p>
                    </div>
                </div>

                {/* Right Content: Timeline Feed */}
                <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden relative">
                    {!selectedPersona ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-500 bg-slate-50">
                            <div className="h-40 w-40 bg-indigo-50/50 rounded-full flex items-center justify-center mb-6 relative">
                                <Stethoscope className="h-16 w-16 text-indigo-300" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Historial Clínico en Vivo</h3>
                            <p className="text-slate-500 max-w-sm text-lg">
                                Busca y selecciona a un paciente a la izquierda para visualizar todo lo que padecía y se le asignó en cada una de sus visitas.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-slate-50/50">
                            <div className="px-8 py-4 border-b border-slate-200 bg-white shadow-sm z-20 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedPersona.nombreCompleto}</h3>
                                    <p className="text-sm text-slate-500">Historia Cronológica de Consultas</p>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                    <User className="h-4 w-4 text-indigo-500" />
                                    <span className="text-sm font-bold text-indigo-900">{selectedPersona.cedula}</span>
                                </div>
                            </div>
                            <ScrollArea className="flex-1 px-4 md:px-8 bg-slate-50/50 pb-8">
                                <TimelineHistorial personaId={selectedPersona.id} />
                                <div className="h-12 w-full"></div>{/* Spacing bottom */}
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
