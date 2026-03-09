import { NavLink, Link } from "react-router";
import { useState } from "react";
import ConnectButton from "../wallet/ConnectButton";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/vault", label: "Vault" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-nil-border/40">
      <div className="max-w-[1440px] mx-auto h-14 px-6 lg:px-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 text-nil-white group">
          <img src="/assets/logo_without_company_name.png" alt="nil" className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
          <span className="font-semibold text-xl tracking-tight">nil</span>
        </Link>

        {/* Desktop Nav + Button */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm px-4 py-1.5 rounded-lg transition-all duration-200 ${isActive
                    ? "text-nil-white bg-nil-elevated"
                    : "text-nil-grey hover:text-nil-white hover:bg-nil-elevated/50"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="w-px h-5 bg-nil-border/60" />
          <ConnectButton />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-nil-white p-2 rounded-lg hover:bg-nil-elevated transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-nil-border/40 px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block text-sm px-4 py-2.5 rounded-lg transition-all ${isActive ? "text-nil-white bg-nil-elevated" : "text-nil-grey hover:text-nil-white hover:bg-nil-elevated/50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-nil-border mt-2">
            <ConnectButton />
          </div>
        </div>
      )}
    </nav>
  );
}
