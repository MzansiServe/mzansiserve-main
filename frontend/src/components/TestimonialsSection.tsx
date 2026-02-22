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

// Static fallbacks if DB is empty
const FALLBACK: TestimonialItem[] = [
    { id: "1", name: "Sipho Dlamini", role: "Homeowner, Johannesburg", avatar_url: null, rating: 5, text: "I booked a plumber through MzansiServe and he arrived within the hour. Verified, professional, and affordable. Highly recommend!" },
    { id: "2", name: "Zanele Mokoena", role: "Business Owner, Cape Town", avatar_url: null, rating: 5, text: "The drivers on this platform are punctual and courteous. I use MzansiServe for all my business transport needs now." },
    { id: "3", name: "Thabo Sithole", role: "Software Engineer, Durban", avatar_url: null, rating: 5, text: "Found an amazing accountant for my small business through the platform. The verification process gives me peace of mind." },
    { id: "4", name: "Lerato Khumalo", role: "Event Planner, Pretoria", avatar_url: null, rating: 5, text: "I hired a caterer and DJ through MzansiServe for my client's event. Both were exceptional. A game-changer for SA events!" },
];

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
            />
        ))}
    </div>
);

const Avatar = ({ name, url }: { name: string; url: string | null }) => {
    if (url) return <img src={url} alt={name} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />;
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/20">
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
        <section ref={ref} className="relative overflow-hidden py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="container mx-auto px-4 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <span className="mb-4 inline-block rounded-full bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                        Testimonials
                    </span>
                    <h2 className="mb-4 text-3xl font-bold lg:text-4xl">What South Africans Say</h2>
                    <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                        Real reviews from real people who've used MzansiServe to find trusted providers.
                    </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {displayed.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
                        >
                            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                            <StarRating rating={t.rating} />
                            <p className="mt-4 mb-5 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                                "{t.text}"
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <Avatar name={t.name} url={t.avatar_url} />
                                <div>
                                    <p className="font-semibold text-sm">{t.name}</p>
                                    {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
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
