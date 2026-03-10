
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { ReintegroHceSearch } from '@/components/reintegro-hce-search';
import { EvaluacionMedicaForm } from '@/components/evaluacion-medica-form';
import { ClipboardCheck, Search, FileText, ChevronRight, Clock, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ReintegroHcePage() {
    const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
    const [selectedTitularInfo, setSelectedTitularInfo] = React.useState<any>(null);

    const handlePersonaSelect = (persona: Persona | null, titularInfo?: any) => {
        setSelectedPersona(persona);
        setSelectedTitularInfo(titularInfo);
    };

    return (
        <div className="flex h-[88vh] bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
            {/* Left Sidebar: Specialized Search */}
            <div className="w-[30%] min-w-[350px] bg-muted/30 border-r border-border/50 flex flex-col no-print">
                <div className="p-8 pb-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                            <ClipboardCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground leading-tight">Reintegros</h2>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Historial de Trabajadores</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Filtro de Trabajadores</label>
                        <ReintegroHceSearch onPersonaSelect={handlePersonaSelect} />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col px-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[11px] font-black text-muted-foreground/80 uppercase tracking-widest">Información</h3>
                    </div>
                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-4 pb-4">
                            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                                <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                                    Este módulo está diseñado exclusivamente para el registro y evaluación de trabajadores de la clínica (Titulares).
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-bold text-foreground/70">Solo Titulares</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-bold text-foreground/70">Buscador Filtrado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-bold text-foreground/70">Formato Oficial de Impresión</span>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Right Content: PDF-like Form */}
            <div className="flex-1 bg-white dark:bg-card flex flex-col overflow-hidden relative">
                {!selectedPersona ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-700">
                        <div className="h-56 w-56 bg-indigo-50/50 rounded-full flex items-center justify-center mb-10 relative">
                            <div className="absolute inset-0 bg-indigo-100/30 rounded-full animate-pulse"></div>
                            <FileText className="h-24 w-24 text-indigo-200" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-3">Evaluación Médica</h3>
                        <p className="text-muted-foreground max-w-md text-lg font-medium leading-relaxed">
                            Seleccione un trabajador para generar y completar el formato de Reintegro / Evaluación Médica.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header for App Display (Hidden when printing) */}
                        <div className="px-10 py-8 border-b border-border/50 bg-card z-10 no-print">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4">
                                        <UserPlus className="h-9 w-9 text-indigo-600" />
                                        Nueva Evaluación
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-lg font-medium">
                                        Procesando a <span className="font-extrabold text-indigo-700">{selectedPersona.nombreCompleto}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Form View */}
                        <ScrollArea className="flex-1 bg-muted/10 print:bg-white px-4 md:px-10 py-10">
                            <EvaluacionMedicaForm persona={selectedPersona} titularInfo={selectedTitularInfo} />
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    );
}
