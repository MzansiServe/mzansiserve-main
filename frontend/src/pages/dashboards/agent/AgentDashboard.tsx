import { useState, useEffect, useCallback } from "react";
import {
    LayoutTemplate,
    Users,
    TrendingUp,
    Wallet,
    History,
    DollarSign,
    CheckCircle2,
    Shield,
    Share2,
    Copy,
    Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProviderDashboardLayout } from "@/components/dashboards/ProviderDashboardLayout";
import { StatsCard } from "@/components/dashboards/StatsCard";
import { WalletManagement } from "@/components/dashboards/WalletManagement";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const AgentDashboard = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const navItems = [
        { id: "overview", label: "Agent Overview", icon: LayoutTemplate, href: "#overview", onClick: () => setActiveTab("overview") },
        { id: "recruits", label: "My Recruits", icon: Users, href: "#recruits", onClick: () => setActiveTab("recruits") },
        { id: "wallet", label: "Earnings & Wallet", icon: Wallet, href: "#wallet", onClick: () => setActiveTab("wallet") },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/dashboard');
            if (res.success) {
                setData(res.data);
            }
        } catch (err: unknown) {
            toast({ title: "Error", description: "Failed to load agent data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const copyAgentCode = () => {
        const code = data?.current_user?.tracking_number;
        if (code) {
            navigator.clipboard.writeText(code);
            toast({ title: "Copied!", description: "Agent code copied to clipboard." });
        }
    };

    const renderContent = () => {
        if (loading && !data) return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5e35b1]"></div>
            </div>
        );

        switch (activeTab) {
            case "overview":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Referral Card */}
                        <div className="bg-white border border-purple-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Your Referral Code</h3>
                                    <p className="text-slate-500 mt-1">Share this code with new users to earn rewards instantly.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-14 px-6 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-mono text-xl font-bold tracking-widest text-primary shadow-inner">
                                        {data?.current_user?.tracking_number || "---"}
                                    </div>
                                    <Button onClick={copyAgentCode} size="icon" className="h-14 w-14 rounded-xl shadow-lg">
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl">
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-[#121926] p-8 rounded-2xl text-white md:w-72 shrink-0 relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary/20 rounded-full blur-2xl transition-transform group-hover:scale-150" />
                                <Award className="h-10 w-10 text-primary mb-4 relative z-10" />
                                <h4 className="text-lg font-bold mb-1 relative z-10">Commission Rates</h4>
                                <p className="text-sm text-slate-400 relative z-10">You get up to <span className="text-white font-bold">R30.00</span> for every professional you recruit.</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <StatsCard
                                title="Total Earned"
                                value={`R${(data?.agent_stats?.total_earned || 0).toFixed(2)}`}
                                icon={TrendingUp}
                                variant="purple"
                                loading={loading}
                            />
                            <StatsCard
                                title="Total Recruits"
                                value={data?.agent_stats?.total_recruits || 0}
                                icon={Users}
                                variant="light"
                                loading={loading}
                            />
                            <StatsCard
                                title="Available Balance"
                                value={`R${(data?.wallet?.balance || 0).toFixed(2)}`}
                                icon={Wallet}
                                variant="green"
                                loading={loading}
                            />
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
                            <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-bold text-[#121926]">Recent Rewards</h2>
                                <button className="text-xs font-bold text-[#5e35b1] hover:underline" onClick={() => setActiveTab('recruits')}>View All</button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {data?.agent_stats?.recent_commissions?.length > 0 ? (
                                    data.agent_stats.recent_commissions.map((comm: any) => (
                                        <div key={comm.id} className="p-4 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                                                    <DollarSign className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#121926]">{comm.recruited_user_email}</p>
                                                    <p className="text-xs text-[#697586] capitalize">{comm.recruited_user_role} • {new Date(comm.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-600">+ R{comm.amount.toFixed(2)}</p>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded">Processed</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-[#697586] italic text-sm">
                                        No recent commissions found. Start sharing your code to earn!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case "recruits":
                return (
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full animate-in fade-in duration-500">
                        <div className="border-b border-gray-100 px-8 py-6 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-[#121926]">Full Recruitment History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-[#f8fafc]">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-[#697586] uppercase tracking-wider">Recruited User</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-[#697586] uppercase tracking-wider">Role</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-[#697586] uppercase tracking-wider">Date</th>
                                        <th className="px-8 py-4 text-right text-xs font-bold text-[#697586] uppercase tracking-wider">Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data?.agent_stats?.recent_commissions?.map((comm: any) => (
                                        <tr key={comm.id} className="hover:bg-[#f8fafc] transition-colors">
                                            <td className="px-8 py-4 text-sm font-bold text-[#121926]">{comm.recruited_user_email}</td>
                                            <td className="px-8 py-4 text-sm text-[#697586] capitalize">{comm.recruited_user_role}</td>
                                            <td className="px-8 py-4 text-sm text-[#697586]">{new Date(comm.created_at).toLocaleDateString()}</td>
                                            <td className="px-8 py-4 text-sm font-bold text-emerald-600 text-right">R {comm.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "wallet":
                return (
                    <div className="animate-in fade-in duration-500">
                        <WalletManagement
                            balance={data?.wallet?.balance || 0}
                            transactions={data?.wallet?.transactions || []}
                            role="driver" // Using driver theme for purple
                            onWithdrawalRequested={fetchData}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <ProviderDashboardLayout
            role="service-provider" // Agent uses service provider base style (purple)
            title={activeTab === 'overview' ? 'Affiliate HUB' : navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            subtitle="Track your recruits, monitor earnings, and manage your agent account."
            navItems={navItems}
            activeTabId={activeTab}
            onWithdrawClick={() => setActiveTab("wallet")}
            onFindJobsClick={() => setActiveTab("recruits")}
        >
            {renderContent()}
        </ProviderDashboardLayout>
    );
};

export default AgentDashboard;
