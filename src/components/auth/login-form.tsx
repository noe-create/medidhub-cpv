
'use client';

import * as React from 'react';
import { useFormStatus, useActionState } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth-actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

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

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);
  const router = useRouter();

  React.useEffect(() => {
    if (state?.success) {
      router.push('/dashboard');
    }
  }, [state, router]);

  return (
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
  );
}
