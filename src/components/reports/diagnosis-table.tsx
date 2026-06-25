"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { RefreshCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MorbidityData {
    cie10Code: string
    cie10Description: string
    frequency: number
}

interface DiagnosisTableProps {
    data: MorbidityData[]
}

export function DiagnosisTable({ data }: DiagnosisTableProps) {
    const total = data.reduce((acc, curr) => acc + curr.frequency, 0);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Tabla de Frecuencias</CardTitle>
                <CardDescription>Detalle de diagnósticos registrados</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow>
                                <TableHead className="w-[80px]">Código</TableHead>
                                <TableHead>Diagnóstico</TableHead>
                                <TableHead className="text-right">Conteo</TableHead>
                                <TableHead className="text-right">%</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row) => (
                                    <TableRow key={`${row.cie10Code}-${row.cie10Description}`}>
                                        <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                                            {row.cie10Code}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {row.cie10Description}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {row.frequency}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground text-xs">
                                            {total > 0 ? ((row.frequency / total) * 100).toFixed(1) : 0}%
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2 py-8">
                                            <div className="rounded-full bg-muted p-3">
                                                <RefreshCcw className="h-6 w-6 text-muted-foreground/40" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">Lista de diagnósticos vacía</p>
                                            <p className="text-xs text-muted-foreground/60 max-w-[250px] mx-auto">
                                                No se han encontrado registros de diagnósticos CIE-10 para el período seleccionado.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
