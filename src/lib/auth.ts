import { getAdminAuth } from './firebase';

const SESSION_COOKIE = 'fw_session';

export function getSessionToken(request: Request): string | null {
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
	return match ? decodeURIComponent(match[1].trim()) : null;
}

export async function verifySession(
	request: Request
): Promise<{ uid: string; email: string | null } | null> {
	const token = getSessionToken(request);
	if (!token) return null;
	const auth = getAdminAuth();
	if (!auth) return null;
	try {
		const decoded = await auth.verifyIdToken(token);
		return { uid: decoded.uid, email: decoded.email ?? null };
	} catch {
		return null;
	}
}

export function setSessionCookieHeader(token: string, maxAgeSeconds = 60 * 60 * 24 * 5): string {
	return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader(): string {
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
