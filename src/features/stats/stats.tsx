import { monthTotals, sportTotals } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './stats.module.css';

const fmt = (n: number) => Math.round(n * 10) / 10;

function TotalsTable({
    head,
    rows,
}: {
    head: string;
    rows: { name: string; count: number; km: number; min: number }[];
}) {
    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>{head}</th>
                    <th>count</th>
                    <th>km</th>
                    <th>hours</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr key={r.name}>
                        <td>{r.name}</td>
                        <td>{r.count}</td>
                        <td>{fmt(r.km)}</td>
                        <td>{fmt(r.min / 60)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export async function Stats() {
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
            <TotalsTable head="sport" rows={bySport.map((r) => ({ ...r, name: r.sport }))} />

            <h2 className={styles.subheading}>by month</h2>
            <TotalsTable head="month" rows={byMonth.map((r) => ({ ...r, name: r.month }))} />

            <p className={styles.export}>
                <a href="/export">export all data (json)</a> — your workouts, portable, any time.
            </p>
        </>
    );
}
