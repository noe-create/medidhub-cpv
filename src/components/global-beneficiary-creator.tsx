'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BeneficiaryForm } from '@/components/beneficiary-form';
import { TitularSearch } from '@/components/titular-search';
import { createBeneficiario } from '@/actions/patient-actions';
import { useToast } from '@/hooks/use-toast';
import type { Titular } from '@/lib/types';
import { Plus } from 'lucide-react';

interface GlobalBeneficiaryCreatorProps {
    onSuccess: () => void;
}

export function GlobalBeneficiaryCreator({ onSuccess }: GlobalBeneficiaryCreatorProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedTitular, setSelectedTitular] = React.useState<Titular | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (values: any) => {
        if (!selectedTitular) {
            toast({
                title: 'Error',
                description: 'Debe seleccionar un titular para el beneficiario.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createBeneficiario(selectedTitular.id, values);
            toast({
                title: '¡Beneficiario Creado!',
                description: 'El beneficiario ha sido añadido correctamente.',
            });
            setIsOpen(false);
            setSelectedTitular(null);
            onSuccess();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'No se pudo crear el beneficiario.',
                variant: 'destructive',
            });
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSelectedTitular(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Añadir Beneficiario
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Beneficiario</DialogTitle>
                    <DialogDescription>
                        Primero seleccione un titular, luego ingrese los datos del beneficiario.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
                        <label className="text-sm font-semibold">1. Seleccionar Titular Asociado</label>
                        <TitularSearch onTitularSelect={setSelectedTitular} />
                    </div>

                    {selectedTitular ? (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold">2. Datos del Beneficiario</label>
                            <BeneficiaryForm
                                beneficiario={null}
                                onSubmitted={handleSubmit}
                                onCancel={() => setIsOpen(false)}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                            <p>Seleccione un titular arriba para continuar.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
