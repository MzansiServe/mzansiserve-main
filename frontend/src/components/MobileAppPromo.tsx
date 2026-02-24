import { motion } from "framer-motion";
import { CheckCircle2, Apple, Play } from "lucide-react";

export const MobileAppPromo = () => {
    return (
        <section className="py-24 lg:py-32 bg-sa-black overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-sa-purple/20 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 text-sa-white">
                        <span className="mb-6 inline-block rounded-full bg-sa-white/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-sa-white">
                            Mobile Experience
                        </span>
                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-8 leading-tight">
                            Get the MzansiServe <br />
                            <span className="text-accent underline decoration-4 underline-offset-8">Super App</span>
                        </h2>
                        <p className="text-xl text-sa-white/70 mb-10 leading-relaxed max-w-xl">
                            Manage bookings, chat with professionals, and track your drivers in real-time. Everything you need, right in your pocket.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 mb-12">
                            {[
                                "Real-time Driver Tracking",
                                "Instant In-App Chat",
                                "Secure Mobile Payments",
                                "Exclusive App-only Deals"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="text-accent h-5 w-5" />
                                    <span className="text-sa-white/90 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        {/* App Store Buttons - Real Design Pattern */}
                        <div className="flex flex-wrap gap-4">
                            <button className="flex items-center gap-3 bg-sa-black border border-sa-white/20 rounded-xl px-5 py-2.5 transition-all hover:bg-sa-white/10 hover:border-sa-white/40 group">
                                <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 384 512">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41-84.5-41.9-38.9-.9-74.3 22.1-94.6 22.1-20.3 0-48.4-19.1-79-18.3-40.4.6-77.4 25.8-98.1 61.1-41.9 71.4-10.7 177.3 29.8 238.9 19.8 29.1 43.1 61.8 74.5 61.5 30.1-.3 41.4-19.1 77.6-19.1 36.3 0 46.5 19.1 77.8 18.5 31.9-.6 52.3-29.3 72-58.4 22.8-33.1 32.2-65.2 32.6-67.1-.7-.3-62.8-24.3-63-96.1zM288.2 86.4c17.5-22.1 29.4-52.6 26.2-86.4-28.9 1.2-58.8 19.8-79.6 44.1-18.6 21.6-34.8 53-30.7 85.1 32.2 2.5 60.1-17.7 84.1-42.8z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-semibold text-sa-white/60 leading-none">Download on the</div>
                                    <div className="text-xl font-bold text-white leading-tight">App Store</div>
                                </div>
                            </button>

                            <button className="flex items-center gap-3 bg-sa-black border border-sa-white/20 rounded-xl px-5 py-2.5 transition-all hover:bg-sa-white/10 hover:border-sa-white/40 group">
                                <svg className="w-8 h-8" viewBox="0 0 512 512">
                                    <path fill="#4285F4" d="M464 256c0-13.3-1.2-26.2-3.5-38.7H256v73.2h116.5c-5 26.9-20.2 49.6-43.1 64.9l69 53.5C438.7 373.1 464 320.1 464 256z" />
                                    <path fill="#34A853" d="M256 464c56.2 0 103.4-18.7 137.9-50.5l-69-53.5c-19.1 12.8-43.6 20.3-68.9 20.3-53 0-97.9-35.8-113.9-84l-71.3 55.3C69.1 421.3 154.6 464 256 464z" />
                                    <path fill="#FBBC05" d="M142.1 296.3c-4.1-12.8-6.4-26.5-6.4-40.3s2.3-27.5 6.4-40.3L70.8 160.4C54.4 192.6 45 224 45 256s9.4 63.4 25.8 95.6l71.3-55.3z" />
                                    <path fill="#EA4335" d="M256 122.2c30.6 0 57.9 10.5 79.6 31.3l59.6-59.6C359.4 61.2 312.2 45 256 45 154.6 45 69.1 87.7 38.7 151.6l72.1 55.3c16-48.2 60.9-84 113.9-84z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-semibold text-sa-white/60 leading-none">Get it on</div>
                                    <div className="text-xl font-bold text-white leading-tight">Google Play</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <motion.div
                            initial={{ opacity: 0, rotate: 12, y: 100 }}
                            whileInView={{ opacity: 1, rotate: -6, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="relative z-10"
                        >
                            {/* High Fidelity Phone Frame */}
                            <div className="w-[280px] h-[580px] bg-[#0F172A] rounded-[3rem] border-[8px] border-[#222] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden relative mx-auto lg:mr-0">
                                {/* Speaker/Camera Notch */}
                                <div className="absolute top-0 w-full h-7 bg-[#222] flex justify-center items-end pb-1.5 z-30">
                                    <div className="w-16 h-3 bg-black rounded-full" />
                                </div>

                                {/* Screen Content (The Webview) */}
                                <div className="h-full bg-white relative flex flex-col">
                                    {/* Browser Address Bar */}
                                    <div className="pt-8 px-4 pb-2 bg-gray-50 border-b border-gray-200 flex flex-col gap-1 z-20">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-[10px] font-bold text-gray-400">9:41</div>
                                            <div className="flex gap-1">
                                                <div className="w-3 h-2 bg-gray-400 rounded-sm" />
                                                <div className="w-3 h-2 bg-gray-400 rounded-sm" />
                                            </div>
                                        </div>
                                        <div className="h-7 bg-white rounded-lg border border-gray-200 flex items-center px-3 gap-2">
                                            <div className="w-2 h-2 bg-sa-blue rounded-full" />
                                            <div className="text-[10px] text-gray-500 font-medium truncate">mzansiserve.com</div>
                                        </div>
                                    </div>

                                    {/* Scrolling Web Content Container */}
                                    <div className="flex-1 overflow-y-auto scrollbar-hide text-[8px] leading-tight">
                                        {/* Webpage Content Representation */}
                                        <div className="bg-white">
                                            {/* Mock Navbar */}
                                            <div className="px-3 py-2 flex justify-between items-center bg-sa-black text-white">
                                                <div className="font-bold tracking-tight text-[10px]">MZANSISERVE</div>
                                                <div className="w-4 h-4 flex flex-col justify-between py-1">
                                                    <div className="h-0.5 w-full bg-white rounded-full" />
                                                    <div className="h-0.5 w-full bg-white rounded-full" />
                                                    <div className="h-0.5 w-full bg-white rounded-full" />
                                                </div>
                                            </div>

                                            {/* Mock Hero Component */}
                                            <div className="relative h-32 bg-sa-black overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-sa-black to-transparent z-10" />
                                                <img
                                                    src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80"
                                                    alt="Hero"
                                                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                                                />
                                                <div className="relative z-20 p-4 pt-6 text-left">
                                                    <div className="inline-block px-1.5 py-0.5 bg-accent/20 border border-accent/30 rounded-full text-[6px] text-accent font-bold mb-1 uppercase">#1 in SA</div>
                                                    <div className="text-white font-bold text-[12px] leading-none mb-1">Your Life,<br />Simplified.</div>
                                                    <div className="text-white/60 text-[7px] mb-3">Professional services at your door.</div>
                                                    <div className="w-16 py-1.5 bg-sa-blue rounded text-center text-white font-bold shadow-sm">Book Now</div>
                                                </div>
                                            </div>

                                            {/* Mock QuickActionGrid Component */}
                                            <div className="px-3 py-4 bg-[#F8FAFC]">
                                                <div className="grid grid-cols-4 gap-2 -mt-8 relative z-20">
                                                    {[
                                                        { icon: "🚚", label: "Transport" },
                                                        { icon: "💼", label: "Pros" },
                                                        { icon: "🏠", label: "Home" },
                                                        { icon: "🛒", label: "Shop" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                                                            <div className="text-[10px] mb-0.5">{item.icon}</div>
                                                            <div className="text-[5px] font-bold text-gray-600">{item.label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Mock Top Providers */}
                                            <div className="px-3 py-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="font-bold text-sa-black text-[9px]">Top Rated Experts</div>
                                                    <div className="text-sa-purple font-bold text-[6px]">View All</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {[
                                                        { name: "Dr. Thabo", role: "Specialist", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100" },
                                                        { name: "Lindiwe", role: "Legal", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100" }
                                                    ].map((p, i) => (
                                                        <div key={i} className="flex-1 bg-white border border-gray-100 rounded-lg p-1.5 flex flex-col items-center text-center shadow-xs">
                                                            <img src={p.img} alt={p.name} className="w-8 h-8 rounded-full mb-1 object-cover" />
                                                            <div className="font-bold text-[7px] text-sa-black truncate w-full">{p.name}</div>
                                                            <div className="text-sa-purple text-[5px]">{p.role}</div>
                                                            <div className="flex gap-0.5 mt-0.5">
                                                                {[...Array(5)].map((_, j) => <div key={j} className="w-1 h-1 bg-yellow-400 rounded-full" />)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Mock Service Section */}
                                            <div className="px-3 py-4">
                                                <div className="font-bold text-sa-black text-[9px] mb-3">Popular Services</div>
                                                <div className="space-y-2">
                                                    {[
                                                        { title: "Plumbing Services", desc: "Expert leak fixes and installs" },
                                                        { title: "Electrician", desc: "Certified electrical work" }
                                                    ].map((s, i) => (
                                                        <div key={i} className="flex gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className="w-8 h-8 rounded bg-sa-purple/10 flex items-center justify-center text-[10px]">🛠️</div>
                                                            <div className="flex-1">
                                                                <div className="font-bold text-sa-black text-[7px]">{s.title}</div>
                                                                <div className="text-gray-500 text-[6px]">{s.desc}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Home Indicator */}
                                    <div className="h-6 bg-white flex justify-center items-center pb-2">
                                        <div className="w-24 h-1.5 bg-gray-300 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Decorative Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sa-purple/30 blur-[120px] rounded-full pointer-events-none" />
                    </div>
                </div>
            </div>
        </section>
    );
};
