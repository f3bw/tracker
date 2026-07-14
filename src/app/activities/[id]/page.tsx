import { notFound } from 'next/navigation';
import { changeGear, removeActivity } from '@/lib/actions';
import { getActivity, listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { RouteSvg } from '@/components/route-svg/route-svg';
import { Sparkline } from '@/components/sparkline/sparkline';
import type { Metrics, Series } from '@/lib/fit';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

function paceStr(minPerKm: number): string {
    const m = Math.floor(minPerKm);
    const s = Math.round((minPerKm - m) * 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default async function ActivityDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = await currentUserId();
    const activity = await getActivity(Number(id), userId);
    if (!activity) notFound();
    const gear = await listGear(userId);
    const shoes = gear.filter((g) => g.kind === 'shoe');
    const watches = gear.filter((g) => g.kind === 'watch');
    const metrics: Metrics = activity.metrics ? JSON.parse(activity.metrics) : {};
    const series: Series = activity.series ? JSON.parse(activity.series) : {};
    const pace =
        activity.distance_km && activity.duration_min
            ? activity.duration_min / activity.distance_km
            : null;

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
                {pace && (
                    <>
                        <dt>pace</dt>
                        <dd>{paceStr(pace)} /km</dd>
                    </>
                )}
                {metrics.ascent_m != null && (
                    <>
                        <dt>ascent</dt>
                        <dd>{metrics.ascent_m} m</dd>
                    </>
                )}
                {metrics.calories != null && (
                    <>
                        <dt>calories</dt>
                        <dd>{metrics.calories} kcal</dd>
                    </>
                )}
                {metrics.avg_hr != null && (
                    <>
                        <dt>heart rate</dt>
                        <dd>
                            {metrics.avg_hr} avg{metrics.max_hr != null && ` · ${metrics.max_hr} max`} bpm
                        </dd>
                    </>
                )}
                {metrics.avg_cadence != null && (
                    <>
                        <dt>cadence</dt>
                        <dd>{metrics.avg_cadence} spm</dd>
                    </>
                )}
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
            <div className={styles.charts}>
                {series.alt && <Sparkline label="elevation" values={series.alt} unit="m" />}
                {series.pace && (
                    <Sparkline
                        label="pace"
                        values={series.pace}
                        unit="/km"
                        invert
                        format={paceStr}
                    />
                )}
                {series.hr && <Sparkline label="heart rate" values={series.hr} unit="bpm" />}
                {series.cad && <Sparkline label="cadence" values={series.cad} unit="spm" />}
            </div>
            <form action={removeActivity} className={styles.delete}>
                <input type="hidden" name="id" value={activity.id} />
                <button type="submit">delete</button>
            </form>
        </>
    );
}
