'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, KeyRound, User as UserIcon, Shield, GraduationCap, UserSquare, CalendarDays, Plus } from 'lucide-react';
import type { User, Role, Persona, Specialty } from '@/lib/types';
import { getSpecialties, createSpecialty } from '@/actions/specialty-actions';
import { useUser } from './app-shell';
import { calculateAge } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { useFormDraft } from '@/hooks/use-form-draft';
import { PersonaSearch } from './persona-search';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SpecialtyForm } from './specialty-form';
import { useToast } from '@/hooks/use-toast';

const baseObject = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario es requerido (mínimo 3 caracteres).' }),
  name: z.string().optional(),
  roleId: z.coerce.string({ required_error: 'El rol es requerido.' }),
  specialtyId: z.coerce.string().optional(),
  fechaNacimiento: z.date().optional().nullable(),
  personaId: z.coerce.string().optional(),
});

const personaRefine = (data: any) => data.personaId || (data.name && data.fechaNacimiento);
const personaRefineConfig = {
    message: "Debe vincular una persona o completar nombre y fecha de nacimiento.",
    path: ["name"]
};

const createUserSchema = baseObject.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
}).refine(personaRefine, personaRefineConfig);

const updateUserSchema = baseObject.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
}).refine(personaRefine, personaRefineConfig);


interface UserFormProps {
  user: User | null;
  roles: Role[];
  onSubmitted: (values: any) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ user, roles, onSubmitted, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [isAddingSpecialty, setIsAddingSpecialty] = React.useState(false);
  const { toast } = useToast();
  const currentUser = useUser();
  
  const initialDate = React.useMemo(() => {
    // Priority: user.persona.fechaNacimiento (normalized) -> legacy properties
    const dateValue = user?.persona?.fechaNacimiento || (user as any)?.fechaNacimiento || (user as any)?.fecha_nacimiento;
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
        name: user?.persona?.nombreCompleto || user?.name || '',
        roleId: user?.role?.id ? String(user.role.id) : '',
        specialtyId: user?.specialty?.id ? String(user.specialty.id) : '',
        fechaNacimiento: initialDate,
        password: '',
        confirmPassword: '',
        personaId: user?.personaId ? String(user.personaId) : '',
    },
  });

  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(user?.persona || null);
  const isPersonaSelected = !!selectedPersona;

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
  const selectedRole = roles.find(r => String(r.id) === String(roleId));
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

  const handlePersonaSelect = (p: Persona | null) => {
    setSelectedPersona(p);
    if (p) {
        form.setValue('personaId', String(p.id), { shouldValidate: true });
        form.setValue('name', p.nombreCompleto, { shouldValidate: true });
        if (p.fechaNacimiento) {
            form.setValue('fechaNacimiento', new Date(p.fechaNacimiento), { shouldValidate: true });
        }
    } else {
        form.setValue('personaId', '');
    }
  };

  const handleCreateNew = (name: string) => {
    form.setValue('name', name, { shouldValidate: true });
    setSelectedPersona(null);
    form.setValue('personaId', '');
  };

  const handleQuickCreateSpecialty = async (values: { name: string }) => {
    try {
        const newSpecialty = await createSpecialty(values);
        setSpecialties(prev => [...prev, newSpecialty].sort((a, b) => a.name.localeCompare(b.name)));
        form.setValue('specialtyId', String(newSpecialty.id), { shouldValidate: true });
        setIsAddingSpecialty(false);
        toast({ title: "Especialidad creada", description: `Se ha añadido "${newSpecialty.name}" al catálogo.` });
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "No se pudo crear la especialidad", variant: "destructive" });
    }
  };

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
            {(!isPersonaSelected || !user) && (
                <div className="space-y-2 mb-6 p-4 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Label className="text-sm font-semibold">Vincular Persona Existente</Label>
                    <PersonaSearch
                        onPersonaSelect={handlePersonaSelect}
                        placeholder="Buscar persona para el usuario..."
                        onCreateNew={handleCreateNew}
                    />
                    <p className="text-xs text-muted-foreground italic">Recomendado para vincular a staff médico o administrativo ya registrado.</p>
                </div>
            )}

            {isPersonaSelected && selectedPersona && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                        {selectedPersona.nombreCompleto.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-indigo-900 leading-none mb-1">{selectedPersona.nombreCompleto}</p>
                        <p className="text-xs text-indigo-700/80 font-medium">
                            {selectedPersona.nacionalidad}-{selectedPersona.cedulaNumero || 'S/C'} • {selectedPersona.fechaNacimiento ? calculateAge(selectedPersona.fechaNacimiento) + ' años' : 'Sin fecha'}
                        </p>
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePersonaSelect(null)}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 font-bold"
                    >
                        Cambiar
                    </Button>
                </div>
            )}

            <div className={`grid gap-4 ${!isPersonaSelected ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
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
                {!isPersonaSelected && (
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
                )}
            </div>

            {!isPersonaSelected && (
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
                            <FormItem className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-1 mt-4">
                                    <CalendarDays className="h-4 w-4" />
                                    Fecha de Nacimiento
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Select value={selectedDay ? String(selectedDay) : ""} onValueChange={(v) => handleDateChange('day', v)}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Día" /></SelectTrigger>
                                        <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={selectedMonth !== undefined ? String(selectedMonth) : ""} onValueChange={(v) => handleDateChange('month', v)}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Mes" /></SelectTrigger>
                                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={selectedYear ? String(selectedYear) : ""} onValueChange={(v) => handleDateChange('year', v)}>
                                        <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Año" /></SelectTrigger>
                                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
            )}
            
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
                            <SelectItem key={role.id} value={String(role.id)} disabled={role.name === 'Superusuario' && currentUser.role.name !== 'Superusuario'}>
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
                        <FormLabel className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground"/>
                                Especialidad
                            </div>
                            <Dialog open={isAddingSpecialty} onOpenChange={setIsAddingSpecialty}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-wider">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Nueva
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nueva Especialidad Médica</DialogTitle>
                                    </DialogHeader>
                                    <SpecialtyForm
                                        specialty={null}
                                        onSubmitted={handleQuickCreateSpecialty}
                                        onCancel={() => setIsAddingSpecialty(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccione una especialidad" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {specialties.map(s => (
                                <SelectItem key={s.id} value={String(s.id)} className="capitalize">{s.name}</SelectItem>
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
