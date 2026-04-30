'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCompletedConsultations } from '@/actions/patient-actions';
import type { Consultation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, FileText, Calendar as CalendarIcon, Download, Clock, Stethoscope, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MedicalReportDisplay } from '@/components/medical-report-display';
import { useDebounce } from '@/hooks/use-debounce';
import * as XLSX from 'xlsx';

export function ConsultationHistoryList() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [consultations, setConsultations] = React.useState<Consultation[]>([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [currentPage, setCurrentPage] = React.useState(1);
    
    const [search, setSearch] = React.useState('');
    const debouncedSearch = useDebounce(search, 300);
    
    const [dateFrom, setDateFrom] = React.useState<Date | undefined>(new Date(new Date().setHours(0, 0, 0, 0)));
    const [dateTo, setDateTo] = React.useState<Date | undefined>(new Date(new Date().setHours(23, 59, 59, 999)));

    const [selectedConsultation, setSelectedConsultation] = React.useState<Consultation | null>(null);
    const [isDocumentOpen, setIsDocumentOpen] = React.useState(false);

    const pageSize = 20;

    const fetchConsultations = React.useCallback(async (page: number, q: string, dFrom?: Date, dTo?: Date) => {
        setIsLoading(true);
        try {
            const data = await getCompletedConsultations({
                page,
                pageSize,
                search: q,
                dateFrom: dFrom,
                dateTo: dTo
            });
            setConsultations(data.consultations);
            setTotalCount(data.totalCount);
        } catch (error: any) {
            console.error("Error fetching consultations:", error);
            toast({ title: 'Error', description: 'No se pudieron cargar las consultas.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, dateFrom, dateTo]);

    React.useEffect(() => {
        fetchConsultations(currentPage, debouncedSearch, dateFrom, dateTo);
    }, [currentPage, debouncedSearch, dateFrom, dateTo, fetchConsultations]);

    const handleViewDocument = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setIsDocumentOpen(true);
    };

    const handleExportExcel = () => {
        if (consultations.length === 0) {
            toast({ title: 'Atención', description: 'No hay datos para exportar.', variant: 'destructive' });
            return;
        }

        const exportData = consultations.map(c => ({
            'Fecha': format(new Date(c.consultationDate), 'dd/MM/yyyy'),
            'Hora': format(new Date(c.consultationDate), 'HH:mm'),
            'Paciente': c.paciente?.nombreCompleto || 'N/A',
            'Cédula': c.paciente?.cedula || 'N/A',
            'Tipo de Titular': (c as any).waitlistEntry?.accountType || 'Particular',
            'Departamento / Empresa': (c.paciente as any)?.departamento || 'N/A',
            'Especialidad': (c as any).waitlistEntry?.serviceType || 'N/A',
            'Médico': (c as any).doctorName || 'No registrado',
            'Motivo de Consulta': c.motivoConsulta?.sintomas?.join(', ') || 'N/A',
            'Diagnóstico': c.diagnoses?.map(d => d.cie10Description).join('; ') || 'N/A',
            'Reposo': c.reposo || 'No'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Consultas');
        
        ws['!cols'] = [
            { wch: 12 }, { wch: 10 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 40 }, { wch: 20 }
        ];

        XLSX.writeFile(wb, `Reporte_Consultas_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    const columns: ColumnDef<Consultation>[] = [
        {
            accessorKey: "consultationDate",
            header: "Fecha y Hora",
            cell: ({ row }) => {
                const date = new Date(row.original.consultationDate);
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm flex items-center gap-1"><CalendarIcon className="h-3 w-3 text-primary" />{format(date, 'dd MMM, yyyy', { locale: es })}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{format(date, 'hh:mm a')}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "paciente",
            header: "Paciente",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-blue-500" />
                        {row.original.paciente?.nombreCompleto || 'Desconocido'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">{row.original.paciente?.cedula || 'Sin cédula'}</span>
                </div>
            )
        },
        {
            accessorKey: "accountType",
            header: "Tipo de Titular",
            cell: ({ row }) => {
                const type = (row.original as any).waitlistEntry?.accountType || 'Particular';
                return <Badge variant="secondary" className="font-semibold text-[10px]">{type}</Badge>;
            }
        },
        {
            accessorKey: "serviceType",
            header: "Especialidad",
            cell: ({ row }) => {
                const service = (row.original as any).waitlistEntry?.serviceType || 'General';
                return <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-200 capitalize"><Stethoscope className="h-3 w-3 mr-1" />{service}</Badge>;
            }
        },
        {
            accessorKey: "doctorName",
            header: "Médico",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{(row.original as any).doctorName || 'N/A'}</span>
                    <span className="text-[10px] text-muted-foreground">Médico Tratante</span>
                </div>
            )
        },
        {
            accessorKey: "diagnostico",
            header: "Impresión Diagnóstica",
            cell: ({ row }) => {
                const diagnoses = row.original.diagnoses || [];
                if (diagnoses.length === 0) return <span className="text-muted-foreground text-xs italic">No registrado</span>;
                return (
                    <div className="max-w-[250px] truncate text-sm" title={diagnoses.map(d => d.cie10Description).join('; ')}>
                        {diagnoses[0].cie10Description}
                        {diagnoses.length > 1 && <span className="text-xs text-muted-foreground ml-1">(+{diagnoses.length - 1})</span>}
                    </div>
                );
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDocument(row.original)} className="text-primary hover:text-primary hover:bg-primary/10">
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Informe
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 border-b border-border/50 pb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                        <Activity className="h-7 w-7 text-primary" />
                        Historial de Consultas
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Visualización de todas las consultas médicas realizadas en la clínica.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="w-full sm:w-auto space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Buscar Paciente</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Nombre o cédula..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="pl-9 w-full sm:w-64 h-10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="w-full sm:w-auto space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Desde</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`w-full sm:w-[140px] justify-start text-left font-normal h-10 rounded-xl ${!dateFrom && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : <span>Seleccionar</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dateFrom} onSelect={(date) => { if(date) { const d = new Date(date); d.setHours(0,0,0,0); setDateFrom(d); } else setDateFrom(undefined); }} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="w-full sm:w-auto space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Hasta</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`w-full sm:w-[140px] justify-start text-left font-normal h-10 rounded-xl ${!dateTo && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, "dd/MM/yyyy") : <span>Seleccionar</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dateTo} onSelect={(date) => { if(date) { const d = new Date(date); d.setHours(23,59,59,999); setDateTo(d); } else setDateTo(undefined); }} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="ghost" onClick={clearFilters} className="h-10 rounded-xl text-muted-foreground hover:text-foreground">
                            Limpiar
                        </Button>
                        <Button variant="outline" onClick={handleExportExcel} className="h-10 rounded-xl border-border">
                            <Download className="mr-2 h-4 w-4" /> Exportar
                        </Button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={consultations}
                isLoading={isLoading}
                pageCount={Math.ceil(totalCount / pageSize)}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                emptyState={{
                    icon: FileText,
                    title: "No se encontraron consultas",
                    description: "No hay consultas registradas que coincidan con los filtros seleccionados."
                }}
            />

            <Dialog open={isDocumentOpen} onOpenChange={setIsDocumentOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Informe de Consulta</DialogTitle>
                    </DialogHeader>
                    {selectedConsultation && (
                        <div className="p-4 bg-white text-black print:p-0">
                            <MedicalReportDisplay consultation={selectedConsultation} isPrinted={false} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
