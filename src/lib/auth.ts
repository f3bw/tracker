// ponytail: stateless sessions — cookie is "<userId>.<hmac(userId)>" signed with
// SESSION_SECRET. Rotating the secret logs out every device on every account.
export const SESSION_COOKIE = 'session';

async function hmac(message: string): Promise<string> {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is not set');
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signSession(userId: number): Promise<string> {
    return `${userId}.${await hmac(String(userId))}`;
}

export async function verifySession(cookie: string): Promise<number | null> {
    const [id, sig] = cookie.split('.');
    if (!id || !sig || !/^\d+$/.test(id)) return null;
    return sig === (await hmac(id)) ? Number(id) : null;
}
