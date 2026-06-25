import * as React from 'react';
import { PatientSearchViewer } from '@/components/patient-search-viewer';
import { authorize } from '@/lib/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Buscador de Pacientes | MEDIHUB',
    description: 'Búsqueda general de todas las personas registradas en el sistema y sus datos detallados',
};

export default async function BuscadorPacientesPage() {
    await authorize('people.manage');

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 pl-4">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Directorio General</h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
                    Utilice este buscador para encontrar rápidamente el perfil completo de cualquier persona registrada en el sistema.
                </p>
            </div>

            <PatientSearchViewer />
        </div>
    );
}
