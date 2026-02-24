import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    ClipboardList,
    Package,
    HelpCircle,
    ListTree,
    Briefcase,
    DollarSign,
    Image as ImageIcon,
    LayoutTemplate,
    Settings,
    Shield,
    CreditCard,
    UserSquare2,
    Clock,
    LogOut,
    Menu,
    Search,
    Bell,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    MessageSquare,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { RequestsManagement } from "@/components/admin/RequestsManagement";
import { ProductsManagement } from "@/components/admin/ProductsManagement";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { WithdrawalsManagement } from "@/components/admin/WithdrawalsManagement";
import { AgentsManagement } from "@/components/admin/AgentsManagement";
import { PendingUpdatesManagement } from "@/components/admin/PendingUpdatesManagement";
import { SettingsManagement } from "@/components/admin/SettingsManagement";
import { FAQManagement } from "@/components/admin/FAQManagement";
import { CategoriesManagement } from "@/components/admin/CategoriesManagement";
import { ServicesManagement } from "@/components/admin/ServicesManagement";
import { SalesFinance } from "@/components/admin/SalesFinance";
import { CarouselManagement } from "@/components/admin/CarouselManagement";
import { ApiLogsManagement } from "@/components/admin/ApiLogsManagement";
import { ReportsManagement } from "@/components/admin/ReportsManagement";
import { GlobalChatsManagement } from "@/components/admin/GlobalChatsManagement";
import { AffiliatesManagement } from "@/components/admin/AffiliatesManagement";
import LandingPageManagement from "@/components/admin/LandingPageManagement";

type TabKey =
    | "overview"
    | "users"
    | "requests"
    | "products"
    | "faqs"
    | "categories"
    | "services"
    | "sales"
    | "carousel"
    | "cms"
    | "settings"
    | "legal"
    | "withdrawals"
    | "agents"
    | "pending-updates"
    | "pendingUpdates"
    | "api-logs"
    | "user-reports"
    | "global-chats"
    | "affiliates"
    | "landing";

