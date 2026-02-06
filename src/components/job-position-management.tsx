'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { getJobPositions, createJobPosition, updateJobPosition, deleteJobPosition } from '@/actions/occupational-actions'; // Ensure these exist
import { useDebounce } from '@/hooks/use-debounce';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from './ui/badge';
import type { JobPosition } from '@/lib/zod-schemas/occupational';

const JobPositionForm = dynamic(() => import('./job-position-form').then(mod => mod.JobPositionForm), {
    loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 10;

export function JobPositionManagement() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [positions, setPositions] = React.useState<JobPosition[]>([]);
    const [selectedPosition, setSelectedPosition] = React.useState<JobPosition | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalCount, setTotalCount] = React.useState(0);

    const refreshPositions = React.useCallback(async (currentSearch: string, page: number) => {
        setIsLoading(true);
        try {
            const { jobPositions, totalCount: count } = await getJobPositions(currentSearch, page, PAGE_SIZE);
            setPositions(jobPositions);
            setTotalCount(count);
        } catch (error) {
            console.error("Error al cargar puestos:", error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los puestos de trabajo.',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    React.useEffect(() => {
        refreshPositions(debouncedSearch, currentPage);
    }, [debouncedSearch, currentPage, refreshPositions]);

    const handleOpenForm = (position: JobPosition | null) => {
        setSelectedPosition(position);
        setIsFormOpen(true);
    };

    const handleCloseDialog = () => {
        setIsFormOpen(false);
        setSelectedPosition(null);
    };

    const handleFormSubmitted = async (values: any) => {
        try {
            if (selectedPosition && selectedPosition.id) {
                const updated = await updateJobPosition({ ...values, id: selectedPosition.id });
                if (!updated.success) throw new Error(updated.error);
                toast({ title: '¡Puesto Actualizado!', description: `${(updated as any).name} ha sido guardado.` });
            } else {
                const created = await createJobPosition(values);
                if (!created.success) throw new Error(created.error);
                toast({ title: '¡Puesto Creado!', description: `El puesto ha sido añadido.` });
            }
            handleCloseDialog();
            await refreshPositions(search, 1);
        } catch (error: any) {
            console.error("Error al guardar puesto:", error);
            toast({ title: 'Error', description: error.message || 'No se pudo guardar el puesto.', variant: 'destructive' });
        }
    };

    const handleDeletePosition = async (id: string) => {
        try {
            await deleteJobPosition(id);
            toast({ title: '¡Puesto Eliminado!', description: 'El puesto ha sido eliminado correctamente.' });
            if (positions.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await refreshPositions(search, currentPage);
            }
        } catch (error: any) {
            console.error("Error al eliminar puesto:", error);
            toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar el puesto.', variant: 'destructive' });
        }
    }

    const columns: ColumnDef<JobPosition>[] = [
        { accessorKey: "name", header: "Nombre del Puesto", cell: ({ row }) => <div className="font-semibold text-foreground/90">{row.original.name}</div> },
        {
            accessorKey: "riskLevel",
            header: "Nivel de Riesgo",
            cell: ({ row }) => {
                const level = row.original.riskLevel;
                let badgeClass = "bg-muted text-foreground/80 border-border"; // Default

                if (level === 'Muy Alto' || level === 'Alto') {
                    badgeClass = "bg-red-50 text-red-700 border-red-100 hover:bg-red-100";
                } else if (level === 'Medio') {
                    badgeClass = "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-100";
                } else if (level === 'Bajo') {
                    badgeClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-100";
                }

                return (
                    <Badge className={`shadow-none font-medium px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                        {level}
                    </Badge>
                );
            }
        },
        { accessorKey: "risks", header: "Riesgos Asociados", cell: ({ row }) => <div className="max-w-xs truncate text-xs text-muted-foreground">{(row.original.risks || []).join(', ')}</div> },
        {
            id: "actions",
            cell: ({ row }) => {
                const position = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(position)} className="h-8 w-8 text-muted-foreground/80 hover:text-primary hover:bg-blue-50 rounded-full">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/80 hover:text-red-600 hover:bg-red-50 rounded-full">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar Puesto?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => position.id && handleDeletePosition(position.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sí, eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            }
        }
    ];

    return (
        <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                        <HardHat className="h-7 w-7 text-primary" />
                        Puestos de Trabajo
                    </h2>
                    <p className="text-muted-foreground mt-1">Gestione los perfiles de cargo y sus riesgos asociados.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <Input
                            placeholder="Buscar puesto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-full sm:w-64 rounded-full border-border bg-muted/50 focus:bg-card transition-all"
                        />
                    </div>
                    <Button onClick={() => handleOpenForm(null)} className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 px-6">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Puesto
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
                <DataTable
                    columns={columns}
                    data={positions}
                    isLoading={isLoading}
                    pageCount={Math.ceil(totalCount / PAGE_SIZE)}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    emptyState={{
                        icon: HardHat,
                        title: "No se encontraron puestos",
                        description: "Puede crear el primer puesto usando el botón de arriba.",
                    }}
                />
            </div>


            <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedPosition ? 'Editar Puesto' : 'Crear Puesto de Trabajo'}</DialogTitle>
                    </DialogHeader>
                    {isFormOpen && (
                        <JobPositionForm
                            jobPosition={selectedPosition}
                            onSubmitted={handleFormSubmitted}
                            onCancel={handleCloseDialog}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
