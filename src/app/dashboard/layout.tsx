"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  Home,
  LayoutDashboard,
  BookOpen,
  Bot,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  GitCompare,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HouseholdProvider } from "@/providers/household-context";
import { useAuth } from "@/providers/auth-context";
import { signOut } from "@/providers/auth";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/dashboard/car", label: "Car Insurance", icon: Car },
  { href: "/dashboard/home", label: "Home Insurance", icon: Home },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
  { href: "/dashboard/education", label: "Learn", icon: BookOpen },
  { href: "/dashboard/assistant", label: "Ask AI", icon: Bot },
  { href: "/dashboard/account", label: "Account", icon: Settings },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      {...(onClick ? { onClick } : {})}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function Sidebar({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <aside className="flex h-full flex-col gap-2 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="font-semibold">InsureWise</span>
      </div>

      <Separator className="my-1" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} {...(onClose ? { onClick: onClose } : {})} />
        ))}
      </nav>

      <Separator className="my-1" />

      {/* Footer */}
      <div className="space-y-1">
        {user?.email && (
          <p className="truncate px-3 text-xs text-muted-foreground">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Client-side auth guard (middleware handles server-side)
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <HouseholdProvider>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden w-56 shrink-0 border-r bg-card lg:block">
          <Sidebar />
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-56 border-r bg-card transition-transform lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Sidebar onClose={() => setMobileOpen(false)} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile header */}
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold">InsureWise</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </HouseholdProvider>
  );
}
