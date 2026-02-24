import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'purple' | 'blue' | 'light' | 'orange' | 'green';
    loading?: boolean;
}

export const StatsCard = ({ title, value, icon: Icon, variant = 'light', loading }: StatsCardProps) => {
    const iconColors = {
        purple: "text-[#5e35b1]",
        blue: "text-[#1e88e5]",
        orange: "text-orange-500",
        green: "text-emerald-500",
        light: "text-[#5e35b1]"
    };

    return (
        <div className="relative overflow-hidden rounded-2xl p-8 bg-white border border-slate-100 hover:shadow-lg transition-all duration-300 group">
            <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6 flex items-center justify-between">
                    <div className={cn("rounded-xl p-3 flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100", iconColors[variant])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-[#717171] uppercase tracking-widest">
                        {title}
                    </p>
                    <h3 className="text-3xl font-bold text-[#222222] tracking-tighter">
                        {loading ? "..." : value}
                    </h3>
                </div>
            </div>
        </div>
    );
};
