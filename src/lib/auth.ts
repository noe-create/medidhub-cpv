

import { getIronSession, type IronSession } from 'iron-session';
import { cookies, type ReadonlyRequestCookies } from 'next/headers';
import type { User } from './types';

export type SessionData = {
  user?: User;
  isLoggedIn: boolean;
  permissions?: string[];
};

const defaultSession: SessionData = {
  user: undefined,
  isLoggedIn: false,
  permissions: [],
};

export async function getSession(
  cookieStore: ReadonlyRequestCookies = cookies()
): Promise<IronSession<SessionData>> {
  // Fallback for environments where the secret might not be set in the .env file
  const secret = process.env.SECRET_COOKIE_PASSWORD || 'complex_password_n5k2v8y/B?E(H+MbQeThVmYq3t6w9z$C';

  if (!secret || secret.length < 32) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! SECRET_COOKIE_PASSWORD is not set or is too short.       !!!');
    console.error('!!! It must be at least 32 characters long.                    !!!');
    console.error('!!! Authentication will not work until this is fixed.        !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    // In a real app, you might want to throw an error here to prevent startup
    // For this environment, we'll proceed but log a severe warning.
  }

  const sessionOptions = {
    password: secret,
    cookieName: 'salud-cpv-session',
    cookieOptions: {
        secure: false, // Changed from process.env.NODE_ENV === 'production'
    },
  };

  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  return session;
}

export async function authorize(permissionId: string) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !session.permissions) {
        throw new Error('Acción no autorizada. Debe iniciar sesión.');
    }

    // Superuser always has all permissions
    if (session.user.role.name === 'Superusuario') {
        return;
    }

    if (!session.permissions.includes(permissionId)) {
        console.warn(`Authorization failed for user ${session.user.username} (role: ${session.user.role.name}). Missing permission: ${permissionId}`);
        throw new Error('No tiene permiso para realizar esta acción.');
    }
}
