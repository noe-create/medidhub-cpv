import { CompanyManagement } from '@/components/company-management';

import { Building2 } from 'lucide-react';

export default function EmpresasPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-muted/500/10 rounded-lg">
              <Building2 className="h-8 w-8 text-foreground/80 dark:text-muted-foreground/80" />
            </div>
            Gestión de Empresas
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Administre las empresas y convenios corporativos.</p>
        </div>
      </div>
      <CompanyManagement />
    </div>
  );
}
