import { Link, NavLink, useNavigate } from "react-router-dom";
import { Gavel, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <Gavel className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">AuctionHub</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {(user?.role === "customer" || user?.role === "admin") && <NavLink to="/auctions" className={navLinkClass}>Auctions</NavLink>}
          {user?.role === "customer" && <NavLink to="/customer" className={navLinkClass}>Customer</NavLink>}
          {user?.role === "vendor" && <NavLink to="/vendor" className={navLinkClass}>Vendor</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/account" className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 sm:flex">
                <User className="h-4 w-4" />
                {user.name}
              </Link>
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Login
              </Link>
              <Link to="/register" className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
