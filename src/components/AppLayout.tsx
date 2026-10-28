import { NavLink, Outlet } from "react-router-dom";
import {
  Bike,
  LayoutDashboard,
  Package,
  Wallet,
  History,
  UserRound,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/offers", label: "Jobs", icon: Package },
  {
    label: "Earnings",
    to: "/earnings",
    icon: Wallet,
  },
  {
    label: "History",
    to: "/delivery-history",
    icon: History,
  },
  {
    label: "Profile",
    to: "/profile",
    icon: UserRound,
  },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-4">
          <Bike className="text-primary" size={24} />
          <span className="text-lg font-bold">GoRide Rider</span>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-violet-600"
                }`
              }
            >
              <Icon size={22} strokeWidth={1.8} />

              <span className="w-full truncate text-center text-[10px] font-medium leading-tight sm:text-xs">
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
