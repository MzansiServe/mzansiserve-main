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
    <section ref={ref} className="py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0A14] p-12 text-center lg:p-24 shadow-2xl shadow-sa-black/20"
        >
          {/* Subtle Dynamic Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0020A3]/20 via-transparent to-[#7C3AED]/10 pointer-events-none" />
          <div className="absolute -left-1/4 -top-1/4 h-full w-full rounded-full bg-[#0020A3]/10 blur-[120px]" />
          <div className="absolute -right-1/4 -bottom-1/4 h-full w-full rounded-full bg-[#7C3AED]/10 blur-[120px]" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white lg:text-6xl">
              Ready to Get Started?
            </h2>
            <p className="mb-10 text-lg lg:text-xl text-sa-white/70 leading-relaxed font-medium">
              Join thousands of South Africans already using MzansiServe. <br className="hidden md:block" />
              Sign up today and get access to verified services across the country.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Button
                size="lg"
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-sa-purple/20 px-10 py-7 text-lg font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 group"
                onClick={() => navigate("/register")}
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                size="lg"
                className="bg-[#0020A3]/10 border-2 border-[#0020A3]/30 text-white hover:bg-[#0020A3]/20 px-10 py-7 text-lg font-bold rounded-2xl transition-all backdrop-blur-md"
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
