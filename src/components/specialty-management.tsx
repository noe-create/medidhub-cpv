'use client';

import * as React from 'react';
import type { Specialty } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty } from '@/actions/specialty-actions';
import { useDebounce } from '@/hooks/use-debounce';
import { useUser } from './app-shell';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable, type ColumnDef } from './ui/data-table';

const SpecialtyForm = dynamic(() => import('./specialty-form').then(mod => mod.SpecialtyForm), {
  loading: () => <div className="p-8"><Skeleton className="h-24 w-full" /></div>,
});


const PAGE_SIZE = 10;

export function SpecialtyManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<Specialty | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const canManage = user.role.id === 'superuser' || user.role.id === 'administrator';

  const refreshSpecialties = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
    try {
      // For DataTable, we don't need to manage pagination state here, it will do it.
      // But let's fetch all for simplicity, or implement server-side pagination for DataTable later.
      const data = await getSpecialties(currentSearch);
      setSpecialties(data);
      setTotalCount(data.length); // This might need adjustment if server-side pagination is added.
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshSpecialties(debouncedSearch);
  }, [debouncedSearch, refreshSpecialties]);

  const handleOpenForm = (specialty: Specialty | null) => {
    setSelectedSpecialty(specialty);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedSpecialty(null);
  };

  const handleFormSubmitted = async (values: { name: string }) => {
    try {
      if (selectedSpecialty) {
        await updateSpecialty(selectedSpecialty.id, values);
        toast({ title: '¡Especialidad Actualizada!', description: `La especialidad ${values.name} ha sido guardada.` });
      } else {
        await createSpecialty(values);
        toast({ title: '¡Especialidad Creada!', description: `La especialidad ${values.name} ha sido añadida.` });
      }
      handleCloseDialog();
      await refreshSpecialties(debouncedSearch);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpecialty(id);
      toast({ title: '¡Especialidad Eliminada!', description: 'La especialidad ha sido eliminada.' });
      await refreshSpecialties(debouncedSearch);
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  };

  const columns: ColumnDef<Specialty>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre de la Especialidad',
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const specialty = row.original;
        if (!canManage) return null;
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
                  <DropdownMenuItem onClick={() => handleOpenForm(specialty)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Editar</span>
                  </DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. No podrá eliminar especialidades que estén en uso.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(specialty.id)} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Especialidades</CardTitle>
          <CardDescription>Añada y gestione las especialidades médicas para los doctores.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {canManage && (
              <Button onClick={() => handleOpenForm(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Especialidad
              </Button>
            )}
          </div>
          <DataTable
            columns={columns}
            data={specialties}
            isLoading={isLoading}
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: GraduationCap,
              title: "No hay especialidades definidas",
              description: "Puede crear la primera especialidad usando el botón de arriba.",
            }}
          />
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedSpecialty ? 'Editar Especialidad' : 'Crear Nueva Especialidad'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <SpecialtyForm specialty={selectedSpecialty} onSubmitted={handleFormSubmitted} onCancel={handleCloseDialog} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
