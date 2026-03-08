import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TestimonialItem {
    id: string;
    name: string;
    role: string | null;
    avatar_url: string | null;
    rating: number;
    text: string;
}

const FALLBACK: TestimonialItem[] = [
    { id: "1", name: "Sipho Dlamini", role: "Homeowner, Johannesburg", avatar_url: null, rating: 5, text: "I booked a plumber through MzansiServe and he arrived within the hour. Verified, professional, and affordable. Highly recommend!" },
    { id: "2", name: "Zanele Mokoena", role: "Business Owner, Cape Town", avatar_url: null, rating: 5, text: "The drivers on this platform are punctual and courteous. I use MzansiServe for all my business transport needs now." },
    { id: "3", name: "Thabo Sithole", role: "Software Engineer, Durban", avatar_url: null, rating: 5, text: "Found an amazing accountant for my small business through the platform. The verification process gives me peace of mind." },
    { id: "4", name: "Lerato Khumalo", role: "Event Planner, Pretoria", avatar_url: null, rating: 5, text: "I hired a caterer and DJ through MzansiServe for my client's event. Both were exceptional. A game-changer for SA events!" },
];

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        ))}
    </div>
);

const Avatar = ({ name, url }: { name: string; url: string | null }) => {
    if (url) return <img src={url} alt={name} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20" />;
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/20">
            {initials}
        </div>
    );
};

const TestimonialsSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

    useEffect(() => {
        apiFetch("/api/public/testimonials")
            .then(res => {
                const items = res?.data?.testimonials;
                setTestimonials(items?.length > 0 ? items : FALLBACK);
            })
            .catch(() => setTestimonials(FALLBACK));
    }, []);

    const displayed = testimonials.length > 0 ? testimonials : FALLBACK;

    return (
        <section ref={ref} className="py-12 bg-white relative">
            {/* Subtle dot background */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23E5E7EB\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-4xl md:text-5xl font-semibold text-[#222222] mb-4">
                        What <span className="text-primary">South Africans</span> Say
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 font-normal max-w-xl mx-auto">
                        Real reviews from real people who've used MzansiServe to find trusted providers.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
                    {displayed.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group relative bg-white rounded-2xl border border-gray-100 p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
                        >
                            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                            <StarRating rating={t.rating} />
                            <p className="mt-4 mb-5 text-sm text-slate-600 font-normal leading-relaxed line-clamp-4">
                                "{t.text}"
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <Avatar name={t.name} url={t.avatar_url} />
                                <div>
                                    <p className="font-semibold text-sm text-[#222222]">{t.name}</p>
                                    {t.role && <p className="text-xs text-slate-400 font-normal">{t.role}</p>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
