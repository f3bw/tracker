import { notFound } from 'next/navigation';
import { changeGear, removeActivity } from '@/lib/actions';
import { getActivity, listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { RouteSvg } from '@/components/route-svg/route-svg';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = await currentUserId();
    const activity = await getActivity(Number(id), userId);
    if (!activity) notFound();
    const gear = await listGear(userId);
    const shoes = gear.filter((g) => g.kind === 'shoe');
    const watches = gear.filter((g) => g.kind === 'watch');

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
                <dt>watch</dt>
                <dd>{activity.watch_name ?? '—'}</dd>
            </dl>
            <details className={styles['gear-edit']}>
                <summary>change gear</summary>
                <form action={changeGear} className={styles['gear-form']}>
                    <input type="hidden" name="id" value={activity.id} />
                    <label>
                        shoe
                        <select name="shoe_id" defaultValue={activity.shoe_id ?? ''}>
                            <option value="">—</option>
                            {shoes.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        watch
                        <select name="watch_id" defaultValue={activity.watch_id ?? ''}>
                            <option value="">—</option>
                            {watches.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit">save</button>
                </form>
            </details>
            {activity.notes && <p className={styles.notes}>{activity.notes}</p>}
            {activity.route && <RouteSvg points={JSON.parse(activity.route)} />}
            <form action={removeActivity} className={styles.delete}>
                <input type="hidden" name="id" value={activity.id} />
                <button type="submit">delete</button>
            </form>
        </>
    );
}
