const SESSION_COOKIE = 'admin_session';
const SESSION_SECRET = import.meta.env.ADMIN_SESSION_SECRET || 'dev-secret-change-in-production';

function sign(value: string): string {
	const encoder = new TextEncoder();
	const key = encoder.encode(SESSION_SECRET.padEnd(32, '0').slice(0, 32));
	const data = encoder.encode(value);
	// Simple XOR sign (not cryptographically strong; use HMAC in production)
	let out = '';
	for (let i = 0; i < data.length; i++) {
		out += String.fromCharCode(data[i]! ^ (key[i % 32] ?? 0));
	}
	return btoa(out);
}

function unsign(signed: string): string | null {
	try {
		const decoder = new TextDecoder();
		const key = new TextEncoder().encode(SESSION_SECRET.padEnd(32, '0').slice(0, 32));
		const raw = atob(signed);
		const data = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i++) {
			data[i] = raw.charCodeAt(i) ^ (key[i % 32] ?? 0);
		}
		return decoder.decode(data);
	} catch {
		return null;
	}
}

export function getSessionCookie(request: Request): string | null {
	try {
		const cookieHeader = request.headers.get('cookie');
		if (!cookieHeader) return null;
		const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
		if (!match) return null;
		const value = decodeURIComponent(match[1].trim());
		const decoded = unsign(value);
		return decoded === 'ok' ? 'ok' : null;
	} catch {
		return null;
	}
}

export function isAdminAuthenticated(request: Request): boolean {
	return getSessionCookie(request) === 'ok';
}

export function createSessionCookie(): string {
	const value = sign('ok');
	return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
