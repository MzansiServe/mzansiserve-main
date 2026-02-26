import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    alpha,
    useTheme,
    Stack,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Rating
} from "@mui/material";
import {
    Star as StarIcon,
    Send as SendIcon,
    Close as CloseIcon
} from "@mui/icons-material";
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
    const theme = useTheme();
    const [rating, setRating] = useState<number | null>(0);
    const [reviewText, setReviewText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!rating) {
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

    const getRatingLabel = (val: number) => {
        if (val === 1) return "Extremely Poor";
        if (val === 2) return "Could be better";
        if (val === 3) return "Good experience";
        if (val === 4) return "Great client";
        if (val === 5) return "Excellent/Outstanding";
        return "";
    };

    return (
        <Dialog 
            open={isOpen} 
            onClose={onClose}
            PaperProps={{
                sx: { borderRadius: 3, width: '100%', maxWidth: 450, p: 1 }
            }}
        >
            <DialogTitle sx={{ p: 3, pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>Rate your Client</Typography>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled' }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                    How was your experience working with <Box component="span" sx={{ color: 'text.primary', fontWeight: 800 }}>{clientName}</Box>?
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Rating
                        name="client-rating"
                        value={rating}
                        onChange={(_, newValue) => setRating(val => newValue)}
                        size="large"
                        sx={{ 
                            fontSize: '3rem',
                            '& .MuiRating-iconFilled': { color: '#F59E0B' },
                            '& .MuiRating-iconHover': { color: '#F59E0B' }
                        }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', height: 20 }}>
                        {rating ? getRatingLabel(rating) : ""}
                    </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled', mb: 1, display: 'block', letterSpacing: '0.05em' }}>
                        Optional Review
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Share details about the engagement..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        variant="outlined"
                        sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 2 }}>
                <Button 
                    fullWidth 
                    variant="text" 
                    onClick={onClose}
                    sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                    Maybe Later
                </Button>
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={submitting || !rating}
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    sx={{ 
                        fontWeight: 800, 
                        borderRadius: 2, 
                        py: 1.2,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    {submitting ? "Submitting..." : "Submit Review"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RatingModal;
