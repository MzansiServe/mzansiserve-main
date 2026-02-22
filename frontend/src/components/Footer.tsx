import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const footerLinks = {
  Services: [
    { label: "Transport & Cabs", to: "/transport" },
    { label: "Professional Services", to: "/professionals" },
    { label: "Home & Garden", to: "/services" },
    { label: "Events & Entertainment", to: "/services" },
    { label: "E-Commerce Shop", to: "/shop" },
  ],
  Company: [
    { label: "About Us", to: "/about" },
    { label: "How It Works", to: "/about" },
    { label: "Careers", to: "/about" },
    { label: "Contact Us", to: "/about" },
  ],
  Support: [
    { label: "Help Centre", to: "/about" },
    { label: "Safety Guidelines", to: "/about" },
    { label: "Terms of Service", to: "/about" },
    { label: "Privacy Policy", to: "/about" },
  ],
};

const Footer = () => (
  <footer className="border-t border-border bg-sa-black text-sa-white/80">
    <div className="container mx-auto px-4 py-16 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-auto items-center justify-center overflow-hidden rounded-lg">
              <img
                src={logo}
                alt="MzansiServe"
                className="h-full w-auto object-contain"
                style={{ filter: "invert(1) grayscale(1) brightness(1.5)", mixBlendMode: "screen" }}
              />
            </div>
            <span className="text-xl font-bold text-sa-white">
              Mzansi<span className="text-accent">Serve</span>
            </span>
          </Link>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-sa-white/60">
            South Africa's comprehensive service marketplace. Book transport, hire professionals, request services, and shop — all in one trusted platform.
          </p>
          <div className="space-y-3 text-sm text-sa-white/60">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>Johannesburg, Gauteng, South Africa</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span>+27 (0) 11 000 0000</span></div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span>info@mzansiserve.co.za</span></div>
          </div>
        </div>

        {/* Links */}
        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sa-white">{heading}</h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-sa-white/50 transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    <div className="border-t border-sa-white/10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-sa-white/40 sm:flex-row lg:px-8">
        <p>© {new Date().getFullYear()} MzansiServe (Pty) Ltd. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/about" className="transition-colors hover:text-sa-white">Terms</Link>
          <Link to="/about" className="transition-colors hover:text-sa-white">Privacy</Link>
          <Link to="/about" className="transition-colors hover:text-sa-white">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
