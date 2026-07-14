import Link from 'next/link';
import { listActivities } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const activities = await listActivities(await currentUserId());
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
                            <tr key={a.id}>
                                <td>
                                    <Link href={`/activities/${a.id}`}>{a.date}</Link>
                                </td>
                                <td>{a.sport}</td>
                                <td>{a.duration_min} min</td>
                                <td>{a.distance_km != null ? `${a.distance_km} km` : '—'}</td>
                                <td>{a.shoe_name ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
