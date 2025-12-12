'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from './form-section';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

const alergiasOptions = [ { id: 'medicamentos', label: 'Medicamentos' }, { id: 'alimentos', label: 'Alimentos' }, { id: 'polen', label: 'Polen' }, { id: 'polvo', label: 'Polvo' }, { id: 'animales', label: 'Animales' }, { id: 'picaduras_de_insectos', label: 'Picaduras de Insectos' } ];
const habitosOptions = [ { id: 'tabaco', label: 'Tabaco' }, { id: 'alcohol', label: 'Alcohol' }, { id: 'drogas', label: 'Drogas' }, { id: 'cafe', label: 'Café' }, { id: 'actividad_fisica', label: 'Actividad Física' }, { id: 'dieta_balanceada', label: 'Dieta Balanceada' } ];

const patologicosOptions = [
    { id: 'hipertension', label: 'Hipertensión' },
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'asma', label: 'Asma' },
    { id: 'cardiopatia', label: 'Cardiopatía' },
    { id: 'acv', label: 'ACV' },
    { id: 'cancer', label: 'Cáncer' },
    { id: 'enf_renal', label: 'Enf. Renal' },
    { id: 'enf_hepatica', label: 'Enf. Hepática' },
    { id: 'trast_tiroideo', label: 'Trast. Tiroideo' },
    { id: 'artritis', label: 'Artritis' },
];

const quirurgicosOptions = [
    { id: 'apendicectomia', label: 'Apendicectomía' },
    { id: 'cesarea', label: 'Cesárea' },
    { id: 'colecistectomia', label: 'Colecistectomía' },
    { id: 'histerectomia', label: 'Histerectomía' },
    { id: 'hernioplastia', label: 'Hernioplastia' },
    { id: 'cirugia_cardiaca', label: 'Cirugía Cardíaca' },
    { id: 'cirugia_columna', label: 'Cirugía de Columna' },
];

