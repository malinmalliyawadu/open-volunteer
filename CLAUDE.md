# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run test         # Run all tests with Vitest
npm run check        # Run Biome linting and formatting check
npm run lint         # Lint only
npm run format       # Format only

# Database (Prisma with PostgreSQL)
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database

# Deployment (Cloudflare Workers)
npm run deploy       # Build and deploy to Cloudflare
```

Run a single test file: `npx vitest run path/to/test.ts`

## Architecture

**TanStack Start** full-stack React framework with:
- **File-based routing** in `src/routes/` - TanStack Router auto-generates `routeTree.gen.ts`
- **SSR on Cloudflare Workers** via `@cloudflare/vite-plugin` and wrangler
- **React Compiler** enabled via babel plugin

**API Layer:**
- **oRPC** for type-safe RPC - router defined in `src/orpc/router/`, served at `/api/rpc`
- Isomorphic client in `src/orpc/client.ts` - direct call on server, fetch on client
- TanStack Query integration via `createTanstackQueryUtils`

**Database:**
- **Prisma** with PostgreSQL adapter (`@prisma/adapter-pg`)
- Schema in `prisma/schema.prisma`, generated client outputs to `src/generated/prisma`
- Environment: set `DATABASE_URL` in `.env.local`

**Authentication:** Clerk (`@clerk/clerk-react`), set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`

**Styling:** Tailwind CSS v4, Shadcn UI components

**Code Style (Biome):**
- Tabs for indentation, double quotes for strings
- Files prefixed with `demo` are examples and can be deleted

## Volunteer Portal Architecture

**Multi-tenant** - Each organization (Tenant) has isolated data with custom branding.

**Data Model:**
- `Tenant` - Organization with branding (logo, colors) and custom terminology
- `User` - Linked to Clerk via clerkId, has skills and availability
- `TenantMember` - Join table with role (ADMIN/COORDINATOR/VOLUNTEER) and status
- `Opportunity` - Volunteer opportunity (EVENT/SHIFT/PROJECT) with capacity
- `OpportunitySignup` - Application with status workflow (APPLIED→APPROVED→COMPLETED)

**Route Structure:**
```
/                                    # Landing - tenant directory
/$tenantSlug/                        # Tenant home - opportunity feed
/$tenantSlug/opportunities           # Browse opportunities
/$tenantSlug/opportunities/$id       # Opportunity detail + apply
/$tenantSlug/opportunities/new       # Create opportunity (coordinator+)
/$tenantSlug/my-signups              # Volunteer's signups dashboard
/$tenantSlug/manage                  # Coordinator dashboard
/$tenantSlug/manage/applications     # Review applications
/$tenantSlug/manage/members          # Manage volunteers (admin)
/$tenantSlug/settings                # Org settings (admin)
```

**Tenant Context:** `useTenant()` hook provides tenant, membership, role checks (`isAdmin`, `isCoordinator`), and terminology helper `t()`.

**oRPC Routers:**
- `tenants.ts` - CRUD, branding settings
- `opportunities.ts` - CRUD, publish/cancel, search with filters
- `signups.ts` - apply, approve/decline/waitlist, withdraw
- `members.ts` - invite, role management, join tenant
- `users.ts` - sync from Clerk, profile updates

## SSR Data Fetching

**Important:** Do NOT use `useQuery` for initial data loading in page components. It causes SSR hydration errors because React Query context isn't available during server rendering.

**Use route loaders instead:**
```tsx
// ✅ Correct - use loader for SSR data
export const Route = createFileRoute("/path")({
  component: MyPage,
  loader: async ({ params }) => {
    const data = await prisma.model.findMany();
    return { data };
  },
});

function MyPage() {
  const { data } = Route.useLoaderData();
  // ...
}

// ❌ Wrong - useQuery breaks SSR
function MyPage() {
  const { data } = useQuery(orpc.getData.queryOptions({ input: {} }));
  // This causes: "Invalid hook call" or "Cannot read properties of null"
}
```

**When to use `useQuery`:**
- Client-only data that depends on auth state (e.g., user membership)
- Data that should refetch on client navigation
- Must have `enabled: false` initially or depend on client-only state

## Adding Shadcn Components

```bash
pnpm dlx shadcn@latest add <component>
```
