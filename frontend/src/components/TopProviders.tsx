import { motion } from "framer-motion";
import { Star, ShieldCheck, MapPin, ChevronRight, User as UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch, API_BASE_URL } from "@/lib/api";

interface Provider {
    id: string;
    name: string;
    role_display: string;
    location: string;
    avg_rating: number;
    review_count: number;
    profile_image_url: string | null;
    is_approved: boolean;
    data: any;
}

const FALLBACK_PROVIDERS = [
    {
        name: "Mzansi Professional",
        role_display: "Verified Expert",
        location: "Gauteng, ZA",
        avg_rating: 5.0,
        review_count: 10,
        profile_image_url: null,
        is_approved: true,
    },
];

export const TopProviders = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch("/api/public/top-providers?limit=3")
            .then(res => {
                if (res?.data?.providers) setProviders(res.data.providers);
            })
            .catch(err => {
                console.error("Failed to fetch top providers:", err);
                // @ts-ignore
                setProviders(FALLBACK_PROVIDERS);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading && providers.length === 0) {
        return (
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="h-6 w-48 bg-gray-200 rounded" />
                        <div className="h-10 w-64 bg-gray-300 rounded" />
                    </div>
                </div>
            </section>
        );
    }

    if (providers.length === 0) return null;

    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-semibold text-[#222222] mb-4">
                            Mzansi's <span className="text-primary">Top Rated</span>
                        </h2>
                        <p className="text-lg md:text-xl text-slate-600 font-normal">
                            Meet the highest-rated professionals and service providers on our platform.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="group gap-2 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl font-semibold px-6 py-5 transition-all shrink-0"
                        onClick={() => navigate("/professionals")}
                    >
                        Browse All Experts{" "}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {providers.map((provider, index) => {
                        const fullName = provider.data?.full_name || provider.name || "Service Provider";
                        const imageUrl = provider.profile_image_url
                            ? (provider.profile_image_url.startsWith("http")
                                ? provider.profile_image_url
                                : `${API_BASE_URL}${provider.profile_image_url}`)
                            : null;

                        return (
                            <motion.div
                                key={provider.id || index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-300"
                            >
                                {/* Avatar */}
                                <div className="relative mb-6">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={fullName}
                                            className="w-20 h-20 rounded-xl object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg">
                                            <UserIcon size={32} />
                                        </div>
                                    )}
                                    {provider.is_approved && (
                                        <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1 rounded-lg border-2 border-white">
                                            <ShieldCheck size={14} />
                                        </div>
                                    )}
                                </div>

                                {/* Stars */}
                                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < Math.floor(provider.avg_rating) ? "currentColor" : "none"} />
                                    ))}
                                    <span className="ml-2 text-sm font-bold text-[#222222]">
                                        {provider.avg_rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-slate-400">({provider.review_count} reviews)</span>
                                </div>

                                <h3 className="text-xl font-semibold text-[#222222] mb-1 group-hover:text-primary transition-colors">
                                    {fullName}
                                </h3>
                                <p className="text-sm font-semibold text-primary mb-4">{provider.role_display}</p>

                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                                    <MapPin size={13} />
                                    {provider.data?.city || provider.location || "South Africa"}
                                </div>

                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-5 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                    onClick={() => navigate("/professionals")}
                                >
                                    View Profile <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
