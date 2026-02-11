import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export function getDb(): Firestore | null {
	if (db) return db;
	const projectId = import.meta.env.FIREBASE_PROJECT_ID;
	const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY;
	if (!projectId || !clientEmail || !privateKey) return null;
	if (getApps().length === 0) {
		const key = privateKey.replace(/\\n/g, '\n');
		initializeApp({
			credential: cert({ projectId, clientEmail, privateKey: key }),
		});
	}
	db = getFirestore();
	return db;
}
