

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, KeyRound, User as UserIcon, Shield, GraduationCap, UserSquare } from 'lucide-react';
import type { User, Role, Persona, Specialty } from '@/lib/types';
import { getSpecialties } from '@/actions/specialty-actions';
import { useUser } from './app-shell';

const baseSchema = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario es requerido (mínimo 3 caracteres).' }),
  name: z.string().optional(),
  roleId: z.string({ required_error: 'El rol es requerido.' }),
  specialtyId: z.string().optional(),
});

const createUserSchema = baseSchema.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

const updateUserSchema = baseSchema.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});


interface UserFormProps {
  user: User | null;
  roles: Role[];
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ user, roles, onSubmitted, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const currentUser = useUser();
  
  const form = useForm({
    resolver: zodResolver(user ? updateUserSchema : createUserSchema),
    defaultValues: {
        username: user?.username || '',
        name: user?.name || '',
        roleId: user?.role?.id,
        specialtyId: user?.specialty?.id,
        password: '',
        confirmPassword: '',
    },
  });

  React.useEffect(() => {
    async function loadSpecialties() {
        try {
            const data = await getSpecialties();
            setSpecialties(data);
        } catch (e) {
            console.error("Failed to load specialties", e);
        }
    }
    loadSpecialties();
  }, [])
  
  const roleId = form.watch('roleId');
  const selectedRole = roles.find(r => r.id === roleId);

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    const dataToSubmit = { ...values };
    if (!dataToSubmit.password) {
        delete dataToSubmit.password;
    }
    delete dataToSubmit.confirmPassword;
    
    await onSubmitted(dataToSubmit);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground"/>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="ej. drsmith" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><UserSquare className="h-4 w-4 text-muted-foreground"/>Nombre Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Dr. John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
             <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground"/>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role.id} value={role.id} disabled={role.name === 'Superusuario' && currentUser.role.name !== 'Superusuario'}>
                            {role.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            {selectedRole?.hasSpecialty && (
                <FormField
                    control={form.control}
                    name="specialtyId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground"/>Especialidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione una especialidad" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {specialties.map(s => (
                                <SelectItem key={s.id} value={s.id} className="capitalize">{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground"/>Contraseña</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder={user ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground"/>Confirmar Contraseña</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
