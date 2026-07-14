import { addGear, removeGear } from '@/lib/actions';
import { listGear, type Gear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const fmt = (n: number) => Math.round(n * 10) / 10;

function GearRows({ items, wear }: { items: Gear[]; wear: (g: Gear) => string }) {
    return (
        <tbody>
            {items.map((g) => {
                const worn = g.threshold_km != null && g.total_km >= g.threshold_km;
                return (
                    <tr key={g.id} className={worn ? styles.worn : undefined}>
                        <td>
                            {g.name}
                            {worn && ' — replace'}
                        </td>
                        <td>{wear(g)}</td>
                        <td>{g.activity_count}</td>
                        <td>
                            <form action={removeGear}>
                                <input type="hidden" name="id" value={g.id} />
                                <button type="submit">delete</button>
                            </form>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

export default async function GearPage() {
    const gear = await listGear(await currentUserId());
    const shoes = gear.filter((g) => g.kind === 'shoe');
    const watches = gear.filter((g) => g.kind === 'watch');

    return (
        <>
            <h1 className={styles.heading}>gear</h1>

            {shoes.length > 0 && (
                <>
                    <h2 className={styles.subheading}>shoes</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>name</th>
                                <th>km (threshold)</th>
                                <th>activities</th>
                                <th />
                            </tr>
                        </thead>
                        <GearRows
                            items={shoes}
                            wear={(g) =>
                                `${fmt(g.total_km)}${g.threshold_km != null ? ` / ${g.threshold_km}` : ''}`
                            }
                        />
                    </table>
                </>
            )}

            {watches.length > 0 && (
                <>
                    <h2 className={styles.subheading}>watches</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>name</th>
                                <th>hours</th>
                                <th>activities</th>
                                <th />
                            </tr>
                        </thead>
                        <GearRows items={watches} wear={(g) => String(fmt(g.total_min / 60))} />
                    </table>
                </>
            )}

            <form action={addGear} className={styles.add}>
                <select name="kind" defaultValue="shoe">
                    <option value="shoe">shoe</option>
                    <option value="watch">watch</option>
                </select>
                <input type="text" name="name" placeholder="name" required />
                <input type="number" name="threshold_km" placeholder="threshold km" min="0" />
                <button type="submit">add</button>
            </form>
        </>
    );
}
