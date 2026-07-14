import styles from './route-svg.module.css';

export function RouteSvg({ points }: { points: [number, number][] }) {
    const lats = points.map((p) => p[0]);
    const lons = points.map((p) => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    // longitude degrees shrink with latitude; correct so the shape isn't stretched
    const lonScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    const w = Math.max((maxLon - minLon) * lonScale, 1e-6);
    const h = Math.max(maxLat - minLat, 1e-6);
    const size = 300;
    const scale = (size * 0.9) / Math.max(w, h);
    const px = (lon: number) => (lon - minLon) * lonScale * scale + (size - w * scale) / 2;
    const py = (lat: number) => (maxLat - lat) * scale + (size - h * scale) / 2;
    const path = points.map(([lat, lon]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join(' ');

    return (
        <svg
            className={styles.route}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="activity route"
        >
            <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}
