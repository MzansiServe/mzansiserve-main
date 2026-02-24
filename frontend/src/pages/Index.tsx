import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import { QuickActionGrid } from "@/components/QuickActionGrid";
import { HowItWorks } from "@/components/HowItWorks";
import WhySection from "@/components/WhySection";
import ServiceSections from "@/components/ServiceSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import { TopProviders } from "@/components/TopProviders";
import TestimonialsSection from "@/components/TestimonialsSection";
import { MobileAppPromo } from "@/components/MobileAppPromo";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "error") {
      navigate("/payment-error", { replace: true });
    }
  }, [location, navigate]);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <HeroCarousel />
      <QuickActionGrid />

      {/* Credibility & Process */}
      <HowItWorks />

      {/* Trust & Discovery Sequence */}
      <WhySection />

      <div className="space-y-0">
        <ServiceSections />
      </div>

      <FeaturedProducts />

      {/* Social Proof & Professionals */}
      <TopProviders />
      <TestimonialsSection />

      {/* Mobile & Final CTA */}
      <MobileAppPromo />
      <CTABanner />

      <Footer />
    </main>
  );
};

export default Index;
