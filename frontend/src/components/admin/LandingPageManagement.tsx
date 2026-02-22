import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Plus, Pencil, Trash2, Star, Loader2,
    ToggleLeft, ToggleRight, GripVertical, Layout,
    MessageSquare, CheckCircle, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Testimonial {
    id: string;
    name: string;
    role: string | null;
    rating: number;
    text: string;
    order: number;
    is_active: boolean;
}

interface LandingFeature {
    id: string;
    icon: string;
    title: string;
    description: string;
    order: number;
    is_active: boolean;
}

const ICON_OPTIONS = [
    "ShieldCheck", "Clock", "BadgeCheck", "Headphones", "Star", "Zap",
    "Heart", "Globe", "Award", "Users", "Smile", "Phone",
];

// ─── Sub-component: Testimonials Tab ──────────────────────────────────────────

const TestimonialsTab = () => {
    const { toast } = useToast();
    const [items, setItems] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<Partial<Testimonial> | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch("/api/admin/testimonials");
        setItems(res?.data?.testimonials || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => {
        setEditItem({ name: "", role: "", text: "", rating: 5, order: 0, is_active: true });
        setModalOpen(true);
    };

    const openEdit = (t: Testimonial) => {
        setEditItem({ ...t });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!editItem?.name || !editItem?.text) {
            toast({ title: "Name and text are required.", variant: "destructive" });
            return;
        }
        setSaving(true);
        const isNew = !editItem.id;
        const res = isNew
            ? await apiFetch("/api/admin/testimonials", { method: "POST", body: JSON.stringify(editItem) })
            : await apiFetch(`/api/admin/testimonials/${editItem.id}`, { method: "PUT", body: JSON.stringify(editItem) });
        setSaving(false);
        if (res?.success) {
            toast({ title: isNew ? "Testimonial added!" : "Testimonial updated!" });
            setModalOpen(false);
            fetchData();
        } else {
            toast({ title: "Failed to save.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        const res = await apiFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
        setDeleteId(null);
        if (res?.success) {
            toast({ title: "Testimonial deleted." });
            fetchData();
        } else {
            toast({ title: "Failed to delete.", variant: "destructive" });
        }
    };

    const handleToggle = async (t: Testimonial) => {
        await apiFetch(`/api/admin/testimonials/${t.id}`, {
            method: "PUT",
            body: JSON.stringify({ is_active: !t.is_active }),
        });
        fetchData();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">Customer testimonials shown on the landing page.</p>
                <Button onClick={openAdd} size="sm">
                    <Plus className="h-4 w-4 mr-2" />Add Testimonial
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No testimonials yet. Add your first one.</div>
            ) : (
                <div className="space-y-3">
                    {items.map(t => (
                        <div key={t.id} className={`flex items-start gap-4 p-4 rounded-xl border ${t.is_active ? "border-border bg-card" : "border-dashed border-muted-foreground/30 bg-muted/30"}`}>
                            <GripVertical className="h-5 w-5 mt-0.5 text-muted-foreground/40 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm">{t.name}</span>
                                    {t.role && <span className="text-xs text-muted-foreground">· {t.role}</span>}
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`h-3 w-3 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                        ))}
                                    </div>
                                    {!t.is_active && <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Hidden</span>}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">"{t.text}"</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggle(t)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={t.is_active ? "Hide" : "Show"}>
                                    {t.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                                </button>
                                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                    {deleteId === t.id ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive/70" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-lg mb-4">{editItem.id ? "Edit Testimonial" : "Add Testimonial"}</h3>
                        <div className="space-y-3">
                            <Input placeholder="Customer name *" value={editItem.name || ""} onChange={e => setEditItem(p => ({ ...p!, name: e.target.value }))} />
                            <Input placeholder="Role / Location (e.g. Homeowner, Cape Town)" value={editItem.role || ""} onChange={e => setEditItem(p => ({ ...p!, role: e.target.value }))} />
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} onClick={() => setEditItem(p => ({ ...p!, rating: n }))}
                                            className={`h-8 w-8 rounded-lg border text-sm font-bold transition-colors ${editItem.rating === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                                        >{n}</button>
                                    ))}
                                </div>
                            </div>
                            <Textarea placeholder="Testimonial text *" rows={4} value={editItem.text || ""} onChange={e => setEditItem(p => ({ ...p!, text: e.target.value }))} />
                            <div className="flex items-center gap-3">
                                <Input type="number" placeholder="Order" className="w-24" value={editItem.order ?? 0} onChange={e => setEditItem(p => ({ ...p!, order: parseInt(e.target.value) || 0 }))} />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editItem.is_active ?? true} onChange={e => setEditItem(p => ({ ...p!, is_active: e.target.checked }))} className="h-4 w-4 accent-primary" />
                                    <span className="text-sm">Visible on site</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <Button className="flex-1" onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editItem.id ? "Save Changes" : "Add Testimonial"}
                            </Button>
                            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Sub-component: Why-Section Tab ──────────────────────────────────────────

const FeaturesTab = () => {
    const { toast } = useToast();
    const [items, setItems] = useState<LandingFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<Partial<LandingFeature> | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch("/api/admin/landing-features");
        setItems(res?.data?.features || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => {
        setEditItem({ icon: "Star", title: "", description: "", order: 0, is_active: true });
        setModalOpen(true);
    };

    const openEdit = (f: LandingFeature) => {
        setEditItem({ ...f });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!editItem?.title || !editItem?.description) {
            toast({ title: "Title and description are required.", variant: "destructive" });
            return;
        }
        setSaving(true);
        const isNew = !editItem.id;
        const res = isNew
            ? await apiFetch("/api/admin/landing-features", { method: "POST", body: JSON.stringify(editItem) })
            : await apiFetch(`/api/admin/landing-features/${editItem.id}`, { method: "PUT", body: JSON.stringify(editItem) });
        setSaving(false);
        if (res?.success) {
            toast({ title: isNew ? "Feature added!" : "Feature updated!" });
            setModalOpen(false);
            fetchData();
        } else {
            toast({ title: "Failed to save.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        const res = await apiFetch(`/api/admin/landing-features/${id}`, { method: "DELETE" });
        setDeleteId(null);
        if (res?.success) {
            toast({ title: "Feature deleted." });
            fetchData();
        } else {
            toast({ title: "Failed to delete.", variant: "destructive" });
        }
    };

    const handleToggle = async (f: LandingFeature) => {
        await apiFetch(`/api/admin/landing-features/${f.id}`, {
            method: "PUT",
            body: JSON.stringify({ is_active: !f.is_active }),
        });
        fetchData();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">Items displayed in the "Why Choose Us" section.</p>
                <Button onClick={openAdd} size="sm">
                    <Plus className="h-4 w-4 mr-2" />Add Feature
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No features yet.</div>
            ) : (
                <div className="space-y-3">
                    {items.map(f => (
                        <div key={f.id} className={`flex items-start gap-4 p-4 rounded-xl border ${f.is_active ? "border-border bg-card" : "border-dashed border-muted-foreground/30 bg-muted/30"}`}>
                            <GripVertical className="h-5 w-5 mt-0.5 text-muted-foreground/40 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{f.icon}</span>
                                    <span className="font-semibold text-sm">{f.title}</span>
                                    {!f.is_active && <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Hidden</span>}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggle(f)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={f.is_active ? "Hide" : "Show"}>
                                    {f.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                                </button>
                                <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                    {deleteId === f.id ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive/70" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-lg mb-4">{editItem.id ? "Edit Feature" : "Add Feature"}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon (Lucide name)</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICON_OPTIONS.map(icon => (
                                        <button key={icon}
                                            onClick={() => setEditItem(p => ({ ...p!, icon }))}
                                            className={`px-2 py-1 rounded-md text-xs border font-mono transition-colors ${editItem.icon === icon ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                                        >{icon}</button>
                                    ))}
                                </div>
                            </div>
                            <Input placeholder="Title *" value={editItem.title || ""} onChange={e => setEditItem(p => ({ ...p!, title: e.target.value }))} />
                            <Textarea placeholder="Description *" rows={3} value={editItem.description || ""} onChange={e => setEditItem(p => ({ ...p!, description: e.target.value }))} />
                            <div className="flex items-center gap-3">
                                <Input type="number" placeholder="Order" className="w-24" value={editItem.order ?? 0} onChange={e => setEditItem(p => ({ ...p!, order: parseInt(e.target.value) || 0 }))} />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editItem.is_active ?? true} onChange={e => setEditItem(p => ({ ...p!, is_active: e.target.checked }))} className="h-4 w-4 accent-primary" />
                                    <span className="text-sm">Visible on site</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <Button className="flex-1" onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editItem.id ? "Save Changes" : "Add Feature"}
                            </Button>
                            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const TABS = [
    { key: "testimonials", label: "Testimonials", icon: MessageSquare },
    { key: "features", label: "Why Choose Us", icon: CheckCircle },
];

const LandingPageManagement = () => {
    const [activeTab, setActiveTab] = useState("testimonials");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Layout className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Landing Page</h2>
                    <p className="text-sm text-muted-foreground">Manage what visitors see on the home page.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit border border-border">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? "bg-card shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-border bg-card p-6">
                {activeTab === "testimonials" && <TestimonialsTab />}
                {activeTab === "features" && <FeaturesTab />}
            </div>
        </motion.div>
    );
};

export default LandingPageManagement;
