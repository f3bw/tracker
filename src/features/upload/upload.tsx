import { listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { Disclosure } from '@/components/disclosure/disclosure';
import { UploadForm } from './upload-form';
import styles from './upload.module.css';

export async function Upload() {
    return (
        <>
            <h1 className={styles.heading}>upload fit file</h1>
            <UploadForm gear={await listGear(await currentUserId())} />
            <Disclosure summary="how do I get a .fit file?" className={styles.howto}>
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
            </Disclosure>
        </>
    );
}
