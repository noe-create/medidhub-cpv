
'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2, Users, Search, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchClinicEmployees } from '@/actions/patient-actions';
import type { Persona, SearchResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ReintegroHceSearchProps {
    onPersonaSelect: (persona: Persona | null, titularInfo?: any) => void;
    className?: string;
}

export function ReintegroHceSearch({ onPersonaSelect, className }: ReintegroHceSearchProps) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

    React.useEffect(() => {
        if (query.trim().length < 2 && !isPopoverOpen) {
            setResults([]);
            return;
        }

        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await searchClinicEmployees(query);
                setResults(data);
            } catch (e) {
                console.error("Error searching clinic employees:", e);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isPopoverOpen]);

    // Removed initial fetch logic to prevent listing all patients when opening the dropdown without a query.

    const handleSelect = (result: SearchResult | null) => {
        const persona = result ? result.persona : null;
        onPersonaSelect(persona, result?.titularInfo);
        setSelectedPersona(persona);
        setIsPopoverOpen(false);
        setQuery('');
    };

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className={cn(
                        "w-full justify-start text-left h-14 rounded-2xl bg-white shadow-sm border-2 border-indigo-100 px-4 text-muted-foreground hover:bg-white hover:text-foreground/80 hover:shadow-md hover:border-indigo-300 transition-all gap-4",
                        className
                    )}
                >
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Search className="h-5 w-5 text-indigo-600 shrink-0" />
                    </div>
                    {selectedPersona ? (
                        <div className="flex flex-col truncate">
                            <span className="text-base font-bold text-foreground truncate">{selectedPersona.nombreCompleto}</span>
                            <span className="text-xs text-indigo-600 font-medium">{selectedPersona.cedula}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground/80 font-medium text-base truncate">Buscar trabajador por nombre o cédula...</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-2xl" align="start">
                <Command shouldFilter={false} className="rounded-2xl">
                    <CommandInput
                        placeholder="Escriba para filtrar..."
                        value={query}
                        onValueChange={setQuery}
                        className="h-12 text-base border-none focus:ring-0"
                    />
                    <CommandList className="max-h-[300px] custom-scrollbar">
                        {isLoading && <CommandItem disabled className="py-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></CommandItem>}
                        <CommandEmpty className="py-10 text-center text-muted-foreground font-medium">No se encontraron trabajadores.</CommandEmpty>
                        {results.length > 0 && !isLoading && query.trim().length >= 2 && (
                            <CommandGroup heading="Trabajadores de la Clínica" className="px-2 pb-2">
                                {results.map((result) => (
                                    <CommandItem
                                        key={result.persona.id}
                                        value={`${result.persona.nombreCompleto} ${result.persona.id}`}
                                        onSelect={() => handleSelect(result)}
                                        className="cursor-pointer rounded-xl p-3 mb-1 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold text-sm truncate">{result.persona.nombreCompleto}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-bold">{result.persona.cedula}</span>
                                                    <span>&bull;</span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {result.titularInfo?.unidadServicio}
                                                    </span>
                                                </div>
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
    );
}
