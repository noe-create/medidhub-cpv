

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, KeyRound, User as UserIcon, Shield, GraduationCap, UserSquare, CalendarDays } from 'lucide-react';
import type { User, Role, Persona, Specialty } from '@/lib/types';
import { getSpecialties } from '@/actions/specialty-actions';
import { useUser } from './app-shell';
import { calculateAge } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { useFormDraft } from '@/hooks/use-form-draft';

const baseSchema = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario es requerido (mínimo 3 caracteres).' }),
  name: z.string().optional(),
  roleId: z.string({ required_error: 'El rol es requerido.' }),
  specialtyId: z.string().optional(),
  fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
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
  
  const initialDate = React.useMemo(() => {
    // Robustly handle both naming conventions (camelCase from mapped results, snake_case from raw DB)
    const dateValue = (user as any)?.fechaNacimiento || (user as any)?.fecha_nacimiento;
    if (!dateValue) return undefined;
    
    let d = new Date(dateValue);
    // If invalid, try DD/MM/YYYY
    if (isNaN(d.getTime()) && typeof dateValue === 'string' && dateValue.includes('/')) {
        const [day, month, year] = dateValue.split('/').map(Number);
        d = new Date(Date.UTC(year, month - 1, day));
    }
    
    if (isNaN(d.getTime())) return undefined;
    // Normalize to UTC midnight for consistent triple-select behavior
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }, [user]);

  const form = useForm({
    resolver: zodResolver(user ? updateUserSchema : createUserSchema),
    defaultValues: {
        username: user?.username || '',
        name: user?.name || '',
        roleId: user?.role?.id,
        specialtyId: user?.specialty?.id,
        fechaNacimiento: initialDate,
        password: '',
        confirmPassword: '',
    },
  });

  const { clearDraft } = useFormDraft(
      form, 
      user ? `edit-user-${user.id}` : 'new-user',
      !user // Only enable drafts for NEW records
  );

  // Removed redundant effects to prevent race conditions.
  // Re-initialization is handled by defaultValues + parent 'key' prop.

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
  const fechaNacimiento = form.watch('fechaNacimiento');

  const years = React.useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    const arr = [];
    for (let i = currentYear; i >= 1900; i--) arr.push(i);
    return arr;
  }, []);

  const months = [
    { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' }, { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' }, { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' },
  ];

  const days = React.useMemo(() => {
    const arr = [];
    for (let i = 1; i <= 31; i++) arr.push(i);
    return arr;
  }, []);

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    const dataToSubmit = { ...values };
    
    // Ensure the date is sent as a UTC ISO string
    if (dataToSubmit.fechaNacimiento) {
        const d = dataToSubmit.fechaNacimiento;
        dataToSubmit.fechaNacimiento = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
    }

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
                name="fechaNacimiento"
                render={({ field }) => {
                    // Ensure we have a valid Date object regardless if field.value is a Date or a string
                    let valueAsDate: any = field.value;
                    if (typeof valueAsDate === 'string' && valueAsDate) {
                        let d = new Date(valueAsDate);
                        if (isNaN(d.getTime()) && valueAsDate.includes('/')) {
                            const [day, month, year] = valueAsDate.split('/').map(Number);
                            d = new Date(Date.UTC(year, month - 1, day));
                        }
                        valueAsDate = d;
                    }
                    const dateObj = valueAsDate instanceof Date && !isNaN(valueAsDate.getTime()) ? valueAsDate : undefined;
                    const selectedDay = dateObj ? dateObj.getUTCDate() : undefined;
                    const selectedMonth = dateObj ? dateObj.getUTCMonth() : undefined;
                    const selectedYear = dateObj ? dateObj.getUTCFullYear() : undefined;

                    const handleDateChange = (type: 'day' | 'month' | 'year', val: string) => {
                        const newDay = type === 'day' ? parseInt(val) : (selectedDay || 1);
                        const newMonth = type === 'month' ? parseInt(val) : (selectedMonth || 0);
                        const newYear = type === 'year' ? parseInt(val) : (selectedYear || new Date().getUTCFullYear());

                        const newDate = new Date(Date.UTC(newYear, newMonth, newDay));
                        field.onChange(newDate);
                    };

                    return (
                        <FormItem className="flex flex-col gap-2 p-4 bg-muted/30 rounded-2xl border border-border/50 shadow-sm">
                            <FormLabel className="flex items-center gap-2 text-sm font-extrabold text-foreground/80 mb-1">
                                <CalendarDays className="h-4 w-4 text-indigo-500" />
                                Fecha de Nacimiento
                            </FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <Select onValueChange={(v) => handleDateChange('day', v)} value={selectedDay?.toString()}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white hover:bg-slate-50 transition-colors border-border/60 rounded-xl h-11 font-medium ring-offset-0 focus:ring-2 focus:ring-indigo-500/20">
                                            <SelectValue placeholder="Día" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-60 rounded-xl shadow-xl border-border/40">
                                        {days.map(d => <SelectItem key={d} value={d.toString()} className="font-medium">{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                <Select onValueChange={(v) => handleDateChange('month', v)} value={selectedMonth?.toString()}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white hover:bg-slate-50 transition-colors border-border/60 rounded-xl h-11 font-medium ring-offset-0 focus:ring-2 focus:ring-indigo-500/20">
                                            <SelectValue placeholder="Mes" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-60 rounded-xl shadow-xl border-border/40">
                                        {months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="font-medium">{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                <Select onValueChange={(v) => handleDateChange('year', v)} value={selectedYear?.toString()}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white hover:bg-slate-50 transition-colors border-border/60 rounded-xl h-11 font-medium ring-offset-0 focus:ring-2 focus:ring-indigo-500/20">
                                            <SelectValue placeholder="Año" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-60 rounded-xl shadow-xl border-border/40">
                                        {years.map(y => <SelectItem key={y} value={y.toString()} className="font-medium">{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {dateObj && (
                                <div className="mt-2 p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                                    <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider pl-1">Edad Calculada:</span>
                                    <span className="text-sm font-black text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">{calculateAge(dateObj)} años</span>
                                </div>
                            )}
                            {!dateObj && (
                                <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200 border-dashed flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-400 italic">Seleccione una fecha válida...</span>
                                </div>
                            )}
                            <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                    );
                }}
            />
            
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
