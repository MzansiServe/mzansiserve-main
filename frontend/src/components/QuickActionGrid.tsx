import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Car,
    Briefcase,
    Wrench,
    ShoppingBag,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
    {
        title: "Transport",
        subtitle: "Rides & Deliveries",
        icon: Car,
        href: "/transport",
        color: "bg-sa-blue/10 text-sa-blue",
        hoverColor: "group-hover:bg-sa-blue group-hover:text-white"
    },
    {
        title: "Professionals",
        subtitle: "Medical, Legal, Finance",
        icon: Briefcase,
        href: "/professionals",
        color: "bg-sa-purple/10 text-sa-purple",
        hoverColor: "group-hover:bg-sa-purple group-hover:text-white"
    },
    {
        title: "Services",
        subtitle: "Home, Repair, Maintenance",
        icon: Wrench,
        href: "/services",
        color: "bg-accent/15 text-accent-foreground",
        hoverColor: "group-hover:bg-accent group-hover:text-sa-black"
    },
    {
        title: "Shop Hub",
        subtitle: "Local Marketplace",
        icon: ShoppingBag,
        href: "/shop",
        color: "bg-sa-red/10 text-sa-red",
        hoverColor: "group-hover:bg-sa-red group-hover:text-white"
    }
];

export const QuickActionGrid = () => {
    const navigate = useNavigate();

    return (
        <section className="relative -mt-16 z-20 pb-12">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    {actions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            onClick={() => navigate(action.href)}
                            className="group cursor-pointer"
                        >
                            <div className="h-full bg-white rounded-2xl p-6 shadow-xl shadow-sa-black/5 border border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:border-sa-blue/20">
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                                    action.color,
                                    action.hoverColor
                                )}>
                                    <action.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-sa-black mb-1">{action.title}</h3>
                                <p className="text-xs text-muted-foreground mb-4">{action.subtitle}</p>
                                <div className="mt-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sa-blue group-hover:gap-2 transition-all">
                                    Next <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
