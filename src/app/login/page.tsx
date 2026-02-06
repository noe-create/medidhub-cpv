
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth-actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { getSettings } from '@/actions/settings-actions';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      variant="default" 
      className="w-full text-white bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-500/90 hover:to-blue-400/90 shadow-[0_5px_15px_rgba(0,0,0,0.15)] rounded-lg" 
      type="submit" 
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Iniciar Sesión
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, undefined);
  const router = useRouter();
  const [themeConfig, setThemeConfig] = React.useState({
    loginImage: '',
    loginOverlayImage: ''
  });
  const [isLoadingTheme, setIsLoadingTheme] = React.useState(true);

  React.useEffect(() => {
    async function fetchTheme() {
      try {
        const settings = await getSettings();
        const loginImage = settings.find(s => s.key === 'loginImage')?.value || '/la-viña/cpv-la viña.png.png';
        const loginOverlayImage = settings.find(s => s.key === 'loginOverlayImage')?.value || '/fondo-azul/fondo-azul,png.png';
        setThemeConfig({ loginImage, loginOverlayImage });
      } catch (error) {
        console.error("Failed to load theme settings, using defaults.", error);
        // Set default values in case of error
        setThemeConfig({
          loginImage: '/la-viña/cpv-la viña.png.png',
          loginOverlayImage: '/fondo-azul/fondo-azul,png.png'
        });
      } finally {
        setIsLoadingTheme(false);
      }
    }
    fetchTheme();
  }, []);

  React.useEffect(() => {
    if (state?.success) {
      window.location.href = '/dashboard';
    }
  }, [state, router]);
  
  if (isLoadingTheme) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );
  }

  return (
    <main className="min-h-screen w-full lg:grid lg:grid-cols-2">
       <div className="relative hidden lg:block">
        <Image
          src={themeConfig.loginImage}
          alt="Consultorio médico"
          fill
          className="h-full w-full object-cover dark:brightness-[0.8] dark:grayscale"
          unoptimized
          priority
        />
      </div>
      <div
        className="flex items-center justify-center py-12 relative"
      >
        {themeConfig.loginOverlayImage && (
            <Image
                src={themeConfig.loginOverlayImage}
                alt="Fondo azul decorativo"
                fill
                className="object-cover"
                unoptimized
                priority
            />
        )}
         <div className="relative z-10 mx-auto grid w-[380px] gap-6 bg-slate-900/80 backdrop-blur-lg p-8 rounded-[20px] shadow-2xl shadow-black/30">
          <div className="grid gap-2 text-center">
            <div className="mb-4 flex justify-center">
              <Logo className="mb-[-1.5rem] w-64 h-auto" />
            </div>
            <h1 className="text-3xl font-bold font-headline text-gray-100">Bienvenido a MediHub</h1>
            <p className="text-balance text-gray-300">
              Ingrese sus credenciales para acceder al sistema.
            </p>
          </div>
          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-gray-300">Usuario</Label>
              <Input
                id="username"
                name="username"
                placeholder="su.usuario"
                required
                className="bg-muted/50 border-slate-700 rounded-lg text-gray-800 placeholder:text-gray-500 focus:border-blue-400"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="bg-muted/50 border-slate-700 rounded-lg text-gray-800 placeholder:text-gray-500 focus:border-blue-400"
              />
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertTitle>Error de Autenticación</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <LoginButton />
          </form>
        </div>
      </div>
    </main>
  );
}
