"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface VolumeData {
    date: string
    count: number
}

interface VolumeAreaChartProps {
    data: VolumeData[]
}

export function VolumeAreaChart({ data }: VolumeAreaChartProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="grid gap-1">
                    <CardTitle className="text-base font-semibold">Flujo de Pacientes</CardTitle>
                    <CardDescription>Volumen de consultas por día</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = typeof value === 'string' ? parseISO(value) : new Date(value)
                                return format(date, "d MMM", { locale: es })
                            }}
                            className="text-[10px] text-muted-foreground fill-muted-foreground"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            className="text-[10px] text-muted-foreground fill-muted-foreground"
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-md">
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground font-medium mb-1">
                                                    {format(typeof label === 'string' ? parseISO(label) : new Date(label), "PPP", { locale: es })}
                                                </span>
                                                <span className="font-bold text-blue-600 text-sm">
                                                    {payload[0].value} {payload[0].value === 1 ? 'consulta' : 'consultas'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar
                            dataKey="count"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
