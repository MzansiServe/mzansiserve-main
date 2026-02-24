import type { ServiceProvider } from "@/lib/mock-data";
import { BadgeCheck, Clock, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Augment the ServiceProvider type locally to include bannerImage optionally since it's not in mock-data
type ExtendedServiceProvider = ServiceProvider & { bannerImage?: string };

const ProviderCard = ({ provider }: { provider: ExtendedServiceProvider }) => {
  const navigate = useNavigate();

  // Generate a random gradient or use a fixed one if no banner image is provided
  const fallbackBannerClass = "bg-gradient-to-r from-purple-500 to-indigo-600";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
      {/* Banner Image / Gradient Pattern */}
      <div className={`h-24 w-full relative ${provider.bannerImage ? '' : fallbackBannerClass}`}>
        {provider.bannerImage && (
          <img
            src={provider.bannerImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        {/* Verified badge */}
        {provider.verified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-emerald-600 shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative">
        {/* Avatar positioned over the banner seam */}
        <div className="-mt-10 mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-1 shadow-md border border-slate-100 z-10 overflow-hidden">
          {provider.image && provider.image !== "/placeholder.svg" ? (
            <img src={provider.image} alt={provider.name} className="h-full w-full rounded-xl object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-purple text-primary-foreground text-xl font-bold">
              {provider.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
          )}
        </div>

        <h3 className="mb-1 text-lg font-semibold">{provider.name}</h3>

        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{provider.subcategory}</span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{provider.description}</p>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-accent">
            <Star className="h-4 w-4 fill-current" /> {provider.rating}
            <span className="text-muted-foreground">({provider.reviews})</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {provider.location}
          </span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
          <div>
            <span className="text-lg font-bold text-foreground">{provider.price}</span>
            <span className="text-sm text-muted-foreground">{provider.priceUnit}</span>
          </div>
          <Button
            size="sm"
            className="bg-gradient-purple text-primary-foreground shadow-glow-purple hover:opacity-90"
            onClick={() => navigate(`/book/${provider.category.toLowerCase()}/${provider.id}`)}
            disabled={!provider.available}
          >
            {provider.available ? "Book Now" : (
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Unavailable</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
