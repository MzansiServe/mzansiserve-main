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

const subcats = serviceSubcategories.Professionals;

const Professionals = () => {
  const [search, setSearch] = useState("");
  const [subcategory, setSubcategory] = useState("all");
  const [location, setLocation] = useState("all");

  const { data: fetchResult, isLoading, error } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => apiFetch('/api/profile/professionals')
  });

  const professionals = useMemo(() => {
    if (!fetchResult?.data?.professionals) return [];

    // Map backend response ({professional: User, services: ServiceSchema[]}) to ProviderCard expected format
    return fetchResult.data.professionals.map((p: any) => {
      const user = p.professional;
      const data = user.data || {};
      const fullName = `${data.full_name || ''} ${data.surname || ''}`.trim();
      const firstService = p.services && p.services.length > 0 ? p.services[0] : null;

      return {
        id: user.id,
        name: fullName || "Professional",
        category: "Professionals",
        subcategory: firstService?.name || data.highest_qualification || "Professional Services",
        rating: 5.0, // Backend might not provide ratings here yet
        reviews: 0,
        location: "Available", // Geolocation might be needed for real locations
        price: p.min_hourly_rate ? `R${p.min_hourly_rate}` : "Quote",
        priceUnit: "/hour",
        description: firstService?.description || "Certified professional ready to assist you.",
        verified: user.is_approved,
        image: user.profile_image_url || "/placeholder.svg",
        available: true,
      };
    });
  }, [fetchResult]);

  const filtered = useMemo(() => {
    return professionals
      .filter((p: any) => {
        if (subcategory !== "all" && p.subcategory !== subcategory) return false;
        if (location !== "all" && p.location !== location) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.subcategory.toLowerCase().includes(q);
        }
        return true;
      });
  }, [search, subcategory, location, professionals]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-to-br from-sa-black via-sa-blue to-sa-black pt-28 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="mb-3 inline-block rounded-full bg-sa-blue/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sa-white">Professionals</span>
            <h1 className="mb-3 text-3xl font-bold text-sa-white lg:text-5xl">Accredited Experts</h1>
            <p className="mx-auto max-w-lg text-lg text-sa-white/70">Verified lawyers, doctors, accountants, and engineers</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 lg:px-8">
        <BookingStepWizard currentStep={1} />
        <SearchFilter
          searchPlaceholder="Search professionals..."
          categories={subcats}
          selectedCategory={subcategory}
          selectedSubcategory="all"
          selectedLocation={location}
          searchQuery={search}
          onSearchChange={setSearch}
          onCategoryChange={setSubcategory}
          onSubcategoryChange={() => { }}
          onLocationChange={setLocation}
          onClearFilters={() => { setSearch(""); setSubcategory("all"); setLocation("all"); }}
          resultCount={filtered.length}
        />

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading professionals...</p>
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-destructive">Failed to load professionals. Please try again.</p>
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
            <p className="text-lg font-medium text-muted-foreground">No professionals match your search</p>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Professionals;
