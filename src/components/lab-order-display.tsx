

'use client';

import * as React from 'react';
import type { LabOrder } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentHeader } from './document-header';

interface LabOrderDisplayProps {
  order?: any;
}

export function LabOrderDisplay({ order }: LabOrderDisplayProps) {
  const [age, setAge] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Calculate age on the client-side to avoid hydration mismatch
    if (order?.paciente?.fechaNacimiento) {
      setAge(calculateAge(order.paciente.fechaNacimiento));
    }
  }, [order?.paciente?.fechaNacimiento]);

  const ageString = age !== null ? `${age} Año(s)` : '          ';

  return (
    <div className="h-full text-sm">
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="p-4 printable-content flex flex-col h-full">
        <div className="flex items-center px-8">
          <img src="/recipe/logo.png" alt="Logo Salud Integral Izquierda" style={{ height: '80px' }} />
          <div className="flex-grow">
            <DocumentHeader />
          </div>
          <img src="/recipe/logo_si.png" alt="Logo Salud Integral Derecha" style={{ height: '80px' }} />
        </div>

        <div className="text-center my-2">
          <h2 className="font-semibold text-base">Orden de Laboratorio</h2>
        </div>

        <section className="border-y border-black py-2">
          <h3 className="font-bold text-center mb-2">Datos del Paciente:</h3>
          <div className="grid grid-cols-2 gap-x-4">
            <p><strong>Historia:</strong> {order?.pacienteId?.replace(/\D/g, '').slice(-6) || '____________________'}</p>
            <p><strong>Fecha Orden:</strong> {order?.orderDate ? format(order.orderDate, 'dd/MM/yyyy') : '____________________'}</p>
            <p><strong>Ingreso:</strong> {order?.consultationId?.slice(-6) || '____________________'}</p>
            <p><strong>Sexo:</strong> {order?.paciente?.genero || '__________'}</p>
            <p><strong>Cédula:</strong> {order?.paciente?.cedula || '____________________'}</p>
            <p><strong>Edad:</strong> {ageString}</p>
            <p><strong>Nombre:</strong> {order?.paciente?.nombreCompleto || '________________________________________________'}</p>
            <p><strong>Área / Departamento:</strong> {(order?.paciente as any)?.departamento || '____________________'}</p>
          </div>
        </section>

        <div className="flex-grow text-sm mt-4">
          <section>
            <h4 className="font-bold underline">IMPRESIÓN DIAGNÓSTICA Y PLAN</h4>
            <p><strong>Diagnóstico:</strong> {order?.diagnosticoPrincipal || ''}</p>
            <p><strong>Plan:</strong> {order?.treatmentPlan || ''}</p>
            {!order && <div className="h-12 border-b border-dashed border-slate-300 mt-4 mb-2"></div>}
            {!order && <div className="h-12 border-b border-dashed border-slate-300 mb-2"></div>}
          </section>

          <div className="border-t border-black my-4"></div>

          <div>
            <h4 className="font-bold underline">EXÁMENES SOLICITADOS</h4>
            {order?.tests && order.tests.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-black columns-3 mt-2">
                {order.tests.map((test: any, index: number) => (
                  <li key={index}>{test}</li>
                ))}
              </ul>
            ) : (
              <div className="w-full mt-4 flex flex-col gap-8">
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col items-center text-sm pt-24 pb-8 mt-auto">
          <div className="w-48 border-b border-black"></div>
          <p className="font-semibold mt-1">Firma del Médico</p>
        </footer>
      </div>
    </div>
  );
}
