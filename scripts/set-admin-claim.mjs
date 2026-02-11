/**
 * One-time script to set custom claim `admin: true` for a Firebase Auth user.
 * Run with: FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY='...' node scripts/set-admin-claim.mjs <UID>
 * Get the UID from Firebase Console → Authentication → Users (user's UID).
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const uid = process.argv[2];

if (!projectId || !clientEmail || !privateKey) {
	console.error('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
	process.exit(1);
}
if (!uid) {
	console.error('Usage: node scripts/set-admin-claim.mjs <UID>');
	console.error('Get UID from Firebase Console → Authentication → Users');
	process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth();
auth
	.setCustomUserClaims(uid, { admin: true })
	.then(() => console.log('Custom claim admin:true set for UID', uid))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
