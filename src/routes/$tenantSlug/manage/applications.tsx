import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import { prisma } from "@/db";
import { useTenant } from "@/lib/tenant-context";
import {
	CheckCircle,
	XCircle,
	Clock,
	ArrowLeft,
	User,
	Calendar,
} from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
	status: z.enum(["APPLIED", "APPROVED", "all"]).default("APPLIED"),
});

export const Route = createFileRoute("/$tenantSlug/manage/applications")({
	component: ApplicationsPage,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ params, deps }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: params.tenantSlug },
		});

		if (!tenant) {
			return { applications: [] };
		}

		const statusFilter = deps.search.status === "all" ? undefined : deps.search.status;

		const applications = await prisma.opportunitySignup.findMany({
			where: {
				...(statusFilter ? { status: statusFilter } : {}),
				opportunity: {
					tenantId: tenant.id,
				},
			},
			orderBy: { appliedAt: "desc" },
			take: 100,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
					},
				},
				opportunity: {
					select: {
						id: true,
						title: true,
						startDate: true,
					},
				},
			},
		});

		return { applications };
	},
});

function ApplicationsPage() {
	const { tenant, isCoordinator } = useTenant();
	const search = useSearch({ from: "/$tenantSlug/manage/applications" });
	const { applications } = Route.useLoaderData();
	const queryClient = useQueryClient();

	// Update signup mutation
	const updateMutation = useMutation({
		mutationFn: ({
			signupId,
			status,
		}: {
			signupId: string;
			status: "APPROVED" | "DECLINED" | "WAITLISTED";
		}) => client.updateSignup({ signupId, status }),
		onSuccess: () => {
			queryClient.invalidateQueries();
			// Force reload to refresh loader data
			window.location.reload();
		},
	});

	if (!isCoordinator) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
					<p className="text-gray-400">
						You need coordinator access to view applications.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<div className="max-w-4xl mx-auto px-6 py-8">
				<Link
					to="/$tenantSlug/manage"
					params={{ tenantSlug: tenant.slug }}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Dashboard
				</Link>

				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-white">Applications</h1>
					<div className="flex gap-2">
						{(["APPLIED", "APPROVED", "all"] as const).map((f) => (
							<Link
								key={f}
								to="/$tenantSlug/manage/applications"
								params={{ tenantSlug: tenant.slug }}
								search={{ status: f }}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									search.status === f
										? "bg-cyan-500 text-white"
										: "bg-slate-800 text-gray-300 hover:bg-slate-700"
								}`}
							>
								{f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
							</Link>
						))}
					</div>
				</div>

				{applications.length === 0 ? (
					<div className="text-center py-16 bg-slate-800/50 border border-slate-700 rounded-xl">
						<Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
						<p className="text-gray-400 text-lg">No applications to review.</p>
					</div>
				) : (
					<div className="space-y-4">
						{applications.map((app) => (
							<ApplicationCard
								key={app.id}
								application={app}
								onApprove={() =>
									updateMutation.mutate({
										signupId: app.id,
										status: "APPROVED",
									})
								}
								onDecline={() =>
									updateMutation.mutate({
										signupId: app.id,
										status: "DECLINED",
									})
								}
								onWaitlist={() =>
									updateMutation.mutate({
										signupId: app.id,
										status: "WAITLISTED",
									})
								}
								isUpdating={updateMutation.isPending}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

interface ApplicationCardProps {
	application: {
		id: string;
		status: string;
		appliedAt: Date;
		notes: string | null;
		user: {
			id: string;
			name: string | null;
			email: string;
			avatarUrl: string | null;
		} | null;
		opportunity: {
			id: string;
			title: string;
			startDate: Date;
		} | null;
	};
	onApprove: () => void;
	onDecline: () => void;
	onWaitlist: () => void;
	isUpdating: boolean;
}

function ApplicationCard({
	application,
	onApprove,
	onDecline,
	onWaitlist,
	isUpdating,
}: ApplicationCardProps) {
	const { tenant } = useTenant();
	const appliedAt = new Date(application.appliedAt);

	const statusColors: Record<string, string> = {
		APPLIED: "bg-yellow-500/20 text-yellow-400",
		APPROVED: "bg-green-500/20 text-green-400",
		WAITLISTED: "bg-orange-500/20 text-orange-400",
		DECLINED: "bg-red-500/20 text-red-400",
	};

	return (
		<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					{application.user?.avatarUrl ? (
						<img
							src={application.user.avatarUrl}
							alt=""
							className="w-10 h-10 rounded-full"
						/>
					) : (
						<div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
							<User className="w-5 h-5 text-gray-400" />
						</div>
					)}
					<div>
						<p className="text-white font-medium">
							{application.user?.name || application.user?.email || "Unknown"}
						</p>
						<p className="text-sm text-gray-400">{application.user?.email}</p>
					</div>
				</div>
				<span
					className={`px-3 py-1 text-sm font-medium rounded ${statusColors[application.status] || statusColors.APPLIED}`}
				>
					{application.status}
				</span>
			</div>

			<Link
				to="/$tenantSlug/opportunities/$opportunityId"
				params={{
					tenantSlug: tenant.slug,
					opportunityId: application.opportunity?.id ?? "",
				}}
				className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
			>
				{application.opportunity?.title}
			</Link>

			<div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
				<span className="flex items-center gap-1">
					<Calendar className="w-4 h-4" />
					{application.opportunity &&
						new Date(application.opportunity.startDate).toLocaleDateString()}
				</span>
				<span>Applied {appliedAt.toLocaleDateString()}</span>
			</div>

			{application.notes && (
				<div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
					<p className="text-sm text-gray-300">{application.notes}</p>
				</div>
			)}

			{application.status === "APPLIED" && (
				<div className="flex gap-3 mt-4">
					<button
						type="button"
						onClick={onApprove}
						disabled={isUpdating}
						className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-lg transition-colors disabled:opacity-50"
					>
						<CheckCircle className="w-4 h-4" />
						Approve
					</button>
					<button
						type="button"
						onClick={onWaitlist}
						disabled={isUpdating}
						className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium rounded-lg transition-colors disabled:opacity-50"
					>
						<Clock className="w-4 h-4" />
						Waitlist
					</button>
					<button
						type="button"
						onClick={onDecline}
						disabled={isUpdating}
						className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
					>
						<XCircle className="w-4 h-4" />
						Decline
					</button>
				</div>
			)}
		</div>
	);
}
