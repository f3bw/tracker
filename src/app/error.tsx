'use client';

import { ErrorPage } from '@/features/error';

export default function Error({ reset }: { error: Error; reset: () => void }) {
    return <ErrorPage reset={reset} />;
}
