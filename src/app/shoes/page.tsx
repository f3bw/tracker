import { addShoe, removeShoe } from '@/lib/actions';
import { listShoes } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Shoes() {
    const shoes = await listShoes(await currentUserId());
    return (
        <>
            <h1 className={styles.heading}>shoes</h1>
            {shoes.length > 0 && (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>name</th>
                            <th>km</th>
                            <th>threshold</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {shoes.map((s) => {
                            const worn = s.threshold_km != null && s.total_km >= s.threshold_km;
                            return (
                                <tr key={s.id} className={worn ? styles.worn : undefined}>
                                    <td>
                                        {s.name}
                                        {worn && ' — replace'}
                                    </td>
                                    <td>{Math.round(s.total_km * 10) / 10}</td>
                                    <td>{s.threshold_km ?? '—'}</td>
                                    <td>
                                        <form action={removeShoe}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <button type="submit">delete</button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
            <form action={addShoe} className={styles.add}>
                <input type="text" name="name" placeholder="shoe name" required />
                <input type="number" name="threshold_km" placeholder="threshold km" min="0" />
                <button type="submit">add</button>
            </form>
        </>
    );
}
