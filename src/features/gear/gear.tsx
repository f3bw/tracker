import { addGear, makeDefaultGear, removeGear } from '@/lib/actions';
import { listGear, type Gear as GearItem } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './gear.module.css';

const fmt = (n: number) => Math.round(n * 10) / 10;

function GearSection({
    kind,
    title,
    items,
    wearHeader,
    wear,
    withThreshold,
}: {
    kind: GearItem['kind'];
    title: string;
    items: GearItem[];
    wearHeader: string;
    wear: (g: GearItem) => string;
    withThreshold?: boolean;
}) {
    return (
        <section className={styles.section}>
            <h2 className={styles.subheading}>{title}</h2>
            {items.length > 0 && (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>name</th>
                            <th>{wearHeader}</th>
                            <th>activities</th>
                            <th />
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((g) => {
                            const worn = g.threshold_km != null && g.total_km >= g.threshold_km;
                            return (
                                <tr key={g.id} className={worn ? styles.worn : undefined}>
                                    <td>
                                        {g.name}
                                        {g.is_default ? ' · default' : ''}
                                        {worn && ' — replace'}
                                    </td>
                                    <td>{wear(g)}</td>
                                    <td>{g.activity_count}</td>
                                    <td>
                                        {!g.is_default && (
                                            <form action={makeDefaultGear}>
                                                <input type="hidden" name="id" value={g.id} />
                                                <button type="submit">make default</button>
                                            </form>
                                        )}
                                    </td>
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
                </table>
            )}
            <form action={addGear} className={styles.add}>
                <input type="hidden" name="kind" value={kind} />
                <input type="text" name="name" placeholder={`${kind} name`} required />
                {withThreshold && (
                    <input type="number" name="threshold_km" placeholder="threshold km" min="0" />
                )}
                <button type="submit">add {kind}</button>
            </form>
        </section>
    );
}

export async function Gear() {
    const gear = await listGear(await currentUserId());

    return (
        <>
            <h1 className={styles.heading}>gear</h1>
            <GearSection
                kind="shoe"
                title="shoes"
                items={gear.filter((g) => g.kind === 'shoe')}
                wearHeader="km (threshold)"
                wear={(g) =>
                    `${fmt(g.total_km)}${g.threshold_km != null ? ` / ${g.threshold_km}` : ''} km`
                }
                withThreshold
            />
            <GearSection
                kind="watch"
                title="watches"
                items={gear.filter((g) => g.kind === 'watch')}
                wearHeader="hours"
                wear={(g) => `${fmt(g.total_min / 60)} h`}
            />
        </>
    );
}
