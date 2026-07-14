import { monthTotals, sportTotals } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const fmt = (n: number) => Math.round(n * 10) / 10;

export default async function Stats() {
    const userId = await currentUserId();
    const bySport = await sportTotals(userId);
    const byMonth = await monthTotals(userId);
    const total = {
        count: bySport.reduce((s, r) => s + r.count, 0),
        km: bySport.reduce((s, r) => s + r.km, 0),
        min: bySport.reduce((s, r) => s + r.min, 0),
    };

    return (
        <>
            <h1 className={styles.heading}>stats</h1>
            <p className={styles.totals}>
                {total.count} activities · {fmt(total.km)} km · {fmt(total.min / 60)} h
            </p>

            <h2 className={styles.subheading}>by sport</h2>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>sport</th>
                        <th>count</th>
                        <th>km</th>
                        <th>hours</th>
                    </tr>
                </thead>
                <tbody>
                    {bySport.map((r) => (
                        <tr key={r.sport}>
                            <td>{r.sport}</td>
                            <td>{r.count}</td>
                            <td>{fmt(r.km)}</td>
                            <td>{fmt(r.min / 60)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2 className={styles.subheading}>by month</h2>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>month</th>
                        <th>count</th>
                        <th>km</th>
                        <th>hours</th>
                    </tr>
                </thead>
                <tbody>
                    {byMonth.map((r) => (
                        <tr key={r.month}>
                            <td>{r.month}</td>
                            <td>{r.count}</td>
                            <td>{fmt(r.km)}</td>
                            <td>{fmt(r.min / 60)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
