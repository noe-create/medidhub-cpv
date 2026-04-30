
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import type { Patient, Service, Consultation, Diagnosis } from '@/lib/types';
import { createConsultation, createLabOrder, getConsultationByWaitlistId, saveConsultationDraft } from '@/actions/patient-actions';
import { calculateAge, cn } from '@/lib/utils';
import { StepAnamnesis } from './consultation-form-steps/step-anamnesis';
import { StepAntecedentes } from './consultation-form-steps/step-antecedentes';
import { StepExamenFisico } from './consultation-form-steps/step-examen-fisico';
import { StepDiagnosticoPlan } from './consultation-form-steps/step-diagnostico-plan';
import { useUser } from './app-shell';



// --- Zod Schema Definition ---
const treatmentItemSchema = z.object({
    id: z.string().optional(),
    medicamentoProcedimiento: z.string().min(1, 'El medicamento o procedimiento es requerido.'),
    dosis: z.string().optional(),
    via: z.string().optional(),
    frecuencia: z.string().optional(),
    duracion: z.string().optional(),
    instrucciones: z.string().optional(),
    requiereAplicacionInmediata: z.boolean().optional(),
});


const consultationSchema = z.object({
    // Step 1: Anamnesis
    motivoConsulta: z.object({
        sintomas: z.array(z.string()),
        otros: z.string().optional(),
        ninguno: z.boolean().optional(),
    }).refine(data => data.ninguno || data.sintomas.length > 0 || (!!data.otros && data.otros.trim().length > 0), {
        message: "Debe seleccionar 'Ninguno', un síntoma, o describir otro.",
        path: ["ninguno"],
    }),
    enfermedadActual: z.string().optional(),
    enfermedadActualNinguno: z.boolean().optional(),
    revisionPorSistemas: z.string().optional(),
    revisionPorSistemasNinguno: z.boolean().optional(),

    // Step 2: Antecedentes
    antecedentesPersonales: z.object({
        patologicos: z.array(z.string()).nullish(),
        patologicosOtros: z.string().nullish(),
        patologicosNinguno: z.boolean().nullish(),
        quirurgicos: z.array(z.string()).nullish(),
        quirurgicosOtros: z.string().nullish(),
        quirurgicosNinguno: z.boolean().nullish(),
        alergicos: z.array(z.string()).nullish(),
        alergicosOtros: z.string().nullish(),
        alergicosNinguno: z.boolean().nullish(),
        medicamentos: z.string().nullish(),
        medicamentosNinguno: z.boolean().nullish(),
        habitos: z.array(z.string()).nullish(),
        habitosOtros: z.string().nullish(),
        habitosNinguno: z.boolean().nullish(),
    }).nullish(),
    antecedentesFamiliares: z.string().nullish(),
    antecedentesFamiliaresNinguno: z.boolean().nullish(),
    antecedentesGinecoObstetricos: z.object({
        menarquia: z.coerce.number().nullish(),
        ciclos: z.string().nullish(),
        fum: z.date().nullish(),
        g: z.coerce.number().nullish(),
        p: z.coerce.number().nullish(),
        a: z.coerce.number().nullish(),
        c: z.coerce.number().nullish(),
        metodoAnticonceptivo: z.string().nullish(),
        noAplica: z.boolean().nullish(),
    }).nullish(),
    antecedentesPediatricos: z.object({
        prenatales: z.string().nullish(),
        natales: z.string().nullish(),
        postnatales: z.string().nullish(),
        inmunizaciones: z.string().nullish(),
        desarrolloPsicomotor: z.string().nullish(),
    }).nullish(),

    // Step 3: Examen Físico
    signosVitales: z.object({
        taSistolica: z.coerce.number().nullish(),
        taDiastolica: z.coerce.number().nullish(),
        taBrazo: z.enum(['izquierdo', 'derecho']).nullish(),
        taPosicion: z.enum(['sentado', 'acostado']).nullish(),
        fc: z.coerce.number().nullish(),
        fcRitmo: z.enum(['regular', 'irregular']).nullish(),
        fr: z.coerce.number().nullish(),
        temp: z.coerce.number().nullish(),
        tempUnidad: z.enum(['C', 'F']).nullish(),
        tempSitio: z.enum(['oral', 'axilar', 'rectal', 'timpanica']).nullish(),
        peso: z.coerce.number().nullish(),
        pesoUnidad: z.enum(['kg', 'lb']).nullish(),
        talla: z.coerce.number().nullish(),
        tallaUnidad: z.enum(['cm', 'in']).nullish(),
        imc: z.coerce.number().nullish(),
        satO2: z.coerce.number().min(0).max(100).nullish(),
        satO2Ambiente: z.boolean().nullish(),
        satO2Flujo: z.coerce.number().nullish(),
        dolor: z.coerce.number().min(0).max(10).nullish(),
    }).nullish(),
    examenFisicoGeneral: z.string().nullish(),

    // Step 4: Diagnóstico y Plan
    diagnoses: z.array(z.object({
        cie10Code: z.string(),
        cie10Description: z.string(),
    })).optional(),
    diagnosticoLibre: z.string().optional(),
    diagnosticoLibreNinguno: z.boolean().optional(),
    treatmentPlan: z.string().optional(),
    treatmentPlanNotApplicable: z.boolean().optional(),
    treatmentItems: z.array(treatmentItemSchema).optional(),
    reposo: z.string().optional(),
    radiologyOrder: z.string().optional(),
    radiologyNotApplicable: z.boolean().optional(),
    occupationalReferral: z.object({
        enabled: z.boolean().optional(),
        observations: z.string().optional(),
    }).optional(),
})
    .refine(data => data.enfermedadActualNinguno || (data.enfermedadActual && data.enfermedadActual.length > 0), {
        message: 'La historia de la enfermedad actual es obligatoria.',
        path: ['enfermedadActual'],
    })
    .refine(data => data.treatmentPlanNotApplicable || (data.treatmentPlan && data.treatmentPlan.length > 0) || (data.treatmentItems && data.treatmentItems.length > 0), {
        message: 'El plan de tratamiento o récipe es obligatorio.',
        path: ['treatmentPlan'],
    });

