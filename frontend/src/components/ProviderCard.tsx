import { Star, MapPin, BadgeCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceProvider } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

const ProviderCard = ({ provider }: { provider: ServiceProvider }) => {
  const navigate = useNavigate();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Verified badge */}
      {provider.verified && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <BadgeCheck className="h-3.5 w-3.5" /> Verified
        </div>
      )}

      {/* Avatar placeholder */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-purple text-primary-foreground text-lg font-bold">
        {provider.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
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

      <div className="flex items-center justify-between">
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
  );
};

export default ProviderCard;
