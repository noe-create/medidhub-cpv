'use client';

import * as React from 'react';
import { getPatientHistory } from '@/actions/patient-actions';
import type { HistoryEntry, Consultation, LabOrder } from '@/lib/types';
import { Loader2, Activity, Pill, Thermometer, Info, Stethoscope, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimelineHistorialProps {
    personaId: string;
}

export function TimelineHistorial({ personaId }: TimelineHistorialProps) {
    const [history, setHistory] = React.useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchHistory() {
            if (!personaId) return;
            setIsLoading(true);
            try {
                const data = await getPatientHistory(personaId);
                // Filtrar solo las consultas para el timeline continuo y excluir laboratorios aislados (o dejarlos como notas)
                const consultations = data.filter(e => e.type === 'consultation');
                setHistory(consultations);
            } catch (error) {
                console.error('Error fetching patient history:', error);
                toast({
                    title: 'Error al cargar historial',
                    description: 'No se pudo obtener el historial cronológico del paciente.',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchHistory();
    }, [personaId, toast]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48 w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-slate-500">
                <Stethoscope className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-semibold text-lg">No hay historial de visitas médicas previas</p>
            </div>
        );
    }

    return (
        <div className="w-full relative px-0 md:px-12 py-8 mt-4 max-w-5xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-[132px] top-12 bottom-12 w-0.5 bg-slate-200 hidden md:block rounded-full"></div>

            <div className="space-y-16 relative z-10 w-full">
                {history.map((entry, idx) => {
                    const cons = entry.data as Consultation;
                    const dateObj = new Date(cons.consultationDate);
                    const monthStr = format(dateObj, "MMM", { locale: es }).replace('.', '').toUpperCase();

                    return (
                        <div key={cons.id} className="flex flex-col md:flex-row gap-6 items-start relative w-full">
                            {/* Desktop Date Marker */}
                            <div className="hidden md:flex flex-col items-end w-[84px] shrink-0 relative mt-1 select-none">
                                <div className="absolute top-2 -right-[9px] w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_0_4px_#f8fafc] z-10"></div>
                                <div className="text-right pr-6 mt-1 w-full text-slate-400">
                                    <span className="block text-xs font-bold uppercase tracking-widest">{monthStr}</span>
                                    <span className="block text-3xl font-black text-slate-800 leading-none my-1 tracking-tighter">{format(dateObj, "dd", { locale: es })}</span>
                                    <span className="block text-xs font-semibold">{format(dateObj, "yyyy", { locale: es })}</span>
                                </div>
                            </div>

                            {/* Mobile Date Header */}
                            <div className="md:hidden flex items-center gap-3 w-full border-b border-slate-100 pb-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="font-bold text-slate-800">{format(dateObj, "dd MMM yyyy", { locale: es }).replace('.', '')}</span>
                            </div>

                            {/* Timeline Card */}
                            <div className="flex-1 bg-white rounded-3xl p-6 md:p-10 border border-slate-200/50 shadow-xl shadow-slate-200/50 w-full transition-shadow hover:shadow-2xl hover:shadow-slate-200/60 flex flex-col gap-8">

                                {/* Header: Diagnóstico y Responsable */}
                                <div className="flex flex-col border-b border-slate-100 pb-6">
                                    <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                                        <Info className="h-6 w-6 text-indigo-500" />
                                        Impresión Diagnóstica
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {cons.diagnoses && cons.diagnoses.length > 0 ? (
                                            cons.diagnoses.map((diag, i) => (
                                                <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">{diag.cie10Description}</span>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 italic bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">No especificado</span>
                                        )}
                                    </div>
                                </div>

                                {/* Body Sections */}
                                <div className="flex flex-col gap-8">
                                    {/* Evaluation Summary */}
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Stethoscope className="h-5 w-5 text-emerald-600" />
                                            Anamnesis y Evolución
                                        </h4>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Motivo / Síntomas</span>
                                                <span className="text-slate-800 font-medium bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">{cons.motivoConsulta?.sintomas?.join(', ') || 'No refiere'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Enfermedad Actual</span>
                                                <span className="text-slate-800 font-medium bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm leading-relaxed">{cons.enfermedadActual || 'No refiere'}</span>
                                            </div>
                                            {cons.revisionPorSistemas && cons.revisionPorSistemas !== 'Ninguno / No Refiere' && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Revisión por Sistemas</span>
                                                    <span className="text-slate-800 font-medium bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm leading-relaxed">{cons.revisionPorSistemas}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Physical Exam Summary */}
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-rose-500" />
                                            Examen Físico
                                        </h4>

                                        {cons.signosVitales && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                                    <span className="block text/[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tensión Art.</span>
                                                    <span className="font-black text-slate-800 text-lg">{cons.signosVitales.taSistolica}/{cons.signosVitales.taDiastolica}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                                    <span className="block text/[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frecuencia</span>
                                                    <span className="font-black text-slate-800 text-lg">{cons.signosVitales.fc}<span className="text-xs text-slate-400 ml-1">bpm</span></span>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                                    <span className="block text/[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso</span>
                                                    <span className="font-black text-slate-800 text-lg">{cons.signosVitales.peso}<span className="text-xs text-slate-400 ml-1">{cons.signosVitales.pesoUnidad}</span></span>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                                    <span className="block text/[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temperatura</span>
                                                    <span className="font-black text-slate-800 text-lg">{cons.signosVitales.temp}°{cons.signosVitales.tempUnidad}</span>
                                                </div>
                                            </div>
                                        )}

                                        {cons.examenFisicoGeneral && (
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Hallazgos Generales</span>
                                                <span className="text-slate-800 font-medium bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm leading-relaxed">{cons.examenFisicoGeneral}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Plan / Treatment */}
                                {cons.treatmentPlan && cons.treatmentPlan !== 'No aplica' && (
                                    <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200 shadow-sm">
                                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Pill className="h-5 w-5 text-amber-600" />
                                            Plan y Tratamiento Médico
                                        </h4>
                                        <p className="text-amber-900/90 font-medium text-sm whitespace-pre-wrap leading-relaxed">{cons.treatmentPlan}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
