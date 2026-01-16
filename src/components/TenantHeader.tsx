import { Link } from "@tanstack/react-router";
import {
	SignedIn,
	SignInButton,
	SignedOut,
	UserButton,
} from "@clerk/clerk-react";
import { useTenant } from "@/lib/tenant-context";
import {
	Calendar,
	ClipboardList,
	LayoutDashboard,
	Menu,
	X,
	Home,
} from "lucide-react";
import { useState } from "react";

export default function TenantHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const { tenant, membership, isCoordinator } = useTenant();

	const navLinks = [
		{
			to: "/$tenantSlug" as const,
			params: { tenantSlug: tenant.slug },
			label: "Home",
			icon: <Home className="w-5 h-5" />,
			show: true,
		},
		{
			to: "/$tenantSlug/opportunities" as const,
			params: { tenantSlug: tenant.slug },
			label: "Opportunities",
			icon: <Calendar className="w-5 h-5" />,
			show: true,
		},
		{
			to: "/$tenantSlug/my-signups" as const,
			params: { tenantSlug: tenant.slug },
			label: "My Signups",
			icon: <ClipboardList className="w-5 h-5" />,
			show: !!membership,
		},
		{
			to: "/$tenantSlug/manage" as const,
			params: { tenantSlug: tenant.slug },
			label: "Manage",
			icon: <LayoutDashboard className="w-5 h-5" />,
			show: isCoordinator,
		},
	];

	return (
		<header className="bg-slate-900 border-b border-slate-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6">
				<div className="flex items-center justify-between h-16">
					{/* Logo / Tenant Name */}
					<Link
						to="/$tenantSlug"
						params={{ tenantSlug: tenant.slug }}
						className="flex items-center gap-3"
					>
						{tenant.logo ? (
							<img
								src={tenant.logo}
								alt={tenant.name}
								className="w-8 h-8 rounded-lg"
							/>
						) : (
							<div
								className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
								style={{ backgroundColor: tenant.primaryColor || "#3b82f6" }}
							>
								{tenant.name.charAt(0)}
							</div>
						)}
						<span className="text-lg font-semibold text-white hidden sm:block">
							{tenant.name}
						</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-1">
						{navLinks
							.filter((link) => link.show)
							.map((link) => (
								<Link
									key={link.to}
									to={link.to}
									params={link.params}
									className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
									activeProps={{
										className:
											"px-3 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg",
									}}
									activeOptions={{ exact: link.to === "/$tenantSlug" }}
								>
									{link.label}
								</Link>
							))}
					</nav>

					{/* Right side */}
					<div className="flex items-center gap-4">
						<SignedOut>
							<SignInButton mode="modal">
								<button
									type="button"
									className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
								>
									Sign In
								</button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<UserButton
								appearance={{
									elements: {
										avatarBox: "w-9 h-9",
									},
								}}
							/>
						</SignedIn>

						{/* Mobile menu button */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
						>
							{mobileMenuOpen ? (
								<X className="w-6 h-6" />
							) : (
								<Menu className="w-6 h-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Navigation */}
			{mobileMenuOpen && (
				<nav className="md:hidden border-t border-slate-800 px-4 py-3 space-y-1">
					{navLinks
						.filter((link) => link.show)
						.map((link) => (
							<Link
								key={link.to}
								to={link.to}
								params={link.params}
								onClick={() => setMobileMenuOpen(false)}
								className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
								activeProps={{
									className:
										"flex items-center gap-3 px-3 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg",
								}}
								activeOptions={{ exact: link.to === "/$tenantSlug" }}
							>
								{link.icon}
								{link.label}
							</Link>
						))}
				</nav>
			)}
		</header>
	);
}
