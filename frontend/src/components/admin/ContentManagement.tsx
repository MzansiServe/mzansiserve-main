import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Save,
    FileText,
    Shield,
    Info,
    Mail,
    Phone,
    MapPin,
    FileUp,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface FooterData {
    company_name: string;
    email: string | null;
    phone: string | null;
    physical_address: string | null;
}

interface LegalData {
    content_type: 'text' | 'pdf';
    text: string;
    file_url: string | null;
}

export const ContentManagement = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [footerData, setFooterData] = useState<FooterData>({
        company_name: "",
        email: "",
        phone: "",
        physical_address: ""
    });

    const [legalPages, setLegalPages] = useState<{
        terms: LegalData;
        privacy: LegalData;
    }>({
        terms: { content_type: 'text', text: '', file_url: null },
        privacy: { content_type: 'text', text: '', file_url: null }
    });

    const fetchFooter = useCallback(async () => {
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/footer", { headers: adminHeaders });
            if (res?.success) {
                setFooterData(res.data);
            }
        } catch (error) {
            console.error("Failed to load footer", error);
        }
    }, []);

    const fetchLegal = useCallback(async (page: 'terms' | 'privacy') => {
        try {
            const res = await apiFetch(`/api/admin/legal/${page}`);
            if (res?.success) {
                setLegalPages(prev => ({ ...prev, [page]: res.data }));
            }
        } catch (error) {
            console.error(`Failed to load ${page}`, error);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchFooter(), fetchLegal('terms'), fetchLegal('privacy')])
            .finally(() => setLoading(false));
    }, [fetchFooter, fetchLegal]);

    const handleSaveFooter = async () => {
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const res = await apiFetch("/api/admin/footer", {
                method: "PATCH",
                headers: adminHeaders,
                body: JSON.stringify(footerData)
            });
            if (res?.success) {
                toast({ title: "Updated", description: "Footer content saved successfully." });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save footer", variant: "destructive" });
        }
    };

    const handleSaveLegal = async (page: 'terms' | 'privacy', contentType: 'text' | 'pdf', text?: string, file?: File) => {
        try {
            const adminHeaders = { Authorization: `Bearer ${localStorage.getItem("adminToken")}` };
            const formData = new FormData();
            formData.append("content_type", contentType);
            if (contentType === 'text' && text !== undefined) {
                formData.append("text", text);
            } else if (contentType === 'pdf' && file) {
                formData.append("file", file);
            }

            const res = await apiFetch(`/api/admin/legal/${page}`, {
                method: "PATCH",
                body: formData
            });

            if (res?.success) {
                toast({ title: "Published", description: `${page === 'terms' ? 'Terms' : 'Privacy Policy'} updated.` });
                fetchLegal(page);
            } else {
                throw new Error(res.error?.message || "Failed to update legal content");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save legal content", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin h-8 w-8 text-[#5e35b1]" />
                <span className="text-sm font-medium text-slate-400">Loading CMS...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-slate-900">Content Management</h3>
                <p className="text-sm text-slate-500">Manage branding, footer information, and legal documentation.</p>
            </div>

            <Tabs defaultValue="footer" className="w-full">
                <TabsList className="bg-slate-50 border border-slate-100 p-1  h-12 mb-6">
                    <TabsTrigger value="footer" className=" px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-[#5e35b1] data-[state=active]:shadow-sm">
                        <Layout className="w-4 h-4 mr-2" />
                        Footer Branding
                    </TabsTrigger>
                    <TabsTrigger value="terms" className=" px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-[#5e35b1] data-[state=active]:shadow-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Terms of Use
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className=" px-8 font-bold data-[state=active]:bg-white data-[state=active]:text-[#5e35b1] data-[state=active]:shadow-sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Privacy Policy
                    </TabsTrigger>
                </TabsList>

                {/* Footer Content */}
                <TabsContent value="footer" className="m-0 space-y-6">
                    <Card className=" border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader>
                            <CardTitle className="text-xl font-black">Branding & Contact</CardTitle>
                            <CardDescription className="italic">This information appears in the site's footer across all pages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                        <Info className="w-3 h-3 mr-1" /> Company Name
                                    </label>
                                    <Input
                                        className="font-bold"
                                        value={footerData.company_name}
                                        onChange={(e) => setFooterData({ ...footerData, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                        <Mail className="w-3 h-3 mr-1" /> Site Email
                                    </label>
                                    <Input
                                        type="email"
                                        className="font-bold"
                                        value={footerData.email || ""}
                                        onChange={(e) => setFooterData({ ...footerData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                        <Phone className="w-3 h-3 mr-1" /> Contact Phone
                                    </label>
                                    <Input
                                        className="font-bold"
                                        value={footerData.phone || ""}
                                        onChange={(e) => setFooterData({ ...footerData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" /> Office Address
                                    </label>
                                    <Input
                                        className="font-bold"
                                        value={footerData.physical_address || ""}
                                        onChange={(e) => setFooterData({ ...footerData, physical_address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button className="h-14 px-12  bg-[#5e35b1] hover:bg-[#4527a0] font-black text-lg shadow-xl shadow-purple-200" onClick={handleSaveFooter}>
                                    <Save className="w-5 h-5 mr-3" />
                                    Global Update
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Terms of Use */}
                <TabsContent value="terms" className="m-0">
                    <Card className=" border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black">Terms of Use</CardTitle>
                                <CardDescription className="italic">Legal agreement for site users.</CardDescription>
                            </div>
                            <div className="flex bg-slate-100 p-1 ">
                                <Button
                                    variant={legalPages.terms.content_type === 'text' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className=" font-bold px-4"
                                    onClick={() => handleSaveLegal('terms', 'text', legalPages.terms.text)}
                                >Rich Text</Button>
                                <Button
                                    variant={legalPages.terms.content_type === 'pdf' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className=" font-bold px-4"
                                    onClick={() => document.getElementById('terms-pdf-upload')?.click()}
                                >PDF File</Button>
                                <input id="terms-pdf-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleSaveLegal('terms', 'pdf', undefined, e.target.files[0])} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {legalPages.terms.content_type === 'pdf' ? (
                                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200  bg-slate-50">
                                    <div className="h-16 w-16  bg-purple-50 text-[#5e35b1] flex items-center justify-center mb-4">
                                        <FileUp className="h-8 w-8" />
                                    </div>
                                    <p className="font-bold text-slate-900">PDF Document Active</p>
                                    <a href={legalPages.terms.file_url || "#"} target="_blank" className="text-[#5e35b1] font-bold underline text-sm mt-1">View Current File</a>
                                    <Button variant="ghost" className="mt-8 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-[#5e35b1]" onClick={() => handleSaveLegal('terms', 'text', "Enter new terms here...")}>Switch back to text editor</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Textarea
                                        className="min-h-[400px] p-6 font-medium text-slate-700 leading-relaxed resize-none"
                                        value={legalPages.terms.text}
                                        onChange={(e) => setLegalPages(p => ({ ...p, terms: { ...p.terms, text: e.target.value } }))}
                                        placeholder="Enter Terms of Use text content..."
                                    />
                                    <Button className="h-14 px-12  bg-[#5e35b1] hover:bg-[#4527a0] font-black text-lg shadow-xl shadow-purple-200" onClick={() => handleSaveLegal('terms', 'text', legalPages.terms.text)}>
                                        <Save className="w-5 h-5 mr-3" />
                                        Publish Terms
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy Policy */}
                <TabsContent value="privacy" className="m-0">
                    <Card className=" border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black">Privacy Policy</CardTitle>
                                <CardDescription className="italic">Data handling and security standards.</CardDescription>
                            </div>
                            <div className="flex bg-slate-100 p-1 ">
                                <Button
                                    variant={legalPages.privacy.content_type === 'text' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className=" font-bold px-4"
                                    onClick={() => handleSaveLegal('privacy', 'text', legalPages.privacy.text)}
                                >Rich Text</Button>
                                <Button
                                    variant={legalPages.privacy.content_type === 'pdf' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className=" font-bold px-4"
                                    onClick={() => document.getElementById('privacy-pdf-upload')?.click()}
                                >PDF File</Button>
                                <input id="privacy-pdf-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleSaveLegal('privacy', 'pdf', undefined, e.target.files[0])} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {legalPages.privacy.content_type === 'pdf' ? (
                                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200  bg-slate-50">
                                    <div className="h-16 w-16  bg-purple-50 text-[#5e35b1] flex items-center justify-center mb-4">
                                        <Shield className="h-8 w-8" />
                                    </div>
                                    <p className="font-bold text-slate-900">Privay PDF Active</p>
                                    <a href={legalPages.privacy.file_url || "#"} target="_blank" className="text-[#5e35b1] font-bold underline text-sm mt-1">View Current File</a>
                                    <Button variant="ghost" className="mt-8 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-[#5e35b1]" onClick={() => handleSaveLegal('privacy', 'text', "Enter new privacy policy here...")}>Switch back to text editor</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Textarea
                                        className="min-h-[400px] p-6 font-medium text-slate-700 leading-relaxed resize-none"
                                        value={legalPages.privacy.text}
                                        onChange={(e) => setLegalPages(p => ({ ...p, privacy: { ...p.privacy, text: e.target.value } }))}
                                        placeholder="Enter Privacy Policy text content..."
                                    />
                                    <Button className="h-14 px-12  bg-[#5e35b1] hover:bg-[#4527a0] font-black text-lg shadow-xl shadow-purple-200" onClick={() => handleSaveLegal('privacy', 'text', legalPages.privacy.text)}>
                                        <Save className="w-5 h-5 mr-3" />
                                        Publish Policy
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
