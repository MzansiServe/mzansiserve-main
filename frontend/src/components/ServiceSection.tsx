import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, Truck, Bike, Bus,
  Scale, Stethoscope, Calculator, HardHat,
  Home, Sparkles, UtensilsCrossed, Music,
  ShoppingBag, Shirt, Smartphone, Gift,
  ArrowRight, Briefcase, Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface ServiceCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ServiceSectionProps {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  cards: ServiceCard[];
  accentClass: string;
  badgeClass: string;
  link: string;
}

// Icon mapping helpers
const transportIcons: Record<string, LucideIcon> = {
  'sedan': Car,
  'bakkie': Truck,
  'minibus': Bus,
  'bike': Bike
};

const profIcons: Record<string, LucideIcon> = {
  'legal': Scale,
  'medical': Stethoscope,
  'financial': Calculator,
  'engineering': HardHat
};

const serviceIcons: Record<string, LucideIcon> = {
  'home': Home,
  'health': Sparkles,
  'catering': UtensilsCrossed,
  'events': Music
};

const shopIcons: Record<string, LucideIcon> = {
  'fashion': Shirt,
  'electronics': Smartphone,
  'gifts': Gift,
  'home': Home
};

const getIcon = (name: string | undefined, mapping: Record<string, LucideIcon>, fallback: LucideIcon): LucideIcon => {
  if (!name) return fallback;
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(mapping)) {
    if (lowerName.includes(key)) return icon;
  }
  return fallback;
};

const SectionBlock = ({ section, index }: { section: ServiceSectionProps; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      className={`py-20 lg:py-28 ${index % 2 === 1 ? "bg-secondary/50" : ""}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 flex items-end justify-between"
        >
          <div className="max-w-2xl">
            <span className={`mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${section.badgeClass}`}>
              {section.badge}
            </span>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">{section.title}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{section.subtitle}</p>
          </div>
          <Button variant="ghost" className="hidden lg:flex items-center gap-2 text-primary" onClick={() => navigate(section.link)}>
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {section.cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              onClick={() => navigate(section.link)}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors duration-300 ${section.accentClass}`}>
                <card.icon className="h-6 w-6 text-muted-foreground transition-colors duration-300 group-hover:text-inherit" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-6 text-center lg:hidden">
          <Button variant="outline" className="gap-2" onClick={() => navigate(section.link)}>
            View All {section.badge} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

const ServiceSections = () => {
  const [sections, setSections] = useState<ServiceSectionProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        // Fetch dynamic data
        // Note: For 'transport', we don't have a specific endpoint yet, so we use static fallbacks mixed with dynamic where available
        const serviceTypesRes = await apiFetch("/api/auth/service-types");
        const shopCatRes = await apiFetch("/api/shop/categories");

        const serviceTypes = serviceTypesRes?.data?.service_types || [];
        const shopCategories = shopCatRes?.data?.categories || [];

        // Filter service types
        const profTypes = serviceTypes.filter((s: any) => s.category === 'Professional').slice(0, 4);
        const spTypes = serviceTypes.filter((s: any) => s.category === 'Service Provider').slice(0, 4);
        const shopCats = shopCategories.slice(0, 4);


        const dynamicSections: ServiceSectionProps[] = [
          {
            id: "transport",
            badge: "Transport & Drivers",
            title: "Get Moving with Verified Drivers",
            subtitle: "Choose from a range of vehicles and verified drivers across South Africa.",
            accentClass: "group-hover:text-primary",
            badgeClass: "bg-primary/10 text-primary",
            link: "/transport",
            cards: [
              { icon: Car, title: "Sedan & Hatchback", description: "Affordable everyday rides with professional drivers." },
              { icon: Truck, title: "Bakkie & LDV", description: "Moving goods? Book a bakkie for deliveries and removals." },
              { icon: Bus, title: "Shuttle & Minibus", description: "Group transport for events, airports, and corporate trips." },
              { icon: Bike, title: "Bike Delivery", description: "Fast document and parcel delivery via motorcycle couriers." },
            ],
          },
          {
            id: "professionals",
            badge: "Professional Services",
            title: "Hire Accredited Experts",
            subtitle: "All professionals are verified. Quality you can trust.",
            accentClass: "group-hover:text-sa-blue",
            badgeClass: "bg-sa-blue/10 text-sa-blue",
            link: "/professionals",
            cards: profTypes.length > 0 ? profTypes.map((t: any) => ({
              icon: getIcon(t.name, profIcons, Briefcase),
              title: t.name,
              description: t.description || `Expert ${t.name} services.`
            })) : [
              { icon: Scale, title: "Legal Experts", description: "Lawyers, conveyancers, and compliance consultants." },
              { icon: Stethoscope, title: "Medical Professionals", description: "Doctors, nurses, psychologists, and therapists." },
              { icon: Calculator, title: "Financial Services", description: "Accountants, actuaries, tax advisors, and auditors." },
              { icon: HardHat, title: "Engineering & Construction", description: "Engineers, architects, project managers, and builders." }
            ],
          },
          {
            id: "services",
            badge: "Home & Service Providers",
            title: "Services at Your Doorstep",
            subtitle: "From home repairs to event planning, find trusted service providers for every need.",
            accentClass: "group-hover:text-accent",
            badgeClass: "bg-accent/15 text-accent-foreground",
            link: "/services",
            cards: spTypes.length > 0 ? spTypes.map((t: any) => ({
              icon: getIcon(t.name, serviceIcons, Wrench),
              title: t.name,
              description: t.description || `Trusted ${t.name} services.`
            })) : [
              { icon: Home, title: "Home & Garden", description: "Cleaning, plumbing, electrical, garden maintenance, and more." },
              { icon: Sparkles, title: "Health & Beauty", description: "Salons, personal trainers, spa treatments, and wellness." },
              { icon: UtensilsCrossed, title: "Catering & Chefs", description: "Private chefs, catering for events, and meal prep services." },
              { icon: Music, title: "Events & Entertainment", description: "DJs, event managers, sound rental, and venue booking." }
            ],
          },
          {
            id: "shop",
            badge: "E-Commerce Marketplace",
            title: "Shop Local, Support Mzansi",
            subtitle: "Browse thousands of products from verified local sellers.",
            accentClass: "group-hover:text-sa-red",
            badgeClass: "bg-sa-red/10 text-sa-red",
            link: "/shop",
            cards: shopCats.length > 0 ? shopCats.map((c: any) => ({
              icon: getIcon(c.title, shopIcons, ShoppingBag),
              title: c.title,
              description: c.description || `Discover ${c.title} products.`
            })) : [
              { icon: ShoppingBag, title: "Fashion & Accessories", description: "Clothing, shoes, bags, and jewellery from local brands." },
              { icon: Smartphone, title: "Electronics & Tech", description: "Gadgets, phones, laptops, and tech accessories." },
              { icon: Gift, title: "Gifts & Handmade", description: "Unique handcrafted goods and personalised gifts." },
              { icon: Shirt, title: "Home & Living", description: "Furniture, décor, kitchen essentials, and appliances." }
            ],
          },
        ];

        setSections(dynamicSections);
      } catch (error) {
        console.error("Failed to load dynamic sections:", error);
        setSections([]); // Will fallback to static inside map if needed, or handle empty state
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  if (loading) {
    return <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <>
      {sections.map((section, index) => (
        <SectionBlock key={section.id} section={section} index={index} />
      ))}
    </>
  );
};

export default ServiceSections;
