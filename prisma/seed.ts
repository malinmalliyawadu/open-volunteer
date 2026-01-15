import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🌱 Seeding database...");

	// Create a demo tenant
	const tenant = await prisma.tenant.upsert({
		where: { slug: "demo-org" },
		update: {},
		create: {
			slug: "demo-org",
			name: "Demo Organization",
			primaryColor: "#3b82f6",
			accentColor: "#10b981",
			terminology: {
				volunteer: "Helper",
				volunteers: "Helpers",
				opportunity: "Service",
				opportunities: "Services",
			},
		},
	});
	console.log(`✅ Created tenant: ${tenant.name}`);

	// Create demo opportunities
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);

	const opportunities = await Promise.all([
		prisma.opportunity.upsert({
			where: { id: "demo-event-1" },
			update: {},
			create: {
				id: "demo-event-1",
				tenantId: tenant.id,
				title: "Community Garden Cleanup",
				description:
					"Help us prepare the community garden for spring planting! We'll be clearing debris, turning soil, and setting up new garden beds.",
				type: "EVENT",
				status: "PUBLISHED",
				location: "Community Garden",
				address: "123 Garden Lane, Springfield",
				isVirtual: false,
				startDate: tomorrow,
				endDate: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
				capacity: 20,
				spotsRemaining: 20,
				tags: ["outdoor", "gardening"],
				requirements: {
					minAge: 14,
					skills: ["gardening"],
				},
			},
		}),
		prisma.opportunity.upsert({
			where: { id: "demo-shift-1" },
			update: {},
			create: {
				id: "demo-shift-1",
				tenantId: tenant.id,
				title: "Food Bank Weekly Shift",
				description:
					"Sort and package food donations at our local food bank. This is a recurring weekly shift.",
				type: "SHIFT",
				status: "PUBLISHED",
				location: "Springfield Food Bank",
				address: "456 Helping Hand Ave",
				isVirtual: false,
				startDate: nextWeek,
				endDate: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000),
				recurrence: "weekly",
				capacity: 10,
				spotsRemaining: 10,
				tags: ["food bank", "sorting"],
				requirements: {},
			},
		}),
		prisma.opportunity.upsert({
			where: { id: "demo-project-1" },
			update: {},
			create: {
				id: "demo-project-1",
				tenantId: tenant.id,
				title: "Website Redesign Project",
				description:
					"Help our nonprofit redesign their website. Looking for volunteers with web development or design skills.",
				type: "PROJECT",
				status: "PUBLISHED",
				isVirtual: true,
				startDate: tomorrow,
				capacity: 5,
				spotsRemaining: 5,
				tags: ["tech", "design", "remote"],
				requirements: {
					skills: ["web development", "design"],
				},
			},
		}),
	]);

	console.log(`✅ Created ${opportunities.length} opportunities`);
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
