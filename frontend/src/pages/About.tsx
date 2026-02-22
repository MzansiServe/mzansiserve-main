import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, Clock, BadgeCheck, Headphones, Users, MapPin, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const stats = [
  { icon: Users, value: "50,000+", label: "Active Users" },
  { icon: MapPin, value: "9", label: "Provinces Covered" },
  { icon: Award, value: "2,500+", label: "Verified Providers" },
  { icon: TrendingUp, value: "98%", label: "Satisfaction Rate" },
];

const values = [
  { icon: ShieldCheck, title: "Trust & Verification", description: "Every provider verified through SARS, Home Affairs, CIPC, and SAPS databases." },
  { icon: Clock, title: "Instant Access", description: "Book services in seconds — no long calls, no waiting, just tap and go." },
  { icon: BadgeCheck, title: "Quality Guaranteed", description: "Professional accreditation bodies validate every credential on our platform." },
  { icon: Headphones, title: "Local Support", description: "Our Mzansi-based team is available to help with any issue, anytime." },
];

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-sa-black via-sa-blue to-sa-black pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold text-sa-white lg:text-5xl">About MzansiServe</h1>
            <p className="text-lg text-sa-white/70 leading-relaxed">
              Built by South Africans, for South Africans. We're on a mission to connect every person in Mzansi
              with trusted, verified service providers — from transport to legal experts to home services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-10 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={ref} className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold lg:text-4xl">Our Values</h2>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">We go beyond just connecting — we verify, validate, and protect.</p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
                className="group text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-purple text-primary-foreground shadow-glow-purple transition-transform group-hover:scale-110">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-sa-black via-sa-blue to-sa-black p-12 text-center lg:p-20">
            <h2 className="mb-4 text-3xl font-bold text-sa-white lg:text-4xl">Ready to Get Started?</h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-sa-white/70">
              Join thousands of South Africans already using MzansiServe.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-purple px-8 py-6 text-base font-semibold text-primary-foreground shadow-glow-purple hover:opacity-90"
                onClick={() => navigate("/register")}>
                Create Free Account
              </Button>
              <Button size="lg" variant="outline" className="border-sa-white/30 text-sa-white bg-sa-white/5 px-8 py-6 text-base hover:bg-sa-white/15"
                onClick={() => navigate("/services")}>
                Browse Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;
