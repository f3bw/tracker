import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import { ActivityList } from '@/features/activity-list';
import { Landing } from '@/features/landing';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const cookie = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
    const userId = await verifySession(cookie);
    if (userId === null) return <Landing />;
    return <ActivityList userId={userId} />;
}
