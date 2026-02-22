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
    return <div className="h-screen w-full bg-slate-900 animate-pulse" />;
  }

  const slide = slides[current];
  const IconComponent = iconMap[slide.badge || "Shop"] || ShoppingBag;

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background images */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img src={slide.image_url.startsWith('http') ? slide.image_url : `${API_BASE_URL}${slide.image_url}`} alt={slide.badge || 'Slide'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-sa-black/85 via-sa-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-sa-black/60 via-transparent to-sa-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-sa-white/20 bg-sa-white/10 px-4 py-2 backdrop-blur-sm">
                <IconComponent className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-sa-white">{slide.badge}</span>
              </motion.div>

              <h1 className="mb-6 text-4xl font-extrabold leading-tight text-sa-white sm:text-5xl lg:text-7xl whitespace-pre-line">
                {slide.title}
              </h1>

              <p className="mb-8 max-w-lg text-lg text-sa-white/80 leading-relaxed">{slide.subtitle}</p>

              <div className="flex flex-wrap gap-4">
                {slide.cta_text && (
                  <Button size="lg"
                    className={`${slide.ctaColor} text-sa-white font-semibold px-8 py-6 text-base hover:opacity-90 transition-opacity border-none`}
                    onClick={() => navigate(slide.cta_link || '/')}>
                    {slide.cta_text}
                  </Button>
                )}
                {slide.learnMore && (
                  <Button size="lg" variant="outline"
                    className="border-sa-white/30 text-sa-white bg-sa-white/5 hover:bg-sa-white/15 px-8 py-6 text-base backdrop-blur-sm"
                    onClick={() => navigate(slide.learnMore || '/')}>
                    Learn More
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          {/* Navigation arrows */}
          <div className="absolute bottom-8 right-4 z-20 flex items-center gap-3 lg:right-8">
            <button onClick={prev}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-sa-white/20 bg-sa-white/10 text-sa-white backdrop-blur-sm transition-all hover:bg-sa-white/20"
              aria-label="Previous slide">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-sa-white/20 bg-sa-white/10 text-sa-white backdrop-blur-sm transition-all hover:bg-sa-white/20"
              aria-label="Next slide">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-accent" : "w-2 bg-sa-white/40 hover:bg-sa-white/60"}`}
                aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroCarousel;
