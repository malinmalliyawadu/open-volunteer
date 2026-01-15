import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$tenantSlug/opportunities/new")({
	component: CreateOpportunity,
});

function CreateOpportunity() {
	const { tenant, t, isCoordinator } = useTenant();
	const navigate = useNavigate();

	const [form, setForm] = useState({
		title: "",
		description: "",
		type: "EVENT" as "EVENT" | "SHIFT" | "PROJECT",
		location: "",
		address: "",
		isVirtual: false,
		startDate: "",
		startTime: "",
		endDate: "",
		endTime: "",
		capacity: "",
		skills: "",
		minAge: "",
		backgroundCheck: false,
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
			const endDateTime =
				form.endDate && form.endTime
					? new Date(`${form.endDate}T${form.endTime}`)
					: undefined;

			return client.createOpportunity({
				tenantId: tenant.id,
				title: form.title,
				description: form.description,
				type: form.type,
				location: form.location || undefined,
				address: form.address || undefined,
				isVirtual: form.isVirtual,
				startDate: startDateTime,
				endDate: endDateTime,
				capacity: form.capacity ? Number.parseInt(form.capacity, 10) : 0,
				requirements: {
					skills: form.skills
						? form.skills.split(",").map((s) => s.trim())
						: undefined,
					minAge: form.minAge ? Number.parseInt(form.minAge, 10) : undefined,
					backgroundCheck: form.backgroundCheck || undefined,
				},
			});
		},
		onSuccess: (data) => {
			navigate({
				to: "/$tenantSlug/opportunities/$opportunityId",
				params: { tenantSlug: tenant.slug, opportunityId: data.id },
			});
		},
	});

	if (!isCoordinator) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
					<p className="text-gray-400">
						You need coordinator access to create {t("opportunities").toLowerCase()}.
					</p>
				</div>
			</div>
		);
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	const updateField = <K extends keyof typeof form>(
		field: K,
		value: (typeof form)[K],
	) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<div className="max-w-3xl mx-auto px-6 py-8">
				<Link
					to="/$tenantSlug/opportunities"
					params={{ tenantSlug: tenant.slug }}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to {t("opportunities").toLowerCase()}
				</Link>

				<h1 className="text-3xl font-bold text-white mb-8">
					Create {t("opportunity")}
				</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Basic Info */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Basic Information</h2>

						<div>
							<label htmlFor="title" className="block text-sm text-gray-400 mb-2">
								Title *
							</label>
							<input
								id="title"
								type="text"
								required
								value={form.title}
								onChange={(e) => updateField("title", e.target.value)}
								placeholder={`${t("opportunity")} title`}
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
							/>
						</div>

						<div>
							<label
								htmlFor="description"
								className="block text-sm text-gray-400 mb-2"
							>
								Description *
							</label>
							<textarea
								id="description"
								required
								value={form.description}
								onChange={(e) => updateField("description", e.target.value)}
								placeholder="Describe the opportunity..."
								rows={5}
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
							/>
						</div>

						<div>
							<label htmlFor="type" className="block text-sm text-gray-400 mb-2">
								Type *
							</label>
							<select
								id="type"
								value={form.type}
								onChange={(e) =>
									updateField("type", e.target.value as typeof form.type)
								}
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
							>
								<option value="EVENT">Event</option>
								<option value="SHIFT">Shift</option>
								<option value="PROJECT">Project</option>
							</select>
						</div>
					</section>

					{/* Schedule */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Schedule</h2>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="startDate"
									className="block text-sm text-gray-400 mb-2"
								>
									Start Date *
								</label>
								<input
									id="startDate"
									type="date"
									required
									value={form.startDate}
									onChange={(e) => updateField("startDate", e.target.value)}
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div>
								<label
									htmlFor="startTime"
									className="block text-sm text-gray-400 mb-2"
								>
									Start Time *
								</label>
								<input
									id="startTime"
									type="time"
									required
									value={form.startTime}
									onChange={(e) => updateField("startTime", e.target.value)}
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="endDate"
									className="block text-sm text-gray-400 mb-2"
								>
									End Date
								</label>
								<input
									id="endDate"
									type="date"
									value={form.endDate}
									onChange={(e) => updateField("endDate", e.target.value)}
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div>
								<label
									htmlFor="endTime"
									className="block text-sm text-gray-400 mb-2"
								>
									End Time
								</label>
								<input
									id="endTime"
									type="time"
									value={form.endTime}
									onChange={(e) => updateField("endTime", e.target.value)}
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
								/>
							</div>
						</div>
					</section>

					{/* Location */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Location</h2>

						<div className="flex items-center gap-2">
							<input
								id="isVirtual"
								type="checkbox"
								checked={form.isVirtual}
								onChange={(e) => updateField("isVirtual", e.target.checked)}
								className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
							/>
							<label htmlFor="isVirtual" className="text-gray-300">
								This is a virtual {t("opportunity").toLowerCase()}
							</label>
						</div>

						{!form.isVirtual && (
							<>
								<div>
									<label
										htmlFor="location"
										className="block text-sm text-gray-400 mb-2"
									>
										Location Name
									</label>
									<input
										id="location"
										type="text"
										value={form.location}
										onChange={(e) => updateField("location", e.target.value)}
										placeholder="e.g., Community Center"
										className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
									/>
								</div>
								<div>
									<label
										htmlFor="address"
										className="block text-sm text-gray-400 mb-2"
									>
										Address
									</label>
									<input
										id="address"
										type="text"
										value={form.address}
										onChange={(e) => updateField("address", e.target.value)}
										placeholder="Full address"
										className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
									/>
								</div>
							</>
						)}
					</section>

					{/* Capacity & Requirements */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">
							Capacity & Requirements
						</h2>

						<div>
							<label
								htmlFor="capacity"
								className="block text-sm text-gray-400 mb-2"
							>
								Capacity (0 = unlimited)
							</label>
							<input
								id="capacity"
								type="number"
								min="0"
								value={form.capacity}
								onChange={(e) => updateField("capacity", e.target.value)}
								placeholder="0"
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
							/>
						</div>

						<div>
							<label htmlFor="skills" className="block text-sm text-gray-400 mb-2">
								Required Skills (comma-separated)
							</label>
							<input
								id="skills"
								type="text"
								value={form.skills}
								onChange={(e) => updateField("skills", e.target.value)}
								placeholder="e.g., driving, cooking, first-aid"
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="minAge"
									className="block text-sm text-gray-400 mb-2"
								>
									Minimum Age
								</label>
								<input
									id="minAge"
									type="number"
									min="0"
									value={form.minAge}
									onChange={(e) => updateField("minAge", e.target.value)}
									placeholder="None"
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div className="flex items-end">
								<div className="flex items-center gap-2">
									<input
										id="backgroundCheck"
										type="checkbox"
										checked={form.backgroundCheck}
										onChange={(e) =>
											updateField("backgroundCheck", e.target.checked)
										}
										className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
									/>
									<label htmlFor="backgroundCheck" className="text-gray-300">
										Requires background check
									</label>
								</div>
							</div>
						</div>
					</section>

					{/* Submit */}
					<div className="flex gap-4">
						<button
							type="submit"
							disabled={createMutation.isPending}
							className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
						>
							{createMutation.isPending
								? "Creating..."
								: `Create ${t("opportunity")}`}
						</button>
						<Link
							to="/$tenantSlug/opportunities"
							params={{ tenantSlug: tenant.slug }}
							className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-gray-300 font-medium rounded-lg transition-colors"
						>
							Cancel
						</Link>
					</div>

					{createMutation.isError && (
						<p className="text-red-400 text-sm">
							Error: {(createMutation.error as Error).message}
						</p>
					)}
				</form>
			</div>
		</div>
	);
}
