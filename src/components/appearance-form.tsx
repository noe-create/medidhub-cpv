
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
import { Loader2, Save, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateSettings } from '@/actions/settings-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
    <div className="space-y-2 mt-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {title}
      </Button>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
      />
      {isDataUrl && <p className="text-sm text-muted-foreground italic text-center">Imagen local seleccionada.</p>}
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
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Apariencia del Inicio de Sesión</CardTitle>
        <CardDescription>
          Personalice la apariencia de la pantalla de inicio de sesión. Puede seleccionar un tema predefinido o usar sus propias imágenes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Galería de Temas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themeOptions.map((theme) => (
                  <div
                    key={theme.name}
                    className={cn(
                      'relative cursor-pointer rounded-lg border-2 transition-all duration-200',
                      watchLoginImage === theme.loginImage
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-transparent hover:border-primary/50'
                    )}
                    onClick={() => {
                      form.setValue('loginImage', theme.loginImage, { shouldValidate: true });
                      form.setValue('loginOverlayImage', theme.loginOverlayImage, { shouldValidate: true });
                    }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="p-3">
                          <CardTitle className="text-base">{theme.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 aspect-video relative">
                            <Image src={theme.loginImage} alt={`Fondo de ${theme.name}`} fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50" />
                            <Image src={theme.loginOverlayImage} alt={`Superposición de ${theme.name}`} className="absolute top-0 right-0 h-full w-1/2 object-cover" width={100} height={200} unoptimized />
                      </CardContent>
                    </Card>
                    {watchLoginImage === theme.loginImage && (
                        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6 pt-8 border-t">
                <h3 className="text-lg font-medium">Opciones Personalizadas</h3>
                <FormDescription>
                    Use los botones "Cambiar Imagen" para seleccionar una imagen de su computadora.
                </FormDescription>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Imagen de Fondo (Lado Izquierdo)</CardTitle>
                            <CardDescription>La imagen principal que ocupa toda la pantalla del lado izquierdo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video relative mb-4">
                                {watchLoginImage ? (
                                    <Image src={watchLoginImage} alt="Vista previa de la imagen de fondo" fill className="object-cover rounded-md" unoptimized/>
                                ) : (
                                    <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                                        <ImageIcon className="h-10 w-10 text-muted-foreground"/>
                                    </div>
                                )}
                            </div>
                           <FormField
                            control={form.control}
                            name="loginImage"
                            render={({ field }) => (
                                <FormItem>
                                    <ImageUploader field={field} title="Cambiar Imagen de Fondo"/>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Imagen de Superposición (Lado Derecho)</CardTitle>
                            <CardDescription>La imagen que aparece en el lado derecho.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="aspect-video relative mb-4">
                                {watchLoginOverlayImage ? (
                                    <Image src={watchLoginOverlayImage} alt="Vista previa de la imagen de superposición" fill className="object-cover rounded-md" unoptimized/>
                                ) : (
                                    <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                                        <ImageIcon className="h-10 w-10 text-muted-foreground"/>
                                    </div>
                                )}
                            </div>
                           <FormField
                            control={form.control}
                            name="loginOverlayImage"
                            render={({ field }) => (
                                <FormItem>
                                    <ImageUploader field={field} title="Cambiar Imagen de Superposición"/>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
