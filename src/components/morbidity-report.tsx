
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, AreaChart, BarChart } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { getMorbidityReport } from '@/actions/patient-actions';
import type { MorbidityReportRow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export function MorbidityReport() {
  const { toast } = useToast();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [reportData, setReportData] = React.useState<MorbidityReportRow[]>([]);
  
  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to) {
        toast({ title: "Fechas requeridas", description: "Por favor, seleccione un rango de fechas.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
        const data = await getMorbidityReport({ from: date.from, to: date.to });
        setReportData(data);
    } catch (error) {
        toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive"});
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };
  
  React.useEffect(() => {
    handleGenerateReport();
  }, []);

  const top10Data = reportData.slice(0, 10).sort((a, b) => a.frequency - b.frequency);

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Reporte de Morbilidad</CardTitle>
                <CardDescription>
                    Filtre y visualice las causas de consulta más frecuentes en un período determinado.
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
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <AreaChart className="mr-2 h-4 w-4" />}
                    Generar Reporte
                </Button>
            </CardContent>
        </Card>

        {isLoading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground"/></div>
        ) : reportData.length === 0 ? (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No se encontraron datos de morbilidad para el período seleccionado.
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top 10 Causas de Consulta</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart layout="vertical" data={top10Data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="cie10Description" type="category" width={200} interval={0} tick={{ fontSize: 12, width: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}/>
                                <Tooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
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
                                <Bar dataKey="frequency" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tabla de Frecuencias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Diagnóstico</TableHead>
                                    <TableHead className="text-right">Frec.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((row) => (
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
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
