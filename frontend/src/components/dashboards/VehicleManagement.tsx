import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    TextField,
    IconButton,
    InputAdornment,
    Divider,
    alpha,
    useTheme,
    Card,
    CardContent,
    Stack,
    Alert,
    CircularProgress,
    Avatar,
    MenuItem
} from "@mui/material";
import {
    Add as PlusIcon,
    DeleteOutline as TrashIcon,
    Save as SaveIcon,
    DirectionsCar as CarIcon,
    CalendarMonth as CalendarIcon,
    Pin as HashIcon,
    Settings as SettingsIcon
} from "@mui/icons-material";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
    car_make: string;
    car_model: string;
    car_year: number;
    registration_number: string;
    car_type: 'standard' | 'premium' | 'suv';
}

interface VehicleManagementProps {
    initialVehicles: Vehicle[];
}

export const VehicleManagement = ({ initialVehicles }: VehicleManagementProps) => {
    const { toast } = useToast();
    const theme = useTheme();
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);
    const [saving, setSaving] = useState(false);

    const addVehicle = () => {
        setVehicles([...vehicles, { car_make: "", car_model: "", car_year: new Date().getFullYear(), registration_number: "", car_type: 'standard' }]);
    };

    const removeVehicle = (index: number) => {
        setVehicles(vehicles.filter((_, i) => i !== index));
    };

    const updateVehicle = (index: number, field: keyof Vehicle, value: any) => {
        const newVehicles = [...vehicles];
        newVehicles[index] = { ...newVehicles[index], [field]: value };
        setVehicles(newVehicles);
    };

    const handleSave = async () => {
        // Validation
        if (vehicles.some(v => !v.car_make.trim() || !v.car_model.trim() || !v.registration_number.trim())) {
            toast({ title: "Validation Error", description: "All vehicles must have a make, model, and registration number.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const res = await apiFetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    driver_services: vehicles
                })
            });

            if (res.success) {
                toast({
                    title: "Update Submitted",
                    description: "Your vehicle changes have been submitted for admin approval."
                });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to submit changes", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', borderColor: alpha(theme.palette.divider, 0.08) }}>
            <Box sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5), borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.08), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                        <CarIcon fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>My Vehicles</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Manage your registered fleet and categories.</Typography>
                    </Box>
                </Stack>
                <Button
                    variant="outlined"
                    startIcon={<PlusIcon />}
                    onClick={addVehicle}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                    Add Vehicle
                </Button>
            </Box>

            <Box sx={{ p: 3 }}>
                {vehicles.length > 0 ? (
                    <Stack spacing={3}>
                        {vehicles.map((vehicle, index) => (
                            <Card key={index} variant="outlined" sx={{ borderRadius: 2, position: 'relative', overflow: 'visible' }}>
                                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                    <Box sx={{ position: 'absolute', right: -12, top: -12 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => removeVehicle(index)}
                                            sx={{
                                                bgcolor: 'background.paper',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                color: 'error.main',
                                                '&:hover': { bgcolor: 'error.main', color: 'white' },
                                                zIndex: 1
                                            }}
                                        >
                                            <TrashIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Car Make"
                                                placeholder="e.g. Toyota"
                                                variant="outlined"
                                                size="small"
                                                value={vehicle.car_make}
                                                onChange={(e) => updateVehicle(index, 'car_make', e.target.value)}
                                                sx={{ '& .MuiInputBase-input': { fontWeight: 700 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Car Model"
                                                placeholder="e.g. Corolla"
                                                variant="outlined"
                                                size="small"
                                                value={vehicle.car_model}
                                                onChange={(e) => updateVehicle(index, 'car_model', e.target.value)}
                                                sx={{ '& .MuiInputBase-input': { fontWeight: 700 } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Category"
                                                select
                                                size="small"
                                                value={vehicle.car_type}
                                                onChange={(e) => updateVehicle(index, 'car_type', e.target.value)}
                                            >
                                                <MenuItem value="standard">Standard Ride</MenuItem>
                                                <MenuItem value="premium">Premium Ride</MenuItem>
                                                <MenuItem value="suv">SUV / Large</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Year"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                                value={vehicle.car_year ?? new Date().getFullYear()}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    updateVehicle(index, 'car_year', isNaN(val) ? new Date().getFullYear() : val);
                                                }}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
                                                        sx: { fontWeight: 700 }
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            <TextField
                                                fullWidth
                                                label="Registration Number"
                                                placeholder="Plate #"
                                                variant="outlined"
                                                size="small"
                                                value={vehicle.registration_number}
                                                onChange={(e) => updateVehicle(index, 'registration_number', e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: <InputAdornment position="start"><HashIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
                                                        sx: { fontWeight: 800, fontFamily: 'monospace' }
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <CarIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.2, mb: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>No vehicles registered.</Typography>
                        <Typography variant="caption" color="text.disabled">Click "Add Vehicle" to start.</Typography>
                    </Box>
                )}

                <Alert
                    severity="info"
                    icon={<SettingsIcon fontSize="small" />}
                    sx={{ mt: 4, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.dark' }}>
                        Standard: Every day. Premium: Luxury. SUV: 6+ passengers. All verified by admin.
                    </Typography>
                </Alert>
            </Box>

            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: alpha(theme.palette.divider, 0.08), display: 'flex', justifyContent: 'flex-end', bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                <Button
                    variant="contained"
                    size="large"
                    disabled={saving}
                    onClick={handleSave}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        px: 4,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    {saving ? "Saving changes..." : "Submit for Approval"}
                </Button>
            </Box>
        </Paper>
    );
};

export default VehicleManagement;
