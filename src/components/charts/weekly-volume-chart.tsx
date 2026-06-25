"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"

interface WeeklyData {
    week: string
    count: number
}

interface WeeklyVolumeChartProps {
    data: WeeklyData[]
}

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
    return (
        <Card className="overflow-hidden border-none shadow-none bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <div className="grid gap-1">
                    <CardTitle className="text-base font-bold text-foreground/80">Tendencia Semanal de Atención</CardTitle>
                    <CardDescription className="text-xs">Volumen total de pacientes agrupados por semana</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-4 px-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis
                            dataKey="week"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = typeof value === 'string' ? parseISO(value) : new Date(value)
                                return `Sem ${format(date, "w", { locale: es })}`
                            }}
                            className="text-[10px] text-muted-foreground fill-muted-foreground font-medium"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            className="text-[10px] text-muted-foreground fill-muted-foreground font-medium"
                        />
                        <Tooltip
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const date = typeof label === 'string' ? parseISO(label) : new Date(label)
                                    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
                                    return (
                                        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl border-primary/10">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                                                    Semana del {format(weekStart, "d 'de' MMMM", { locale: es })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    <span className="font-extrabold text-foreground text-base">
                                                        {payload[0].value} <span className="text-xs font-normal text-muted-foreground">pacientes</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
