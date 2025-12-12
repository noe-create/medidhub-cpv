import { ServiceCatalogManagement } from "@/components/service-catalog-management";

import { Receipt } from 'lucide-react';

export default function ServiciosPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Receipt className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            Catálogo de Servicios
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Gestione los servicios médicos y sus tarifas asociadas.</p>
        </div>
      </div>
      <ServiceCatalogManagement />
    </div>
  );
}
