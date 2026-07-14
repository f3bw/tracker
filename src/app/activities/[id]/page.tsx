import { notFound } from 'next/navigation';
import { changeGear, removeActivity } from '@/lib/actions';
import { getActivity, hasFit, listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { RouteSvg } from '@/components/route-svg/route-svg';
import { Sparkline } from '@/components/sparkline/sparkline';
import type { Lap, Metrics, Series } from '@/lib/fit';
import { paceStr } from '@/lib/format';
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
    const metrics: Metrics = activity.metrics ? JSON.parse(activity.metrics) : {};
    const series: Series = activity.series ? JSON.parse(activity.series) : {};
    const laps: Lap[] = activity.laps ? JSON.parse(activity.laps) : [];
    const fitAvailable = await hasFit(activity.id);
    const pace =
        activity.distance_km && activity.duration_min
            ? activity.duration_min / activity.distance_km
            : null;

    return (
        <>
            <h1 className={styles.heading}>
                {activity.sport} · {activity.date}
            </h1>
            <div className={styles.layout}>
                <div>
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
                                    {metrics.avg_hr} avg
                                    {metrics.max_hr != null && ` · ${metrics.max_hr} max`} bpm
                                </dd>
                            </>
                        )}
                        {metrics.avg_cadence != null && (
                            <>
                                <dt>cadence</dt>
                                <dd>{metrics.avg_cadence} spm</dd>
                            </>
                        )}
                        {metrics.avg_power != null && (
                            <>
                                <dt>power</dt>
                                <dd>
                                    {metrics.avg_power} avg
                                    {metrics.max_power != null && ` · ${metrics.max_power} max`} W
                                </dd>
                            </>
                        )}
                        {metrics.avg_temp_c != null && (
                            <>
                                <dt>temperature</dt>
                                <dd>{metrics.avg_temp_c} °C</dd>
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
                    {fitAvailable && (
                        <p className={styles['fit-download']}>
                            <a href={`/activities/${activity.id}/fit`}>download original fit file</a>
                        </p>
                    )}
                    <form action={removeActivity} className={styles.delete}>
                        <input type="hidden" name="id" value={activity.id} />
                        <button type="submit">delete</button>
                    </form>
                </div>
                <div>
                    {activity.route && <RouteSvg points={JSON.parse(activity.route)} />}
                    <div className={styles.charts}>
                        {series.alt && <Sparkline label="elevation" values={series.alt} unit="m" />}
                        {series.pace && (
                            <Sparkline label="pace" values={series.pace} unit="/km" invert pace />
                        )}
                        {series.hr && (
                            <Sparkline label="heart rate" values={series.hr} unit="bpm" />
                        )}
                        {series.cad && <Sparkline label="cadence" values={series.cad} unit="spm" />}
                        {series.pw && <Sparkline label="power" values={series.pw} unit="W" />}
                        {series.temp && (
                            <Sparkline label="temperature" values={series.temp} unit="°C" />
                        )}
                    </div>
                    {laps.length > 0 && (
                        <table className={styles.laps}>
                            <thead>
                                <tr>
                                    <th>lap</th>
                                    <th>time</th>
                                    <th>km</th>
                                    <th>pace</th>
                                    <th>hr</th>
                                </tr>
                            </thead>
                            <tbody>
                                {laps.map((l, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{l.min} min</td>
                                        <td>{l.km ?? '—'}</td>
                                        <td>
                                            {l.km && l.min
                                                ? `${paceStr(l.min / l.km)} /km`
                                                : '—'}
                                        </td>
                                        <td>{l.hr ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
