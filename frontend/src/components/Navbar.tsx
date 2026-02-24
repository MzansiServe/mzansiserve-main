import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.jpeg";
import LoginRequiredModal from "./LoginRequiredModal";
import CartDrawer from "./CartDrawer";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Request Cab", to: "/transport", requiresAuth: true },
  { label: "Request Professional", to: "/professionals", requiresAuth: true },
  { label: "Request Service Provider", to: "/services", requiresAuth: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavLinks = () => {
    const links = [...navLinks];
    
    if (isAuthenticated) {
      if (user?.role === 'client') {
        links.push({ label: "My Bookings", to: "/my-bookings", requiresAuth: true });
      } else if (user?.role === 'driver') {
        links.push({ label: "Dashboard", to: "/dashboard/driver", requiresAuth: true });
      } else if (user?.role === 'professional') {
        links.push({ label: "Dashboard", to: "/dashboard/professional", requiresAuth: true });
      } else if (user?.role === 'service-provider') {
        links.push({ label: "Dashboard", to: "/dashboard/provider", requiresAuth: true });
      } else if (user?.role === 'agent') {
        links.push({ label: "Dashboard", to: "/dashboard/agent", requiresAuth: true });
      } else if (user?.role === 'admin') {
        links.push({ label: "Admin Console", to: "/admin", requiresAuth: true });
      }
    }
    
    return links;
  };

  const dynamicLinks = getNavLinks();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  const handleNavLinkClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    if (link.requiresAuth && !isAuthenticated) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isHome ? "bg-white border-b border-gray-100 py-3 shadow-sm" : "bg-transparent py-6"
        }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-8 lg:px-12">
        {/* Logo Area */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
           <div className={cn("h-8 w-auto flex items-center justify-center overflow-hidden rounded", isTransparent ? "" : "bg-white shadow-sm")}>
              <img src={logo} alt="MzansiServe" className={cn("h-full w-auto object-contain", isTransparent ? "brightness-0 invert" : "")} />
           </div>
           <span className={cn("text-xl font-bold tracking-tighter", isTransparent ? "text-white" : "text-slate-900")}>
             MzansiServe
           </span>
        </div>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex absolute left-1/2 -translate-x-1/2">
          {dynamicLinks.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                onClick={(e) => handleNavLinkClick(e, link)}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-all rounded-full",
                  location.pathname === link.to
                    ? (isTransparent ? "text-white bg-white/20" : "text-primary bg-primary/5")
                    : (isTransparent ? "text-white hover:bg-white/10" : "text-[#484848] hover:bg-slate-50 hover:text-black")
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Cart */}
          <CartDrawer>
            <div className="relative cursor-pointer">
              <Button variant="ghost" size="icon" className={cn("rounded-full", isTransparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-50")}>
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {count}
                </span>
              )}
            </div>
          </CartDrawer>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer hover:shadow-md",
                isTransparent ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-200 text-[#222222]"
              )}>
                <User className="h-4 w-4" />
                <span className="text-sm font-bold">{user?.name?.split(' ')[0]}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}
                className={cn("rounded-full", isTransparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-50")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm"
                  className={cn("font-bold rounded-full", isTransparent ? "text-white hover:bg-white/10" : "text-[#484848] hover:bg-slate-50")}>
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className={cn("rounded-full px-6 font-bold shadow-md transition-all hover:scale-105 active:scale-95", isTransparent ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:opacity-90")}>
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn("lg:hidden rounded-full p-2 transition-colors", isTransparent ? "text-white hover:bg-white/10" : "text-slate-900 hover:bg-slate-100")}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="bg-white lg:hidden border-t border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="container mx-auto flex flex-col gap-1 px-6 py-6">
            {dynamicLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={(e) => handleNavLinkClick(e, link)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-bold transition-all",
                  location.pathname === link.to ? "text-primary bg-primary/5" : "text-[#484848] hover:bg-slate-50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex gap-3">
              {isAuthenticated ? (
                <Button variant="outline" className="flex-1 rounded-xl font-bold border-gray-200" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl font-bold border-gray-200">Log In</Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full rounded-xl font-bold bg-primary text-white">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;
