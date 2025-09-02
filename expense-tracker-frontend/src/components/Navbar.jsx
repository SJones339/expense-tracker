import { NavLink, Link } from "react-router-dom";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Transactions", href: "/transactions", icon: "💸" },
  { name: "Categories", href: "/categories", icon: "🏷️" },
  { name: "Accounts", href: "/accounts", icon: "🏦" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
  { name: "Budgets", href: "/budgets", icon: "💰" },
];

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-neutral-900/70 backdrop-blur">
      
      <div className="container mx-auto max-w-7xl px-4">
        <div className="h-14 flex items-center justify-between">
          {/* Brand */}
          <Link to="/dashboard" className="text-lg font-semibold text-white">
            Expense Tracker
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "text-sm font-medium transition-colors px-1 py-0.5",
                    isActive
                      ? "text-white"
                      : "text-gray-300 hover:text-white",
                  ].join(" ")
                }
                end
              >
                <span className="mr-1">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
