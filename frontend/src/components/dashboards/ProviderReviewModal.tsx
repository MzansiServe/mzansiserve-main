import { useState } from "react";
import { Star, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProviderReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    requestType: "professional" | "provider" | "cab";
    providerName: string;
    onSuccess: () => void;
}

export const ProviderReviewModal = ({
    isOpen,
    onClose,
    requestId,
    requestType,
    providerName,
    onSuccess,
}: ProviderReviewModalProps) => {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const endpoint =
        requestType === "professional"
            ? `/api/requests/${requestId}/rate-professional`
            : requestType === "cab"
                ? `/api/requests/${requestId}/rate-driver`
                : `/api/requests/${requestId}/rate-provider`;

    const labels: Record<number, string> = {
        1: "Very poor — not recommended",
        2: "Below expectations",
        3: "Average — okay experience",
        4: "Good — would recommend",
        5: "Outstanding — excellent work!",
    };

    const handleSubmit = async () => {
        if (!rating) {
            toast({ title: "Select a rating", description: "Please tap a star before submitting.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const res = await apiFetch(endpoint, {
                method: "POST",
                data: { rating, review_text: reviewText.trim() || undefined },
            });
            if (res.success) {
                toast({ title: "Thank you! 🎉", description: "Your review has been submitted anonymously." });
                onSuccess();
                onClose();
            } else {
                toast({ title: "Error", description: res.message || "Could not submit review.", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to submit review.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Anonymous Review</p>
                            <h3 className="text-2xl font-bold text-[#222222] tracking-tight">Rate your experience</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-11 w-11 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            <X className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Provider name */}
                    <p className="text-slate-500 mb-8 text-base">
                        How was your service with <span className="font-bold text-[#222222]">{providerName}</span>?
                        {" "}Your review will be anonymous.
                    </p>

                    {/* Star rating */}
                    <div className="flex justify-center gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHovered(star)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                                aria-label={`${star} star`}
                            >
                                <Star
                                    className={cn(
                                        "h-10 w-10 transition-colors",
                                        (hovered || rating) >= star
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-slate-100 text-slate-200"
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Label */}
                    <p className="text-center text-sm font-bold text-primary mb-8 h-5">
                        {labels[hovered || rating] || ""}
                    </p>

                    {/* Review text */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Tell others about it (optional)
                        </label>
                        <textarea
                            rows={4}
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Share what you liked or what could be improved..."
                            className="w-full rounded-3xl bg-slate-50 p-5 font-medium text-[#222222] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl text-slate-500 font-bold"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !rating}
                            className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {submitting ? "Submitting..." : "Submit Review"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderReviewModal;
