import { z } from "zod";

// Enums matching Prisma schema
export const MemberRole = z.enum(["ADMIN", "COORDINATOR", "VOLUNTEER"]);
export const MemberStatus = z.enum(["PENDING", "ACTIVE", "INACTIVE"]);
export const OpportunityType = z.enum(["EVENT", "SHIFT", "PROJECT"]);
export const OpportunityStatus = z.enum([
	"DRAFT",
	"PUBLISHED",
	"CANCELLED",
	"COMPLETED",
]);
export const SignupStatus = z.enum([
	"APPLIED",
	"APPROVED",
	"WAITLISTED",
	"DECLINED",
	"COMPLETED",
	"CANCELLED",
]);

// Tenant schemas
export const TenantSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	logo: z.string().nullable(),
	primaryColor: z.string(),
	accentColor: z.string(),
	terminology: z.record(z.string(), z.string()).default({}),
	features: z.record(z.string(), z.boolean()).default({}),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CreateTenantInput = z.object({
	slug: z
		.string()
		.min(3)
		.max(50)
		.regex(/^[a-z0-9-]+$/),
	name: z.string().min(1).max(100),
	logo: z.string().url().optional(),
	primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
	accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const UpdateTenantInput = z.object({
	name: z.string().min(1).max(100).optional(),
	logo: z.string().url().nullable().optional(),
	primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
	accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
	terminology: z.record(z.string(), z.string()).optional(),
	features: z.record(z.string(), z.boolean()).optional(),
});

// User schemas
export const UserSchema = z.object({
	id: z.string(),
	clerkId: z.string(),
	email: z.string().email(),
	name: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	bio: z.string().nullable(),
	skills: z.array(z.string()).default([]),
	availability: z.record(z.string(), z.array(z.string())).default({}),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const UpdateUserInput = z.object({
	name: z.string().min(1).max(100).optional(),
	bio: z.string().max(500).optional(),
	skills: z.array(z.string()).optional(),
	availability: z.record(z.string(), z.array(z.string())).optional(),
});

// TenantMember schemas
export const TenantMemberSchema = z.object({
	id: z.string(),
	tenantId: z.string(),
	userId: z.string(),
	role: MemberRole,
	status: MemberStatus,
	createdAt: z.date(),
	updatedAt: z.date(),
	user: UserSchema.optional(),
});

export const InviteMemberInput = z.object({
	tenantId: z.string(),
	email: z.string().email(),
	role: MemberRole.default("VOLUNTEER"),
});

export const UpdateMemberInput = z.object({
	memberId: z.string(),
	role: MemberRole.optional(),
	status: MemberStatus.optional(),
});

// Opportunity schemas
export const OpportunitySchema = z.object({
	id: z.string(),
	tenantId: z.string(),
	title: z.string(),
	description: z.string(),
	type: OpportunityType,
	status: OpportunityStatus,
	location: z.string().nullable(),
	address: z.string().nullable(),
	isVirtual: z.boolean(),
	startDate: z.date(),
	endDate: z.date().nullable(),
	recurrence: z.string().nullable(),
	requirements: z
		.object({
			skills: z.array(z.string()).optional(),
			minAge: z.number().optional(),
			backgroundCheck: z.boolean().optional(),
		})
		.default({}),
	capacity: z.number(),
	spotsRemaining: z.number(),
	tags: z.array(z.string()).default([]),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CreateOpportunityInput = z.object({
	tenantId: z.string(),
	title: z.string().min(1).max(200),
	description: z.string().min(1),
	type: OpportunityType.default("EVENT"),
	location: z.string().optional(),
	address: z.string().optional(),
	isVirtual: z.boolean().default(false),
	startDate: z.coerce.date(),
	endDate: z.coerce.date().optional(),
	recurrence: z.string().optional(),
	requirements: z
		.object({
			skills: z.array(z.string()).optional(),
			minAge: z.number().optional(),
			backgroundCheck: z.boolean().optional(),
		})
		.optional(),
	capacity: z.number().int().min(0).default(0),
	tags: z.array(z.string()).optional(),
});

export const UpdateOpportunityInput = z.object({
	id: z.string(),
	title: z.string().min(1).max(200).optional(),
	description: z.string().min(1).optional(),
	type: OpportunityType.optional(),
	status: OpportunityStatus.optional(),
	location: z.string().nullable().optional(),
	address: z.string().nullable().optional(),
	isVirtual: z.boolean().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().nullable().optional(),
	recurrence: z.string().nullable().optional(),
	requirements: z
		.object({
			skills: z.array(z.string()).optional(),
			minAge: z.number().optional(),
			backgroundCheck: z.boolean().optional(),
		})
		.optional(),
	capacity: z.number().int().min(0).optional(),
	tags: z.array(z.string()).optional(),
});

export const ListOpportunitiesInput = z.object({
	tenantId: z.string(),
	type: OpportunityType.optional(),
	status: OpportunityStatus.optional(),
	fromDate: z.coerce.date().optional(),
	toDate: z.coerce.date().optional(),
	tags: z.array(z.string()).optional(),
	search: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});

// Signup schemas
export const SignupSchema = z.object({
	id: z.string(),
	opportunityId: z.string(),
	userId: z.string(),
	status: SignupStatus,
	appliedAt: z.date(),
	approvedAt: z.date().nullable(),
	completedAt: z.date().nullable(),
	notes: z.string().nullable(),
	user: UserSchema.optional(),
	opportunity: OpportunitySchema.optional(),
});

export const ApplyInput = z.object({
	opportunityId: z.string(),
	notes: z.string().max(500).optional(),
});

export const UpdateSignupInput = z.object({
	signupId: z.string(),
	status: SignupStatus,
	notes: z.string().optional(),
});

export const ListSignupsInput = z.object({
	opportunityId: z.string().optional(),
	userId: z.string().optional(),
	status: SignupStatus.optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});
