

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Syringe, Stethoscope, FileText, Package, UserCheck, Activity, Brain, Wind } from 'lucide-react';
import type { Patient, Consultation } from '@/lib/types';
import { createConsultation } from '@/actions/patient-actions';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { FormSection } from './consultation-form-steps/form-section';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';


const motivosIntervencion = [
    { id: 'cura_herida', label: 'Cura de Herida' },
    { id: 'admin_trat_ev', label: 'Administración de Tratamiento EV' },
    { id: 'admin_trat_im', label: 'Administración de Tratamiento IM' },
    { id: 'retiro_puntos', label: 'Retiro de Puntos/Suturas' },
    { id: 'control_sv', label: 'Control de Signos Vitales' },
    { id: 'vacunacion', label: 'Vacunación' },
    { id: 'educacion_paciente', label: 'Educación al Paciente' },
];

const valoracionPiel = [
    { id: 'piel_integra', label: 'Piel Íntegra y Normocoloreada' },
    { id: 'piel_palidez', label: 'Palidez' },
    { id: 'piel_ictericia', label: 'Ictericia' },
    { id: 'piel_cianosis', label: 'Cianosis (central/periférica)' },
];

const valoracionNeuro = [
    { id: 'neuro_alerta', label: 'Alerta y Consciente' },
    { id: 'neuro_orientado', label: 'Orientado TEP' },
    { id: 'neuro_somnoliento', label: 'Somnoliento' },
    { id: 'neuro_confuso', label: 'Confuso / Desorientado' },
];

const valoracionResp = [
    { id: 'resp_eupneico', label: 'Eupneico (Patrón Normal)' },
    { id: 'resp_taquipnea', label: 'Taquipnea' },
    { id: 'resp_bradipnea', label: 'Bradipnea' },
    { id: 'resp_disnea', label: 'Disnea / Dificultad Respiratoria' },
];


