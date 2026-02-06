'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Loader2, ClipboardCheck, Printer, Filter } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { getAppointmentsReport } from '@/actions/patient-actions';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentHeader } from '@/components/document-header';

type AppointmentRow = {
    fecha: string;
    hora: string;
    cedula: string | null;
    paciente: string;
    servicio: string;
    medico: string;
    estado: string;
    isReintegro: boolean;
};

export default function ReportePacientesPage() {
    const { toast } = useToast();
    const printRef = React.useRef<HTMLDivElement>(null);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [serviceType, setServiceType] = React.useState<string>('todos');
    const [status, setStatus] = React.useState<string>('todos');
    const [isLoading, setIsLoading] = React.useState(false);
    const [appointmentsData, setAppointmentsData] = React.useState<AppointmentRow[]>([]);

    const handleGenerateReport = React.useCallback(async () => {
        if (!date?.from || !date?.to) {
            toast({ title: "Fechas requeridas", description: "Por favor, seleccione un rango de fechas.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const data = await getAppointmentsReport({
                dateFrom: date.from,
                dateTo: date.to,
                serviceType: serviceType === 'todos' ? undefined : serviceType,
                status: status === 'todos' ? undefined : status,
            });
            setAppointmentsData(data);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [date, serviceType, status, toast]);

    React.useEffect(() => {
        handleGenerateReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            font-size: 10px;
        }
        @page {
          size: letter landscape;
          margin: 0.8cm;
        }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
    `;
        const styleEl = iframeDoc.createElement('style');
        styleEl.innerHTML = printStyles;
        iframeDoc.head.appendChild(styleEl);

        const clonedNode = node.cloneNode(true) as HTMLElement;
        iframeDoc.body.innerHTML = '';
        iframeDoc.body.appendChild(clonedNode);

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 500);
    };

    const ReportToPrint = () => {
        return (
            <div className="bg-card p-4 text-black">
                <div className="flex items-center px-8">
                    <img src="/recipe/logo.png" alt="Logo Izquierda" style={{ height: '70px' }} />
                    <div className="flex-grow">
                        <DocumentHeader />
                    </div>
                    <img src="/recipe/logo_si.png" alt="Logo Derecha" style={{ height: '70px' }} />
                </div>
                <div className="text-center my-2">
                    <h2 className="font-extrabold text-lg">Reporte de Citas y Consultas</h2>
                    <p className="text-sm">
                        Período: {date?.from ? format(date.from, 'P', { locale: es }) : ''} - {date?.to ? format(date.to, 'P', { locale: es }) : ''}
                    </p>
                    {serviceType !== 'todos' && <p className="text-xs">Servicio: {serviceType}</p>}
                    {status !== 'todos' && <p className="text-xs">Estado: {status}</p>}
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-1 text-left">Fecha</th>
                            <th className="border border-black p-1 text-left">Hora</th>
                            <th className="border border-black p-1 text-left">Cédula</th>
                            <th className="border border-black p-1 text-left">Paciente</th>
                            <th className="border border-black p-1 text-left">Servicio</th>
                            <th className="border border-black p-1 text-left">Médico</th>
                            <th className="border border-black p-1 text-left">Estado</th>
                            <th className="border border-black p-1 text-left">Reintegro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointmentsData.map((row, idx) => (
                            <tr key={idx}>
                                <td className="border border-black p-1">{row.fecha}</td>
                                <td className="border border-black p-1">{row.hora}</td>
                                <td className="border border-black p-1">{row.cedula}</td>
                                <td className="border border-black p-1">{row.paciente}</td>
                                <td className="border border-black p-1">{row.servicio}</td>
                                <td className="border border-black p-1">{row.medico}</td>
                                <td className="border border-black p-1">{row.estado}</td>
                                <td className="border border-black p-1 text-center">{row.isReintegro ? 'SÍ' : 'NO'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 text-xs text-center">
                    <p>Total de registros: {appointmentsData.length}</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-6rem)]">
                {/* Header */}
                <div className="mb-8 border-b border-border/50 pb-6">
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2 mb-2">
                        <ClipboardCheck className="h-7 w-7 text-primary" />
                        Reporte de Pacientes
                    </h2>
                    <p className="text-muted-foreground">Historial detallado de citas y consultas. Utilice los filtros para refinar los resultados.</p>
                </div>

                {/* Advanced Filters Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center justify-between mb-8 bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                        <div className="w-full md:w-[240px]">
                            <label className="text-xs font-semibold text-muted-foreground ml-3 mb-1 block uppercase tracking-wider">Fecha</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl border-border bg-card hover:bg-blue-50/50",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/80" />
                                        {date?.from ? (
                                            date.to ? (
                                                <span className="text-foreground/90 text-sm">
                                                    {format(date.from, "dd MMM", { locale: es })} - {format(date.to, "dd MMM, yyyy", { locale: es })}
                                                </span>
                                            ) : (
                                                <span className="text-foreground/90 text-sm">{format(date.from, "PPP", { locale: es })}</span>
                                            )
                                        ) : (
                                            <span className="text-muted-foreground/80 text-sm">Seleccione fechas</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="w-full md:w-[200px]">
                            <label className="text-xs font-semibold text-muted-foreground ml-3 mb-1 block uppercase tracking-wider">Servicio</label>
                            <Select value={serviceType} onValueChange={setServiceType}>
                                <SelectTrigger className="rounded-xl border-border bg-card text-foreground/90">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los servicios</SelectItem>
                                    <SelectItem value="Consulta Médica">Consulta Médica</SelectItem>
                                    <SelectItem value="Pediatría">Pediatría</SelectItem>
                                    <SelectItem value="Enfermería">Enfermería</SelectItem>
                                    <SelectItem value="Medicina Familiar">Medicina Familiar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-[200px]">
                            <label className="text-xs font-semibold text-muted-foreground ml-3 mb-1 block uppercase tracking-wider">Estado</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="rounded-xl border-border bg-card text-foreground/90">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Cualquier estado</SelectItem>
                                    <SelectItem value="Completada">Completada</SelectItem>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full xl:w-auto mt-4 xl:mt-0">
                        <Button onClick={handleGenerateReport} disabled={isLoading} className="flex-1 xl:flex-none rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                            Filtrar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsPrintDialogOpen(true)}
                            disabled={isLoading || appointmentsData.length === 0}
                            className="flex-1 xl:flex-none rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => toast({ description: "Funcionalidad de Excel en desarrollo", duration: 2000 })}
                            disabled={isLoading || appointmentsData.length === 0}
                            className="flex-1 xl:flex-none rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sheet mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="3" x2="21" y1="15" y2="15" /><line x1="9" x2="9" y1="9" y2="21" /><line x1="15" x2="15" y1="9" y2="21" /></svg>
                            Excel
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-blue-400" /></div>
                ) : appointmentsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center bg-muted/50 rounded-2xl border border-border/50">
                        <div className="bg-card p-4 rounded-full shadow-sm mb-4">
                            <ClipboardCheck className="h-8 w-8 text-muted-foreground/60" />
                        </div>
                        <p className="text-muted-foreground font-medium">No se encontraron registros para los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="bg-muted/50 px-6 py-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-extrabold text-foreground/90">Resultados</h3>
                            <Badge variant="secondary" className="bg-card text-foreground/80 border border-border">{appointmentsData.length} registros</Badge>
                        </div>
                        <ScrollArea className="h-[600px] bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/50 hover:bg-transparent bg-muted/30">
                                        <TableHead className="font-extrabold text-foreground/90 pl-6">Fecha</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90">Hora</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90">Cédula</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90">Paciente</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90">Servicio</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90">Médico</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90">Estado</TableHead>
                                        <TableHead className="font-extrabold text-foreground/90 text-center">Reintegro</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointmentsData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-blue-50/30 border-border/50">
                                            <TableCell className="font-medium text-foreground/90 pl-6">{row.fecha}</TableCell>
                                            <TableCell className="text-foreground/80">{row.hora}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{row.cedula}</TableCell>
                                            <TableCell className="font-medium text-foreground">{row.paciente}</TableCell>
                                            <TableCell className="text-foreground/80">{row.servicio}</TableCell>
                                            <TableCell className="text-foreground/80">{row.medico}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                                    row.estado === 'Completada' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                    row.estado === 'Pendiente' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                    row.estado === 'Cancelada' && "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                )}>
                                                    {row.estado}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {row.isReintegro ? (
                                                    <Badge className="bg-blue-500 text-white border-none shadow-sm shadow-blue-500/20">REINTEGRO</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                )}
            </div>

            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Imprimir Reporte</DialogTitle>
                        <DialogDescription>
                            Vista previa del reporte. Use el botón de abajo para imprimir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-auto border rounded-md">
                        <div ref={printRef}>
                            <ReportToPrint />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
