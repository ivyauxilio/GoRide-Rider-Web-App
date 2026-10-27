import { NavLink, Outlet } from "react-router-dom";
import { Bike, LayoutDashboard, Package } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/offers", label: "Offers", icon: Package },
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

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white">
        <div className="mx-auto grid max-w-3xl grid-cols-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                  isActive ? "text-primary" : "text-gray-400"
                }`
              }
            >
              <Icon size={23} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
