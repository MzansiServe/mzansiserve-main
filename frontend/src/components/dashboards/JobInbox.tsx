import { useState } from "react";
import {
    ClipboardList,
    MapPin,
    Clock,
    Calendar,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Job {
    id: string;
    request_type: string;
    scheduled_date: string;
    scheduled_time: string;
    location_data: any;
    payment_amount: number;
    status: string;
    client_name?: string;
    client_profile_image_url?: string;
    details?: any;
}

interface JobInboxProps {
    jobs: Job[];
    role: 'driver' | 'professional' | 'service-provider';
    onJobAccepted: () => void;
}

export const JobInbox = ({ jobs, role, onJobAccepted }: JobInboxProps) => {
    const { toast } = useToast();
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    const handleAccept = async (jobId: string) => {
        setAcceptingId(jobId);
        try {
            // Updated to POST to match backend @bp.route('/<request_id>/accept', methods=['POST'])
            const res = await apiFetch(`/api/requests/${jobId}/accept`, {
                method: 'POST'
            });

            if (res.success) {
                toast({ title: "Job Accepted", description: "The job has been assigned to you." });
                onJobAccepted();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to accept job", variant: "destructive" });
        } finally {
            setAcceptingId(null);
        }
    };

    const getJobTitle = (job: Job) => {
        if (job.request_type === 'cab') return "Transport Request";
        if (job.request_type === 'professional') return job.details?.service_name || "Professional Service";
        return job.details?.service_name || "General Service";
    };

    const themeColor = role === 'driver' ? 'text-[#1e88e5]' : 'text-[#5e35b1]';
    const themeBg = role === 'driver' ? 'bg-[#e3f2fd]' : 'bg-[#ede7f6]';

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", themeBg, themeColor)}>
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-[#121926]">Available Jobs</h2>
                </div>
                <span className="text-xs font-bold text-[#697586] bg-white border border-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {jobs.length} New
                </span>
            </div>

            <div className="divide-y divide-gray-100">
                {jobs.length > 0 ? (
                    jobs.map((job) => (
                        <div key={job.id} className="p-6 hover:bg-[#f8fafc] transition-colors group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0", themeBg, themeColor)}>
                                        {job.client_name?.charAt(0) || <UserIcon className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[#121926] group-hover:text-blue-600 transition-colors">
                                            {getJobTitle(job)}
                                        </h3>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#697586]">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(job.scheduled_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock className="h-4 w-4" />
                                                {job.scheduled_time}
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <MapPin className="h-4 w-4" />
                                                {job.location_data?.location || job.location_data?.pickup || "Location details"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:flex-col md:items-end gap-3">
                                    <div className="text-right">
                                        <p className={cn("text-xl font-bold tracking-tight", themeColor)}>
                                            R{job.payment_amount.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-[#697586] opacity-50">
                                            Potential Earnings
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => handleAccept(job.id)}
                                        disabled={acceptingId === job.id}
                                        className={cn(
                                            "rounded-xl px-6 font-bold shadow-md hover:scale-105 active:scale-95 transition-all",
                                            role === 'driver' ? "bg-[#1e88e5] hover:bg-[#1565c0]" : "bg-[#5e35b1] hover:bg-[#4527a0]"
                                        )}
                                    >
                                        {acceptingId === job.id ? "Accepting..." : "Accept Job"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <ClipboardList className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-[#121926]">Waiting for incoming jobs...</h3>
                        <p className="max-w-[260px] text-sm text-[#697586] mt-2 leading-relaxed italic">
                            New service requests from clients will appear here as soon as they are submitted.
                        </p>
                    </div>
                )}
            </div>

            {jobs.length > 0 && (
                <div className="p-4 bg-slate-50/50 text-center border-t border-gray-100">
                    <button className="text-sm font-bold text-[#697586] hover:text-[#121926] transition-colors flex items-center justify-center gap-1 mx-auto">
                        View All Available <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};
