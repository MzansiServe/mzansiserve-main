import { motion } from "framer-motion";
import { Search, CalendarCheck, Smile } from "lucide-react";

const steps = [
    {
        title: "Find a Service",
        description: "Search for drivers, professionals, or home services in your area.",
        icon: Search,
        color: "bg-[#0020A3]" // Solid Mzansi Blue
    },
    {
        title: "Book & Pay",
        description: "Choose your professional, schedule a time, and pay securely online.",
        icon: CalendarCheck,
        color: "bg-[#7C3AED]" // Solid Purple
    },
    {
        title: "Enjoy Mzansi Quality",
        description: "Relax while our verified providers handle the rest with top-tier service.",
        icon: Smile,
        color: "bg-[#F97316]" // Solid Orange / Accent
    }
];

export const HowItWorks = () => {
    return (
        <section className="py-24 lg:py-32 bg-white overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="mb-4 inline-block rounded-full bg-sa-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sa-blue">
                        The Process
                    </span>
                    <h2 className="text-3xl lg:text-5xl font-bold text-sa-black mb-6">
                        How MzansiServe Works
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        We've simplified the process of finding and hiring quality services in South Africa into three easy steps.
                    </p>
                </div>

                <div className="relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />

                    <div className="grid md:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className={`h-24 w-24 rounded-3xl ${step.color} text-white flex items-center justify-center mb-8 shadow-xl shadow-${step.color.split('-')[1]}/20 transform transition-transform group-hover:rotate-6 group-hover:scale-110`}>
                                    <step.icon size={40} />
                                </div>
                                <div className="bg-white px-6">
                                    <h3 className="text-2xl font-bold text-sa-black mb-4">{step.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
