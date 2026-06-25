"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
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
        <Card className="overflow-hidden border-none shadow-none bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <div className="grid gap-1">
                    <CardTitle className="text-base font-bold text-foreground/80">Flujo de Pacientes</CardTitle>
                    <CardDescription className="text-xs">Volumen de consultas por día</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-4 px-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorCountSimple" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = typeof value === 'string' ? parseISO(value) : new Date(value)
                                return format(date, "d MMM", { locale: es })
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
                            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl border-blue-500/10">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                                                    {format(typeof label === 'string' ? parseISO(label) : new Date(label), "PPP", { locale: es })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                    <span className="font-extrabold text-foreground text-base">
                                                        {payload[0].value} <span className="text-xs font-normal text-muted-foreground">{payload[0].value === 1 ? 'consulta' : 'consultas'}</span>
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
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCountSimple)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
