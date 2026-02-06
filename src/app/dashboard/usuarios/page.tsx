
import { UserManagement } from '@/components/user-management';
import { getRoles } from '@/actions/security-actions';
import { authorize } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { UserCog } from 'lucide-react';

export default async function UsuariosPage() {
  try {
    await authorize('users.manage');
  } catch (error) {
    redirect('/dashboard');
  }

  const roles = await getRoles();

  return (
    <div className="flex-1 space-y-6">
      <UserManagement roles={roles} />
    </div>
  );
}
