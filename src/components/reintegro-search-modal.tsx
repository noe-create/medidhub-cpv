
'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Loader2, User, CreditCard } from 'lucide-react';
import { searchPeopleForCheckin, addPatientToWaitlist, getAccountTypeByTitularId } from '@/actions/patient-actions';
import type { SearchResult, ServiceType } from '@/lib/types';
import { calculateAge, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ReintegroSearchModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ReintegroSearchModal({ isOpen, onOpenChange, onSuccess }: ReintegroSearchModalProps) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null);
    const [selectedServices, setSelectedServices] = React.useState<Record<string, ServiceType>>({});
    const { toast } = useToast();

    const handleSearch = React.useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await searchPeopleForCheckin(searchQuery);
            setResults(data);
        } catch (e) {
            console.error("Error searching people:", e);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    const handleIngresar = async (result: SearchResult) => {
        const serviceType = selectedServices[result.persona.id];
        if (!serviceType) {
            toast({
                title: "Seleccione un servicio",
                description: "Debe seleccionar un tipo de servicio antes de ingresar al paciente.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(String(result.persona.id));
        try {
            let accountType: any = 'Privado';

            if (result.titularInfo) {
                accountType = await getAccountTypeByTitularId(String(result.titularInfo.id)) || 'Privado';
            } else if (result.beneficiarioDe && result.beneficiarioDe.length > 0) {
                const titularId = result.beneficiarioDe[0].titularId;
                accountType = await getAccountTypeByTitularId(String(titularId)) || 'Privado';
            }

            await addPatientToWaitlist({
                personaId: String(result.persona.id),
                name: result.persona.nombreCompleto!,
                kind: result.titularInfo ? 'titular' : 'beneficiario',
                serviceType: serviceType,
                accountType: accountType,
                status: 'Esperando',
                checkInTime: new Date(),
                genero: result.persona.genero,
                fechaNacimiento: result.persona.fechaNacimiento,
                isReintegro: true
            });

            toast({
                variant: 'success',
                title: '¡Reintegro Procesado!',
                description: `${result.persona.nombreCompleto} ha sido añadido a la cola como REINTEGRO.`,
            });

            onSuccess();
            onOpenChange(false);
            setQuery('');
            setResults([]);
            setSelectedServices({});
        } catch (error) {
            console.error("Error al registrar reintegro:", error);
            toast({
                title: 'Error al registrar',
                description: (error as Error).message || 'No se pudo añadir el paciente a la cola.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(null);
        }
    };

    const getAvailableServices = (birthDate: Date) => {
        const age = calculateAge(new Date(birthDate));
        const services: { value: ServiceType; label: string }[] = [];

        if (age < 18) {
            services.push({ value: 'consulta pediatrica', label: 'Consulta Pediátrica' });
        } else {
            services.push({ value: 'medicina familiar', label: 'Medicina Familiar' });
        }
        services.push({ value: 'servicio de enfermeria', label: 'Servicio de Enfermería' });

        return services;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <DialogHeader className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Search className="h-6 w-6 text-white" />
                        </div>
                        Búsqueda para Reintegro
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 text-base font-medium mt-2">
                        Busque al paciente por cédula o nombre para reactivarlo en la cola de espera.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 flex flex-col gap-6 overflow-hidden">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Buscar paciente por cédula o nombre..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-12 h-14 text-lg rounded-2xl border-2 border-muted focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 transition-all font-medium"
                            autoFocus
                        />
                        {isLoading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
                        {results.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 pb-4">
                                {results.map((result) => (
                                    <Card key={result.persona.id} className="overflow-hidden border-border/50 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group">
                                        <CardContent className="p-5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                                                        <User className="h-8 w-8 text-indigo-600" />
                                                    </div>
                                                    <div className="flex flex-col gap-1 overflow-hidden">
                                                        <h4 className="font-extrabold text-lg text-foreground truncate">{result.persona.nombreCompleto}</h4>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className="font-bold text-indigo-700 border-indigo-200 bg-indigo-50/50">
                                                                <CreditCard className="h-3 w-3 mr-1" />
                                                                {result.persona.cedula}
                                                            </Badge>
                                                            <Badge variant="secondary" className="font-bold bg-muted/50">
                                                                {calculateAge(new Date(result.persona.fechaNacimiento))} años
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                                    <Select
                                                        onValueChange={(value) => setSelectedServices(prev => ({ ...prev, [result.persona.id]: value as ServiceType }))}
                                                        value={selectedServices[result.persona.id]}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl font-bold border-2 focus:ring-indigo-500/20">
                                                            <SelectValue placeholder="Servicio..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {getAvailableServices(result.persona.fechaNacimiento).map(service => (
                                                                <SelectItem key={service.value} value={service.value} className="font-bold capitalize">
                                                                    {service.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        onClick={() => handleIngresar(result)}
                                                        disabled={isSubmitting === String(result.persona.id) || !selectedServices[result.persona.id]}
                                                        className="w-full sm:w-auto h-11 px-6 rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        {isSubmitting === String(result.persona.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <><UserPlus className="mr-2 h-4 w-4" /> Ingresar a Espera</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : query.length >= 2 && !isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                                <User className="h-12 w-12 opacity-20 mb-4" />
                                <p className="font-bold text-lg">No se encontraron pacientes</p>
                                <p className="text-sm">Intente con otro nombre o cédula</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                                <Search className="h-12 w-12 mb-4" />
                                <p className="font-bold">Escriba para buscar...</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
