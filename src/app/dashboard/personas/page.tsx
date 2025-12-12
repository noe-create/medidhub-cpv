import { PeopleList } from '@/components/people-list';

import { Users } from 'lucide-react';

export default async function PersonasPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500 opacity-80" />
            Personas
          </h2>
          <p className="text-secondary-foreground/90 mt-1 font-medium">Gestión centralizada de pacientes, doctores y personal.</p>
        </div>
      </div>
      <PeopleList />
    </div>
  );
}
