

'use client';

import * as React from 'react';
import type { Role, Permission } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, Pencil, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getRoles, createRole, updateRole, deleteRole, getAllPermissions, getRoleWithPermissions } from '@/actions/security-actions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const RoleForm = dynamic(() => import('./role-form').then(mod => mod.RoleForm), {
  loading: () => <div className="p-8"><Skeleton className="h-96 w-full" /></div>,
});


export function RoleManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = React.useState<Role & { permissions?: string[] } | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const refreshData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([getRoles(), getAllPermissions()]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudieron cargar los datos de seguridad.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOpenForm = async (role: Role | null) => {
    if (role) {
      const roleWithPerms = await getRoleWithPermissions(role.id);
      setSelectedRole(roleWithPerms);
    } else {
      setSelectedRole(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  const handleFormSubmitted = async (values: any) => {
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, values);
        toast({ title: '¡Rol Actualizado!', description: `El rol ${values.name} ha sido guardado.` });
      } else {
        await createRole(values);
        toast({ title: '¡Rol Creado!', description: `El rol ${values.name} ha sido añadido.` });
      }
      handleCloseDialog();
      await refreshData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      toast({ title: '¡Rol Eliminado!', description: 'El rol ha sido eliminado.' });
      await refreshData();
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Roles de Seguridad
            </h2>
            <p className="text-muted-foreground mt-1">Defina los niveles de autorización y capacidades para los usuarios.</p>
          </div>
          <Button onClick={() => handleOpenForm(null)} className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 px-6">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Rol
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : roles.length > 0 ? (
          <div className="rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-transparent">
                  <TableHead className="font-extrabold text-foreground/90 pl-6 h-12">Rol</TableHead>
                  <TableHead className="font-extrabold text-foreground/90 h-12">Descripción / Alcance</TableHead>
                  <TableHead className="text-right w-[120px] font-extrabold text-foreground/90 pr-6 h-12">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {roles.map((role) => (
                    <motion.tr
                      key={role.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                      className="hover:bg-blue-50/30 border-border/50"
                    >
                      <TableCell className="font-semibold text-foreground/90 pl-6 align-top py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="align-top py-4">
                        <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                        {/* Simulated Permissions Chips - In a real app, map role.permissions here */}
                        <div className="flex flex-wrap gap-1.5">
                          {['Ver', 'Editar', 'Exportar'].map(p => (
                            <span key={p} className="px-2 py-0.5 rounded-md border border-border bg-muted/50 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              {p}
                            </span>
                          ))}
                          {role.name === 'Superusuario' && (
                            <span className="px-2 py-0.5 rounded-md border border-violet-200 bg-violet-50 text-[10px] text-violet-600 font-medium uppercase tracking-wide">
                              Control Total
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 align-top py-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(role)} className="h-8 w-8 text-muted-foreground/80 hover:text-primary hover:bg-blue-50 rounded-full">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {role.name !== 'Superusuario' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/80 hover:text-red-600 hover:bg-red-50 rounded-full">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar Rol?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRole(role.id)} className="bg-destructive hover:bg-destructive/90">
                                    Sí, eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-muted/50 rounded-2xl border border-border/50">
            <div className="bg-card p-4 rounded-full shadow-sm mb-4">
              <Shield className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/90">No se han encontrado roles</h3>
            <p className="text-sm text-muted-foreground">Añada un nuevo rol para comenzar.</p>
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
          </DialogHeader>
          {isFormOpen && (
            <RoleForm
              role={selectedRole}
              allPermissions={permissions}
              onSubmitted={handleFormSubmitted}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
