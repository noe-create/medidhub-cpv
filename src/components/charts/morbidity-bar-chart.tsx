"use client"

import { BarChart as BarChartIcon, LayoutPanelLeft } from "lucide-react"
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
    // Sort and take top 10
    const chartData = [...data]
        .filter(item => item.cie10Description !== 'N/A' && item.cie10Description !== '')
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

    const total = chartData.reduce((acc, curr) => acc + curr.frequency, 0);

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-2">
                <CardTitle className="text-base font-bold text-foreground/80 flex items-center gap-2">
                    <LayoutPanelLeft className="h-4 w-4 text-emerald-500" />
                    Principales Diagnósticos
                </CardTitle>
                <CardDescription className="text-xs">Distribución de morbilidad detectada en el periodo</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center px-0 pt-4">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 0, right: 60, top: 10, bottom: 10 }}
                            barSize={32}
                        >
                            <defs>
                                <linearGradient id="colorFreq" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="cie10Description"
                                type="category"
                                width={180}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
                                interval={0}
                                tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl border-emerald-500/10">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Diagnóstico</span>
                                                    <span className="font-extrabold text-foreground text-sm max-w-[200px] leading-tight">
                                                        {payload[0].payload.cie10Description}
                                                    </span>
                                                    <div className="mt-2 flex items-center gap-2 border-t border-emerald-100 pt-2">
                                                        <span className="text-emerald-600 font-extrabold text-lg">
                                                            {payload[0].value}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            casos ({total > 0 ? ((Number(payload[0].value) / total) * 100).toFixed(1) : 0}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="frequency"
                                fill="url(#colorFreq)"
                                radius={[0, 6, 6, 0]}
                                animationDuration={1500}
                                animationBegin={200}
                            >
                                <LabelList
                                    dataKey="frequency"
                                    position="right"
                                    className="fill-emerald-600 font-black text-xs"
                                    offset={10}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/20 w-full h-full">
                        <div className="rounded-full bg-background p-4 shadow-sm">
                            <BarChartIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-muted-foreground">No hay diagnósticos registrados</p>
                            <p className="text-xs text-muted-foreground/60 max-w-[200px]">Los diagnósticos ingresados en las consultas aparecerán aquí automáticamente.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
