

'use client';

import * as React from 'react';
import type { Titular } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { getTitulares, createTitular, updateTitular, deleteTitular } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useUser } from './app-shell';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const PatientForm = dynamic(() => import('./patient-form').then(mod => mod.PatientForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 20;

export function PatientManagement() {
  const { toast } = useToast();
  const router = useRouter();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [titulares, setTitulares] = React.useState<Titular[]>([]);
  const [selectedTitular, setSelectedTitular] = React.useState<Titular | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const canManage = ['superuser', 'administrator', 'asistencial'].includes(user.role.id);

  const refreshTitulares = React.useCallback(async (currentSearch: string, page: number) => {
    setIsLoading(true);
    try {
      const { titulares: titularesData, totalCount: count } = await getTitulares(currentSearch, page, PAGE_SIZE);
      setTitulares(titularesData.map(t => ({ ...t, persona: { ...t.persona, fechaNacimiento: new Date(t.persona.fechaNacimiento) } })));
      setTotalCount(count);
    } catch (error) {
      console.error("Error al buscar titulares:", error);
      toast({ title: 'Error de Búsqueda', description: 'No se pudieron buscar los titulares.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  React.useEffect(() => {
    refreshTitulares(search, currentPage);
  }, [search, currentPage, refreshTitulares]);

  const handleOpenForm = (titular: Titular | null) => {
    setSelectedTitular(titular);
    setIsFormOpen(true);
  };

  const handleFormSubmitted = async (arg1: any, arg2?: string, arg3?: any) => {
    try {
      if (selectedTitular) { // Editing
        await updateTitular(arg1, arg2!, arg3);
        toast({ title: '¡Titular Actualizado!', description: `${arg3.primerNombre} ${arg3.primerApellido} ha sido guardado.` });
      } else { // Creating
        await createTitular(arg1);
        const personaName = arg1.persona ? `${arg1.persona.primerNombre} ${arg1.persona.primerApellido}` : 'La persona seleccionada';
        toast({ title: '¡Rol de Titular Creado!', description: `${personaName} ahora es titular.` });
      }
      handleCloseDialog();
      await refreshTitulares(search, 1);
    } catch (error: any) {
      console.error("Error al guardar titular:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el titular. Verifique que la cédula o email no estén duplicados.', variant: 'destructive' });
    }
  };

  const handleDeleteTitular = async (id: string) => {
    try {
      await deleteTitular(id);
      toast({ title: '¡Rol de Titular Eliminado!', description: 'El rol de titular ha sido eliminado.' });
      if (titulares.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await refreshTitulares(search, currentPage);
      }
    } catch (error: any) {
      console.error("Error al eliminar titular:", error);
      toast({ title: 'Error', description: 'No se pudo eliminar el rol de titular.', variant: 'destructive' });
    }
  }

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedTitular(null);
  }

  const columns: ColumnDef<Titular>[] = [
    { accessorKey: "persona.nombreCompleto", header: "Nombre Completo", cell: ({ row }) => <div className="font-medium">{row.original.persona.nombreCompleto}</div> },
    { accessorKey: "persona.cedula", header: "Cédula" },
    { accessorKey: "persona.email", header: "Email" },
    {
      accessorKey: "unidadServicio",
      header: "Unidad/Servicio",
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="max-w-xs truncate bg-blue-100/10 text-blue-500 border-blue-500/20 hover:bg-blue-100/20 font-extrabold rounded-lg px-3 py-1">{row.original.unidadServicio}</Badge>
        </div>
      )
    },
    { accessorKey: "beneficiariosCount", header: "Benef.", cell: ({ row }) => <div className="text-center">{row.original.beneficiariosCount}</div> },
    {
      id: "actions",
      cell: ({ row }) => {
        const titular = row.original;
        return (
          <div className="text-right">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  {canManage && (
                    <DropdownMenuItem onClick={() => handleOpenForm(titular)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/pacientes/${titular.id}/beneficiarios`)}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Gestionar Beneficiarios</span>
                  </DropdownMenuItem>
                  {canManage && (
                    <>
                      <DropdownMenuSeparator />
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará el rol de titular para esta persona.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteTitular(titular.id)} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      }
    }
  ];

  const excludeIds = titulares.map(t => t.personaId);

  return (
    <>
      <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Gestión de Titulares
            </h2>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Administración de titulares y grupos familiares.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-80">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <Input
                placeholder="Buscar por nombre, cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-full bg-muted/50 border-input focus:bg-card focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            {canManage && (
              <Button onClick={() => handleOpenForm(null)} className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 flex-1 sm:flex-none">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Titular
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={titulares}
          isLoading={isLoading}
          pageCount={Math.ceil(totalCount / PAGE_SIZE)}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          emptyState={{
            icon: Users,
            title: "No se encontraron titulares",
            description: "Puede crear un nuevo titular usando el botón de arriba.",
          }}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTitular ? 'Editar Titular' : 'Crear Nuevo Titular'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <PatientForm
              titular={selectedTitular}
              onSubmitted={handleFormSubmitted}
              onCancel={handleCloseDialog}
              excludeIds={excludeIds}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
