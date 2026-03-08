import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface AdBannerProps {
    placementSection: "homepage_hero" | "shop_directory" | "marketplace_sidebar";
    className?: string;
}

export const AdBanner = ({ placementSection, className }: AdBannerProps) => {
    const [ads, setAds] = useState<any[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const res = await apiFetch(`/api/ads/active?placement_section=${placementSection}`);
                if (res.success && res.data.length > 0) {
                    setAds(res.data);
                }
            } catch (err) {
                console.error("Failed to load ads", err);
            }
        };
        fetchAds();
    }, [placementSection]);

    useEffect(() => {
        if (ads.length > 1) {
            const interval = setInterval(() => {
                setCurrentAdIndex((prev) => (prev + 1) % ads.length);
            }, 8000); // rotate every 8 seconds
            return () => clearInterval(interval);
        }
    }, [ads.length]);

    if (ads.length === 0) return null;

    const currentAd = ads[currentAdIndex];

    const handleClick = async () => {
        try {
            const res = await apiFetch(`/api/ads/${currentAd.id}/click`, { method: "POST" });
            if (res.success && res.data.target_url) {
                window.open(res.data.target_url, "_blank");
            } else if (currentAd.target_url) {
                window.open(currentAd.target_url, "_blank");
            }
        } catch (err) {
            if (currentAd.target_url) {
                window.open(currentAd.target_url, "_blank");
            }
        }
    };

    return (
        <Box
            className={`cursor-pointer overflow-hidden relative group rounded-2xl ${className || ''}`}
            onClick={handleClick}
            sx={{
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }
            }}
        >
            <AnimatePresence mode="wait">
                <motion.img
                    key={currentAd.id}
                    src={currentAd.image_url}
                    alt={currentAd.title || "Advertisement"}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e: any) => e.target.style.display = 'none'}
                />
            </AnimatePresence>
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    px: 1,
                    py: 0.2,
                    borderRadius: 1,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    letterSpacing: 0.5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    opacity: 0.8,
                    transition: 'opacity 0.2s',
                    '.group:hover &': { opacity: 1 }
                }}
            >
                Ad
            </Box>
        </Box>
    );
};
