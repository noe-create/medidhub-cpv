

'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, PlusCircle, Wand2, FilePenLine, Trash2, Beaker, ChevronsUpDown, Check, Pill, BrainCircuit, Stethoscope, Monitor, Bed, RefreshCw } from 'lucide-react';
import type { Patient, Cie10Code, Diagnosis, CreateTreatmentItemInput, Service } from '@/lib/types';
import { searchCie10Codes, createLabOrder } from '@/actions/patient-actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { LabOrderForm } from '../lab-order-form';
import { FormSection } from './form-section';
import { Checkbox } from '../ui/checkbox';
import { RadiologyOrderForm } from '../radiology-order-form';


const DiagnosisSelector = ({ form }: { form: any }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [results, setResults] = React.useState<Cie10Code[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "diagnoses"
    });

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 3) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await searchCie10Codes(val);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const addDiagnosis = (code: Cie10Code) => {
        if (fields.some((f: any) => f.cie10Code === code.codigo)) return;
        append({
            cie10Code: code.codigo,
            cie10Description: code.descripcion
        });
        setSearchTerm('');
        setResults([]);
    };

    return (
        <FormSection icon={<Stethoscope className="h-5 w-5 text-primary" />} title="Diagnósticos (CIE-10)">
            <div className="space-y-4">
                <div className="relative">
                    <Command className="border rounded-md shadow-sm">
                        <CommandInput 
                            placeholder="Buscar por código o descripción (ej: E11, Gripe)..." 
                            value={searchTerm}
                            onValueChange={handleSearch}
                        />
                        <CommandList>
                            {isSearching && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Buscando...</div>}
                            {searchTerm.length >= 3 && results.length === 0 && !isSearching && <CommandEmpty>No se encontraron diagnósticos.</CommandEmpty>}
                            <CommandGroup>
                                {results.map((res) => (
                                    <CommandItem
                                        key={res.codigo}
                                        value={`${res.codigo} ${res.descripcion}`}
                                        onSelect={() => addDiagnosis(res)}
                                        className="cursor-pointer"
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", fields.some((f: any) => f.cie10Code === res.codigo) ? "opacity-100" : "opacity-0")} />
                                        <span className="font-mono font-bold text-primary mr-2">{res.codigo}</span>
                                        {res.descripcion}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>

                {fields.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {fields.map((field, index) => (
                            <Badge key={field.id} variant="secondary" className="pl-3 pr-1 py-1 h-auto flex items-center gap-2 border-primary/20 bg-primary/5">
                                <span className="font-mono font-black text-primary">{ (field as any).cie10Code }</span>
                                <span className="text-xs max-w-[200px] truncate">{ (field as any).cie10Description }</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full hover:bg-destructive hover:text-white transition-colors"
                                    onClick={() => remove(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </FormSection>
    );
};

const TreatmentOrderBuilder = ({ form }: { form: any }) => {
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "treatmentItems",
    });

    const [currentItem, setCurrentItem] = React.useState<CreateTreatmentItemInput>({
        medicamentoProcedimiento: '', dosis: '', via: '', frecuencia: '', duracion: '', instrucciones: '', requiereAplicacionInmediata: false
    });
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    };

    const handleAddItem = () => {
        if (!currentItem.medicamentoProcedimiento) return;
        if (editingIndex !== null) {
            update(editingIndex, currentItem);
            setEditingIndex(null);
        } else {
            append(currentItem);
        }
        setCurrentItem({ medicamentoProcedimiento: '', dosis: '', via: '', frecuencia: '', duracion: '', instrucciones: '', requiereAplicacionInmediata: false });
    };

    const handleEditItem = (index: number) => {
        setCurrentItem(fields[index] as unknown as CreateTreatmentItemInput);
        setEditingIndex(index);
    };

    const handleCancelEdit = () => {
        setCurrentItem({ medicamentoProcedimiento: '', dosis: '', via: '', frecuencia: '', duracion: '', instrucciones: '', requiereAplicacionInmediata: false });
        setEditingIndex(null);
    }

    return (
        <FormSection icon={<Stethoscope className="h-5 w-5 text-primary" />} title="Constructor de Récipe y Tratamiento">
            <div className="p-4 bg-background border rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="medicamentoProcedimiento">Medicamento / Procedimiento</Label>
                        <Input name="medicamentoProcedimiento" value={currentItem.medicamentoProcedimiento} onChange={handleInputChange} placeholder="Ej: Amoxicilina 500mg" />
                    </div>
                    <div>
                        <Label htmlFor="dosis">Dosis / Indicación</Label>
                        <Input name="dosis" value={currentItem.dosis} onChange={handleInputChange} placeholder="Ej: 1 tableta" />
                    </div>
                    <div>
                        <Label htmlFor="via">Vía</Label>
                        <Input name="via" value={currentItem.via} onChange={handleInputChange} placeholder="Ej: Vía Oral" />
                    </div>
                    <div>
                        <Label htmlFor="frecuencia">Frecuencia</Label>
                        <Input name="frecuencia" value={currentItem.frecuencia} onChange={handleInputChange} placeholder="Ej: Cada 8 horas" />
                    </div>
                    <div>
                        <Label htmlFor="duracion">Duración</Label>
                        <Input name="duracion" value={currentItem.duracion} onChange={handleInputChange} placeholder="Ej: Por 7 días" />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="instrucciones">Instrucciones Especiales (opcional)</Label>
                        <Textarea name="instrucciones" value={currentItem.instrucciones} onChange={handleInputChange} placeholder="Ej: Tomar con las comidas" />
                    </div>
                    <div className="md:col-span-2 pt-2 border-t mt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="requiereAplicacionInmediata" 
                                checked={currentItem.requiereAplicacionInmediata} 
                                onCheckedChange={(checked) => setCurrentItem({ ...currentItem, requiereAplicacionInmediata: !!checked })}
                            />
                            <Label htmlFor="requiereAplicacionInmediata" className="text-sm font-semibold cursor-pointer">
                                Requiere aplicación en clínica / inmediata
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6 mt-1">Si marca esta opción, el medicamento se enviará a la Bitácora de Tratamiento para que la enfermera lo administre.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    {editingIndex !== null && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancelar Edición</Button>}
                    <Button type="button" onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4" /> {editingIndex !== null ? 'Actualizar Ítem' : 'Agregar Ítem al Récipe'}</Button>
                </div>
            </div>

            {fields.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Ítems del Récipe</h4>
                    <div className="border rounded-md divide-y">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-3 flex justify-between items-start">
                                <div className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{(field as any).medicamentoProcedimiento}</p>
                                        {(field as any).requiereAplicacionInmediata && (
                                            <Badge variant="default" className="text-[10px] h-5">Aplicación Inmediata</Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground">
                                        {(field as any).dosis && <span>{(field as any).dosis}</span>}
                                        {(field as any).via && <span> &bull; Vía {(field as any).via}</span>}
                                        {(field as any).frecuencia && <span> &bull; {(field as any).frecuencia}</span>}
                                        {(field as any).duracion && <span> &bull; {(field as any).duracion}</span>}
                                    </p>
                                    {(field as any).instrucciones && <p className="text-xs text-muted-foreground mt-1">Instrucciones: {(field as any).instrucciones}</p>}
                                </div>
                                <div className="flex gap-1">
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditItem(index)}><FilePenLine className="h-4 w-4" /></Button>
                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <FormField control={form.control} name="treatmentItems" render={() => <FormMessage />} />
            <FormField
                control={form.control}
                name="reposo"
                render={({ field }) => (
                    <FormItem className="pt-4">
                        <FormLabel className="flex items-center gap-2"><Bed className="h-4 w-4 text-muted-foreground" />Reposo Médico</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Ej. Reposo relativo por 48 horas"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
        </FormSection>
    );
}

export const StepDiagnosticoPlan = ({ form, patient, onLabOrderChange }: { form: any; patient: Patient, onLabOrderChange: (tests: string[]) => void }) => {
    const { toast } = useToast();
    const [isLabOrderOpen, setIsLabOrderOpen] = React.useState(false);
    const [isRadiologyOrderOpen, setIsRadiologyOrderOpen] = React.useState(false);
    const [selectedLabTests, setSelectedLabTests] = React.useState<string[]>([]);

    const { watch, control, setValue } = form;
    const radiologyOrder = watch('radiologyOrder');

    const handleLabOrderSubmit = (selectedTests: string[]) => {
        if (selectedTests.length > 0) {
            onLabOrderChange(selectedTests);
            setSelectedLabTests(selectedTests);
            toast({
                title: 'Exámenes Seleccionados',
                description: `${selectedTests.length} exámenes de laboratorio han sido seleccionados. Se guardarán al completar la consulta.`,
            });
        }
        setIsLabOrderOpen(false);
    };

    const handleRadiologyOrderSubmit = (selectedStudies: string[]) => {
        if (selectedStudies.length > 0) {
            const currentOrders = radiologyOrder?.split('\n').filter(Boolean) || [];
            const newOrders = selectedStudies.filter(s => !currentOrders.includes(s));
            const updatedOrders = [...currentOrders, ...newOrders].join('\n');
            setValue('radiologyOrder', updatedOrders, { shouldValidate: true });

            toast({
                title: 'Estudios de Imagenología Añadidos',
                description: `${newOrders.length} estudio(s) nuevo(s) ha(n) sido añadido(s) a la orden.`,
            });
        }
        setIsRadiologyOrderOpen(false);
    };

    const removeLabTest = (testToRemove: string) => {
        const updatedTests = selectedLabTests.filter(test => test !== testToRemove);
        setSelectedLabTests(updatedTests);
        onLabOrderChange(updatedTests);
    };

    const removeRadiologyStudy = (studyToRemove: string) => {
        const currentOrders = radiologyOrder?.split('\n').filter(Boolean) || [];
        const updatedOrders = currentOrders.filter((study: string) => study !== studyToRemove).join('\n');
        setValue('radiologyOrder', updatedOrders, { shouldValidate: true });
    };

    return (
        <div className="space-y-6">
            <DiagnosisSelector form={form} />
            
            {patient.isReintegro && (
                <FormSection icon={<RefreshCw className="h-5 w-5 text-blue-600 animate-spin-slow" />} title="Orden de Reintegro Laboral">
                    <div className="p-6 bg-blue-50/50 border-2 border-blue-100 rounded-2xl space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <RefreshCw className="h-6 w-6 text-blue-700" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-black text-blue-900 tracking-tight">Paciente en Proceso de Reintegro</h4>
                                <p className="text-sm text-blue-700 font-medium">Este trabajador regresa de un reposo médico. Debe generar la orden de remisión a Salud Ocupacional.</p>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="occupationalReferral.enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border bg-white p-4 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-bold text-slate-800">Generar Remisión a Salud Ocupacional</FormLabel>
                                        <p className="text-xs text-muted-foreground italic">Se incluirá un documento formal de remisión en el historial.</p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {form.watch('occupationalReferral.enabled') && (
                            <FormField
                                control={form.control}
                                name="occupationalReferral.observations"
                                render={({ field }) => (
                                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <FormLabel className="text-xs font-black uppercase text-blue-800 px-1">Observaciones para Medicina Ocupacional</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej: Paciente en buenas condiciones generales, asintomático, sin hallazgos relevantes al examen físico que impidan el reintegro."
                                                className="bg-white border-blue-200 focus:border-blue-400 min-h-[100px] rounded-xl shadow-inner placeholder:italic"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </FormSection>
            )}

            <FormSection icon={<BrainCircuit className="h-5 w-5 text-primary" />} title="Impresión Diagnóstica">
                <FormField
                    control={form.control}
                    name="diagnosticoLibre"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Diagnóstico Médico</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describa el diagnóstico o impresión clínica del paciente..."
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </FormSection>

            <FormSection icon={<Pill className="h-5 w-5 text-primary" />} title="Plan y Órdenes">
                <FormField control={form.control} name="treatmentPlan" render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Plan General y Secuencia de Órdenes</FormLabel>
                            <FormField
                                control={control}
                                name="treatmentPlanNotApplicable"
                                render={({ field: checkboxField }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={checkboxField.value}
                                                onCheckedChange={(checked) => {
                                                    checkboxField.onChange(checked);
                                                    if (checked) setValue('treatmentPlan', '');
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-xs font-normal">No aplica</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormControl><Textarea placeholder="Especifique el plan de seguimiento e indique la secuencia u orden para realizar los exámenes de laboratorio y radiología. Ej: 1. Realizar exámenes de laboratorio en ayunas. 2. Luego, proceder con la radiografía de tórax." {...field} rows={4} disabled={watch('treatmentPlanNotApplicable')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="space-y-2 pt-4">
                    <Dialog open={isLabOrderOpen} onOpenChange={setIsLabOrderOpen}>
                        <Button type="button" variant="outline" onClick={() => setIsLabOrderOpen(true)} className="w-full">
                            <Beaker className="mr-2 h-4 w-4" />
                            Generar Orden de Laboratorio
                        </Button>
                        <DialogContent className="sm:max-w-2xl p-0 gap-0">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>Seleccionar Exámenes de Laboratorio</DialogTitle>
                                <DialogDesc>
                                    Busque o seleccione de la lista los exámenes a solicitar.
                                </DialogDesc>
                            </DialogHeader>
                            <LabOrderForm
                                onSubmitted={handleLabOrderSubmit}
                                onCancel={() => setIsLabOrderOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                    {selectedLabTests.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background">
                            {selectedLabTests.map(test => (
                                <Badge key={test} variant="secondary">
                                    {test}
                                    <button type="button" onClick={() => removeLabTest(test)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2 pt-2">
                    <Dialog open={isRadiologyOrderOpen} onOpenChange={setIsRadiologyOrderOpen}>
                        <Button type="button" variant="outline" onClick={() => setIsRadiologyOrderOpen(true)} className="w-full">
                            <Monitor className="mr-2 h-4 w-4" />
                            Generar Órdenes de Imágenes
                        </Button>
                        <DialogContent className="sm:max-w-2xl p-0 gap-0">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>Seleccionar Estudios de Imagenología</DialogTitle>
                                <DialogDesc>
                                    Busque o seleccione de la lista los estudios a solicitar.
                                </DialogDesc>
                            </DialogHeader>
                            <RadiologyOrderForm
                                onSubmitted={handleRadiologyOrderSubmit}
                                onCancel={() => setIsRadiologyOrderOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <FormField
                        control={control}
                        name="radiologyOrder"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel className="flex items-center gap-2"><Monitor className="h-4 w-4 text-muted-foreground" />Órdenes de Radiología e Imágenes</FormLabel>
                                    <FormField
                                        control={control}
                                        name="radiologyNotApplicable"
                                        render={({ field: checkboxField }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={checkboxField.value}
                                                        onCheckedChange={(checked) => {
                                                            checkboxField.onChange(checked);
                                                            if (checked) {
                                                                setValue('radiologyOrder', '');
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-xs font-normal">No aplica</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormControl>
                                    <Textarea
                                        placeholder="Especifique los estudios de imagenología requeridos. Ej: RX de Tórax PA y Lateral, Ecografía Abdominal..."
                                        rows={3}
                                        {...field}
                                        disabled={form.watch('radiologyNotApplicable')}
                                    />
                                </FormControl>
                                <FormMessage />
                                {field.value && field.value.split('\n').filter(Boolean).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {field.value.split('\n').filter(Boolean).map((study: string) => (
                                            <Badge key={study} variant="secondary">
                                                {study}
                                                <button type="button" onClick={() => removeRadiologyStudy(study)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </FormItem>
                        )}
                    />
                </div>
            </FormSection>

            <TreatmentOrderBuilder form={form} />

        </div>
    );
};
