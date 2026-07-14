import { listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { UploadForm } from './upload-form';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Upload() {
    return (
        <>
            <h1 className={styles.heading}>upload fit file</h1>
            <UploadForm gear={await listGear(await currentUserId())} />
            <details className={styles.howto}>
                <summary>how do I get a .fit file?</summary>
                <ol>
                    <li>
                        open{' '}
                        <a href="https://connect.garmin.com" target="_blank" rel="noreferrer">
                            connect.garmin.com
                        </a>{' '}
                        on desktop (not the app)
                    </li>
                    <li>go to the activity's detail page</li>
                    <li>click the share icon (top right) and choose "export file"</li>
                    <li>upload the downloaded .fit file here</li>
                </ol>
            </details>
        </>
    );
}
