import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.jpeg";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Request Cab", to: "/transport" },
  { label: "Request Professional", to: "/professionals" },
  { label: "Request Service Provider", to: "/services" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isHome ? "glass shadow-md py-3" : "bg-transparent py-5"
        }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 lg:px-8">
        {/* Placeholder to keep nav links centered if needed, or just let them lead-align */}
        <div className="hidden lg:block w-[180px]"></div>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className={`text-base font-semibold transition-colors hover:text-primary ${location.pathname === link.to
                    ? "text-primary"
                    : isTransparent
                      ? "text-sa-white/90 hover:text-sa-white"
                      : "text-slate-600"
                  }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex w-[180px] justify-end">
          {/* Cart */}
          <Link to="/shop" className="relative">
            <Button variant="ghost" size="icon" className={isTransparent ? "text-sa-white hover:bg-sa-white/10" : ""}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sa-red text-xs font-bold text-sa-white">
                {count}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <span className={`text-sm font-medium ${isTransparent ? "text-sa-white" : "text-foreground"}`}>
                <User className="mr-1 inline h-4 w-4" />{user?.name.split(" ")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}
                className={isTransparent ? "text-sa-white hover:bg-sa-white/10" : ""}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm"
                  className={`font-medium ${isTransparent ? "text-sa-white hover:bg-sa-white/10" : ""}`}>
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-purple shadow-glow-purple font-semibold text-primary-foreground hover:opacity-90">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle (kept for functionality) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`lg:hidden absolute right-4 rounded-lg p-2 transition-colors ${isTransparent ? "text-sa-white" : "text-foreground"
            }`}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="glass lg:hidden border-t border-border/30 animate-fade-in">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/10 ${location.pathname === link.to ? "text-primary bg-primary/5" : "text-foreground"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3">
              {isAuthenticated ? (
                <Button variant="outline" className="flex-1" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Log In</Button></Link>
                  <Link to="/register" className="flex-1"><Button className="w-full bg-gradient-purple text-primary-foreground font-semibold">Register</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
