

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from './form-section';

const sintomasComunes = [ { id: 'fiebre', label: 'Fiebre' }, { id: 'tos', label: 'Tos' }, { id: 'dolor_garganta', label: 'Dolor de garganta' }, { id: 'dolor_cabeza', label: 'Dolor de cabeza' }, { id: 'congestion_nasal', label: 'Congestión nasal' }, { id: 'dificultad_respirar', label: 'Dificultad para respirar' }, { id: 'dolor_abdominal', label: 'Dolor abdominal' }, { id: 'nauseas_vomitos', label: 'Náuseas/Vómitos' }, { id: 'diarrea', label: 'Diarrea' }, { id: 'fatiga_cansancio', label: 'Fatiga/Cansancio' }, { id: 'dolor_muscular', label: 'Dolor muscular' }, { id: 'mareos', label: 'Mareos' } ];

export const StepAnamnesis = ({ form }: { form: any }) => {
    const { control, watch, setValue } = form;
    const watchNingunSintoma = watch('motivoConsulta.ninguno');
    const watchEnfermedadActualNinguno = watch('enfermedadActualNinguno');
    const watchRevisionPorSistemasNinguno = watch('revisionPorSistemasNinguno');

    React.useEffect(() => {
        if (watchNingunSintoma) {
            setValue('motivoConsulta.sintomas', []);
            setValue('motivoConsulta.otros', '');
        }
    }, [watchNingunSintoma, setValue]);

    React.useEffect(() => {
        if (watchEnfermedadActualNinguno) {
            setValue('enfermedadActual', '');
        }
    }, [watchEnfermedadActualNinguno, setValue]);
    
    React.useEffect(() => {
        if (watchRevisionPorSistemasNinguno) {
            setValue('revisionPorSistemas', '');
        }
    }, [watchRevisionPorSistemasNinguno, setValue]);

    return (
        <div className="space-y-6">
            <FormSection title="Motivo de Consulta">
                 <FormField control={control} name="motivoConsulta.ninguno"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 shadow-sm bg-background">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="font-normal text-sm">Asintomático / Sin síntomas</FormLabel>
                        </FormItem>
                 )} />
                <FormField control={control} name="motivoConsulta" render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                        {sintomasComunes.map((item) => (
                          <FormField key={item.id} control={control} name="motivoConsulta.sintomas"
                            render={({ field }) => (
                                <FormItem key={item.id} className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox checked={field.value?.includes(item.label)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                          ? field.onChange([...currentValue, item.label])
                                          : field.onChange(currentValue.filter((value: string) => value !== item.label))
                                      }}
                                      disabled={watchNingunSintoma}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                            )} /> ))}
                      </div>
                       <FormField control={control} name="motivoConsulta.otros" render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Otros síntomas</FormLabel>
                            <FormControl><Input placeholder="Describa otros síntomas no listados..." {...field} disabled={watchNingunSintoma} /></FormControl>
                             <FormMessage />
                          </FormItem>
                        )} />
                    </FormItem>
                  )} />
                  <FormMessage>{form.formState.errors.motivoConsulta?.message}</FormMessage>
            </FormSection>
            <FormSection 
                title="Enfermedad Actual"
                action={
                    <FormField control={control} name="enfermedadActualNinguno"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal text-sm">Ninguno / No Refiere</FormLabel>
                            </FormItem>
                    )} />
                }
            >
                <FormField control={control} name="enfermedadActual" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Detalle la cronología y características de los síntomas..." {...field} rows={6} disabled={watchEnfermedadActualNinguno} /></FormControl><FormMessage /></FormItem> )} />
            </FormSection>
            <FormSection 
                title="Revisión por Sistemas"
                action={
                     <FormField control={control} name="revisionPorSistemasNinguno"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal text-sm">Ninguno / No Refiere</FormLabel>
                            </FormItem>
                    )} />
                }
            >
                <FormField control={control} name="revisionPorSistemas" render={({ field }) => ( <FormItem><FormControl><Textarea placeholder="Detalle cualquier otro síntoma por sistema corporal..." {...field} rows={4} disabled={watchRevisionPorSistemasNinguno} /></FormControl><FormMessage /></FormItem> )} />
            </FormSection>
        </div>
    );
};
