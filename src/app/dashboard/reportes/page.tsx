
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMorbidityStats, getConsultationVolume, getWeeklyConsultationVolume } from '@/actions/report-actions';
import { MorbidityBarChart } from '@/components/charts/morbidity-bar-chart';
import { VolumeAreaChart } from '@/components/charts/volume-area-chart';
import { WeeklyVolumeChart } from '@/components/charts/weekly-volume-chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { addDays, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, TrendingUp, Users, Activity, HeartPulse, Sparkles, Calendar as CalendarIcon, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function ReportesPage() {
    const { toast } = useToast();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [morbidityData, setMorbidityData] = React.useState<any[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    const [volumeData, setVolumeData] = React.useState<any[]>([]);
    const [weeklyVolumeData, setWeeklyVolumeData] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGenerateReport = async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast({
                title: "Error",
                description: "Por favor seleccione un rango de fechas",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            const [morbidity, volume, weeklyVolume] = await Promise.all([
                getMorbidityStats({ from: dateRange.from, to: dateRange.to }),
                getConsultationVolume({ from: dateRange.from, to: dateRange.to }),
                getWeeklyConsultationVolume({ from: dateRange.from, to: dateRange.to })
            ]);

            setMorbidityData(morbidity);
            setVolumeData(volume);
            setWeeklyVolumeData(weeklyVolume);
        } catch (error) {
            console.error("Error generating report:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos del reporte",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = () => {
        try {
            if (morbidityData.length === 0 && volumeData.length === 0) {
                toast({ title: "Sin datos", description: "No hay datos para exportar", variant: "destructive" });
                return;
            }

            const workbook = XLSX.utils.book_new();

            // Morbidity Sheet
            if (morbidityData.length > 0) {
                const morbiditySheet = XLSX.utils.json_to_sheet(morbidityData.map(d => ({
                    'Diagnóstico': d.cie10Description,
                    'Frecuencia': d.frequency || d.count,
                })));
                XLSX.utils.book_append_sheet(workbook, morbiditySheet, 'Morbilidad');
            }

            // Volume Sheet
            if (volumeData.length > 0) {
                const volumeSheet = XLSX.utils.json_to_sheet(volumeData.map(d => ({
                    'Fecha': d.date,
                    'Pacientes': d.count
                })));
                XLSX.utils.book_append_sheet(workbook, volumeSheet, 'Volumen Diario');
            }

            // Weekly Volume Sheet
            if (weeklyVolumeData.length > 0) {
                const weeklySheet = XLSX.utils.json_to_sheet(weeklyVolumeData.map(d => ({
                    'Semana': d.week,
                    'Pacientes': d.count
                })));
                XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Volumen Semanal');
            }

            XLSX.writeFile(workbook, `reporte_analitica_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
            toast({ title: "Éxito", description: "Reporte exportado correctamente" });
        } catch (error) {
            console.error("Error exporting excel:", error);
            toast({ title: "Error", description: "No se pudo exportar a Excel", variant: "destructive" });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    React.useEffect(() => {
        handleGenerateReport();
    }, []);

    const filteredMorbidity = React.useMemo(() => {
        if (!searchTerm) return morbidityData;
        const lower = searchTerm.toLowerCase();
        return morbidityData.filter(d => d.cie10Description?.toLowerCase().includes(lower));
    }, [morbidityData, searchTerm]);

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-slate-50/50 min-h-screen">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Activity className="h-8 w-8 text-primary animate-pulse" />
                        Centro de Analítica Médica
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Visualización avanzada de indicadores de salud y rendimiento de la clínica
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal border-slate-200 bg-white shadow-sm",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                            {format(dateRange.to, "LLL dd, y", { locale: es })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y", { locale: es })
                                    )
                                ) : (
                                    <span>Seleccione rango de fechas</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Actualizar Datos
                    </Button>
                </div>
            </div>

            {/* Top Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="h-16 w-16 text-primary" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">Pacientes Atendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">
                            {volumeData.reduce((acc, curr) => acc + curr.count, 0)}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Total en el período seleccionado</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-16 w-16 text-blue-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">Promedio Semanal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">
                            {weeklyVolumeData.length > 0
                                ? (weeklyVolumeData.reduce((acc, curr) => acc + curr.count, 0) / weeklyVolumeData.length).toFixed(1)
                                : 0
                            }
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Pacientes por semana</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HeartPulse className="h-16 w-16 text-emerald-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">Diagnóstico Principal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-black text-slate-900 truncate max-w-full">
                            {morbidityData.length > 0 ? morbidityData[0].cie10Description : 'N/A'}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Causa de consulta más frecuente</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="h-16 w-16 text-orange-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">Día de Mayor Carga</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">
                            {volumeData.length > 0
                                ? format(parseISO([...volumeData].sort((a, b) => b.count - a.count)[0].date), 'EEEE', { locale: es })
                                : 'N/A'
                            }
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Día con más pacientes</p>
                    </CardContent>
                </Card>
            </div>

            {
                isLoading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-blue-400" /></div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            {/* Main Morbidity Chart - Prioritized as requested */}
                            <Card className="lg:col-span-7 bg-white shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between bg-emerald-50/30 border-b border-emerald-100/50 px-6 py-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-black text-slate-800">Morbilidad (Diagnósticos)</CardTitle>
                                        <CardDescription className="text-slate-500">Análisis detallado de las afecciones más frecuentes</CardDescription>
                                    </div>
                                    <div className="flex gap-2 no-print">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportExcel}
                                            disabled={isLoading}
                                            className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Excel
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePrint}
                                            disabled={isLoading}
                                            className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            PDF/Imprimir
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <MorbidityBarChart data={filteredMorbidity} />

                                    {/* Tabla de búsqueda */}
                                    <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-800">Detalles de Afecciones</h4>
                                            <div className="flex items-center gap-2">
                                                <Search className="h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Buscar afección..."
                                                    className="w-[200px] sm:w-[250px] h-9 bg-slate-50 border-slate-200"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                            <div className="max-h-[300px] overflow-y-auto">
                                                <table className="w-full text-sm text-left text-slate-500">
                                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-4 py-3 font-semibold">Diagnóstico Reportado</th>
                                                            <th className="px-4 py-3 font-semibold text-right w-32">Casos</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {filteredMorbidity.length > 0 ? (
                                                            filteredMorbidity.map((item, i) => (
                                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-4 py-3 font-medium text-slate-800">{item.cie10Description}</td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs min-w-[2rem]">
                                                                            {item.frequency || item.count}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                                                                    No se encontraron resultados para la búsqueda
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>



                            {/* Weekly Trend Chart - New Advanced Visual */}
                            <Card className="lg:col-span-7 bg-white shadow-xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b border-primary/10 px-6 py-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                                Análisis de Flujo y Tendencia Semanal
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
                                                Conectado en tiempo real con la base de datos del sistema
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-primary" />
                                                <span className="text-xs font-bold text-slate-600">Volumen Semanal</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-blue-400" />
                                                <span className="text-xs font-bold text-slate-600">Volumen Diario</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid gap-12 lg:grid-cols-2 mt-2">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Tendencia Histórica (Semanas)</h4>
                                            <WeeklyVolumeChart data={weeklyVolumeData} />
                                        </div>
                                        <div className="space-y-4 border-l border-slate-100 lg:pl-12">
                                            <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Distribución Diaria (Días)</h4>
                                            <VolumeAreaChart data={volumeData} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">i</div>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold">Notas sobre la data:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700/80">
                                    <li><strong>Morbilidad Automática:</strong> Se procesan y estandarizan de forma inteligente los textos libres de diagnósticos en consultas para ofrecer estadísticas consolidadas.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
