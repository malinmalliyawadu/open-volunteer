import { createFileRoute, Link } from "@tanstack/react-router";
import { useTenant } from "@/lib/tenant-context";
import { getTenantHomeData } from "@/server/loaders";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/$tenantSlug/")({
	component: TenantHome,
	loader: async ({ params }) => {
		return await getTenantHomeData({ data: params.tenantSlug });
	},
});

function TenantHome() {
	const { tenant, t, isCoordinator } = useTenant();
	const { opportunities, hasMore } = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Hero */}
			<section className="relative py-16 px-6 text-center">
				<div className="max-w-4xl mx-auto">
					{tenant.logo && (
						<img
							src={tenant.logo}
							alt={tenant.name}
							className="w-20 h-20 mx-auto mb-4 rounded-lg"
						/>
					)}
					<h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
						{tenant.name}
					</h1>
					<p className="text-xl text-gray-300">
						Find {t("opportunities").toLowerCase()} to make a difference
					</p>
				</div>
			</section>

			{/* Opportunities */}
			<section className="py-8 px-6 max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-semibold text-white">
						Upcoming {t("opportunities")}
					</h2>
					{isCoordinator && (
						<Link
							to="/$tenantSlug/opportunities/new"
							params={{ tenantSlug: tenant.slug }}
							className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
						>
							Create {t("opportunity")}
						</Link>
					)}
				</div>

				{opportunities.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-400 text-lg">
							No {t("opportunities").toLowerCase()} available right now.
						</p>
						{isCoordinator && (
							<Link
								to="/$tenantSlug/opportunities/new"
								params={{ tenantSlug: tenant.slug }}
								className="inline-block mt-4 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
							>
								Create your first {t("opportunity").toLowerCase()}
							</Link>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{opportunities.map((opp) => (
							<OpportunityCard key={opp.id} opportunity={opp} />
						))}
					</div>
				)}

				{hasMore && (
					<div className="text-center mt-8">
						<Link
							to="/$tenantSlug/opportunities"
							params={{ tenantSlug: tenant.slug }}
							className="px-6 py-3 border border-slate-600 hover:border-cyan-500 text-white font-medium rounded-lg transition-colors"
						>
							View all {t("opportunities").toLowerCase()}
						</Link>
					</div>
				)}
			</section>
		</div>
	);
}

interface OpportunityCardProps {
	opportunity: {
		id: string;
		title: string;
		description: string;
		type: string;
		location: string | null;
		isVirtual: boolean;
		startDate: Date;
		endDate: Date | null;
		capacity: number;
		spotsRemaining: number;
		_count?: { signups: number };
	};
}

function OpportunityCard({ opportunity }: OpportunityCardProps) {
	const { tenant, t } = useTenant();
	const startDate = new Date(opportunity.startDate);

	return (
		<Link
			to="/$tenantSlug/opportunities/$opportunityId"
			params={{ tenantSlug: tenant.slug, opportunityId: opportunity.id }}
			className="block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
		>
			<div className="flex items-start justify-between mb-3">
				<span className="px-2 py-1 text-xs font-medium bg-slate-700 text-gray-300 rounded">
					{opportunity.type}
				</span>
				{opportunity.capacity > 0 && (
					<span className="text-sm text-gray-400">
						{opportunity.spotsRemaining} spots left
					</span>
				)}
			</div>

			<h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
				{opportunity.title}
			</h3>

			<p className="text-gray-400 text-sm mb-4 line-clamp-2">
				{opportunity.description}
			</p>

			<div className="space-y-2 text-sm text-gray-400">
				<div className="flex items-center gap-2">
					<Calendar className="w-4 h-4" />
					<span>
						{startDate.toLocaleDateString(undefined, {
							weekday: "short",
							month: "short",
							day: "numeric",
						})}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<Clock className="w-4 h-4" />
					<span>
						{startDate.toLocaleTimeString(undefined, {
							hour: "numeric",
							minute: "2-digit",
						})}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<MapPin className="w-4 h-4" />
					<span>
						{opportunity.isVirtual ? "Virtual" : opportunity.location || "TBD"}
					</span>
				</div>

				{opportunity._count && (
					<div className="flex items-center gap-2">
						<Users className="w-4 h-4" />
						<span>
							{opportunity._count.signups} {t("volunteers").toLowerCase()} signed
							up
						</span>
					</div>
				)}
			</div>
		</Link>
	);
}
