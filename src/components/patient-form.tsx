
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Globe, CreditCard, CalendarDays, Users as UsersIcon, Smartphone, Mail, MapPin, Hash, Briefcase } from 'lucide-react';
import type { Persona, Titular, UnidadServicio } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PersonaSearch } from './persona-search';
import { Textarea } from './ui/textarea';
import { calculateAge } from '@/lib/utils';
import { getUnidadesServicio } from '@/actions/patient-actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ScrollArea } from './ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';
import { useFormDraft } from '@/hooks/use-form-draft';


const patientSchema = z.object({
    primerNombre: z.string().min(1, 'El primer nombre es requerido.'),
    segundoNombre: z.string().optional(),
    primerApellido: z.string().min(1, 'El primer apellido es requerido.'),
    segundoApellido: z.string().optional(),
    nacionalidad: z.enum(['V', 'E']).optional(),
    cedulaNumero: z.string().regex(/^[0-9]*$/, "La cédula solo debe contener números.").min(7, { message: 'La cédula debe tener entre 7 y 8 dígitos.' }).max(8, { message: 'La cédula debe tener entre 7 y 8 dígitos.' }).optional().or(z.literal('')),
    numeroFicha: z.string().regex(/^[0-9]*$/, "La ficha solo debe contener números.").max(4, { message: 'El número de ficha no puede tener más de 4 dígitos.' }).optional(),
    fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida.' }),
    genero: z.enum(['Masculino', 'Femenino'], { required_error: 'El género es requerido.' }),
    telefono1: z.string().max(11, 'El número de teléfono no puede tener más de 11 dígitos.').optional(),
    telefono2: z.string().max(11, 'El número de teléfono no puede tener más de 11 dígitos.').optional(),
    email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
    direccion: z.string().optional(),
    unidadServicio: z.enum(['Empleado', 'Afiliado Corporativo', 'Privado'], {
        required_error: 'El tipo de cuenta es requerido.',
    }),
    departamento: z.string().optional(),
    otroDepartamento: z.string().optional(),
    representanteId: z.string().optional(),
}).refine(data => {
    if (data.unidadServicio === 'Empleado' && !data.departamento) {
        return false;
    }
    return true;
}, {
    message: "El departamento es requerido para empleados.",
    path: ["departamento"],
}).refine(data => {
    if (data.unidadServicio === 'Empleado' && data.departamento === 'Otro...' && !data.otroDepartamento) {
        return false;
    }
    return true;
}, {
    message: "Por favor especifique el departamento.",
    path: ["otroDepartamento"],
}).refine(data => {
    if (data.fechaNacimiento) {
        const age = calculateAge(data.fechaNacimiento);
        if (age < 18 && !data.cedulaNumero) {
            return !!data.representanteId;
        }
    }
    return true;
}, {
    message: "Un representante es requerido para menores de edad sin cédula.",
    path: ["representanteId"],
});


type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
    titular: Titular | null;
    onSubmitted: (...args: any[]) => Promise<void>;
    onCancel: () => void;
    excludeIds?: string[];
}

