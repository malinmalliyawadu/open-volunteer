import { Link, useParams, useMatchRoute } from "@tanstack/react-router";
import {
	SignedIn,
	SignInButton,
	SignedOut,
	UserButton,
} from "@clerk/clerk-react";

export default function Header() {
	const params = useParams({ strict: false });
	const tenantSlug = params.tenantSlug as string | undefined;
	const matchRoute = useMatchRoute();
	const isTenantRoute = !!tenantSlug && matchRoute({ to: "/$tenantSlug", fuzzy: true });

	// Don't render the root header on tenant routes - the tenant layout has its own
	if (isTenantRoute) {
		return null;
	}

	return (
		<header className="bg-slate-900 border-b border-slate-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6">
				<div className="flex items-center justify-between h-16">
					<Link to="/" className="flex items-center gap-2">
						<span className="text-xl font-bold text-white">Open Volunteer</span>
					</Link>

					<div className="flex items-center gap-4">
						<SignedOut>
							<SignInButton mode="modal">
								<button
									type="button"
									className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
								>
									Sign In
								</button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<UserButton
								appearance={{
									elements: {
										avatarBox: "w-9 h-9",
									},
								}}
							/>
						</SignedIn>
					</div>
				</div>
			</div>
		</header>
	);
}
