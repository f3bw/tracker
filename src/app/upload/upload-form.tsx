'use client';

import { useActionState } from 'react';
import { parseFitFile } from '@/lib/actions';
import { ActivityForm } from '@/components/activity-form/activity-form';
import styles from './page.module.css';

export function UploadForm({ shoes }: { shoes: { id: number; name: string }[] }) {
    const [state, formAction] = useActionState(parseFitFile, null);

    return (
        <>
            <form action={formAction} className={styles.upload}>
                <input type="file" name="fit" accept=".fit" required />
                <button type="submit">parse</button>
            </form>
            {state?.error && <p className={styles.error}>{state.error}</p>}
            {state?.parsed && (
                <div className={styles.confirm}>
                    <p className={styles.hint}>
                        parsed{state.parsed.route ? `, ${state.parsed.route.length} gps points` : ', no gps'} — confirm and save:
                    </p>
                    <ActivityForm shoes={shoes} prefill={state.parsed} />
                </div>
            )}
        </>
    );
}
