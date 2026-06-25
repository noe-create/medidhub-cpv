
'use client';

import * as React from 'react';
import * as XLSX from 'xlsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkCreateTitulares } from '@/actions/patient-actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from './app-shell';

interface TitularImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function TitularImportDialog({ open, onOpenChange, onImportSuccess }: TitularImportDialogProps) {
  const { toast } = useToast();
  const user = useUser();
  const isSuperUser = Number(user.role.id) === 1 || user.role.name === 'Superusuario';
  
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [results, setResults] = React.useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [defaultUnidad, setDefaultUnidad] = React.useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResults(null);

    try {
      const dataArray = await file.arrayBuffer();
      const workbook = XLSX.read(dataArray, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      if (rows.length === 0) {
        throw new Error('El archivo está vacío.');
      }

      // Detect headers and column indices
      const firstRow = rows[0].map(h => String(h || '').toLowerCase().trim());
      const isHeader = firstRow.some(h => ['nombre', 'apellido', 'cédula', 'cedula', 'nacimiento', 'género', 'genero'].some(k => h.includes(k)));
      const getColIndex = (keywords: string[]) => firstRow.findIndex(h => keywords.some(k => h.includes(k)));

      const colIndices = {
        idxNombre1: getColIndex(['primer nombre', 'nombre 1', 'nombres', 'primer_nombre']),
        idxApellido1: getColIndex(['primer apellido', 'apellido 1', 'apellidos', 'primer_apellido']),
        idxNombreFull: getColIndex(['nombre completo', 'nombres y apellidos', 'nombre y apellido', 'titular', 'paciente', 'empleado', 'nombre', 'beneficiado']),
        idxCedula: getColIndex(['cédula', 'cedula', 'ci', 'nro_cedula', 'nro. cedula', 'dni', 'documento', 'identidad']),
        idxFecha: getColIndex(['nacimiento', 'fecha', 'f. nac', 'f_nac', 'f.nac', 'nac.', 'fech.', 'edad']),
        idxGenero: getColIndex(['género', 'genero', 'sexo', 'gen.']),
        idxUnidad: getColIndex(['unidad', 'servicio', 'departamento', 'depto', 'area', 'unidad_servicio', 'adscripción']),
        idxFicha: getColIndex(['ficha', 'número de ficha', 'nro ficha', 'expediente']),
        idxTel1: getColIndex(['teléfono 1', 'telefono 1', 'tlf 1', 'telefono']),
        idxTel2: getColIndex(['teléfono 2', 'telefono 2', 'tlf 2', 'celular']),
        idxDireccion: getColIndex(['dirección', 'direccion']),
        idxEmail: getColIndex(['email', 'correo']),
        idxNombre2: getColIndex(['segundo nombre', 'nombre 2']),
        idxApellido2: getColIndex(['segundo apellido', 'apellido 2']),
      };

      // Fallback for NO headers based on the instructions (A-M)
      if (!isHeader) {
        if (isSuperUser) {
           // ULTRA-FLEXIBLE: Scan first 10 rows to find the best candidate columns
           let cedulaCandidates = new Map<number, number>();
           let textCandidates = new Map<number, number>();
           let dateCandidates = new Map<number, number>();
           
           rows.slice(0, 10).forEach(row => {
             if (!row) return;
             row.forEach((cell, i) => {
               // ✅ FIX: XLSX with cellDates:true returns JS Date objects — check FIRST
               if (cell instanceof Date && !isNaN(cell.getTime())) {
                 dateCandidates.set(i, (dateCandidates.get(i) || 0) + 1);
                 return;
               }

               const val = String(cell || '');
               const digits = val.replace(/\D/g, '');
               
               // Date pattern detection (DD/MM/YYYY, YYYY-MM-DD, or similar text dates)
               const dateRegex = /^(\d{1,4})[\/\-]\d{1,2}[\/\-](\d{1,4})$/;
               if (dateRegex.test(val.trim())) {
                 dateCandidates.set(i, (dateCandidates.get(i) || 0) + 1);
               } 
               // Spanish month names check
               else if (/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(val)) {
                 dateCandidates.set(i, (dateCandidates.get(i) || 0) + 1);
               }
               // Excel date serial check (e.g. 45000 is approx year 2023)
               else if (typeof cell === 'number' && cell > 10000 && cell < 65000) {
                 dateCandidates.set(i, (dateCandidates.get(i) || 0) + 1);
               }
               // Cedula pattern: Score based on length (CI is usually 7-8 digits)
               if (digits.length >= 7 && digits.length <= 9) {
                 cedulaCandidates.set(i, (cedulaCandidates.get(i) || 0) + 10); // Strong candidate
               } else if (digits.length >= 5 && digits.length <= 15) {
                 cedulaCandidates.set(i, (cedulaCandidates.get(i) || 0) + 1);  // Weak candidate
               } 
               // Name pattern
               else if (val.length > 2 && !/\d/.test(val)) {
                 textCandidates.set(i, (textCandidates.get(i) || 0) + 1);
               }
             });
           });

           // Best candidate for Date
           let bestFecha = -1;
           let maxDateHits = 0;
           dateCandidates.forEach((hits, idx) => {
             if (hits > maxDateHits) { maxDateHits = hits; bestFecha = idx; }
           });

           // Best candidate for Cedula (excluding date column)
           let bestCedula = -1;
           let maxCedHits = 0;
           cedulaCandidates.forEach((hits, idx) => {
             if (idx !== bestFecha && hits > maxCedHits) { maxCedHits = hits; bestCedula = idx; }
           });

           // Best candidates for Names (excluding date and cedula)
           let sortedText = Array.from(textCandidates.entries())
             .filter(([idx]) => idx !== bestCedula && idx !== bestFecha)
             .sort((a, b) => b[1] - a[1]);

           colIndices.idxNombre1 = sortedText[0]?.[0] ?? 0;
           colIndices.idxApellido1 = sortedText[1]?.[0] ?? (sortedText[0] !== undefined ? -1 : 2);
           colIndices.idxCedula = bestCedula !== -1 ? bestCedula : 4;
           colIndices.idxFecha = bestFecha !== -1 ? bestFecha : 8;
           colIndices.idxUnidad = colIndices.idxUnidad !== -1 ? colIndices.idxUnidad : -1;
        } else {
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
           colIndices.idxUnidad = 10;   // K
           colIndices.idxFicha = 11;    // L
           colIndices.idxEmail = 12;    // M
        }
      }

      const startIndex = isHeader ? 1 : 0;
      const mappedData = rows.slice(startIndex)
        .filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== ''))
        .map((row) => {
          // Extract names smarter
          let primerNombre = colIndices.idxNombre1 !== -1 ? String(row[colIndices.idxNombre1] || '').trim() : '';
          let primerApellido = colIndices.idxApellido1 !== -1 ? String(row[colIndices.idxApellido1] || '').trim() : '';
          
          if (!primerNombre && colIndices.idxNombreFull !== -1) {
            const full = String(row[colIndices.idxNombreFull] || '').trim();
            
            // Handle "Lastname, Firstname" format
            if (full.includes(',')) {
              const parts = full.split(',').map(p => p.trim());
              primerApellido = parts[0];
              primerNombre = parts[1] || 'SIN_NOMBRE';
            } else {
              const parts = full.split(/\s+/);
              // Handle "APELLIDOS Y NOMBRES" heuristic: if 4 parts, assume 2 apell, 2 names
              if (parts.length === 4) {
                 primerApellido = `${parts[0]} ${parts[1]}`;
                 primerNombre = `${parts[2]} ${parts[3]}`;
              } else if (parts.length >= 2) {
                primerNombre = parts[0];
                primerApellido = parts.slice(1).join(' ');
              } else {
                primerNombre = full;
              }
            }
          }

          // Fallbacks for Superuser
          if (isSuperUser) {
            if (!primerNombre && !primerApellido) {
              // If still no name, maybe use column 0 as a last resort
              primerNombre = String(row[0] || 'SIN_NOMBRE').trim();
            }
            if (!primerApellido) primerApellido = 'SIN_APELLIDO';
          }

          // Robust Date Parsing with Ultra-Robust Fallback
          let fechaNac = '';
          let dateVal = row[colIndices.idxFecha];
          
          // If the detected column is empty, scan ALL columns as a last resort
          if (!dateVal) {
            for (let i = 0; i < row.length; i++) {
                const cell = row[i];
                if (cell instanceof Date && !isNaN(cell.getTime())) {
                    dateVal = cell;
                    break;
                }
                const s = String(cell || '').trim();
                // Check if it looks like a date (DD/MM/YYYY or YYYY-MM-DD or contains month names)
                if (/^(\d{1,4})[\/\-]\d{1,2}[\/\-](\d{1,4})$/.test(s) || 
                    /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(s)) {
                    dateVal = cell;
                    break;
                }
            }
          }

          if (dateVal) {
            if (dateVal instanceof Date) {
              fechaNac = `${dateVal.getDate()}/${dateVal.getMonth() + 1}/${dateVal.getFullYear()}`;
            } else if (typeof dateVal === 'number') {
              try {
                // Heuristic: serial codes for dates are usually between 10000 and 65000
                if (dateVal > 10000 && dateVal < 65000) {
                    const date = XLSX.SSF.parse_date_code(dateVal);
                    fechaNac = `${date.d}/${date.m}/${date.y}`;
                } else {
                    fechaNac = String(dateVal);
                }
              } catch (e) { fechaNac = String(dateVal); }
            } else { 
                const s = String(dateVal).trim();
                fechaNac = s;
            }
          }
          
          // Superuser date fallback
          if (!fechaNac && isSuperUser) {
            fechaNac = '01/01/1900';
          }

          // Gender normalization with Ultra-Robust Fallback
          let generoVal = colIndices.idxGenero !== -1 ? String(row[colIndices.idxGenero] || '').trim().toLowerCase() : '';
          let genero = 'Masculino';

          // If detected column is empty, scan ALL columns for gender indicators
          if (!generoVal) {
             for (let i = 0; i < row.length; i++) {
                const s = String(row[i] || '').trim().toLowerCase();
                if (s === 'f' || s === 'femenino' || s === 'mujer' || s === 'fem' || s === 'f.') {
                   generoVal = 'f';
                   break;
                } else if (s === 'm' || s === 'masculino' || s === 'hombre' || s === 'masc' || s === 'm.') {
                   generoVal = 'm';
                   break;
                } else if (s === 'h' && row.length > 2) { // H for Hombre
                   generoVal = 'm';
                   break;
                }
             }
          }

          if (generoVal.startsWith('f') || generoVal.includes('fem') || generoVal === 'mujer') genero = 'Femenino';
          else if (generoVal.startsWith('m') || generoVal.includes('masc') || generoVal === 'hombre' || generoVal === 'h') genero = 'Masculino';
          else if (!isSuperUser) genero = 'Masculino'; // Default

          // Final identification check for Superuser
          let rawCedula = colIndices.idxCedula !== -1 ? String(row[colIndices.idxCedula] || '').trim() : '';
          // Smart Cedula Cleaning: remove dots, spaces, and handle V- prefix
          let cedulaFinal = rawCedula.replace(/\./g, '').replace(/\s/g, '');
          if (cedulaFinal.toUpperCase().startsWith('V-')) cedulaFinal = cedulaFinal.substring(2);
          else if (cedulaFinal.toUpperCase().startsWith('V')) cedulaFinal = cedulaFinal.substring(1);
          cedulaFinal = cedulaFinal.replace(/\D/g, ''); // Keep only digits for the number part

          // NUCLEAR SCAN FALLBACK: If the detected cedula is too short or empty, 
          // scan ALL columns for a 7-9 digit number (typical Venezuelan CI)
          if (cedulaFinal.length < 7) {
              for (let i = 0; i < row.length; i++) {
                  const cellStr = String(row[i] || '').replace(/\D/g, '');
                  if (cellStr.length >= 7 && cellStr.length <= 9) {
                      cedulaFinal = cellStr;
                      break; 
                  }
              }
          }

          
          if (!cedulaFinal && isSuperUser) {
            // If superuser and still no cedula, generate a temporary one based on row index or random
            const randomId = Math.floor(100000 + Math.random() * 900000);
            cedulaFinal = `T-${randomId}`;
          }

          return {
            primerNombre,
            segundoNombre: colIndices.idxNombre2 !== -1 ? String(row[colIndices.idxNombre2] || '').trim() : '',
            primerApellido,
            segundoApellido: colIndices.idxApellido2 !== -1 ? String(row[colIndices.idxApellido2] || '').trim() : '',
            cedulaNumero: cedulaFinal,
            fechaNacimiento: fechaNac,
            genero,
            unidadServicio: (colIndices.idxUnidad !== -1 ? String(row[colIndices.idxUnidad] || '').trim() : '') || defaultUnidad || (isSuperUser ? 'IMPORTADO_SÚPER' : ''),
            numeroFicha: colIndices.idxFicha !== -1 ? String(row[colIndices.idxFicha] || '').trim() : '',
            telefono1: colIndices.idxTel1 !== -1 ? String(row[colIndices.idxTel1] || '').trim() : '',
            telefono2: colIndices.idxTel2 !== -1 ? String(row[colIndices.idxTel2] || '').trim() : '',
            email: colIndices.idxEmail !== -1 ? String(row[colIndices.idxEmail] || '').trim() : '',
            direccion: colIndices.idxDireccion !== -1 ? String(row[colIndices.idxDireccion] || '').trim() : '',
          };
        });

