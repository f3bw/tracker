import Link from 'next/link';
import { listActivities, type Activity } from '@/lib/db';
import styles from './activity-list.module.css';

function ActivityRow({ activity: a }: { activity: Activity }) {
    return (
        <tr>
            <td>
                <Link href={`/activities/${a.id}`}>{a.date}</Link>
            </td>
            <td>{a.sport}</td>
            <td>{a.duration_min} min</td>
            <td>{a.distance_km != null ? `${a.distance_km} km` : '—'}</td>
            <td>{a.shoe_name ?? '—'}</td>
        </tr>
    );
}

export async function ActivityList({ userId }: { userId: number }) {
    const activities = await listActivities(userId);
    return (
        <>
            <h1 className={styles.heading}>activities</h1>
            {activities.length === 0 ? (
                <p className={styles.empty}>
                    nothing yet — <Link href="/activities/new">log one</Link> or{' '}
                    <Link href="/upload">upload a fit file</Link>.
                </p>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>date</th>
                            <th>sport</th>
                            <th>duration</th>
                            <th>distance</th>
                            <th>shoe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((a) => (
                            <ActivityRow key={a.id} activity={a} />
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
