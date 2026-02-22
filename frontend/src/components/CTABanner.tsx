import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTABanner = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  return (
    <section ref={ref} className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sa-black via-sa-blue to-sa-black p-10 text-center lg:p-20"
        >
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-sa-white lg:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-sa-white/70">
              Join thousands of South Africans already using MzansiServe. Sign up today and get access to verified services across the country.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-purple shadow-glow-purple px-8 py-6 text-base font-semibold text-primary-foreground hover:opacity-90"
                onClick={() => navigate("/register")}
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-sa-white/30 text-sa-white bg-sa-white/5 hover:bg-sa-white/15 px-8 py-6 text-base backdrop-blur-sm"
                onClick={() => navigate("/services")}
              >
                Become a Provider
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
