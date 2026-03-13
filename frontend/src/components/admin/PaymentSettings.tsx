import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Save,
    CreditCard,
    Power,
    ShieldCheck,
    Globe,
    Lock,
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
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const PaymentSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        paypal: {
            enabled: false,
            client_id: "",
            client_secret: "",
            mode: "sandbox"
        },
        yoco: {
            enabled: false,
            secret_key: "",
            api_url: "https://payments.yoco.com"
        }
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/settings/payment", { headers: adminHeaders });
            
            if (res?.success) {
                setSettings(res.data);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load payment settings.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            await apiFetch("/api/admin/settings/payment", {
                method: "PATCH",
                headers: adminHeaders,
                data: settings
            });

            toast({ 
                title: "Settings Saved", 
                description: "Payment gateways have been reconfigured.", 
                className: "bg-[#5e35b1] text-white" 
            });
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
                <span className="text-sm font-medium text-slate-400">Loading payment gateways...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Payment Gateways</h3>
                    <p className="text-slate-500 font-medium">Enable and configure checkout providers for the platform.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-10 bg-[#5e35b1] hover:bg-[#4527a0] font-black shadow-xl shadow-purple-200"
                >
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="w-5 h-5 mr-3" />}
                    Save Configuration
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PayPal Configuration */}
                <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-[#003087]/10 text-[#003087] flex items-center justify-center">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black">PayPal Checkout</CardTitle>
                                    <CardDescription>Global payments and subscriptions.</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.paypal.enabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                                    {settings.paypal.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <Switch
                                    checked={settings.paypal.enabled}
                                    onCheckedChange={(val) => setSettings({
                                        ...settings,
                                        paypal: { ...settings.paypal, enabled: val }
                                    })}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Lock className="w-3 h-3 mr-2" /> Client ID
                                </label>
                                <Input
                                    value={settings.paypal.client_id}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        paypal: { ...settings.paypal, client_id: e.target.value }
                                    })}
                                    placeholder="Enter PayPal Client ID"
                                    className="font-medium h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <ShieldCheck className="w-3 h-3 mr-2" /> Client Secret
                                </label>
                                <Input
                                    type="password"
                                    value={settings.paypal.client_secret}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        paypal: { ...settings.paypal, client_secret: e.target.value }
                                    })}
                                    placeholder="••••••••••••••••"
                                    className="font-medium h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Globe className="w-3 h-3 mr-2" /> Environment Mode
                                </label>
                                <Select
                                    value={settings.paypal.mode}
                                    onValueChange={(val) => setSettings({
                                        ...settings,
                                        paypal: { ...settings.paypal, mode: val }
                                    })}
                                >
                                    <SelectTrigger className="h-11 font-bold">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                                        <SelectItem value="live">Live (Production)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Yoco Configuration */}
                <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-[#00aaff]/10 text-[#00aaff] flex items-center justify-center">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black">Yoco (South Africa)</CardTitle>
                                    <CardDescription>Local card payments and EFT.</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.yoco.enabled ? 'text-emerald-500' : 'text-slate-300'}`}>
                                    {settings.yoco.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <Switch
                                    checked={settings.yoco.enabled}
                                    onCheckedChange={(val) => setSettings({
                                        ...settings,
                                        yoco: { ...settings.yoco, enabled: val }
                                    })}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <ShieldCheck className="w-3 h-3 mr-2" /> Secret Key
                                </label>
                                <Input
                                    type="password"
                                    value={settings.yoco.secret_key}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        yoco: { ...settings.yoco, secret_key: e.target.value }
                                    })}
                                    placeholder="sk_test_..."
                                    className="font-medium h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Globe className="w-3 h-3 mr-2" /> API URL
                                </label>
                                <Input
                                    value={settings.yoco.api_url}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        yoco: { ...settings.yoco, api_url: e.target.value }
                                    })}
                                    placeholder="https://payments.yoco.com"
                                    className="font-medium h-11 text-xs"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                <strong>Tip:</strong> Use your test secret keys for sandbox mode and live secret keys for real transactions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Info */}
            <div className="p-6 bg-[#fafafa] border border-slate-100 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm">
                    <Power className="h-5 w-5" />
                </div>
                <div className="text-sm">
                    <p className="text-slate-600 font-bold">Automatic Synchronization</p>
                    <p className="text-slate-400 font-medium italic">Changes take effect immediately for all new checkout sessions. Active sessions are not affected.</p>
                </div>
            </div>
        </div>
    );
};
