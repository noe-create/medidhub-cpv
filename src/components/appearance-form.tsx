
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Save, CheckCircle, Upload, Image as ImageIcon, LayoutTemplate, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateSettings } from '@/actions/settings-actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

const appearanceSchema = z.object({
  loginImage: z.string().url({ message: 'Por favor, introduzca una URL válida.' }).or(z.string().startsWith('data:image/')).or(z.literal('')),
  loginOverlayImage: z.string().url({ message: 'Por favor, introduzca una URL válida.' }).or(z.string().startsWith('data:image/')).or(z.literal('')),
});


type AppearanceFormValues = z.infer<typeof appearanceSchema>;

interface AppearanceFormProps {
  initialSettings: AppearanceFormValues;
}

const themeOptions = [
  {
    name: 'Clínica La Viña',
    loginImage: '/la-viña/cpv-la viña.png.png',
    loginOverlayImage: '/fondo-azul/fondo-azul,png.png',
  },
  {
    name: 'Consultorio Moderno',
    loginImage: 'https://picsum.photos/seed/consultorio/1280/853',
    loginOverlayImage: 'https://picsum.photos/seed/abstractblue/1280/853',
  },
  {
    name: 'Sala de Espera',
    loginImage: 'https://picsum.photos/seed/espera/1280/853',
    loginOverlayImage: 'https://picsum.photos/seed/abstractgreen/1280/853',
  },
  {
    name: 'Tecnología Médica',
    loginImage: 'https://picsum.photos/seed/tech/1280/853',
    loginOverlayImage: 'https://picsum.photos/seed/abstractdark/1280/853',
  },
];

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ImageUploader = ({ field, title }: { field: any, title: string }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        field.onChange(dataUrl);
      } catch (error) {
        console.error("Error converting file to Data URL", error);
      }
    }
  };

  const isDataUrl = field.value && field.value.startsWith('data:image/');

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="group relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <p className="mb-1 text-sm text-foreground/80 font-medium">{title}</p>
          <p className="text-xs text-muted-foreground/80">Click para subir imagen</p>
        </div>
      </div>

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
      />
      {isDataUrl && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
          <CheckCircle className="h-4 w-4" />
          Imagen cargada correctamente
        </div>
      )}
    </div>
  );
};

export function AppearanceForm({ initialSettings }: AppearanceFormProps) {
  const { toast } = useToast();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: initialSettings,
  });

  const watchLoginImage = form.watch('loginImage');
  const watchLoginOverlayImage = form.watch('loginOverlayImage');

  async function onSubmit(values: AppearanceFormValues) {
    try {
      const settingsToUpdate = [
        { key: 'loginImage', value: values.loginImage },
        { key: 'loginOverlayImage', value: values.loginOverlayImage },
      ];
      await updateSettings(settingsToUpdate);
      toast({
        title: '¡Apariencia Actualizada!',
        description: 'La pantalla de inicio de sesión ha sido actualizada.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Gallery Section */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LayoutTemplate className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Galería de Temas</h3>
                <p className="text-muted-foreground text-sm">Seleccione un tema predefinido para la pantalla de Login.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {themeOptions.map((theme) => (
                <div
                  key={theme.name}
                  className={cn(
                    'relative cursor-pointer group',
                    watchLoginImage === theme.loginImage
                      ? 'ring-2 ring-blue-600 ring-offset-2 rounded-xl'
                      : ''
                  )}
                  onClick={() => {
                    form.setValue('loginImage', theme.loginImage, { shouldValidate: true });
                    form.setValue('loginOverlayImage', theme.loginOverlayImage, { shouldValidate: true });
                  }}
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md h-full bg-white">
                    <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                      <Image src={theme.loginImage} alt={`Fondo de ${theme.name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-foreground">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Tema Corporativo</p>
                    </div>
                  </div>
                  {watchLoginImage === theme.loginImage && (
                    <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border-2 border-white">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Options Section */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Palette className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Personalización Avanzada</h3>
                <p className="text-muted-foreground text-sm">Suba sus propias imágenes para un branding único.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Image Card */}
              <div className="bg-muted/50/50 rounded-2xl border border-slate-100 p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground text-lg">Fondo Principal</h4>
                  <p className="text-sm text-muted-foreground">Imagen de fondo (Izquierda)</p>
                </div>

                <div className="aspect-video relative mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                  {watchLoginImage ? (
                    <Image src={watchLoginImage} alt="Vista previa de la imagen de fondo" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <span className="text-sm">Sin imagen</span>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="loginImage"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader field={field} title="Subir Fondo" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Image Card */}
              <div className="bg-muted/50/50 rounded-2xl border border-slate-100 p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground text-lg">Superposición</h4>
                  <p className="text-sm text-muted-foreground">Imagen lateral (Derecha)</p>
                </div>

                <div className="aspect-video relative mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                  {watchLoginOverlayImage ? (
                    <Image src={watchLoginOverlayImage} alt="Vista previa de la imagen de superposición" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <span className="text-sm">Sin imagen</span>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="loginOverlayImage"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader field={field} title="Subir Superposición" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting} size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 px-8 transition-all hover:scale-105">
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Guardar Configuración
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
