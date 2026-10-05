import { redirect } from '@sveltejs/kit';

// Use in every protected load function and form action.
// Returns the logged-in user, or sends the visitor to the login page.
export function requireUser(locals: App.Locals) {
	if (!locals.user) {
		redirect(303, '/login');
	}
	return locals.user;
}
