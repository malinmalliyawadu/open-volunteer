import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import { ArrowLeft, User, Shield, UserCog, Users, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$tenantSlug/manage/members")({
	component: MembersPage,
});

function MembersPage() {
	const { tenant, t, isAdmin } = useTenant();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

	const { data, isLoading } = useQuery(
		orpc.listMembers.queryOptions({
			input: {
				tenantId: tenant.id,
				role: roleFilter as "ADMIN" | "COORDINATOR" | "VOLUNTEER" | undefined,
				search: search || undefined,
				limit: 50,
			},
		}),
	);

	const updateMutation = useMutation({
		mutationFn: ({
			memberId,
			role,
			status,
		}: {
			memberId: string;
			role?: "ADMIN" | "COORDINATOR" | "VOLUNTEER";
			status?: "ACTIVE" | "INACTIVE";
		}) => client.updateMember({ memberId, role, status }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["listMembers"] });
		},
	});

	if (!isAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
					<p className="text-gray-400">
						You need admin access to manage {t("volunteers").toLowerCase()}.
					</p>
				</div>
			</div>
		);
	}

	const roleIcons: Record<string, React.ReactNode> = {
		ADMIN: <Shield className="w-4 h-4" />,
		COORDINATOR: <UserCog className="w-4 h-4" />,
		VOLUNTEER: <User className="w-4 h-4" />,
	};

	const roleColors: Record<string, string> = {
		ADMIN: "bg-purple-500/20 text-purple-400",
		COORDINATOR: "bg-blue-500/20 text-blue-400",
		VOLUNTEER: "bg-gray-500/20 text-gray-400",
	};

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
					<h1 className="text-3xl font-bold text-white">{t("volunteers")}</h1>
					<span className="text-gray-400">{data?.total ?? 0} members</span>
				</div>

				{/* Filters */}
				<div className="flex flex-col md:flex-row gap-4 mb-6">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search by name or email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
						/>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setRoleFilter(undefined)}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								!roleFilter
									? "bg-cyan-500 text-white"
									: "bg-slate-800 text-gray-300 hover:bg-slate-700"
							}`}
						>
							All
						</button>
						{(["ADMIN", "COORDINATOR", "VOLUNTEER"] as const).map((role) => (
							<button
								key={role}
								type="button"
								onClick={() => setRoleFilter(role)}
								className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
									roleFilter === role
										? "bg-cyan-500 text-white"
										: "bg-slate-800 text-gray-300 hover:bg-slate-700"
								}`}
							>
								{roleIcons[role]}
								{role.charAt(0) + role.slice(1).toLowerCase()}
							</button>
						))}
					</div>
				</div>

				{/* Members List */}
				{isLoading ? (
					<div className="space-y-4">
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className="bg-slate-800/50 rounded-xl p-4 animate-pulse"
							>
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 rounded-full bg-slate-700" />
									<div className="flex-1">
										<div className="h-5 bg-slate-700 rounded w-1/3 mb-2" />
										<div className="h-4 bg-slate-700 rounded w-1/4" />
									</div>
								</div>
							</div>
						))}
					</div>
				) : data?.members.length === 0 ? (
					<div className="text-center py-16 bg-slate-800/50 border border-slate-700 rounded-xl">
						<Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
						<p className="text-gray-400 text-lg">No members found.</p>
					</div>
				) : (
					<div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
						{data?.members.map((member, i) => (
							<div
								key={member.id}
								className={`flex items-center justify-between p-4 ${
									i !== 0 ? "border-t border-slate-700" : ""
								}`}
							>
								<div className="flex items-center gap-4">
									{member.user?.avatarUrl ? (
										<img
											src={member.user.avatarUrl}
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
											{member.user?.name || member.user?.email}
										</p>
										<p className="text-sm text-gray-400">{member.user?.email}</p>
									</div>
								</div>

								<div className="flex items-center gap-3">
									<select
										value={member.role}
										onChange={(e) =>
											updateMutation.mutate({
												memberId: member.id,
												role: e.target.value as
													| "ADMIN"
													| "COORDINATOR"
													| "VOLUNTEER",
											})
										}
										className={`px-3 py-1 rounded-lg font-medium text-sm ${roleColors[member.role]} bg-transparent border-0 cursor-pointer focus:outline-none`}
									>
										<option value="VOLUNTEER">Volunteer</option>
										<option value="COORDINATOR">Coordinator</option>
										<option value="ADMIN">Admin</option>
									</select>

									{member.status === "ACTIVE" ? (
										<button
											type="button"
											onClick={() =>
												updateMutation.mutate({
													memberId: member.id,
													status: "INACTIVE",
												})
											}
											className="text-sm text-red-400 hover:text-red-300 transition-colors"
										>
											Deactivate
										</button>
									) : (
										<button
											type="button"
											onClick={() =>
												updateMutation.mutate({
													memberId: member.id,
													status: "ACTIVE",
												})
											}
											className="text-sm text-green-400 hover:text-green-300 transition-colors"
										>
											Activate
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
