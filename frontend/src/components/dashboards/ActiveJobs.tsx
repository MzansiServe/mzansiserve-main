import { useState, useEffect } from "react";
import {
    User as UserIcon,
    MapPin,
    Clock,
    MessageSquare,
    Phone,
    Star,
    MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JobActionButtons } from "./JobActionButtons";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChatOverlay } from "../ChatOverlay";

interface ActiveJobsProps {
    jobs: any[];
    role: 'driver' | 'professional' | 'service-provider';
    onStatusUpdate: () => void;
}

export const ActiveJobs = ({ jobs, role, onStatusUpdate }: ActiveJobsProps) => {
    const [clientInfos, setClientInfos] = useState<Record<string, any>>({});
    const [chatJob, setChatJob] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const fetchInfos = async () => {
            const newInfos = { ...clientInfos };
            for (const job of jobs) {
                if (!newInfos[job.id]) {
                    try {
                        const res = await apiFetch(`/api/requests/${job.id}/client-info`);
                        if (res.success) {
                            newInfos[job.id] = res.data.client;
                        }
                    } catch (err) {
                        console.error("Failed to fetch client info", err);
                    }
                }
            }
            setClientInfos(newInfos);
        };

        if (jobs.length > 0) {
            fetchInfos();
        }
    }, [jobs]);

    if (jobs.length === 0) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-[#121926]">No Active Jobs</h3>
                <p className="text-sm text-[#697586] mt-2 max-w-[240px] mx-auto leading-relaxed italic">
                    You don't have any jobs currently in progress. Accept a job from your inbox to get started!
                </p>
            </div>
        );
    }

    const themeColor = role === 'driver' ? 'text-[#1e88e5]' : 'text-[#5e35b1]';
    const themeBg = role === 'driver' ? 'bg-[#e3f2fd]' : 'bg-[#ede7f6]';

    return (
        <div className="grid gap-6">
            {jobs.map((job) => {
                const client = clientInfos[job.id];
                const location = job.location_data?.location || job.location_data?.pickup || "Address not specified";

                return (
                    <div key={job.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-6">
                            {/* Client Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0", themeBg)}>
                                        {client?.profile_image_url ? (
                                            <img src={client.profile_image_url} alt={client.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <UserIcon className={cn("h-6 w-6", themeColor)} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#121926] text-lg">{client?.name || "Loading client..."}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="flex items-center text-amber-500 font-bold text-sm">
                                                <Star className="h-3.5 w-3.5 fill-current mr-1" />
                                                {client?.average_rating ? client.average_rating.toFixed(1) : "N/A"}
                                            </span>
                                            <span className="text-xs text-[#697586] font-medium">• {client?.reviews_count || 0} reviews</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="rounded-xl h-10 w-10 text-[#5e35b1] bg-purple-50 hover:bg-purple-100"
                                        onClick={() => setChatJob({ id: job.id, name: client?.name || "Client" })}
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-[#697586]">
                                        <Phone className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Job Details */}
                            <div className="space-y-4 mb-6 py-4 border-y border-gray-50">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-[#697586] mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-[#697586] mb-1">Location</p>
                                        <p className="text-sm font-bold text-[#364152] leading-tight">{location}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-[#697586] mt-0.5" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-[#697586] mb-1">Time</p>
                                            <p className="text-sm font-bold text-[#364152]">{job.scheduled_time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#697586] mb-1">Est. Payout</p>
                                        <p className={cn("text-lg font-black", themeColor)}>R{job.payment_amount.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <JobActionButtons
                                job={job}
                                role={role}
                                onStatusUpdate={onStatusUpdate}
                            />
                        </div>
                    </div>
                );
            })}

            {chatJob && (
                <ChatOverlay
                    requestId={chatJob.id}
                    recipientName={chatJob.name}
                    isOpen={!!chatJob}
                    onClose={() => setChatJob(null)}
                />
            )}
        </div>
    );
};
