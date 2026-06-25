'use client';

import { PatientManagement } from '@/components/patient-management';

import { Users } from 'lucide-react';

export default function PacientesPage() {
  return (
    <div className="flex-1 space-y-4">
      <PatientManagement />
    </div>
  );
}
