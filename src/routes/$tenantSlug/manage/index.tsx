import { createFileRoute, Link } from "@tanstack/react-router";
import { useTenant } from "@/lib/tenant-context";
import { prisma } from "@/db";
import { Users, Calendar, ClipboardList, Settings } from "lucide-react";

export const Route = createFileRoute("/$tenantSlug/manage/")({
	component: ManageDashboard,
	loader: async ({ params }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: params.tenantSlug },
		});

		if (!tenant) {
			return {
				opportunities: [],
				membersTotal: 0,
				pendingApplicationsCount: 0,
			};
		}

		const [opportunities, membersTotal, pendingApplications] = await Promise.all([
			prisma.opportunity.findMany({
				where: { tenantId: tenant.id },
				orderBy: { createdAt: "desc" },
				take: 100,
				include: {
					_count: {
						select: {
							signups: {
								where: {
									status: { in: ["APPLIED", "APPROVED"] },
								},
							},
						},
					},
				},
			}),
			prisma.tenantMember.count({
				where: {
					tenantId: tenant.id,
					status: "ACTIVE",
				},
			}),
			prisma.opportunitySignup.count({
				where: {
					status: "APPLIED",
					opportunity: {
						tenantId: tenant.id,
					},
				},
			}),
		]);

		return {
			opportunities,
			membersTotal,
			pendingApplicationsCount: pendingApplications,
		};
	},
});

function ManageDashboard() {
	const { tenant, t, isCoordinator, isAdmin } = useTenant();
	const { opportunities, membersTotal, pendingApplicationsCount } =
		Route.useLoaderData();

	if (!isCoordinator) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
					<p className="text-gray-400">
						You need coordinator access to view this page.
					</p>
				</div>
			</div>
		);
	}

	const activeOpportunities = opportunities.filter(
		(o) => o.status === "PUBLISHED",
	).length;

	const stats = [
		{
			label: `Active ${t("opportunities")}`,
			value: activeOpportunities,
			icon: <Calendar className="w-8 h-8" />,
			href: `/${tenant.slug}/opportunities`,
		},
		{
			label: `Total ${t("volunteers")}`,
			value: membersTotal,
			icon: <Users className="w-8 h-8" />,
			href: `/${tenant.slug}/manage/members`,
		},
		{
			label: "Pending Applications",
			value: pendingApplicationsCount,
			icon: <ClipboardList className="w-8 h-8" />,
			href: `/${tenant.slug}/manage/applications`,
			highlight: pendingApplicationsCount > 0,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<div className="max-w-6xl mx-auto px-6 py-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-white">Dashboard</h1>
					{isAdmin && (
						<Link
							to="/$tenantSlug/settings"
							params={{ tenantSlug: tenant.slug }}
							className="flex items-center gap-2 px-4 py-2 border border-slate-600 hover:border-slate-500 text-gray-300 rounded-lg transition-colors"
						>
							<Settings className="w-4 h-4" />
							Settings
						</Link>
					)}
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					{stats.map((stat) => (
						<Link
							key={stat.label}
							to={stat.href}
							className={`bg-slate-800/50 border rounded-xl p-6 transition-all hover:border-cyan-500/50 ${
								stat.highlight
									? "border-yellow-500/50"
									: "border-slate-700"
							}`}
						>
							<div className="flex items-center justify-between mb-4">
								<span className="text-gray-400">{stat.icon}</span>
								{stat.highlight && (
									<span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded">
										Action needed
									</span>
								)}
							</div>
							<p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
							<p className="text-gray-400">{stat.label}</p>
						</Link>
					))}
				</div>

				{/* Quick Actions */}
				<section className="mb-8">
					<h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
					<div className="flex flex-wrap gap-4">
						<Link
							to="/$tenantSlug/opportunities/new"
							params={{ tenantSlug: tenant.slug }}
							className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
						>
							Create {t("opportunity")}
						</Link>
						<Link
							to="/$tenantSlug/manage/applications"
							params={{ tenantSlug: tenant.slug }}
							className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-gray-300 font-medium rounded-lg transition-colors"
						>
							Review Applications
						</Link>
						{isAdmin && (
							<Link
								to="/$tenantSlug/manage/members"
								params={{ tenantSlug: tenant.slug }}
								className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-gray-300 font-medium rounded-lg transition-colors"
							>
								Manage {t("volunteers")}
							</Link>
						)}
					</div>
				</section>

				{/* Recent Opportunities */}
				<section>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold text-white">
							Recent {t("opportunities")}
						</h2>
						<Link
							to="/$tenantSlug/opportunities"
							params={{ tenantSlug: tenant.slug }}
							className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
						>
							View all
						</Link>
					</div>
					<div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
						{opportunities.slice(0, 5).map((opp, i) => (
							<Link
								key={opp.id}
								to="/$tenantSlug/opportunities/$opportunityId"
								params={{ tenantSlug: tenant.slug, opportunityId: opp.id }}
								className={`flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors ${
									i !== 0 ? "border-t border-slate-700" : ""
								}`}
							>
								<div>
									<h3 className="text-white font-medium">{opp.title}</h3>
									<p className="text-sm text-gray-400">
										{new Date(opp.startDate).toLocaleDateString()} •{" "}
										{opp._count?.signups ?? 0} signups
									</p>
								</div>
								<span
									className={`px-2 py-1 text-xs font-medium rounded ${
										opp.status === "PUBLISHED"
											? "bg-green-500/20 text-green-400"
											: opp.status === "DRAFT"
												? "bg-gray-500/20 text-gray-400"
												: "bg-red-500/20 text-red-400"
									}`}
								>
									{opp.status}
								</span>
							</Link>
						))}
						{opportunities.length === 0 && (
							<div className="p-8 text-center text-gray-400">
								No {t("opportunities").toLowerCase()} yet.{" "}
								<Link
									to="/$tenantSlug/opportunities/new"
									params={{ tenantSlug: tenant.slug }}
									className="text-cyan-400 hover:text-cyan-300"
								>
									Create one
								</Link>
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
