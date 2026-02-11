import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async ({ request, redirect }, next) => {
	const url = new URL(request.url);
	const host = request.headers.get('host') || '';
	const forwardedHost = request.headers.get('x-forwarded-host') || '';

	const isAdminSubdomain =
		host.includes('admin.itdevtesting.com') ||
		forwardedHost.includes('admin.itdevtesting.com') ||
		host.startsWith('localhost');

	if (isAdminSubdomain && (url.pathname === '/' || url.pathname === '')) {
		return redirect('/admin');
	}

	return next();
};
