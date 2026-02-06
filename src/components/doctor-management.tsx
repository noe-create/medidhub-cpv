
'use client';

import * as React from 'react';
import type { User, Role } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, UserCog, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getUsers, createUser, updateUser, deleteUser } from '@/actions/auth-actions';
import { useDebounce } from '@/hooks/use-debounce';
import { useUser } from './app-shell';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

const UserForm = dynamic(() => import('./user-form').then(mod => mod.UserForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


interface DoctorManagementProps {
  roles: Role[];
}

const PAGE_SIZE = 20;

export function DoctorManagement({ roles }: DoctorManagementProps) {
  const { toast } = useToast();
  const currentUser = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [doctors, setDoctors] = React.useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = React.useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const doctorRoles = React.useMemo(() => roles.filter(r => r.hasSpecialty), [roles]);
  const doctorRoleIds = React.useMemo(() => doctorRoles.map(r => r.id), [doctorRoles]);

  const refreshDoctors = React.useCallback(async (currentSearch: string, page: number) => {
    setIsLoading(true);
    try {
      const { users: data, totalCount } = await getUsers(currentSearch, page, PAGE_SIZE);
      const filteredDoctors = data.filter(u => doctorRoleIds.includes(u.role.id));
      setDoctors(filteredDoctors);
      setTotalCount(filteredDoctors.length);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast({ title: 'Error de Permiso', description: error.message || 'No se pudieron cargar los doctores.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, doctorRoleIds]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshDoctors(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshDoctors]);

  const handleOpenForm = (user: User | null) => {
    if (user) {
      const userToEdit: User = {
        ...user,
        role: user.role || { id: (user as any).roleId, name: (user as any).roleName },
      };
      setSelectedDoctor(userToEdit);
    } else {
      setSelectedDoctor(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedDoctor(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedDoctor) {
        await updateUser(selectedDoctor.id, values);
        toast({ title: '¡Doctor Actualizado!', description: `El usuario ${values.username} ha sido guardado.` });
      } else {
        await createUser(values);
        toast({ title: '¡Doctor Creado!', description: `El usuario ${values.username} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshDoctors(debouncedSearch, 1);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el usuario.', variant: 'destructive' });
    }
  };

  const handleDeleteDoctor = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast({ title: '¡Usuario Eliminado!', description: 'El usuario ha sido eliminado.' });
      if (doctors.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await refreshDoctors(debouncedSearch, currentPage);
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  }

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'username', header: 'Username', cell: ({ row }) => <div className="font-mono">{row.original.username}</div> },
    { accessorKey: 'name', header: 'Nombre Asociado', cell: ({ row }) => row.original.name || <span className="text-muted-foreground">N/A</span> },
    { accessorKey: 'specialty.name', header: 'Especialidad', cell: ({ row }) => row.original.specialty?.name || <span className="text-muted-foreground">N/A</span> },
    { accessorKey: 'role.name', header: 'Rol', cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.role?.name}</Badge> },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === currentUser.id}>
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Editar</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario y su acceso al sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteDoctor(user.id)} className="bg-destructive hover:bg-destructive/90">
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
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">Doctores</h2>
        <p className="text-sm text-muted-foreground">
          Añada y gestione los usuarios de los doctores y sus especialidades.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <Input
          placeholder="Buscar por nombre de usuario o persona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-card"
        />
        <Button onClick={() => handleOpenForm(null)} className="rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Doctor
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card">
        <DataTable
          columns={columns}
          data={doctors}
          isLoading={isLoading}
          pageCount={Math.ceil(totalCount / PAGE_SIZE)}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          emptyState={{
            icon: Stethoscope,
            title: "No se encontraron doctores",
            description: "Puede crear el primer doctor usando el botón de arriba.",
          }}
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedDoctor ? 'Editar Doctor' : 'Crear Nuevo Doctor'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <UserForm
              user={selectedDoctor}
              roles={doctorRoles}
              onSubmitted={handleFormSubmitted}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
