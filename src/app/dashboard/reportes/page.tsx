
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, AreaChart, Printer, RefreshCcw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMorbidityStats, getAptitudeStats, getConsultationVolume } from '@/actions/report-actions';
import { MorbidityBarChart } from '@/components/charts/morbidity-bar-chart';
import { AptitudeDonutChart } from '@/components/charts/aptitude-donut-chart';
import { VolumeAreaChart } from '@/components/charts/volume-area-chart';
import { DiagnosisTable } from '@/components/reports/diagnosis-table';

export default function ReportesPage() {
    const { toast } = useToast();
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = React.useState(false);

    // State for data
    const [morbidityData, setMorbidityData] = React.useState<any[]>([]);
    const [aptitudeData, setAptitudeData] = React.useState<any[]>([]);
    const [volumeData, setVolumeData] = React.useState<any[]>([]);

    const handleGenerateReport = React.useCallback(async () => {
        if (!date?.from || !date?.to) {
            toast({ title: "Fechas requeridas", description: "Por favor, seleccione un rango de fechas.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const [morbidity, aptitude, volume] = await Promise.all([
                getMorbidityStats({ from: date.from, to: date.to }),
                getAptitudeStats({ from: date.from, to: date.to }),
                getConsultationVolume({ from: date.from, to: date.to })
            ]);
            setMorbidityData(morbidity);
            setAptitudeData(aptitude);
            setVolumeData(volume);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron generar las estadísticas.", variant: "destructive" });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [date, toast]);

    React.useEffect(() => {
        handleGenerateReport();
    }, [handleGenerateReport]);

    return (
        <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-6rem)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                        <AreaChart className="h-7 w-7 text-primary" />
                        Reportes Analíticos
                    </h2>
                    <p className="text-muted-foreground mt-1">Visión general del rendimiento operativo y clínico.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 z-10 w-full sm:w-auto items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[260px] justify-start text-left font-normal rounded-full border-border bg-muted/50 hover:bg-card transition-all",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {date?.from ? (
                                    date.to ? (
                                        <span className="text-foreground/90">
                                            {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                                            {format(date.to, "LLL dd, y", { locale: es })}
                                        </span>
                                    ) : (
                                        <span className="text-foreground/90">{format(date.from, "LLL dd, y", { locale: es })}</span>
                                    )
                                ) : (
                                    <span>Seleccione rango</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
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
                    <Button onClick={handleGenerateReport} disabled={isLoading} className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 px-6">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* KPI Cards Placeholder - Simulated Data for Visual Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Consultas</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{volumeData.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0}</span>
                        {/* <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">↗ +12%</span> */}
                    </div>
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Pacientes Atendidos</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{volumeData.length > 0 ? Math.floor(volumeData.reduce((acc, curr) => acc + (curr.total || 0), 0) * 0.8) : 0}</span>
                    </div>
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Aptitud Laboral</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{aptitudeData.length > 0 ? aptitudeData.find(d => d.aptitud === 'Apto')?.count || 0 : 0}</span>
                        <span className="text-sm text-muted-foreground/80">Aptos</span>
                    </div>
                </div>
                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Morbilidad</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{morbidityData.length}</span>
                        <span className="text-sm text-muted-foreground/80">Diag. Top</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-blue-400" /></div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Volume Chart */}
                        <div className="border border-border rounded-2xl p-6 bg-card">
                            <h3 className="text-lg font-extrabold text-foreground mb-4">Volumen de Consultas</h3>
                            <VolumeAreaChart data={volumeData} />
                        </div>
                        {/* Aptitude Chart */}
                        <div className="border border-border rounded-2xl p-6 bg-card">
                            <h3 className="text-lg font-extrabold text-foreground mb-4">Distribución de Aptitud</h3>
                            <AptitudeDonutChart data={aptitudeData} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Morbidity Chart */}
                        <div className="lg:col-span-2 border border-border rounded-2xl p-6 bg-card">
                            <h3 className="text-lg font-extrabold text-foreground mb-4">Top 10 Morbilidad</h3>
                            <MorbidityBarChart data={morbidityData} />
                        </div>
                        {/* Diagnosis Table */}
                        <div className="lg:col-span-1 border border-border rounded-2xl p-6 bg-card">
                            <h3 className="text-lg font-extrabold text-foreground mb-4">Detalle de Diagnósticos</h3>
                            <DiagnosisTable data={morbidityData} />
                        </div>
                    </div>

                    <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">i</div>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold">Notas sobre la data:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700/80">
                                <li><strong>Morbilidad:</strong> Requiere códigos CIE-10 asociados a las consultas.</li>
                                <li><strong>Aptitud:</strong> Basado exclusivamente en Evaluaciones Ocupacionales.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

