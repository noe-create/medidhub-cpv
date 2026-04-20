
import { OccupationalHealthManagement } from '@/components/occupational-health-management';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SaludOcupacionalPage() {
  const session = await getSession();
  if (session?.user?.role?.name !== 'Superusuario') {
    redirect('/dashboard');
  }
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <OccupationalHealthManagement />
    </div>
  );
}
