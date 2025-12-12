
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
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <UserCog className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Administre cuentas de usuario, roles y permisos de acceso.</p>
        </div>
      </div>
      <UserManagement roles={roles} />
    </div>
  );
}