const StepGineco = ({ form }: { form: any }) => {
    const { watch, setValue } = useFormContext();
    const ginecoNoAplica = watch('antecedentesGinecoObstetricos.noAplica');

    React.useEffect(() => {
        if (ginecoNoAplica) {
            const fieldsToReset = [
                'menarquia', 'ciclos', 'fum', 'g', 'p', 'a', 'c', 'metodoAnticonceptivo'
            ];
            fieldsToReset.forEach(field => {
                setValue(`antecedentesGinecoObstetricos.${field}`, undefined);
            });
        }
    }, [ginecoNoAplica, setValue]);

    return (
        <FormSection
            title="Antecedentes Gineco-Obstétricos"
            action={
                <FormField
                    control={form.control}
                    name="antecedentesGinecoObstetricos.noAplica"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">No Aplica</FormLabel>
                        </FormItem>
                    )}
                />
            }
        >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="antecedentesGinecoObstetricos.menarquia" render={({ field }) => ( <FormItem><FormLabel>Menarquia (edad)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
                <FormField control={form.control} name="antecedentesGinecoObstetricos.ciclos" render={({ field }) => ( <FormItem><FormLabel>Ciclos (días/duración)</FormLabel><FormControl><Input placeholder="28/5" {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
                <FormField control={form.control} name="antecedentesGinecoObstetricos.fum" render={({ field }) => ( <FormItem><FormLabel>FUM</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")} disabled={ginecoNoAplica}>{field.value ? (format(field.value, 'PPP', {locale: es})) : (<span>Seleccione fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={ginecoNoAplica} /></PopoverContent></Popover></FormItem> )} />
                <FormField control={form.control} name="antecedentesGinecoObstetricos.g" render={({ field }) => ( <FormItem><FormLabel>Gestas</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
                <FormField control={form.control} name="antecedentesGinecoObstetricos.p" render={({ field }) => ( <FormItem><FormLabel>Partos</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
                <FormField control={form.control} name="antecedentesGinecoObstetricos.a" render={({ field }) => ( <FormItem><FormLabel>Abortos</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
                <FormField control={form.control} name="antecedentesGinecoObstetricos.c" render={({ field }) => ( <FormItem><FormLabel>Cesáreas</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
            </div>
            <FormField control={form.control} name="antecedentesGinecoObstetricos.metodoAnticonceptivo" render={({ field }) => ( <FormItem><FormLabel>Método Anticonceptivo</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled={ginecoNoAplica} /></FormControl></FormItem> )} />
        </FormSection>
    );
};

const StepPediatrico = ({ form }: { form: any }) => {
    const { watch, setValue } = useFormContext();

    const createToggle = (fieldName: string) => {
        const fullName = `antecedentesPediatricos.${fieldName}`;
        const checkboxName = `${fullName}Ninguno`;
        const isChecked = watch(checkboxName);

        React.useEffect(() => {
            if (isChecked) {
                setValue(fullName, '');
            }
        }, [isChecked, setValue, fullName]);

        return {
            control: (
                <FormField
                    control={form.control}
                    name={checkboxName}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="font-normal text-sm">No Refiere</FormLabel>
                        </FormItem>
                    )}
                />
            ),
            disabled: isChecked
        };
    };

    const prenatales = createToggle('prenatales');
    const natales = createToggle('natales');
    const postnatales = createToggle('postnatales');
    const inmunizaciones = createToggle('inmunizaciones');
    const desarrolloPsicomotor = createToggle('desarrolloPsicomotor');

    return (
        <FormSection title="Antecedentes Pediátricos">
            <FormField control={form.control} name="antecedentesPediatricos.prenatales" render={({ field }) => ( <FormItem><div className="flex justify-between items-center"><FormLabel>Prenatales</FormLabel>{prenatales.control}</div><FormControl><Textarea placeholder="Control del embarazo, complicaciones..." {...field} rows={2} disabled={prenatales.disabled} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesPediatricos.natales" render={({ field }) => ( <FormItem><div className="flex justify-between items-center"><FormLabel>Natales</FormLabel>{natales.control}</div><FormControl><Textarea placeholder="Tipo de parto, peso/talla al nacer..." {...field} rows={2} disabled={natales.disabled} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesPediatricos.postnatales" render={({ field }) => ( <FormItem><div className="flex justify-between items-center"><FormLabel>Postnatales</FormLabel>{postnatales.control}</div><FormControl><Textarea placeholder="Complicaciones neonatales, lactancia..." {...field} rows={2} disabled={postnatales.disabled} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesPediatricos.inmunizaciones" render={({ field }) => ( <FormItem><div className="flex justify-between items-center"><FormLabel>Inmunizaciones</FormLabel>{inmunizaciones.control}</div><FormControl><Textarea placeholder="Esquema de vacunación, vacunas pendientes..." {...field} rows={2} disabled={inmunizaciones.disabled} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="antecedentesPediatricos.desarrolloPsicomotor" render={({ field }) => ( <FormItem><div className="flex justify-between items-center"><FormLabel>Desarrollo Psicomotor</FormLabel>{desarrolloPsicomotor.control}</div><FormControl><Textarea placeholder="Hitos del desarrollo, lenguaje, socialización..." {...field} rows={2} disabled={desarrolloPsicomotor.disabled} /></FormControl></FormItem> )} />
        </FormSection>
    );
};

export const StepAntecedentes = ({ form, isFemale, isPediatric }: { form: any, isFemale: boolean, isPediatric: boolean }) => {
    const { control, watch, setValue } = form;

    const familiaresNinguno = watch('antecedentesFamiliaresNinguno');

    return (
     <div className="space-y-6">
        <FormSection title="Antecedentes Personales">
            <FormField control={control} name="antecedentesPersonales.patologicos" render={() => (
                <FormItem>
                    <div className="flex justify-between items-center"><FormLabel>Patológicos</FormLabel><FormField control={control} name="antecedentesPersonales.patologicosNinguno" render={({ field: checkField }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={checkField.value} onCheckedChange={(checked) => { checkField.onChange(checked); if (checked) { setValue('antecedentesPersonales.patologicos', []); setValue('antecedentesPersonales.patologicosOtros', ''); } }} /></FormControl><FormLabel className="font-normal text-sm">Ninguno / No Refiere</FormLabel></FormItem>)} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                        {patologicosOptions.map((item) => (
                            <FormField key={item.id} control={control} name="antecedentesPersonales.patologicos"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value?.includes(item.label)}
                                                onCheckedChange={(checked) => {
                                                    const currentValue = field.value || [];
                                                    return checked ? field.onChange([...currentValue, item.label]) : field.onChange(currentValue.filter((value: string) => value !== item.label));
                                                }} disabled={watch('antecedentesPersonales.patologicosNinguno')}/>
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                    </FormItem>
                                )} /> ))}
                    </div>
                    <FormField control={control} name="antecedentesPersonales.patologicosOtros" render={({ field }) => ( <FormItem className="mt-2"><FormControl><Input placeholder="Otras patologías, especificar..." {...field} disabled={watch('antecedentesPersonales.patologicosNinguno')} /></FormControl><FormMessage /></FormItem> )} />
                    <FormMessage />
                </FormItem>
            )} />
            
            <FormField control={control} name="antecedentesPersonales.quirurgicos" render={() => (
                <FormItem>
                    <div className="flex justify-between items-center"><FormLabel>Quirúrgicos</FormLabel><FormField control={control} name="antecedentesPersonales.quirurgicosNinguno" render={({ field: checkField }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={checkField.value} onCheckedChange={(checked) => { checkField.onChange(checked); if (checked) { setValue('antecedentesPersonales.quirurgicos', []); setValue('antecedentesPersonales.quirurgicosOtros', ''); } }} /></FormControl><FormLabel className="font-normal text-sm">Ninguno / No Refiere</FormLabel></FormItem>)} /></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                        {quirurgicosOptions.map((item) => (
                            <FormField key={item.id} control={control} name="antecedentesPersonales.quirurgicos"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value?.includes(item.label)}
                                                onCheckedChange={(checked) => {
                                                    const currentValue = field.value || [];
                                                    return checked ? field.onChange([...currentValue, item.label]) : field.onChange(currentValue.filter((value: string) => value !== item.label));
                                                }} disabled={watch('antecedentesPersonales.quirurgicosNinguno')}/>
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                    </FormItem>
                                )} /> ))}
                    </div>
                    <FormField control={control} name="antecedentesPersonales.quirurgicosOtros" render={({ field }) => ( <FormItem className="mt-2"><FormControl><Input placeholder="Otras cirugías, especificar..." {...field} disabled={watch('antecedentesPersonales.quirurgicosNinguno')} /></FormControl><FormMessage /></FormItem> )} />
                    <FormMessage />
                </FormItem>
            )} />
            
            <FormField control={control} name="antecedentesPersonales.alergicos" render={() => (
                    <FormItem>
                        <div className="flex justify-between items-center"><FormLabel>Alérgicos</FormLabel><FormField control={control} name="antecedentesPersonales.alergicosNinguno" render={({ field: checkField }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={checkField.value} onCheckedChange={(checked) => { checkField.onChange(checked); if (checked) { setValue('antecedentesPersonales.alergicos', []); setValue('antecedentesPersonales.alergicosOtros', ''); } }} /></FormControl><FormLabel className="font-normal text-sm">Niega Alergias Conocidas</FormLabel></FormItem>)} /></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                            {alergiasOptions.map((item) => (
                                <FormField key={item.id} control={control} name="antecedentesPersonales.alergicos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked ? field.onChange([...currentValue, item.id]) : field.onChange(currentValue.filter((value: string) => value !== item.id));
                                                    }} disabled={watch('antecedentesPersonales.alergicosNinguno')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} /> ))}
                        </div>
                        <FormField control={control} name="antecedentesPersonales.alergicosOtros"
                            render={({ field }) => (
                                <FormItem className="mt-2"><FormControl><Input placeholder="Otras alergias, especificar..." {...field} disabled={watch('antecedentesPersonales.alergicosNinguno')} /></FormControl><FormMessage /></FormItem>
                            )} />
                        <FormMessage />
                    </FormItem>
                )} />

            <FormField control={control} name="antecedentesPersonales.medicamentos" render={({ field }) => ( <FormItem><div className="flex justify-between items-center"><FormLabel>Medicamentos Actuales</FormLabel><FormField control={control} name="antecedentesPersonales.medicamentosNinguno" render={({ field: checkField }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={checkField.value} onCheckedChange={(checked) => { checkField.onChange(checked); if (checked) setValue('antecedentesPersonales.medicamentos', ''); }} /></FormControl><FormLabel className="font-normal text-sm">Ninguno / No Refiere</FormLabel></FormItem>)} /></div><FormControl><Textarea placeholder="Medicamentos que toma regularmente..." {...field} rows={2} disabled={watch('antecedentesPersonales.medicamentosNinguno')} /></FormControl><FormMessage /></FormItem> )} />

            <FormField control={control} name="antecedentesPersonales.habitos" render={() => (
                    <FormItem>
                         <div className="flex justify-between items-center"><FormLabel>Hábitos Psicobiológicos</FormLabel><FormField control={control} name="antecedentesPersonales.habitosNinguno" render={({ field: checkField }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={checkField.value} onCheckedChange={(checked) => { checkField.onChange(checked); if (checked) { setValue('antecedentesPersonales.habitos', []); setValue('antecedentesPersonales.habitosOtros', ''); } }} /></FormControl><FormLabel className="font-normal text-sm">Ninguno</FormLabel></FormItem>)} /></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                            {habitosOptions.map((item) => (
                                <FormField key={item.id} control={control} name="antecedentesPersonales.habitos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked ? field.onChange([...currentValue, item.id]) : field.onChange(currentValue.filter((value: string) => value !== item.id));
                                                    }} disabled={watch('antecedentesPersonales.habitosNinguno')}/>
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} /> ))}
                        </div>
                        <FormField control={control} name="antecedentesPersonales.habitosOtros"
                            render={({ field }) => (
                                <FormItem className="mt-2"><FormControl><Input placeholder="Otros hábitos, especificar..." {...field} disabled={watch('antecedentesPersonales.habitosNinguno')} /></FormControl><FormMessage /></FormItem>
                            )} />
                        <FormMessage />
                    </FormItem>
                )} />
        </FormSection>
        
        <FormSection 
            title="Antecedentes Familiares"
            action={<FormField control={control} name="antecedentesFamiliaresNinguno" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if (checked) setValue('antecedentesFamiliares', ''); }} /></FormControl><FormLabel className="font-normal text-sm">Ninguno / No Refiere</FormLabel></FormItem>)} />}
        >
             <FormField control={control} name="antecedentesFamiliares" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Enfermedades importantes en familiares directos..." {...field} rows={3} disabled={familiaresNinguno} /></FormControl><FormMessage /></FormItem> )} />
        </FormSection>
        
        {isFemale && <StepGineco form={form} />}
        {isPediatric && <StepPediatrico form={form} />}
    </div>
    );
};
