'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
            <div className="bg-white p-4 text-black">
                <div className="flex items-center px-8">
                    <img src="/recipe/logo.png" alt="Logo Izquierda" style={{ height: '70px' }} />
                    <div className="flex-grow">
                        <DocumentHeader />
                    </div>
                    <img src="/recipe/logo_si.png" alt="Logo Derecha" style={{ height: '70px' }} />
                </div>
                <div className="text-center my-2">
                    <h2 className="font-bold text-lg">Reporte de Citas y Consultas</h2>
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
            <div className="space-y-6">
                <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
                    <div>
                        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <ClipboardCheck className="h-8 w-8 text-violet-500 opacity-80" />
                            Reporte de Pacientes
                        </h2>
                        <p className="text-secondary-foreground/90 mt-1 font-medium">Consulte el historial de citas y consultas realizadas.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtros del Reporte</CardTitle>
                        <CardDescription>
                            Seleccione los criterios para generar el reporte de pacientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[250px]">
                                <label className="text-sm font-medium mb-2 block">Rango de Fechas</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <>
                                                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                                        {format(date.to, "LLL dd, y", { locale: es })}
                                                    </>
                                                ) : (
                                                    format(date.from, "LLL dd, y", { locale: es })
                                                )
                                            ) : (
                                                <span>Seleccione un rango</span>
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

                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm font-medium mb-2 block">Tipo de Servicio</label>
                                <Select value={serviceType} onValueChange={setServiceType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="Consulta Médica">Consulta Médica</SelectItem>
                                        <SelectItem value="Pediatría">Pediatría</SelectItem>
                                        <SelectItem value="Enfermería">Enfermería</SelectItem>
                                        <SelectItem value="Medicina Familiar">Medicina Familiar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm font-medium mb-2 block">Estado</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="Completada">Completada</SelectItem>
                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleGenerateReport} disabled={isLoading} className="min-w-[150px]">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                                Generar Reporte
                            </Button>
                            <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)} disabled={isLoading || appointmentsData.length === 0}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
                ) : appointmentsData.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No se encontraron registros para el período seleccionado.
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultados del Reporte</CardTitle>
                            <CardDescription>
                                Se encontraron {appointmentsData.length} registros.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Hora</TableHead>
                                            <TableHead>Cédula</TableHead>
                                            <TableHead>Paciente</TableHead>
                                            <TableHead>Servicio</TableHead>
                                            <TableHead>Médico</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appointmentsData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.fecha}</TableCell>
                                                <TableCell>{row.hora}</TableCell>
                                                <TableCell className="font-mono text-sm">{row.cedula}</TableCell>
                                                <TableCell>{row.paciente}</TableCell>
                                                <TableCell>{row.servicio}</TableCell>
                                                <TableCell>{row.medico}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-xs font-medium",
                                                        row.estado === 'Completada' && "bg-green-100 text-green-800",
                                                        row.estado === 'Pendiente' && "bg-yellow-100 text-yellow-800",
                                                        row.estado === 'Cancelada' && "bg-red-100 text-red-800"
                                                    )}>
                                                        {row.estado}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
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
