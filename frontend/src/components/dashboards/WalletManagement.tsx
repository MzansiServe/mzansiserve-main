import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    InputAdornment,
    Divider,
    alpha,
    useTheme,
    Grid,
    Avatar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress
} from "@mui/material";
import {
    AccountBalanceWallet as WalletIcon,
    NorthEast as ArrowUpIcon,
    SouthWest as ArrowDownIcon,
    History as HistoryIcon,
    FileDownload as DownloadIcon,
    InfoOutlined as InfoIcon
} from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Transaction {
    id: string;
    transaction_type: 'top-up' | 'payment' | 'withdrawal' | 'credit' | 'debit';
    amount: number;
    status: string;
    created_at: string;
    description: string;
}

interface WalletManagementProps {
    balance: number;
    transactions: Transaction[];
    role: 'driver' | 'professional' | 'service-provider';
    onWithdrawalRequested: () => void;
}

export const WalletManagement = ({ balance, transactions, role, onWithdrawalRequested }: WalletManagementProps) => {
    const { toast } = useToast();
    const theme = useTheme();
    const [withdrawalAmount, setWithdrawalAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleWithdrawalRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawalAmount);

        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
            return;
        }

        if (amount > balance) {
            toast({ title: "Insufficient balance", description: `Your current balance is R${balance.toFixed(2)}.`, variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch('/api/dashboard/wallet/withdrawal-request', {
                method: 'POST',
                data: { amount }
            });

            if (res.success) {
                toast({ title: "Request Submitted", description: `Your withdrawal request for R${amount.toFixed(2)} is being processed.` });
                setWithdrawalAmount("");
                onWithdrawalRequested();
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Grid container spacing={3}>
            {/* Wallet Summary & Withdrawal Form */}
            <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            borderColor: alpha(theme.palette.divider, 0.08),
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, #ffffff 100%)`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ position: 'absolute', right: -40, bottom: -40, width: 160, height: 160, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: '50%' }} />

                        <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 48, height: 48, borderRadius: 2 }}>
                                <WalletIcon />
                            </Avatar>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.1em' }}>
                                    Available Balance
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5 }}>
                                    R {balance.toFixed(2)}
                                </Typography>
                            </Box>

                            <Divider sx={{ borderStyle: 'dashed' }} />

                            <form onSubmit={handleWithdrawalRequest}>
                                <Stack spacing={2}>
                                    <TextField
                                        fullWidth
                                        label="Withdrawal Amount"
                                        type="number"
                                        size="small"
                                        placeholder="0.00"
                                        value={withdrawalAmount}
                                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700 }}>R</Typography></InputAdornment>,
                                                sx: { fontWeight: 800, bgcolor: 'background.paper' }
                                            }
                                        }}
                                    />
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={isSubmitting || balance <= 0}
                                        sx={{
                                            fontWeight: 800,
                                            borderRadius: 2,
                                            py: 1.2,
                                            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                                        }}
                                    >
                                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Request Payout"}
                                    </Button>
                                </Stack>
                            </form>
                        </Stack>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#121926', color: 'white' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <InfoIcon sx={{ color: 'primary.main' }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Payout Processing</Typography>
                                <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), lineHeight: 1.5 }}>
                                    Requests are verified and settled within 24-48 business hours. Standard bank rates apply to all outgoing transfers.
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Stack>
            </Grid>

            {/* Transaction History */}
            <Grid size={{ xs: 12, lg: 8 }}>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', borderColor: alpha(theme.palette.divider, 0.08), height: '100%' }}>
                    <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.08) }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha(theme.palette.action.hover, 0.04), color: 'text.secondary', width: 36, height: 36 }}>
                                <HistoryIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Transaction Registry</Typography>
                        </Stack>
                        <Button size="small" startIcon={<DownloadIcon />} sx={{ fontWeight: 700 }}>Export</Button>
                    </Box>

                    <TableContainer>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Details</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => {
                                        const isCredit = tx.transaction_type === 'credit' || tx.transaction_type === 'payment' || tx.transaction_type === 'top-up';
                                        return (
                                            <TableRow key={tx.id} hover>
                                                <TableCell>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: isCredit ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                                            color: isCredit ? 'success.main' : 'error.main'
                                                        }}
                                                    >
                                                        {isCredit ? <ArrowDownIcon sx={{ fontSize: 16 }} /> : <ArrowUpIcon sx={{ fontSize: 16 }} />}
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                                        {tx.transaction_type.replace('-', ' ')}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                                                        {tx.description || `REF: ${tx.id.slice(-8).toUpperCase()}`}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isCredit ? 'success.main' : 'error.main' }}>
                                                        {isCredit ? '+' : '-'} R {Number(tx.amount).toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={tx.status}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.6rem',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            borderRadius: 1,
                                                            bgcolor: tx.status === 'completed' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                                                            color: tx.status === 'completed' ? 'success.dark' : 'warning.dark'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No financial activity recorded.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default WalletManagement;