const nursingProcedureSchema = z.object({
  motivoIntervencion: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Debe seleccionar al menos un motivo de consulta.',
  }),
  motivoOtro: z.string().optional(),
  observaciones: z.string().optional(),
  planEnfermeria: z.string().optional(),
  signosVitales: z.object({
      ta: z.string().optional(),
      fc: z.string().optional(),
      fr: z.string().optional(),
      temp: z.string().optional(),
      satO2: z.string().optional(),
  }),
  valoracionFisica: z.object({
      piel: z.array(z.string()).optional(),
      pielOtros: z.string().optional(),
      pielNinguno: z.boolean().optional(),
      neurologico: z.array(z.string()).optional(),
      neurologicoOtros: z.string().optional(),
      neurologicoNinguno: z.boolean().optional(),
      respiratorio: z.array(z.string()).optional(),
      respiratorioOtros: z.string().optional(),
      respiratorioNinguno: z.boolean().optional(),
  }),
  materialsUsed: z.string().optional(),
}).refine(data => {
    if (data.motivoIntervencion.includes('Otro') && (!data.motivoOtro || data.motivoOtro.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'Si selecciona "Otro" como motivo, debe especificarlo.',
    path: ['motivoOtro'],
});

type NursingProcedureFormValues = z.infer<typeof nursingProcedureSchema>;

interface NursingConsultationFormProps {
  patient: Patient;
  onProcedureComplete: (consultation: Consultation) => void;
}

export function NursingConsultationForm({ patient, onProcedureComplete: onConsultationComplete }: NursingConsultationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<NursingProcedureFormValues>({
    resolver: zodResolver(nursingProcedureSchema),
    defaultValues: {
      motivoIntervencion: [],
      motivoOtro: '',
      observaciones: '',
      planEnfermeria: '',
      signosVitales: { ta: '', fc: '', fr: '', temp: '', satO2: '' },
      valoracionFisica: {
          piel: [], pielOtros: '', pielNinguno: false,
          neurologico: [], neurologicoOtros: '', neurologicoNinguno: false,
          respiratorio: [], respiratorioOtros: '', respiratorioNinguno: false,
      },
      materialsUsed: '',
    },
  });
  
  const storageKey = `nursing-draft-${patient.id}`;
  const [isDraftLoading, setIsDraftLoading] = React.useState(true);
  const watchMotivo = form.watch('motivoIntervencion');
  const watchValoracion = form.watch('valoracionFisica');

  React.useEffect(() => {
    if (watchValoracion.pielNinguno) {
      form.setValue('valoracionFisica.piel', []);
      form.setValue('valoracionFisica.pielOtros', '');
    }
  }, [watchValoracion.pielNinguno, form]);

  React.useEffect(() => {
    if (watchValoracion.neurologicoNinguno) {
      form.setValue('valoracionFisica.neurologico', []);
      form.setValue('valoracionFisica.neurologicoOtros', '');
    }
  }, [watchValoracion.neurologicoNinguno, form]);

  React.useEffect(() => {
    if (watchValoracion.respiratorioNinguno) {
      form.setValue('valoracionFisica.respiratorio', []);
      form.setValue('valoracionFisica.respiratorioOtros', '');
    }
  }, [watchValoracion.respiratorioNinguno, form]);

  React.useEffect(() => {
    try {
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
            form.reset(JSON.parse(savedDraft));
            toast({
                title: "Borrador Cargado",
                description: "Se ha cargado el progreso de un procedimiento anterior.",
                variant: 'info'
            });
        }
    } catch (error) {
        console.error("Failed to load draft from localStorage", error);
    } finally {
        setIsDraftLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, form.reset]);

  React.useEffect(() => {
    if(isDraftLoading) return;
    const subscription = form.watch((value) => {
        localStorage.setItem(storageKey, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form, storageKey, isDraftLoading]);


  async function onSubmit(values: NursingProcedureFormValues) {
    setIsSubmitting(true);
    
    const motivo = values.motivoIntervencion.includes('Otro') 
        ? [...values.motivoIntervencion.filter(m => m !== 'Otro'), values.motivoOtro].join(', ')
        : values.motivoIntervencion.join(', ');

    const examenFisico = [
      "**Piel y Tegumentos:** " + (values.valoracionFisica.pielNinguno ? 'Sin hallazgos' : (values.valoracionFisica.piel?.join(', ') || 'No evaluado') + (values.valoracionFisica.pielOtros ? `. ${values.valoracionFisica.pielOtros}` : '')),
      "**Neurológico:** " + (values.valoracionFisica.neurologicoNinguno ? 'Sin hallazgos' : (values.valoracionFisica.neurologico?.join(', ') || 'No evaluado') + (values.valoracionFisica.neurologicoOtros ? `. ${values.valoracionFisica.neurologicoOtros}` : '')),
      "**Respiratorio:** " + (values.valoracionFisica.respiratorioNinguno ? 'Sin hallazgos' : (values.valoracionFisica.respiratorio?.join(', ') || 'No evaluado') + (values.valoracionFisica.respiratorioOtros ? `. ${values.valoracionFisica.respiratorioOtros}` : '')),
    ].join('\n');

    const treatmentPlan = [
        values.observaciones && `**Observaciones:** ${values.observaciones}`,
        values.planEnfermeria && `**Plan de Enfermería:** ${values.planEnfermeria}`,
        values.materialsUsed && `**Materiales y Medicamentos Usados:** ${values.materialsUsed}`
    ].filter(Boolean).join('\n\n');

    try {
      const createdConsultation = await createConsultation({
        waitlistId: patient.id,
        pacienteId: patient.pacienteId,
        motivoConsulta: { sintomas: [motivo] },
        enfermedadActual: `Se realiza procedimiento de enfermería: ${motivo}.`,
        signosVitales: values.signosVitales,
        examenFisicoGeneral: examenFisico,
        diagnoses: [{ cie10Code: 'Z51.8', cie10Description: 'Otros cuidados especificados' }],
        treatmentPlan,
        renderedServices: [],
      });
      localStorage.removeItem(storageKey);
      form.reset();
      onConsultationComplete(createdConsultation);
    } catch (error) {
      console.error("Error saving nursing procedure:", error);
      toast({
        title: 'Error al guardar el procedimiento',
        description: 'No se pudo registrar la intervención. Intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const CheckboxGroup = ({ name, options, disabled }: { name: `valoracionFisica.${'piel' | 'neurologico' | 'respiratorio'}`, options: { id: string, label: string }[], disabled?: boolean }) => (
    <div className="grid grid-cols-2 gap-4">
      {options.map((item) => (
        <FormField
          key={item.id}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value?.includes(item.label)}
                  onCheckedChange={(checked) => {
                    const currentValue = field.value || [];
                    return checked
                      ? field.onChange([...currentValue, item.label])
                      : field.onChange(currentValue.filter((value) => value !== item.label));
                  }}
                  disabled={disabled}
                />
              </FormControl>
              <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
            </FormItem>
          )}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Formulario de Consulta de Enfermería</CardTitle>
            <CardDescription>
              Registre los detalles de la intervención. Al guardar, el paciente saldrá de la cola de espera.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormSection icon={<Syringe className="h-5 w-5 text-primary"/>} title="Motivo de Consulta">
                 <FormField
                    control={form.control}
                    name="motivoIntervencion"
                    render={() => (
                        <FormItem>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {motivosIntervencion.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="motivoIntervencion"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(item.label)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                            ? field.onChange([...field.value, item.label])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                (value) => value !== item.label
                                                                )
                                                            )
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                                 <FormField
                                    key="otro"
                                    control={form.control}
                                    name="motivoIntervencion"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes('Otro')}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...field.value, 'Otro'])
                                                        : field.onChange(field.value?.filter((value) => value !== 'Otro'))
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal text-sm">Otro</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {watchMotivo.includes('Otro') && (
                    <FormField control={form.control} name="motivoOtro" render={({ field }) => ( <FormItem><FormLabel>Especifique Otro Motivo</FormLabel><FormControl><Input placeholder="Describa el motivo..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
            </FormSection>

            <FormSection icon={<Stethoscope className="h-5 w-5 text-primary"/>} title="Signos Vitales (Opcional)">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <FormField control={form.control} name="signosVitales.ta" render={({ field }) => ( <FormItem><FormLabel>TA (mmHg)</FormLabel><FormControl><Input placeholder="120/80" {...field}/></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="signosVitales.fc" render={({ field }) => ( <FormItem><FormLabel>FC (lpm)</FormLabel><FormControl><Input placeholder="80" {...field}/></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="signosVitales.fr" render={({ field }) => ( <FormItem><FormLabel>FR (rpm)</FormLabel><FormControl><Input placeholder="16" {...field}/></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="signosVitales.temp" render={({ field }) => ( <FormItem><FormLabel>Temp (°C)</FormLabel><FormControl><Input placeholder="36.5" {...field}/></FormControl></FormItem> )}/>
                    <FormField control={form.control} name="signosVitales.satO2" render={({ field }) => ( <FormItem><FormLabel>SatO₂ (%)</FormLabel><FormControl><Input placeholder="98" {...field}/></FormControl></FormItem> )}/>
                </div>
            </FormSection>

            <FormSection icon={<UserCheck className="h-5 w-5 text-primary"/>} title="Valoración Física (Opcional)">
                 <Accordion type="multiple" className="w-full">
                    <AccordionItem value="piel">
                        <AccordionTrigger>
                            <span className="flex items-center gap-2"><Activity className="h-4 w-4"/>Piel y Tegumentos</span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                             <div className="pb-2 border-b">
                                <FormField control={form.control} name="valoracionFisica.pielNinguno" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs font-normal">Sin Hallazgos / No Aplica</FormLabel></FormItem>)} />
                             </div>
                            <CheckboxGroup name="valoracionFisica.piel" options={valoracionPiel} disabled={watchValoracion.pielNinguno} />
                            <FormField control={form.control} name="valoracionFisica.pielOtros" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Otras observaciones de la piel (lesiones, edema...)" {...field} disabled={watchValoracion.pielNinguno} /></FormControl></FormItem>)}/>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="neurologico">
                         <AccordionTrigger>
                            <span className="flex items-center gap-2"><Brain className="h-4 w-4"/>Neurológico</span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <div className="pb-2 border-b">
                                <FormField control={form.control} name="valoracionFisica.neurologicoNinguno" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs font-normal">Sin Hallazgos / No Aplica</FormLabel></FormItem>)} />
                            </div>
                            <CheckboxGroup name="valoracionFisica.neurologico" options={valoracionNeuro} disabled={watchValoracion.neurologicoNinguno} />
                            <FormField control={form.control} name="valoracionFisica.neurologicoOtros" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Otras observaciones neurológicas..." {...field} disabled={watchValoracion.neurologicoNinguno}/></FormControl></FormItem>)}/>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="respiratorio">
                         <AccordionTrigger>
                            <span className="flex items-center gap-2"><Wind className="h-4 w-4"/>Respiratorio</span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                             <div className="pb-2 border-b">
                                <FormField control={form.control} name="valoracionFisica.respiratorioNinguno" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-xs font-normal">Sin Hallazgos / No Aplica</FormLabel></FormItem>)} />
                            </div>
                            <CheckboxGroup name="valoracionFisica.respiratorio" options={valoracionResp} disabled={watchValoracion.respiratorioNinguno}/>
                            <FormField control={form.control} name="valoracionFisica.respiratorioOtros" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Otras observaciones respiratorias..." {...field} disabled={watchValoracion.respiratorioNinguno} /></FormControl></FormItem>)}/>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </FormSection>

             <FormSection icon={<FileText className="h-5 w-5 text-primary"/>} title="Observaciones y Plan de Enfermería">
                <FormField control={form.control} name="observaciones" render={({ field }) => ( <FormItem><FormLabel>Observaciones Generales</FormLabel><FormControl><Textarea placeholder="Cualquier observación relevante durante el procedimiento..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="planEnfermeria" render={({ field }) => ( <FormItem><FormLabel>Plan de Cuidados de Enfermería</FormLabel><FormControl><Textarea placeholder="Describa el plan de cuidados para el paciente..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="materialsUsed" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Package className="h-4 w-4"/>Materiales y Medicamentos Usados</FormLabel><FormControl><Textarea placeholder="Ej. 1 jelco N°22, 1 Solución 0.9% 500cc, 2 pares de guantes, etc." {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </FormSection>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar y Completar Consulta
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
