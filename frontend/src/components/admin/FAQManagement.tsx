import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    HelpCircle,
    RefreshCcw,
    CheckCircle2,
    XCircle,
    MoreVertical,
    ChevronDown
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
    is_active: boolean;
    created_at?: string;
}

export const FAQManagement = () => {
    const { toast } = useToast();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        order: 0,
        is_active: true
    });

    const fetchFaqs = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/faqs", { headers: adminHeaders });
            if (res?.success) {
                setFaqs(res.data.faqs || []);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load FAQs.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    const handleOpenAddModal = () => {
        setSelectedFaq(null);
        setFormData({
            question: "",
            answer: "",
            order: faqs.length > 0 ? Math.max(...faqs.map(f => f.order)) + 1 : 1,
            is_active: true
        });
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (faq: FAQ) => {
        setSelectedFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            order: faq.order,
            is_active: faq.is_active
        });
        setIsEditModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.question || !formData.answer) {
            toast({ title: "Validation Error", description: "Question and answer are required.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const url = selectedFaq ? `/api/admin/faqs/${selectedFaq.id}` : "/api/admin/faqs";
            const method = selectedFaq ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: adminHeaders,
                data: formData
            });

            if (res?.success) {
                toast({ title: "Success", description: `FAQ ${selectedFaq ? "updated" : "created"} successfully.` });
                setIsEditModalOpen(false);
                fetchFaqs();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save FAQ.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedFaq) return;
        setIsSubmitting(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch(`/api/admin/faqs/${selectedFaq.id}`, {
                method: "DELETE",
                headers: adminHeaders
            });

            if (res?.success) {
                toast({ title: "Success", description: "FAQ deleted successfully." });
                setIsDeleteDialogOpen(false);
                fetchFaqs();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete FAQ.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">FAQ Management</h3>
                    <p className="text-sm text-slate-500">Manage frequently asked questions displayed on the portal.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchFaqs}
                        className="h-10  border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleOpenAddModal}
                        className="h-10  bg-[#5e35b1] hover:bg-[#4527a0] text-white shadow-lg shadow-purple-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add FAQ
                    </Button>
                </div>
            </div>

            {/* FAQs List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="bg-white p-12  border border-slate-100 flex flex-col items-center gap-4 text-center">
                        <Loader2 className="w-10 h-10 text-[#5e35b1] animate-spin" />
                        <span className="text-slate-500 font-medium tracking-tight">Loading FAQ items...</span>
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="bg-white p-12  border border-slate-100 flex flex-col items-center gap-3 text-center opacity-60">
                        <HelpCircle className="w-12 h-12 text-slate-200" />
                        <span className="text-slate-400 font-semibold uppercase tracking-widest text-xs">No FAQs found</span>
                    </div>
                ) : (
                    faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className="bg-white border border-slate-100  p-6 shadow-sm hover:shadow-md transition-all group relative"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10  bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-[#5e35b1] font-black text-xs">
                                        {faq.order}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 pr-12">{faq.question}</h4>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    " px-1.5 py-0 text-[10px] font-bold uppercase tracking-tighter",
                                                    faq.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"
                                                )}
                                            >
                                                {faq.is_active ? "Active" : "Hidden"}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2 pr-10">{faq.answer}</p>
                                    </div>
                                </div>
                                <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenEditModal(faq)}
                                        className="h-8 w-8  text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setSelectedFaq(faq); setIsDeleteDialogOpen(true); }}
                                        className="h-8 w-8  text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 bg-white overflow-hidden border-none shadow-2xl ">
                    <DialogHeader className="px-8 py-6 border-b bg-slate-50/50">
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            {selectedFaq ? "Edit FAQ" : "Add New FAQ"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Create or update frequently asked questions for your users.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-4 gap-6">
                            <div className="col-span-3 space-y-2">
                                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Question</Label>
                                <Input
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="e.g. How do I reset my password?"
                                    className="font-bold"
                                />
                            </div>
                            <div className="col-span-1 space-y-2">
                                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Order</Label>
                                <Input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Answer</Label>
                            <Textarea
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="Describe the answer in detail..."
                                className="font-medium resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50  border border-slate-100">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold text-slate-900">Active Status</Label>
                                <p className="text-xs text-slate-500">Show or hide this FAQ from the public portal.</p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                className="data-[state=checked]:bg-[#5e35b1]"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditModalOpen(false)}
                                className="h-11  px-6 font-bold text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11  px-8 bg-[#5e35b1] hover:bg-[#4527a0] text-white shadow-lg shadow-purple-100 font-bold"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {selectedFaq ? "Save Changes" : "Create FAQ"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className=" border-none shadow-2xl p-0 overflow-hidden max-w-md">
                    <div className="p-8 pb-4">
                        <AlertDialogHeader>
                            <div className="w-12 h-12  bg-rose-50 flex items-center justify-center mb-4 text-rose-600">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900">Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 mt-2">
                                This action cannot be undone. This FAQ will be permanently removed from the system.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-8 pt-4 bg-slate-50/50 gap-3 border-t border-slate-100">
                        <AlertDialogCancel className="h-11  border-slate-200 text-slate-600 px-6 m-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="h-11  bg-rose-600 hover:bg-rose-700 text-white px-8 m-0 font-bold shadow-lg shadow-rose-100"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
