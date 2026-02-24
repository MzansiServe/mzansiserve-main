import { useState } from "react";
import {
    Navigation,
    CheckCircle2,
    Clock,
    AlertCircle,
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface JobActionButtonsProps {
    job: any;
    role: 'driver' | 'professional' | 'service-provider';
    onStatusUpdate: () => void;
}

export const JobActionButtons = ({ job, role, onStatusUpdate }: JobActionButtonsProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleAction = async (endpoint: string, method: string = 'PATCH') => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/requests/${job.id}/${endpoint}`, {
                method
            });
            if (res.success) {
                toast({ title: "Success", description: res.message || "Status updated." });
                onStatusUpdate();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to update status", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const isCab = job.request_type === 'cab';
    const isProfessional = job.request_type === 'professional';
    const isProvider = job.request_type === 'provider';

    // Status logic based on job.details and status
    const details = job.details || {};

    // Actions for Driver (Cab)
    if (role === 'driver' && isCab) {
        if (!details.cab_driver_arrived) {
            return (
                <Button
                    onClick={() => handleAction('cab-driver-arrived')}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl font-bold"
                >
                    <Navigation className="mr-2 h-4 w-4" /> I have Arrived
                </Button>
            );
        }
        if (!details.cab_arrived_at_location) {
            return (
                <Button
                    onClick={() => handleAction('cab-arrived-at-location')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 w-full rounded-xl font-bold"
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Drop off Complete
                </Button>
            );
        }
    }

    // Actions for Professional
    if (role === 'professional' && isProfessional) {
        if (!details.professional_has_arrived && job.status === 'accepted') {
            return (
                <div className="flex flex-col gap-2 w-full">
                    <p className="text-xs text-amber-600 font-medium italic mb-1 text-center">
                        Note: Client usually marks arrival in this flow, but you can signal readiness.
                    </p>
                    <Button
                        onClick={() => handleAction('professional-has-arrived')}
                        disabled={loading}
                        className="bg-[#5e35b1] hover:bg-[#4527a0] w-full rounded-xl font-bold"
                    >
                        <Clock className="mr-2 h-4 w-4" /> Mark as Arrived/Started
                    </Button>
                </div>
            );
        }
    }

    // Actions for Service Provider
    if (role === 'service-provider' && isProvider) {
        if (!details.provider_has_arrived && job.status === 'accepted') {
            return (
                <Button
                    onClick={() => handleAction('provider-has-arrived')}
                    disabled={loading}
                    className="bg-[#5e35b1] hover:bg-[#4527a0] w-full rounded-xl font-bold"
                >
                    <Play className="mr-2 h-4 w-4" /> Start Service
                </Button>
            );
        }
    }

    if (job.status === 'completed') {
        return (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-2 bg-green-50 rounded-xl border border-green-100 w-full text-sm">
                <CheckCircle2 className="h-4 w-4" /> Ready for Review
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2 text-slate-400 font-medium py-2 bg-slate-50 rounded-xl border border-slate-100 w-full text-sm italic">
            Waiting for activity...
        </div>
    );
};
