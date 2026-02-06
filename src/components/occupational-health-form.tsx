'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  ChevronsUpDown,
  CalendarIcon
} from 'lucide-react';
import type { Persona, Empresa } from '@/lib/types';
import { cn, calculateAge } from '@/lib/utils';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Cie10Autocomplete } from './cie10-autocomplete';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OccupationalEvaluationSchema } from '@/lib/zod-schemas/occupational';
import { generateOccupationalSuggestions, createOccupationalEvaluation } from '@/actions/occupational-actions';

interface OccupationalHealthFormProps {
  persona: Persona;
  empresas: Empresa[];
  onFinished: (data: z.infer<typeof OccupationalEvaluationSchema>) => void;
  onCancel: () => void;
}

const steps = [
  {
    id: 'info',
    name: 'Información',
    icon: 'solar:clipboard-list-bold-duotone',
    fields: ['patientType', 'consultationPurpose', 'companyId'],
  },
  {
    id: 'occupational',
    name: 'Historia Ocupacional',
    icon: 'solar:case-bold-duotone',
    fields: ['jobPosition', 'jobDescription', 'occupationalRisks', 'riskDetails'],
  },
  {
    id: 'health',
    name: 'Salud Integral',
    icon: 'solar:heart-pulse-bold-duotone',
    fields: ['personalHistory', 'familyHistory', 'lifestyle', 'mentalHealth'],
  },
  {
    id: 'exam',
    name: 'Examen Físico',
    icon: 'solar:stethoscope-bold-duotone',
    fields: ['vitalSigns', 'anthropometry', 'physicalExamFindings'],
  },
  {
    id: 'plan',
    name: 'Diagnóstico y Plan',
    icon: 'solar:notes-bold-duotone',
    fields: [
      'diagnoses',
      'fitnessForWork',
      'occupationalRecommendations',
      'generalHealthPlan',
      'interconsultation',
      'nextFollowUp',
    ],
  },
];

const riskOptions = [
  { id: 'Ergonomicos', label: 'Ergonómicos' },
  { id: 'Psicosociales', label: 'Psicosociales' },
  { id: 'Biologicos', label: 'Biológicos' },
  { id: 'Quimicos', label: 'Químicos' },
  { id: 'Fisicos', label: 'Físicos' },
  { id: 'Mecánicos', label: 'Mecánicos' },
  { id: 'Seguridad', label: 'Seguridad / Accidentes' },
];

