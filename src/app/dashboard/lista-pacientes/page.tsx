import { PatientListView } from '@/components/patient-list-view';

import { ClipboardList } from 'lucide-react';

export default async function ListaPacientesPage() {
  return (
    <div className="flex-1 space-y-6">
      <PatientListView />
    </div>
  );
}
