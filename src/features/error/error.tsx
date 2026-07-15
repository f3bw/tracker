'use client';

import styles from './error.module.css';

export function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <section className={styles.error} aria-labelledby="error-heading">
            <h1 id="error-heading" className={styles.heading}>
                something went wrong
            </h1>
            <p className={styles.hint}>
                an unexpected error occurred — your data is fine, this page just failed to render.
            </p>
            <button type="button" onClick={reset} className={styles.retry}>
                try again
            </button>
        </section>
    );
}
