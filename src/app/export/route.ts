import { currentUserId } from '@/lib/current-user';
import { listActivities, listGear } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const userId = await currentUserId();
    const data = {
        exported_at: new Date().toISOString(),
        activities: await listActivities(userId),
        gear: await listGear(userId),
    };
    return Response.json(data, {
        headers: {
            'Content-Disposition': `attachment; filename="tracker-export-${data.exported_at.slice(0, 10)}.json"`,
        },
    });
}
