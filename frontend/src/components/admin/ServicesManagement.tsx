import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    Briefcase,
    Search,
    Power,
    PowerOff,
    Filter,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ServiceType {
    id: string;
    name: string;
    description: string;
    category: string;
    order: number;
    is_active: boolean;
    created_at?: string;
}

export const ServicesManagement = () => {
    const { toast } = useToast();
    const [services, setServices] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Modal States
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form States
    const [editingService, setEditingService] = useState<ServiceType | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "professional",
        order: 0,
        is_active: true
    });
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/service-types", { headers: adminHeaders });
            if (res?.success) {
                setServices(res.data.service_types);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load services.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleOpenServiceModal = (service: ServiceType | null = null) => {
        setEditingService(service);
        if (service) {
            setFormData({
                name: service.name,
                description: service.description || "",
                category: service.category,
                order: service.order,
                is_active: service.is_active
            });
        } else {
            setFormData({
                name: "",
                description: "",
                category: "professional",
                order: services.length,
                is_active: true
            });
        }
        setIsServiceModalOpen(true);
    };

    const handleSaveService = async () => {
        if (!formData.name.trim()) {
            toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
            return;
        }

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const url = editingService
                ? `/api/admin/service-types/${editingService.id}`
                : "/api/admin/service-types";
            const method = editingService ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: adminHeaders,
                body: JSON.stringify(formData)
            });

            if (res?.success) {
                toast({ title: "Success", description: `Service ${editingService ? 'updated' : 'created'} successfully.` });
                setIsServiceModalOpen(false);
                fetchServices();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save service", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch(`/api/admin/service-types/${deleteTargetId}`, {
                method: "DELETE",
                headers: adminHeaders
            });

            if (res?.success) {
                toast({ title: "Deleted", description: "Service removed successfully." });
                setIsDeleteDialogOpen(false);
                fetchServices();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete service", variant: "destructive" });
        }
    };

    const handleToggleStatus = async (service: ServiceType) => {
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch(`/api/admin/service-types/${service.id}`, {
                method: "PUT",
                headers: adminHeaders,
                body: JSON.stringify({ is_active: !service.is_active })
            });

            if (res?.success) {
                toast({ title: "Updated", description: `Service ${service.is_active ? 'deactivated' : 'activated'}.` });
                fetchServices();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
        }
    };

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(services.map(s => s.category)));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Available Services</h3>
                    <p className="text-sm text-slate-500">Manage the types of services users can request.</p>
                </div>
                <Button
                    onClick={() => handleOpenServiceModal()}
                    className="h-10  bg-[#5e35b1] hover:bg-[#4527a0] text-white shadow-lg shadow-purple-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4  shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search services..."
                        className="pl-10 font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-4 w-4 text-[#5e35b1]" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-10 w-full md:w-[200px]  border-slate-100 shadow-none focus:ring-[#5e35b1]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className=" border-slate-100">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Services Table */}
            <div className=" border border-slate-100 bg-white shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[11px] font-extrabold text-[#5e35b1] uppercase tracking-wider">Service info</th>
                                <th className="px-6 py-4 text-left text-[11px] font-extrabold text-[#5e35b1] uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-[11px] font-extrabold text-[#5e35b1] uppercase tracking-wider">Order</th>
                                <th className="px-6 py-4 text-left text-[11px] font-extrabold text-[#5e35b1] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-[11px] font-extrabold text-[#5e35b1] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin h-8 w-8 text-[#5e35b1]" />
                                            <span className="text-sm font-medium text-slate-400">Loading directory...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Briefcase className="h-12 w-12 text-slate-300" />
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">No services found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{service.name}</span>
                                                <span className="text-xs text-slate-500 line-clamp-1 italic">{service.description || "No description"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="outline" className="bg-[#ede7f6] text-[#5e35b1] border-[#d1c4e9]  px-2 py-0.5 font-bold uppercase text-[9px]">
                                                {service.category}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-mono font-bold text-slate-400">{service.order}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge
                                                className={cn(
                                                    " px-2.5 py-0.5 text-[10px] uppercase font-black transition-all shadow-sm",
                                                    service.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-200"
                                                )}
                                            >
                                                {service.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleStatus(service)}
                                                    className={cn("h-8 w-8 ", service.is_active ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50")}
                                                >
                                                    {service.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenServiceModal(service)}
                                                    className="h-8 w-8  text-slate-400 hover:text-[#5e35b1] hover:bg-[#ede7f6]"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setDeleteTargetId(service.id); setIsDeleteDialogOpen(true); }}
                                                    className="h-8 w-8  text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Service Modal */}
            <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                <DialogContent className=" border-none shadow-2xl bg-white sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editingService ? "Edit Service" : "New Service Type"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium italic">
                            Configure the details for this available service.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Name</label>
                                <Input
                                    className="font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                                >
                                    <SelectTrigger className="h-11  border-slate-200 focus:ring-[#5e35b1]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className=" border-slate-200">
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="service-provider">Service Provider</SelectItem>
                                        <SelectItem value="driver">Driver (Transport)</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort Order</label>
                                <Input
                                    type="number"
                                    className="font-bold"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                            <Textarea
                                className="font-medium resize-none px-4 py-3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className=" font-bold text-slate-400" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
                        <Button className=" bg-[#5e35b1] hover:bg-[#4527a0] font-bold px-8 shadow-lg shadow-purple-200" onClick={handleSaveService}>
                            {editingService ? "Update Service" : "Add Service"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className=" border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase">Delete Service?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            This will remove this service option from the platform. Users will no longer be able to submit new requests for this type.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className=" font-bold border-slate-200 text-slate-500">Keep it</AlertDialogCancel>
                        <AlertDialogAction className=" bg-rose-600 hover:bg-rose-700 font-bold px-8" onClick={handleDelete}>
                            Delete Service
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
