
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona, Empresa } from '@/lib/types';
import { HceSearch } from '@/components/hce-search';
import { Telescope, ClipboardPlus, Printer, BriefcaseMedical, FileText, AlertTriangle } from 'lucide-react';
import { OccupationalHealthForm } from './occupational-health-form';
import { Button } from './ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPersonaById, createOccupationalHealthEvaluation, getEmpresas } from '@/actions/patient-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import {
  getOccupationalEvaluationsByCompany,
  createOccupationalIncident,
  getOccupationalIncidentsByCompany,
  getOccupationalIncidentsByPerson
} from '@/actions/occupational-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, History, AlertCircle } from 'lucide-react';

const OccupationalHealthReportDisplay = dynamic(() => import('./occupational-health-report-display').then(mod => mod.default), {
  loading: () => <p>Cargando informe...</p>,
});

export function OccupationalHealthManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personaIdParam = searchParams.get('personaId');
  const { toast } = useToast();

  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [isLoadingParam, setIsLoadingParam] = React.useState(true);
  const [evaluationData, setEvaluationData] = React.useState<any | null>(null);
  const [isReportVisible, setIsReportVisible] = React.useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [currentView, setCurrentView] = React.useState<'main' | 'history' | 'incident'>('main');
  const [companyHistory, setCompanyHistory] = React.useState<any[]>([]);
  const [companyIncidents, setCompanyIncidents] = React.useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>('');
  const [isSubmittingIncident, setIsSubmittingIncident] = React.useState(false);

  React.useEffect(() => {
    getEmpresas().then(data => setEmpresas(data.empresas));
  }, []);

  React.useEffect(() => {
    if (personaIdParam) {
      const fetchPersona = async () => {
        setIsLoadingParam(true);
        const persona = await getPersonaById(personaIdParam);
        if (persona) {
          setSelectedPersona(persona);
          setIsFormVisible(true);
        }
        setIsLoadingParam(false);
      };
      fetchPersona();
    } else {
      setIsLoadingParam(false);
    }
  }, [personaIdParam]);


  const handleStartConsultation = () => {
    if (selectedPersona) {
      setIsFormVisible(true);
      setEvaluationData(null); // Clear previous evaluation data
    } else {
      toast({
        title: 'Seleccione un paciente',
        description: 'Debe buscar y seleccionar un paciente antes de iniciar una evaluación.',
        variant: 'info'
      });
    }
  };

  const handleFetchHistory = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    const evals = await getOccupationalEvaluationsByCompany(companyId);
    if (evals.success) setCompanyHistory(evals.data || []);
    const incs = await getOccupationalIncidentsByCompany(companyId);
    if (incs.success) setCompanyIncidents(incs.data || []);
    setCurrentView('history');
  };

  const handleIncidentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingIncident(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      personaId: selectedPersona?.id,
      companyId: formData.get('companyId'),
      incidentDate: formData.get('incidentDate'),
      incidentType: formData.get('incidentType'),
      description: formData.get('description'),
      severity: formData.get('severity'),
      witnesses: formData.get('witnesses'),
      actionsTaken: formData.get('actionsTaken'),
      reportedBy: 'Sistema' // Should be current user
    };

    const result = await createOccupationalIncident(data);
    if (result.success) {
      toast({ title: 'Incidente Reportado', description: 'El incidente ha sido registrado exitosamente.', variant: 'success' });
      setCurrentView('main');
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo registrar el incidente.', variant: 'destructive' });
    }
    setIsSubmittingIncident(false);
  };

  const handleConsultationFinished = async (data: any) => {
    try {
      const companyName = data.companyId ? empresas.find(e => e.id === data.companyId)?.name : undefined;
      const savedEvaluation = await createOccupationalHealthEvaluation(selectedPersona!.id, { ...data, companyName });
      setEvaluationData(savedEvaluation);
      setIsFormVisible(false);
      toast({
        title: 'Evaluación Guardada',
        description: `La evaluación de ${selectedPersona?.nombreCompleto} ha sido registrada.`,
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error al Guardar',
        description: 'No se pudo registrar la evaluación. Por favor, intente de nuevo.',
        variant: 'destructive'
      });
      console.error("Error saving evaluation:", error);
    }
  }

  const handleReturnToSearch = () => {
    setIsFormVisible(false);
    setSelectedPersona(null);
    setEvaluationData(null);
    router.push('/dashboard/salud-ocupacional');
  }

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach(styleSheet => {
      if (styleSheet.href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        iframeDoc.head.appendChild(link);
      } else if (styleSheet.cssRules) {
        const style = document.createElement('style');
        style.textContent = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join(' ');
        iframeDoc.head.appendChild(style);
      }
    });

    const printStyles = `
        body { 
            margin: 0; 
            font-family: 'Figtree', sans-serif;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
        }
    `;
    const styleEl = iframeDoc.createElement('style');
    styleEl.innerHTML = printStyles;
    iframeDoc.head.appendChild(styleEl);

    const clonedNode = node.cloneNode(true) as HTMLElement;
    iframeDoc.body.innerHTML = ''; // Clear previous content
    iframeDoc.body.appendChild(clonedNode);

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  if (isLoadingParam) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader><CardTitle>Cargando...</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Telescope className="h-12 w-12 text-muted-foreground animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {!isFormVisible && !evaluationData ? (
        <Card className="mx-auto max-w-4xl shadow-md rounded-3xl border-t-4 border-blue-500 py-12 px-6 animate-in fade-in zoom-in-95 duration-500 mt-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-full shadow-inner ring-8 ring-blue-50/50">
              <BriefcaseMedical className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Evaluación de Salud Ocupacional</h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                Gestione evaluaciones médicas, historias laborales y reportes de incidentes para el personal de la empresa.
              </p>
            </div>

            <div className="w-full max-w-2xl mx-auto pt-4 space-y-6">
              <div className="relative">
                <HceSearch onPersonaSelect={setSelectedPersona} className="h-16 text-lg pl-6 shadow-md border-border rounded-2xl" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none hover:from-blue-600 hover:to-blue-800 transition-all rounded-3xl shadow-lg shadow-blue-500/20 group" onClick={handleStartConsultation}>
                  <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <ClipboardPlus className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-extrabold text-lg">Nueva Evaluación</span>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-none hover:from-indigo-600 hover:to-indigo-800 transition-all rounded-3xl shadow-lg shadow-indigo-500/20 group" onClick={() => {
                  if (empresas.length > 0) {
                    handleFetchHistory(empresas[0].id);
                  } else {
                    toast({ title: 'No hay empresas', description: 'No se encontraron empresas registradas.', variant: 'info' });
                  }
                }}>
                  <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-extrabold text-lg">Historial de Empresa</span>
                </Button>
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-3 bg-gradient-to-br from-amber-500 to-rose-600 text-white border-none hover:from-amber-600 hover:to-rose-700 transition-all rounded-3xl shadow-lg shadow-amber-500/20 group" onClick={() => {
                  if (selectedPersona) {
                    setCurrentView('incident');
                  } else {
                    toast({ title: 'Seleccione un paciente', description: 'Debe buscar un paciente para reportar un incidente.', variant: 'info' });
                  }
                }}>
                  <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-extrabold text-lg">Reportar Incidente</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : currentView === 'history' ? (
        <Card className="mx-auto max-w-6xl shadow-xl rounded-3xl overflow-hidden border-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <History className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">Historial de Empresa</CardTitle>
                  <CardDescription className="text-indigo-100 text-lg">
                    Revisión de evaluaciones e incidentes por empresa
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl" onClick={() => setCurrentView('main')}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Volver
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-lg font-semibold">Seleccionar Empresa</Label>
                <Select value={selectedCompanyId} onValueChange={handleFetchHistory}>
                  <SelectTrigger className="h-12 text-lg rounded-xl border-indigo-100 focus:ring-indigo-500">
                    <SelectValue placeholder="Seleccione una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <FileText className="h-6 w-6" /> Evaluaciones Recientes
              </h3>
              <div className="rounded-2xl border border-indigo-50 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-indigo-50/50">
                    <TableRow>
                      <TableHead className="font-bold">Fecha</TableHead>
                      <TableHead className="font-bold">Paciente</TableHead>
                      <TableHead className="font-bold">Cédula</TableHead>
                      <TableHead className="font-bold">Cargo</TableHead>
                      <TableHead className="font-bold">Aptitud</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyHistory.length > 0 ? companyHistory.map((evalu) => (
                      <TableRow key={evalu.id} className="hover:bg-indigo-50/30">
                        <TableCell className="font-medium">{new Date(evalu.evaluationDate).toLocaleDateString()}</TableCell>
                        <TableCell>{evalu.primerNombre} {evalu.primerApellido}</TableCell>
                        <TableCell>{evalu.cedulaNumero}</TableCell>
                        <TableCell>{evalu.jobPositionName || evalu.jobPosition}</TableCell>
                        <TableCell>
                          <Badge className={
                            evalu.fitnessForWork === 'Apto' ? 'bg-emerald-500 hover:bg-emerald-600' :
                              evalu.fitnessForWork === 'No Apto' ? 'bg-rose-500 hover:bg-rose-600' :
                                'bg-amber-500 hover:bg-amber-600'
                          }>
                            {evalu.fitnessForWork}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          No hay evaluaciones registradas para esta empresa.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" /> Incidentes Reportados
              </h3>
              <div className="rounded-2xl border border-rose-50 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-rose-50/50">
                    <TableRow>
                      <TableHead className="font-bold">Fecha</TableHead>
                      <TableHead className="font-bold">Paciente</TableHead>
                      <TableHead className="font-bold">Tipo</TableHead>
                      <TableHead className="font-bold">Severidad</TableHead>
                      <TableHead className="font-bold">Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyIncidents.length > 0 ? companyIncidents.map((inc) => (
                      <TableRow key={inc.id} className="hover:bg-rose-50/30">
                        <TableCell className="font-medium">{new Date(inc.incidentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{inc.primerNombre} {inc.primerApellido}</TableCell>
                        <TableCell>{inc.incidentType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            inc.severity === 'Fatal' ? 'border-black bg-black text-white' :
                              inc.severity === 'Grave' ? 'border-rose-600 text-rose-600' :
                                inc.severity === 'Moderado' ? 'border-amber-600 text-amber-600' :
                                  'border-emerald-600 text-emerald-600'
                          }>
                            {inc.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{inc.description}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          No hay incidentes reportados para esta empresa.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : currentView === 'incident' && selectedPersona ? (
        <Card className="mx-auto max-w-4xl shadow-xl rounded-3xl overflow-hidden border-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-rose-600 text-white p-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">Reportar Incidente</CardTitle>
                  <CardDescription className="text-amber-50 text-lg">
                    Registro de incidente laboral para {selectedPersona.nombreCompleto}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl" onClick={() => setCurrentView('main')}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Cancelar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleIncidentSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Empresa</Label>
                  <Select name="companyId" required>
                    <SelectTrigger className="h-12 rounded-xl border-amber-100">
                      <SelectValue placeholder="Seleccione empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Fecha del Incidente</Label>
                  <Input type="date" name="incidentDate" required className="h-12 rounded-xl border-amber-100" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Tipo de Incidente</Label>
                  <Select name="incidentType" required>
                    <SelectTrigger className="h-12 rounded-xl border-amber-100">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accidente">Accidente</SelectItem>
                      <SelectItem value="Incidente">Incidente (Casi Accidente)</SelectItem>
                      <SelectItem value="Enfermedad Ocupacional">Enfermedad Ocupacional</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Severidad</Label>
                  <Select name="severity" required>
                    <SelectTrigger className="h-12 rounded-xl border-amber-100">
                      <SelectValue placeholder="Seleccione severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leve">Leve</SelectItem>
                      <SelectItem value="Moderado">Moderado</SelectItem>
                      <SelectItem value="Grave">Grave</SelectItem>
                      <SelectItem value="Fatal">Fatal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Descripción Detallada</Label>
                <Textarea name="description" required placeholder="Describa lo ocurrido con el mayor detalle posible..." className="min-h-[120px] rounded-xl border-amber-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Testigos</Label>
                  <Input name="witnesses" placeholder="Nombres de testigos (opcional)" className="h-12 rounded-xl border-amber-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Acciones Tomadas</Label>
                  <Input name="actionsTaken" placeholder="Primeros auxilios, traslado, etc." className="h-12 rounded-xl border-amber-100" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmittingIncident} className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                  {isSubmittingIncident ? 'Registrando...' : 'Registrar Incidente'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : isFormVisible && selectedPersona ? (
        <OccupationalHealthForm persona={selectedPersona} onFinished={handleConsultationFinished} onCancel={handleReturnToSearch} empresas={empresas} />
      ) : evaluationData && selectedPersona ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Evaluación Completada</CardTitle>
            <CardDescription>
              La evaluación para {selectedPersona.nombreCompleto} ha sido registrada.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p>Puede ver el informe generado o iniciar una nueva búsqueda.</p>
            <div className="flex gap-4">
              <Button onClick={() => setIsReportVisible(true)}>Ver Informe</Button>
              <Button variant="outline" onClick={handleReturnToSearch}>Nueva Búsqueda</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isReportVisible} onOpenChange={setIsReportVisible}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Informe de Salud Ocupacional</DialogTitle>
            <DialogDescription>
              Puede usar el botón de abajo para imprimir este documento.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            {evaluationData && selectedPersona && (
              <div ref={printRef}>
                <OccupationalHealthReportDisplay
                  data={evaluationData}
                  persona={selectedPersona}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Imprimir Documento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
