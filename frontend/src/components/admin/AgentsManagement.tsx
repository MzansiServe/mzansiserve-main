import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    Users,
    Search,
    UserCheck,
    MapPin,
    Hash,
    MoreVertical,
    IdCard,
    Briefcase
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

interface Agent {
    id: string;
    agent_id: string;
    name: string;
    surname: string;
    id_number?: string | null;
    phone?: string;
    municipality?: string | null;
    ward?: string | null;
    created_at?: string;
}

export const AgentsManagement = () => {
    const { toast } = useToast();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form States
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [formData, setFormData] = useState({
        agent_id: "",
        name: "",
        surname: "",
        id_number: "",
    });
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const fetchAgents = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/agents", { headers: adminHeaders });
            if (res?.success) {
                // Backend returns array directly in data
                const agentsList = Array.isArray(res.data) ? res.data : (res.data.agents || []);
                setAgents(agentsList);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load agents list.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const handleOpenModal = (agent: Agent | null = null) => {
        setEditingAgent(agent);
        if (agent) {
            setFormData({
                agent_id: agent.agent_id,
                name: agent.name,
                surname: agent.surname,
                id_number: agent.id_number || "",
            });
        } else {
            setFormData({
                agent_id: "",
                name: "",
                surname: "",
                id_number: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.surname.trim()) {
            toast({ title: "Validation Error", description: "Name and Surname are required", variant: "destructive" });
            return;
        }

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const url = editingAgent
                ? `/api/admin/agents/${editingAgent.id}`
                : "/api/admin/agents";
            const method = editingAgent ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: adminHeaders,
                data: formData
            });

            if (res?.success) {
                toast({ title: "Success", description: `Agent ${editingAgent ? 'updated' : 'created'} successfully.` });
                setIsModalOpen(false);
                fetchAgents();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save agent", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch(`/api/admin/agents/${deleteTargetId}`, {
                method: "DELETE",
                headers: adminHeaders
            });

            if (res?.success) {
                toast({ title: "Deleted", description: "Agent removed successfully." });
                setIsDeleteDialogOpen(false);
                fetchAgents();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete agent", variant: "destructive" });
        }
    };

    const filteredAgents = agents.filter(agent =>
        (agent.name + " " + agent.surname).toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.municipality && agent.municipality.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Agents Network</h3>
                    <p className="text-sm text-slate-500">Manage referral agents and field staff.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="h-10  bg-[#5e35b1] hover:bg-[#4527a0] text-white shadow-lg shadow-purple-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Register Agent
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search agents by name, ID or municipality..."
                    className="pl-10 font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-24 flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin h-8 w-8 text-[#5e35b1]" />
                        <span className="text-sm font-medium text-slate-400">Loading directory...</span>
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100  bg-slate-50">
                        <Users className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No agents registered</p>
                    </div>
                ) : (
                    filteredAgents.map((agent) => (
                        <div key={agent.id} className="group bg-white  border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-12 w-12  bg-[#ede7f6] text-[#5e35b1] flex items-center justify-center">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none  px-2 py-0.5 font-black text-[10px] uppercase">Active Agent</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[17px] font-black text-slate-900 leading-tight">{agent.name} {agent.surname}</h4>
                                    <div className="flex items-center text-xs font-black text-[#5e35b1] uppercase tracking-tighter">
                                        <IdCard className="w-3 h-3 mr-1" /> Agent ID: {agent.agent_id}
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center text-sm font-medium text-slate-500">
                                        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-300" />
                                        {agent.municipality || "N/A"} {agent.ward ? `(Ward ${agent.ward})` : ""}
                                    </div>
                                    <div className="flex items-center text-sm font-medium text-slate-500">
                                        <Hash className="w-3.5 h-3.5 mr-2 text-slate-300" />
                                        {agent.phone}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Joined {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "Recent"}</span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenModal(agent)}
                                        className="h-8 w-8  text-slate-400 hover:text-[#5e35b1] hover:bg-[#ede7f6]"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setDeleteTargetId(agent.id); setIsDeleteDialogOpen(true); }}
                                        className="h-8 w-8  text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Agent Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className=" border-none shadow-2xl bg-white sm:max-w-[500px] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                            {editingAgent ? "Update Agent" : "Register Agent"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium italic">
                            Official field representative authentication details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                <Input
                                    placeholder="e.g. John"
                                    className="font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Surname</label>
                                <Input
                                    placeholder="e.g. Doe"
                                    className="font-bold"
                                    value={formData.surname}
                                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number (Optional)</label>
                                <Input
                                    placeholder="e.g. 800101..."
                                    className="font-bold"
                                    value={formData.id_number}
                                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Agent ID</label>
                                <Input
                                    placeholder="e.g. AGT-001"
                                    className="font-bold text-[#5e35b1]"
                                    value={formData.agent_id}
                                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="ghost" className=" font-bold text-slate-400 h-12" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button className=" bg-[#5e35b1] hover:bg-[#4527a0] font-black px-10 h-12 shadow-xl shadow-purple-200" onClick={handleSave}>
                            {editingAgent ? "Update Credentials" : "Issue Credentials"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className=" border-none shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">Revoke Agent Access?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            This will permanently remove the agent from the platform. Any referrals pending might need manual reconciliation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8">
                        <AlertDialogCancel className=" font-bold h-12 flex-1">Keep Agent</AlertDialogCancel>
                        <AlertDialogAction className=" bg-rose-600 hover:bg-rose-700 font-black h-12 flex-1" onClick={handleDelete}>
                            Yes, Revoke Access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
