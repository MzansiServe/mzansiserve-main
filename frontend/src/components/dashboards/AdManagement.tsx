import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress,
    Stack
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Pause as PauseIcon,
    PlayArrow as PlayIcon
} from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export const AdManagement = () => {
    const { toast } = useToast();
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editingAd, setEditingAd] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: "",
        image_url: "",
        target_url: "",
        placement_section: "homepage_hero",
        status: "pending"
    });

    const fetchAds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/ads');
            if (res.success) {
                setAds(res.data);
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to load adverts", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    const handleOpenModal = (ad: any = null) => {
        if (ad) {
            setEditingAd(ad);
            setFormData({
                title: ad.title,
                image_url: ad.image_url,
                target_url: ad.target_url,
                placement_section: ad.placement_section,
                status: ad.status
            });
        } else {
            setEditingAd(null);
            setFormData({
                title: "",
                image_url: "",
                target_url: "",
                placement_section: "homepage_hero",
                status: "pending"
            });
        }
        setOpenModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.image_url || !formData.target_url) {
            toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        try {
            const endpoint = editingAd ? `/api/ads/${editingAd.id}` : '/api/ads';
            const method = editingAd ? 'PATCH' : 'POST';

            const res = await apiFetch(endpoint, {
                method,
                data: formData
            });

            if (res.success) {
                toast({ title: "Success", description: `Advert ${editingAd ? 'updated' : 'created'} successfully` });
                setOpenModal(false);
                fetchAds();
            } else {
                const errorMsg = typeof res.error === 'string' ? res.error : (res.error as any)?.message;
                toast({ title: "Error", description: errorMsg || "Failed to save advert", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "An error occurred", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this advert?")) return;
        try {
            const res = await apiFetch(`/api/ads/${id}`, { method: 'DELETE' });
            if (res.success) {
                toast({ title: "Deleted", description: "Advert has been removed" });
                fetchAds();
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete advert", variant: "destructive" });
        }
    };

    const handleToggleStatus = async (ad: any) => {
        const newStatus = ad.status === 'active' ? 'paused' : 'pending'; // 'active' -> 'paused', others back to 'pending' for review
        try {
            const res = await apiFetch(`/api/ads/${ad.id}`, {
                method: 'PATCH',
                data: { status: newStatus }
            });
            if (res.success) {
                toast({ title: "Status Updated", description: "Advert status changed" });
                fetchAds();
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    if (loading && !ads.length) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>Advertising Campaigns</Typography>
                    <Typography variant="body2" color="text.secondary">Create and manage your adverts</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    New Advert
                </Button>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>Campaign</TableCell>
                            <TableCell>Placement</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Performance</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">No adverts found. Create your first campaign.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : ads.map((ad) => (
                            <TableRow key={ad.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {ad.image_url && (
                                            <Box
                                                component="img"
                                                src={ad.image_url}
                                                alt={ad.title}
                                                sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                                            />
                                        )}
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600}>{ad.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Created: {new Date(ad.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{ad.placement_section}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={ad.status.toUpperCase()}
                                        size="small"
                                        color={
                                            ad.status === 'active' ? 'success' :
                                                ad.status === 'paused' ? 'warning' :
                                                    ad.status === 'rejected' ? 'error' : 'default'
                                        }
                                        variant="outlined"
                                        sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>{ad.clicks} Clicks</Typography>
                                    <Typography variant="caption" color="text.secondary">{ad.impressions} Views</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleToggleStatus(ad)} disabled={ad.status === 'rejected'}>
                                            {ad.status === 'active' ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleOpenModal(ad)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(ad.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingAd ? 'Edit Advert' : 'Create Advert'}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <TextField
                            label="Campaign Title"
                            fullWidth
                            size="small"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Image URL"
                            fullWidth
                            size="small"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            helperText="Direct link to your banner image"
                        />
                        <TextField
                            label="Target URL"
                            fullWidth
                            size="small"
                            value={formData.target_url}
                            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                            helperText="Where users should go when they click"
                        />
                        <TextField
                            select
                            label="Placement Section"
                            fullWidth
                            size="small"
                            value={formData.placement_section}
                            onChange={(e) => setFormData({ ...formData, placement_section: e.target.value })}
                        >
                            <MenuItem value="homepage_hero">Homepage Hero Gap</MenuItem>
                            <MenuItem value="shop_directory">Shop Directory Banner</MenuItem>
                            <MenuItem value="marketplace_sidebar">ads Sidebar</MenuItem>
                        </TextField>

                        {formData.image_url && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" gutterBottom>Preview:</Typography>
                                <Box
                                    component="img"
                                    src={formData.image_url}
                                    sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', bgcolor: 'grey.100', borderRadius: 2 }}
                                    onError={(e: any) => e.target.style.display = 'none'}
                                />
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {editingAd ? 'Save Changes' : 'Submit for Review'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
