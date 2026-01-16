import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useTenant } from "@/lib/tenant-context";
import { getOpportunitiesByTenant } from "@/server/loaders";
import { Calendar, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
	type: z.enum(["EVENT", "SHIFT", "PROJECT"]).optional(),
	search: z.string().optional(),
	page: z.number().default(1),
});

export const Route = createFileRoute("/$tenantSlug/opportunities/")({
	component: OpportunitiesPage,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ params, deps }) => {
		return await getOpportunitiesByTenant({
			data: {
				tenantSlug: params.tenantSlug,
				type: deps.search.type,
				search: deps.search.search,
				page: deps.search.page,
			},
		});
	},
});

function OpportunitiesPage() {
	const { tenant, t, isCoordinator } = useTenant();
	const search = useSearch({ from: "/$tenantSlug/opportunities/" });
	const { opportunities, total } = Route.useLoaderData();
	const [searchInput, setSearchInput] = useState(search.search ?? "");

	const limit = 12;
	const totalPages = Math.ceil(total / limit);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
					<h1 className="text-3xl font-bold text-white">
						{t("opportunities")}
					</h1>
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

				{/* Filters */}
				<div className="flex flex-col md:flex-row gap-4 mb-8">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder={`Search ${t("opportunities").toLowerCase()}...`}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									window.location.search = `?search=${encodeURIComponent(searchInput)}`;
								}
							}}
							className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
						/>
					</div>

					<div className="flex gap-2">
						<Link
							to="/$tenantSlug/opportunities"
							params={{ tenantSlug: tenant.slug }}
							search={{ type: undefined }}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								!search.type
									? "bg-cyan-500 text-white"
									: "bg-slate-800 text-gray-300 hover:bg-slate-700"
							}`}
						>
							All
						</Link>
						{(["EVENT", "SHIFT", "PROJECT"] as const).map((type) => (
							<Link
								key={type}
								to="/$tenantSlug/opportunities"
								params={{ tenantSlug: tenant.slug }}
								search={{ type }}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									search.type === type
										? "bg-cyan-500 text-white"
										: "bg-slate-800 text-gray-300 hover:bg-slate-700"
								}`}
							>
								{type.charAt(0) + type.slice(1).toLowerCase()}s
							</Link>
						))}
					</div>
				</div>

				{/* Results */}
				{opportunities.length === 0 ? (
					<div className="text-center py-16">
						<p className="text-gray-400 text-lg">
							No {t("opportunities").toLowerCase()} found.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{opportunities.map((opp) => (
								<OpportunityCard key={opp.id} opportunity={opp} />
							))}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex justify-center gap-2 mt-8">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => (
										<Link
											key={page}
											to="/$tenantSlug/opportunities"
											params={{ tenantSlug: tenant.slug }}
											search={{ ...search, page }}
											className={`px-4 py-2 rounded-lg font-medium transition-colors ${
												search.page === page || (!search.page && page === 1)
													? "bg-cyan-500 text-white"
													: "bg-slate-800 text-gray-300 hover:bg-slate-700"
											}`}
										>
											{page}
										</Link>
									),
								)}
							</div>
						)}
					</>
				)}
			</div>
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
		capacity: number;
		spotsRemaining: number;
		_count?: { signups: number };
	};
}

function OpportunityCard({ opportunity }: OpportunityCardProps) {
	const { tenant } = useTenant();
	const startDate = new Date(opportunity.startDate);

	return (
		<Link
			to="/$tenantSlug/opportunities/$opportunityId"
			params={{ tenantSlug: tenant.slug, opportunityId: opportunity.id }}
			className="block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
		>
			<div className="flex items-start justify-between mb-3">
				<span className="px-2 py-1 text-xs font-medium bg-slate-700 text-gray-300 rounded">
					{opportunity.type}
				</span>
				{opportunity.capacity > 0 && (
					<span className="text-sm text-gray-400">
						{opportunity.spotsRemaining} spots
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
					<MapPin className="w-4 h-4" />
					<span>
						{opportunity.isVirtual ? "Virtual" : opportunity.location || "TBD"}
					</span>
				</div>
			</div>
		</Link>
	);
}
