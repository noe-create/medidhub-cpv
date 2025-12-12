import { Cie10Management } from '@/components/cie10-management';

import { BookOpen } from 'lucide-react';

export default function Cie10Page() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            Gestión de Códigos CIE-10
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Catálogo internacional de enfermedades y diagnósticos.</p>
        </div>
      </div>
      <Cie10Management />
    </div>
  );
}
