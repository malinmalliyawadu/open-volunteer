import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ArrowRight } from "lucide-react";
import { getAllTenants } from "@/server/loaders";

export const Route = createFileRoute("/")({
	component: LandingPage,
	loader: async () => {
		const tenants = await getAllTenants();
		return { tenants };
	},
});

function LandingPage() {
	const { tenants } = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Hero */}
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
				<div className="relative max-w-4xl mx-auto">
					<h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
						Open Volunteer
					</h1>
					<p className="text-xl md:text-2xl text-gray-300 mb-4">
						Connect with organizations making a difference
					</p>
					<p className="text-gray-400 max-w-2xl mx-auto">
						Find volunteer opportunities that match your skills and interests.
						Join organizations in your community and track your impact.
					</p>
				</div>
			</section>

			{/* Organizations */}
			<section className="py-16 px-6 max-w-6xl mx-auto">
				<h2 className="text-2xl font-semibold text-white mb-8 text-center">
					Organizations
				</h2>

				{!tenants || tenants.length === 0 ? (
					<div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
						<Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
						<p className="text-gray-400 text-lg mb-2">No organizations yet.</p>
						<p className="text-gray-500 text-sm">
							Be the first to create an organization!
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{tenants.map((tenant) => (
							<Link
								key={tenant.id}
								to="/$tenantSlug"
								params={{ tenantSlug: tenant.slug }}
								className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
							>
								<div className="flex items-start gap-4 mb-4">
									{tenant.logo ? (
										<img
											src={tenant.logo}
											alt=""
											className="w-16 h-16 rounded-lg object-cover"
										/>
									) : (
										<div
											className="w-16 h-16 rounded-lg flex items-center justify-center"
											style={{ backgroundColor: tenant.primaryColor }}
										>
											<span className="text-2xl font-bold text-white">
												{tenant.name.charAt(0)}
											</span>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<h3 className="text-lg font-semibold text-white truncate">
											{tenant.name}
										</h3>
										<p className="text-sm text-gray-400">/{tenant.slug}</p>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-400">
										View opportunities
									</span>
									<ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
								</div>
							</Link>
						))}
					</div>
				)}
			</section>

			{/* Features */}
			<section className="py-16 px-6 max-w-6xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="text-center">
						<div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
							<Users className="w-6 h-6 text-cyan-400" />
						</div>
						<h3 className="text-lg font-semibold text-white mb-2">
							Find Opportunities
						</h3>
						<p className="text-gray-400 text-sm">
							Browse events, shifts, and projects that match your skills and
							availability.
						</p>
					</div>
					<div className="text-center">
						<div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-6 h-6 text-cyan-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-white mb-2">
							Easy Sign Up
						</h3>
						<p className="text-gray-400 text-sm">
							Apply to opportunities with one click and track your applications
							in one place.
						</p>
					</div>
					<div className="text-center">
						<div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-6 h-6 text-cyan-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-white mb-2">
							Track Impact
						</h3>
						<p className="text-gray-400 text-sm">
							Log your volunteer hours and see the difference you're making in
							your community.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
