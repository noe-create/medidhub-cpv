
'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchPeopleForCheckin } from '@/actions/patient-actions';
import type { Persona, SearchResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HceSearchProps {
  onPersonaSelect: (persona: Persona | null) => void;
  className?: string;
}

export function HceSearch({ onPersonaSelect, className }: HceSearchProps) {
  const [query, setQuery] = React.useState('');
  // ... state ...
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);

  // ... effects ...
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

  // Fetch all people when the popover opens for the first time
  React.useEffect(() => {
    if (isPopoverOpen && results.length === 0 && query === '') {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          const data = await searchPeopleForCheckin('');
          setResults(data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [isPopoverOpen, results.length, query]);

  const handleSelect = (result: SearchResult | null) => {
    const persona = result ? result.persona : null;
    onPersonaSelect(persona);
    setSelectedPersona(persona);
    setIsPopoverOpen(false);
    setQuery(''); // Reset search query on select
  };

  const getRoles = (result: SearchResult) => {
    const roles = [];
    if (result.titularInfo) roles.push('Titular');
    if (result.beneficiarioDe && result.beneficiarioDe.length > 0) roles.push('Beneficiario');
    return roles.join(', ');
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isPopoverOpen}
          className={cn(
            "w-full justify-start text-left h-12 rounded-full bg-white shadow-sm border-none px-4 text-muted-foreground hover:bg-white hover:text-foreground/80 hover:shadow-md transition-all gap-3",
            className
          )}
        >
          <Search className="h-5 w-5 text-blue-600 shrink-0" />
          {selectedPersona ? (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-foreground truncate">{selectedPersona.nombreCompleto}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/80 font-normal truncate">Buscar por nombre o cédula...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
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
                    value={result.persona.nombreCompleto}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{result.persona.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.persona.cedula} &bull; <span className="font-semibold">{getRoles(result)}</span>
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
  );
}
