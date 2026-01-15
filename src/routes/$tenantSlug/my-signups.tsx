import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { orpc, client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import {
	Calendar,
	MapPin,
	Clock,
	CheckCircle,
	AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/$tenantSlug/my-signups")({
	component: MySignups,
});

function MySignups() {
	const { tenant, t, membership } = useTenant();
	const { user: clerkUser, isSignedIn } = useUser();
	const queryClient = useQueryClient();

	// Load current user from our DB
	const { data: dbUser } = useQuery({
		...orpc.getUser.queryOptions({
			input: { clerkId: clerkUser?.id ?? "" },
		}),
		enabled: isSignedIn && !!clerkUser?.id,
	});

	// Load signups
	const { data, isLoading } = useQuery({
		...orpc.getMySignups.queryOptions({
			input: {
				userId: dbUser?.id ?? "",
				limit: 50,
			},
		}),
		enabled: !!dbUser?.id,
	});

	// Filter by tenant
	const signups =
		data?.signups.filter((s) => s.opportunity.tenantId === tenant.id) ?? [];

	// Withdraw mutation
	const withdrawMutation = useMutation({
		mutationFn: (signupId: string) => client.withdrawApplication({ signupId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["getMySignups"] });
		},
	});

	if (!isSignedIn) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
					<p className="text-gray-400">
						Please sign in to view your {t("signups").toLowerCase()}.
					</p>
				</div>
			</div>
		);
	}

	if (!membership) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">
						Join {tenant.name}
					</h1>
					<p className="text-gray-400 mb-4">
						You need to join this organization to sign up for{" "}
						{t("opportunities").toLowerCase()}.
					</p>
					<Link
						to="/$tenantSlug"
						params={{ tenantSlug: tenant.slug }}
						className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
					>
						Browse {t("opportunities")}
					</Link>
				</div>
			</div>
		);
	}

	// Group signups by status
	const upcoming = signups.filter(
		(s) =>
			(s.status === "APPROVED" || s.status === "APPLIED") &&
			new Date(s.opportunity.startDate) >= new Date(),
	);
	const past = signups.filter(
		(s) =>
			s.status === "COMPLETED" ||
			(s.status === "APPROVED" && new Date(s.opportunity.startDate) < new Date()),
	);
	const pending = signups.filter(
		(s) => s.status === "APPLIED" || s.status === "WAITLISTED",
	);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<div className="max-w-4xl mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold text-white mb-8">
					My {t("signups")}
				</h1>

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
				) : signups.length === 0 ? (
					<div className="text-center py-16">
						<p className="text-gray-400 text-lg mb-4">
							You haven't signed up for any {t("opportunities").toLowerCase()} yet.
						</p>
						<Link
							to="/$tenantSlug/opportunities"
							params={{ tenantSlug: tenant.slug }}
							className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
						>
							Browse {t("opportunities")}
						</Link>
					</div>
				) : (
					<div className="space-y-8">
						{/* Pending */}
						{pending.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
									<AlertCircle className="w-5 h-5 text-yellow-400" />
									Pending Approval ({pending.length})
								</h2>
								<div className="space-y-4">
									{pending.map((signup) => (
										<SignupCard
											key={signup.id}
											signup={signup}
											onWithdraw={() => withdrawMutation.mutate(signup.id)}
											isWithdrawing={withdrawMutation.isPending}
										/>
									))}
								</div>
							</section>
						)}

						{/* Upcoming */}
						{upcoming.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
									<CheckCircle className="w-5 h-5 text-green-400" />
									Upcoming ({upcoming.length})
								</h2>
								<div className="space-y-4">
									{upcoming.map((signup) => (
										<SignupCard
											key={signup.id}
											signup={signup}
											onWithdraw={() => withdrawMutation.mutate(signup.id)}
											isWithdrawing={withdrawMutation.isPending}
										/>
									))}
								</div>
							</section>
						)}

						{/* Past */}
						{past.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
									<Clock className="w-5 h-5 text-gray-400" />
									Past ({past.length})
								</h2>
								<div className="space-y-4">
									{past.map((signup) => (
										<SignupCard key={signup.id} signup={signup} isPast />
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

interface SignupCardProps {
	signup: {
		id: string;
		status: string;
		opportunity: {
			id: string;
			title: string;
			startDate: Date;
			endDate: Date | null;
			location: string | null;
			isVirtual: boolean;
			tenant: { slug: string };
		};
	};
	onWithdraw?: () => void;
	isWithdrawing?: boolean;
	isPast?: boolean;
}

function SignupCard({
	signup,
	onWithdraw,
	isWithdrawing,
	isPast,
}: SignupCardProps) {
	const startDate = new Date(signup.opportunity.startDate);

	const statusColors: Record<string, string> = {
		APPLIED: "bg-yellow-500/20 text-yellow-400",
		APPROVED: "bg-green-500/20 text-green-400",
		WAITLISTED: "bg-orange-500/20 text-orange-400",
		COMPLETED: "bg-blue-500/20 text-blue-400",
		DECLINED: "bg-red-500/20 text-red-400",
	};

	return (
		<div
			className={`bg-slate-800/50 border border-slate-700 rounded-xl p-6 ${isPast ? "opacity-75" : ""}`}
		>
			<div className="flex items-start justify-between mb-4">
				<Link
					to="/$tenantSlug/opportunities/$opportunityId"
					params={{
						tenantSlug: signup.opportunity.tenant.slug,
						opportunityId: signup.opportunity.id,
					}}
					className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors"
				>
					{signup.opportunity.title}
				</Link>
				<span
					className={`px-3 py-1 text-sm font-medium rounded ${statusColors[signup.status] || statusColors.APPLIED}`}
				>
					{signup.status}
				</span>
			</div>

			<div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
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
						{signup.opportunity.isVirtual
							? "Virtual"
							: signup.opportunity.location || "TBD"}
					</span>
				</div>
			</div>

			{!isPast &&
				onWithdraw &&
				(signup.status === "APPLIED" ||
					signup.status === "APPROVED" ||
					signup.status === "WAITLISTED") && (
					<button
						type="button"
						onClick={onWithdraw}
						disabled={isWithdrawing}
						className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
					>
						{isWithdrawing ? "Withdrawing..." : "Withdraw application"}
					</button>
				)}
		</div>
	);
}
