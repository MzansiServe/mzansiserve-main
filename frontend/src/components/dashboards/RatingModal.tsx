import { useState } from "react";
import { Star, Send, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    clientName: string;
    onSuccess: () => void;
}

export const RatingModal = ({ isOpen, onClose, jobId, clientName, onSuccess }: RatingModalProps) => {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: "Rating Required", description: "Please select a star rating.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiFetch(`/api/requests/${jobId}/rate-client`, {
                method: 'POST',
                body: JSON.stringify({
                    rating,
                    review_text: reviewText
                })
            });

            if (res.success) {
                toast({ title: "Thank You!", description: "Your rating has been submitted successfully." });
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            toast({ title: "Submission Failed", description: err.message || "Failed to submit rating", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#121926]">Rate your Client</DialogTitle>
                    <DialogDescription className="text-base text-[#697586] mt-1">
                        How was your experience working with <span className="font-bold text-[#364152]">{clientName}</span>?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-8 flex flex-col items-center">
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className="transition-transform active:scale-95 duration-100"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                            >
                                <Star
                                    className={cn(
                                        "h-10 w-10 transition-colors",
                                        (hover || rating) >= star
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-slate-200"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-amber-600">
                        {rating === 1 && "Extremely Poor"}
                        {rating === 2 && "Could be better"}
                        {rating === 3 && "Good experience"}
                        {rating === 4 && "Great client"}
                        {rating === 5 && "Excellent/Outstanding"}
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-[#121926]">Leave a review (optional)</label>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share more details about your experience..."
                        className="w-full min-h-[100px] p-4 text-sm rounded-xl border border-gray-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    />
                </div>

                <DialogFooter className="mt-8 gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-xl font-bold text-[#697586]"
                    >
                        Maybe Later
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || rating === 0}
                        className="bg-[#1e88e5] hover:bg-[#1565c0] rounded-xl px-8 font-bold shadow-lg shadow-blue-100"
                    >
                        {submitting ? "Submitting..." : "Submit Review"}
                        {!submitting && <Send className="ml-2 h-4 w-4" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
