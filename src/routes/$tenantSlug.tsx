import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { orpc } from "@/orpc/client";
import { prisma } from "@/db";
import {
	TenantContext,
	createTerminologyHelper,
	type TenantContextValue,
} from "@/lib/tenant-context";

export const Route = createFileRoute("/$tenantSlug")({
	component: TenantLayout,
	loader: async ({ params }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: params.tenantSlug },
		});
		return { tenant };
	},
});

function TenantLayout() {
	const { tenant } = Route.useLoaderData();
	const { user: clerkUser, isSignedIn } = useUser();

	// Load current user from our DB (synced from Clerk) - client side only
	const { data: dbUser } = useQuery({
		...orpc.getUser.queryOptions({
			input: { clerkId: clerkUser?.id ?? "" },
		}),
		enabled: isSignedIn && !!clerkUser?.id,
	});

	// Load membership - client side only
	const { data: membership } = useQuery({
		...orpc.getMember.queryOptions({
			input: {
				tenantId: tenant?.id ?? "",
				userId: dbUser?.id ?? "",
			},
		}),
		enabled: !!tenant?.id && !!dbUser?.id,
	});

	if (!tenant) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-900">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-2">
						Organization Not Found
					</h1>
					<p className="text-gray-400">
						This organization doesn't exist.
					</p>
				</div>
			</div>
		);
	}

	const terminology = (tenant.terminology ?? {}) as Record<string, string>;
	const contextValue: TenantContextValue = {
		tenant,
		membership: membership ?? null,
		isAdmin: membership?.role === "ADMIN",
		isCoordinator:
			membership?.role === "COORDINATOR" || membership?.role === "ADMIN",
		isVolunteer: !!membership,
		t: createTerminologyHelper(terminology),
	};

	return (
		<TenantContext.Provider value={contextValue}>
			<TenantBranding tenant={tenant} />
			<Outlet />
		</TenantContext.Provider>
	);
}

function TenantBranding({
	tenant,
}: {
	tenant: { primaryColor: string; accentColor: string };
}) {
	return (
		<style>{`
			:root {
				--tenant-primary: ${tenant.primaryColor};
				--tenant-accent: ${tenant.accentColor};
			}
		`}</style>
	);
}
