import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/db";

export const getTenantBySlug = createServerFn({ method: "GET" })
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug },
		});
		return tenant;
	});

export const getAllTenants = createServerFn({ method: "GET" }).handler(
	async () => {
		const tenants = await prisma.tenant.findMany({
			orderBy: { name: "asc" },
		});
		return tenants;
	},
);

export const getOpportunityById = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		const opportunity = await prisma.opportunity.findUnique({
			where: { id },
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
		return opportunity;
	});

export const getOpportunitiesByTenant = createServerFn({ method: "GET" })
	.inputValidator(
		(input: {
			tenantSlug: string;
			type?: "EVENT" | "SHIFT" | "PROJECT";
			search?: string;
			page?: number;
		}) => input,
	)
	.handler(async ({ data }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: data.tenantSlug },
		});

		if (!tenant) {
			return { opportunities: [], total: 0 };
		}

		const limit = 12;
		const offset = ((data.page ?? 1) - 1) * limit;

		const where: Parameters<typeof prisma.opportunity.findMany>[0]["where"] = {
			tenantId: tenant.id,
			status: "PUBLISHED",
		};

		if (data.type) {
			where.type = data.type;
		}

		if (data.search) {
			where.OR = [
				{ title: { contains: data.search, mode: "insensitive" } },
				{ description: { contains: data.search, mode: "insensitive" } },
			];
		}

		const [opportunities, total] = await Promise.all([
			prisma.opportunity.findMany({
				where,
				orderBy: { startDate: "asc" },
				take: limit,
				skip: offset,
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

		return { opportunities, total };
	});

export const getTenantHomeData = createServerFn({ method: "GET" })
	.inputValidator((tenantSlug: string) => tenantSlug)
	.handler(async ({ data: tenantSlug }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: tenantSlug },
		});

		if (!tenant) {
			return { opportunities: [], hasMore: false };
		}

		const opportunities = await prisma.opportunity.findMany({
			where: {
				tenantId: tenant.id,
				status: "PUBLISHED",
			},
			orderBy: { startDate: "asc" },
			take: 12,
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
		});

		const total = await prisma.opportunity.count({
			where: {
				tenantId: tenant.id,
				status: "PUBLISHED",
			},
		});

		return {
			opportunities,
			hasMore: total > 12,
		};
	});

export const getManageDashboardData = createServerFn({ method: "GET" })
	.inputValidator((tenantSlug: string) => tenantSlug)
	.handler(async ({ data: tenantSlug }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: tenantSlug },
		});

		if (!tenant) {
			return {
				opportunities: [],
				membersTotal: 0,
				pendingApplicationsCount: 0,
			};
		}

		const [opportunities, membersTotal, pendingApplications] =
			await Promise.all([
				prisma.opportunity.findMany({
					where: { tenantId: tenant.id },
					orderBy: { createdAt: "desc" },
					take: 100,
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
				prisma.tenantMember.count({
					where: {
						tenantId: tenant.id,
						status: "ACTIVE",
					},
				}),
				prisma.opportunitySignup.count({
					where: {
						status: "APPLIED",
						opportunity: {
							tenantId: tenant.id,
						},
					},
				}),
			]);

		return {
			opportunities,
			membersTotal,
			pendingApplicationsCount: pendingApplications,
		};
	});

export const getApplicationsData = createServerFn({ method: "GET" })
	.inputValidator(
		(input: { tenantSlug: string; status?: "APPLIED" | "APPROVED" | "all" }) =>
			input,
	)
	.handler(async ({ data }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: data.tenantSlug },
		});

		if (!tenant) {
			return { applications: [] };
		}

		const statusFilter = data.status === "all" ? undefined : data.status;

		const applications = await prisma.opportunitySignup.findMany({
			where: {
				...(statusFilter ? { status: statusFilter } : {}),
				opportunity: {
					tenantId: tenant.id,
				},
			},
			orderBy: { appliedAt: "desc" },
			take: 100,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
					},
				},
				opportunity: {
					select: {
						id: true,
						title: true,
						startDate: true,
					},
				},
			},
		});

		return { applications };
	});

export const getMembersData = createServerFn({ method: "GET" })
	.inputValidator(
		(input: {
			tenantSlug: string;
			role?: "ADMIN" | "COORDINATOR" | "VOLUNTEER";
			search?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: data.tenantSlug },
		});

		if (!tenant) {
			return { members: [], total: 0 };
		}

		const where: Parameters<typeof prisma.tenantMember.findMany>[0]["where"] = {
			tenantId: tenant.id,
		};

		if (data.role) {
			where.role = data.role;
		}

		if (data.search) {
			where.user = {
				OR: [
					{ name: { contains: data.search, mode: "insensitive" } },
					{ email: { contains: data.search, mode: "insensitive" } },
				],
			};
		}

		const [members, total] = await Promise.all([
			prisma.tenantMember.findMany({
				where,
				orderBy: { joinedAt: "desc" },
				take: 50,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							avatarUrl: true,
						},
					},
				},
			}),
			prisma.tenantMember.count({ where }),
		]);

		return { members, total };
	});
