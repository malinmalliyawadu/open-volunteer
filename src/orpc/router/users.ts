import { os } from "@orpc/server";
import { z } from "zod";
import { prisma } from "@/db";
import { UpdateUserInput } from "@/orpc/schema";

// Sync user from Clerk - called on login
export const syncUser = os
	.input(
		z.object({
			clerkId: z.string(),
			email: z.string().email(),
			name: z.string().nullable().optional(),
			avatarUrl: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input }) => {
		// Check if user with this email already exists (e.g., invited user)
		const existingByEmail = await prisma.user.findUnique({
			where: { email: input.email },
		});

		if (existingByEmail) {
			// Link Clerk ID if it was a pending invite
			if (existingByEmail.clerkId.startsWith("pending_")) {
				return prisma.user.update({
					where: { id: existingByEmail.id },
					data: {
						clerkId: input.clerkId,
						name: input.name ?? existingByEmail.name,
						avatarUrl: input.avatarUrl ?? existingByEmail.avatarUrl,
					},
				});
			}
			// Already linked, just update profile
			return prisma.user.update({
				where: { id: existingByEmail.id },
				data: {
					name: input.name ?? existingByEmail.name,
					avatarUrl: input.avatarUrl ?? existingByEmail.avatarUrl,
				},
			});
		}

		// Check if user exists by Clerk ID
		const existingByClerkId = await prisma.user.findUnique({
			where: { clerkId: input.clerkId },
		});

		if (existingByClerkId) {
			return prisma.user.update({
				where: { id: existingByClerkId.id },
				data: {
					email: input.email,
					name: input.name ?? existingByClerkId.name,
					avatarUrl: input.avatarUrl ?? existingByClerkId.avatarUrl,
				},
			});
		}

		// Create new user
		return prisma.user.create({
			data: {
				clerkId: input.clerkId,
				email: input.email,
				name: input.name,
				avatarUrl: input.avatarUrl,
			},
		});
	});

export const getUser = os
	.input(z.object({ clerkId: z.string() }))
	.handler(async ({ input }) => {
		return prisma.user.findUnique({
			where: { clerkId: input.clerkId },
		});
	});

export const getUserById = os
	.input(z.object({ id: z.string() }))
	.handler(async ({ input }) => {
		return prisma.user.findUnique({
			where: { id: input.id },
		});
	});

export const updateUser = os
	.input(z.object({ id: z.string() }).merge(UpdateUserInput))
	.handler(async ({ input }) => {
		const { id, ...data } = input;
		return prisma.user.update({
			where: { id },
			data,
		});
	});