function CompanySelector({ field, empresas }: { field: any, empresas: Empresa[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-between',
              !field.value && 'text-muted-foreground'
            )}
          >
            {field.value
              ? empresas.find((e) => e.id === field.value)?.name
              : 'Seleccione una empresa'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandEmpty>No se encontró empresa.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {empresas.map((empresa) => (
                <CommandItem
                  value={empresa.name}
                  key={empresa.id}
                  onSelect={() => {
                    field.onChange(empresa.id);
                    setOpen(false);
                  }}
                >
                  <Icon
                    icon="solar:check-circle-bold-duotone"
                    className={cn(
                      'mr-2 h-4 w-4 text-primary',
                      empresa.id === field.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {empresa.name}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OccupationalHealthForm({
  persona,
  empresas,
  onFinished,
  onCancel,
}: OccupationalHealthFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);

  const form = useForm<z.infer<typeof OccupationalEvaluationSchema>>({
    resolver: zodResolver(OccupationalEvaluationSchema),
    defaultValues: {
      patientType: 'Empleado Interno', // Default valid value
      consultationPurpose: 'Periódica', // Default valid value
      jobPosition: '',
      jobDescription: '',
      occupationalRisks: '[]', // Init as empty JSON array string
      riskDetails: '',
      personalHistory: '',
      familyHistory: '',
      lifestyle: '{}',
      mentalHealth: '',
      vitalSigns: '{}',
      anthropometry: '{}',
      physicalExamFindings: '',
      diagnoses: '[]',
      fitnessForWork: 'Apto',
      occupationalRecommendations: '',
      generalHealthPlan: '',
      interconsultation: '',
      personaId: persona.id, // Add missing required field
      evaluationDate: new Date().toISOString(), // Add missing required field
    },
  });

  // Helper state for complex objects stored as JSON strings
  const [lifestyle, setLifestyle] = React.useState({
    diet: '', physicalActivity: '', sleepQuality: '', smoking: '', alcohol: ''
  });
  const [vitalSigns, setVitalSigns] = React.useState({
    ta: '', fc: '', fr: '', temp: ''
  });
  const [anthropometry, setAnthropometry] = React.useState({
    weight: 0, height: 0, imc: '0.00'
  });
  const [diagnosesList, setDiagnosesList] = React.useState<any[]>([]);
  const [selectedRisks, setSelectedRisks] = React.useState<string[]>([]);


  const { watch, setValue } = form;
  const patientType = watch('patientType');
  const jobPosition = watch('jobPosition');
  const jobDescription = watch('jobDescription');

  // Sync helpers to form
  React.useEffect(() => {
    setValue('jobPosition', jobPosition); // Ensure string
  }, [jobPosition, setValue]);

  // Sync helpers to form
  React.useEffect(() => {
    setValue('occupationalRisks', JSON.stringify(selectedRisks));
  }, [selectedRisks, setValue]);

  React.useEffect(() => {
    setValue('lifestyle', JSON.stringify(lifestyle));
  }, [lifestyle, setValue]);

  React.useEffect(() => {
    setValue('vitalSigns', JSON.stringify(vitalSigns));
  }, [vitalSigns, setValue]);

  React.useEffect(() => {
    setValue('anthropometry', JSON.stringify(anthropometry));
  }, [anthropometry, setValue]);

  React.useEffect(() => {
    setValue('diagnoses', JSON.stringify(diagnosesList));
  }, [diagnosesList, setValue]);


  // IMC Calc
  React.useEffect(() => {
    if (anthropometry.weight > 0 && anthropometry.height > 0) {
      const heightInMeters = anthropometry.height / 100;
      const imc = anthropometry.weight / (heightInMeters * heightInMeters);
      setAnthropometry(prev => ({ ...prev, imc: imc.toFixed(2) }));
    }
  }, [anthropometry.weight, anthropometry.height]);

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    // We intentionally skip validation on intermediate steps for complex JSON fields to assume they are valid if UI is filled
    // or trigger partial validation. Form validation runs on submit.
    // For now, let's just move next as simple fields are valid.
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const handleGenerateAI = async () => {
    if (!jobPosition) {
      toast({ title: 'Falta información', description: 'Ingrese el puesto de trabajo.', variant: 'destructive' });
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await generateOccupationalSuggestions(jobPosition, jobDescription || '');
      if (response.success && response.data) {
        const { risks, suggestedExams, reasoning } = response.data;

        // Auto-select risks if they match our categories
        const foundRisks = riskOptions.filter(opt =>
          risks.some(r => r.toLowerCase().includes(opt.label.toLowerCase()) || r.toLowerCase().includes(opt.id.toLowerCase()))
        ).map(r => r.id);

        const currentRisks = selectedRisks;
        const newRisks = Array.from(new Set([...currentRisks, ...foundRisks]));
        setSelectedRisks(newRisks);

        // Append details
        const details = `Riesgos IA: ${risks.join(', ')}.\n\nRazonamiento: ${reasoning}`;
        setValue('riskDetails', details);

        const recs = `Exámenes Sugeridos (IA): ${suggestedExams.join(', ')}.`;
        setValue('occupationalRecommendations', recs);

        toast({ title: 'Sugerencias Generadas', description: 'Se han completado riesgos y recomendaciones.', variant: 'success' });
      } else {
        throw new Error(response.error);
      }
    } catch (e) {
      toast({ title: 'Error IA', description: 'No se pudo generar sugerencias.', variant: 'destructive' });
    } finally {
      setIsGeneratingAI(false);
    }
  }

  async function onSubmit(values: z.infer<typeof OccupationalEvaluationSchema>) {
    setIsSubmitting(true);
    try {
      // Ensure JSON fields are up to date in values
      values.lifestyle = JSON.stringify(lifestyle);
      values.vitalSigns = JSON.stringify(vitalSigns);
      values.anthropometry = JSON.stringify(anthropometry);
      values.diagnoses = JSON.stringify(diagnosesList);
      values.occupationalRisks = JSON.stringify(selectedRisks);

      const result = await createOccupationalEvaluation(values);

      if (result.success) {
        toast({ title: '¡Evaluación Guardada!', description: 'La evaluación se ha registrado exitosamente.' });
        onFinished(values);
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar la evaluación.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Ocurrió un error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  Evaluación de Salud Ocupacional
                </CardTitle>
                <CardDescription>
                  Paciente: {persona.nombreCompleto} ({calculateAge(new Date(persona.fechaNacimiento))} años)
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={onCancel} type="button">Volver</Button>
            </div>
            <div className="flex items-center justify-center pt-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center text-center w-20">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors',
                        currentStep === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground',
                        currentStep > index && 'bg-primary/50 text-primary-foreground'
                      )}
                    >
                      <Icon icon={step.icon} className="h-5 w-5" />
                    </div>
                    <p className="text-xs mt-1">{step.name}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-auto border-t-2 transition-colors',
                        currentStep > index ? 'border-primary/50' : 'border-secondary'
                      )}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 min-h-[400px]">
            {/* Step 0: Initial Info */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="patientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Icon icon="solar:user-bold-duotone" className="h-4 w-4" />
                        Tipo de Paciente
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Empleado Interno">
                            Empleado Interno
                          </SelectItem>
                          <SelectItem value="Beneficiario">Beneficiario</SelectItem>
                          <SelectItem value="Afiliado Externo">
                            Afiliado Externo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consultationPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Icon icon="solar:clipboard-list-bold-duotone" className="h-4 w-4" />
                        Propósito de la Consulta
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un propósito" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pre-ingreso">Pre-ingreso</SelectItem>
                          <SelectItem value="Periódica">Periódica</SelectItem>
                          <SelectItem value="Post-incapacidad">Post-incapacidad</SelectItem>
                          <SelectItem value="Retiro">Retiro</SelectItem>
                          <SelectItem value="Consulta de Morbilidad">Consulta de Morbilidad</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {patientType === 'Afiliado Externo' && (
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Icon icon="solar:city-bold-duotone" className="h-4 w-4" />
                          Empresa del Afiliado
                        </FormLabel>
                        <CompanySelector field={field} empresas={empresas} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
            {/* Step 1: Occupational History */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <FormField control={form.control} name="jobPosition" render={({ field }) => (<FormItem><FormLabel>Puesto de Trabajo</FormLabel><FormControl><Input placeholder="Ej. Asistente Administrativo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="jobDescription" render={({ field }) => (<FormItem><FormLabel>Descripción de Tareas</FormLabel><FormControl><Textarea placeholder="Describa las principales funciones..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />

                <div className="md:col-span-2 flex justify-end">
                  <Button type="button" variant="secondary" size="sm" onClick={handleGenerateAI} disabled={isGeneratingAI}>
                    {isGeneratingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon icon="solar:magic-stick-3-bold-duotone" className="mr-2 h-4 w-4 text-yellow-500" />}
                    Sugerir Riesgos y Exámenes con IA
                  </Button>
                </div>

                <FormField control={form.control} name="occupationalRisks" render={() => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Riesgos Laborales</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 rounded-md border p-4">
                      {riskOptions.map((item) => (
                        <FormItem key={item.id} className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={selectedRisks.includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRisks([...selectedRisks, item.id]);
                                } else {
                                  setSelectedRisks(selectedRisks.filter(r => r !== item.id));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item.label}</FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="riskDetails" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Detalle Cualitativo de Exposición</FormLabel><FormControl><Textarea placeholder="Describa cómo y con qué frecuencia ocurre la exposición a los riesgos marcados..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}
            {/* Step 2: Health History */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FormField control={form.control} name="personalHistory" render={({ field }) => (<FormItem><FormLabel>Antecedentes Personales</FormLabel><FormControl><Textarea placeholder="Enfermedades crónicas, alergias..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="familyHistory" render={({ field }) => (<FormItem><FormLabel>Antecedentes Familiares</FormLabel><FormControl><Textarea placeholder="Diabetes, Hipertensión, Cáncer..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-2 rounded-md border p-4">
                  <h4 className="font-medium text-sm">Estilo de Vida</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><FormLabel>Alimentación</FormLabel><Input value={lifestyle.diet} onChange={e => setLifestyle({ ...lifestyle, diet: e.target.value })} placeholder="Ej. Balanceada" /></div>
                    <div className="space-y-2"><FormLabel>Actividad Física</FormLabel><Input value={lifestyle.physicalActivity} onChange={e => setLifestyle({ ...lifestyle, physicalActivity: e.target.value })} placeholder="Ej. Sedentario" /></div>
                    <div className="space-y-2"><FormLabel>Sueño</FormLabel><Input value={lifestyle.sleepQuality} onChange={e => setLifestyle({ ...lifestyle, sleepQuality: e.target.value })} placeholder="Ej. 7 horas" /></div>
                    <div className="space-y-2"><FormLabel>Tabaco</FormLabel><Input value={lifestyle.smoking} onChange={e => setLifestyle({ ...lifestyle, smoking: e.target.value })} placeholder="Ej. Niega" /></div>
                    <div className="space-y-2"><FormLabel>Alcohol</FormLabel><Input value={lifestyle.alcohol} onChange={e => setLifestyle({ ...lifestyle, alcohol: e.target.value })} placeholder="Ej. Ocasional" /></div>
                  </div>
                </div>
                <FormField control={form.control} name="mentalHealth" render={({ field }) => (<FormItem><FormLabel>Salud Mental</FormLabel><FormControl><Textarea placeholder="Estrés, estado de ánimo..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}
            {/* Step 3: Physical Exam */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><FormLabel>TA (mmHg)</FormLabel><Input value={vitalSigns.ta} onChange={e => setVitalSigns({ ...vitalSigns, ta: e.target.value })} placeholder="120/80" /></div>
                  <div className="space-y-2"><FormLabel>FC (lpm)</FormLabel><Input value={vitalSigns.fc} onChange={e => setVitalSigns({ ...vitalSigns, fc: e.target.value })} placeholder="80" /></div>
                  <div className="space-y-2"><FormLabel>FR (rpm)</FormLabel><Input value={vitalSigns.fr} onChange={e => setVitalSigns({ ...vitalSigns, fr: e.target.value })} placeholder="16" /></div>
                  <div className="space-y-2"><FormLabel>Temp (°C)</FormLabel><Input value={vitalSigns.temp} onChange={e => setVitalSigns({ ...vitalSigns, temp: e.target.value })} placeholder="36.5" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><FormLabel>Peso (kg)</FormLabel><Input type="number" value={anthropometry.weight} onChange={e => setAnthropometry({ ...anthropometry, weight: parseFloat(e.target.value) || 0 })} placeholder="70" /></div>
                  <div className="space-y-2"><FormLabel>Talla (cm)</FormLabel><Input type="number" value={anthropometry.height} onChange={e => setAnthropometry({ ...anthropometry, height: parseFloat(e.target.value) || 0 })} placeholder="170" /></div>
                  <div className="space-y-2"><FormLabel>IMC</FormLabel><Input readOnly value={anthropometry.imc} className="bg-muted" /></div>
                </div>
                <FormField control={form.control} name="physicalExamFindings" render={({ field }) => (<FormItem><FormLabel>Hallazgos Físicos</FormLabel><FormControl><Textarea placeholder="Hallazgos relevantes..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}
            {/* Step 4: Diagnosis and Plan */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <FormLabel>Diagnósticos (CIE-10)</FormLabel>
                  <Cie10Autocomplete selected={diagnosesList} onChange={setDiagnosesList} />
                </div>
                <FormField control={form.control} name="fitnessForWork" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icon icon="solar:check-circle-bold-duotone" className="h-4 w-4" />
                      Concepto de Aptitud
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione concepto" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Apto">Apto</SelectItem>
                        <SelectItem value="Apto con Restricciones">Apto con Restricciones</SelectItem>
                        <SelectItem value="No Apto">No Apto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="occupationalRecommendations" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icon icon="solar:case-bold-duotone" className="h-4 w-4" />
                      Recomendaciones Ocupacionales
                    </FormLabel>
                    <FormControl><Textarea placeholder="Recomendaciones para el trabajador y empresa..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="generalHealthPlan" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icon icon="solar:heart-pulse-bold-duotone" className="h-4 w-4" />
                      Plan de Salud General
                    </FormLabel>
                    <FormControl><Textarea placeholder="Recomendaciones generales..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="interconsultation" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Icon icon="solar:cloud-forward-bold-duotone" className="h-4 w-4" />
                        Interconsultas
                      </FormLabel>
                      <FormControl><Input placeholder="Opcional..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nextFollowUp" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <Icon icon="solar:calendar-date-bold-duotone" className="h-4 w-4" />
                        Próximo Seguimiento
                      </FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(new Date(field.value), 'PPP', { locale: es }) : <span>Seleccione fecha</span>}
                          <Icon icon="solar:calendar-minimalistic-bold-duotone" className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? date.toISOString() : '')}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>

            {currentStep < steps.length - 1 && (
              <Button type="button" onClick={handleNext}>
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar y Completar Evaluación
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
