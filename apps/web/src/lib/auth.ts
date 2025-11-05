import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { config } from '@cerberix/config';

const COOKIE = process.env.SESSION_COOKIE_NAME || 'cerberix_session';
const secret = new TextEncoder().encode(config.JWT_SECRET);

export async function setSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function getSession(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return String(payload.sub);
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().set(COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/' });
}


