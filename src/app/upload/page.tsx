import { listShoes } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { UploadForm } from './upload-form';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Upload() {
    return (
        <>
            <h1 className={styles.heading}>upload fit file</h1>
            <UploadForm shoes={await listShoes(await currentUserId())} />
        </>
    );
}
