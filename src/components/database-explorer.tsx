
'use client';

import * as React from 'react';
import { getTables, getTableData } from '@/actions/db-explorer-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Table as TableIcon, Database, ServerCrash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from './ui/badge';

export function DatabaseExplorer() {
  const { toast } = useToast();
  const [tables, setTables] = React.useState<string[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null);
  const [tableData, setTableData] = React.useState<{ columns: string[]; rows: any[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTableLoading, setIsTableLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchTables = async () => {
      setIsLoading(true);
      try {
        const tableNames = await getTables();
        setTables(tableNames);
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'No se pudieron cargar las tablas.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTables();
  }, [toast]);

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setIsTableLoading(true);
    try {
      const data = await getTableData(tableName);
      setTableData(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || `No se pudieron cargar los datos de la tabla ${tableName}.`, variant: 'destructive' });
      setTableData(null);
    } finally {
      setIsTableLoading(false);
    }
  };

  const renderValue = (value: any) => {
    if (value === null) {
      return <Badge variant="outline">NULL</Badge>;
    }
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'true' : 'false'}</Badge>;
    }
    if (typeof value === 'object') {
      return <pre className="text-xs bg-muted p-2 rounded-md">{JSON.stringify(value, null, 2)}</pre>
    }
    return String(value);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Tablas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {isLoading ? (
             <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>
          ) : (
             <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 pr-4">
                    {tables.map(table => (
                        <Button
                            key={table}
                            variant={selectedTable === table ? 'secondary' : 'ghost'}
                            onClick={() => handleTableSelect(table)}
                            className="w-full justify-start"
                        >
                            <TableIcon className="mr-2 h-4 w-4"/>
                            {table}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
             {selectedTable ? (
                <>
                    <CardTitle>{selectedTable}</CardTitle>
                    <CardDescription>{tableData ? `${tableData.rows.length} fila(s) encontrada(s).` : 'Cargando...'}</CardDescription>
                </>
             ) : (
                <CardTitle>Seleccione una tabla</CardTitle>
             )}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
             {isTableLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
             ) : tableData && selectedTable ? (
                tableData.rows.length > 0 ? (
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                {tableData.columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {tableData.columns.map(col => (
                                        <TableCell key={`${rowIndex}-${col}`} className="align-top font-mono text-xs">
                                          <div className="max-w-xs max-h-24 overflow-y-auto">
                                            {renderValue(row[col])}
                                          </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <ServerCrash className="h-10 w-10 mb-2"/>
                        <h3 className="font-semibold">Tabla Vacía</h3>
                        <p>La tabla "{selectedTable}" no contiene ninguna fila.</p>
                    </div>
                )
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Database className="h-10 w-10 mb-2"/>
                    <h3 className="font-semibold">Sin tabla seleccionada</h3>
                    <p>Por favor, seleccione una tabla de la lista de la izquierda para ver su contenido.</p>
                </div>
             )}
          </CardContent>
      </Card>
    </div>
  );
}
