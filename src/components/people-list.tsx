

'use client';

import { calculateAge } from '@/lib/utils';


import * as React from 'react';
import type { Persona } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getPersonas, createPersona, updatePersona, deletePersona, bulkCreatePersonas } from '@/actions/patient-actions';
import { MoreHorizontal, Pencil, PlusCircle, Trash2, Upload, Contact, Download } from 'lucide-react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUser } from './app-shell';
import { Label } from './ui/label';
import * as XLSX from 'xlsx';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';

const PersonForm = dynamic(() => import('./person-form').then(mod => mod.PersonForm), {
    loading: () => <div className="p-8"><Skeleton className="h-48 w-full" /></div>,
});


const PAGE_SIZE = 20;

export function PeopleList() {
    const { toast } = useToast();
    const user = useUser();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [personas, setPersonas] = React.useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalCount, setTotalCount] = React.useState(0);
    const [importResult, setImportResult] = React.useState<{ imported: number, skipped: number, errors: string[] } | null>(null);
    const [isResultDialogOpen, setIsResultDialogOpen] = React.useState(false);

    const canManage = ['superuser', 'administrator', 'admin', 'administradora', 'asistencial', 'secretaria', 'recepcionista'].includes(user.role.id);

    const refreshPersonas = React.useCallback(async (currentSearch: string, page: number) => {
        setIsLoading(true);
        try {
            const { personas: data, totalCount: count } = await getPersonas(currentSearch, page, PAGE_SIZE);
            setPersonas(data);
            setTotalCount(count);
        } catch (error: any) {
            console.error("Error al buscar personas:", error);
            toast({ title: 'Error', description: 'No se pudieron cargar las personas.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    React.useEffect(() => {
        refreshPersonas(debouncedSearch, currentPage);
    }, [debouncedSearch, currentPage, refreshPersonas]);

    const handleOpenForm = (persona: Persona | null) => {
        setSelectedPersona(persona);
        setIsFormOpen(true);
    };

    const handleCloseDialog = () => {
        setIsFormOpen(false);
        setSelectedPersona(null);
    };

    const handleFormSubmitted = async (values: any) => {
        try {
            if (selectedPersona) {
                await updatePersona(selectedPersona.id, values);
                toast({ title: '¡Persona Actualizada!', description: `${values.primerNombre} ${values.primerApellido} ha sido guardado.` });
            } else {
                await createPersona(values);
                toast({ title: '¡Persona Creada!', description: `${values.primerNombre} ${values.primerApellido} ha sido añadida.` });
            }
            handleCloseDialog();
            await refreshPersonas(search, 1); // Go to first page after creation/update
        } catch (error: any) {
            console.error("Error saving persona:", error);
            toast({ title: 'Error', description: error.message || 'No se pudo guardar la persona.', variant: 'destructive' });
        }
    };

    const handleDeletePersona = async (id: string) => {
        try {
            await deletePersona(id);
            toast({ title: '¡Persona Eliminada!', description: 'La persona ha sido eliminada correctamente.' });
            if (personas.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await refreshPersonas(search, currentPage);
            }
        } catch (error: any) {
            console.error("Error deleting persona:", error);
            toast({ title: 'Error al Eliminar', description: error.message || 'No se pudo eliminar la persona.', variant: 'destructive' });
        }
    }

    const columns: ColumnDef<Persona>[] = [
        { accessorKey: "nombreCompleto", header: "Nombre Completo", cell: ({ row }) => <div className="font-medium">{row.original.nombreCompleto}</div> },
        { accessorKey: "cedula", header: "Cédula" },
        {
            accessorKey: 'fechaNacimiento',
            header: 'F. Nacimiento / Edad',
            cell: ({ row }: { row: any }) => {
                const p = row.original;
                if (!p.fechaNacimiento) return <span className="text-muted-foreground text-xs italic">No registrada</span>;
                const age = calculateAge(new Date(p.fechaNacimiento));
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-xs">{new Date(p.fechaNacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5 uppercase tracking-tighter">
                            {age} años
                        </span>
                    </div>
                );
            }
        },
        { accessorKey: "genero", header: "Género" },
        { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || 'N/A' },
        {
            id: "actions",
            cell: ({ row }) => {
                const persona = row.original;
                if (!canManage) return null;
                return (
                    <div className="text-right">
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menú</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleOpenForm(persona)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Editar</span>
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Eliminar</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona y todos sus roles asociados (titular, beneficiario) e historial clínico.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePersona(persona.id)} className="bg-destructive hover:bg-destructive/90">
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

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleExportExcel = () => {
        try {
            if (personas.length === 0) {
                toast({ title: 'No hay datos', description: 'No hay personas para exportar.', variant: 'destructive' });
                return;
            }

            const dataToExport = personas.map(p => ({
                'Nombre Completo': p.nombreCompleto,
                'Cédula': p.cedula,
                'Fecha de Nacimiento': format(new Date(p.fechaNacimiento), 'dd/MM/yyyy'),
                'Género': p.genero,
                'Email': p.email || 'N/A',
                'Teléfono 1': p.telefono1 || '',
                'Teléfono 2': p.telefono2 || '',
                'Dirección': p.direccion || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Personas');

            // Set column widths
            const wscols = [
                { wch: 30 }, // Nombre
                { wch: 15 }, // Cédula
                { wch: 20 }, // Fecha Nac
                { wch: 12 }, // Género
                { wch: 25 }, // Email
                { wch: 15 }, // Tel 1
                { wch: 15 }, // Tel 2
                { wch: 40 }  // Dirección
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `reporte_personas_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
            toast({ title: 'Éxito', description: 'El reporte de personas ha sido exportado.' });
        } catch (error) {
            console.error('Error al exportar Excel:', error);
            toast({ title: 'Error', description: 'No se pudo generar el archivo Excel.', variant: 'destructive' });
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

                if (rows.length === 0) {
                    toast({ title: 'Archivo vacío', description: 'El archivo no contiene datos.', variant: 'destructive' });
                    setIsUploading(false);
                    return;
                }

                // Detect headers and column indices
                const firstRow = rows[0].map(h => String(h || '').toLowerCase().trim());
                const isHeader = firstRow.some(h => ['nombre', 'apellido', 'cédula', 'cedula', 'nacimiento', 'género', 'genero'].some(k => h.includes(k)));

                const getColIndex = (keywords: string[]) => firstRow.findIndex(h => keywords.some(k => h.includes(k)));

                const colIndices = {
                    idxNombre1: getColIndex(['primer nombre', 'nombre 1']),
                    idxApellido1: getColIndex(['primer apellido', 'apellido 1']),
                    idxNombreFull: getColIndex(['nombre completo', 'paciente', 'nombre']),
                    idxCedula: getColIndex(['cédula', 'cedula', 'id', 'documento', 'identidad']),
                    idxFecha: getColIndex(['nacimiento', 'fecha', 'f. nac']),
                    idxGenero: getColIndex(['género', 'genero', 'sexo']),
                    idxEmail: getColIndex(['email', 'correo']),
                    idxTel1: getColIndex(['teléfono 1', 'telefono 1', 'tlf 1']),
                    idxTel2: getColIndex(['teléfono 2', 'telefono 2', 'tlf 2']),
                    idxDireccion: getColIndex(['dirección', 'direccion']),
                    idxNombre2: getColIndex(['segundo nombre', 'nombre 2']),
                    idxApellido2: getColIndex(['segundo apellido', 'apellido 2']),
                };

                const startIndex = isHeader ? 1 : 0;

                // Fallback for NO headers based on the instructions (A-J)
                if (!isHeader) {
                    colIndices.idxNombre1 = 0;   // A
                    colIndices.idxNombre2 = 1;   // B
                    colIndices.idxApellido1 = 2; // C
                    colIndices.idxApellido2 = 3; // D
                    colIndices.idxCedula = 4;    // E
                    colIndices.idxTel1 = 5;      // F
                    colIndices.idxTel2 = 6;      // G
                    colIndices.idxDireccion = 7; // H
                    colIndices.idxFecha = 8;     // I
                    colIndices.idxGenero = 9;    // J
                }

                
                // Security Check: If header exists, we MUST have found critical columns
                if (isHeader) {
                    const missing = [];
                    if (colIndices.idxNombre1 === -1 && colIndices.idxNombreFull === -1) missing.push('Nombre');
                    if (colIndices.idxCedula === -1) missing.push('Cédula');
                    if (colIndices.idxFecha === -1) missing.push('Fecha de Nacimiento');
                    if (colIndices.idxGenero === -1) missing.push('Género');

                    if (missing.length > 0) {
                        toast({ 
                            title: 'Columnas no encontradas', 
                            description: `No pudimos identificar las columnas: ${missing.join(', ')}. Por favor revisa los encabezados de tu archivo.`, 
                            variant: 'destructive' 
                        });
                        setIsUploading(false);
                        return;
                    }
                }

                const mappedData = rows.slice(startIndex)
                    .filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ''))
                    .map((row) => {
                        // Extract Name
                        let primerNombre = '';
                        let primerApellido = '';
                        
                        if (colIndices.idxNombre1 !== -1) {
                            primerNombre = String(row[colIndices.idxNombre1] || '').trim();
                            primerApellido = String(row[colIndices.idxApellido1] !== -1 ? row[colIndices.idxApellido1] : '').trim();
                        } else if (colIndices.idxNombreFull !== -1) {
                            const full = String(row[colIndices.idxNombreFull] || '').trim();
                            const parts = full.split(/\s+/);
                            if (parts.length >= 2) {
                                // If it looks like "LAST FIRST" or "FIRST LAST" we try to split.
                                // Common format in exported lists is "APELLIDO NOMBRE"
                                primerApellido = parts[0];
                                primerNombre = parts.slice(1).join(' ');
                            } else {
                                primerNombre = full;
                            }
                        }

                        // Robust Date Parsing
                        let fechaNac = '';
                        const dateVal = row[colIndices.idxFecha];
                        if (dateVal) {
                            if (dateVal instanceof Date) {
                                fechaNac = `${dateVal.getDate()}/${dateVal.getMonth() + 1}/${dateVal.getFullYear()}`;
                            } else if (typeof dateVal === 'number') {
                                try {
                                    const date = XLSX.SSF.parse_date_code(dateVal);
                                    fechaNac = `${date.d}/${date.m}/${date.y}`;
                                } catch (e) { fechaNac = String(dateVal); }
                            } else { fechaNac = String(dateVal).trim(); }
                        }

                        // Gender mapping
                        let genero = String(row[colIndices.idxGenero] || '').trim().toLowerCase();
                        if (genero.startsWith('m')) genero = 'Masculino';
                        else if (genero.startsWith('f')) genero = 'Femenino';
                        else genero = 'Masculino'; // Default or keep as is

                        return {
                            primerNombre,
                            segundoNombre: colIndices.idxNombre2 !== -1 ? String(row[colIndices.idxNombre2] || '').trim() : '',
                            primerApellido,
                            segundoApellido: colIndices.idxApellido2 !== -1 ? String(row[colIndices.idxApellido2] || '').trim() : '',
                            cedula: colIndices.idxCedula !== -1 ? String(row[colIndices.idxCedula] || '').trim() : '',
                            telefono1: colIndices.idxTel1 !== -1 ? String(row[colIndices.idxTel1] || '').trim() : '',
                            telefono2: colIndices.idxTel2 !== -1 ? String(row[colIndices.idxTel2] || '').trim() : '',
                            direccion: colIndices.idxDireccion !== -1 ? String(row[colIndices.idxDireccion] || '').trim() : '',
                            fechaNacimiento: fechaNac,
                            genero: genero as any,
                            email: colIndices.idxEmail !== -1 ? String(row[colIndices.idxEmail] || '').trim() : '',
                        };
                    });

                const result = await bulkCreatePersonas(mappedData);
                setImportResult(result);
                setIsResultDialogOpen(true);
                await refreshPersonas(search, 1);
            } catch (error) {
                console.error('Error:', error);
                toast({ title: 'Error Crítico', description: 'Ocurrió un fallo al procesar el archivo.', variant: 'destructive' });
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };


    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">Repositorio de Personas</h2>
                    <p className="text-sm text-muted-foreground">
                        Busque, cree y gestione el registro central de todas las personas en el sistema.
                    </p>
                </div>

                <div className="flex justify-between items-center bg-card p-1 rounded-2xl">
                    <Input
                        placeholder="Buscar por nombre, cédula o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm border-none shadow-none focus-visible:ring-0 bg-transparent"
                    />
                </div>

                <div className="flex justify-between items-center mb-6 gap-4">
                    <Input
                        placeholder="Buscar por nombre, cédula o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm bg-card"
                    />
                    {canManage && (
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                className="hidden"
                            />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" disabled={isUploading} className="rounded-xl border-border">
                                        {isUploading ? <Skeleton className="h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Importar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Formato para Importación</AlertDialogTitle>
                                        <AlertDialogDescription asChild>
                                            <div className="text-left space-y-3 pt-2 text-sm">
                                                <p>Para una importación exitosa, su archivo CSV o Excel debe seguir este orden de columnas. No incluya una fila de encabezados.</p>
                                                <ul className="list-disc list-inside bg-muted/50 p-4 rounded-md border space-y-1">
                                                    <li><strong className="font-semibold">Columna A:</strong> Primer Nombre (Texto, Requerido)</li>
                                                    <li><strong className="font-semibold">Columna B:</strong> Segundo Nombre (Texto, Opcional)</li>
                                                    <li><strong className="font-semibold">Columna C:</strong> Primer Apellido (Texto, Requerido)</li>
                                                    <li><strong className="font-semibold">Columna D:</strong> Segundo Apellido (Texto, Opcional)</li>
                                                    <li><strong className="font-semibold">Columna E:</strong> Cédula (Texto, Requerido). <strong>Importante:</strong> Debe incluir el prefijo de nacionalidad. Ejemplos: "V-12345678" o "E-87654321".</li>
                                                    <li><strong className="font-semibold">Columna F:</strong> Teléfono 1 (Texto, Opcional, ej: 0212-5551234)</li>
                                                    <li><strong className="font-semibold">Columna G:</strong> Teléfono 2 (Texto, Opcional, ej: 0414-1234567)</li>
                                                    <li><strong className="font-semibold">Columna H:</strong> Dirección (Texto, Opcional)</li>
                                                    <li><strong className="font-semibold">Columna I:</strong> Fecha de Nacimiento (Fecha, Requerido, formato: DD/MM/AAAA)</li>
                                                    <li><strong className="font-semibold">Columna J:</strong> Género (Texto, Requerido, valores: 'Masculino' o 'Femenino')</li>
                                                </ul>
                                                <p>El sistema ignorará automáticamente cualquier persona cuya cédula ya exista en la base de datos.</p>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleImportClick}>
                                            Continuar e Importar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="outline" onClick={handleExportExcel} className="rounded-xl border-border">
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>
                            <Button onClick={() => handleOpenForm(null)} className="rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Persona
                            </Button>
                        </div>
                    )}
                </div>
                <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-card">
                    <DataTable
                        columns={columns}
                        data={personas}
                        isLoading={isLoading}
                        pageCount={Math.ceil(totalCount / PAGE_SIZE)}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        emptyState={{
                            icon: Contact,
                            title: "No se han encontrado personas",
                            description: "Puede crear la primera persona usando el botón de arriba.",
                        }}
                    />
                </div>
            </div>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Resumen de Importación</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-primary/10 p-4 rounded-xl text-center">
                                <p className="text-sm font-medium text-primary">Importados</p>
                                <p className="text-3xl font-bold">{importResult?.imported}</p>
                            </div>
                            <div className="bg-destructive/10 p-4 rounded-xl text-center">
                                <p className="text-sm font-medium text-destructive">Saltados</p>
                                <p className="text-3xl font-bold">{importResult?.skipped}</p>
                            </div>
                        </div>
                        
                        {importResult?.errors && importResult.errors.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Detalle de registros no importados:</Label>
                                <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 bg-muted/30 space-y-2 text-xs">
                                    {importResult.errors.map((error, idx) => (
                                        <div key={idx} className="p-2 border-b last:border-0 border-border flex items-start gap-2">
                                            <span className="text-destructive font-bold">•</span>
                                            <span>{error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Button className="w-full rounded-xl" onClick={() => setIsResultDialogOpen(false)}>Entendido</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedPersona ? 'Editar Persona' : 'Crear Nueva Persona'}</DialogTitle>
                    </DialogHeader>
                    {isFormOpen && (
                        <PersonForm
                            key={selectedPersona?.id || 'new'}
                            persona={selectedPersona}
                            onSubmitted={handleFormSubmitted}
                            onCancel={handleCloseDialog}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
