import { saveActivity } from '@/lib/actions';
import type { ParsedFit } from '@/lib/fit';
import styles from './activity-form.module.css';

const SPORTS = ['run', 'walk', 'ride', 'swim', 'strength', 'hiit', 'yoga'];

export type GearOption = { id: number; name: string; kind: 'shoe' | 'watch'; is_default: number };

export function ActivityForm({ gear, prefill }: { gear: GearOption[]; prefill?: ParsedFit }) {
    const shoes = gear.filter((g) => g.kind === 'shoe');
    const watches = gear.filter((g) => g.kind === 'watch');
    const defaultShoe = shoes.find((g) => g.is_default)?.id ?? '';
    const defaultWatch = watches.find((g) => g.is_default)?.id ?? '';
    return (
        <form action={saveActivity} className={styles.form}>
            <label className={styles.field}>
                date
                <input
                    type="date"
                    name="date"
                    required
                    defaultValue={prefill?.date ?? new Date().toISOString().slice(0, 10)}
                />
            </label>
            <label className={styles.field}>
                sport
                <select name="sport" defaultValue={prefill?.sport ?? 'run'}>
                    {SPORTS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </label>
            <label className={styles.field}>
                duration (min)
                <input
                    type="number"
                    name="duration_min"
                    min="0"
                    step="0.1"
                    required
                    defaultValue={prefill?.duration_min}
                />
            </label>
            <label className={styles.field}>
                distance (km, optional)
                <input
                    type="number"
                    name="distance_km"
                    min="0"
                    step="0.01"
                    defaultValue={prefill?.distance_km ?? undefined}
                />
            </label>
            <label className={styles.field}>
                shoe (run/walk)
                <select name="shoe_id" defaultValue={defaultShoe}>
                    <option value="">—</option>
                    {shoes.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className={styles.field}>
                watch
                <select name="watch_id" defaultValue={defaultWatch}>
                    <option value="">—</option>
                    {watches.map((w) => (
                        <option key={w.id} value={w.id}>
                            {w.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className={styles.field}>
                notes
                <textarea name="notes" rows={3} />
            </label>
            {prefill?.route && (
                <input type="hidden" name="route" value={JSON.stringify(prefill.route)} />
            )}
            {prefill?.metrics && (
                <input type="hidden" name="metrics" value={JSON.stringify(prefill.metrics)} />
            )}
            {prefill?.series && (
                <input type="hidden" name="series" value={JSON.stringify(prefill.series)} />
            )}
            <button type="submit" className={styles.submit}>
                save
            </button>
        </form>
    );
}
