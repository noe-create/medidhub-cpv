
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, AreaChart, Users, Stethoscope, Printer, User, Users2, BarChart, UsersRound } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { getMorbidityReport, getOperationalReport } from '@/actions/patient-actions';
import type { MorbidityReportRow, OperationalReportData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, LabelList } from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentHeader } from '@/components/document-header';


export default function ReportesPage() {
    const { toast } = useToast();
    const printRef = React.useRef<HTMLDivElement>(null);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [morbidityData, setMorbidityData] = React.useState<MorbidityReportRow[]>([]);
    const [operationalData, setOperationalData] = React.useState<OperationalReportData | null>(null);

    const handleGenerateReport = React.useCallback(async () => {
        if (!date?.from || !date?.to) {
            toast({ title: "Fechas requeridas", description: "Por favor, seleccione un rango de fechas.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const [morbidity, operational] = await Promise.all([
                getMorbidityReport({ from: date.from, to: date.to }),
                getOperationalReport({ from: date.from, to: date.to })
            ]);
            setMorbidityData(morbidity);
            setOperationalData(operational);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron generar los reportes.", variant: "destructive" });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [date, toast]);

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
          size: letter portrait;
          margin: 0.8cm;
        }
        .report-section {
            page-break-inside: avoid;
        }
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

    const top10Morbidity = morbidityData.slice(0, 10).sort((a, b) => a.frequency - b.frequency);
    const serviceChartData = operationalData?.consultationsByService.map(item => ({
        name: item.serviceType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count: item.count
    }));

    const ReportToPrint = () => {
        const totalDemographics = (operationalData?.demographics?.byGender.men || 0) + (operationalData?.demographics?.byGender.women || 0);
        const totalMorbidity = morbidityData.reduce((sum, row) => sum + row.frequency, 0);

        return (
            <div className="bg-white p-4 text-black">
                <div className="flex items-center px-8">
                    <img src="/recipe/logo.png" alt="Logo Salud Integral Izquierda" style={{ height: '70px' }} />
                    <div className="flex-grow">
                        <DocumentHeader />
                    </div>
                    <img src="/recipe/logo_si.png" alt="Logo Salud Integral Derecha" style={{ height: '70px' }} />
                </div>
                <div className="text-center my-2">
                    <h2 className="font-bold text-lg">Informe Gerencial Operativo y de Morbilidad</h2>
                    <p className="text-sm">
                        Período: {date?.from ? format(date.from, 'P', { locale: es }) : ''} - {date?.to ? format(date.to, 'P', { locale: es }) : ''}
                    </p>
                </div>

                <div className="space-y-4 report-section">
                    <div className="p-2 border border-black report-section">
                        <h3 className="font-bold text-center text-sm underline uppercase">Resumen Ejecutivo</h3>
                        <p className="text-xs text-justify">
                            Durante el período del {date?.from ? format(date.from, 'd \'de\' LLLL', { locale: es }) : ''} al {date?.to ? format(date.to, 'd \'de\' LLLL \'de\' yyyy', { locale: es }) : ''},
                            se completaron un total de <strong>{operationalData?.totalConsultations} consultas</strong> y se registraron <strong>{operationalData?.newPeopleRegistered} personas nuevas</strong> en el sistema.
                            El análisis demográfico muestra que la mayoría de los pacientes atendidos fueron {((operationalData?.demographics.byGender.women || 0) > (operationalData?.demographics.byGender.men || 0)) ? 'mujeres' : 'hombres'}.
                            La principal causa de morbilidad registrada fue <strong>{morbidityData[0]?.cie10Description || 'N/A'}</strong>, representando un punto clave para la planificación de recursos y campañas de prevención.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 report-section">
                        <div className="p-2 border border-black">
                            <h3 className="font-bold text-center text-sm underline">DATOS DEMOGRÁFICOS</h3>
                            <div className="text-xs space-y-1 mt-1">
                                <p><strong>Distribución por Género:</strong></p>
                                <p className="pl-2">Femenino: {operationalData?.demographics.byGender.women || 0} ({totalDemographics > 0 ? ((operationalData?.demographics.byGender.women || 0) / totalDemographics * 100).toFixed(1) : 0}%)</p>
                                <p className="pl-2">Masculino: {operationalData?.demographics.byGender.men || 0} ({totalDemographics > 0 ? ((operationalData?.demographics.byGender.men || 0) / totalDemographics * 100).toFixed(1) : 0}%)</p>
                                <p><strong>Distribución por Edad:</strong></p>
                                <p className="pl-2">Pediátricos (&lt;18): {operationalData?.demographics.byAgeGroup.children || 0}</p>
                                <p className="pl-2">Adultos (18-59): {operationalData?.demographics.byAgeGroup.adults || 0}</p>
                                <p className="pl-2">Adultos Mayores (60+): {operationalData?.demographics.byAgeGroup.seniors || 0}</p>
                            </div>
                        </div>
                        <div className="p-2 border border-black">
                            <h3 className="font-bold text-center text-sm underline">RECOMENDACIONES</h3>
                            <p className="text-xs text-justify mt-1">
                                Basado en la alta frecuencia de "{morbidityData[0]?.cie10Description || 'la principal causa'}", se recomienda iniciar una campaña educativa sobre prevención y manejo.
                                Fortalecer el inventario de medicamentos relacionados y considerar talleres informativos para la comunidad.
                            </p>
                        </div>
                    </div>

                    <div className="p-2 border border-black report-section">
                        <h3 className="font-bold text-center text-sm underline">ANÁLISIS DE MORBILIDAD (TOP 10)</h3>
                        <div className="h-[200px] text-[8px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={top10Morbidity} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="2 2" />
                                    <XAxis type="number" domain={[0, 'dataMax + 2']} />
                                    <YAxis dataKey="cie10Description" type="category" width={100} tick={{ fontSize: 8, width: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                                    <Tooltip contentStyle={{ fontSize: '10px', padding: '2px 8px' }} />
                                    <Bar dataKey="frequency" fill="#4a90e2" background={{ fill: '#eee' }}>
                                        <LabelList
                                            dataKey="frequency"
                                            position="right"
                                            style={{ fontSize: 8, fill: 'black' }}
                                            formatter={(value: number) => `${value} (${totalMorbidity > 0 ? (value / totalMorbidity * 100).toFixed(1) : 0}%)`}
                                        />
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
                    <div>
                        <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <BarChart className="h-8 w-8 text-blue-500 opacity-80" />
                            Reportes y Estadísticas
                        </h2>
                        <p className="text-secondary-foreground/90 mt-1 font-medium">Análisis visual de datos operativos y de morbilidad.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filtros del Reporte</CardTitle>
                        <CardDescription>
                            Seleccione el período para el cual desea generar los reportes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[300px] justify-start text-left font-normal",
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
                        <Button onClick={handleGenerateReport} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AreaChart className="mr-2 h-4 w-4" />}
                            Generar Reporte
                        </Button>
                        <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)} disabled={isLoading || !operationalData}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Reporte
                        </Button>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
                ) : !operationalData ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No se encontraron datos para el período seleccionado.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Reporte Operacional</CardTitle>
                                <CardDescription>Resumen de la actividad del centro médico en el período seleccionado.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
                                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{operationalData.totalConsultations}</div>
                                        <p className="text-xs text-muted-foreground">Total de consultas completadas</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Nuevos Registros</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{operationalData.newPeopleRegistered}</div>
                                        <p className="text-xs text-muted-foreground">Personas nuevas en el sistema</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Desglose por Género</CardTitle>
                                        <Users2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{operationalData.demographics.byGender.women} / {operationalData.demographics.byGender.men}</div>
                                        <p className="text-xs text-muted-foreground">Femenino / Masculino</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Desglose por Edad</CardTitle>
                                        <UsersRound className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{operationalData.demographics.byAgeGroup.children} / {operationalData.demographics.byAgeGroup.adults} / {operationalData.demographics.byAgeGroup.seniors}</div>
                                        <p className="text-xs text-muted-foreground">Pediátricos / Adultos / Mayores</p>
                                    </CardContent>
                                </Card>
                                <Card className="md:col-span-2 xl:col-span-4">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">Consultas por Servicio</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[150px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsBarChart data={serviceChartData}>
                                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">{`${payload[0].payload.name}: ${payload[0].value}`}</div>
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                                    <LabelList dataKey="count" position="top" />
                                                </Bar>
                                            </RechartsBarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <Card className="lg:col-span-3">
                                <CardHeader>
                                    <CardTitle>Top 10 Causas de Consulta (Morbilidad)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    {morbidityData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsBarChart layout="vertical" data={top10Morbidity} margin={{ left: 120 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="cie10Description" type="category" width={200} interval={0} tick={{ fontSize: 12, width: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">Diagnóstico</span>
                                                                            <span className="font-bold text-foreground">{payload[0].payload.cie10Description}</span>
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">Frecuencia</span>
                                                                            <span className="font-bold text-foreground">{payload[0].value}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="frequency" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                                    <LabelList dataKey="frequency" position="right" />
                                                </Bar>
                                            </RechartsBarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos de morbilidad.</div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Tabla de Frecuencias</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {morbidityData.length > 0 ? (
                                        <ScrollArea className="h-[400px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Diagnóstico</TableHead>
                                                        <TableHead className="text-right">Frec.</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {morbidityData.map((row) => (
                                                        <TableRow key={row.cie10Code + row.cie10Description}>
                                                            <TableCell>
                                                                <div className="font-medium">{row.cie10Description}</div>
                                                                <div className="text-sm text-muted-foreground">{row.cie10Code}</div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono">{row.frequency}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos para mostrar.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>

            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Imprimir Reporte</DialogTitle>
                        <DialogDescription>
                            Esta es una vista previa del informe. Use el botón de abajo para abrir el diálogo de impresión de su navegador.
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