const NAV_STRUCTURE = [
    {
        type: "item",
        id: "overview",
        label: "Dashboard",
        icon: LayoutTemplate
    },
    {
        type: "item",
        id: "users",
        label: "Users Management",
        icon: Users
    },
    {
        type: "item",
        id: "affiliates",
        label: "Affiliates & Agents",
        icon: UserSquare2
    },
    {
        type: "group",
        label: "Monitoring",
        icon: Shield,
        children: [
            { id: "api-logs", label: "API Logs", icon: Settings },
            { id: "user-reports", label: "User Reports", icon: ShieldAlert },
            { id: "global-chats", label: "Global Chats", icon: MessageSquare },
        ]
    },
    {
        type: "group",
        label: "Marketplace",
        icon: Package,
        children: [
            { id: "products", label: "Products", icon: Package },
            { id: "categories", label: "Categories", icon: ListTree },
        ]
    },
    {
        type: "group",
        label: "Service Ops",
        icon: Briefcase,
        children: [
            { id: "requests", label: "Requests", icon: ClipboardList },
            { id: "services", label: "Services", icon: Briefcase },
            { id: "withdrawals", label: "Withdrawals", icon: CreditCard },
            { id: "agents", label: "Agents", icon: UserSquare2 },
            { id: "pending-updates", label: "Pending Updates", icon: Clock },
        ]
    },
    {
        type: "group",
        label: "Portal Management",
        icon: Settings,
        children: [
            { id: "faqs", label: "FAQs", icon: HelpCircle },
            { id: "carousel", label: "Carousel", icon: ImageIcon },
            { id: "landing", label: "Landing Page", icon: LayoutTemplate },
            { id: "cms", label: "Footer CMS", icon: LayoutTemplate },
            { id: "settings", label: "Settings", icon: Settings },
            { id: "legal", label: "Legal", icon: Shield },
        ]
    }
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [adminName, setAdminName] = useState<string>("Admin");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        const userStr = localStorage.getItem("adminUser");

        if (!token) {
            navigate("/admin/login");
            return;
        }

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setAdminName(user.first_name || user.username || "Admin");
            } catch (e) {
                console.error("Failed to parse admin data:", e);
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (activeTab === "overview") {
            const fetchDashboardData = async () => {
                setLoadingStats(true);
                try {
                    const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };

                    const statsRes = await apiFetch("/api/admin/global-stats", { headers: adminHeaders });
                    if (statsRes?.success) setStats(statsRes.data);

                    const ordersRes = await apiFetch("/api/admin/orders?limit=6", { headers: adminHeaders });
                    if (ordersRes?.success) setRecentOrders(ordersRes.data.orders);

                    const requestsRes = await apiFetch("/api/admin/requests?limit=6", { headers: adminHeaders });
                    if (requestsRes?.success) setRecentRequests(requestsRes.data.requests);
                } catch (error) {
                    console.error("Failed to fetch dashboard stats", error);
                } finally {
                    setLoadingStats(false);
                }
            };
            fetchDashboardData();
        }
    }, [activeTab]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        toast({ title: "Logged Out", description: "You have securely logged out." });
        navigate("/admin/login");
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const NavItem = ({ item, isChild = false }: { item: any; isChild?: boolean }) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
            <button
                onClick={() => setActiveTab(item.id as TabKey)}
                className={cn(
                    "flex items-center gap-3 w-full px-4 py-3  transition-all duration-200 text-sm font-medium relative group",
                    isActive
                        ? "bg-[#ede7f6] text-[#5e35b1]"
                        : "text-[#364152] hover:bg-[#f8fafc] hover:text-[#5e35b1]",
                    isChild && "pl-12 py-2"
                )}
            >
                {isChild && (
                    <div className="absolute left-[22px] top-0 bottom-0 w-[1px] bg-slate-100 group-hover:bg-[#5e35b1]/20" />
                )}
                {isChild && isActive && (
                    <div className="absolute left-[19px] top-1/2 -translate-y-1/2 w-[7px] h-[7px]  bg-[#5e35b1] border-2 border-white shadow-sm z-10" />
                )}
                {!isChild && <Icon className={cn("h-[20px] w-[20px]", isActive ? "text-[#5e35b1]" : "text-[#697586]")} strokeWidth={isActive ? 2.5 : 2} />}
                <span className={cn(isActive && "font-bold")}>{item.label}</span>
            </button>
        );
    };

    const NavGroup = ({ group }: { group: any }) => {
        const hasActiveChild = group.children.some((child: any) => activeTab === child.id);
        const [isOpen, setIsOpen] = useState(hasActiveChild);

        useEffect(() => {
            if (hasActiveChild) setIsOpen(true);
        }, [hasActiveChild]);

        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between w-full px-4 py-3  transition-all duration-200 text-sm font-medium",
                        hasActiveChild
                            ? "text-[#5e35b1]"
                            : "text-[#364152] hover:bg-[#f8fafc] hover:text-[#5e35b1]"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <group.icon className={cn("h-[20px] w-[20px]", hasActiveChild ? "text-[#5e35b1]" : "text-[#697586]")} strokeWidth={hasActiveChild ? 2.5 : 2} />
                        <span className={cn(hasActiveChild && "font-bold")}>{group.label}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 opacity-50", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                    <div className="space-y-1 mt-1">
                        {group.children.map((child: any) => (
                            <NavItem key={child.id} item={child} isChild={true} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="mb-4">
                    <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#5e35b1] opacity-70 mb-4">Platform Control</p>
                </div>
                <nav className="space-y-2">
                    {NAV_STRUCTURE.map((entry, idx) => (
                        <div key={idx}>
                            {entry.type === "group" ? (
                                <NavGroup group={entry} />
                            ) : (
                                <NavItem item={entry} />
                            )}
                        </div>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t border-gray-100 bg-slate-50/30">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-start gap-3  px-4 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-50 hover:gap-4 group"
                >
                    <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Logout Account
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Berry Top Stats Cards */}
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {/* Primary Purple Card */}
                            <div className="relative overflow-hidden  bg-[#5e35b1] p-6 text-white shadow-sm transition-transform hover:-translate-y-1">
                                {/* Decorative Circles */}
                                <div className="absolute -right-6 -top-6 h-32 w-32  bg-white/10"></div>
                                <div className="absolute -right-16 -top-16 h-32 w-32  bg-white/10"></div>
                                <div className="relative z-10">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className=" bg-[#4527a0] p-2">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold">{loadingStats ? "..." : (stats?.users?.total || 0)}</h3>
                                    <p className="mt-1 text-sm font-medium text-purple-100">Total Users</p>
                                </div>
                            </div>

                            {/* Blue Card */}
                            <div className="relative overflow-hidden  bg-[#1e88e5] p-6 text-white shadow-sm transition-transform hover:-translate-y-1">
                                <div className="absolute -right-6 -top-6 h-32 w-32  bg-white/10"></div>
                                <div className="absolute -right-16 -top-16 h-32 w-32  bg-white/10"></div>
                                <div className="relative z-10">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className=" bg-[#1565c0] p-2">
                                            <ClipboardList className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold">{loadingStats ? "..." : (stats?.requests?.total || 0)}</h3>
                                    <p className="mt-1 text-sm font-medium text-blue-100">Total Requests</p>
                                </div>
                            </div>

                            {/* Warning/Light Card for Pending */}
                            <div className="relative overflow-hidden  bg-white p-6 shadow-sm border border-gray-100 transition-transform hover:-translate-y-1">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className=" bg-orange-50 p-2">
                                        <ShieldAlert className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-[#121926]">{loadingStats ? "..." : (stats?.feedback?.pending_reports || 0)}</h3>
                                <p className="mt-1 text-sm font-medium text-[#697586]">Pending Reports</p>
                            </div>

                            {/* Success/Light Card for Revenue */}
                            <div className="relative overflow-hidden  bg-white p-6 shadow-sm border border-gray-100 transition-transform hover:-translate-y-1">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className=" bg-green-50 p-2">
                                        <MessageSquare className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-[#121926]">{loadingStats ? "..." : (stats?.activity?.total_chats || 0)}</h3>
                                <p className="mt-1 text-sm font-medium text-[#697586]">Total Chats</p>
                            </div>
                        </div>

                        {/* Recent Activity / Chart Section matching Berry */}
                        <div className="grid gap-6 md:grid-cols-12 lg:grid-cols-12">
                            <div className="md:col-span-6 lg:col-span-6">
                                <div className=" border border-gray-100 bg-white shadow-sm h-full min-h-[400px]">
                                    <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-[#121926]">Recent Market Orders</h2>
                                    </div>
                                    <div className="p-0">
                                        {recentOrders.length > 0 ? (
                                            <div className="divide-y divide-gray-100">
                                                {recentOrders.map((order, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 bg-blue-100 text-[#1e88e5]  flex items-center justify-center font-bold mr-4 text-xs">
                                                                #{order.id.toString().slice(-4)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#121926]">Order #{order.id}</p>
                                                                <p className="text-xs text-[#697586]">{new Date(order.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-[#1e88e5]">R{Number(order.total_amount).toFixed(2)}</p>
                                                            <span className="inline-flex px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800">
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex h-64 items-center justify-center text-[#697586]">
                                                {loadingStats ? "Loading..." : "No recent orders."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-6 lg:col-span-6">
                                <div className=" border border-gray-100 bg-white shadow-sm h-full min-h-[400px]">
                                    <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-[#121926]">Recent Service Requests</h2>
                                    </div>
                                    <div className="p-0">
                                        {recentRequests.length > 0 ? (
                                            <div className="divide-y divide-gray-100">
                                                {recentRequests.map((req, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 bg-[#ede7f6] text-[#5e35b1]  flex items-center justify-center font-bold mr-4">
                                                                <Briefcase className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#121926] capitalize">{req.request_type} Request</p>
                                                                <p className="text-xs text-[#697586]">{new Date(req.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="inline-flex px-2 py-1  text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-800">
                                                                {req.status || 'pending'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex h-64 items-center justify-center text-[#697586]">
                                                {loadingStats ? "Loading..." : "No recent requests."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "users":
                return <UsersManagement />;
            case "requests":
                return <RequestsManagement />;
            case "products":
                return <ProductsManagement />;
            case "faqs":
                return <FAQManagement />;
            case "categories":
                return <CategoriesManagement />;
            case "services":
                return <ServicesManagement />;
            case "sales":
                return <SalesFinance />;
            case "carousel":
                return <CarouselManagement />;
            case "landing":
                return <LandingPageManagement />;
            case "cms":
            case "legal":
                return <ContentManagement />;
            case "settings":
                return <SettingsManagement />;
            case "withdrawals":
                return <WithdrawalsManagement />;
            case "agents":
                return <AgentsManagement />;
            case "pending-updates":
                return <PendingUpdatesManagement />;
            case "affiliates":
                return <AffiliatesManagement />;
            case "api-logs":
                return <ApiLogsManagement />;
            case "user-reports":
                return <ReportsManagement />;
            case "global-chats":
                return <GlobalChatsManagement />;
            default:
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="h-32 bg-white  border border-slate-100 p-6 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Traffic</span>
                                <div className="text-3xl font-black text-slate-900 mt-2">Active</div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-screen bg-[#eef2f6] font-sans">
            {/* Sidebar Desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[260px] transform bg-white transition-transform duration-300 ease-in-out border-r border-gray-100 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full lg:w-0 lg:overflow-hidden lg:border-none"
                    }`}
            >
                {/* Logo Area matches Berry header */}
                <div className="flex h-[80px] items-center px-6">
                    <span className="flex items-center gap-2 font-bold cursor-pointer" onClick={() => navigate('/')}>
                        <div className="flex h-8 w-8 items-center justify-center  bg-[#ede7f6] text-[#5e35b1]">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-[#121926]">
                            MzansiServe
                        </span>
                        <span className="ml-1  bg-[#e3f2fd] px-2 py-0.5 text-[10px] font-bold text-[#1e88e5]">
                            ADMIN
                        </span>
                    </span>
                </div>
                <div style={{ height: 'calc(100vh - 80px)' }}>
                    <SidebarContent />
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                {/* Top Header - Matches Berry style (white, floating or solid) */}
                <header className="sticky top-0 z-30 flex h-[80px] w-full items-center justify-between bg-white px-4 md:px-6 border-b border-gray-100 transition-all">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="flex h-8 w-8 items-center justify-center  bg-[#ede7f6] text-[#5e35b1] transition-colors hover:bg-[#5e35b1] hover:text-white"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="hidden md:flex ml-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search here"
                                className="h-10 w-[250px]  border border-gray-200 bg-[#f8fafc] pl-10 pr-4 text-sm outline-none focus:border-[#5e35b1] focus:ring-1 focus:ring-[#5e35b1] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex h-9 w-9 items-center justify-center  bg-[#ede7f6] text-[#5e35b1] transition-colors hover:bg-[#5e35b1] hover:text-white relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full  bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex  h-2 w-2 bg-red-500"></span>
                            </span>
                        </button>

                        <div className="flex items-center gap-3  bg-[#e3f2fd] py-1.5 px-3 cursor-pointer hover:bg-blue-100 transition-colors">
                            <div className="flex h-8 w-8 items-center justify-center  bg-[#1e88e5] text-white font-bold text-sm">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-[#1e88e5] hidden md:block">
                            </span>
                            <Settings className="h-4 w-4 text-[#1e88e5]" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {/* Page Header */}
                        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-[#121926] capitalize tracking-tight flex items-center gap-3">
                                    <div className="h-8 w-1.5  bg-[#5e35b1]" />
                                    {activeTab === "overview" ? "System Overview" : activeTab.replace(/([A-Z])/g, ' $1').trim()}
                                </h1>
                                <p className="text-sm text-[#697586] mt-1 font-medium italic opacity-70">
                                    Platform administration & operational controls
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className=" bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-[#364152] shadow-sm hover:bg-gray-50 flex items-center gap-2">
                                    Export
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                <button className=" bg-[#1e88e5] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1565c0]">
                                    Report
                                </button>
                            </div>
                        </div>

                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
