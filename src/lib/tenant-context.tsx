import { createContext, useContext } from "react";

// Simplified types - actual types come from Prisma when generated
export interface Tenant {
	id: string;
	slug: string;
	name: string;
	logo: string | null;
	primaryColor: string;
	accentColor: string;
	terminology: unknown;
	features: unknown;
	createdAt: Date;
	updatedAt: Date;
}

export interface TenantMember {
	id: string;
	tenantId: string;
	userId: string;
	role: "ADMIN" | "COORDINATOR" | "VOLUNTEER";
	status: "PENDING" | "ACTIVE" | "INACTIVE";
	createdAt: Date;
	updatedAt: Date;
}

export interface TenantContextValue {
	tenant: Tenant;
	membership: TenantMember | null;
	isAdmin: boolean;
	isCoordinator: boolean;
	isVolunteer: boolean;
	// Helper to get custom terminology
	t: (key: string) => string;
}

export const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
	const context = useContext(TenantContext);
	if (!context) {
		throw new Error("useTenant must be used within a TenantProvider");
	}
	return context;
}

export function useTenantOptional() {
	return useContext(TenantContext);
}

// Default terminology mapping
const defaultTerminology: Record<string, string> = {
	volunteer: "Volunteer",
	volunteers: "Volunteers",
	opportunity: "Opportunity",
	opportunities: "Opportunities",
	organization: "Organization",
	coordinator: "Coordinator",
	signup: "Sign Up",
	apply: "Apply",
};

export function createTerminologyHelper(
	custom: Record<string, string>,
): (key: string) => string {
	return (key: string) => {
		return custom[key] || defaultTerminology[key] || key;
	};
}
