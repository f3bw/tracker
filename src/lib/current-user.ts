import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './auth';

export async function currentUserId(): Promise<number> {
    const cookie = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
    const userId = await verifySession(cookie);
    if (userId === null) redirect('/login');
    return userId;
}