      const response = await bulkCreateTitulares(mappedData);
      setResults(response);

      if (response.imported > 0) {
        toast({
          title: 'Importación Completada',
          description: `Se han importado ${response.imported} titulares correctamente.`,
        });
        onImportSuccess();
      } else if (response.errors.length > 0) {
        toast({
          title: 'Error de Importación',
          description: 'No se pudo importar ningún titular. Revise los errores.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error al importar:', error);
      toast({
        title: 'Error Crítico',
        description: error.message || 'Error al procesar el archivo Excel.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setResults(null);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) resetState();
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileUp className="h-6 w-6 text-primary" />
            Importar Titulares
          </DialogTitle>
          <DialogDescription>
            Cargue un archivo Excel (.xlsx) con los datos de los titulares para registro masivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {!results ? (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/30 relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Upload className="h-8 w-8" />
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB - Haga clic para cambiar</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Haga clic o arrastre su archivo Excel aquí</p>
                      <p className="text-xs text-muted-foreground">Formatos soportados: .xlsx, .xls</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Unidad / Servicio por Defecto
                  </label>
                  <span className="text-[10px] text-primary/70 font-medium bg-primary/10 px-2 py-0.5 rounded-full">Recomendado</span>
                </div>
                <div className="relative group">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Ej: Recursos Humanos, General, Afiliados..."
                    value={defaultUnidad}
                    onChange={(e) => setDefaultUnidad(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">
                  * Se usará este valor si la columna de unidad no se encuentra en el archivo.
                </p>
              </div>

              <Alert variant="default" className="bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30 shadow-none">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">
                  {isSuperUser ? "MODO SUPERUSUARIO: Importación Ultra-Flexible" : "Importación Inteligente Activada"}
                </AlertTitle>
                <AlertDescription className="space-y-3 pt-2 text-xs">
                  {isSuperUser ? (
                    <p className="text-primary/80 font-semibold animate-pulse">
                      Se ha activado la detección heurística. El sistema ignorará campos faltantes y usará valores temporales (01/01/1900) si es necesario.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">El sistema intentará detectar automáticamente las columnas (nombre, cédula, etc.) por su encabezado. Si no hay encabezados, use el siguiente orden fijo:</p>
                  )}
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside bg-background/50 p-3 rounded-xl border border-border/50 font-medium text-[10px]">
                    <li><strong>Col A:</strong> Primer Nombre</li>
                    <li><strong>Col B:</strong> Segundo Nombre</li>
                    <li><strong>Col C:</strong> Primer Apellido</li>
                    <li><strong>Col D:</strong> Segundo Apellido</li>
                    <li><strong>Col E:</strong> Cédula (ej: V-123)</li>
                    <li><strong>Col F:</strong> Teléfono 1</li>
                    <li><strong>Col G:</strong> Teléfono 2</li>
                    <li><strong>Col H:</strong> Dirección</li>
                    <li><strong>Col I:</strong> F. Nacimiento</li>
                    <li><strong>Col J:</strong> Género</li>
                    <li className="text-primary font-bold">Col K: Unidad/Servicio</li>
                    <li><strong>Col L:</strong> Número Ficha</li>
                    <li><strong>Col M:</strong> Email</li>
                  </ul>
                  <p className="text-[10px] italic text-blue-600/70 dark:text-blue-400/70">* Las columnas A, C, E, I, J y K son requeridas obligatoriamente.</p>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl border border-green-100 dark:border-green-900/50 text-center">
                  <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase tracking-wider">Importados</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400">{results.imported}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Omitidos</p>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{results.skipped}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/50 text-center">
                  <p className="text-xs text-red-700 dark:text-red-400 font-bold uppercase tracking-wider">Errores</p>
                  <p className="text-3xl font-black text-red-600 dark:text-red-400">{results.errors.length}</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                  <p className="text-sm font-bold text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Detalle de errores y advertencias:
                  </p>
                  <ScrollArea className="flex-1 rounded-xl border border-border bg-muted/20 p-4 mt-2">
                    <ul className="space-y-2">
                      {results.errors.map((err, i) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-muted-foreground border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                          <span className="pt-0.5 leading-relaxed">{err}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
              
              {results.imported > 0 && results.errors.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                   <div className="p-5 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 ring-8 ring-green-50 dark:ring-green-950/20">
                     <CheckCircle2 className="h-10 w-10" />
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-xl font-bold">¡Todo listo!</h3>
                     <p className="text-muted-foreground text-sm">Los titulares se han registrado exitosamente.</p>
                   </div>
                 </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {!results ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="rounded-xl w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 w-full sm:w-auto"
                disabled={!file || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Iniciar Importación
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              className="rounded-xl w-full" 
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
