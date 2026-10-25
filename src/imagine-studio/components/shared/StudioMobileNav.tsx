// @ts-nocheck -- Imagine Studio v2
/**
 * Mobile wayfinding for the studio family of pages. On phones the Imagine
 * Engine builder and the 3D Studio used to be dead ends from each other;
 * this bottom bar (small screens only, and only when the page is NOT
 * embedded inside the builder) links the whole set together.
 */
import { Link, useLocation } from "react-router-dom";
import { Bot, Box, LayoutGrid, Sparkles, Users } from "lucide-react";

const LINKS = [
  { to: "/imagine-engine", label: "Engine", icon: Sparkles },
  { to: "/imagine-studio", label: "3D Studio", icon: Box },
  { to: "/levels", label: "Worlds", icon: LayoutGrid },
  { to: "/plaza", label: "Plaza", icon: Users },
  { to: "/office", label: "Office", icon: Bot },
];

export default function StudioMobileNav() {
  const { pathname } = useLocation();
  if (typeof window !== "undefined" && window.parent !== window) return null; // embedded: the builder bar already navigates
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[90] border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/imagine-engine" && pathname.startsWith(to + "/"));
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
