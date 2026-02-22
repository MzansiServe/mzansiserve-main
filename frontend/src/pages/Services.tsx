import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchFilter from "@/components/SearchFilter";
import ProviderCard from "@/components/ProviderCard";
import { serviceSubcategories } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import BookingStepWizard from "@/components/BookingStepWizard";

const categories = ["Transport", "Professionals", "Services"] as const;

const Services = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [location, setLocation] = useState("all");

  const { data: prosResult, isLoading: loadingPros, error: errorPros } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => apiFetch('/api/profile/professionals')
  });

  const { data: providersResult, isLoading: loadingProviders, error: errorProviders } = useQuery({
    queryKey: ['service-providers'],
    queryFn: () => apiFetch('/api/profile/service-providers')
  });

  const allProviders = useMemo(() => {
    const pros = prosResult?.data?.professionals || [];
    const providers = providersResult?.data?.service_providers || [];

    const mappedPros = pros.map((p: any) => {
      const user = p.professional;
      const data = user.data || {};
      const fullName = `${data.full_name || ''} ${data.surname || ''}`.trim();
      const firstService = p.services && p.services.length > 0 ? p.services[0] : null;
      return {
        id: user.id,
        name: fullName || "Professional",
        category: "Professionals",
        subcategory: firstService?.name || data.highest_qualification || "Professional Services",
        rating: 5.0,
        reviews: 0,
        location: "Available",
        price: p.min_hourly_rate ? `R${p.min_hourly_rate}` : "Quote",
        priceUnit: "/hour",
        description: firstService?.description || "Certified professional ready to assist you.",
        verified: user.is_approved,
        image: user.profile_image_url || "/placeholder.svg",
        available: true,
      };
    });

    const mappedProviders = providers.map((p: any) => {
      const user = p.provider;
      const data = user.data || {};
      const fullName = `${data.full_name || ''} ${data.surname || ''}`.trim() || data.business_name;
      const firstService = p.services && p.services.length > 0 ? p.services[0] : null;
      return {
        id: user.id,
        name: fullName || "Service Provider",
        category: "Services",
        subcategory: firstService?.name || "General Services",
        rating: 4.8,
        reviews: 0,
        location: "Available",
        price: firstService?.hourly_rate ? `R${firstService.hourly_rate}` : "Quote",
        priceUnit: "varies",
        description: firstService?.description || "Reliable service provider for your needs.",
        verified: user.is_approved,
        image: user.profile_image_url || "/placeholder.svg",
        available: true,
      };
    });

    return [...mappedPros, ...mappedProviders];
  }, [prosResult, providersResult]);

  const isLoading = loadingPros || loadingProviders;
  const error = errorPros || errorProviders;

  const filtered = useMemo(() => {
    return allProviders.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (subcategory !== "all" && p.subcategory !== subcategory) return false;
      if (location !== "all" && p.location !== location) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, category, subcategory, location, allProviders]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <section className="bg-gradient-to-br from-sa-black via-sa-blue to-sa-black pt-28 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="mb-3 text-3xl font-bold text-sa-white lg:text-5xl">Find Services</h1>
            <p className="mx-auto max-w-lg text-lg text-sa-white/70">Search from hundreds of verified providers across South Africa</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 lg:px-8">
        <BookingStepWizard currentStep={1} />
        <SearchFilter
          searchPlaceholder="Search by name, service, or location..."
          categories={categories}
          subcategories={serviceSubcategories}
          selectedCategory={category}
          selectedSubcategory={subcategory}
          selectedLocation={location}
          searchQuery={search}
          onSearchChange={setSearch}
          onCategoryChange={(c) => { setCategory(c); setSubcategory("all"); }}
          onSubcategoryChange={setSubcategory}
          onLocationChange={setLocation}
          onClearFilters={() => { setSearch(""); setCategory("all"); setSubcategory("all"); setLocation("all"); }}
          resultCount={filtered.length}
        />

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading services...</p>
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-destructive">Failed to load services. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((provider: any, i: number) => (
              <motion.div key={provider.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ProviderCard provider={provider} />
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">No providers match your filters</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Services;
