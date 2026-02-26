import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Stack,
    IconButton,
    Chip,
    alpha,
    useTheme,
    CircularProgress,
    Badge,
    Grid
} from "@mui/material";
import {
    ForumOutlined as ChatIcon,
    ChevronRight as ChevronRightIcon,
    Person as UserIcon,
    WorkOutline as JobIcon
} from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { ChatOverlay } from "../ChatOverlay";

interface InboxThread {
    request_id: string;
    job_title: string;
    status: string;
    other_user: {
        id: string;
        name: string;
        avatar?: string;
    } | null;
    latest_message: {
        message: string;
        sender_id: string;
        created_at: string;
    } | null;
    unread_count: number;
    updated_at: string;
}

export const MessagesInbox = () => {
    const { toast } = useToast();
    const theme = useTheme();
    const [threads, setThreads] = useState<InboxThread[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<{ id: string, name: string } | null>(null);

    const fetchInbox = useCallback(async () => {
        try {
            const res = await apiFetch('/api/chat/inbox');
            if (res.success) {
                setThreads(res.data);
            }
        } catch (err: any) {
            toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    const handleChatClose = () => {
        setSelectedChat(null);
        fetchInbox(); // Refresh to update unread counts and latest messages
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', borderColor: alpha(theme.palette.divider, 0.08) }}>
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5), borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.08), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                            <ChatIcon fontSize="small" />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Messages</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Chat with clients and manage inquiries.</Typography>
                        </Box>
                    </Stack>
                    {(threads.reduce((acc, t) => acc + t.unread_count, 0) > 0) && (
                        <Chip
                            label={`${threads.reduce((acc, t) => acc + t.unread_count, 0)} Unread`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: 'error.main', color: 'white' }}
                        />
                    )}
                </Box>

                <Box>
                    {threads.length > 0 ? (
                        threads.map((thread, index) => (
                            <Box
                                key={thread.request_id}
                                onClick={() => setSelectedChat({ id: thread.request_id, name: thread.other_user?.name || "Client" })}
                                sx={{
                                    p: 3,
                                    borderBottom: index === threads.length - 1 ? 'none' : '1px solid',
                                    borderColor: alpha(theme.palette.divider, 0.05),
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    bgcolor: thread.unread_count > 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) }
                                }}
                            >
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Badge badgeContent={thread.unread_count} color="error" overlap="circular">
                                                <Avatar src={thread.other_user?.avatar} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800, width: 48, height: 48, border: '2px solid', borderColor: 'background.paper' }}>
                                                    {thread.other_user?.name?.charAt(0) || <UserIcon />}
                                                </Avatar>
                                            </Badge>
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: thread.unread_count > 0 ? 800 : 700 }} noWrap>
                                                    {thread.other_user?.name || "Unknown User"}
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                    <JobIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }} noWrap>
                                                        {thread.job_title}
                                                    </Typography>
                                                    <Chip label={thread.status} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, textTransform: 'capitalize' }} />
                                                </Stack>
                                                <Typography variant="body2" color={thread.unread_count > 0 ? "text.primary" : "text.secondary"} sx={{ fontWeight: thread.unread_count > 0 ? 600 : 400 }} noWrap>
                                                    {thread.latest_message ? thread.latest_message.message : "Started a new conversation..."}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { xs: 'left', sm: 'right' }, pl: { xs: 7.5, sm: 0 } }}>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                            {new Date(thread.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <IconButton size="small" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                                <ChevronRightIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ py: 10, textAlign: 'center' }}>
                            <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.2, mb: 2 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>No messages yet.</Typography>
                            <Typography variant="caption" color="text.disabled">When clients contact you, their messages will appear here.</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            {selectedChat && (
                <ChatOverlay
                    requestId={selectedChat.id}
                    recipientName={selectedChat.name}
                    isOpen={!!selectedChat}
                    onClose={handleChatClose}
                />
            )}
        </>
    );
};
