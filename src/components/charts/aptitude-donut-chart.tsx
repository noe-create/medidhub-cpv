"use client"

import * as React from "react"
import { PieChart as PieChartIcon } from "lucide-react"
import { Label, Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define colors consistent with the theme
const COLORS = {
    'Apto': 'hsl(var(--chart-2))', // Green-ish usually, or teal
    'Apto con Restricciones': 'hsl(var(--chart-4))', // Orange/Yellow
    'No Apto': 'hsl(var(--chart-5))', // Red
}

interface AptitudeData {
    status: string
    count: number
}

interface AptitudeDonutChartProps {
    data: AptitudeData[]
}

export function AptitudeDonutChart({ data }: AptitudeDonutChartProps) {
    const total = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.count, 0)
    }, [data])

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Aptitud Laboral</CardTitle>
                <CardDescription>Distribución de resultados de evaluaciones</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                <div className="h-[250px] w-full relative flex items-center justify-center">
                    {total > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">Estado</span>
                                                        <span className="font-bold text-foreground">{payload[0].name}</span>
                                                        <span className="font-mono font-medium">{payload[0].value} trabajadores</span>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Pie
                                    data={data}
                                    dataKey="count"
                                    nameKey="status"
                                    innerRadius={60}
                                    outerRadius={85}
                                    strokeWidth={5}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || 'hsl(var(--muted))'} />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {total}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            Evaluaciones
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                            <div className="rounded-full bg-muted p-4">
                                <PieChartIcon className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No hay evaluaciones</p>
                            <p className="text-[10px] text-muted-foreground/70 max-w-[150px]">Se requieren datos del módulo de Medicina Ocupacional.</p>
                        </div>
                    )}
                </div>
            </CardContent>
            <div className="flex justify-center gap-4 p-4 text-xs text-muted-foreground">
                {data.map((item) => (
                    <div key={item.status} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[item.status as keyof typeof COLORS] || 'gray' }} />
                        <span>{item.status}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
