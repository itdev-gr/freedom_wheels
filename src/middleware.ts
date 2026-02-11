import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async ({ request, redirect }, next) => {
	const url = new URL(request.url);
	const host = request.headers.get('host') || '';

	const isAdminSubdomain =
		host === 'admin.itdevtesting.com' ||
		host.startsWith('admin.itdevtesting.com:') ||
		host.startsWith('localhost');

	if (isAdminSubdomain && (url.pathname === '/' || url.pathname === '')) {
		return redirect('/admin');
	}

	return next();
};
