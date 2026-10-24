/**
 * Cuentas de la web (beta cerrada): alias + contraseña. Sin correo ni nombre real (R2).
 * La contraseña se guarda con PBKDF2-SHA256 y sal propia; jamás en claro.
 */

export interface Account {
  userId: string;
  salt: string;
  hash: string;
  iters: number;
  createdAt: string;
}

const enc = new TextEncoder();
const toB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

/** Workers admite hasta 100.000 iteraciones de PBKDF2. */
const ITERATIONS = 100_000;

async function derive(password: string, salt: Uint8Array, iters: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iters }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<Pick<Account, 'salt' | 'hash' | 'iters'>> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), hash: toB64(await derive(password, salt, ITERATIONS)), iters: ITERATIONS };
}

/** Compara en tiempo constante. */
export async function checkPassword(password: string, acc: Pick<Account, 'salt' | 'hash' | 'iters'>): Promise<boolean> {
  const got = await derive(password, fromB64(acc.salt), acc.iters);
  const want = fromB64(acc.hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i]! ^ want[i]!;
  return diff === 0;
}

export const ALIAS = /^[a-z0-9][a-z0-9_.-]{2,23}$/;
