import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Save,
    DollarSign,
    Percent,
    ShieldAlert,
    Info,
    Settings,
    Truck,
    Briefcase,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export const SettingsManagement = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Settings States
    const [settings, setSettings] = useState({
        professional_callout_fee: 0,
        provider_callout_fee: 0,
        driver_admin_fee_rate: 0.10
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };

            // Parallel fetch for different settings
            const [calloutRes, driverFeeRes] = await Promise.all([
                apiFetch("/api/admin/settings/callout-fees", { headers: adminHeaders }),
                apiFetch("/api/admin/settings/driver-admin-fee-rate", { headers: adminHeaders })
            ]);

            setSettings({
                professional_callout_fee: calloutRes?.data?.professional_callout_fee || 0,
                provider_callout_fee: calloutRes?.data?.provider_callout_fee || 0,
                driver_admin_fee_rate: driverFeeRes?.data?.rate || 0.10
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to load platform settings.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveFees = async () => {
        setSaving(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };

            await Promise.all([
                apiFetch("/api/admin/settings/callout-fees", {
                    method: "PATCH",
                    headers: adminHeaders,
                    data: {
                        professional_callout_fee: settings.professional_callout_fee,
                        provider_callout_fee: settings.provider_callout_fee
                    }
                }),
                apiFetch("/api/admin/settings/driver-admin-fee-rate", {
                    method: "PATCH",
                    headers: adminHeaders,
                    data: {
                        rate: settings.driver_admin_fee_rate
                    }
                })
            ]);

            toast({ title: "Configuration Updated", description: "Global platform settings have been synchronized.", className: "bg-[#5e35b1] text-white" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Update failed", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin h-8 w-8 text-[#5e35b1]" />
                <span className="text-sm font-medium text-slate-400">Synchronizing settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h3>
                    <p className="text-slate-500 font-medium">Fine-tune platform economics and operational parameters.</p>
                </div>
                <Button
                    onClick={handleSaveFees}
                    disabled={saving}
                    className="h-12 px-10  bg-[#5e35b1] hover:bg-[#4527a0] font-black shadow-xl shadow-purple-200"
                >
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="w-5 h-5 mr-3" />}
                    Save All Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Settings */}
                <Card className=" border border-slate-200 shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12  bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black">Callout Fee Structure</CardTitle>
                                <CardDescription className="italic">Standard fees charged upfront for service requests.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                    <Briefcase className="w-3 h-3 mr-2" /> Professional Services
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">R</span>
                                    <Input
                                        type="number"
                                        className="pl-10 font-black text-xl text-[#5e35b1]"
                                        value={settings.professional_callout_fee}
                                        onChange={(e) => setSettings({ ...settings, professional_callout_fee: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                    <Zap className="w-3 h-3 mr-2" /> General Service Providers
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">R</span>
                                    <Input
                                        type="number"
                                        className="pl-10 font-black text-xl text-emerald-600 focus:ring-emerald-500"
                                        value={settings.provider_callout_fee}
                                        onChange={(e) => setSettings({ ...settings, provider_callout_fee: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4  bg-slate-50 border border-slate-100 flex gap-3 text-xs text-slate-500 italic">
                            <Info className="w-4 h-4 flex-shrink-0 text-[#5e35b1]" />
                            <p>These fees are non-refundable and paid by the client at the moment of request to secure the provider's dispatch.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Logistics Settings */}
                <Card className=" border border-slate-200 shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12  bg-purple-50 text-[#5e35b1] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Percent className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black">Platform Commissions</CardTitle>
                                <CardDescription className="italic">Revenue share model for logistics and ride services.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                        <Truck className="w-3 h-3 mr-2" /> Driver Admin Fee Rate
                                    </label>
                                    <p className="text-xs text-slate-500">Commission taken from completed rides.</p>
                                </div>
                                <span className="text-3xl font-black text-[#5e35b1] tracking-tighter">{(settings.driver_admin_fee_rate * 100).toFixed(0)}%</span>
                            </div>

                            <div className="px-2">
                                <Slider
                                    value={[settings.driver_admin_fee_rate * 100]}
                                    min={0}
                                    max={50}
                                    step={1}
                                    onValueChange={(vals) => setSettings({ ...settings, driver_admin_fee_rate: vals[0] / 100 })}
                                    className="cursor-pointer"
                                />
                                <div className="flex justify-between mt-3 text-[10px] font-black text-slate-300 uppercase">
                                    <span>Low (0%)</span>
                                    <span>High (50%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6  bg-purple-50/50 border border-purple-100 flex gap-4">
                            <div className="h-10 w-10  bg-white flex items-center justify-center flex-shrink-0 text-[#5e35b1] shadow-sm">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h5 className="font-bold text-sm text-purple-900">Economic Impact</h5>
                                <p className="text-xs text-purple-700 font-medium leading-relaxed">
                                    Changing this rate affects current active drivers. High rates might decrease driver retention while low rates impact platform sustainability.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone / Global Flags */}
            <Card className=" border-none shadow-sm bg-[#fafafa] border border-slate-100">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16  bg-white shadow-sm flex items-center justify-center text-slate-400">
                            <Settings className="h-8 w-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900">Advanced Metadata</h4>
                            <p className="text-sm text-slate-500 font-medium">Other low-level system flags are managed via specialized CMS modules.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="h-12  font-bold text-slate-400 hover:text-slate-900 px-6">
                        View Platform Logs
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
