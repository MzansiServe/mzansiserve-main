import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Car, Briefcase, Wrench, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiFetch, API_BASE_URL } from "@/lib/api";

// Mapping logical badge/types to appropriate Lucide icons
const iconMap: Record<string, any> = {
  "Transport": Car,
  "Professionals": Briefcase,
  "Services": Wrench,
  "Shop": ShoppingBag,
};

// Fallback layout config if nothing is defined per slide
const defaultColor = "bg-primary shadow-lg";

interface SlideData {
  id: string;
  image_url: string;
  cta_link: string | null;
  cta_text: string | null;
  order: number;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaColor?: string;
  learnMore?: string;
}

const HeroCarousel = () => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await apiFetch("/api/public/carousel");
        if (res?.success && res.data?.items?.length > 0) {
          // Enrich data with frontend specifics based on available content or defaults
          const enrichedSlides = res.data.items.map((item: any) => {
            return {
              ...item,
              badge: item.badge || "Highlight",
              title: item.title || "MzansiServe\nMarketplace",
              subtitle: item.subtitle || "Connecting South Africa to reliable services and products.",
              ctaColor: item.cta_color || defaultColor,
              learnMore: item.cta_link || "/"
            };
          });
          setSlides(enrichedSlides);
        }
      } catch (err) {
        console.error("Failed to load carousel slides:", err);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) {
    return <div className="h-[600px] w-full bg-slate-900 animate-pulse" />;
  }

  const slide = slides[current];
  const IconComponent = iconMap[slide.badge || "Shop"] || ShoppingBag;

  return (
    <section id="home" className="relative h-[650px] w-full overflow-hidden">
      {/* Background images */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img src={slide.image_url.startsWith('http') ? slide.image_url : `${API_BASE_URL}${slide.image_url}`} alt={slide.badge || 'Slide'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-8 lg:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="max-w-xl"
            >
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md">
                <IconComponent className="h-4 w-4 text-white" />
                <span className="text-xs font-bold tracking-widest uppercase text-white">{slide.badge}</span>
              </motion.div>

              <h1 className="mb-6 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl tracking-tighter whitespace-pre-line">
                {slide.title}
              </h1>

              <p className="mb-10 max-w-md text-lg text-white/90 font-medium leading-snug">{slide.subtitle}</p>

              <div className="flex flex-wrap gap-4">
                {slide.cta_text && (
                  <Button size="lg"
                    className={`${slide.ctaColor} text-white font-bold px-10 py-7 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl border-none`}
                    onClick={() => navigate(slide.cta_link || '/')}>
                    {slide.cta_text}
                  </Button>
                )}
                {slide.learnMore && (
                  <Button size="lg" variant="outline"
                    className="border-white/40 text-white bg-white/10 hover:bg-white/20 px-10 py-7 rounded-2xl backdrop-blur-md transition-all font-bold"
                    onClick={() => navigate(slide.learnMore || '/')}>
                    Explore
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          {/* Navigation arrows - Airbnb bottom corner style */}
          <div className="absolute bottom-12 right-8 z-20 flex items-center gap-2 lg:right-12">
            <button onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40"
              aria-label="Previous slide">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40"
              aria-label="Next slide">
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default HeroCarousel;
