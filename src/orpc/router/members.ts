import { os } from "@orpc/server";
import { z } from "zod";
import { prisma } from "@/db";
import { InviteMemberInput, UpdateMemberInput, MemberRole } from "@/orpc/schema";

export const getMember = os
	.input(z.object({ tenantId: z.string(), userId: z.string() }))
	.handler(async ({ input }) => {
		return prisma.tenantMember.findUnique({
			where: {
				tenantId_userId: {
					tenantId: input.tenantId,
					userId: input.userId,
				},
			},
			include: {
				user: true,
				tenant: true,
			},
		});
	});

export const listMembers = os
	.input(
		z.object({
			tenantId: z.string(),
			role: MemberRole.optional(),
			status: z.enum(["PENDING", "ACTIVE", "INACTIVE"]).optional(),
			search: z.string().optional(),
			limit: z.number().int().min(1).max(100).default(20),
			offset: z.number().int().min(0).default(0),
		}),
	)
	.handler(async ({ input }) => {
		const where: Parameters<
			typeof prisma.tenantMember.findMany
		>[0]["where"] = {
			tenantId: input.tenantId,
		};

		if (input.role) {
			where.role = input.role;
		}

		if (input.status) {
			where.status = input.status;
		}

		if (input.search) {
			where.user = {
				OR: [
					{ name: { contains: input.search, mode: "insensitive" } },
					{ email: { contains: input.search, mode: "insensitive" } },
				],
			};
		}

		const [members, total] = await Promise.all([
			prisma.tenantMember.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
				include: {
					user: true,
				},
			}),
			prisma.tenantMember.count({ where }),
		]);

		return {
			members,
			total,
			hasMore: input.offset + members.length < total,
		};
	});

export const inviteMember = os
	.input(InviteMemberInput)
	.handler(async ({ input }) => {
		// Find or create user by email
		let user = await prisma.user.findUnique({
			where: { email: input.email },
		});

		if (!user) {
			// Create placeholder user - will be linked to Clerk on first login
			user = await prisma.user.create({
				data: {
					email: input.email,
					clerkId: `pending_${input.email}`,
				},
			});
		}

		// Check if already a member
		const existing = await prisma.tenantMember.findUnique({
			where: {
				tenantId_userId: {
					tenantId: input.tenantId,
					userId: user.id,
				},
			},
		});

		if (existing) {
			throw new Error("User is already a member of this organization");
		}

		return prisma.tenantMember.create({
			data: {
				tenantId: input.tenantId,
				userId: user.id,
				role: input.role,
				status: "PENDING",
			},
			include: {
				user: true,
			},
		});
	});

export const updateMember = os
	.input(UpdateMemberInput)
	.handler(async ({ input }) => {
		const { memberId, ...data } = input;
		return prisma.tenantMember.update({
			where: { id: memberId },
			data,
			include: {
				user: true,
			},
		});
	});

export const removeMember = os
	.input(z.object({ memberId: z.string() }))
	.handler(async ({ input }) => {
		await prisma.tenantMember.delete({
			where: { id: input.memberId },
		});
		return { success: true };
	});

export const getMyMemberships = os
	.input(z.object({ userId: z.string() }))
	.handler(async ({ input }) => {
		return prisma.tenantMember.findMany({
			where: {
				userId: input.userId,
				status: "ACTIVE",
			},
			include: {
				tenant: true,
			},
			orderBy: { tenant: { name: "asc" } },
		});
	});

export const joinTenant = os
	.input(z.object({ tenantSlug: z.string(), userId: z.string() }))
	.handler(async ({ input }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: input.tenantSlug },
		});

		if (!tenant) {
			throw new Error("Organization not found");
		}

		// Check if already a member
		const existing = await prisma.tenantMember.findUnique({
			where: {
				tenantId_userId: {
					tenantId: tenant.id,
					userId: input.userId,
				},
			},
		});

		if (existing) {
			if (existing.status === "INACTIVE") {
				// Reactivate
				return prisma.tenantMember.update({
					where: { id: existing.id },
					data: { status: "ACTIVE" },
					include: { tenant: true },
				});
			}
			throw new Error("You are already a member of this organization");
		}

		return prisma.tenantMember.create({
			data: {
				tenantId: tenant.id,
				userId: input.userId,
				role: "VOLUNTEER",
				status: "ACTIVE",
			},
			include: {
				tenant: true,
			},
		});
	});
