import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { AdManagement } from "@/components/dashboards/AdManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
    Campaign as CampaignIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";

const AdvertiserDashboard = () => {
    const { user: authUser, logout } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("ads");

    const navItems = [
        { id: "ads", label: "Ad Campaigns", icon: CampaignIcon },
        { id: "settings", label: "Settings", icon: SettingsIcon },
    ];

    const handleLogout = () => {
        logout();
        toast({ title: "Logged Out", description: "You have securely logged out." });
    };

    const renderContent = () => {
        switch (activeTab) {
            case "ads":
                return <AdManagement />;
            case "settings":
                return <div>Settings coming soon...</div>;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout
            title={navItems.find(item => item.id === activeTab)?.label || 'Advertiser Console'}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
            displayName={authUser?.name || "Advertiser"}
            role="Advertiser"
            navStructure={navItems.map(item => ({ ...item, type: 'item' }))}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default AdvertiserDashboard;
