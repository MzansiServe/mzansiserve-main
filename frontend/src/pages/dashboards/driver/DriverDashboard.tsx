import { useState, useEffect, useCallback } from "react";
import {
    LayoutTemplate,
    Car,
    TrendingUp,
    Wallet,
    Clock,
    CheckCircle2,
    Star,
    ClipboardList,
    AlertTriangle,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProviderDashboardLayout } from "@/components/dashboards/ProviderDashboardLayout";
import { StatsCard } from "@/components/dashboards/StatsCard";
import { ActiveJobs } from "@/components/dashboards/ActiveJobs";
import { RatingModal } from "@/components/dashboards/RatingModal";
import { JobInbox } from "@/components/dashboards/JobInbox";
import { WalletManagement } from "@/components/dashboards/WalletManagement";
import { VehicleManagement } from "@/components/dashboards/VehicleManagement";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const DriverDashboard = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState<any>(null); // Keeping any for the large complex API response for now to avoid massive interface definition, but reducing usage elsewhere
    const [loading, setLoading] = useState(true);
    const [selectedJobForRating, setSelectedJobForRating] = useState<{ id: string, client_name?: string } | null>(null);

    const navItems = [
        { id: "overview", label: "Overview", icon: LayoutTemplate, href: "#overview", onClick: () => setActiveTab("overview") },
        { id: "active", label: "Active Rides", icon: Clock, href: "#active", onClick: () => setActiveTab("active") },
        { id: "rides", label: "Available Rides", icon: ClipboardList, href: "#rides", onClick: () => setActiveTab("rides") },
        { id: "reviews", label: "Reviews & Feedback", icon: Star, href: "#reviews", onClick: () => setActiveTab("reviews") },
        { id: "vehicles", label: "My Vehicles", icon: Car, href: "#vehicles", onClick: () => setActiveTab("vehicles") },
        { id: "wallet", label: "Wallet & Earnings", icon: Wallet, href: "#wallet", onClick: () => setActiveTab("wallet") },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/dashboard');
            if (res.success) {
                setData(res.data);
            }
        } catch (err: unknown) {
            toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderContent = () => {
        const user = data?.current_user;
        const onboardingBanner = user && (!user.is_approved || !user.is_paid) ? (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-900 text-base mb-1">Your account is pending approval</h3>
                        <p className="text-sm text-amber-700 mb-4">Complete these steps to start accepting rides:</p>
                        <div className="space-y-2">
                            <div className={cn("flex items-center gap-2 text-sm", user.email_verified ? "text-green-700" : "text-amber-700")}>
                                {user.email_verified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4" />}
                                {user.email_verified ? "Email verified ✓" : "Check your email and click the verification link"}
                            </div>
                            <div className={cn("flex items-center gap-2 text-sm", user.id_verification_status === 'verified' ? "text-green-700" : "text-amber-700")}>
                                {user.id_verification_status === 'verified' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4" />}
                                {user.id_verification_status === 'verified' ? "Documents verified ✓" : "Upload your driver's license and vehicle registration via your profile"}
                            </div>
                            <div className={cn("flex items-center gap-2 text-sm", user.is_approved ? "text-green-700" : "text-amber-700")}>
                                {user.is_approved ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Info className="h-4 w-4" />}
                                {user.is_approved ? "Admin approved ✓" : "Waiting for admin review and approval"}
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-amber-600">Tracking number: <span className="font-mono font-bold">{user.tracking_number}</span></p>
                    </div>
                </div>
            </div>
        ) : null;

        if (loading && !data) return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5e35b1]"></div>
            </div>
        );

        switch (activeTab) {
            case "overview":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {onboardingBanner}
                        {/* Stats Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <StatsCard
                                title="Ride Earnings"
                                value={`R${(data?.driver_earnings || 0).toFixed(2)}`}
                                icon={TrendingUp}
                                variant="purple"
                                loading={loading}
                            />
                            <StatsCard
                                title="Wallet Balance"
                                value={`R${(data?.wallet?.balance || 0).toFixed(2)}`}
                                icon={Wallet}
                                variant="light"
                                loading={loading}
                            />
                            <StatsCard
                                title="Completed Rides"
                                value={data?.recent_rides?.length || 0}
                                icon={CheckCircle2}
                                variant="green"
                                loading={loading}
                            />
                            <StatsCard
                                title="Available Rides"
                                value={data?.available_cab_requests?.length || 0}
                                icon={Car}
                                variant="purple"
                                loading={loading}
                            />
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Active Rides / Inbox */}
                            <div className="space-y-8">
                                {(data?.active_rides?.length > 0) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-[#121926]">Ongoing Ride</h2>
                                            <button onClick={() => setActiveTab('active')} className="text-xs font-bold text-blue-600 hover:underline">Manage All</button>
                                        </div>
                                        <ActiveJobs
                                            jobs={data.active_rides}
                                            role="driver"
                                            onStatusUpdate={fetchData}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <JobInbox
                                        jobs={data?.available_cab_requests || []}
                                        role="driver"
                                        onJobAccepted={fetchData}
                                    />
                                </div>
                            </div>

                            {/* Job History Sample */}
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
                                <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-[#121926]">Recent Activity</h2>
                                    <button className="text-xs font-bold text-[#5e35b1] hover:underline" onClick={() => setActiveTab('wallet')}>View All</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {data?.recent_rides?.length > 0 ? (
                                        data.recent_rides.map((ride: any) => (
                                            <div key={ride.id} className="p-4 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-[#ede7f6] text-[#5e35b1] rounded-lg flex items-center justify-center font-bold">
                                                        <Star className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#121926]">{ride.pickup_address?.split(',')[0] || 'Ride'}</p>
                                                        <p className="text-xs text-[#697586]">{new Date(ride.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[#5e35b1]">R{ride.payment_amount?.toFixed(2)}</p>
                                                    <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Completed</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-[#697586] italic text-sm">
                                            No recent activity found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "active":
                return (
                    <div className="animate-in fade-in duration-500">
                        <ActiveJobs
                            jobs={data?.active_rides || []}
                            role="driver"
                            onStatusUpdate={fetchData}
                        />
                    </div>
                );
            case "rides":
                return (
                    <div className="animate-in fade-in duration-500">
                        <JobInbox
                            jobs={data?.available_cab_requests || []}
                            role="driver"
                            onJobAccepted={fetchData}
                        />
                    </div>
                );
            case "reviews":
                return (
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full animate-in fade-in duration-500">
                        <div className="border-b border-gray-100 px-6 py-5 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-[#121926]">Reviews & Feedback</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {data?.recent_rides?.filter((r: any) => r.has_driver_rating).length > 0 ? (
                                data.recent_rides.filter((r: any) => r.has_driver_rating).map((ride: any) => (
                                    <div key={ride.id} className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star 
                                                        key={star} 
                                                        className={cn("h-4 w-4", star <= ride.details?.driver_rating ? "text-amber-400 fill-current" : "text-slate-200")} 
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(ride.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 italic">"{ride.details?.driver_review || "No comments provided."}"</p>
                                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Trip: {ride.pickup_address?.split(',')[0]} → {ride.dropoff_address?.split(',')[0]}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-[#697586] italic text-sm">
                                    No reviews yet. Complete more rides to receive feedback!
                                </div>
                            )}
                        </div>
                    </div>
                );
            case "vehicles":
                return (
                    <div className="animate-in fade-in duration-500">
                        <VehicleManagement
                            initialVehicles={data?.profile_data?.driver_services || []}
                        />
                    </div>
                );
            case "wallet":
                return (
                    <div className="animate-in fade-in duration-500">
                        <WalletManagement
                            balance={data?.wallet?.balance || 0}
                            transactions={data?.wallet?.transactions || []}
                            role="driver"
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
            role="driver"
            title={activeTab === 'overview' ? 'Driver Console' : navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            subtitle="Monitor your trips, manage earnings, and see your driver statistics."
            navItems={navItems}
            activeTabId={activeTab}
            onWithdrawClick={() => setActiveTab("wallet")}
            onFindJobsClick={() => setActiveTab("rides")}
        >
            {/* Mobile Tab Swiper/Buttons */}
            <div className="mb-6 flex gap-2 lg:hidden">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-full transition-all",
                            activeTab === item.id ? "bg-[#5e35b1] text-white shadow-md shadow-purple-100" : "bg-white text-[#697586] border border-gray-100"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {renderContent()}

            {/* Rating Modal */}
            <RatingModal
                isOpen={!!selectedJobForRating}
                onClose={() => setSelectedJobForRating(null)}
                jobId={selectedJobForRating?.id}
                clientName={selectedJobForRating?.client_name || "Client"}
                onSuccess={fetchData}
            />
        </ProviderDashboardLayout>
    );
};

export default DriverDashboard;
