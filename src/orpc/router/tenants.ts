import { os } from "@orpc/server";
import { z } from "zod";
import { prisma } from "@/db";
import { CreateTenantInput, UpdateTenantInput } from "@/orpc/schema";

export const getTenant = os
	.input(z.object({ slug: z.string() }))
	.handler(async ({ input }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { slug: input.slug },
		});
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		return tenant;
	});

export const getTenantById = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		const tenant = await prisma.tenant.findUnique({
			where: { id: input.id },
		});
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		return tenant;
	});

export const listTenants = os.input(z.object({})).handler(async () => {
	return prisma.tenant.findMany({
		orderBy: { name: "asc" },
	});
});

export const createTenant = os
	.input(CreateTenantInput)
	.handler(async ({ input }) => {
		const existing = await prisma.tenant.findUnique({
			where: { slug: input.slug },
		});
		if (existing) {
			throw new Error("Tenant slug already exists");
		}

		return prisma.tenant.create({
			data: {
				slug: input.slug,
				name: input.name,
				logo: input.logo,
				primaryColor: input.primaryColor ?? "#3b82f6",
				accentColor: input.accentColor ?? "#10b981",
			},
		});
	});

export const updateTenant = os
	.input(z.object({ id: z.string() }).merge(UpdateTenantInput))
	.handler(async ({ input }) => {
		const { id, ...data } = input;
		return prisma.tenant.update({
			where: { id },
			data,
		});
	});

export const deleteTenant = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		await prisma.tenant.delete({
			where: { id: input.id },
		});
		return { success: true };
	});
