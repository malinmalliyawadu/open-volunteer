import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import {
	Calendar,
	MapPin,
	Clock,
	CheckCircle,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/$tenantSlug/my-signups")({
	component: MySignups,
});

interface SignupData {
	id: string;
	status: string;
	opportunity: {
		id: string;
		title: string;
		startDate: Date;
		endDate: Date | null;
		location: string | null;
		isVirtual: boolean;
		tenantId: string;
		tenant: { slug: string };
	};
}

function MySignups() {
	const { tenant, t, membership } = useTenant();
	const { user: clerkUser, isSignedIn } = useUser();
	const queryClient = useQueryClient();
	const [dbUser, setDbUser] = useState<{ id: string } | null>(null);
	const [signups, setSignups] = useState<SignupData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch user and signups client-side (Clerk auth only available on client)
	useEffect(() => {
		async function fetchData() {
			if (!isSignedIn || !clerkUser?.id) {
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			try {
				const user = await client.getUser({ clerkId: clerkUser.id });
				if (user) {
					setDbUser(user);
					const data = await client.getMySignups({
						userId: user.id,
						limit: 50,
					});
					// Filter by tenant
					const filtered = data.signups.filter(
						(s) => s.opportunity.tenantId === tenant.id,
					);
					setSignups(filtered);
				}
			} catch (e) {
				// User might not exist yet
			}
			setIsLoading(false);
		}

		fetchData();
	}, [isSignedIn, clerkUser?.id, tenant.id]);

	// Withdraw mutation
	const withdrawMutation = useMutation({
		mutationFn: (signupId: string) => client.withdrawApplication({ signupId }),
		onSuccess: (_, signupId) => {
			setSignups((prev) => prev.filter((s) => s.id !== signupId));
			queryClient.invalidateQueries();
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
					<div className="flex justify-center py-16">
						<Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
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
	signup: SignupData;
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
