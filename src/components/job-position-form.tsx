'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobPositionSchema, type JobPosition } from '@/lib/zod-schemas/occupational';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface JobPositionFormProps {
    jobPosition?: JobPosition | null;
    onSubmitted: (data: any) => Promise<void>;
    onCancel: () => void;
}

const riskOptions = [
    { id: 'Altura', label: 'Trabajo en Altura' },
    { id: 'Ruido', label: 'Ruido Excesivo' },
    { id: 'Polvo', label: 'Polvo / Partículas' },
    { id: 'Quimicos', label: 'Sustancias Químicas' },
    { id: 'Biologicos', label: 'Riesgos Biológicos' },
    { id: 'Ergonomico', label: 'Riesgo Ergonómico' },
    { id: 'Psicosocial', label: 'Riesgo Psicosocial' },
    { id: 'Temperatura', label: 'Temperaturas Extremas' },
    { id: 'Radiacion', label: 'Radiaciones' },
    { id: 'Electrico', label: 'Riesgo Eléctrico' },
];

export function JobPositionForm({ jobPosition, onSubmitted, onCancel }: JobPositionFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<JobPosition>({
        resolver: zodResolver(JobPositionSchema),
        defaultValues: {
            name: jobPosition?.name || '',
            description: jobPosition?.description || '',
            riskLevel: jobPosition?.riskLevel || 'Bajo' as any,
            risks: jobPosition?.risks || [],
        },
    });

    const onSubmit = async (data: JobPosition) => {
        setIsSubmitting(true);
        try {
            await onSubmitted(data);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Puesto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Operador de Montacargas" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción de Funciones</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describa las responsabilidades principales..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nivel de Riesgo Global</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione nivel" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Bajo">Bajo</SelectItem>
                                    <SelectItem value="Medio">Medio</SelectItem>
                                    <SelectItem value="Alto">Alto</SelectItem>
                                    <SelectItem value="Muy Alto">Muy Alto</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="risks"
                    render={() => (
                        <FormItem className="space-y-3">
                            <FormLabel>Riesgos Específicos</FormLabel>
                            <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
                                {riskOptions.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="risks"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={item.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== item.id
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {item.label}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </div>
            </form>
        </Form>
    );
}
