import { os } from "@orpc/server";
import { z } from "zod";
import { prisma } from "@/db";
import {
	CreateOpportunityInput,
	UpdateOpportunityInput,
	ListOpportunitiesInput,
} from "@/orpc/schema";

export const getOpportunity = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const opportunity = await prisma.opportunity.findUnique({
			where: { id: input.id },
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
		if (!opportunity) {
			throw new Error("Opportunity not found");
		}
		return opportunity;
	});

export const listOpportunities = os
	.input(ListOpportunitiesInput)
	.handler(async ({ input }) => {
		const where: Parameters<typeof prisma.opportunity.findMany>[0]["where"] = {
			tenantId: input.tenantId,
		};

		if (input.type) {
			where.type = input.type;
		}

		if (input.status) {
			where.status = input.status;
		} else {
			// Default to published opportunities for public listing
			where.status = "PUBLISHED";
		}

		if (input.fromDate) {
			where.startDate = { gte: input.fromDate };
		}

		if (input.toDate) {
			where.startDate = { ...where.startDate, lte: input.toDate };
		}

		if (input.search) {
			where.OR = [
				{ title: { contains: input.search, mode: "insensitive" } },
				{ description: { contains: input.search, mode: "insensitive" } },
			];
		}

		const [opportunities, total] = await Promise.all([
			prisma.opportunity.findMany({
				where,
				orderBy: { startDate: "asc" },
				take: input.limit,
				skip: input.offset,
				include: {
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
			}),
			prisma.opportunity.count({ where }),
		]);

		return {
			opportunities,
			total,
			hasMore: input.offset + opportunities.length < total,
		};
	});

export const createOpportunity = os
	.input(CreateOpportunityInput)
	.handler(async ({ input }) => {
		return prisma.opportunity.create({
			data: {
				tenantId: input.tenantId,
				title: input.title,
				description: input.description,
				type: input.type,
				location: input.location,
				address: input.address,
				isVirtual: input.isVirtual,
				startDate: input.startDate,
				endDate: input.endDate,
				recurrence: input.recurrence,
				requirements: input.requirements ?? {},
				capacity: input.capacity,
				spotsRemaining: input.capacity,
				tags: input.tags ?? [],
				status: "DRAFT",
			},
		});
	});

export const updateOpportunity = os
	.input(UpdateOpportunityInput)
	.handler(async ({ input }) => {
		const { id, ...data } = input;

		// If capacity is being updated, adjust spotsRemaining
		let spotsRemaining: number | undefined;
		if (data.capacity !== undefined) {
			const current = await prisma.opportunity.findUnique({
				where: { id },
				select: { capacity: true, spotsRemaining: true },
			});
			if (current) {
				const signedUp = current.capacity - current.spotsRemaining;
				spotsRemaining = Math.max(0, data.capacity - signedUp);
			}
		}

		return prisma.opportunity.update({
			where: { id },
			data: {
				...data,
				...(spotsRemaining !== undefined && { spotsRemaining }),
			},
		});
	});

export const publishOpportunity = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		return prisma.opportunity.update({
			where: { id: input.id },
			data: { status: "PUBLISHED" },
		});
	});

export const cancelOpportunity = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		return prisma.opportunity.update({
			where: { id: input.id },
			data: { status: "CANCELLED" },
		});
	});

export const deleteOpportunity = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		await prisma.opportunity.delete({
			where: { id: input.id },
		});
		return { success: true };
	});
