import { ActivityDetail } from '@/features/activity-detail';

export const dynamic = 'force-dynamic';

export default async function ActivityDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ActivityDetail id={Number(id)} />;
}
