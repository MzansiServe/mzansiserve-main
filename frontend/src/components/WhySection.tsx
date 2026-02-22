import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ShieldCheck, Clock, BadgeCheck, Headphones,
  Star, Zap, Heart, Globe, Award, Users, Smile, Phone,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// Map icon name strings (stored in DB) to actual Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck, Clock, BadgeCheck, Headphones,
  Star, Zap, Heart, Globe, Award, Users, Smile, Phone,
};

const FALLBACK: Feature[] = [
  { id: "1", icon: "ShieldCheck", title: "Fully Verified", description: "Every provider is vetted through SARS, Home Affairs, CIPC, and SAPS databases." },
  { id: "2", icon: "Clock", title: "Instant Booking", description: "Book any service in seconds. No long calls, no waiting — just tap and go." },
  { id: "3", icon: "BadgeCheck", title: "Accredited Experts", description: "Professional bodies validate credentials so you don't have to do due diligence." },
  { id: "4", icon: "Headphones", title: "Dedicated Support", description: "Our Mzansi-based support team is available to help — any time, any issue." },
];

const WhySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    apiFetch("/api/public/landing-features")
      .then(res => {
        const items = res?.data?.features;
        setFeatures(items?.length > 0 ? items : FALLBACK);
      })
      .catch(() => setFeatures(FALLBACK));
  }, []);

  const displayed = features.length > 0 ? features : FALLBACK;

  return (
    <section id="about" ref={ref} className="relative overflow-hidden py-24 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Why MzansiServe
          </span>
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
            Why We're Different
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Built by South Africans, for South Africans. We go beyond just connecting — we verify, validate, and protect.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {displayed.map((feat, i) => {
            const IconComponent = ICON_MAP[feat.icon] || ShieldCheck;
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group text-center"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-purple text-primary-foreground shadow-glow-purple transition-transform duration-300 group-hover:scale-110">
                  <IconComponent className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
