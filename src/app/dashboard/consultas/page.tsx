import { ConsultationHistoryList } from '@/components/consultation-history-list';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ConsultasHistoryPage() {
  const session = await getSession();
  
  // Allow all clinical and admin roles to see history
  const allowedRoles = ['Superusuario', 'Admin', 'Dra. Pediatra', 'Dra. Familiar', 'Enfermera'];
  if (!session.isLoggedIn || !allowedRoles.includes(session.user?.role.name || '')) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <ConsultationHistoryList />
    </div>
  );
}
