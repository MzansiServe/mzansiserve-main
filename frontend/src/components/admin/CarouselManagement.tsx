import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    Image as ImageIcon,
    ExternalLink,
    Search,
    Eye,
    EyeOff,
    UploadCloud
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

interface CarouselItem {
    id: string;
    image_url: string;
    cta_link: string | null;
    cta_text: string | null;
    order: number;
    is_active: boolean;
    created_at?: string;
}

export const CarouselManagement = () => {
    const { toast } = useToast();
    const [items, setItems] = useState<CarouselItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form States
    const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
    const [formData, setFormData] = useState({
        cta_link: "",
        cta_text: "",
        order: 0,
        is_active: true
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/carousel", { headers: adminHeaders });
            if (res?.success) {
                setItems(res.data.items);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load carousel items.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleOpenModal = (item: CarouselItem | null = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({
                cta_link: item.cta_link || "",
                cta_text: item.cta_text || "",
                order: item.order,
                is_active: item.is_active
            });
        } else {
            setFormData({
                cta_link: "",
                cta_text: "",
                order: items.length,
                is_active: true
            });
        }
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const url = editingItem
                ? `/api/admin/carousel/${editingItem.id}`
                : "/api/admin/carousel";
            const method = editingItem ? "PATCH" : "POST";

            const data = new FormData();
            data.append("cta_link", formData.cta_link);
            data.append("cta_text", formData.cta_text);
            data.append("order", formData.order.toString());
            data.append("is_active", formData.is_active.toString());
            if (selectedFile) {
                data.append("image_file", selectedFile);
            } else if (!editingItem) {
                toast({ title: "Validation Error", description: "Image is required for new items", variant: "destructive" });
                return;
            }

            // Using fetch directly because apiFetch might not handle FormData correctly depending on its implementation
            const res = await apiFetch(url, {
                method,
                body: data
            });

            if (res?.success) {
                toast({ title: "Success", description: `Item ${editingItem ? 'updated' : 'created'} successfully.` });
                setIsModalOpen(false);
                fetchItems();
            } else {
                throw new Error(res.error?.message || "Operation failed");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save item", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch(`/api/admin/carousel/${deleteTargetId}`, {
                method: "DELETE",
                headers: adminHeaders
            });

            if (res?.success) {
                toast({ title: "Deleted", description: "Item removed successfully." });
                setIsDeleteDialogOpen(false);
                fetchItems();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete item", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Home Carousel</h3>
                    <p className="text-sm text-slate-500">Manage promotional slides on the landing page.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="h-10  bg-[#5e35b1] hover:bg-[#4527a0] text-white shadow-lg shadow-purple-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slide
                </Button>
            </div>

            {/* Carousel List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-24 flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin h-8 w-8 text-[#5e35b1]" />
                        <span className="text-sm font-medium text-slate-400">Loading gallery...</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 ">
                        <ImageIcon className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium font-bold uppercase tracking-widest text-xs">No active slides</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="group bg-white  border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                            {/* Slide Preview */}
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`}
                                        alt="Carousel Slide"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon className="h-12 w-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <Badge title="Order in sequence" className="bg-white/90 text-[#5e35b1] border-none shadow-sm  px-2 font-black py-0.5">
                                        #{item.order}
                                    </Badge>
                                    <Badge className={cn(
                                        "bg-white/90 shadow-sm border-none  px-2 py-0.5 font-black uppercase text-[9px]",
                                        item.is_active ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {item.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                                        {item.is_active ? "Visible" : "Hidden"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Info & Actions */}
                            <div className="p-5 space-y-3">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 line-clamp-1">{item.cta_text || "No Call-to-Action"}</h4>
                                    <div className="flex items-center text-xs text-slate-400 group/link cursor-pointer truncate">
                                        <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                                        <span className="truncate group-hover/link:text-[#5e35b1] transition-colors">{item.cta_link || "No target link"}</span>
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: {item.id.slice(0, 8)}</span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenModal(item)}
                                            className="h-8 w-8  text-slate-400 hover:text-[#5e35b1] hover:bg-[#ede7f6]"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => { setDeleteTargetId(item.id); setIsDeleteDialogOpen(true); }}
                                            className="h-8 w-8  text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Slide Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className=" border-none shadow-2xl bg-white sm:max-w-[550px] p-8 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                            {editingItem ? "Refine Slide" : "Assemble New Slide"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-base italic">
                            Promotions that appear on your landing page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        {/* Image Upload Area */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-[#5e35b1] uppercase tracking-[0.2em] ml-1">Hero Image</label>
                            <div
                                className={cn(
                                    "relative border-2 border-dashed  p-8 transition-all group flex flex-col items-center justify-center gap-3 cursor-pointer",
                                    selectedFile ? "border-purple-200 bg-purple-50/30" : "border-slate-100 bg-slate-50 hover:border-[#d1c4e9] hover:bg-[#ede7f6]/20"
                                )}
                                onClick={() => document.getElementById('slide-upload')?.click()}
                            >
                                {selectedFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12  bg-purple-100 text-[#5e35b1] flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6" />
                                        </div>
                                        <span className="text-sm font-bold text-[#5e35b1]">{selectedFile.name}</span>
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-rose-500 h-6 text-[10px] font-black uppercase" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Discard</Button>
                                    </div>
                                ) : editingItem && editingItem.image_url ? (
                                    <div className="relative w-full h-32 flex flex-col items-center justify-center">
                                        <img
                                            src={editingItem.image_url.startsWith('http') ? editingItem.image_url : `${API_BASE_URL}${editingItem.image_url}`}
                                            className="h-24 w-auto object-contain mb-2"
                                            alt="Current slide"
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Current Image</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-14 w-14 rounded-[1.25rem] bg-white shadow-sm flex items-center justify-center text-[#5e35b1] group-hover:scale-110 transition-transform">
                                            <UploadCloud className="h-7 w-7" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-slate-900">Drop image here or click</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">Recommended: 1920x800px (JPG, PNG, WebP)</p>
                                        </div>
                                    </>
                                )}
                                <input
                                    id="slide-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Button Text</label>
                                <Input
                                    placeholder="e.g. Shop Now"
                                    className="font-bold"
                                    value={formData.cta_text}
                                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Link</label>
                                <Input
                                    placeholder="/shop/category-id"
                                    className="font-bold text-[#5e35b1]"
                                    value={formData.cta_link}
                                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sequence Order</label>
                                <Input
                                    type="number"
                                    className="font-bold"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex flex-col gap-2 justify-center">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Visibility</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={formData.is_active ? "default" : "outline"}
                                        className={cn("flex-1 h-12  font-bold", formData.is_active ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "text-slate-400")}
                                        onClick={() => setFormData({ ...formData, is_active: true })}
                                    >Active</Button>
                                    <Button
                                        type="button"
                                        variant={!formData.is_active ? "default" : "outline"}
                                        className={cn("flex-1 h-12  font-bold", !formData.is_active ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "text-slate-400")}
                                        onClick={() => setFormData({ ...formData, is_active: false })}
                                    >Hidden</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="ghost" className=" font-bold text-slate-400 h-14" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button className=" bg-[#5e35b1] hover:bg-[#4527a0] font-black px-12 h-14 shadow-xl shadow-purple-200 text-lg tracking-tight" onClick={handleSave}>
                            {editingItem ? "Refresh Slide" : "Publish Slide"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className=" border-none shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900 leading-tight">Vanish this slide forever?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium text-base">
                            The visual asset will be deleted from the server and the landing page experience will shift immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-4 mt-8">
                        <AlertDialogCancel className="flex-1 h-14  font-bold border-slate-100 text-slate-400 hover:bg-slate-50">Safe for now</AlertDialogCancel>
                        <AlertDialogAction className="flex-1 h-14  bg-rose-600 hover:bg-rose-700 font-black shadow-lg shadow-rose-200" onClick={handleDelete}>
                            Yes, delete slide
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
