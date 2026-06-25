

'use client';

import * as React from 'react';
import type { Empresa } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '@/actions/patient-actions';
import { useUser } from './app-shell';
import { useDebounce } from '@/hooks/use-debounce';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';

const CompanyForm = dynamic(() => import('./company-form').then(mod => mod.CompanyForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 10;

export function CompanyManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = React.useState<Empresa | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const canCreate = [1, 2].includes(Number(user.role.id)) || ['Superusuario', 'Admin'].includes(user.role.name);

  const refreshEmpresas = React.useCallback(async (currentSearch: string, page: number) => {
    setIsLoading(true);
    try {
      const { empresas: empresasData, totalCount: count } = await getEmpresas(currentSearch, page, PAGE_SIZE);
      setEmpresas(empresasData);
      setTotalCount(count);
    } catch (error) {
      console.error("Error al cargar las empresas:", error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las empresas. Por favor, intente de nuevo.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshEmpresas(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshEmpresas]);

  const handleOpenForm = (empresa: Empresa | null) => {
    setSelectedEmpresa(empresa);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedEmpresa(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedEmpresa) {
        const updated = await updateEmpresa({ ...values, id: selectedEmpresa.id });
        toast({ title: '¡Empresa Actualizada!', description: `${updated.name} ha sido guardada.` });
      } else {
        const created = await createEmpresa(values);
        toast({ title: '¡Empresa Creada!', description: `${created.name} ha sido añadida.` });
      }
      handleCloseDialog();
      await refreshEmpresas(search, 1);
    } catch (error: any) {
      console.error("Error al guardar empresa:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la empresa.', variant: 'destructive' });
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    try {
      await deleteEmpresa(id);
      toast({ title: '¡Empresa Eliminada!', description: 'La empresa ha sido eliminada correctamente.' });
      if (empresas.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await refreshEmpresas(search, currentPage);
      }
    } catch (error: any) {
      console.error("Error al eliminar empresa:", error);
      toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar la empresa.', variant: 'destructive' });
    }
  }

  const columns: ColumnDef<Empresa>[] = [
    {
      id: "logo",
      header: "",
      cell: () => (
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
          <Building2 className="h-5 w-5 text-muted-foreground/80" />
        </div>
      )
    },
    { accessorKey: "name", header: "Nombre", cell: ({ row }: { row: any }) => <div className="font-semibold text-foreground/90">{row.original.name}</div> },
    { accessorKey: "rif", header: "RIF", cell: ({ row }: { row: any }) => <div className="font-mono text-muted-foreground text-xs bg-muted px-2 py-1 rounded-md w-fit">{row.original.rif}</div> },
    { accessorKey: "telefono", header: "Teléfono", cell: ({ row }: { row: any }) => <div className="text-muted-foreground">{row.original.telefono}</div> },
    { accessorKey: "direccion", header: "Dirección", cell: ({ row }: { row: any }) => <div className="max-w-xs truncate text-muted-foreground text-xs" title={row.original.direccion}>{row.original.direccion}</div> },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => {
        const empresa = row.original;
        if (!canCreate) return null;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(empresa)} className="h-8 w-8 text-muted-foreground/80 hover:text-primary hover:bg-blue-50 rounded-full">
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/80 hover:text-red-600 hover:bg-red-50 rounded-full">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar Empresa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteEmpresa(empresa.id)} className="bg-destructive hover:bg-destructive/90">
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

  return (
    <>
      <div className="space-y-8 min-h-[calc(100vh-10rem)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-violet-600 to-indigo-500 p-8 rounded-3xl shadow-lg relative overflow-hidden mb-8">
          <div className="relative z-10 text-white">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <Building2 className="h-8 w-8 text-white/80" />
              Empresas
            </h2>
            <p className="text-violet-100 mt-2 font-medium text-lg">Gestión de empresas y entidades corporativas afiliadas.</p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <Input
                placeholder="Buscar empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-xl border-0 bg-white/10 text-white placeholder:text-white/60 focus:bg-white/20 transition-all h-12"
              />
            </div>
            {canCreate && (
              <Button onClick={() => handleOpenForm(null)} className="bg-white text-violet-600 hover:bg-white/90 font-extrabold rounded-xl h-12 px-6 shadow-sm border-0">
                <PlusCircle className="mr-2 h-5 w-5" />
                Añadir Empresa
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden">
          <DataTable
            columns={columns}
            data={empresas}
            isLoading={isLoading}
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: Building2,
              title: "No se han encontrado empresas",
              description: "Puede crear la primera empresa usando el botón de arriba.",
            }}
          />
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-extrabold">{selectedEmpresa ? 'Editar Empresa' : 'Crear Nueva Empresa'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <CompanyForm
              empresa={selectedEmpresa}
              onSubmitted={handleFormSubmitted}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
