import { os } from "@orpc/server";
import { z } from "zod";
import { prisma } from "@/db";
import { ApplyInput, UpdateSignupInput, ListSignupsInput } from "@/orpc/schema";

export const applyToOpportunity = os
	.input(ApplyInput.extend({ userId: z.string() }))
	.handler(async ({ input }) => {
		// Check if opportunity exists and is published
		const opportunity = await prisma.opportunity.findUnique({
			where: { id: input.opportunityId },
		});

		if (!opportunity) {
			throw new Error("Opportunity not found");
		}

		if (opportunity.status !== "PUBLISHED") {
			throw new Error("Opportunity is not accepting applications");
		}

		// Check if user already applied
		const existing = await prisma.opportunitySignup.findUnique({
			where: {
				opportunityId_userId: {
					opportunityId: input.opportunityId,
					userId: input.userId,
				},
			},
		});

		if (existing) {
			throw new Error("You have already applied to this opportunity");
		}

		// Create signup
		const signup = await prisma.opportunitySignup.create({
			data: {
				opportunityId: input.opportunityId,
				userId: input.userId,
				notes: input.notes,
				status: "APPLIED",
			},
			include: {
				opportunity: true,
			},
		});

		return signup;
	});

export const updateSignup = os
	.input(UpdateSignupInput)
	.handler(async ({ input }) => {
		const signup = await prisma.opportunitySignup.findUnique({
			where: { id: input.signupId },
			include: { opportunity: true },
		});

		if (!signup) {
			throw new Error("Signup not found");
		}

		const updateData: Parameters<
			typeof prisma.opportunitySignup.update
		>[0]["data"] = {
			status: input.status,
			notes: input.notes,
		};

		// Handle status transitions
		if (input.status === "APPROVED" && signup.status !== "APPROVED") {
			updateData.approvedAt = new Date();

			// Decrement spots if opportunity has capacity
			if (signup.opportunity.capacity > 0) {
				await prisma.opportunity.update({
					where: { id: signup.opportunityId },
					data: { spotsRemaining: { decrement: 1 } },
				});
			}
		}

		if (input.status === "COMPLETED") {
			updateData.completedAt = new Date();
		}

		// If moving from approved to something else, restore spot
		if (
			signup.status === "APPROVED" &&
			input.status !== "APPROVED" &&
			input.status !== "COMPLETED"
		) {
			if (signup.opportunity.capacity > 0) {
				await prisma.opportunity.update({
					where: { id: signup.opportunityId },
					data: { spotsRemaining: { increment: 1 } },
				});
			}
		}

		return prisma.opportunitySignup.update({
			where: { id: input.signupId },
			data: updateData,
			include: {
				user: true,
				opportunity: true,
			},
		});
	});

export const withdrawApplication = os
	.input(z.object({ signupId: z.string() }))
	.handler(async ({ input }) => {
		const signup = await prisma.opportunitySignup.findUnique({
			where: { id: input.signupId },
			include: { opportunity: true },
		});

		if (!signup) {
			throw new Error("Signup not found");
		}

		// If was approved, restore spot
		if (signup.status === "APPROVED" && signup.opportunity.capacity > 0) {
			await prisma.opportunity.update({
				where: { id: signup.opportunityId },
				data: { spotsRemaining: { increment: 1 } },
			});
		}

		return prisma.opportunitySignup.update({
			where: { id: input.signupId },
			data: { status: "CANCELLED" },
		});
	});

export const listSignups = os
	.input(ListSignupsInput)
	.handler(async ({ input }) => {
		const where: Parameters<
			typeof prisma.opportunitySignup.findMany
		>[0]["where"] = {};

		if (input.opportunityId) {
			where.opportunityId = input.opportunityId;
		}

		if (input.userId) {
			where.userId = input.userId;
		}

		if (input.status) {
			where.status = input.status;
		}

		const [signups, total] = await Promise.all([
			prisma.opportunitySignup.findMany({
				where,
				orderBy: { appliedAt: "desc" },
				take: input.limit,
				skip: input.offset,
				include: {
					user: true,
					opportunity: true,
				},
			}),
			prisma.opportunitySignup.count({ where }),
		]);

		return {
			signups,
			total,
			hasMore: input.offset + signups.length < total,
		};
	});

export const getSignup = os
	.input(z.object({ opportunityId: z.string(), userId: z.string() }))
	.handler(async ({ input }) => {
		return prisma.opportunitySignup.findUnique({
			where: {
				opportunityId_userId: {
					opportunityId: input.opportunityId,
					userId: input.userId,
				},
			},
		});
	});

export const getMySignups = os
	.input(
		z.object({
			userId: z.string(),
			status: z
				.enum([
					"APPLIED",
					"APPROVED",
					"WAITLISTED",
					"DECLINED",
					"COMPLETED",
					"CANCELLED",
				])
				.optional(),
			limit: z.number().int().min(1).max(100).default(20),
			offset: z.number().int().min(0).default(0),
		}),
	)
	.handler(async ({ input }) => {
		const where: Parameters<
			typeof prisma.opportunitySignup.findMany
		>[0]["where"] = {
			userId: input.userId,
		};

		if (input.status) {
			where.status = input.status;
		} else {
			// Exclude cancelled by default
			where.status = { not: "CANCELLED" };
		}

		const [signups, total] = await Promise.all([
			prisma.opportunitySignup.findMany({
				where,
				orderBy: { appliedAt: "desc" },
				take: input.limit,
				skip: input.offset,
				include: {
					opportunity: {
						include: {
							tenant: true,
						},
					},
				},
			}),
			prisma.opportunitySignup.count({ where }),
		]);

		return {
			signups,
			total,
			hasMore: input.offset + signups.length < total,
		};
	});
