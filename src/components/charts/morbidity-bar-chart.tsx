"use client"

import { BarChart as BarChartIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MorbidityData {
    cie10Code: string
    cie10Description: string
    frequency: number
}

interface MorbidityBarChartProps {
    data: MorbidityData[]
}

export function MorbidityBarChart({ data }: MorbidityBarChartProps) {
    // Sort and take top 10 just in case
    const chartData = [...data].sort((a, b) => b.frequency - a.frequency).slice(0, 10);
    const total = chartData.reduce((acc, curr) => acc + curr.frequency, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Morbilidad (CIE-10)</CardTitle>
                <CardDescription>Diagnósticos más frecuentes en el período</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="cie10Description"
                                type="category"
                                width={150}
                                tick={{ fontSize: 11 }}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Diagnóstico</span>
                                                    <span className="font-bold text-foreground text-sm">{payload[0].payload.cie10Description}</span>
                                                    <span className="text-xs text-muted-foreground mt-1">Código: {payload[0].payload.cie10Code}</span>
                                                    <span className="font-bold mt-1">
                                                        {payload[0].value} casos ({total > 0 ? ((Number(payload[0].value) / total) * 100).toFixed(1) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="frequency" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]}>
                                <LabelList dataKey="frequency" position="right" className="fill-foreground text-xs font-bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <div className="rounded-full bg-muted p-4">
                            <BarChart className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No hay diagnósticos registrados</p>
                        <p className="text-xs text-muted-foreground/70">Asocia códigos CIE-10 a tus consultas para ver estadísticas.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