interface ConsultationFormProps {
    patient: Patient;
    onConsultationComplete: (consultation: Consultation) => void;
}

// --- Main Form Component ---
export function ConsultationForm({ patient, onConsultationComplete }: ConsultationFormProps) {
    const { toast } = useToast();
    const user = useUser();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState(0);
    const [selectedLabTests, setSelectedLabTests] = React.useState<string[]>([]);
    const [isDraftLoading, setIsDraftLoading] = React.useState(true);

    const age = React.useMemo(() => calculateAge(new Date(patient.fechaNacimiento)), [patient.fechaNacimiento]);
    const isFemale = patient.genero === 'Femenino';
    const isPediatric = age < 18;
    const isReintegroMode = !!patient.isReintegro;
    const isActuallyNurse = user.role.id === 4 || user.role.name === 'Enfermera';
    const storageKey = `consultation-draft-${patient.id}`;

    const defaultValues: Partial<z.infer<typeof consultationSchema>> = {
        motivoConsulta: isReintegroMode
            ? { sintomas: ['Asintomático'], otros: 'Evaluación médica para reintegro laboral post-reposo.', ninguno: true }
            : { sintomas: [], otros: '', ninguno: false },
        enfermedadActual: isReintegroMode ? 'Post-Reposo Médico / Reintegro' : (isActuallyNurse ? 'Pendiente por Médico' : ''),
        enfermedadActualNinguno: isReintegroMode || isActuallyNurse,
        revisionPorSistemas: isReintegroMode ? 'Sin hallazgos' : (isActuallyNurse ? 'Pendiente por Médico' : ''),
        revisionPorSistemasNinguno: isReintegroMode || isActuallyNurse,
        diagnoses: [],
        diagnosticoLibre: '',
        diagnosticoLibreNinguno: false,
        treatmentPlan: isReintegroMode ? 'Cumplir con recomendaciones de Salud Ocupacional.' : (isActuallyNurse ? 'Pendiente por Médico' : ''),
        treatmentPlanNotApplicable: isActuallyNurse,
        treatmentItems: [],
        reposo: '',
        examenFisicoGeneral: isReintegroMode ? 'Paciente en buenas condiciones generales, afebril, hidratado, eupneico. Orientado en tiempo, espacio y persona.' : '',
        radiologyOrder: '',
        radiologyNotApplicable: false,
        antecedentesFamiliares: isReintegroMode ? 'Sin cambios' : '',
        antecedentesFamiliaresNinguno: isReintegroMode,
        antecedentesPersonales: {
            patologicos: [], patologicosOtros: '', patologicosNinguno: isReintegroMode || isActuallyNurse,
            quirurgicos: [], quirurgicosOtros: '', quirurgicosNinguno: isReintegroMode || isActuallyNurse,
            alergicos: [], alergicosOtros: '', alergicosNinguno: isReintegroMode || isActuallyNurse,
            medicamentos: '', medicamentosNinguno: isReintegroMode || isActuallyNurse,
            habitos: [], habitosOtros: '', habitosNinguno: isReintegroMode || isActuallyNurse,
        },
        antecedentesGinecoObstetricos: {
            menarquia: undefined, ciclos: '', fum: undefined, g: undefined, p: undefined, a: undefined, c: undefined, metodoAnticonceptivo: '', noAplica: !isFemale || isReintegroMode || isActuallyNurse,
        },
        antecedentesPediatricos: {
            prenatales: '', natales: '', postnatales: '', inmunizaciones: '', desarrolloPsicomotor: '',
        },
        occupationalReferral: { enabled: isReintegroMode, observations: '' },
        signosVitales: {
            taSistolica: undefined, taDiastolica: undefined, taBrazo: 'izquierdo', taPosicion: 'sentado', fc: undefined,
            fcRitmo: 'regular', fr: undefined, temp: undefined, tempUnidad: 'C', tempSitio: 'oral',
            peso: undefined, pesoUnidad: 'kg', talla: undefined, tallaUnidad: 'cm', imc: undefined,
            satO2: undefined, satO2Ambiente: true, satO2Flujo: undefined, dolor: 0,
        }
    };

    const form = useForm<z.infer<typeof consultationSchema>>({
        resolver: zodResolver(consultationSchema),
        defaultValues,
        mode: 'onTouched'
    });

    React.useEffect(() => {
        async function loadData() {
            try {
                // 1. Try to load from database first if in consultation
                if (patient.status === 'En Consulta') {
                    const dbConsultation = await getConsultationByWaitlistId(Number(patient.id));
                    if (dbConsultation) {
                        // Map database fields to form values
                        const formValues: any = {
                            ...dbConsultation,
                            motivoConsulta: dbConsultation.motivoConsulta ? { ...defaultValues.motivoConsulta, ...dbConsultation.motivoConsulta } : defaultValues.motivoConsulta,
                            signosVitales: dbConsultation.signosVitales ? { ...defaultValues.signosVitales, ...dbConsultation.signosVitales } : defaultValues.signosVitales,
                            treatmentItems: dbConsultation.treatmentOrders?.[0]?.items || [],
                            radiologyOrder: dbConsultation.radiologyOrders || '',
                            radiologyNotApplicable: dbConsultation.radiologyOrders === 'No aplica',
                            diagnoses: dbConsultation.diagnoses || [],
                            enfermedadActual: dbConsultation.enfermedadActual || '',
                            enfermedadActualNinguno: dbConsultation.enfermedadActualNinguno ?? defaultValues.enfermedadActualNinguno,
                            revisionPorSistemas: dbConsultation.revisionPorSistemas || '',
                            revisionPorSistemasNinguno: dbConsultation.revisionPorSistemasNinguno ?? defaultValues.revisionPorSistemasNinguno,
                            examenFisicoGeneral: dbConsultation.examenFisicoGeneral || '',
                            treatmentPlan: dbConsultation.treatmentPlan || '',
                            treatmentPlanNotApplicable: dbConsultation.treatmentPlanNotApplicable ?? (dbConsultation.treatmentPlan === 'No aplica' || defaultValues.treatmentPlanNotApplicable),
                            reposo: dbConsultation.reposo || '',
                            diagnosticoLibre: dbConsultation.diagnosticoLibre || '',
                            diagnosticoLibreNinguno: dbConsultation.diagnosticoLibreNinguno ?? defaultValues.diagnosticoLibreNinguno,
                            antecedentesFamiliares: dbConsultation.antecedentesFamiliares || '',
                            antecedentesPersonales: dbConsultation.antecedentesPersonales ? {
                                ...dbConsultation.antecedentesPersonales,
                                patologicos: typeof dbConsultation.antecedentesPersonales.patologicos === 'string' 
                                    ? dbConsultation.antecedentesPersonales.patologicos.split(', ').filter((v: string) => v && v !== 'Ninguno / No Refiere') 
                                    : (dbConsultation.antecedentesPersonales.patologicos || []),
                                quirurgicos: typeof dbConsultation.antecedentesPersonales.quirurgicos === 'string' 
                                    ? dbConsultation.antecedentesPersonales.quirurgicos.split(', ').filter((v: string) => v && v !== 'Ninguno / No Refiere') 
                                    : (dbConsultation.antecedentesPersonales.quirurgicos || []),
                                patologicosNinguno: dbConsultation.antecedentesPersonales.patologicos === 'Ninguno / No Refiere' || dbConsultation.antecedentesPersonales.patologicosNinguno,
                                quirurgicosNinguno: dbConsultation.antecedentesPersonales.quirurgicos === 'Ninguno / No Refiere' || dbConsultation.antecedentesPersonales.quirurgicosNinguno,
                                alergicos: Array.isArray(dbConsultation.antecedentesPersonales.alergicos) ? dbConsultation.antecedentesPersonales.alergicos : [],
                                habitos: Array.isArray(dbConsultation.antecedentesPersonales.habitos) ? dbConsultation.antecedentesPersonales.habitos : [],
                                medicamentos: dbConsultation.antecedentesPersonales.medicamentos || '',
                            } : defaultValues.antecedentesPersonales,
                        };
                        form.reset(formValues);
                        setIsDraftLoading(false);
                        return;
                    }
                }

                // 2. Fallback to localStorage draft
                const savedDraft = localStorage.getItem(storageKey);
                if (savedDraft) {
                    const parsedData = JSON.parse(savedDraft);
                    if (parsedData.antecedentesGinecoObstetricos?.fum) {
                        parsedData.antecedentesGinecoObstetricos.fum = new Date(parsedData.antecedentesGinecoObstetricos.fum);
                    }
                    form.reset(parsedData);
                }
            } catch (error) {
                console.error("Failed to load consultation data", error);
            } finally {
                setIsDraftLoading(false);
            }
        }
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, form.reset, patient.id, patient.status]);


    React.useEffect(() => {
        if (isDraftLoading) return;

        const subscription = form.watch((value) => {
            localStorage.setItem(storageKey, JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
    }, [form, storageKey, isDraftLoading]);




    const steps = React.useMemo(() => {
        if (isReintegroMode) {
            return [
                { id: 'examen', name: 'Evaluación de Reintegro', fields: ['signosVitales', 'examenFisicoGeneral'] },
                { id: 'plan', name: 'Plan y Remisión', fields: ['diagnoses', 'diagnosticoLibre', 'treatmentPlan', 'treatmentItems', 'reposo'] },
            ];
        }
        
        if (isActuallyNurse) {
            return [
                { id: 'examen', name: 'Triaje / Examen Físico', fields: ['signosVitales', 'examenFisicoGeneral'] },
            ];
        }

        return [
            { id: 'examen', name: 'Examen Físico', fields: ['signosVitales', 'examenFisicoGeneral'] },
            { id: 'anamnesis', name: 'Anamnesis', fields: ['motivoConsulta', 'enfermedadActual', 'revisionPorSistemas'] },
            { id: 'antecedentes', name: 'Antecedentes', fields: ['antecedentesPersonales', 'antecedentesFamiliares', 'antecedentesGinecoObstetricos', 'antecedentesPediatricos'] },
            { id: 'plan', name: 'Diagnóstico y Plan', fields: ['diagnoses', 'diagnosticoLibre', 'diagnosticoLibreNinguno', 'treatmentPlan', 'treatmentItems', 'reposo', 'radiologyOrder'] },
        ];
    }, [isReintegroMode, isActuallyNurse]);

    const safeJoin = (value: any) => {
        if (Array.isArray(value)) return value.join(', ');
        return value || '';
    };

    const handleSaveDraft = async (silent = false) => {
        const values = form.getValues();
        try {
            // Prepare data for draft
            const draftData: any = {
                waitlistId: patient.id,
                pacienteId: patient.pacienteId,
                signosVitales: values.signosVitales,
                examenFisicoGeneral: values.examenFisicoGeneral,
                motivoConsulta: values.motivoConsulta?.ninguno ? { sintomas: ['Asintomático'], ninguno: true } : values.motivoConsulta,
                enfermedadActual: values.enfermedadActual,
                enfermedadActualNinguno: values.enfermedadActualNinguno,
                revisionPorSistemas: values.revisionPorSistemas,
                revisionPorSistemasNinguno: values.revisionPorSistemasNinguno,
                antecedentesPersonales: {
                    patologicos: safeJoin(values.antecedentesPersonales?.patologicos) || values.antecedentesPersonales?.patologicosOtros,
                    quirurgicos: safeJoin(values.antecedentesPersonales?.quirurgicos) || values.antecedentesPersonales?.quirurgicosOtros,
                    alergicos: values.antecedentesPersonales?.alergicos,
                    alergicosOtros: values.antecedentesPersonales?.alergicosOtros,
                    medicamentos: values.antecedentesPersonales?.medicamentos,
                    habitos: values.antecedentesPersonales?.habitos,
                    habitosOtros: values.antecedentesPersonales?.habitosOtros,
                },
                antecedentesFamiliares: values.antecedentesFamiliares,
                antecedentesGinecoObstetricos: isFemale ? values.antecedentesGinecoObstetricos : undefined,
                antecedentesPediatricos: isPediatric ? values.antecedentesPediatricos : undefined,
                treatmentPlan: values.treatmentPlan,
                treatmentPlanNotApplicable: values.treatmentPlanNotApplicable,
                diagnosticoLibre: values.diagnosticoLibre,
                diagnosticoLibreNinguno: values.diagnosticoLibreNinguno,
                radiologyOrder: values.radiologyOrder,
                reposo: values.reposo,
                diagnoses: values.diagnoses,
                treatmentItems: values.treatmentItems,
            };

            await saveConsultationDraft(draftData);
            
            if (!silent) {
                toast({
                    title: 'Progreso Guardado en BD',
                    description: 'Los datos están disponibles para otros usuarios en la red.',
                    variant: 'info'
                });
            }
        } catch (error) {
            console.error("Error saving draft to DB:", error);
        }
    };

    const handleNext = async () => {
        const fields = steps[currentStep].fields;
        const output = await form.trigger(fields as any, { shouldFocus: true });

        if (!output) return;

        if (currentStep < steps.length - 1) {
            // Save draft to DB when moving to next step (SILENTLY)
            await handleSaveDraft(true);
            setCurrentStep(step => step + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(step => step - 1);
        }
    };

    async function onSubmit(values: z.infer<typeof consultationSchema>) {
        setIsSubmitting(true);

        try {
            // Combine diagnoses from free-text field
            const finalDiagnoses: Diagnosis[] = [];
            if (values.diagnosticoLibre && values.diagnosticoLibre.trim()) {
                finalDiagnoses.push({
                    cie10Code: 'GENERAL',
                    cie10Description: values.diagnosticoLibre.trim(),
                });
            }
            
            if (values.diagnoses && values.diagnoses.length > 0) {
                finalDiagnoses.push(...values.diagnoses);
            }

            const radiologyOrderValue = values.radiologyNotApplicable ? 'No aplica' : values.radiologyOrder;

            const finalMotivo = isReintegroMode
                ? { sintomas: ['Asintomático'], otros: 'Evaluación médica para reintegro laboral post-reposo.' }
                : (values.motivoConsulta?.ninguno ? { sintomas: ['Asintomático'] } : values.motivoConsulta);

            const finalEnfermedadActual = isReintegroMode ? 'Post-Reposo Médico / Reintegro' : (values.enfermedadActualNinguno ? 'Ninguno / No Refiere' : values.enfermedadActual);
            const finalRevisionSistemas = isReintegroMode ? 'Sin hallazgos' : (values.revisionPorSistemasNinguno ? 'Ninguno / No Refiere' : values.revisionPorSistemas);
            const finalTreatmentPlan = values.treatmentPlanNotApplicable ? 'No aplica' : (values.treatmentPlan || '');

            const createdConsultation = await createConsultation({
                waitlistId: patient.id,
                pacienteId: patient.pacienteId,
                motivoConsulta: finalMotivo,
                enfermedadActual: finalEnfermedadActual,
                revisionPorSistemas: finalRevisionSistemas,
                antecedentesPersonales: isReintegroMode ? {
                    patologicos: 'Ninguno / Reintegro',
                    quirurgicos: 'Ninguno / Reintegro',
                    alergicos: [],
                    medicamentos: 'Ninguno / Reintegro',
                    habitos: []
                } : {
                    patologicos: safeJoin(values.antecedentesPersonales?.patologicos) || values.antecedentesPersonales?.patologicosOtros,
                    quirurgicos: safeJoin(values.antecedentesPersonales?.quirurgicos) || values.antecedentesPersonales?.quirurgicosOtros,
                    alergicos: values.antecedentesPersonales?.alergicos,
                    alergicosOtros: values.antecedentesPersonales?.alergicosOtros,
                    medicamentos: values.antecedentesPersonales?.medicamentos,
                    habitos: values.antecedentesPersonales?.habitos,
                    habitosOtros: values.antecedentesPersonales?.habitosOtros,
                },
                antecedentesFamiliares: isReintegroMode ? 'Ver registros previos' : values.antecedentesFamiliares || undefined,
                antecedentesGinecoObstetricos: (isFemale && !isReintegroMode) ? values.antecedentesGinecoObstetricos : undefined,
                antecedentesPediatricos: (isPediatric && !isReintegroMode) ? values.antecedentesPediatricos : undefined,
                signosVitales: values.signosVitales,
                examenFisicoGeneral: values.examenFisicoGeneral,
                diagnoses: finalDiagnoses,
                treatmentPlan: finalTreatmentPlan,
                treatmentItems: values.treatmentItems,
                diagnosticoLibre: values.diagnosticoLibre,
                diagnosticoLibreNinguno: values.diagnosticoLibreNinguno,
                enfermedadActualNinguno: values.enfermedadActualNinguno,
                revisionPorSistemasNinguno: values.revisionPorSistemasNinguno,
                treatmentPlanNotApplicable: values.treatmentPlanNotApplicable,
                radiologyOrder: radiologyOrderValue,
                reposo: values.reposo,
                renderedServices: [],
                isReintegro: isReintegroMode,
                occupationalReferral: values.occupationalReferral
            });

            if (createdConsultation && selectedLabTests.length > 0) {
                await createLabOrder(createdConsultation.id, createdConsultation.pacienteId, selectedLabTests);
                toast({
                    variant: 'info',
                    title: 'Orden de Laboratorio Creada',
                    description: 'La orden ha sido guardada en el historial del paciente.',
                });
            }

            console.log("Consultation saved successfully:", createdConsultation);
            toast({
                title: isActuallyNurse ? 'Registro Actualizado' : 'Consulta Guardada',
                description: `Los datos de ${patient.name} se han guardado con éxito.`,
                variant: 'info'
            });
            localStorage.removeItem(storageKey);
            
            // Retrasar el cierre para asegurar que el toast se renderice antes de desmontar el componente
            setTimeout(() => {
                form.reset();
                onConsultationComplete(createdConsultation);
            }, 300);

        } catch (error) {
            console.error("Error saving consultation:", error);
            toast({
                title: 'Error al guardar la consulta',
                description: 'No se pudo registrar la consulta. Intente de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isDraftLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Cargando borrador...</p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                        <CardTitle>Formulario de Consulta</CardTitle>
                        <CardDescription>
                            Registre los detalles de la consulta. Al guardar, el paciente saldrá de la cola de espera.
                        </CardDescription>
                        <div className="flex items-center justify-center pt-2">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors',
                                                currentStep === index ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                                                currentStep > index && 'bg-primary/50 text-primary-foreground'
                                            )}
                                        >
                                            {index + 1}
                                        </div>
                                        <p className="text-xs mt-1 text-center">{step.name}</p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={cn("flex-auto border-t-2 transition-colors", currentStep > index ? 'border-primary/50' : 'border-secondary')}></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 min-h-[400px]">
                        <Form {...form}>
                            <form 
                                id="consultation-form"
                                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                    console.error("Form validation errors:", errors);
                                    // Identify the step with errors
                                    const errorFields = Object.keys(errors);
                                    const errorStep = steps.find(step => step.fields.some(field => errorFields.includes(field)));
                                    if (errorStep) {
                                        const stepIndex = steps.findIndex(s => s.id === errorStep.id);
                                        setCurrentStep(stepIndex);
                                        toast({
                                            title: 'Información Faltante',
                                            description: `Por favor revise el paso: ${errorStep.name}`,
                                            variant: 'destructive',
                                        });
                                    }
                                })} 
                                className="space-y-6"
                            >
                                {!isReintegroMode && (
                                    <>
                                        {currentStep === 0 && <StepExamenFisico form={form} />}
                                        {currentStep === 1 && <StepAnamnesis form={form} />}
                                        {currentStep === 2 && <StepAntecedentes form={form} isFemale={isFemale} isPediatric={isPediatric} />}
                                        {currentStep === 3 && <StepDiagnosticoPlan form={form} patient={patient} onLabOrderChange={setSelectedLabTests} />}
                                    </>
                                )}
                                {isReintegroMode && (
                                    <>
                                        {currentStep === 0 && <StepExamenFisico form={form} />}
                                        {currentStep === 1 && <StepDiagnosticoPlan form={form} patient={patient} onLabOrderChange={setSelectedLabTests} />}
                                    </>
                                )}
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-4">
                        <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>

                        {currentStep < steps.length - 1 && (
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleSaveDraft(false)} className="text-xs h-8">
                                    <Save className="mr-1 h-3 w-3" /> Guardar Avance
                                </Button>
                                <Button type="button" onClick={handleNext}>
                                    Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {currentStep === steps.length - 1 && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Button type="button" variant="outline" onClick={() => handleSaveDraft(false)} disabled={isSubmitting}>
                                    <Save className="mr-2 h-4 w-4" /> Solo Guardar Avance
                                </Button>
                                <Button type="submit" form="consultation-form" className="flex-1 sm:flex-none" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isActuallyNurse ? 'Finalizar Triaje' : 'Guardar y Completar Consulta'}
                                </Button>
                            </div>
                        )}
                    </CardFooter>
        </Card>
    );
}
