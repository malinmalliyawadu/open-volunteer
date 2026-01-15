import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/orpc/client";
import { useTenant } from "@/lib/tenant-context";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$tenantSlug/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { tenant, isAdmin } = useTenant();
	const queryClient = useQueryClient();

	const [form, setForm] = useState({
		name: tenant.name,
		logo: tenant.logo ?? "",
		primaryColor: tenant.primaryColor,
		accentColor: tenant.accentColor,
		// Terminology
		volunteer: (tenant.terminology as Record<string, string>)?.volunteer ?? "",
		volunteers: (tenant.terminology as Record<string, string>)?.volunteers ?? "",
		opportunity:
			(tenant.terminology as Record<string, string>)?.opportunity ?? "",
		opportunities:
			(tenant.terminology as Record<string, string>)?.opportunities ?? "",
	});

	const updateMutation = useMutation({
		mutationFn: () =>
			client.updateTenant({
				id: tenant.id,
				name: form.name,
				logo: form.logo || null,
				primaryColor: form.primaryColor,
				accentColor: form.accentColor,
				terminology: {
					volunteer: form.volunteer || undefined,
					volunteers: form.volunteers || undefined,
					opportunity: form.opportunity || undefined,
					opportunities: form.opportunities || undefined,
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["getTenant"] });
		},
	});

	if (!isAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
					<p className="text-gray-400">
						You need admin access to manage settings.
					</p>
				</div>
			</div>
		);
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate();
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
					to="/$tenantSlug/manage"
					params={{ tenantSlug: tenant.slug }}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Dashboard
				</Link>

				<h1 className="text-3xl font-bold text-white mb-8">
					Organization Settings
				</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Basic Info */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Basic Information</h2>

						<div>
							<label htmlFor="name" className="block text-sm text-gray-400 mb-2">
								Organization Name
							</label>
							<input
								id="name"
								type="text"
								required
								value={form.name}
								onChange={(e) => updateField("name", e.target.value)}
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
							/>
						</div>

						<div>
							<label htmlFor="slug" className="block text-sm text-gray-400 mb-2">
								URL Slug
							</label>
							<div className="flex items-center">
								<span className="px-3 py-2 bg-slate-600 border border-slate-600 rounded-l-lg text-gray-400">
									/
								</span>
								<input
									id="slug"
									type="text"
									disabled
									value={tenant.slug}
									className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-r-lg text-gray-500 cursor-not-allowed"
								/>
							</div>
							<p className="text-xs text-gray-500 mt-1">
								URL slug cannot be changed after creation.
							</p>
						</div>

						<div>
							<label htmlFor="logo" className="block text-sm text-gray-400 mb-2">
								Logo URL
							</label>
							<input
								id="logo"
								type="url"
								value={form.logo}
								onChange={(e) => updateField("logo", e.target.value)}
								placeholder="https://example.com/logo.png"
								className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
							/>
							{form.logo && (
								<div className="mt-2">
									<img
										src={form.logo}
										alt="Logo preview"
										className="h-12 w-12 object-contain rounded"
									/>
								</div>
							)}
						</div>
					</section>

					{/* Branding */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Branding</h2>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="primaryColor"
									className="block text-sm text-gray-400 mb-2"
								>
									Primary Color
								</label>
								<div className="flex items-center gap-2">
									<input
										id="primaryColor"
										type="color"
										value={form.primaryColor}
										onChange={(e) => updateField("primaryColor", e.target.value)}
										className="w-10 h-10 rounded cursor-pointer border-0"
									/>
									<input
										type="text"
										value={form.primaryColor}
										onChange={(e) => updateField("primaryColor", e.target.value)}
										pattern="^#[0-9a-fA-F]{6}$"
										className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 font-mono"
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="accentColor"
									className="block text-sm text-gray-400 mb-2"
								>
									Accent Color
								</label>
								<div className="flex items-center gap-2">
									<input
										id="accentColor"
										type="color"
										value={form.accentColor}
										onChange={(e) => updateField("accentColor", e.target.value)}
										className="w-10 h-10 rounded cursor-pointer border-0"
									/>
									<input
										type="text"
										value={form.accentColor}
										onChange={(e) => updateField("accentColor", e.target.value)}
										pattern="^#[0-9a-fA-F]{6}$"
										className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 font-mono"
									/>
								</div>
							</div>
						</div>

						<div className="p-4 rounded-lg border border-slate-600">
							<p className="text-sm text-gray-400 mb-2">Preview:</p>
							<div className="flex gap-4">
								<button
									type="button"
									style={{ backgroundColor: form.primaryColor }}
									className="px-4 py-2 text-white font-medium rounded-lg"
								>
									Primary Button
								</button>
								<button
									type="button"
									style={{ backgroundColor: form.accentColor }}
									className="px-4 py-2 text-white font-medium rounded-lg"
								>
									Accent Button
								</button>
							</div>
						</div>
					</section>

					{/* Terminology */}
					<section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Custom Terminology</h2>
						<p className="text-sm text-gray-400">
							Customize the words used throughout the portal. Leave blank to use
							defaults.
						</p>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="volunteer"
									className="block text-sm text-gray-400 mb-2"
								>
									"Volunteer" (singular)
								</label>
								<input
									id="volunteer"
									type="text"
									value={form.volunteer}
									onChange={(e) => updateField("volunteer", e.target.value)}
									placeholder="Volunteer"
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div>
								<label
									htmlFor="volunteers"
									className="block text-sm text-gray-400 mb-2"
								>
									"Volunteers" (plural)
								</label>
								<input
									id="volunteers"
									type="text"
									value={form.volunteers}
									onChange={(e) => updateField("volunteers", e.target.value)}
									placeholder="Volunteers"
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div>
								<label
									htmlFor="opportunity"
									className="block text-sm text-gray-400 mb-2"
								>
									"Opportunity" (singular)
								</label>
								<input
									id="opportunity"
									type="text"
									value={form.opportunity}
									onChange={(e) => updateField("opportunity", e.target.value)}
									placeholder="Opportunity"
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
								/>
							</div>
							<div>
								<label
									htmlFor="opportunities"
									className="block text-sm text-gray-400 mb-2"
								>
									"Opportunities" (plural)
								</label>
								<input
									id="opportunities"
									type="text"
									value={form.opportunities}
									onChange={(e) => updateField("opportunities", e.target.value)}
									placeholder="Opportunities"
									className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
								/>
							</div>
						</div>
					</section>

					{/* Submit */}
					<div className="flex gap-4">
						<button
							type="submit"
							disabled={updateMutation.isPending}
							className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
						>
							<Save className="w-4 h-4" />
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</button>
					</div>

					{updateMutation.isSuccess && (
						<p className="text-green-400 text-sm">Settings saved successfully!</p>
					)}

					{updateMutation.isError && (
						<p className="text-red-400 text-sm">
							Error: {(updateMutation.error as Error).message}
						</p>
					)}
				</form>
			</div>
		</div>
	);
}
