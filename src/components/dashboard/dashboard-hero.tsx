"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Icon } from "@iconify/react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
    { name: "Lun", total: 150 },
    { name: "Mar", total: 230 },
    { name: "Mie", total: 180 },
    { name: "Jue", total: 290 },
    { name: "Vie", total: 200 },
    { name: "Sab", total: 120 },
    { name: "Dom", total: 80 },
]

export function DashboardHero() {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 mesh-gradient border-none text-white shadow-2xl dark:shadow-none overflow-hidden relative rounded-[3rem] p-4 md:p-8">
            {/* Decorative circles - enhanced with glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-[10s]"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-blue-400/30 rounded-full blur-3xl pointer-events-none animate-bounce duration-[8s] opacity-50"></div>

            <CardHeader className="relative z-10 p-0 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-3xl font-extrabold text-white tracking-tight">Resumen Semanal</CardTitle>
                        <CardDescription className="text-blue-100/70 font-medium">Panel de actividad clínica en tiempo real</CardDescription>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-lg">
                        <Icon icon="solar:pulse-2-bold-duotone" className="h-8 w-8 text-white drop-shadow-glow" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="z-10 relative p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                    <div className="flex flex-col group">
                        <span className="text-blue-100/60 text-sm font-semibold uppercase tracking-wider mb-1">Pacientes Atendidos</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black tracking-tighter">1,234</span>
                            <span className="text-sm bg-emerald-400/20 text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold border border-emerald-400/30">
                                <Icon icon="solar:graph-up-bold-duotone" className="h-3.5 w-3.5" /> +12%
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-blue-100/60 text-sm font-semibold uppercase tracking-wider mb-1">Consultas Hoy</span>
                        <span className="text-5xl font-black tracking-tighter">42</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-blue-100/60 text-sm font-semibold uppercase tracking-wider mb-1">Tiempo Promedio</span>
                        <span className="text-5xl font-black tracking-tighter">18m</span>
                    </div>
                </div>

                <div className="h-[220px] w-full mt-4 -mx-2 md:-mx-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}
                                itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                                cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#ffffff"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
