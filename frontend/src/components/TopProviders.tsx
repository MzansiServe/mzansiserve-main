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
    }
];

export const TopProviders = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch("/api/public/top-providers?limit=3")
            .then(res => {
                if (res?.data?.providers) {
                    setProviders(res.data.providers);
                }
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
            <section className="py-24 bg-secondary/30">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
                        <div className="h-8 w-64 bg-gray-300 rounded mb-8" />
                    </div>
                </div>
            </section>
        );
    }

    if (providers.length === 0) return null;

    return (
        <section className="py-24 lg:py-32 bg-secondary/30">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <span className="mb-4 inline-block rounded-full bg-sa-purple/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sa-purple">
                            Elite Talent
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-bold text-sa-black mb-6">
                            Mzansi's Top Rated
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Meet the highest-rated professionals and service providers on our platform.
                        </p>
                    </div>
                    <Button variant="outline" className="group gap-2 border-sa-purple/20 text-sa-purple hover:bg-sa-purple hover:text-white" onClick={() => navigate('/professionals')}>
                        Browse All Experts <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {providers.map((provider, index) => {
                        const fullName = provider.data?.full_name || provider.name || "Service Provider";
                        const imageUrl = provider.profile_image_url
                            ? (provider.profile_image_url.startsWith('http') ? provider.profile_image_url : `${API_BASE_URL}${provider.profile_image_url}`)
                            : null;

                        return (
                            <motion.div
                                key={provider.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-3xl p-6 shadow-xl shadow-sa-black/5 border border-white hover:border-sa-purple/20 transition-all group lg:p-8"
                            >
                                <div className="relative mb-6">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={fullName}
                                            className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl bg-sa-purple/10 flex items-center justify-center text-sa-purple shadow-lg">
                                            <UserIcon size={32} />
                                        </div>
                                    )}
                                    {provider.is_approved && (
                                        <div className="absolute -bottom-2 -right-2 bg-sa-blue text-white p-1 rounded-lg border-2 border-white">
                                            <ShieldCheck size={16} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 text-yellow-500 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < Math.floor(provider.avg_rating) ? "currentColor" : "none"} />
                                    ))}
                                    <span className="ml-2 text-sm font-bold text-sa-black">{provider.avg_rating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({provider.review_count} reviews)</span>
                                </div>

                                <h3 className="text-xl font-bold text-sa-black mb-1 group-hover:text-sa-purple transition-colors">{fullName}</h3>
                                <p className="text-sm font-semibold text-sa-purple mb-4">{provider.role_display}</p>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                                    <MapPin size={14} />
                                    {provider.data?.city || provider.location || "South Africa"}
                                </div>

                                <Button className="w-full bg-sa-black text-white hover:bg-sa-purple" onClick={() => navigate('/professionals')}>
                                    View Profile
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
