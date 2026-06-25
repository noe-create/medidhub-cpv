
'use client';

import * as React from 'react';
import { DocumentHeader } from './document-header';
import type { Patient, Consultation } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReintegroOrderDisplayProps {
    consultation: Consultation;
    patient: any; // Using any for extended patient info if needed
}

export function ReintegroOrderDisplay({ consultation, patient }: ReintegroOrderDisplayProps) {
    const referral = consultation.occupationalReferral || {};

    return (
        <div className="bg-white p-8 text-black font-sans max-w-4xl mx-auto border shadow-sm print:shadow-none print:border-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
                <img src="/recipe/logo.png" alt="Logo" className="h-16" />
                <div className="text-center flex-grow">
                    <DocumentHeader />
                    <h1 className="text-xl font-black uppercase tracking-tight mt-2 text-primary">Orden de Reintegro Laboral</h1>
                </div>
                <img src="/recipe/logo_si.png" alt="Logo Salud Integral" className="h-16" />
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Trabajador / Paciente</p>
                    <p className="font-bold text-lg">{patient.name}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Cédula de Identidad</p>
                    <p className="font-bold text-lg">{patient.cedula || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Fecha de Evaluación</p>
                    <p className="font-medium">{format(new Date(consultation.consultationDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Unidad de Servicio</p>
                    <p className="font-medium">{patient.unidadServicio || 'N/A'}</p>
                </div>
            </div>

            {/* Referral Content */}
            <div className="space-y-6">
                <section>
                    <h3 className="text-xs font-black uppercase text-primary border-b border-primary/20 pb-1 mb-2">Motivo del Reintegro</h3>
                    <p className="text-sm leading-relaxed text-slate-800">
                        Se evalúa al trabajador posterior a cumplimiento de reposo médico. El paciente refiere encontrarse en condiciones para retomar sus actividades laborales habituales.
                    </p>
                </section>

                <section>
                    <h3 className="text-xs font-black uppercase text-primary border-b border-primary/20 pb-1 mb-2">Observaciones Médicas</h3>
                    <div className="text-sm leading-relaxed text-slate-800 p-4 bg-slate-50 rounded-lg italic border border-dashed border-slate-300">
                        {referral.observations || "Sin observaciones adicionales registradas."}
                    </div>
                </section>

                <section className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                    <h3 className="text-sm font-black uppercase text-blue-700 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Remisión a Salud Ocupacional
                    </h3>
                    <p className="text-sm leading-relaxed font-medium text-blue-900 mb-4">
                        Se remite formalmente al servicio de **Medicina Ocupacional / Salud Ocupacional** para realizar la evaluación de reintegro laboral de ley y determinar aptitud para el puesto de trabajo.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="w-4 h-4 rounded border border-blue-300 bg-white flex items-center justify-center">✓</div>
                            <span>Evaluación Post-Reposo</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-700">
                            <div className="w-4 h-4 rounded border border-blue-300 bg-white flex items-center justify-center">✓</div>
                            <span>Validación de Reposo</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-20">
                <div className="text-center border-t border-slate-400 pt-4">
                    <p className="text-xs font-bold uppercase">Sello y Firma del Médico</p>
                    <p className="text-[10px] text-slate-500 mt-1">Servicio de Salud Integral</p>
                </div>
                <div className="text-center border-t border-slate-400 pt-4">
                    <p className="text-xs font-bold uppercase">Recepción Salud Ocupacional</p>
                    <p className="text-[10px] text-slate-500 mt-1">Firma y Fecha</p>
                </div>
            </div>

            <div className="mt-12 text-center text-[9px] text-slate-400 uppercase tracking-widest border-t pt-4">
                Generado por MEDIHUB CPV - Sistema de Gestión Médica
            </div>
        </div>
    );
}
