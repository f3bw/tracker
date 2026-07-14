'use client';

import { useActionState } from 'react';
import { parseFitFile } from '@/lib/actions';
import { ActivityForm, type GearOption } from '@/components/activity-form/activity-form';
import styles from './upload.module.css';

export function UploadForm({ gear }: { gear: GearOption[] }) {
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
                    <ActivityForm gear={gear} prefill={state.parsed} />
                </div>
            )}
        </>
    );
}
