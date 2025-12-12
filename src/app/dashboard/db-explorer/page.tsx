
import { DatabaseExplorer } from '@/components/database-explorer';
import { authorize } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DbExplorerPage() {
  try {
    await authorize('database.view');
  } catch (error) {
    redirect('/dashboard');
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Explorador de Base de Datos</h2>
      </div>
      <DatabaseExplorer />
    </div>
  );
}
