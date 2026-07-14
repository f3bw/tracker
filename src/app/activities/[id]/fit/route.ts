import { currentUserId } from '@/lib/current-user';
import { getFit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getFit(Number(id), await currentUserId());
    if (!data) return new Response('not found', { status: 404 });
    return new Response(data, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="activity-${id}.fit"`,
        },
    });
}
