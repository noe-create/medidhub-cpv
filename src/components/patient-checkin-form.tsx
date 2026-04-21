

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Loader2, UserCheck, Users } from 'lucide-react';
import { searchPeopleForCheckin, getAccountTypeByTitularId } from '@/actions/patient-actions';
import type { Persona, SearchResult, ServiceType } from '@/lib/types';
import { cn, calculateAge } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  serviceType: z.enum(['medicina familiar', 'consulta pediatrica', 'servicio de enfermeria'], {
    required_error: "El tipo de servicio es requerido."
  }),
  isReintegro: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export interface RegistrationData {
  serviceType: ServiceType;
  searchResult: SearchResult;
  isReintegro?: boolean;
}

interface PatientCheckinFormProps {
  onSubmitted: (data: RegistrationData) => void;
}

export function PatientCheckinForm({ onSubmitted }: PatientCheckinFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<SearchResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    form.reset({ serviceType: undefined });
  }, [selectedResult, form]);

  const isPersonValid = React.useMemo(() => {
    if (!selectedResult) return false;
    return !!selectedResult.titularInfo || (!!selectedResult.beneficiarioDe && selectedResult.beneficiarioDe.length > 0);
  }, [selectedResult]);

  const age = selectedResult ? calculateAge(new Date(selectedResult.persona.fechaNacimiento)) : null;

  const availableServices = React.useMemo(() => {
    const services: { value: ServiceType; label: string }[] = [];
    if (age === null) return services;

    if (age < 18) {
      services.push({ value: 'consulta pediatrica', label: 'Consulta Pediátrica' });
    } else {
      services.push({ value: 'medicina familiar', label: 'Medicina Familiar' });
    }
    services.push({ value: 'servicio de enfermeria', label: 'Servicio de Enfermería' });

    return services;
  }, [age]);

  async function onSubmit(values: FormValues) {
    if (!selectedResult || !isPersonValid) return;
    setIsSubmitting(true);

    await onSubmitted({
      serviceType: values.serviceType,
      searchResult: selectedResult,
      isReintegro: values.isReintegro
    });
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <PatientSearch selectedResult={selectedResult} onResultSelect={setSelectedResult} />

          {selectedResult && (
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Información del Paciente</span>
                    <div className="p-1.5 bg-background rounded-lg border border-border/50 shadow-sm">
                        <Users className="h-4 w-4 text-indigo-500" />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase block">Cédula / ID</span>
                        <span className="text-sm font-bold text-foreground">{selectedResult.persona.cedula}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase block">Edad Actual</span>
                        <span className="text-sm font-black text-indigo-700 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 w-fit block">
                            {calculateAge(new Date(selectedResult.persona.fechaNacimiento))} años
                        </span>
                    </div>
                    <div className="space-y-1 col-span-2">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase block">Fecha de Nacimiento</span>
                        <span className="text-sm font-bold text-foreground">
                            {new Date(selectedResult.persona.fechaNacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </span>
                    </div>
                </div>

                {selectedResult && !isPersonValid && (
                    <div className="mt-2 p-3 text-xs text-destructive-foreground bg-destructive/90 rounded-xl font-bold border border-destructive shadow-lg animate-in fade-in slide-in-from-top-1">
                        ⚠️ Esta persona no tiene roles habilitados. Por favor, añada un rol (Titular o Beneficiario) desde el módulo de Gestión.
                    </div>
                )}
            </div>
          )}

          {isPersonValid && (
            <>
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!isPersonValid || availableServices.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableServices.map(service => (
                          <SelectItem key={service.value} value={service.value} className="capitalize">{service.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isReintegro"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-blue-500/5 border-blue-500/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold text-blue-700 dark:text-blue-400">¿Es un reintegro post-reposo?</FormLabel>
                      <p className="text-xs text-muted-foreground">Marque esta casilla si el trabajador regresa de un reposo médico.</p>
                    </div>
                    <FormControl>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors",
                          field.value ? "bg-primary border-primary text-primary-foreground" : "bg-background border-input"
                        )}
                        onClick={() => field.onChange(!field.value)}
                      >
                        {field.value && <UserCheck className="h-4 w-4" />}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting || !isPersonValid || !form.formState.isValid} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Añadir a la Cola
        </Button>
      </form>
    </Form>
  );
}


function PatientSearch({ selectedResult, onResultSelect }: { selectedResult: SearchResult | null, onResultSelect: (result: SearchResult | null) => void }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchPeopleForCheckin(query);
        setResults(data);
      } catch (e) {
        console.error("Error searching people:", e);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    if (isPopoverOpen && results.length === 0 && query === '') {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          const data = await searchPeopleForCheckin('');
          setResults(data);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
      };
      fetchInitialData();
    }
  }, [isPopoverOpen, results.length, query]);

  const handleSelect = (result: SearchResult | null) => {
    onResultSelect(result);
    setIsPopoverOpen(false);
    setQuery('');
  };

  return (
    <div className="space-y-2">
      <Label>Persona</Label>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isPopoverOpen}
            className="w-full justify-between font-normal text-left h-auto"
          >
            {selectedResult ? (
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{selectedResult.persona.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">{selectedResult.persona.cedula}</p>
                </div>
              </div>
            ) : 'Buscar por nombre o cédula...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar persona..."
              value={query}
              onValueChange={setQuery}
              className="h-9"
            />
            <CommandList>
              {isLoading && <CommandItem disabled>Buscando...</CommandItem>}
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              {results.length > 0 && !isLoading && (
                <CommandGroup>
                  {results.map((result) => (
                    <CommandItem
                      key={result.persona.id}
                      value={result.persona.id}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{result.persona.nombreCompleto}</p>
                          <p className="text-xs text-muted-foreground">{result.persona.cedula}</p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
