

'use client';

import * as React from 'react';
import type { TreatmentOrder, TreatmentOrderItem } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Loader2, CheckCircle, XCircle, ClipboardCheck, Syringe, Search, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getTreatmentOrders, createTreatmentExecution, updateTreatmentOrderStatus } from '@/actions/patient-actions';
import { RegisterExecutionForm } from './register-execution-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from './app-shell';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useDebounce } from '@/hooks/use-debounce';

const statusColors: Record<TreatmentOrder['status'], string> = {
  Pendiente: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-300',
  'En Progreso': 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-300',
  Completado: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-300',
  Cancelado: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-300',
};

export function TreatmentLogManagement() {
  const { toast } = useToast();
  const user = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [orders, setOrders] = React.useState<TreatmentOrder[]>([]);

  const [selectedItem, setSelectedItem] = React.useState<TreatmentOrderItem | null>(null);
  const [isExecutionFormOpen, setIsExecutionFormOpen] = React.useState(false);

  const canManageOrder = ['doctor', 'enfermera', 'superuser'].includes(user.role.id);

  const refreshOrders = React.useCallback(async (currentSearch: string) => {
    setIsLoading(true);
    try {
      const data = await getTreatmentOrders(currentSearch);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching treatment orders:", error);
      toast({ title: 'Error', description: 'No se pudieron cargar las órdenes de tratamiento.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshOrders(debouncedSearch);
  }, [debouncedSearch, refreshOrders]);


  const handleOpenExecutionForm = (item: TreatmentOrderItem) => {
    setSelectedItem(item);
    setIsExecutionFormOpen(true);
  };

  const handleCloseDialogs = () => {
    setSelectedItem(null);
    setIsExecutionFormOpen(false);
  };

  const handleExecutionFormSubmitted = async (values: { treatmentOrderItemId: string; observations: string }) => {
    try {
      await createTreatmentExecution(values);
      toast({ title: '¡Ejecución Registrada!', description: 'La ejecución del tratamiento ha sido guardada.' });
      handleCloseDialogs();
      await refreshOrders(search);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo registrar la ejecución.', variant: 'destructive' });
    }
  };

  const handleChangeStatus = async (orderId: string, status: TreatmentOrder['status']) => {
    try {
      await updateTreatmentOrderStatus(orderId, status);
      toast({ title: 'Estado Actualizado', description: `La orden ha sido marcada como ${status.toLowerCase()}.` });
      await refreshOrders(search);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo cambiar el estado.', variant: 'destructive' });
    }
  }

  return (
    <>
      <div className="bg-card rounded-3xl shadow-sm p-8 border border-border/50 min-h-[calc(100vh-10rem)]">
        {/* Integrated Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" />
              Bitácora de Tratamientos
            </h2>
            <p className="text-muted-foreground mt-1">Registro y administración de procedimientos.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
            <Input
              placeholder="Buscar por paciente o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-full bg-muted/50 border-border focus:bg-card focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : orders.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => (
              <AccordionItem value={order.id} key={order.id} className="border-b border-border/50">
                <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-lg my-1">
                  <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-foreground text-lg">{order.paciente?.nombreCompleto}</span>
                      <span className="text-sm text-muted-foreground font-medium">{order.paciente?.cedula}</span>
                    </div>
                    <div className="text-sm text-foreground/80 text-center hidden md:block bg-muted/50 px-3 py-1 rounded-md border border-border/50">
                      <p className="font-semibold text-xs text-muted-foreground/80 uppercase tracking-wider mb-0.5">Diagnóstico</p>
                      <p className="truncate max-w-xs font-medium">{order.diagnosticoPrincipal || 'N/A'}</p>
                    </div>
                    <div className="text-sm text-foreground/80 text-center hidden lg:block">
                      <p className="font-semibold text-xs text-muted-foreground/80 uppercase tracking-wider">Fecha</p>
                      <p>{format(new Date(order.createdAt), 'P p', { locale: es })}</p>
                    </div>
                    <Badge variant="outline" className={`rounded-xl px-3 py-1 uppercase text-xs font-extrabold tracking-wide ${statusColors[order.status]}`}>{order.status}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-6 bg-muted/30 rounded-2xl mt-2 border border-border/50 mx-4 mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="text-foreground/90 font-extrabold">Ítem de Tratamiento</TableHead>
                          <TableHead className="text-foreground/90 font-extrabold">Estado</TableHead>
                          <TableHead className="text-right text-foreground/90 font-extrabold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map(item => (
                          <TableRow key={item.id} className="hover:bg-card border-border">
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div className="bg-card p-2 rounded-lg shadow-sm border border-border/50">
                                  <Syringe className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-foreground text-base">{item.medicamentoProcedimiento}</p>
                                  <p className="text-muted-foreground text-sm mt-0.5 flex flex-wrap gap-2 items-center">
                                    {item.dosis && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-semibold">{item.dosis}</span>}
                                    {item.via && <span className="text-muted-foreground/80">•</span>}
                                    {item.via && <span>Vía {item.via}</span>}
                                    {item.frecuencia && <span className="text-muted-foreground/80">•</span>}
                                    {item.frecuencia && <span>{item.frecuencia}</span>}
                                    {item.duracion && <span className="text-muted-foreground/80">•</span>}
                                    {item.duracion && <span>{item.duracion}</span>}
                                  </p>
                                </div>
                              </div>
                              {item.instrucciones && (
                                <div className="mt-2 text-sm bg-yellow-50 text-yellow-800 p-2 rounded-lg border border-yellow-100 flex items-start gap-2">
                                  <ClipboardCheck className="h-4 w-4 shrink-0 mt-0.5" />
                                  {item.instrucciones}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="rounded-lg" variant={item.status === 'Pendiente' ? 'secondary' : 'default'}>{item.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {canManageOrder && item.status === 'Pendiente' && (
                                <Button size="sm" onClick={() => handleOpenExecutionForm(item)} className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-white font-semibold">
                                  <ClipboardCheck className="mr-2 h-4 w-4" />
                                  Registrar Ejecución
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center bg-blue-50/50 rounded-3xl border border-blue-100/50">
            <div className="bg-card p-6 rounded-full shadow-lg shadow-primary/10 dark:shadow-none mb-6">
              <Syringe className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground mb-2">No hay tratamientos registrados</h3>
            <p className="text-muted-foreground max-w-sm">
              Aún no se han generado órdenes de tratamiento. Estas aparecen aquí automáticamente cuando un doctor las crea en una consulta.
            </p>
            {search && (
              <Button variant="link" onClick={() => setSearch('')} className="mt-4 text-primary">Limpiar búsqueda</Button>
            )}
          </div>
        )}
      </div>

      {selectedItem && (
        <Dialog open={isExecutionFormOpen} onOpenChange={setIsExecutionFormOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Registrar Ejecución de Tratamiento</DialogTitle>
              <DialogDescription>Procedimiento: {selectedItem.medicamentoProcedimiento}</DialogDescription>
            </DialogHeader>
            <RegisterExecutionForm treatmentOrderItem={selectedItem} onSubmitted={handleExecutionFormSubmitted} onCancel={handleCloseDialogs} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
