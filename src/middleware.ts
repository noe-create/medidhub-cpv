
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const { isLoggedIn } = session;
  const { pathname } = req.nextUrl;

  // Define rutas públicas y privadas
  const isPublicRoute = pathname === '/login';
  const isPrivateRoute = pathname.startsWith('/dashboard');

  // Si no está logueado y intenta acceder a una ruta privada, redirigir a login
  if (!isLoggedIn && isPrivateRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si está logueado y intenta acceder a una ruta pública, redirigir a dashboard
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Si accede a la raíz, redirigir según estado de sesión
  if (pathname === '/') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Permitir el acceso si no se cumple ninguna de las condiciones anteriores
  return NextResponse.next();
}

export const config = {
  // Coincidir con todas las rutas excepto las de la API, estáticos, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
