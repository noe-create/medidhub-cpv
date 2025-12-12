
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, GraduationCap } from 'lucide-react';
import type { Specialty } from '@/lib/types';

const specialtySchema = z.object({
  name: z.string().min(3, { message: 'El nombre de la especialidad es requerido.' }),
});

type SpecialtyFormValues = z.infer<typeof specialtySchema>;

interface SpecialtyFormProps {
  specialty: Specialty | null;
  onSubmitted: (values: { name: string }) => Promise<void>;
  onCancel: () => void;
}

export function SpecialtyForm({ specialty, onSubmitted, onCancel }: SpecialtyFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SpecialtyFormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      name: specialty?.name || '',
    },
  });

  async function onSubmit(values: SpecialtyFormValues) {
    setIsSubmitting(true);
    await onSubmitted(values);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                Nombre de la Especialidad
              </FormLabel>
              <FormControl>
                <Input placeholder="Ej. Cardiología" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {specialty ? 'Guardar Cambios' : 'Crear Especialidad'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
