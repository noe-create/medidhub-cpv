

'use client';

import * as React from 'react';
import type { Consultation } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentHeader } from './document-header';

interface MedicalReportDisplayProps {
  consultation?: any;
}

export function MedicalReportDisplay({ consultation }: MedicalReportDisplayProps) {
  const paciente = consultation?.paciente;
  const [ageString, setAgeString] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (paciente?.fechaNacimiento) {
      const age = calculateAge(paciente.fechaNacimiento);
      setAgeString(`${age} Año(s)`);
    }
  }, [paciente?.fechaNacimiento]);

  const getConsultationType = () => {
    const serviceType = (paciente as any)?.serviceType;
    switch (serviceType) {
      case 'consulta pediatrica':
        return 'CONSULTA PEDIATRICA';
      case 'medicina familiar':
        return 'CONSULTA DE MEDICINA FAMILIAR';
      case 'servicio de enfermeria':
        return 'INFORME DE ENFERMERÍA';
      case 'salud ocupacional':
        return 'INFORME DE SALUD OCUPACIONAL';
      default:
        return 'INFORME MÉDICO';
    }
  }

  const getVitalSignValue = (value: any, unit: string = '') => {
    return value !== undefined && value !== null && value !== '' ? `${value}${unit}` : '          ';
  }

  const sv = consultation?.signosVitales;

  return (
    <div className="printable-area bg-white">
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
          <h2 className="font-semibold text-base">Informe Medico</h2>
        </div>

        <section className="border-y border-black py-2">
          <h3 className="font-bold text-center mb-2">Datos del Paciente:</h3>
          <div className="grid grid-cols-2 gap-x-4 text-sm">
            <p><strong>Historia:</strong> {String(paciente?.id || '').replace(/\D/g, '').slice(-6) || '____________________'}</p>
            <p><strong>Fecha:</strong> {consultation?.consultationDate ? format(consultation.consultationDate, 'dd/MM/yyyy') : '____________________'}</p>
            <p><strong>Ingreso:</strong> {String(consultation?.waitlistId || '').slice(-6) || '____________________'}</p>
            <p><strong>Sexo:</strong> {paciente?.genero || '__________'}</p>
            <p><strong>Cédula:</strong> {paciente?.cedula || '____________________'}</p>
            <p><strong>Edad:</strong> {ageString || '__________'}</p>
            <p className="col-span-2"><strong>Nombre:</strong> {paciente?.nombreCompleto || '________________________________________________'}</p>
          </div>
        </section>

        <div className="flex-grow text-sm">
          <h3 className="font-bold text-center my-2">{getConsultationType()}</h3>

          <section>
            <h4 className="font-bold underline">EXAMEN FISICO</h4>
            <div className="grid grid-cols-3 gap-x-4 my-1">
              <p><strong>PA EN MMHG:</strong> {getVitalSignValue(sv?.taSistolica)}/{getVitalSignValue(sv?.taDiastolica)}</p>
              <p><strong>RESP X MIM:</strong> {getVitalSignValue(sv?.fr)}</p>
              <p><strong>LAT X MIM:</strong> {getVitalSignValue(sv?.fc)}</p>
            </div>
            <p className="whitespace-pre-wrap">{consultation?.examenFisicoGeneral}</p>
            {!consultation && <div className="h-24"></div>}
          </section>

          <section className="mt-2">
            <h4 className="font-bold underline mb-1">IMPRESIÓN DIAGNÓSTICA</h4>
            {consultation?.diagnoses?.map((d: any) => (
              <p key={d.cie10Code}>- {d.cie10Description}</p>
            ))}
            {!consultation && <div className="h-16"></div>}
          </section>

          <section className="mt-2">
            <h4 className="font-bold underline mb-1">TRATAMIENTO INDICADO</h4>
            <div className="prose prose-sm max-w-none prose-ul:my-0 prose-li:my-0">
              <p>{consultation?.treatmentPlan}</p>
              {consultation?.treatmentOrder && (
                <ul>
                  {consultation.treatmentOrder.items.map((item: any) => (
                    <li key={item.id}>{item.medicamentoProcedimiento}</li>
                  ))}
                </ul>
              )}
              {!consultation && <div className="h-24"></div>}
            </div>
          </section>

          {consultation?.reposo && (
            <section className="mt-2">
              <h4 className="font-bold underline mb-1">REPOSO</h4>
              <p>{consultation.reposo}</p>
            </section>
          )}
        </div>

        <footer className="flex flex-col items-center text-sm pt-24 pb-8 mt-auto">
          <div className="w-48 border-b border-black"></div>
          <p className="font-semibold mt-1">Firma del Médico</p>
        </footer>
      </div>
    </div>
  );
}
