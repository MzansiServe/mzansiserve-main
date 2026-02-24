import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Users, Car, Briefcase, Wrench, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "transport", label: "Ride", icon: Car, color: "bg-[#1e88e5]" },
  { id: "services", label: "Service", icon: Wrench, color: "bg-[#5e35b1]" },
  { id: "professionals", label: "Expert", icon: Briefcase, color: "bg-[#00897b]" },
  { id: "shop", label: "Shop", icon: ShoppingBag, color: "bg-[#e53935]" },
];

const HeroSearch = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("transport");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    // Navigate based on active tab
    switch (activeTab) {
      case "transport":
        navigate("/transport");
        break;
      case "services":
        navigate("/services");
        break;
      case "professionals":
        navigate("/professionals");
        break;
      case "shop":
        navigate("/shop");
        break;
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-white overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-100/40 to-blue-50/40 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-50/40 to-orange-50/40 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-black text-[#222222] tracking-tighter leading-tight mb-6"
          >
            Find exactly <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5e35b1] to-[#1e88e5]">
              what you need.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-[#717171] font-medium max-w-2xl mx-auto leading-relaxed"
          >
            The all-in-one marketplace for South Africa. Book rides, hire professionals, find local services, and shop online.
          </motion.p>
        </div>

        {/* Search Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-[32px] shadow-2xl shadow-black/10 border border-slate-100 p-2">
            {/* Tabs */}
            <div className="flex p-1 gap-1 mb-2 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-bold transition-all duration-300 min-w-[100px]",
                      isActive 
                        ? "bg-black text-white shadow-lg scale-100" 
                        : "bg-white text-[#717171] hover:bg-slate-50 hover:text-black"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#717171]")} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="bg-slate-50 rounded-[24px] p-2 flex flex-col md:flex-row gap-2 relative">
              <div className="flex-1 relative group">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-[#717171] group-focus-within:text-black transition-colors">
                  <Search className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  placeholder={
                    activeTab === 'transport' ? "Where to? e.g. Sandton City" :
                    activeTab === 'services' ? "What help do you need? e.g. Cleaning" :
                    activeTab === 'professionals' ? "Who are you looking for? e.g. Accountant" :
                    "Search products..."
                  }
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-4 text-base font-bold text-[#222222] placeholder:text-[#717171] outline-none border border-transparent focus:border-black/5 transition-all shadow-sm group-hover:shadow-md"
                />
              </div>
              
              {activeTab === 'transport' && (
                <div className="flex-1 relative group">
                   <div className="absolute top-1/2 -translate-y-1/2 left-4 text-[#717171] group-focus-within:text-black transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Pick-up Location"
                    className="w-full h-14 bg-white rounded-2xl pl-12 pr-4 text-base font-bold text-[#222222] placeholder:text-[#717171] outline-none border border-transparent focus:border-black/5 transition-all shadow-sm group-hover:shadow-md"
                  />
                </div>
              )}

              <Button 
                size="icon" 
                className="h-14 w-14 md:w-auto md:px-8 rounded-2xl bg-[#FF385C] hover:bg-[#D90B3E] text-white shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5 md:hidden" />
                <span className="hidden md:flex items-center gap-2 font-bold">
                  Search <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Tags */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <span className="text-sm font-bold text-[#717171] py-2">Popular:</span>
          {["Plumber", "Driver", "Web Designer", "Electrician", "House Cleaner"].map((tag) => (
            <button 
              key={tag}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-[#222222] hover:border-black hover:scale-105 transition-all shadow-sm"
              onClick={() => {
                // In a real app, this would pre-fill search
                navigate('/services'); 
              }}
            >
              {tag}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSearch;
