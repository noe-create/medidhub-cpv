

'use client';

import * as React from 'react';
import type { User, Role } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, UserCog } from 'lucide-react';
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
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { calculateAge } from '@/lib/utils';

const UserForm = dynamic(() => import('./user-form').then(mod => mod.UserForm), {
  loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


interface UserManagementProps {
  roles: Role[];
}

const PAGE_SIZE = 20;

export function UserManagement({ roles }: UserManagementProps) {
  const { toast } = useToast();
  const currentUser = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const refreshUsers = React.useCallback(async (currentSearch: string, page: number) => {
    setIsLoading(true);
    try {
      const { users: data, totalCount } = await getUsers(currentSearch, page, PAGE_SIZE);
      setUsers(data);
      setTotalCount(totalCount);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({ title: 'Error de Permiso', description: error.message || 'No se pudieron cargar los usuarios.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    refreshUsers(debouncedSearch, currentPage);
  }, [debouncedSearch, currentPage, refreshUsers]);

  const handleOpenForm = (user: User | null) => {
    if (user) {
      // Ensure the user object is well-formed before setting state
      const userToEdit: User = {
        ...user,
        role: user.role || { id: (user as any).roleId, name: (user as any).roleName },
      };
      setSelectedUser(userToEdit);
    } else {
      setSelectedUser(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, values);
        toast({ title: '¡Usuario Actualizado!', description: `El usuario ${values.username} ha sido guardado.` });
      } else {
        await createUser(values);
        toast({ title: '¡Usuario Creado!', description: `El usuario ${values.username} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshUsers(debouncedSearch, 1);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar el usuario.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast({ title: '¡Usuario Eliminado!', description: 'El usuario ha sido eliminado.' });
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await refreshUsers(debouncedSearch, currentPage);
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: 'Usuario',
      cell: ({ row }: { row: any }) => {
        const user = row.original;
        const initials = user.name
          ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
          : user.username.substring(0, 2).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-extrabold text-xs ring-2 ring-white border border-border/50">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-foreground/90">{user.username}</div>
              <div className="text-xs text-muted-foreground/80">{user.name || 'Sin nombre'}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'fechaNacimiento',
      header: 'F. Nacimiento / Edad',
      cell: ({ row }: { row: any }) => {
        const user = row.original;
        if (!user.fechaNacimiento) return <span className="text-muted-foreground text-xs italic">No registrada</span>;
        
        const date = new Date(user.fechaNacimiento);
        const age = calculateAge(date);
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-xs">{new Date(user.fechaNacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5 uppercase tracking-tighter">
                {age} años
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'role.name',
      header: 'Rol',
      cell: ({ row }: { row: any }) => (
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 shadow-none font-extrabold px-2.5 py-0.5 rounded-full capitalize">
          {row.original.role?.name}
        </Badge>
      )
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => {
        const user = row.original;
        const isSuperuserRole = user.role.name === 'Superusuario';
        const isCurrentUserSuperuser = currentUser.role.name === 'Superusuario';

        const canDelete = user.id !== currentUser.id && (!isSuperuserRole || isCurrentUserSuperuser);
        const canEdit = (!isSuperuserRole || isCurrentUserSuperuser);

        return (
          <div className="flex justify-end gap-2">
            {canEdit && (
              <Button variant="ghost" size="icon" onClick={() => handleOpenForm(user)} className="h-8 w-8 text-muted-foreground/80 hover:text-primary hover:bg-blue-50 rounded-full">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/80 hover:text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-8 min-h-[calc(100vh-10rem)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-indigo-600 to-blue-500 p-8 rounded-3xl shadow-lg relative overflow-hidden mb-8">
          <div className="relative z-10 text-white">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <UserCog className="h-8 w-8 text-white/80" />
              Gestión de Usuarios
            </h2>
            <p className="text-blue-100 mt-2 font-medium text-lg">Administre el acceso y roles del personal médico y administrativo.</p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <Input
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-xl border-0 bg-white/10 text-white placeholder:text-white/60 focus:bg-white/20 transition-all h-12"
              />
            </div>
            <Button onClick={() => handleOpenForm(null)} className="bg-white text-indigo-600 hover:bg-white/90 font-extrabold rounded-xl h-12 px-6 shadow-sm border-0">
              <PlusCircle className="mr-2 h-5 w-5" />
              Crear Usuario
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            emptyState={{
              icon: UserCog,
              title: "No se encontraron usuarios",
              description: "Puede crear el primer usuario usando el botón de arriba.",
            }}
          />
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-extrabold">{selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <UserForm
              user={selectedUser}
              roles={roles}
              onSubmitted={handleFormSubmitted}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
