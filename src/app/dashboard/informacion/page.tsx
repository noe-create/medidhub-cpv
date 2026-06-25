
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Info,
    BookOpen,
    Users,
    UserPlus,
    ClipboardList,
    Stethoscope,
    Clock,
    HeartPulse,
    ShieldCheck,
    BarChart3,
    FileText,
    Settings,
    ChevronRight,
    HelpCircle,
    ArrowRightCircle,
    CheckCircle2,
    Printer,
    Download
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export default function InformacionPage() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 min-h-screen bg-transparent">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print, 
                    [role="tablist"],
                    header, 
                    nav, 
                    aside,
                    button,
                    .print-hidden {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    body, .flex-1 {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .Card, .bg-white, .bg-slate-900 {
                        border: 1px solid #e0e0e0 !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                    }
                    .p-4, .p-8, .md\:p-12 {
                        padding: 1rem !important;
                    }
                    h2, h3, h4 {
                        color: black !important;
                    }
                    .text-slate-500, .text-slate-600 {
                        color: #444 !important;
                    }
                }
            `}</style>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-3 rounded-2xl">
                        <Info className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Centro de Información Medihub</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Su guía completa para dominar el sistema de gestión médica</p>
                    </div>
                </div>
                <div className="flex gap-2 no-print">
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-2xl font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir / PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="medihub" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-auto flex-wrap sm:flex-nowrap">
                    <TabsTrigger value="medihub" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">¿Qué es Medihub?</TabsTrigger>
                    <TabsTrigger value="modulos" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Módulos del Sistema</TabsTrigger>
                    <TabsTrigger value="guias" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Guías Paso a Paso</TabsTrigger>
                </TabsList>

                <TabsContent value="medihub" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-amber-50 dark:bg-amber-500/5 px-6 py-8">
                                <CardTitle className="text-2xl font-black text-amber-700 dark:text-amber-400">¿Qué es Medihub?</CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
                                    Medihub es una plataforma integral de gestión de salud diseñada para optimizar la atención médica y administrativa en el Centro de Prevención La Viña.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                    Nuestra misión es proporcionar herramientas tecnológicas de vanguardia que faciliten el registro de pacientes, la gestión de consultas, y el seguimiento clínico, garantizando una atención de calidad y un manejo eficiente de la información médica.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Centralización</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Toda la data en un solo lugar seguro y accesible.</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Agilidad</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Procesos rápidos de registro y consulta médica.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white">
                                <CardContent className="p-8">
                                    <HelpCircle className="h-10 w-10 mb-4 text-indigo-200 opacity-50" />
                                    <h3 className="text-xl font-black mb-2">Asistencia Continua</h3>
                                    <p className="text-indigo-100 font-medium leading-relaxed">
                                        Este centro de ayuda se actualiza constantemente para reflejar las nuevas funcionalidades del sistema. Si tiene dudas adicionales, no dude en contactar al administrador del sistema.
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <h3 className="font-black text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    Confidencialidad y Seguridad
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Sus credenciales de acceso son personales e intransferibles.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Toda la información del paciente está protegida por leyes de privacidad médica.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">El sistema registra cada acción realizada para auditar la seguridad.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="modulos" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Define modules for each group */}
                        <ModuleCard
                            icon={<BarChart3 />}
                            title="Panel de Control"
                            group="Inicio"
                            description="Vista general del estado de la clínica, pacientes en espera y estadísticas rápidas del día."
                            color="blue"
                        />
                        <ModuleCard
                            icon={<Clock />}
                            title="Sala de Espera"
                            group="Atención"
                            description="Gestión de pacientes que acaban de llegar. Aquí se les asigna el servicio y se controla su turno."
                            color="cyan"
                        />
                        <ModuleCard
                            icon={<Stethoscope />}
                            title="Consulta Médica"
                            group="Atención"
                            description="Módulo principal para doctores. Registro de síntomas, diagnósticos y planes de tratamiento."
                            color="cyan"
                        />
                        <ModuleCard
                            icon={<HeartPulse />}
                            title="Historia Clínica (HCE)"
                            group="Atención"
                            description="Repositorio histórico de cada paciente. Permite ver consultas pasadas y evolución médica."
                            color="cyan"
                        />
                        <ModuleCard
                            icon={<ClipboardList />}
                            title="Bitácora de Tratamiento"
                            group="Atención"
                            description="Seguimiento de medicamentos y procedimientos administrados a pacientes en enfermería."
                            color="cyan"
                        />
                        <ModuleCard
                            icon={<Users />}
                            title="Personas"
                            group="Admisión"
                            description="Base de datos central de toda persona física. Un paso previo obligatorio para crear pacientes."
                            color="emerald"
                        />
                        <ModuleCard
                            icon={<ShieldCheck />}
                            title="Titulares"
                            group="Admisión"
                            description="Registro de trabajadores de la clínica o personal afiliado principal."
                            color="emerald"
                        />
                        <ModuleCard
                            icon={<Users />}
                            title="Beneficiarios"
                            group="Admisión"
                            description="Gestión de familiares asociados a un Titular. Dependen directamente de él en el sistema."
                            color="emerald"
                        />
                        <ModuleCard
                            icon={<FileText />}
                            title="Reportes / Analítica"
                            group="Analítica"
                            description="Visualización de datos avanzados: Morbilidad, flujo semanal y estadísticas operativas."
                            color="pink"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="guias" className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                    <div className="max-w-5xl mx-auto space-y-12">
                        {/* Tutorial Hero Section */}
                        <div className="text-center space-y-4 mb-12">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Guías Especializadas Paso a Paso</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                                Hemos diseñado estos tutoriales detallados para que el proceso de registro y atención sea lo más sencillo posible para usted.
                            </p>
                        </div>

                        {/* Interactive Tutorial: Registro de Paciente */}
                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-10 text-white">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-2 rounded-xl">
                                                <UserPlus className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-2xl font-black">Tutorial: Registro Completo de Paciente</h4>
                                        </div>
                                        <p className="text-emerald-50 opacity-90 font-medium">Desde que la persona llega hasta que entra en sala de espera.</p>
                                    </div>
                                    <div className="bg-emerald-400/30 px-4 py-2 rounded-2xl border border-white/20 text-sm font-bold">
                                        Tiempo estimado: 3 minutos
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8 md:p-12">
                                <div className="grid gap-12">
                                    {/* Step 1 */}
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="h-14 w-14 rounded-[1.5rem] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-emerald-500/10">1</div>
                                        <div className="space-y-4 flex-1">
                                            <h5 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                Registro de la Persona (Datos Básicos)
                                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 font-bold">REQUERIDO</span>
                                            </h5>
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                Todo paciente debe existir primero como una "Persona" en nuestra base de datos universal.
                                            </p>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <ChevronRight className="h-5 w-5 text-emerald-500 mt-1 shrink-0" />
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">Vaya a <strong>Admisión {'>'} Personas</strong> en el menú lateral.</p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <ChevronRight className="h-5 w-5 text-emerald-500 mt-1 shrink-0" />
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">Haga clic en el botón azul <strong>+ Añadir Persona</strong> (arriba a la derecha).</p>
                                                </div>
                                                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-white/5">
                                                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold italic">
                                                        Tip: Verifique la cédula antes de guardar. El sistema le avisará si la persona ya existe para evitar duplicados.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="h-14 w-14 rounded-[1.5rem] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-emerald-500/10">2</div>
                                        <div className="space-y-4 flex-1">
                                            <h5 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                Convertir en Titular o Beneficiario
                                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 font-bold">ADMINISTRACIÓN</span>
                                            </h5>
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                Aquí es donde asignamos el rol del paciente (si es trabajador o carga familiar).
                                            </p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                                    <h6 className="font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                                        Como Titular
                                                    </h6>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        Vaya a <strong>Titulares</strong>, busque a la persona por su nombre y asígnele su <strong>Departamento</strong> o Unidad de Trabajo.
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                                    <h6 className="font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-emerald-500" />
                                                        Como Beneficiario
                                                    </h6>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        Busque al Titular (padre/madre/cónyuge), haga clic en los tres puntos <strong>(...)</strong> y seleccione <strong>Gestionar Beneficiarios</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[2rem] p-4 border border-slate-200 dark:border-white/5 overflow-hidden shadow-inner">
                                                <div className="relative aspect-video rounded-[1.5rem] overflow-hidden bg-slate-200 dark:bg-slate-950 group/video">
                                                    <img
                                                        src="/tutorials/infografia_registro.png"
                                                        alt="Infografía de Registro"
                                                        className="w-full h-full object-cover opacity-90 group-hover/video:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center group-hover/video:bg-black/10 transition-colors">
                                                        <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-full shadow-2xl scale-90 group-hover/video:scale-100 transition-transform">
                                                            <BookOpen className="h-8 w-8 text-emerald-600" />
                                                        </div>
                                                        <p className="mt-4 text-white font-black text-sm drop-shadow-md">Guía Visual de Procesos</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="h-14 w-14 rounded-[1.5rem] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-emerald-500/10">3</div>
                                        <div className="space-y-4 flex-1">
                                            <h5 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                Ingreso a Sala de Espera (Admisión Diaria)
                                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 font-bold">RECEPCIÓN</span>
                                            </h5>
                                            <div className="bg-emerald-50 dark:bg-emerald-500/5 p-6 rounded-3xl border border-emerald-100 dark:border-white/5">
                                                <p className="text-slate-700 dark:text-slate-300 mb-4 font-medium italic">
                                                    "Este es el paso final para que el médico pueda ver al paciente en su monitor."
                                                </p>
                                                <ul className="space-y-3">
                                                    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5 shrink-0">A</div>
                                                        Vaya a <strong>Atención {'>'} Sala de Espera</strong>.
                                                    </li>
                                                    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5 shrink-0">B</div>
                                                        Use el buscador superior y escriba el nombre. Haga clic en el botón azul de <strong>"+"</strong> o <strong>"Ingresar"</strong>.
                                                    </li>
                                                    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5 shrink-0">C</div>
                                                        Seleccione el <strong>Servicio</strong> (p.ej. Consulta Médica) y confirme.
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Guide: Beneficiarios */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-white/5">
                            <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-2xl text-blue-600">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black">Cómo Registrar un Beneficiario</CardTitle>
                                        <CardDescription className="font-medium">Gestión de familiares y carga familiar</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-8">
                                    <div className="flex gap-6">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-black shrink-0">1</div>
                                        <div className="space-y-2">
                                            <h6 className="font-bold text-slate-800 dark:text-slate-200 italic">Paso A: Registrar a la Persona</h6>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                Al igual que con el titular, primero registre a la persona en <strong>Admisión {'>'} Personas</strong>. Si es un menor de edad sin cédula, deje el campo de cédula vacío.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-black shrink-0">2</div>
                                        <div className="space-y-2">
                                            <h6 className="font-bold text-slate-800 dark:text-slate-200 italic">Paso B: Vincular con el Titular</h6>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                Vaya a <strong>Admisión {'>'} Titulares</strong>. Busque al empleado que es la "Cabeza de Familia". Haga clic en los tres puntos <strong>(...)</strong> al final de su fila y seleccione <strong>"Gestionar Beneficiarios"</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-black shrink-0">3</div>
                                        <div className="space-y-2">
                                            <h6 className="font-bold text-slate-800 dark:text-slate-200 italic">Paso C: Seleccionar la Persona</h6>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                Haga clic en <strong>"+ Añadir Beneficiario"</strong>. En el buscador superior, escriba el nombre del familiar. Selecciónelo y guarde. ¡Listo! Ya puede enviarlo a sala de espera.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Guides Section */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-2xl text-blue-600">
                                        <Stethoscope className="h-6 w-6" />
                                    </div>
                                    <h5 className="text-xl font-black text-slate-800 dark:text-white">Flujo de Consulta Médica</h5>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                        Para los médicos, el proceso es lineal:
                                        <strong> Seleccionar paciente en espera {'>'} Iniciar Consulta {'>'} Llenar Anamnesis {'>'} Guardar.</strong>
                                    </p>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                            Recuerde que al finalizar la consulta, el diagnóstico se verá reflejado automáticamente en la sección de "Reportes" y "Morbilidad".
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2rem] p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl text-amber-600">
                                        <HelpCircle className="h-6 w-6" />
                                    </div>
                                    <h5 className="text-xl font-black text-slate-800 dark:text-white">Preguntas Frecuentes</h5>
                                </div>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="faq-1" className="border-slate-100 dark:border-white/5">
                                        <AccordionTrigger className="text-sm font-bold py-3">¿Cómo borro a alguien de la sala de espera?</AccordionTrigger>
                                        <AccordionContent className="text-xs text-slate-500">
                                            En la lista de espera, haga clic en el icono de la papelera roja. El sistema le preguntará si desea cancelar el turno.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="faq-2" className="border-slate-100 dark:border-white/5">
                                        <AccordionTrigger className="text-sm font-bold py-3">¿Qué hago si no encuentro al Titular?</AccordionTrigger>
                                        <AccordionContent className="text-xs text-slate-500">
                                            Asegúrese de que primero fue registrado en la sección "Personas". Si ya existe allí, verifique que se le haya creado su ficha en "Titulares".
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ModuleCard({ icon, title, group, description, color }: { icon: React.ReactNode, title: string, group: string, description: string, color: string }) {
    const colorClasses: any = {
        blue: "bg-blue-500 text-white",
        cyan: "bg-cyan-500 text-white",
        emerald: "bg-emerald-500 text-white",
        pink: "bg-pink-500 text-white",
        amber: "bg-amber-500 text-white"
    };

    const darkIconColors: any = {
        blue: "text-blue-400",
        cyan: "text-cyan-400",
        emerald: "text-emerald-400",
        pink: "text-pink-400",
        amber: "text-amber-400"
    };

    return (
        <Card className="group border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
            <CardHeader className="pb-2">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg ${colorClasses[color]} dark:bg-slate-800 dark:${darkIconColors[color]}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{group}</span>
                    <CardTitle className="text-lg font-black text-slate-800 dark:text-white">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

