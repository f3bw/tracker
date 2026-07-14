import { ActivityForm } from '@/components/activity-form/activity-form';
import { listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function NewActivity() {
    return (
        <>
            <h1 className={styles.heading}>log activity</h1>
            <ActivityForm gear={await listGear(await currentUserId())} />
        </>
    );
}
