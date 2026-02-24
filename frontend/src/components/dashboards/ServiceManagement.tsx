import { useState } from "react";
import {
    Plus,
    Trash2,
    Save,
    Info,
    DollarSign,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Service {
    name: string;
    description: string;
    hourly_rate?: number;
}

interface ServiceManagementProps {
    initialServices: Service[];
    role: 'professional' | 'service-provider';
}

export const ServiceManagement = ({ initialServices, role }: ServiceManagementProps) => {
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>(initialServices || []);
    const [saving, setSaving] = useState(false);

    const addService = () => {
        setServices([...services, { name: "", description: "", hourly_rate: 0 }]);
    };

    const removeService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };

    const updateService = (index: number, field: keyof Service, value: any) => {
        const newServices = [...services];
        newServices[index] = { ...newServices[index], [field]: value };
        setServices(newServices);
    };

    const handleSave = async () => {
        // Validation
        if (services.some(s => !s.name.trim())) {
            toast({ title: "Validation Error", description: "All services must have a name.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const fieldName = role === 'professional' ? 'professional_services' : 'provider_services';
            const res = await apiFetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    [fieldName]: services
                })
            });

            if (res.success) {
                toast({
                    title: "Update Submitted",
                    description: "Your service changes have been submitted for admin approval."
                });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to submit changes", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#ede7f6] text-[#5e35b1]">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#121926]">My Services</h2>
                        <p className="text-xs text-[#697586] font-medium mt-0.5">Manage the services you offer to clients.</p>
                    </div>
                </div>
                <Button
                    onClick={addService}
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold gap-2"
                >
                    <Plus className="h-4 w-4" /> Add New
                </Button>
            </div>

            <div className="p-6 space-y-6">
                {services.length > 0 ? (
                    <div className="space-y-4">
                        {services.map((service, index) => (
                            <div key={index} className="p-5 border border-gray-100 rounded-xl bg-slate-50/30 hover:border-blue-100 transition-colors group">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex-1 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#697586]">Service Name</label>
                                                <input
                                                    type="text"
                                                    value={service.name}
                                                    onChange={(e) => updateService(index, 'name', e.target.value)}
                                                    placeholder="e.g., Plumbing Repair"
                                                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                />
                                            </div>
                                            {role === 'professional' && (
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#697586]">Hourly Rate (R)</label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#697586]" />
                                                        <input
                                                            type="number"
                                                            value={service.hourly_rate}
                                                            onChange={(e) => updateService(index, 'hourly_rate', parseFloat(e.target.value))}
                                                            className="w-full bg-white border border-gray-100 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#697586]">Description</label>
                                            <textarea
                                                value={service.description}
                                                onChange={(e) => updateService(index, 'description', e.target.value)}
                                                placeholder="Briefly describe what this service entails..."
                                                className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeService(index)}
                                        className="text-[#697586] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-base font-bold text-[#121926]">No services listed</h3>
                        <p className="text-sm text-[#697586] mt-1 italic">Click "Add New" to list your first service.</p>
                    </div>
                )}

                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Note:</strong> Any changes or additions to your services will require review and approval by an administrator before they become visible to clients.
                    </p>
                </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-gray-100 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#5e35b1] hover:bg-[#4527a0] rounded-xl px-10 font-bold shadow-lg shadow-purple-100 gap-2"
                >
                    {saving ? "Processing..." : "Submit for Approval"}
                    {!saving && <Save className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};
