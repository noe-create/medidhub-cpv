'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2, User, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getTitulares } from '@/actions/patient-actions';
import type { Titular } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface TitularSearchProps {
    onTitularSelect: (titular: Titular | null) => void;
    placeholder?: string;
    className?: string;
}

export function TitularSearch({ onTitularSelect, placeholder = "Buscar titular por nombre o cédula...", className }: TitularSearchProps) {
    const [query, setQuery] = React.useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = React.useState<Titular[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedTitular, setSelectedTitular] = React.useState<Titular | null>(null);

    React.useEffect(() => {
        if (debouncedQuery.trim().length < 2 && !isPopoverOpen) {
            setResults([]);
            return;
        }

        if (debouncedQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        async function search() {
            setIsLoading(true);
            try {
                // getTitulares returns { titulares, totalCount }
                const data = await getTitulares(debouncedQuery, 1, 20);
                setResults(data.titulares);
            } catch (e) {
                console.error("Error searching titulares:", e);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }
        search();
    }, [debouncedQuery, isPopoverOpen]);

    const handleSelect = (titular: Titular | null) => {
        setSelectedTitular(titular);
        onTitularSelect(titular);
        setIsPopoverOpen(false);
        setQuery('');
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className="w-full justify-between font-normal text-left h-auto"
                    >
                        {selectedTitular ? (
                            <div className="flex items-center gap-2">
                                <div>
                                    <p className="text-sm font-medium">{selectedTitular.persona.nombreCompleto}</p>
                                    <p className="text-xs text-muted-foreground">{selectedTitular.persona.cedula}</p>
                                </div>
                            </div>
                        ) : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                {selectedTitular && (
                    <Button variant="ghost" size="icon" onClick={() => handleSelect(null)} aria-label="Limpiar selección">
                        <UserX className="h-4 w-4" />
                    </Button>
                )}
                <PopoverContent
                    className="p-0 w-[--radix-popover-trigger-width]"
                    align="start"
                >
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Buscar por nombre o cédula..."
                            value={query}
                            onValueChange={setQuery}
                            className="h-9"
                        />
                        <CommandList>
                            {isLoading && <CommandItem disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Buscando...</CommandItem>}
                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                            {results.length > 0 && !isLoading && debouncedQuery.trim().length >= 2 && (
                                <CommandGroup>
                                    {results.map((titular) => (
                                        <CommandItem
                                            key={titular.id}
                                            value={`${titular.persona.nombreCompleto} ${titular.id}`}
                                            onSelect={() => handleSelect(titular)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm">{titular.persona.nombreCompleto}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {titular.persona.cedula}
                                                    </p>
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
