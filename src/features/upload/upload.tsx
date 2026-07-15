import { listGear } from '@/lib/db';
import { currentUserId } from '@/lib/current-user';
import { Disclosure } from '@/components/disclosure';
import { UploadForm } from './upload-form';
import styles from './upload.module.css';

export async function Upload() {
    return (
        <>
            <h1 className={styles.heading}>upload activity file</h1>
            <UploadForm gear={await listGear(await currentUserId())} />
            <Disclosure summary="how do I get a .fit file? (garmin)" className={styles.howto}>
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
            <Disclosure summary="how do I export from apple watch?" className={styles.howto}>
                <p>
                    apple has no per-workout export built in, but the .gpx files are yours to take
                    (route and altitude only — apple locks heart rate inside the health app):
                </p>
                <ol>
                    <li>
                        no app needed: iPhone Health app → profile picture → "export all health
                        data" — the zip's <code>workout-routes/</code> folder holds one .gpx per
                        outdoor workout
                    </li>
                    <li>
                        one at a time: free apps like{' '}
                        <a
                            href="https://apps.apple.com/us/app/gpx-export/id1667613575"
                            target="_blank"
                            rel="noreferrer"
                        >
                            GPX Export
                        </a>{' '}
                        save a single workout as .gpx
                    </li>
                    <li>upload the .gpx here; check the sport before saving</li>
                </ol>
                <p>indoor workouts have no gps route — log those by hand on the activities page.</p>
            </Disclosure>
        </>
    );
}
