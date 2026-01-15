import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import {
	CheckCircle,
	XCircle,
	Clock,
	ArrowLeft,
	User,
	Calendar,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$tenantSlug/manage/applications")({
	component: ApplicationsPage,
});

function ApplicationsPage() {
	const { tenant, isCoordinator } = useTenant();
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState<"APPLIED" | "APPROVED" | "all">("APPLIED");

	// Get all opportunities for this tenant
	const { data: opportunitiesData } = useQuery(
		orpc.listOpportunities.queryOptions({
			input: {
				tenantId: tenant.id,
				limit: 100,
			},
		}),
	);

	const opportunityIds =
		opportunitiesData?.opportunities.map((o) => o.id) ?? [];

	// Get applications - we'll filter client-side
	const { data: applicationsData, isLoading } = useQuery({
		...orpc.listSignups.queryOptions({
			input: {
				status: filter === "all" ? undefined : filter,
				limit: 100,
			},
		}),
		enabled: opportunityIds.length > 0,
	});

	// Filter to only this tenant's opportunities
	const applications =
		applicationsData?.signups.filter((s) =>
			opportunityIds.includes(s.opportunityId),
		) ?? [];

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
			queryClient.invalidateQueries({ queryKey: ["listSignups"] });
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
							<button
								key={f}
								type="button"
								onClick={() => setFilter(f)}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									filter === f
										? "bg-cyan-500 text-white"
										: "bg-slate-800 text-gray-300 hover:bg-slate-700"
								}`}
							>
								{f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
							</button>
						))}
					</div>
				</div>

				{isLoading ? (
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="bg-slate-800/50 rounded-xl p-6 animate-pulse"
							>
								<div className="h-6 bg-slate-700 rounded w-3/4 mb-4" />
								<div className="h-4 bg-slate-700 rounded w-1/2" />
							</div>
						))}
					</div>
				) : applications.length === 0 ? (
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
		user?: {
			id: string;
			name: string | null;
			email: string;
			avatarUrl: string | null;
		} | null;
		opportunity?: {
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
