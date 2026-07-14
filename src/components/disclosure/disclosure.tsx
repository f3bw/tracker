import styles from './disclosure.module.css';

// collapsed-by-default section with a consistent summary hover/open state
export function Disclosure({
    summary,
    className,
    children,
}: {
    summary: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <details className={className ? `${styles.disclosure} ${className}` : styles.disclosure}>
            <summary>{summary}</summary>
            {children}
        </details>
    );
}
