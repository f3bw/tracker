// ponytail: stateless single-user session — the cookie is HMAC(SESSION_SECRET).
// Rotating SESSION_SECRET logs out every device; that's the logout story.
export const SESSION_COOKIE = 'session';

export async function sessionToken(): Promise<string> {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is not set');
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('tracker-session'));
    return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}
