import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import { prisma } from "@/db";
import {
	Calendar,
	MapPin,
	Users,
	Clock,
	ArrowLeft,
	CheckCircle,
	XCircle,
	Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute(
	"/$tenantSlug/opportunities/$opportunityId",
)({
	component: OpportunityDetail,
	loader: async ({ params }) => {
		const opportunity = await prisma.opportunity.findUnique({
			where: { id: params.opportunityId },
			include: {
				tenant: true,
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
		});

		return { opportunity };
	},
});

function OpportunityDetail() {
	const { opportunity } = Route.useLoaderData();
	const { tenant, t, membership } = useTenant();
	const { user: clerkUser, isSignedIn } = useUser();
	const queryClient = useQueryClient();
	const [notes, setNotes] = useState("");
	const [dbUser, setDbUser] = useState<{ id: string } | null>(null);
	const [existingSignup, setExistingSignup] = useState<{
		id: string;
		status: string;
	} | null>(null);
	const [loadingSignup, setLoadingSignup] = useState(false);

	// Fetch user and signup status client-side
	useEffect(() => {
		async function fetchUserData() {
			if (!isSignedIn || !clerkUser?.id || !opportunity) return;

			setLoadingSignup(true);
			try {
				const user = await client.getUser({ clerkId: clerkUser.id });
				if (user) {
					setDbUser(user);
					const signup = await client.getSignup({
						opportunityId: opportunity.id,
						userId: user.id,
					});
					setExistingSignup(signup);
				}
			} catch (e) {
				// User might not exist yet
			}
			setLoadingSignup(false);
		}

		fetchUserData();
	}, [isSignedIn, clerkUser?.id, opportunity?.id]);

	// Apply mutation
	const applyMutation = useMutation({
		mutationFn: () =>
			client.applyToOpportunity({
				opportunityId: opportunity!.id,
				userId: dbUser!.id,
				notes: notes || undefined,
			}),
		onSuccess: (data) => {
			setExistingSignup(data);
			queryClient.invalidateQueries();
		},
	});

	// Withdraw mutation
	const withdrawMutation = useMutation({
		mutationFn: () =>
			client.withdrawApplication({ signupId: existingSignup!.id }),
		onSuccess: () => {
			setExistingSignup(null);
			queryClient.invalidateQueries();
		},
	});

	if (!opportunity) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Not Found</h1>
					<p className="text-gray-400">
						This {t("opportunity").toLowerCase()} doesn't exist.
					</p>
				</div>
			</div>
		);
	}

	const startDate = new Date(opportunity.startDate);
	const endDate = opportunity.endDate ? new Date(opportunity.endDate) : null;
	const requirements = opportunity.requirements as {
		skills?: string[];
		minAge?: number;
		backgroundCheck?: boolean;
	};

	const canApply =
		isSignedIn &&
		membership &&
		dbUser &&
		!existingSignup &&
		opportunity.status === "PUBLISHED" &&
		(opportunity.capacity === 0 || opportunity.spotsRemaining > 0);

	const hasApplied = existingSignup && existingSignup.status !== "CANCELLED";

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Back link */}
				<Link
					to="/$tenantSlug/opportunities"
					params={{ tenantSlug: tenant.slug }}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to {t("opportunities").toLowerCase()}
				</Link>

				{/* Header */}
				<div className="mb-8">
					<div className="flex items-start justify-between mb-4">
						<span className="px-3 py-1 text-sm font-medium bg-slate-700 text-gray-300 rounded">
							{opportunity.type}
						</span>
						<StatusBadge status={opportunity.status} />
					</div>

					<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
						{opportunity.title}
					</h1>

					<div className="flex flex-wrap gap-4 text-gray-400">
						<div className="flex items-center gap-2">
							<Calendar className="w-5 h-5" />
							<span>
								{startDate.toLocaleDateString(undefined, {
									weekday: "long",
									month: "long",
									day: "numeric",
									year: "numeric",
								})}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="w-5 h-5" />
							<span>
								{startDate.toLocaleTimeString(undefined, {
									hour: "numeric",
									minute: "2-digit",
								})}
								{endDate &&
									` - ${endDate.toLocaleTimeString(undefined, {
										hour: "numeric",
										minute: "2-digit",
									})}`}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="w-5 h-5" />
							<span>
								{opportunity.isVirtual
									? "Virtual"
									: opportunity.location || "Location TBD"}
							</span>
						</div>
						{opportunity.capacity > 0 && (
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5" />
								<span>
									{opportunity.spotsRemaining} of {opportunity.capacity} spots
									remaining
								</span>
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main content */}
					<div className="lg:col-span-2 space-y-8">
						<section>
							<h2 className="text-xl font-semibold text-white mb-4">
								Description
							</h2>
							<div className="prose prose-invert max-w-none">
								<p className="text-gray-300 whitespace-pre-wrap">
									{opportunity.description}
								</p>
							</div>
						</section>

						{opportunity.address && (
							<section>
								<h2 className="text-xl font-semibold text-white mb-4">
									Location Details
								</h2>
								<p className="text-gray-300">{opportunity.address}</p>
							</section>
						)}

						{(requirements.skills?.length ||
							requirements.minAge ||
							requirements.backgroundCheck) && (
							<section>
								<h2 className="text-xl font-semibold text-white mb-4">
									Requirements
								</h2>
								<ul className="space-y-2 text-gray-300">
									{requirements.minAge && (
										<li>• Minimum age: {requirements.minAge} years</li>
									)}
									{requirements.backgroundCheck && (
										<li>• Background check required</li>
									)}
									{requirements.skills?.length && (
										<li>• Skills: {requirements.skills.join(", ")}</li>
									)}
								</ul>
							</section>
						)}
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 sticky top-6">
							{loadingSignup ? (
								<div className="flex justify-center py-4">
									<Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
								</div>
							) : !isSignedIn ? (
								<div className="text-center">
									<p className="text-gray-400 mb-4">
										Sign in to apply for this {t("opportunity").toLowerCase()}
									</p>
								</div>
							) : !membership ? (
								<div className="text-center">
									<p className="text-gray-400 mb-4">
										Join {tenant.name} to apply for{" "}
										{t("opportunities").toLowerCase()}
									</p>
									<JoinButton tenantSlug={tenant.slug} userId={dbUser?.id} />
								</div>
							) : hasApplied ? (
								<div className="text-center">
									<div className="mb-4">
										<SignupStatusBadge status={existingSignup.status} />
									</div>
									<p className="text-gray-400 mb-4">
										{existingSignup.status === "APPLIED" &&
											"Your application is pending review."}
										{existingSignup.status === "APPROVED" &&
											"You're confirmed for this opportunity!"}
										{existingSignup.status === "WAITLISTED" &&
											"You're on the waitlist."}
										{existingSignup.status === "DECLINED" &&
											"Your application was not accepted."}
									</p>
									{(existingSignup.status === "APPLIED" ||
										existingSignup.status === "APPROVED" ||
										existingSignup.status === "WAITLISTED") && (
										<button
											type="button"
											onClick={() => withdrawMutation.mutate()}
											disabled={withdrawMutation.isPending}
											className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 font-medium rounded-lg transition-colors disabled:opacity-50"
										>
											{withdrawMutation.isPending
												? "Withdrawing..."
												: "Withdraw Application"}
										</button>
									)}
								</div>
							) : canApply ? (
								<div>
									<h3 className="text-lg font-semibold text-white mb-4">
										{t("apply")} Now
									</h3>
									<div className="mb-4">
										<label
											htmlFor="notes"
											className="block text-sm text-gray-400 mb-2"
										>
											Notes (optional)
										</label>
										<textarea
											id="notes"
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											placeholder="Tell us why you're interested..."
											className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
											rows={3}
										/>
									</div>
									<button
										type="button"
										onClick={() => applyMutation.mutate()}
										disabled={applyMutation.isPending}
										className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
									>
										{applyMutation.isPending ? "Submitting..." : t("apply")}
									</button>
								</div>
							) : (
								<div className="text-center">
									<p className="text-gray-400">
										{opportunity.status !== "PUBLISHED"
											? `This ${t("opportunity").toLowerCase()} is not accepting applications.`
											: `No spots remaining for this ${t("opportunity").toLowerCase()}.`}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const colors: Record<string, string> = {
		DRAFT: "bg-gray-500/20 text-gray-400",
		PUBLISHED: "bg-green-500/20 text-green-400",
		CANCELLED: "bg-red-500/20 text-red-400",
		COMPLETED: "bg-blue-500/20 text-blue-400",
	};

	return (
		<span
			className={`px-3 py-1 text-sm font-medium rounded ${colors[status] || colors.DRAFT}`}
		>
			{status}
		</span>
	);
}

function SignupStatusBadge({ status }: { status: string }) {
	const config: Record<string, { color: string; icon: React.ReactNode }> = {
		APPLIED: {
			color: "bg-yellow-500/20 text-yellow-400",
			icon: <Clock className="w-5 h-5" />,
		},
		APPROVED: {
			color: "bg-green-500/20 text-green-400",
			icon: <CheckCircle className="w-5 h-5" />,
		},
		WAITLISTED: {
			color: "bg-orange-500/20 text-orange-400",
			icon: <Clock className="w-5 h-5" />,
		},
		DECLINED: {
			color: "bg-red-500/20 text-red-400",
			icon: <XCircle className="w-5 h-5" />,
		},
	};

	const { color, icon } = config[status] || config.APPLIED;

	return (
		<span
			className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${color}`}
		>
			{icon}
			<span className="font-medium">{status}</span>
		</span>
	);
}

function JoinButton({
	tenantSlug,
	userId,
}: {
	tenantSlug: string;
	userId?: string;
}) {
	const joinMutation = useMutation({
		mutationFn: () => client.joinTenant({ tenantSlug, userId: userId! }),
		onSuccess: () => {
			window.location.reload();
		},
	});

	return (
		<button
			type="button"
			onClick={() => joinMutation.mutate()}
			disabled={joinMutation.isPending || !userId}
			className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
		>
			{joinMutation.isPending ? "Joining..." : "Join Organization"}
		</button>
	);
}
