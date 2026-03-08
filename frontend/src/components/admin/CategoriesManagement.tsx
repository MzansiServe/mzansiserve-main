import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    PlusCircle,
    Tag,
    Layers,
    ChevronDown,
    ChevronRight,
    Search
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

interface Subcategory {
    id: string;
    title: string;
    category_id: string;
}

interface Category {
    id: string;
    title: string;
    subcategories?: Subcategory[];
}

export const CategoriesManagement = () => {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form States
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
    const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: "" });
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'subcategory', id: string } | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/categories", { headers: adminHeaders });
            if (res?.success) {
                // Fetch subcategories for each category
                const categoriesData = res.data.categories as Category[];
                const subRes = await apiFetch("/api/shop/subcategories"); // Using shop endpoint for subcategories if admin one is not clear

                const subcategories = subRes?.success ? (subRes.data.subcategories as Subcategory[]) : [];

                const enrichedCategories = categoriesData.map(cat => ({
                    ...cat,
                    subcategories: subcategories.filter(sub => sub.category_id === cat.id)
                }));

                setCategories(enrichedCategories);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load categories.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const toggleExpand = (categoryId: string) => {
        const next = new Set(expandedCategories);
        if (next.has(categoryId)) {
            next.delete(categoryId);
        } else {
            next.add(categoryId);
        }
        setExpandedCategories(next);
    };

    const handleOpenCategoryModal = (category: Category | null = null) => {
        setEditingCategory(category);
        setFormData({ title: category?.title || "" });
        setIsCategoryModalOpen(true);
    };

    const handleOpenSubcategoryModal = (categoryId: string, subcategory: Subcategory | null = null) => {
        setTargetCategoryId(categoryId);
        setEditingSubcategory(subcategory);
        setFormData({ title: subcategory?.title || "" });
        setIsSubcategoryModalOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!formData.title.trim()) {
            toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
            return;
        }

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : "/api/admin/categories";
            const method = editingCategory ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: adminHeaders,
                data: formData
            });

            if (res?.success) {
                toast({ title: "Success", description: `Category ${editingCategory ? 'updated' : 'created'} successfully.` });
                setIsCategoryModalOpen(false);
                fetchCategories();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save category", variant: "destructive" });
        }
    };

    const handleSaveSubcategory = async () => {
        if (!formData.title.trim()) {
            toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
            return;
        }

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const url = editingSubcategory
                ? `/api/admin/subcategories/${editingSubcategory.id}`
                : "/api/admin/subcategories";
            const method = editingSubcategory ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: adminHeaders,
                data: {
                    title: formData.title,
                    category_id: targetCategoryId
                }
            });

            if (res?.success) {
                toast({ title: "Success", description: `Subcategory ${editingSubcategory ? 'updated' : 'created'} successfully.` });
                setIsSubcategoryModalOpen(false);
                fetchCategories();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save subcategory", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const endpoint = deleteTarget.type === 'category' ? 'categories' : 'subcategories';
            const res = await apiFetch(`/api/admin/${endpoint}/${deleteTarget.id}`, {
                method: "DELETE",
                headers: adminHeaders
            });

            if (res?.success) {
                toast({ title: "Deleted", description: "Item removed successfully." });
                setIsDeleteDialogOpen(false);
                fetchCategories();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete item", variant: "destructive" });
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subcategories?.some(sub => sub.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Categories Management</h3>
                    <p className="text-sm text-slate-500">Manage product categories and subcategories.</p>
                </div>
                <Button
                    onClick={() => handleOpenCategoryModal()}
                    className="h-10  bg-[#5e35b1] hover:bg-[#4527a0] text-white shadow-lg shadow-purple-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Category
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search categories or subcategories..."
                    className="pl-10 h-11  border-slate-200 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-24 flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin h-8 w-8 text-[#5e35b1]" />
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Organizing catalog...</span>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-slate-100 ">
                        <Tag className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium">No categories found matching your search.</p>
                    </div>
                ) : (
                    filteredCategories.map(category => (
                        <div key={category.id} className="bg-white  border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-[#5e35b1]/30">
                            {/* Category Row */}
                            <div className="px-6 py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleExpand(category.id)}>
                                    <div className="h-10 w-10  bg-[#ede7f6] text-[#5e35b1] flex items-center justify-center font-bold text-sm">
                                        {expandedCategories.has(category.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 group-hover:text-[#5e35b1] transition-colors">{category.title}</h4>
                                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{category.id}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2  bg-slate-50 text-slate-500 border-slate-200 font-bold text-[10px]">
                                        {category.subcategories?.length || 0} Subcategories
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenSubcategoryModal(category.id)}
                                        className="h-8  text-[#5e35b1] hover:bg-[#ede7f6]"
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Subcategory
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenCategoryModal(category)}
                                        className="h-8 w-8  text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setDeleteTarget({ type: 'category', id: category.id }); setIsDeleteDialogOpen(true); }}
                                        className="h-8 w-8  text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Subcategories (Expanded) */}
                            {expandedCategories.has(category.id) && (
                                <div className="bg-slate-50 border-t border-slate-50 p-4 space-y-2">
                                    {(category.subcategories || []).length === 0 ? (
                                        <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic">No subcategories defined</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {category.subcategories?.map(sub => (
                                                <div key={sub.id} className="bg-white p-3  border border-slate-200 shadow-sm flex items-center justify-between group/sub transition-all hover:shadow-md hover:border-[#5e35b1]/30">
                                                    <div className="flex items-center gap-3">
                                                        <Layers className="h-4 w-4 text-[#5e35b1]" />
                                                        <span className="text-sm font-semibold text-slate-700">{sub.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenSubcategoryModal(category.id, sub)}
                                                            className="h-7 w-7  text-slate-300 hover:text-[#5e35b1] hover:bg-purple-50"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => { setDeleteTarget({ type: 'subcategory', id: sub.id }); setIsDeleteDialogOpen(true); }}
                                                            className="h-7 w-7  text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className=" border-none shadow-2xl bg-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-900">
                            {editingCategory ? "Update Category" : "Add New Category"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium italic">
                            Categories help organize your products for easier shopping.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Title</label>
                            <Input
                                placeholder="e.g. Health & Wellness"
                                className="font-bold"
                                value={formData.title}
                                onChange={(e) => setFormData({ title: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className=" font-bold text-slate-400" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                        <Button className=" bg-[#5e35b1] hover:bg-[#4527a0] font-bold px-8 shadow-lg shadow-purple-200/50" onClick={handleSaveCategory}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Subcategory Modal */}
            <Dialog open={isSubcategoryModalOpen} onOpenChange={setIsSubcategoryModalOpen}>
                <DialogContent className=" border-none shadow-2xl bg-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-[#5e35b1]">
                            {editingSubcategory ? "Update Subcategory" : "Add New Subcategory"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium italic">
                            Defining specific subcategories makes your catalog more searchable.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subcategory Title</label>
                            <Input
                                placeholder="e.g. Vitamins & Supplements"
                                className="font-bold focus:ring-[#5e35b1]"
                                value={formData.title}
                                onChange={(e) => setFormData({ title: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className=" font-bold text-slate-400" onClick={() => setIsSubcategoryModalOpen(false)}>Cancel</Button>
                        <Button className=" bg-[#5e35b1] hover:bg-[#4527a0] font-bold px-8 shadow-lg shadow-purple-200/50" onClick={handleSaveSubcategory}>
                            Save Subcategory
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className=" border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            This action cannot be undone. This will permanently delete the {deleteTarget?.type}
                            {deleteTarget?.type === 'category' && " and all associated products may become uncategorized."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className=" font-bold border-slate-200 text-slate-500">Cancel</AlertDialogCancel>
                        <AlertDialogAction className=" bg-rose-600 hover:bg-rose-700 font-bold px-8 shadow-lg shadow-rose-200" onClick={handleDelete}>
                            Yes, delete item
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
