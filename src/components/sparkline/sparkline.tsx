import styles from './sparkline.module.css';

export function Sparkline({
    label,
    values,
    unit,
    invert = false,
    format = (n: number) => String(Math.round(n * 10) / 10),
}: {
    label: string;
    values: number[];
    unit: string;
    invert?: boolean;
    format?: (n: number) => string;
}) {
    const w = 300;
    const h = 60;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const y = (v: number) => {
        const t = (v - min) / span;
        return 4 + (h - 8) * (invert ? t : 1 - t);
    };
    const points = values
        .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');

    return (
        <figure className={styles.sparkline}>
            <figcaption className={styles.caption}>
                <span>{label}</span>
                <span className={styles.range}>
                    {format(min)}–{format(max)} {unit}
                </span>
            </figcaption>
            <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label} chart`}>
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        </figure>
    );
}
