import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ServiceSections from "@/components/ServiceSection";
import WhySection from "@/components/WhySection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroCarousel />
      <ServiceSections />
      <WhySection />
      <TestimonialsSection />
      <FeaturedProducts />
      <CTABanner />
      <Footer />
    </main>
  );
};

export default Index;
