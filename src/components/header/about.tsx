'use client';

import { useEffect, useRef } from 'react';
import styles from './header.module.css';

export function About() {
    const ref = useRef<HTMLDetailsElement>(null);

    // ponytail: <details> has no light-dismiss; one document listener closes it on outside tap
    useEffect(() => {
        const close = (e: PointerEvent) => {
            const el = ref.current;
            if (el?.open && !el.contains(e.target as Node)) el.open = false;
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, []);

    return (
        <details className={styles.about} ref={ref}>
            <summary aria-label="about this app">i</summary>
            <p className={styles['about-panel']}>
                A privacy-first health &amp; activity tracker. Your workouts live in your own
                database — no ads, no tracking, no data shared with anyone. Self-hosted and open by
                design.
            </p>
        </details>
    );
}
