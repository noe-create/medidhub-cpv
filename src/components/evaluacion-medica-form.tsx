
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, User, FileText, Calendar, Clock, MapPin, Phone, Briefcase } from 'lucide-react';
import { calculateAge, cn } from '@/lib/utils';
import type { Persona } from '@/lib/types';
import Image from 'next/image';

interface EvaluacionMedicaFormProps {
    persona: Persona;
    titularInfo?: any;
}

export function EvaluacionMedicaForm({ persona, titularInfo }: EvaluacionMedicaFormProps) {
    const age = calculateAge(new Date(persona.fechaNacimiento));
    const today = new Date().toLocaleDateString('es-VE');

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-end no-print">
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 rounded-xl shadow-lg shadow-indigo-200 px-6 h-12">
                    <Printer className="h-5 w-5" />
                    Imprimir Evaluación
                </Button>
            </div>

            {/* Main Print Container */}
            <div className="bg-white border-[1.5px] border-black text-black font-sans p-0 shadow-lg print:shadow-none print:border-black print:m-0" id="printable-form">

                {/* Header Table */}
                <div className="grid grid-cols-4 border-b-[1.5px] border-black">
                    <div className="col-span-1 border-r-[1.5px] border-black p-2 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <Image
                                src="/recipe/logo_si.png"
                                alt="Logo Salud Integral"
                                width={150}
                                height={80}
                                className="h-auto w-32 object-contain"
                            />
                            <span className="text-[10px] font-bold mt-1">RIF: J-07505586-1</span>
                        </div>
                    </div>
                    <div className="col-span-2 border-r-[1.5px] border-black flex items-center justify-center p-4">
                        <h1 className="text-xl font-black text-center uppercase tracking-wider">Evaluación Médica</h1>
                    </div>
                    <div className="col-span-1 p-3 text-[9px] leading-tight flex flex-col justify-center">
                        <p>Código: F-SSSL-012</p>
                        <p>Fecha de emisión: Ene-2008</p>
                        <p>Fecha de Revisión: Abr-2022</p>
                        <p>Revisión: 003</p>
                        <p>Pág.: 1</p>
                    </div>
                </div>

                <div className="bg-white border-b-[1.5px] border-black py-1.5 px-4 text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-black">
                        Centro Policlínico Valencia Departamento de Salud Ocupacional
                    </p>
                </div>

                {/* Patient Data Grid */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-12 gap-y-6 gap-x-4 items-end">
                        <div className="col-span-8 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Nombre y Apellido:</span>
                            <span className="text-sm font-bold flex-1 uppercase px-2">{persona.nombreCompleto}</span>
                        </div>
                        <div className="col-span-4 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">C.I:</span>
                            <span className="text-sm font-bold flex-1 px-2">{persona.cedula}</span>
                        </div>

                        <div className="col-span-3 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Edad:</span>
                            <span className="text-sm font-bold flex-1 px-1 center">{age} años</span>
                        </div>
                        <div className="col-span-3 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Sexo:</span>
                            <span className="text-sm font-bold flex-1 px-1">{persona.genero === 'Masculino' ? 'M' : 'F'}</span>
                        </div>
                        <div className="col-span-6 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Dpto:</span>
                            <span className="text-sm font-bold flex-1 px-1 uppercase">{titularInfo?.unidadServicio}</span>
                        </div>

                        <div className="col-span-4 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Cargo:</span>
                            <span className="text-sm font-bold flex-1 px-1 uppercase">_</span>
                        </div>
                        <div className="col-span-4 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Área:</span>
                            <span className="text-sm font-bold flex-1 px-1 uppercase">{titularInfo?.unidadServicio}</span>
                        </div>
                        <div className="col-span-4 flex items-end gap-2 border-b border-black pb-1">
                            <span className="text-xs font-bold whitespace-nowrap">Telf:</span>
                            <span className="text-sm font-bold flex-1 px-1">{persona.telefono1 || '_'}</span>
                        </div>
                    </div>

                    {/* Checklist Purpose */}
                    <div className="grid grid-cols-3 gap-y-4 pt-2">
                        {[
                            { id: 'pre', label: 'Pre Empleo' },
                            { id: 'poe', label: 'POE' },
                            { id: 'pre-vac', label: 'Pre-Vacacional' },
                            { id: 'post-emp', label: 'Post-Empleo' },
                            { id: 'post-reintegro', label: 'Post-Empleo' }, // User checkmark was here
                            { id: 'post-vac', label: 'Post-Vacacional' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-6 h-6 border-[1.5px] border-black rounded-sm flex items-center justify-center font-bold">
                                    {/* Empty box for manual filling or interactive if needed */}
                                </div>
                                <span className="text-[11px] font-bold">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 pb-2">
                        <h3 className="text-sm font-black border-b-[2px] border-black inline-block uppercase italic">
                            Consultorio: 774 Piso 7 Torre A.
                        </h3>
                    </div>

                    {/* Results Comparison Grid */}
                    <div className="grid grid-cols-2 gap-8 border-[1.5px] border-black p-6 rounded-sm">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-[1.5px] border-black flex items-center justify-center"></div>
                                <span className="text-xs font-black uppercase">Laboratorios</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-[1.5px] border-black flex items-center justify-center"></div>
                                <span className="text-xs font-black uppercase">Medicina Ocupacional</span>
                            </div>
                        </div>

                        <div className="space-y-3 pl-8 border-l-[1.5px] border-black">
                            {[
                                { label: 'Apto' },
                                { label: 'Reposo' },
                                { label: 'Referido I.V.S.S' },
                                { label: 'Post-Reposo' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-[1.5px] border-black flex items-center justify-center"></div>
                                    <span className="text-[11px] font-bold uppercase">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time and Observations */}
                    <div className="space-y-6 pt-2">
                        <div className="grid grid-cols-3 gap-4 items-end">
                            <div className="flex items-end gap-2 border-b border-black pb-1">
                                <span className="text-xs font-bold italic">Hora:</span>
                                <span className="text-sm font-bold flex-1 px-2">_</span>
                            </div>
                            <div className="flex items-end gap-2 border-b border-black pb-1">
                                <span className="text-xs font-bold">Desde:</span>
                                <span className="text-sm font-bold flex-1 px-2">_</span>
                            </div>
                            <div className="flex items-end gap-2 border-b border-black pb-1">
                                <span className="text-xs font-bold">Hasta:</span>
                                <span className="text-sm font-bold flex-1 px-2">_</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <span className="text-xs font-black uppercase">Observaciones:</span>
                            <div className="mt-3 border-b border-black min-h-[80px] w-full relative">
                                <div className="absolute top-0 w-full h-full flex flex-col justify-between">
                                    <div className="border-b border-black/20 w-full h-[30px]"></div>
                                    <div className="border-b border-black/20 w-full h-[30px]"></div>
                                    <div className="border-b border-black/10 w-full h-[30px]"></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-20 pt-16">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full border-t border-black"></div>
                                <span className="text-[10px] font-bold uppercase">Supervisor</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 relative">
                                <div className="w-full border-t border-black"></div>
                                <span className="text-[10px] font-bold uppercase">Médico Ocupacional</span>
                            </div>
                        </div>

                        <div className="flex items-end gap-2 border-b border-black pb-1 w-fit min-w-[200px]">
                            <span className="text-xs font-bold">Fecha:</span>
                            <span className="text-sm font-bold px-4">{today}</span>
                        </div>
                    </div>
                </div>

                {/* CSS for print */}
                <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-form, #printable-form * {
              visibility: visible;
            }
            #printable-form {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 1.5px solid black !important;
              box-shadow: none !important;
            }
            .no-print, header, nav, aside {
              display: none !important;
            }
            @page {
              margin: 0;
              size: auto;
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
            }
          }
        `}</style>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 no-print shadow-sm">
                <div className="p-2 bg-amber-100 rounded-full h-fit">
                    <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <p className="text-sm font-black text-amber-900 mb-1 leading-tight">Formato Oficial de Salud Ocupacional</p>
                    <p className="text-xs text-amber-700 font-medium">Este formato está optimizado para impresión en tamaño carta. Asegúrese de que los márgenes del navegador estén en "Ninguno" o "Mínimo" para un resultado óptimo.</p>
                </div>
            </div>
        </div>
    );
}
