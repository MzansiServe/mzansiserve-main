import { useState, useEffect } from "react";
import {
    Box, Typography, TextField, Button, Grid, Paper, Divider, Stack, Switch, FormControlLabel,
    Chip, Autocomplete, CircularProgress, Alert
} from "@mui/material";
import { Delete as DeleteIcon, Save as SaveIcon, CameraAlt as CameraIcon, InfoOutlined as InfoIcon } from "@mui/icons-material";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SOUTH_AFRICAN_AREAS = [
    "Sandton, Johannesburg", "Rosebank, Johannesburg", "Midrand, Johannesburg", "Randburg, Johannesburg",
    "Soweto, Johannesburg", "Pretoria Central", "Centurion, Pretoria", "Hatfield, Pretoria",
    "Cape Town City Bowl", "Sea Point, Cape Town", "Claremont, Cape Town", "Bellville, Cape Town",
    "Umhlanga, Durban", "Durban Central", "Pinetown, Durban", "Gqeberha Central", "Bloemfontein Central"
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const ProfileSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Form fields
    const [phone, setPhone] = useState("");
    const [nextOfKin, setNextOfKin] = useState({ full_name: "", contact_number: "", contact_email: "" });
    const [operatingAreas, setOperatingAreas] = useState<string[]>([]);
    const [availability, setAvailability] = useState<any>({
        regular_hours: DAYS_OF_WEEK.reduce((acc: any, day) => {
            acc[day] = { enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day), start: "08:00", end: "17:00" };
            return acc;
        }, {}),
        blocked_dates: []
    });

    // UI State
    const [blockedDateInput, setBlockedDateInput] = useState<string>("");

    const fetchProfile = async () => {
        setFetching(true);
        try {
            const res = await apiFetch("/api/profile");
            if (res.success) {
                setUserProfile(res.data);
                const data = res.data.profile_data || {};

                setPhone(data.phone || "");
                if (data.next_of_kin) {
                    setNextOfKin({
                        full_name: data.next_of_kin.full_name || "",
                        contact_number: data.next_of_kin.contact_number || "",
                        contact_email: data.next_of_kin.contact_email || ""
                    });
                }

                if (data.operating_areas) setOperatingAreas(data.operating_areas);
                if (data.availability) setAvailability(data.availability);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const user = userProfile?.user || {};
    const pendingUpdate = userProfile?.pending_profile_update;
    const isProvider = ['service-provider', 'professional', 'driver'].includes(user.role);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatePayload: any = {
                phone,
                next_of_kin: nextOfKin
            };

            if (isProvider) {
                updatePayload.operating_areas = operatingAreas;
                updatePayload.availability = availability;
            }

            const res = await apiFetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify(updatePayload)
            });

            if (res.success) {
                toast({ title: "Success", description: "Profile updates submitted." });
                fetchProfile();
            } else {
                toast({ title: "Update Failed", description: res.message, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Something went wrong.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (day: string) => {
        setAvailability((prev: any) => ({
            ...prev,
            regular_hours: {
                ...prev.regular_hours,
                [day]: { ...prev.regular_hours[day], enabled: !prev.regular_hours[day]?.enabled }
            }
        }));
    };

    const handleTimeChange = (day: string, type: 'start' | 'end', timeStr: string) => {
        setAvailability((prev: any) => ({
            ...prev,
            regular_hours: {
                ...prev.regular_hours,
                [day]: { ...prev.regular_hours[day], [type]: timeStr }
            }
        }));
    };

    const addBlockedDate = () => {
        if (!blockedDateInput) return;
        const dateStr = blockedDateInput;
        if (!availability.blocked_dates?.includes(dateStr)) {
            setAvailability((prev: any) => ({
                ...prev,
                blocked_dates: [...(prev.blocked_dates || []), dateStr]
            }));
        }
        setBlockedDateInput("");
    };

    const removeBlockedDate = (dateStr: string) => {
        setAvailability((prev: any) => ({
            ...prev,
            blocked_dates: prev.blocked_dates.filter((d: string) => d !== dateStr)
        }));
    };

    if (fetching) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
            {pendingUpdate && (
                <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 4, borderRadius: 2 }}>
                    You have a pending profile update that is waiting for admin approval. Some changes may not be visible until approved.
                </Alert>
            )}

            <Typography variant="h5" fontWeight={800} mb={3}>Profile Settings</Typography>

            <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }} variant="outlined">
                <Typography variant="h6" fontWeight={700} mb={3}>Personal Information</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Email Address" value={user.email} disabled size="small" helperText="Email cannot be changed directly." />
                    </Grid>
                </Grid>
                <Divider sx={{ my: 4 }} />
                <Typography variant="h6" fontWeight={700} mb={3}>Next of Kin</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Full Name" value={nextOfKin.full_name} onChange={(e) => setNextOfKin({ ...nextOfKin, full_name: e.target.value })} size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Contact Number" value={nextOfKin.contact_number} onChange={(e) => setNextOfKin({ ...nextOfKin, contact_number: e.target.value })} size="small" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Email Address" value={nextOfKin.contact_email} onChange={(e) => setNextOfKin({ ...nextOfKin, contact_email: e.target.value })} size="small" />
                    </Grid>
                </Grid>
            </Paper>

            {isProvider && (
                <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }} variant="outlined">
                    <Typography variant="h6" fontWeight={700} mb={1}>Operating Areas</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>Select up to 5 areas where you provide services.</Typography>
                    <Autocomplete
                        multiple
                        limitTags={3}
                        options={SOUTH_AFRICAN_AREAS}
                        freeSolo
                        value={operatingAreas}
                        onChange={(e, newValue) => {
                            if (newValue.length <= 5) setOperatingAreas(newValue);
                            else toast({ title: "Limit Reached", description: "You can only select up to 5 operating areas." });
                        }}
                        renderInput={(params) => (
                            <TextField {...params} variant="outlined" label="Search or add areas..." placeholder="e.g. Sandton" size="small" />
                        )}
                        renderTags={(value: readonly string[], getTagProps) =>
                            value.map((option: string, index: number) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return <Chip variant="outlined" label={option} key={key} {...tagProps} color="primary" />;
                            })
                        }
                    />

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" fontWeight={700} mb={1}>Availability Calendar</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>Set your regular working hours and block out specific dates when you are unavailable.</Typography>

                    <Typography variant="subtitle2" fontWeight={700} mb={2} color="primary">Regular Weekly Hours</Typography>
                    <Stack spacing={2} mb={4}>
                        {DAYS_OF_WEEK.map((day) => {
                            const dayConfig = availability?.regular_hours?.[day] || { enabled: false, start: '08:00', end: '17:00' };
                            return (
                                <Box key={day} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', p: 1.5, bgcolor: 'slate.50', borderRadius: 2 }}>
                                    <Box sx={{ width: 120 }}>
                                        <FormControlLabel
                                            control={<Switch checked={dayConfig.enabled} onChange={() => handleDayToggle(day)} color="primary" />}
                                            label={<Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{day}</Typography>}
                                        />
                                    </Box>
                                    {dayConfig.enabled ? (
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <TextField
                                                type="time"
                                                size="small"
                                                value={dayConfig.start}
                                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                                inputProps={{ step: 1800 }} // 30 min steps
                                            />
                                            <Typography color="text.secondary">to</Typography>
                                            <TextField
                                                type="time"
                                                size="small"
                                                value={dayConfig.end}
                                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                                inputProps={{ step: 1800 }}
                                            />
                                        </Stack>
                                    ) : (
                                        <Typography color="text.disabled" variant="body2" sx={{ fontStyle: 'italic' }}>Closed</Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>

                    <Typography variant="subtitle2" fontWeight={700} mb={2} color="error">Blocked Dates (Unavailable)</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                        <TextField
                            type="date"
                            size="small"
                            value={blockedDateInput}
                            onChange={(e) => setBlockedDateInput(e.target.value)}
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                            sx={{ width: 200 }}
                        />
                        <Button variant="outlined" color="error" onClick={addBlockedDate} disabled={!blockedDateInput}>
                            Block Date
                        </Button>
                    </Stack>

                    {availability?.blocked_dates?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {availability.blocked_dates.map((dateStr: string) => (
                                <Chip
                                    key={dateStr}
                                    label={new Date(dateStr).toLocaleDateString()}
                                    onDelete={() => removeBlockedDate(dateStr)}
                                    color="error"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    )}
                </Paper>
            )}

            <Box display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                    Save Settings
                </Button>
            </Box>
        </Box>
    );
};