export function PatientForm({ titular, onSubmitted, onCancel, excludeIds = [] }: PatientFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
    const [unidades, setUnidades] = React.useState<UnidadServicio[]>([]);

    // Load unidades de servicio from database
    React.useEffect(() => {
        getUnidadesServicio().then(setUnidades).catch(err => {
            console.error('Error loading unidades de servicio:', err);
        });
    }, []);

    const personaToLoad = selectedPersona || titular?.persona || null;

    const initialDate = React.useMemo(() => {
        // Robustly handle both naming conventions and data types
        const dateValue = (personaToLoad as any)?.fechaNacimiento || (personaToLoad as any)?.fecha_nacimiento;
        if (!dateValue) return undefined;
        
        // If it's already a Date object, use it directly via UTC components
        if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            return new Date(Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate()));
        }

        const strValue = String(dateValue);

        // Handle DD/MM/YYYY format (common in imports)
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(strValue)) {
            const [day, month, year] = strValue.split('/').map(Number);
            const d = new Date(Date.UTC(year, month - 1, day));
            if (!isNaN(d.getTime())) return d;
        }

        // Handle DD-MM-YYYY format
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(strValue)) {
            const [day, month, year] = strValue.split('-').map(Number);
            const d = new Date(Date.UTC(year, month - 1, day));
            if (!isNaN(d.getTime())) return d;
        }

        // Handle ISO string (from Next.js serialization: "1990-05-15T04:00:00.000Z")
        const d = new Date(strValue);
        if (!isNaN(d.getTime())) {
            // Always use UTC components to avoid timezone day-shift
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        }
        
        return undefined;
    }, [personaToLoad]);

    // Compute initial titular-specific values BEFORE useForm so they land in defaultValues.
    // This prevents the 'unidadServicio change' side-effect from wiping departamento/ficha on mount.
    const initialTitularValues = React.useMemo(() => {
        if (!titular) return { unidadServicio: undefined as any, departamento: '', otroDepartamento: '', numeroFicha: '' };
        const unit = titular.unidadServicio;
        if (['Afiliado Corporativo', 'Privado'].includes(unit)) {
            return { unidadServicio: unit as any, departamento: '', otroDepartamento: '', numeroFicha: titular.numeroFicha || '' };
        }
        // It's an Empleado — check if we know the department from DB
        const isKnownDept = unidades.some(u => u.name === unit);
        return {
            unidadServicio: 'Empleado' as any,
            departamento: isKnownDept ? unit : (unit ? 'Otro...' : ''),
            otroDepartamento: isKnownDept ? '' : unit,
            numeroFicha: titular.numeroFicha || '',
        };
    }, [titular, unidades]);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            primerNombre: personaToLoad?.primerNombre || '',
            segundoNombre: personaToLoad?.segundoNombre || '',
            primerApellido: personaToLoad?.primerApellido || '',
            segundoApellido: personaToLoad?.segundoApellido || '',
            nacionalidad: personaToLoad?.nacionalidad || 'V',
            cedulaNumero: personaToLoad?.cedulaNumero || '',
            telefono1: personaToLoad?.telefono1 || '',
            telefono2: personaToLoad?.telefono2 || '',
            email: personaToLoad?.email || '',
            direccion: personaToLoad?.direccion || '',
            unidadServicio: initialTitularValues.unidadServicio,
            departamento: initialTitularValues.departamento,
            otroDepartamento: initialTitularValues.otroDepartamento,
            numeroFicha: initialTitularValues.numeroFicha,
            fechaNacimiento: initialDate,
            genero: personaToLoad?.genero as any || undefined,
            representanteId: personaToLoad?.representanteId || undefined
        },
    });

    // Guard ref: prevents the 'clear departamento/ficha' effect from firing on the initial mount
    const isFirstRender = React.useRef(true);

    const isPersonaSelected = !!selectedPersona;

    const { clearDraft } = useFormDraft(
        form, 
        personaToLoad ? `edit-patient-${personaToLoad.id}` : 'new-patient',
        !personaToLoad // Only enable drafts for NEW records
    );

    const fechaNacimiento = form.watch('fechaNacimiento');
    const cedulaNumero = form.watch('cedulaNumero');
    const unidadServicio = form.watch('unidadServicio');
    const [showRepresentativeField, setShowRepresentativeField] = React.useState(false);

    React.useEffect(() => {
        // Skip the first render so defaultValues for Empleado are NOT wiped on mount
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (unidadServicio !== 'Empleado') {
            form.setValue('numeroFicha', '');
            form.setValue('departamento', '');
            form.setValue('otroDepartamento', '');
        }
    }, [unidadServicio, form]);

    const watchedDepartamento = form.watch('departamento');

    React.useEffect(() => {
        if (isPersonaSelected) {
            setShowRepresentativeField(false);
            return;
        }
        if (fechaNacimiento) {
            const age = calculateAge(fechaNacimiento);
            setShowRepresentativeField(age < 18 && !cedulaNumero);
        } else {
            setShowRepresentativeField(false);
        }
    }, [fechaNacimiento, cedulaNumero, isPersonaSelected]);

    const handleRepresentativeSelect = (p: Persona | null) => {
        form.setValue('representanteId', p?.id || '', { shouldValidate: true });
    };

    React.useEffect(() => {
        if (personaToLoad) {
            form.reset({
                ...form.getValues(),
                ...initialTitularValues,
                primerNombre: personaToLoad.primerNombre || '',
                segundoNombre: personaToLoad.segundoNombre || '',
                primerApellido: personaToLoad.primerApellido || '',
                segundoApellido: personaToLoad.segundoApellido || '',
                nacionalidad: personaToLoad.nacionalidad || 'V',
                cedulaNumero: personaToLoad.cedulaNumero || '',
                fechaNacimiento: initialDate as any,
                genero: personaToLoad.genero || undefined,
                telefono1: personaToLoad.telefono1 || '',
                telefono2: personaToLoad.telefono2 || '',
                email: personaToLoad.email || '',
                direccion: personaToLoad.direccion || '',
                representanteId: personaToLoad.representanteId || undefined,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPersona, titular, initialDate, initialTitularValues]);

    const handleCreateNew = (name: string) => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length > 0) {
            form.setValue('primerNombre', parts[0] || '', { shouldValidate: true });
            if (parts.length > 1) {
                form.setValue('primerApellido', parts[parts.length - 1] || '', { shouldValidate: true });
                if (parts.length > 2) {
                    form.setValue('segundoNombre', parts.slice(1, -1).join(' '), { shouldValidate: true });
                }
            }
        }
        setSelectedPersona(null);
    };

    const handleCancel = () => {
        clearDraft();
        onCancel();
    };

    async function onSubmit(values: PatientFormValues) {
        setIsSubmitting(true);

        const finalDepartamento = values.departamento === 'Otro...' ? values.otroDepartamento : values.departamento;

        const submissionData = {
            ...values,
            unidadServicio: values.unidadServicio === 'Empleado' ? finalDepartamento! : values.unidadServicio,
        };

        if (titular) {
            await onSubmitted(titular.id, titular.personaId, submissionData);
        } else {
            let createData: any;
            if (selectedPersona) {
                createData = {
                    personaId: selectedPersona.id,
                    unidadServicio: submissionData.unidadServicio,
                    numeroFicha: submissionData.numeroFicha,
                };
            } else {
                createData = {
                    persona: submissionData,
                    unidadServicio: submissionData.unidadServicio,
                    numeroFicha: submissionData.numeroFicha,
                };
            }
            await onSubmitted(createData);
        }

        clearDraft();
        setIsSubmitting(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!titular && (
                    <div className="space-y-2 mb-6 border-b pb-6">
                        <Label>Asignar Rol de Titular a Persona Existente</Label>
                        <PersonaSearch
                            onPersonaSelect={setSelectedPersona}
                            excludeIds={excludeIds}
                            placeholder="Buscar persona para convertir en titular..."
                            onCreateNew={handleCreateNew}
                        />
                        <p className="text-xs text-muted-foreground text-center">O llene los campos de abajo para crear una nueva persona.</p>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                    <FormField control={form.control} name="primerNombre" render={({ field }) => (<FormItem><FormLabel>Primer Nombre</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange((e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="segundoNombre" render={({ field }) => (<FormItem><FormLabel>Segundo Nombre (Opcional)</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange((e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="primerApellido" render={({ field }) => (<FormItem><FormLabel>Primer Apellido</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange((e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="segundoApellido" render={({ field }) => (<FormItem><FormLabel>Segundo Apellido (Opcional)</FormLabel><FormControl><Input {...field} disabled={isPersonaSelected} onChange={(e) => field.onChange((e.target.value || '').replace(/[^a-zA-Z\s]/g, ''))} /></FormControl><FormMessage /></FormItem>)} />

                    <FormField
                        control={form.control}
                        name="nacionalidad"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />Nacionalidad</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} defaultValue="V" className="flex items-center space-x-4 pt-1" disabled={isPersonaSelected}>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="V" id="v" /></FormControl><Label htmlFor="v" className="font-normal">Venezolano</Label></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="E" id="e" /></FormControl><Label htmlFor="e" className="font-normal">Extranjero</Label></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cedulaNumero"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Número de Cédula (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Solo números" {...field} maxLength={8} value={field.value || ''} onChange={(e) => field.onChange((e.target.value || '').replace(/\D/g, ''))} disabled={isPersonaSelected} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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

                            const dateObj = valueAsDate instanceof Date && !isNaN(valueAsDate.getTime()) ? valueAsDate : null;
                            const selectedYear = dateObj ? dateObj.getUTCFullYear() : undefined;
                            const selectedMonth = dateObj ? dateObj.getUTCMonth() + 1 : undefined;
                            const selectedDay = dateObj ? dateObj.getUTCDate() : undefined;

                            const handleDateChange = (part: 'year' | 'month' | 'day', value: string) => {
                                const now = new Date();
                                let year = selectedYear || now.getUTCFullYear();
                                let month = selectedMonth ? selectedMonth - 1 : now.getUTCMonth();
                                let day = selectedDay || 1;

                                if (part === 'year') year = parseInt(value, 10);
                                else if (part === 'month') month = parseInt(value, 10) - 1;
                                else if (part === 'day') day = parseInt(value, 10);

                                const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
                                if (day > daysInMonth) day = daysInMonth;

                                const newDate = new Date(Date.UTC(year, month, day));
                                field.onChange(newDate);
                            };

                            const years = Array.from({ length: 135 }, (_, i) => new Date().getFullYear() - i);
                            const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('es', { month: 'long' }) }));
                            const daysInSelectedMonth = selectedYear && selectedMonth ? new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate() : 31;
                            const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

                            return (
                                <FormItem className="md:col-span-2">
                                    <FormLabel className="flex items-center gap-2 mb-2">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        Fecha de Nacimiento
                                    </FormLabel>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('day', v)} value={selectedDay ? String(selectedDay) : ''}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger></FormControl>
                                            <SelectContent>{days.map((d) => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('month', v)} value={selectedMonth ? String(selectedMonth) : ''}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl>
                                            <SelectContent>{months.map((m) => (<SelectItem key={m.value} value={String(m.value)}><span className="capitalize">{m.label}</span></SelectItem>))}</SelectContent>
                                        </Select>
                                        <Select disabled={isPersonaSelected} onValueChange={(v) => handleDateChange('year', v)} value={selectedYear ? String(selectedYear) : ''}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl>
                                            <SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>

                                    {dateObj ? (
                                        <div className="mt-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20 flex items-center justify-between">
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Edad Calculada:</span>
                                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{calculateAge(dateObj)} años</span>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-[10px] text-muted-foreground italic bg-muted/50 p-2 rounded border border-dashed text-center">
                                            Seleccione una fecha válida para visualizar la edad.
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                    <FormField
                        control={form.control}
                        name="genero"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-muted-foreground" />Género</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isPersonaSelected}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un género" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="telefono1" render={({ field }) => (<FormItem><FormLabel>Teléfono 1 (Opcional)</FormLabel><FormControl><Input placeholder="02125551234" {...field} value={field.value || ''} maxLength={11} disabled={isPersonaSelected} onChange={(e) => field.onChange((e.target.value || '').replace(/\D/g, ''))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="telefono2" render={({ field }) => (<FormItem><FormLabel>Teléfono 2 (Opcional)</FormLabel><FormControl><Input placeholder="04141234567" {...field} value={field.value || ''} maxLength={11} disabled={isPersonaSelected} onChange={(e) => field.onChange((e.target.value || '').replace(/\D/g, ''))} /></FormControl><FormMessage /></FormItem>)} />

                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />Email (Opcional)</FormLabel><FormControl><Input placeholder="juan.perez@email.com" {...field} value={field.value || ''} type="email" disabled={isPersonaSelected} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="direccion" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Dirección (Opcional)</FormLabel><FormControl><Textarea placeholder="Av. Principal, Edificio Central, Piso 4, Oficina 4B, Caracas" {...field} value={field.value || ''} disabled={isPersonaSelected} /></FormControl><FormMessage /></FormItem>)} />

                    {showRepresentativeField && (
                        <div className="md:col-span-2 space-y-2 rounded-md border border-dashed p-4">
                            <p className="text-sm font-medium text-muted-foreground">Esta persona es un menor de edad sin cédula y requiere un representante.</p>
                            <FormField
                                control={form.control}
                                name="representanteId"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Buscar y Asignar Representante</FormLabel>
                                        <PersonaSearch
                                            onPersonaSelect={handleRepresentativeSelect}
                                            placeholder="Buscar por nombre o cédula del representante..."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <FormField
                        control={form.control}
                        name="unidadServicio"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Tipo de Cuenta</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione un tipo de cuenta" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Empleado">Empleado</SelectItem>
                                        <SelectItem value="Afiliado Corporativo">Afiliado Corporativo</SelectItem>
                                        <SelectItem value="Privado">Privado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {unidadServicio === 'Empleado' && (
                        <>
                            <FormField
                                control={form.control}
                                name="departamento"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Departamento / Área de Trabajo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione el departamento" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <ScrollArea className="h-72">
                                                    {/* Group unidades by category for better UX */}
                                                    {(() => {
                                                        // Filter to only departments (not Afiliado Corporativo / Privado)
                                                        const departmentUnidades = unidades.filter(u => u.category !== 'Tipos de Cuenta');
                                                        const grouped = departmentUnidades.reduce((acc, u) => {
                                                            const cat = u.category || 'Otros';
                                                            if (!acc[cat]) acc[cat] = [];
                                                            acc[cat].push(u);
                                                            return acc;
                                                        }, {} as Record<string, UnidadServicio[]>);
                                                        
                                                        return Object.entries(grouped).map(([category, items]) => (
                                                            <React.Fragment key={category}>
                                                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0">{category}</div>
                                                                {items.sort((a, b) => a.name.localeCompare(b.name)).map((u) => (
                                                                    <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                                                                ))}
                                                            </React.Fragment>
                                                        ));
                                                    })()}
                                                    <SelectItem value="Otro...">Otro...</SelectItem>
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {watchedDepartamento === 'Otro...' && (
                                <FormField
                                    control={form.control}
                                    name="otroDepartamento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Especifique el Departamento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre del departamento" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="numeroFicha"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" />Número de Ficha</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Máximo 4 dígitos" {...field} maxLength={4} value={field.value || ''} onChange={(e) => field.onChange((e.target.value || '').replace(/\D/g, ''))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {titular ? 'Guardar Cambios' : 'Crear Titular'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
