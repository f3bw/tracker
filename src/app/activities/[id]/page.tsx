import { notFound } from 'next/navigation';
import { removeActivity } from '@/lib/actions';
import { getActivity } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { RouteSvg } from '@/components/route-svg/route-svg';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const activity = await getActivity(Number(id), await currentUserId());
    if (!activity) notFound();

    return (
        <>
            <h1 className={styles.heading}>
                {activity.sport} · {activity.date}
            </h1>
            <dl className={styles.meta}>
                <dt>duration</dt>
                <dd>{activity.duration_min} min</dd>
                <dt>distance</dt>
                <dd>{activity.distance_km != null ? `${activity.distance_km} km` : '—'}</dd>
                <dt>shoe</dt>
                <dd>{activity.shoe_name ?? '—'}</dd>
            </dl>
            {activity.notes && <p className={styles.notes}>{activity.notes}</p>}
            {activity.route && <RouteSvg points={JSON.parse(activity.route)} />}
            <form action={removeActivity} className={styles.delete}>
                <input type="hidden" name="id" value={activity.id} />
                <button type="submit">delete</button>
            </form>
        </>
    );
}
