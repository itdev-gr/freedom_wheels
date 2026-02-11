import { getAdminAuth } from './firebase';

const SESSION_COOKIE = 'admin_session';
const COOKIE_MAX_AGE = 3600; // 1 hour, matches Firebase ID token TTL

function getTokenFromRequest(request: Request): string | null {
	try {
		const cookieHeader = request.headers.get('cookie');
		if (!cookieHeader) return null;
		const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
		if (!match) return null;
		const value = decodeURIComponent(match[1].trim());
		return value || null;
	} catch {
		return null;
	}
}

export async function isAdminAuthenticated(request: Request): Promise<boolean> {
	try {
		const token = getTokenFromRequest(request);
		if (!token) return false;
		const auth = getAdminAuth();
		if (!auth) return false;
		const decoded = await auth.verifyIdToken(token);
		// Require custom claim admin === true (set via Admin SDK setCustomUserClaims)
		return decoded.customClaims?.admin === true;
	} catch {
		return false;
	}
}

export function setAuthCookie(idToken: string): string {
	const isProd = import.meta.env.PROD;
	const secure = isProd ? '; Secure' : '';
	return `${SESSION_COOKIE}=${encodeURIComponent(idToken)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function clearAuthCookie(): string {
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
