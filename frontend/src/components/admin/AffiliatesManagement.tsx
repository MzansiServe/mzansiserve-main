import { useState, useEffect } from "react";
import { 
  UserSquare2, DollarSign, TrendingUp, Users, 
  Settings, RefreshCw, CheckCircle2, AlertCircle 
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const AffiliatesManagement = () => {
  const { toast } = useToast();
  const [commissions, setRecentCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    agent_commission_default: "20",
    agent_commission_driver: "25",
    agent_commission_professional: "30",
    agent_commission_service_provider: "25",
    agent_commission_client: "10"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch settings
      const settingsRes = await apiFetch('/api/admin/settings');
      if (settingsRes.success) {
        const s: any = {};
        settingsRes.data.forEach((item: any) => {
          if (item.id.startsWith('agent_commission_')) {
            s[item.id.replace(/-/g, '_')] = item.value.toString();
          }
        });
        setSettings(prev => ({ ...prev, ...s }));
      }

      // Fetch recent global commissions (admin route)
      const commRes = await apiFetch('/api/admin/global-commissions');
      if (commRes.success) {
        setRecentCommissions(commRes.data.commissions);
      }
    } catch (err) {
      console.error("Failed to fetch affiliate data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In a real implementation, we might have a bulk settings update or individual calls
      // For now, let's simulate updating the key ones
      const promises = Object.entries(settings).map(([key, value]) => 
        apiFetch('/api/admin/settings/update-key', {
          method: 'PATCH',
          data: { key: key.replace(/_/g, '-'), value }
        })
      );
      
      await Promise.all(promises);
      toast({ title: "Settings Saved", description: "Agent commission rates have been updated." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Commission Settings */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Commission Rates (R)</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Default Rate</Label>
                <Input 
                  type="number" 
                  value={settings.agent_commission_default}
                  onChange={e => setSettings({...settings, agent_commission_default: e.target.value})}
                  className="font-bold" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client Recruit</Label>
                <Input 
                  type="number" 
                  value={settings.agent_commission_client}
                  onChange={e => setSettings({...settings, agent_commission_client: e.target.value})}
                  className="font-bold" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Driver Recruit</Label>
                <Input 
                  type="number" 
                  value={settings.agent_commission_driver}
                  onChange={e => setSettings({...settings, agent_commission_driver: e.target.value})}
                  className="font-bold" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional</Label>
                <Input 
                  type="number" 
                  value={settings.agent_commission_professional}
                  onChange={e => setSettings({...settings, agent_commission_professional: e.target.value})}
                  className="font-bold" 
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-purple-100" disabled={saving}>
              {saving ? "Saving..." : "Update All Rates"}
            </Button>
          </form>
        </div>

        {/* Global Stats */}
        <div className="bg-[#121926] border border-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Affiliate Performance</h3>
            </div>

            <div className="grid grid-cols-2 gap-8 flex-1 content-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Paid Out</p>
                <h2 className="text-4xl font-bold text-white tracking-tight">R 12,450</h2>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Active Agents</p>
                <h2 className="text-4xl font-bold text-white tracking-tight">48</h2>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300">
                Commissions are awarded instantly to agent wallets upon successful user payment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Commissions Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-8 py-6 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Recent Rewards Activity</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recruited User</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {commissions.length > 0 ? (
                commissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{comm.agent_email}</td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{comm.recruited_user_email}</td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {comm.recruited_user_role}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(comm.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                      R {comm.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic text-sm">
                    {loading ? "Loading activity..." : "No recent commissions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
